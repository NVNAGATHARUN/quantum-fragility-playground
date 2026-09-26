"""FastAPI Application Entrypoint for Quantum Lens AI.

Provides REST API endpoints for verified Qiskit simulation and Kraus noise modeling.
"""

import os

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from pydantic import BaseModel, Field

from .models.circuit_ir import (
    CircuitIR,
    SimulateRequest,
    NormalizedSimulationResult,
    FragilityRequest,
)
from .quantum.simulator import simulate_circuit
from .quantum.fragility import simulate_fragility
from .pedagogy.evaluator import (
    PredictionRequest,
    CognitiveDeltaResponse,
    evaluate_cognitive_delta,
)
from .pedagogy.what_changed import (
    WhatChangedResponse,
    compare_circuits,
)
from .pedagogy.misconceptions import (
    get_conflict_lab,
    ConflictLabScenario,
)
from .pedagogy.analytics import (
    compute_session_analytics,
    AnalyticsSession,
)
from .ai.mentor import (
    MentorRequest,
    MentorResponse,
    ask_mentor,
)
from .quantum.capabilities import probe_system_capabilities, SystemCapabilitiesResponse
from .quantum.grover import run_grover
from .quantum.algorithms import (
    run_bell_state,
    run_deutsch_jozsa,
    run_teleportation,
    run_qft,
    run_bb84,
    run_entanglement_swapping,
)
from .quantum.qaoa import run_qaoa
from .quantum.vqe import run_vqe


from contextlib import asynccontextmanager
from .db.session import init_db
from .auth.router import router as auth_router
from .routes.classrooms import router as classrooms_router
from .routes.circuits import router as circuits_router
from .routes.progress import router as progress_router
from .routes.learn import router as learn_router
from .routes.circuit_ir import router as circuit_ir_router
from .routes.challenges import router as challenges_router
from .routes.guided_labs import router as guided_labs_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is initialized
    await init_db()
    yield


app = FastAPI(
    title="Quantum Lens AI API",
    description="Adaptive Quantum Learning Platform Simulation Kernel",
    version="2.0.0",
    lifespan=lifespan,
)

# Register routers
app.include_router(auth_router)
app.include_router(classrooms_router)
app.include_router(circuits_router)
app.include_router(progress_router)
app.include_router(learn_router)
app.include_router(circuit_ir_router)
app.include_router(challenges_router)
app.include_router(guided_labs_router)



# CORS configuration. Production origins are supplied as a comma-separated
# environment variable instead of requiring a source-code edit.
default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4000",
    "http://127.0.0.1:4000",
    "https://qfp.vercel.app",
]
allowed_origins = [
    origin.strip()
    for origin in os.getenv("QL_ALLOWED_ORIGINS", ",".join(default_origins)).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response


app.add_middleware(SecurityHeadersMiddleware)


@app.get("/health")
def health_check():
    return {
        "status": "online",
        "platform": "Quantum Lens AI",
        "kernel": "Qiskit Aer",
        "version": "3.0.0",
    }


@app.get("/api/v1/system/capabilities", response_model=SystemCapabilitiesResponse)
def get_system_capabilities():
    """
    Returns runtime-verified availability of all quantum simulation frameworks.
    Results are produced by real self-tests (executing trivial 1-qubit circuits),
    not by package presence detection or hardcoded values.
    """
    return probe_system_capabilities()


def enforce_circuit_budget(circuit: CircuitIR) -> None:
    """Reject statevector requests that can exhaust a shared teaching server."""
    if circuit.qubits > 16:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="Interactive simulation is limited to 16 qubits. Reduce the circuit or use an external backend.",
        )
    if len(circuit.operations) > 500:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="Interactive simulation is limited to 500 operations per request.",
        )


@app.post("/api/v1/quantum/simulate", response_model=NormalizedSimulationResult)
def run_simulation(req: SimulateRequest):
    enforce_circuit_budget(req.circuit)
    try:
        result = simulate_circuit(req.circuit, shots=req.shots)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation Kernel Error: {str(e)}",
        )


# ─── Phase 5: Multi-Engine Parity Check ──────────────────────────────────────

class ParityRequest(BaseModel):
    circuit: "CircuitIR"
    shots: int = Field(default=1024, ge=1, le=10000)
    tolerance: float = Field(default=0.01, ge=0.0, le=1.0)   # Maximum allowed TVD between frameworks


@app.post("/api/v1/quantum/parity")
def run_cross_framework_parity(req: ParityRequest):
    """Phase 5 — Cross-Framework Simulation Parity Verification.

    Runs the same CircuitIR on every available quantum framework and asserts
    that measurement probabilities agree within the specified tolerance.

    Frameworks attempted (in order of precedence):
    - Qiskit Aer (always primary; raises if unavailable)
    - PennyLane (probed at runtime; skipped if not installed)
    - Cirq (probed at runtime; skipped if not installed)

    The parity assertion computes the Total Variation Distance between each
    pair of probability distributions and flags disagreement when TVD > tolerance.
    """
    enforce_circuit_budget(req.circuit)
    from .quantum.capabilities import probe_system_capabilities
    from .quantum.simulator import simulate_circuit as qiskit_simulate

    caps = probe_system_capabilities()
    results: dict = {"circuits": {}, "parity_checks": [], "all_pass": True}

    # ── Qiskit (primary, mandatory) ──
    try:
        qk_result = qiskit_simulate(req.circuit, shots=req.shots)
        results["circuits"]["qiskit"] = {
            "status": "success",
            "probabilities": qk_result.probabilities,
            "backend": "qiskit-aer",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Qiskit Aer simulation failed (required): {str(e)}",
        )

    # ── PennyLane (optional) ──
    pl_cap = caps.frameworks.get("pennylane")
    if pl_cap and pl_cap.status == "available":
        try:
            from .quantum.pennylane_adapter import simulate_pennylane_probabilities
            from .circuit.ir import CircuitIR as _IR
            pure_ir = _IR(
                schemaVersion=req.circuit.schemaVersion,
                qubits=req.circuit.qubits,
                classicalBits=req.circuit.classicalBits,
                operations=[op for op in req.circuit.operations if op.gate not in ("MEASURE", "RESET")],
            )
            pl_probs = simulate_pennylane_probabilities(pure_ir)

            results["circuits"]["pennylane"] = {
                "status": "success",
                "probabilities": pl_probs,
                "backend": "pennylane-default.qubit",
            }

            # Parity check vs Qiskit
            qk_probs = qk_result.probabilities
            tvd = 0.5 * sum(
                abs(qk_probs.get(k, 0.0) - pl_probs.get(k, 0.0))
                for k in set(list(qk_probs.keys()) + list(pl_probs.keys()))
            )
            parity_pass = tvd <= req.tolerance
            if not parity_pass:
                results["all_pass"] = False

            results["parity_checks"].append({
                "framework_a": "qiskit",
                "framework_b": "pennylane",
                "tvd": round(tvd, 6),
                "tolerance": req.tolerance,
                "pass": parity_pass,
            })

        except Exception as e:
            results["circuits"]["pennylane"] = {
                "status": "error",
                "error": str(e),
            }

    # ── Cirq (optional) ──
    cirq_cap = caps.frameworks.get("cirq")
    if cirq_cap and cirq_cap.status == "available":
        try:
            from .quantum.cirq_adapter import simulate_cirq_probabilities
            from .circuit.ir import CircuitIR as _IR2

            pure_ir2 = _IR2(
                schemaVersion=req.circuit.schemaVersion,
                qubits=req.circuit.qubits,
                classicalBits=req.circuit.classicalBits,
                operations=[
                    op for op in req.circuit.operations
                    if op.gate not in ("MEASURE", "RESET")
                ],
            )
            cirq_probs = simulate_cirq_probabilities(pure_ir2)

            results["circuits"]["cirq"] = {
                "status": "success",
                "probabilities": cirq_probs,
                "backend": "cirq.Simulator",
            }

            qk_probs = qk_result.probabilities
            tvd = 0.5 * sum(
                abs(qk_probs.get(k, 0.0) - cirq_probs.get(k, 0.0))
                for k in set(list(qk_probs.keys()) + list(cirq_probs.keys()))
            )
            parity_pass = tvd <= req.tolerance
            if not parity_pass:
                results["all_pass"] = False

            results["parity_checks"].append({
                "framework_a": "qiskit",
                "framework_b": "cirq",
                "tvd": round(tvd, 6),
                "tolerance": req.tolerance,
                "pass": parity_pass,
            })

        except Exception as e:
            results["circuits"]["cirq"] = {
                "status": "error",
                "error": str(e),
            }

    return results


@app.post("/api/v1/quantum/fragility")
def run_fragility(req: FragilityRequest):
    enforce_circuit_budget(req.circuit)
    try:
        result = simulate_fragility(req)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fragility Engine Error: {str(e)}",
        )


class WhatChangedRequest(BaseModel):
    circuitA: CircuitIR
    circuitB: CircuitIR


@app.post("/api/v1/pedagogy/predict", response_model=CognitiveDeltaResponse)
def evaluate_prediction(req: PredictionRequest):
    try:
        return evaluate_cognitive_delta(req)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pedagogy Evaluator Error: {str(e)}",
        )


@app.post("/api/v1/pedagogy/what-changed", response_model=WhatChangedResponse)
def run_what_changed(req: WhatChangedRequest):
    try:
        return compare_circuits(req.circuitA, req.circuitB)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"What Changed Engine Error: {str(e)}",
        )


@app.get("/api/v1/pedagogy/conflict-lab/{lab_id}", response_model=ConflictLabScenario)
def fetch_conflict_lab(lab_id: str):
    lab = get_conflict_lab(lab_id)
    if not lab:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cognitive Conflict Lab '{lab_id}' not found.",
        )
    return lab


# ─── Phase 10: Misconception Catalog ────────────────────────────────────────

from .pedagogy.misconceptions import MISCONCEPTION_CATALOG


@app.get("/api/v1/pedagogy/misconceptions")
def list_misconceptions():
    """Returns full MISCONCEPTION_CATALOG (M01–M05) with scientific truth & conflict lab IDs."""
    return {
        "misconceptions": [v.model_dump() for v in MISCONCEPTION_CATALOG.values()],
        "total": len(MISCONCEPTION_CATALOG),
    }


# ─── Phase 10: Mastery Model v2 (Bayesian Knowledge Tracing) ─────────────────

from .pedagogy.mastery import (
    get_session_model,
    reset_session_model,
    MasteryModelV2,
)
from pydantic import BaseModel as _BM
from typing import Optional as _Opt, List as _Lst


class MasteryRecordRequest(_BM):
    conceptKey: str
    isCorrect: bool
    misconceptionFlags: _Lst[str] = []
    cognitiveDeltaTvd: _Opt[float] = None


@app.post("/api/v1/pedagogy/mastery/record")
def record_mastery_attempt(req: MasteryRecordRequest):
    """BKT update — call after every verified simulation attempt with the learner's concept key and correctness.
    Optionally pass detected misconception flags and the TVD to allow severity weighting."""
    model = get_session_model()
    node = model.record_attempt(
        concept_key=req.conceptKey,
        is_correct=req.isCorrect,
        misconception_flags=req.misconceptionFlags,
        cognitive_delta_tvd=req.cognitiveDeltaTvd,
    )
    return {
        "updated": node.to_dict(),
        "snapshot": model.snapshot(),
        "masteredConcepts": model.mastered_concepts(),
        "weakestConcept": model.weakest_concept(),
    }


@app.get("/api/v1/pedagogy/mastery/snapshot")
def get_mastery_snapshot():
    """Returns current session Bayesian mastery state for all engaged concepts."""
    model = get_session_model()
    return {
        "snapshot": model.snapshot(),
        "masteredConcepts": model.mastered_concepts(),
        "weakestConcept": model.weakest_concept(),
    }


@app.post("/api/v1/pedagogy/mastery/reset")
def reset_mastery():
    """Resets the in-process session mastery model to zero (empty) state."""
    reset_session_model()
    return {"status": "reset", "message": "Mastery model cleared — all priors reset to P(know) = 0.10."}


@app.post("/api/v1/ai/mentor", response_model=MentorResponse)
def mentor_guidance(req: MentorRequest):
    try:
        return ask_mentor(req)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Mentor Engine Error: {str(e)}",
        )


@app.get("/api/v1/analytics/session", response_model=AnalyticsSession)
def get_analytics_session():
    """Run the legacy canonical-circuit benchmark.

    This endpoint is not learner mastery or cohort evidence. Authoritative
    learner analytics live under /api/v1/progress and instructor classroom
    routes, where they are derived from persisted graded attempts.
    """
    try:
        return compute_session_analytics()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analytics Engine Error: {str(e)}",
        )


# ─── Grover's Algorithm Endpoint ─────────────────────────────────────────────

class GroverRequest(BaseModel):
    n_qubits: int = 2
    target_state: str = "11"
    shots: int = 1024


@app.post("/api/v1/algorithms/grover")
def run_grover_algorithm(req: GroverRequest):
    """Runs Grover's amplitude amplification and returns per-iteration snapshots.

    Every amplitude value is derived from exact Qiskit Statevector computation.
    No fake data — directly corrects Misconception M06 with verified quantum math.
    """
    try:
        result = run_grover(
            n_qubits=req.n_qubits,
            target_state=req.target_state,
            shots=req.shots,
        )
        return {
            "n_qubits": result.n_qubits,
            "target_state": result.target_state,
            "optimal_iterations": result.optimal_iterations,
            "amplitude_snapshots": [
                [amp.model_dump() for amp in snapshot]
                for snapshot in result.amplitude_snapshots
            ],
            "final_probabilities": result.final_probabilities,
            "counts": result.counts,
            "circuit_ir": result.circuit_ir.model_dump(),
            "execution_time_ms": result.execution_time_ms,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Grover Engine Error: {str(e)}",
        )


# ─── Bell State Preparation & Analysis (AL-01) ────────────────────────────────

class BellStateRequest(BaseModel):
    bell_state: str = "phi_plus"   # 'phi_plus' | 'phi_minus' | 'psi_plus' | 'psi_minus'
    shots: int = 1024
    measurement_basis: str = "Z"
    noise_percent: float = 0


@app.post("/api/v1/algorithms/bell-state")
def run_bell_state_algorithm(req: BellStateRequest):
    """Bell State: prepares and analyzes maximally entangled two-qubit states.

    Computes subsystem purity, von Neumann entanglement entropy, and correlations.
    """
    try:
        result = run_bell_state(
            bell_state=req.bell_state,
            shots=req.shots,
            measurement_basis=req.measurement_basis,
            noise_percent=req.noise_percent,
        )
        return {
            "bell_state": result.bell_state,
            "state_label": result.state_label,
            "counts": result.counts,
            "probabilities": result.probabilities,
            "statevector": result.statevector,
            "entanglement_entropy": result.entanglement_entropy,
            "purity": result.purity,
            "correlation_zz": result.correlation_zz,
            "correlation_xx": result.correlation_xx,
            "correlation_yy": result.correlation_yy,
            "fidelity": result.fidelity,
            "measurement_basis": result.measurement_basis,
            "noise_percent": result.noise_percent,
            "circuit_depth": result.circuit_depth,
            "execution_time_ms": result.execution_time_ms,
            "explanation": result.explanation,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bell State Engine Error: {str(e)}",
        )


# ─── Deutsch-Jozsa Algorithm (AL-02) ─────────────────────────────────────────

class DeutschJozsaRequest(BaseModel):
    oracle_type: str = "balanced"   # 'constant_0' | 'constant_1' | 'balanced'
    n_qubits: int = 2
    shots: int = 1024


@app.post("/api/v1/algorithms/deutsch-jozsa")
def run_deutsch_jozsa_algorithm(req: DeutschJozsaRequest):
    """Deutsch-Jozsa: determines constant vs balanced oracle in ONE query.

    Every amplitude is derived from Qiskit Statevector computation.
    Directly proves quantum exponential advantage over classical deterministic algorithms.
    """
    try:
        result = run_deutsch_jozsa(
            oracle_type=req.oracle_type,
            n_qubits=req.n_qubits,
            shots=req.shots,
        )
        return {
            "oracle_type": result.oracle_type,
            "n_qubits": result.n_qubits,
            "result": result.result,
            "counts": result.counts,
            "probabilities": result.probabilities,
            "statevector": result.statevector,
            "circuit_depth": result.circuit_depth,
            "execution_time_ms": result.execution_time_ms,
            "explanation": result.explanation,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Deutsch-Jozsa Engine Error: {str(e)}",
        )


# ─── Quantum Teleportation (AL-04) ───────────────────────────────────────────

class TeleportationRequest(BaseModel):
    input_state: str = "plus"   # 'plus' | 'minus' | 'zero' | 'one'
    shots: int = 1024


@app.post("/api/v1/algorithms/teleportation")
def run_teleportation_algorithm(req: TeleportationRequest):
    """Quantum Teleportation: Bell pair + 2 classical bits transmit qubit state.

    Fidelity is measured and must be ≥ 0.99 to verify correctness.
    Proves no-cloning theorem: input qubit is destroyed during Alice's measurement.
    """
    try:
        result = run_teleportation(
            input_state=req.input_state,
            shots=req.shots,
        )
        return {
            "input_state": result.input_state,
            "fidelity": result.fidelity,
            "bob_counts": result.bob_counts,
            "bob_probabilities": result.bob_probabilities,
            "statevector_before_correction": result.statevector_before_correction,
            "statevector_after_correction": result.statevector_after_correction,
            "classical_bits": result.classical_bits,
            "circuit_depth": result.circuit_depth,
            "execution_time_ms": result.execution_time_ms,
            "explanation": result.explanation,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Teleportation Engine Error: {str(e)}",
        )


# ─── Quantum Fourier Transform (AL-05) ───────────────────────────────────────

class QFTRequest(BaseModel):
    n_qubits: int = 3
    input_basis_state: int = 0   # integer index of computational basis state
    shots: int = 1024


@app.post("/api/v1/algorithms/qft")
def run_qft_algorithm(req: QFTRequest):
    """Quantum Fourier Transform: maps computational basis to Fourier basis.

    Returns exact amplitude + phase for each output state from Qiskit Statevector.
    Demonstrates the phase structure exploited by Shor's algorithm.
    """
    try:
        result = run_qft(
            n_qubits=req.n_qubits,
            input_basis_state=req.input_basis_state,
            shots=req.shots,
        )
        return {
            "n_qubits": result.n_qubits,
            "input_state_desc": result.input_state_desc,
            "output_amplitudes": result.output_amplitudes,
            "counts": result.counts,
            "probabilities": result.probabilities,
            "circuit_depth": result.circuit_depth,
            "execution_time_ms": result.execution_time_ms,
            "explanation": result.explanation,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"QFT Engine Error: {str(e)}",
        )


# ─── Quantum Key Distribution: BB84 Protocol (AL-07) ─────────────────────────

class BB84Request(BaseModel):
    n_bits: int = 16
    eve_present: bool = False
    seed: int | None = None


@app.post("/api/v1/algorithms/qkd-bb84")
def run_bb84_algorithm(req: BB84Request):
    """BB84 Quantum Key Distribution: detects eavesdropping via state collapse.

    Calculates Quantum Bit Error Rate (QBER). An eavesdropper introduces ~25% error,
    exceeding the 11% Shor-Preskill limit and preventing undetected espionage.
    """
    try:
        result = run_bb84(
            n_bits=req.n_bits,
            eve_present=req.eve_present,
            seed=req.seed,
        )
        return {
            "n_bits": result.n_bits,
            "eve_present": result.eve_present,
            "alice_bits": result.alice_bits,
            "alice_bases": result.alice_bases,
            "bob_bases": result.bob_bases,
            "eve_bases": result.eve_bases,
            "eve_measured_bits": result.eve_measured_bits,
            "bob_measured_bits": result.bob_measured_bits,
            "sifted_indices": result.sifted_indices,
            "alice_sifted_key": result.alice_sifted_key,
            "bob_sifted_key": result.bob_sifted_key,
            "qber": result.qber,
            "is_secure": result.is_secure,
            "security_verdict": result.security_verdict,
            "final_key_hex": result.final_key_hex,
            "circuit_depth": result.circuit_depth,
            "execution_time_ms": result.execution_time_ms,
            "explanation": result.explanation,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"BB84 Engine Error: {str(e)}",
        )


# ─── AL-08: Quantum Network Repeater / Entanglement Swapping ─────────────────

class EntanglementSwappingRequest(BaseModel):
    distance_km: float = 100.0
    shots: int = 1024


@app.post("/api/v1/algorithms/entanglement-swapping")
def run_entanglement_swapping_endpoint(req: EntanglementSwappingRequest):
    """Quantum Repeater: Entanglement Swapping over long-haul fiber (AL-08).

    Simulates a 4-qubit BSM-based entanglement swap across two fiber segments.
    Returns Alice-Bob correlation, BSM outcome, fiber attenuation comparison
    (direct vs repeater-assisted), and fidelity metrics.
    """
    try:
        result = run_entanglement_swapping(
            distance_km=req.distance_km,
            shots=req.shots,
        )
        return {
            "distance_km": result.distance_km,
            "use_repeater": result.use_repeater,
            "bsm_outcome": result.bsm_outcome,
            "alice_bob_state_label": result.alice_bob_state_label,
            "direct_transmission_prob": result.direct_transmission_prob,
            "repeater_transmission_prob": result.repeater_transmission_prob,
            "fidelity": result.fidelity,
            "entanglement_entropy": result.entanglement_entropy,
            "subsystem_purity": result.subsystem_purity,
            "counts": result.counts,
            "probabilities": result.probabilities,
            "circuit_depth": result.circuit_depth,
            "execution_time_ms": result.execution_time_ms,
            "explanation": result.explanation,
            "model_provenance": result.model_provenance,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Entanglement Swapping Engine Error: {str(e)}",
        )


# ─── QAOA: Quantum Approximate Optimization Algorithm (AL-06) ────────────────

class QAOARequest(BaseModel):
    graph_type: str = "triangle_3"
    gamma: float = 0.6
    beta: float = 0.4
    p_steps: int = 1
    shots: int = 1024
    optimize: bool = False


@app.post("/api/v1/algorithms/qaoa")
def run_qaoa_endpoint(req: QAOARequest):
    """QAOA: Solves Max-Cut on benchmark graphs using alternating Hamiltonians."""
    try:
        result = run_qaoa(
            graph_type=req.graph_type,
            gamma=req.gamma,
            beta=req.beta,
            p_steps=req.p_steps,
            shots=req.shots,
            optimize=req.optimize,
        )
        return {
            "graph_type": result.graph_type,
            "graph_name": result.graph_name,
            "n_nodes": result.n_nodes,
            "edges": result.edges,
            "gamma": result.gamma,
            "beta": result.beta,
            "p_steps": result.p_steps,
            "expected_cut": result.expected_cut,
            "max_possible_cut": result.max_possible_cut,
            "approximation_ratio": result.approximation_ratio,
            "optimal_gamma": result.optimal_gamma,
            "optimal_beta": result.optimal_beta,
            "optimal_expected_cut": result.optimal_expected_cut,
            "probabilities": result.probabilities,
            "bitstring_cuts": result.bitstring_cuts,
            "best_bitstring": result.best_bitstring,
            "state_evolution_steps": result.state_evolution_steps,
            "landscape": result.landscape,
            "circuit_depth": result.circuit_depth,
            "execution_time_ms": result.execution_time_ms,
            "explanation": result.explanation,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"QAOA Engine Error: {str(e)}",
        )


# ─── VQE: Variational Quantum Eigensolver (AL-07) ───────────────────────────

class VQERequest(BaseModel):
    molecule: str = "H2"
    bond_distance: float = 0.74
    theta: float = 0.15
    optimize: bool = False
    shots: int = 1024


@app.post("/api/v1/algorithms/vqe")
def run_vqe_endpoint(req: VQERequest):
    """VQE: Evaluates molecular ground state potential energy surface of H2."""
    try:
        result = run_vqe(
            molecule=req.molecule,
            bond_distance=req.bond_distance,
            theta=req.theta,
            optimize=req.optimize,
            shots=req.shots,
        )
        return {
            "molecule": result.molecule,
            "bond_distance": result.bond_distance,
            "theta": result.theta,
            "optimal_theta": result.optimal_theta,
            "vqe_energy": result.vqe_energy,
            "optimal_vqe_energy": result.optimal_vqe_energy,
            "hartree_fock_energy": result.hartree_fock_energy,
            "exact_fci_energy": result.exact_fci_energy,
            "correlation_energy": result.correlation_energy,
            "error_mhartree": result.error_mhartree,
            "pauli_expectations": result.pauli_expectations,
            "hamiltonian_coeffs": result.hamiltonian_coeffs,
            "state_evolution_steps": result.state_evolution_steps,
            "dissociation_curve": result.dissociation_curve,
            "optimization_history": result.optimization_history,
            "circuit_depth": result.circuit_depth,
            "execution_time_ms": result.execution_time_ms,
            "explanation": result.explanation,
            "model_provenance": result.model_provenance,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"VQE Engine Error: {str(e)}",
        )

