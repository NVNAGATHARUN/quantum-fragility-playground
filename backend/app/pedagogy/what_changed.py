"""What Changed? Version Comparison Engine for Quantum Lens AI.

Compares Circuit Version A against Circuit Version B, providing topological,
statevector, basis probability, and conceptual diffs according to Section 38-39 of the SRS.
"""

import math
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import numpy as np

from ..models.circuit_ir import CircuitIR
from ..quantum.simulator import simulate_circuit, build_qiskit_circuit


class GateDiffItem(BaseModel):
    step: int
    gateA: Optional[str] = None
    gateB: Optional[str] = None
    targets: List[int]
    controlsA: Optional[List[int]] = None
    controlsB: Optional[List[int]] = None
    paramsA: Optional[Any] = None
    paramsB: Optional[Any] = None
    changeType: str  # "MODIFIED", "ADDED", "REMOVED"


class WhatChangedResponse(BaseModel):
    circuitDiff: List[GateDiffItem]
    stateSummaryA: str
    stateSummaryB: str
    stateFidelity: float
    probabilityDiff: Dict[str, Dict[str, float]]
    conceptExplanation: str


def format_statevector_readable(sv: List[Any]) -> str:
    """Formats a statevector into human-readable ket notation."""
    if not sv:
        return "|0...0⟩"
    terms = []
    for item in sv:
        mag = item.magnitude if hasattr(item, "magnitude") else abs(complex(item.real, item.imag))
        if mag > 0.01:
            basis = item.basis if hasattr(item, "basis") else "0"
            if abs(mag - 0.7071) < 0.02:
                coef = "1/√2"
            elif abs(mag - 1.0) < 0.02:
                coef = ""
            elif abs(mag - 0.5) < 0.02:
                coef = "1/2"
            else:
                coef = f"{mag:.2f}"
            
            terms.append(f"{coef}|{basis}⟩")
    return " + ".join(terms) if terms else "|0...0⟩"


def compute_fidelity(resA: Any, resB: Any, circuitA: CircuitIR, circuitB: CircuitIR) -> float:
    """Computes exact quantum state fidelity |<psi_A | psi_B>|^2 with robust fallbacks."""
    try:
        from qiskit.quantum_info import state_fidelity, Statevector
        qcA = build_qiskit_circuit(circuitA)
        qcB = build_qiskit_circuit(circuitB)
        # Only use Statevector if circuits contain no measurement/reset instructions
        has_non_unitary_A = any(op.gate in ("MEASURE", "RESET") or op.type in ("MEASURE", "RESET") for op in circuitA.operations)
        has_non_unitary_B = any(op.gate in ("MEASURE", "RESET") or op.type in ("MEASURE", "RESET") for op in circuitB.operations)
        if not has_non_unitary_A and not has_non_unitary_B and circuitA.qubits == circuitB.qubits:
            svA = Statevector.from_instruction(qcA)
            svB = Statevector.from_instruction(qcB)
            return round(float(state_fidelity(svA, svB)), 4)
    except Exception:
        pass

    # Direct complex vector overlap fallback
    try:
        if resA.statevector and resB.statevector and len(resA.statevector) == len(resB.statevector):
            vecA = np.array([complex(amp.real, amp.imag) for amp in resA.statevector], dtype=complex)
            vecB = np.array([complex(amp.real, amp.imag) for amp in resB.statevector], dtype=complex)
            normA = np.linalg.norm(vecA)
            normB = np.linalg.norm(vecB)
            if normA > 1e-9 and normB > 1e-9:
                vecA = vecA / normA
                vecB = vecB / normB
                return round(float(abs(np.vdot(vecA, vecB)) ** 2), 4)
    except Exception:
        pass

    # Statistical distribution fidelity (Bhattacharyya / Hellinger fidelity)
    all_bases = set(resA.probabilities.keys()).union(set(resB.probabilities.keys()))
    bc = sum(math.sqrt(resA.probabilities.get(b, 0.0) * resB.probabilities.get(b, 0.0)) for b in all_bases)
    return round(float(bc ** 2), 4)


def generate_socratic_explanation(
    circuitA: CircuitIR,
    circuitB: CircuitIR,
    diff_items: List[GateDiffItem],
    fidelity: float,
    prob_diff: Dict[str, Dict[str, float]],
) -> str:
    """Generates pedagogical Socratic reasoning explaining why the quantum transformation altered behavior."""
    opsA = [op.gate for op in circuitA.operations if op.gate]
    opsB = [op.gate for op in circuitB.operations if op.gate]
    
    had_superposition_A = any(g == "H" for g in opsA)
    had_superposition_B = any(g == "H" for g in opsB)
    had_cnot_A = any(g in ("CX", "CZ", "CNOT") for g in opsA)
    had_cnot_B = any(g in ("CX", "CZ", "CNOT") for g in opsB)
    had_phase_A = any(g in ("Z", "S", "T", "RZ", "P") for g in opsA)
    had_phase_B = any(g in ("Z", "S", "T", "RZ", "P") for g in opsB)
    had_measure_A = any(op.gate == "MEASURE" or getattr(op, "type", None) == "MEASURE" for op in circuitA.operations)
    had_measure_B = any(op.gate == "MEASURE" or getattr(op, "type", None) == "MEASURE" for op in circuitB.operations)

    # 1. Superposition & Entanglement transition
    if had_superposition_A and not had_superposition_B and had_cnot_B:
        return (
            "In Version B, removing the Hadamard gate eliminated quantum superposition. "
            "Because the control qubit was in a deterministic computational basis state, "
            "the CNOT acted as a classical conditional bit-flip rather than generating entanglement. "
            "The output collapsed from an entangled Bell state into a separable product state."
        )
    if not had_superposition_A and had_superposition_B and had_cnot_B:
        return (
            "Adding the Hadamard gate placed the control qubit into superposition (|0⟩ + |1⟩)/√2. "
            "The CNOT now acts on both basis components simultaneously, entangling the target qubit "
            "and generating quantum non-local correlation."
        )
    
    # 2. Relative phase gate shift (Z / S / T) without basis change vs with interference
    if not had_phase_A and had_phase_B:
        # Check if probabilities changed
        max_delta = max((abs(v["delta"]) for v in prob_diff.values()), default=0.0)
        if max_delta < 0.01:
            return (
                "Adding a phase rotation gate (Z/S/T/RZ) rotated the relative quantum phase "
                "on the equatorial plane of the Bloch sphere without altering computational Z-basis probabilities. "
                "The statevector gained a relative phase (e.g. e^{iθ}), which alters interference if followed by Hadamard or X gates."
            )
        else:
            return (
                "Adding a phase gate introduced destructive/constructive quantum interference. "
                "The relative phase shift rotated the state into an orthogonal basis vector when combined "
                "with surrounding basis-change gates (such as Hadamard), redirecting measurement probabilities."
            )

    # 3. Measurement / projection addition or removal
    if not had_measure_A and had_measure_B:
        return (
            "Adding mid-circuit or terminal measurement operations induced state projection / wave function collapse. "
            "The coherent superposition collapsed into classical stochastic samples determined by Born's rule."
        )

    # 4. Identity / Exact equivalence
    if fidelity > 0.9999 and len(diff_items) == 0:
        return "Both circuits are topologically and unitarily identical. State fidelity is 100%."
    elif fidelity > 0.9999 and len(diff_items) > 0:
        return (
            f"Although {len(diff_items)} gate modification(s) occurred, the overall unitary operation "
            "is mathematically equivalent (up to a global phase). State fidelity remains 100%."
        )

    # 5. General multi-gate evolution with quantitative state fidelity analysis
    return (
        f"Circuit modifications resulted in a state fidelity of {fidelity * 100:.1f}%. "
        f"{len(diff_items)} gate operation(s) shifted the interference amplitudes across the computational basis."
    )


def compare_circuits(circuitA: CircuitIR, circuitB: CircuitIR) -> WhatChangedResponse:
    """Computes comprehensive topological, statevector, and probability diff between two circuit versions."""
    resA = simulate_circuit(circuitA)
    resB = simulate_circuit(circuitB)

    # Topological Gate Diff
    diff_items: List[GateDiffItem] = []
    opsA_map = {(op.step if op.step is not None else idx, tuple(op.targets)): op for idx, op in enumerate(circuitA.operations)}
    opsB_map = {(op.step if op.step is not None else idx, tuple(op.targets)): op for idx, op in enumerate(circuitB.operations)}

    all_keys = set(opsA_map.keys()).union(set(opsB_map.keys()))
    for step, targets in sorted(all_keys):
        opA = opsA_map.get((step, targets))
        opB = opsB_map.get((step, targets))

        if opA and opB:
            # Check if gate, controls, or parameters changed
            is_different = (
                opA.gate != opB.gate
                or opA.controls != opB.controls
                or opA.params != opB.params
            )
            if is_different:
                diff_items.append(
                    GateDiffItem(
                        step=step,
                        gateA=opA.gate,
                        gateB=opB.gate,
                        targets=list(targets),
                        controlsA=opA.controls,
                        controlsB=opB.controls,
                        paramsA=opA.params,
                        paramsB=opB.params,
                        changeType="MODIFIED",
                    )
                )
        elif opA and not opB:
            diff_items.append(
                GateDiffItem(
                    step=step,
                    gateA=opA.gate,
                    gateB=None,
                    targets=list(targets),
                    controlsA=opA.controls,
                    controlsB=None,
                    paramsA=opA.params,
                    paramsB=None,
                    changeType="REMOVED",
                )
            )
        elif not opA and opB:
            diff_items.append(
                GateDiffItem(
                    step=step,
                    gateA=None,
                    gateB=opB.gate,
                    targets=list(targets),
                    controlsA=None,
                    controlsB=opB.controls,
                    paramsA=None,
                    paramsB=opB.params,
                    changeType="ADDED",
                )
            )

    # Quantum State Fidelity F = |<psi_A | psi_B>|^2
    fidelity = compute_fidelity(resA, resB, circuitA, circuitB)

    # Basis Probability Diff
    prob_diff: Dict[str, Dict[str, float]] = {}
    all_bases = set(resA.probabilities.keys()).union(set(resB.probabilities.keys()))
    for b in sorted(all_bases):
        pA = resA.probabilities.get(b, 0.0)
        pB = resB.probabilities.get(b, 0.0)
        if abs(pA - pB) > 0.001 or pA > 0.01 or pB > 0.01:
            prob_diff[b] = {
                "versionA": pA,
                "versionB": pB,
                "delta": round(pB - pA, 4),
            }

    # Pedagogical Socratic Explanation
    explanation = generate_socratic_explanation(circuitA, circuitB, diff_items, fidelity, prob_diff)

    return WhatChangedResponse(
        circuitDiff=diff_items,
        stateSummaryA=format_statevector_readable(resA.statevector),
        stateSummaryB=format_statevector_readable(resB.statevector),
        stateFidelity=fidelity,
        probabilityDiff=prob_diff,
        conceptExplanation=explanation,
    )
