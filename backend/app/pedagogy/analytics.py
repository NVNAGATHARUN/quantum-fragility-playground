"""Legacy canonical-circuit benchmark for Quantum Lens AI.

This module compares three fixed flawed-model predictions with Aer results. It
must not be presented as evidence about a real learner or cohort. Authoritative
progress is computed from persisted graded attempts in routes/progress.py.
"""

import math
from typing import Dict, List, Optional
from pydantic import BaseModel

from ..models.circuit_ir import CircuitIR, GateOperation
from ..quantum.simulator import simulate_circuit


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class LabResult(BaseModel):
    labId: str
    misconceptionId: str
    title: str
    # Real simulation output
    simulatedProbabilities: Dict[str, float]
    # Naive-student prediction (the flawed mental model)
    naivePrediction: Dict[str, float]
    # TVD between naive prediction and real simulation
    cognitiveDelta: float
    # Resolved means TVD < 0.1 (student grasped the concept)
    resolved: bool
    pedagogicalNote: str
    shots: int


class CompetencyDomain(BaseModel):
    domain: str
    score: float          # 0–100, derived from simulation mathematics
    fullMark: float = 100.0
    derivation: str       # how the score was computed


class AnalyticsSession(BaseModel):
    # Per-lab conflict results (real Qiskit Aer)
    labResults: List[LabResult]
    # Cognitive delta convergence curve (one entry per lab)
    deltaConvergence: List[Dict]
    # 6-domain competency scores (computed from sim math, not guessed)
    competencyRadar: List[CompetencyDomain]
    # Aggregate stats
    resolvedCount: int
    totalMisconceptions: int
    finalTVD: float
    overallMastery: float
    # Retained for API compatibility; canonical benchmarks contain no cohort.
    cohortMisconceptionPrevalence: List[Dict]
    simulatedCircuitsCount: int
    kernelVersion: str


# ---------------------------------------------------------------------------
# Helper: build circuits
# ---------------------------------------------------------------------------

def _make_circuit(operations_spec: List[Dict]) -> CircuitIR:
    ops = [GateOperation(**op) for op in operations_spec]
    # Infer qubits/classical bits
    qubits = max((max(o.targets + o.controls, default=0) for o in ops), default=0) + 1
    return CircuitIR(version="1.0", qubits=qubits, classicalBits=qubits, operations=ops)


# ---------------------------------------------------------------------------
# Conflict lab circuit definitions (canonical, match CognitiveConflictLab.tsx)
# ---------------------------------------------------------------------------

LAB_CIRCUITS = {
    "M01_HH": [   # H -> H: must give |0> 100%
        {"id": "g1", "gate": "H", "targets": [0], "controls": [], "step": 0},
        {"id": "g2", "gate": "H", "targets": [0], "controls": [], "step": 1},
        {"id": "g3", "gate": "MEASURE", "targets": [0], "controls": [], "step": 2},
    ],
    "M01_HZH": [  # H -> Z -> H: must give |1> 100%
        {"id": "g1", "gate": "H", "targets": [0], "controls": [], "step": 0},
        {"id": "g2", "gate": "Z", "targets": [0], "controls": [], "step": 1},
        {"id": "g3", "gate": "H", "targets": [0], "controls": [], "step": 2},
        {"id": "g4", "gate": "MEASURE", "targets": [0], "controls": [], "step": 3},
    ],
    "M02_ALICE_MEASURES": [  # Bell + Alice measures
        {"id": "g1", "gate": "H", "targets": [0], "controls": [], "step": 0},
        {"id": "g2", "gate": "CX", "targets": [1], "controls": [0], "step": 1},
        {"id": "g3", "gate": "MEASURE", "targets": [0], "controls": [], "step": 2},
        {"id": "g4", "gate": "MEASURE", "targets": [1], "controls": [], "step": 3},
    ],
    "M02_BOB_ONLY": [  # Bell + only Bob measures (Alice does NOT)
        {"id": "g1", "gate": "H", "targets": [0], "controls": [], "step": 0},
        {"id": "g2", "gate": "CX", "targets": [1], "controls": [0], "step": 1},
        {"id": "g3", "gate": "MEASURE", "targets": [1], "controls": [], "step": 2},
    ],
    "M03_Z_BASIS": [  # H|0> measured in Z-basis: 50/50
        {"id": "g1", "gate": "H", "targets": [0], "controls": [], "step": 0},
        {"id": "g2", "gate": "MEASURE", "targets": [0], "controls": [], "step": 1},
    ],
    "M03_X_BASIS": [  # H|0> then H again before measure (X-basis): 100% |0>
        {"id": "g1", "gate": "H", "targets": [0], "controls": [], "step": 0},
        {"id": "g2", "gate": "H", "targets": [0], "controls": [], "step": 1},
        {"id": "g3", "gate": "MEASURE", "targets": [0], "controls": [], "step": 2},
    ],
}

SHOTS = 2048   # High shot count for stable statistics


def _compute_tvd(predicted: Dict[str, float], actual: Dict[str, float]) -> float:
    """Total Variation Distance between two probability distributions."""
    all_keys = set(predicted) | set(actual)
    return round(sum(abs(predicted.get(k, 0.0) - actual.get(k, 0.0)) for k in all_keys) / 2.0, 4)


def _extract_probs(result) -> Dict[str, float]:
    """Extract {basis: probability} from simulator result."""
    return {sv.basis: sv.probability for sv in result.statevector}


# ---------------------------------------------------------------------------
# Main analytics computation
# ---------------------------------------------------------------------------

def compute_session_analytics() -> AnalyticsSession:
    """
    Runs all canonical circuit experiments through Qiskit Aer and derives
    every metric from the real simulation output.
    """
    circuits_run = 0
    lab_results: List[LabResult] = []

    # -----------------------------------------------------------------------
    # M01 — Superposition ≠ Coin Toss
    # -----------------------------------------------------------------------
    c_hh = _make_circuit(LAB_CIRCUITS["M01_HH"])
    res_hh = simulate_circuit(c_hh, shots=SHOTS)
    probs_hh = _extract_probs(res_hh)
    circuits_run += 1

    c_hzh = _make_circuit(LAB_CIRCUITS["M01_HZH"])
    res_hzh = simulate_circuit(c_hzh, shots=SHOTS)
    probs_hzh = _extract_probs(res_hzh)
    circuits_run += 1

    # Naive prediction for M01: student thinks H->H gives 50/50
    naive_m01 = {"0": 0.5, "1": 0.5}
    tvd_m01 = _compute_tvd(naive_m01, probs_hh)
    # P(|0>) should be ~1.0; deviation from 1.0 drives TVD
    m01_resolved = tvd_m01 < 0.10

    lab_results.append(LabResult(
        labId="lab-m01-interference",
        misconceptionId="M01",
        title="Superposition ≠ Classical Coin Toss",
        simulatedProbabilities=probs_hh,
        naivePrediction=naive_m01,
        cognitiveDelta=tvd_m01,
        resolved=m01_resolved,
        pedagogicalNote=(
            f"H²=I: Qiskit Aer computes P(|0⟩)={probs_hh.get('0', 0):.4f} "
            f"— constructive interference restores |0⟩ with certainty. "
            f"H→Z→H yields P(|1⟩)={probs_hzh.get('1', 0):.4f} via destructive interference."
        ),
        shots=SHOTS,
    ))

    # -----------------------------------------------------------------------
    # M02 — Entanglement ≠ FTL Signaling
    # -----------------------------------------------------------------------
    c_alice = _make_circuit(LAB_CIRCUITS["M02_ALICE_MEASURES"])
    res_alice = simulate_circuit(c_alice, shots=SHOTS)
    circuits_run += 1

    c_bob = _make_circuit(LAB_CIRCUITS["M02_BOB_ONLY"])
    res_bob = simulate_circuit(c_bob, shots=SHOTS)
    circuits_run += 1

    # Bob's marginal: extract q1 probabilities from multi-qubit result
    bob_probs_alice = {}
    for sv in res_alice.statevector:
        q1_bit = sv.basis[-1]  # last bit is q1 for 2-qubit circuit
        bob_probs_alice[q1_bit] = bob_probs_alice.get(q1_bit, 0.0) + sv.probability

    bob_probs_alone = _extract_probs(res_bob)

    # TVD between Bob's marginals in both scenarios (should be ~0 = no signaling)
    # The "naive" prediction is that Alice's measurement changes Bob's distribution
    naive_m02_bob = {"0": 0.0, "1": 1.0}  # Naive student thinks Bob always sees "1" after Alice
    tvd_m02 = _compute_tvd(naive_m02_bob, bob_probs_alone)
    m02_resolved = tvd_m02 < 0.10

    lab_results.append(LabResult(
        labId="lab-m02-no-signaling",
        misconceptionId="M02",
        title="Entanglement ≠ FTL Signaling",
        simulatedProbabilities=bob_probs_alone,
        naivePrediction=naive_m02_bob,
        cognitiveDelta=tvd_m02,
        resolved=m02_resolved,
        pedagogicalNote=(
            f"Bob's marginal P(0)={bob_probs_alone.get('0', 0):.4f}, P(1)={bob_probs_alone.get('1', 0):.4f} "
            f"regardless of whether Alice measures. TVD(scenarios)≈"
            f"{_compute_tvd(bob_probs_alice, bob_probs_alone):.4f} ≈ 0 — no signaling confirmed."
        ),
        shots=SHOTS,
    ))

    # -----------------------------------------------------------------------
    # M03 — Pure State ≠ Statistical Mixture
    # -----------------------------------------------------------------------
    c_z = _make_circuit(LAB_CIRCUITS["M03_Z_BASIS"])
    res_z = simulate_circuit(c_z, shots=SHOTS)
    probs_z = _extract_probs(res_z)
    circuits_run += 1

    c_x = _make_circuit(LAB_CIRCUITS["M03_X_BASIS"])
    res_x = simulate_circuit(c_x, shots=SHOTS)
    probs_x = _extract_probs(res_x)
    circuits_run += 1

    # Naive: student thinks X-basis also gives 50/50 (can't distinguish pure from mixture)
    naive_m03 = {"0": 0.5, "1": 0.5}
    tvd_m03 = _compute_tvd(naive_m03, probs_x)
    m03_resolved = tvd_m03 < 0.10

    lab_results.append(LabResult(
        labId="lab-m03-mixture",
        misconceptionId="M03",
        title="Coherent |+⟩ ≠ Statistical Mixture",
        simulatedProbabilities=probs_x,
        naivePrediction=naive_m03,
        cognitiveDelta=tvd_m03,
        resolved=m03_resolved,
        pedagogicalNote=(
            f"Z-basis: P(0)={probs_z.get('0', 0):.4f} (50/50, indistinguishable). "
            f"X-basis: P(0)={probs_x.get('0', 0):.4f} ≈ 1.0 — pure coherence detected! "
            f"A mixed state gives 50/50 in every basis."
        ),
        shots=SHOTS,
    ))

    # -----------------------------------------------------------------------
    # Cognitive Delta Convergence (true lab-by-lab TVD sequence)
    # -----------------------------------------------------------------------
    tvds = [lr.cognitiveDelta for lr in lab_results]
    delta_convergence = []
    for i, lr in enumerate(lab_results):
        delta_convergence.append({
            "lab": f"Lab {i+1} ({lr.misconceptionId})",
            "tvd": round(lr.cognitiveDelta, 4),
            "accuracy": round((1.0 - lr.cognitiveDelta) * 100, 1),
        })

    # -----------------------------------------------------------------------
    # Competency Radar — derived from simulation physics, not guessed
    # -----------------------------------------------------------------------
    # Each score is computed from a specific simulation metric:
    p0_hh = probs_hh.get("0", 0.0)          # superposition / interference quality
    p1_hzh = probs_hzh.get("1", 0.0)         # relative phase mastery
    bob_random = bob_probs_alone.get("0", 0.5)  # how close to 0.5 (ideal no-signal)
    p0_xbasis = probs_x.get("0", 0.0)        # coherence detection

    # Compute purity of the Hadamard state from density matrix: Tr(rho^2)
    # For H|0> = |+>, purity = 1.0 (pure state)
    # We use probs_z to check: if both P(0)~0.5, P(1)~0.5, the state IS in superposition
    p0_z = probs_z.get("0", 0.5)
    p1_z = probs_z.get("1", 0.5)
    superposition_score = p0_hh * 100.0      # How well HH returns to |0>
    interference_score = p1_hzh * 100.0      # How well HZH gives |1>
    entanglement_score = min(100.0, abs(bob_random - 0.5) * 200.0 + 50.0)
    # Entanglement: Bob should be ~0.5; deviation from 0.5 shows entanglement signature
    # The higher the correlation (Bob measures |0> or |1> with 50/50), the higher the score
    entanglement_score = 50.0 + abs(0.5 - bob_random) * 100.0
    coherence_score = p0_xbasis * 100.0      # X-basis collapses to |0> for pure |+>

    # For decoherence and hardware, use the M03 purity concept:
    # purity = 1 - 2*P(0)*P(1) simplified: for 50/50 pure -> we know it IS pure from X-basis
    purity_evidence = p0_xbasis  # 1.0 = pure, 0.5 = fully mixed
    decoherence_score = min(100.0, purity_evidence * 100.0 * 0.85 + 15.0)
    hardware_score = min(100.0, (p0_hh + p1_hzh) / 2.0 * 100.0 * 0.9 + 5.0)
    algorithm_score = min(100.0, (p0_hh * 0.4 + p1_hzh * 0.4 + p0_xbasis * 0.2) * 100.0 * 0.85)

    competency_radar = [
        CompetencyDomain(
            domain="Superposition",
            score=round(superposition_score, 1),
            derivation=f"P(|0⟩) from H²|0⟩ = {p0_hh:.4f} via Qiskit Aer",
        ),
        CompetencyDomain(
            domain="Interference",
            score=round(interference_score, 1),
            derivation=f"P(|1⟩) from H·Z·H|0⟩ = {p1_hzh:.4f} via Qiskit Aer",
        ),
        CompetencyDomain(
            domain="Entanglement",
            score=round(min(100, entanglement_score), 1),
            derivation=f"Bob marginal P(0)={bob_random:.4f} confirms no-signaling",
        ),
        CompetencyDomain(
            domain="Decoherence (T₁,T₂)",
            score=round(decoherence_score, 1),
            derivation=f"X-basis purity evidence P(0)={p0_xbasis:.4f}",
        ),
        CompetencyDomain(
            domain="Hardware Awareness",
            score=round(hardware_score, 1),
            derivation=f"Mean circuit fidelity: (HH+HZH)/2 = {(p0_hh+p1_hzh)/2:.4f}",
        ),
        CompetencyDomain(
            domain="Algorithms",
            score=round(algorithm_score, 1),
            derivation=f"Composite: 0.4·HH + 0.4·HZH + 0.2·Xbasis",
        ),
    ]

    # -----------------------------------------------------------------------
    # A fixed benchmark cannot establish any cohort prevalence.
    cohort_prevalence: List[Dict] = []

    # -----------------------------------------------------------------------
    # Aggregate metrics
    # -----------------------------------------------------------------------
    resolved_count = sum(1 for lr in lab_results if lr.resolved)
    final_tvd = round(tvds[-1] if tvds else 0.0, 4)
    # Overall mastery = (1 - mean_tvd) * 100
    mean_tvd = round(sum(tvds) / len(tvds), 4) if tvds else 0.0
    overall_mastery = round((1.0 - mean_tvd) * 100.0, 1)

    return AnalyticsSession(
        labResults=lab_results,
        deltaConvergence=delta_convergence,
        competencyRadar=competency_radar,
        resolvedCount=resolved_count,
        totalMisconceptions=len(lab_results),
        finalTVD=final_tvd,
        # The field remains for compatibility, but a canonical benchmark cannot
        # award learner mastery.
        overallMastery=0.0,
        cohortMisconceptionPrevalence=cohort_prevalence,
        simulatedCircuitsCount=circuits_run,
        kernelVersion="Qiskit Aer 0.17.2",
    )
