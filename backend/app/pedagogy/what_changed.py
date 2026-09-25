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
from qiskit.quantum_info import state_fidelity, Statevector


class GateDiffItem(BaseModel):
    step: int
    gateA: Optional[str] = None
    gateB: Optional[str] = None
    targets: List[int]
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
    terms = []
    for item in sv:
        mag = item.magnitude
        if mag > 0.01:
            if abs(mag - 0.7071) < 0.02:
                coef = "1/√2"
            elif abs(mag - 1.0) < 0.02:
                coef = ""
            else:
                coef = f"{mag:.2f}"
            
            terms.append(f"{coef}|{item.basis}⟩")
    return " + ".join(terms) if terms else "|0...0⟩"


def compare_circuits(circuitA: CircuitIR, circuitB: CircuitIR) -> WhatChangedResponse:
    """Computes comprehensive topological and state diff between two circuit versions."""
    resA = simulate_circuit(circuitA)
    resB = simulate_circuit(circuitB)

    # Topological Gate Diff
    diff_items: List[GateDiffItem] = []
    opsA_map = {(op.step, tuple(op.targets)): op for op in circuitA.operations}
    opsB_map = {(op.step, tuple(op.targets)): op for op in circuitB.operations}

    all_keys = set(opsA_map.keys()).union(set(opsB_map.keys()))
    for step, targets in sorted(all_keys):
        opA = opsA_map.get((step, targets))
        opB = opsB_map.get((step, targets))

        if opA and opB:
            if opA.gate != opB.gate or opA.controls != opB.controls:
                diff_items.append(
                    GateDiffItem(
                        step=step,
                        gateA=opA.gate,
                        gateB=opB.gate,
                        targets=list(targets),
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
                    changeType="ADDED",
                )
            )

    # Quantum State Fidelity F = |<psi_A | psi_B>|^2
    qcA = build_qiskit_circuit(circuitA)
    qcB = build_qiskit_circuit(circuitB)
    svA = Statevector.from_instruction(qcA)
    svB = Statevector.from_instruction(qcB)
    fidelity = round(float(state_fidelity(svA, svB)), 4)

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

    # Conceptual Explanation Generation
    explanation = ""
    had_superposition_A = any(op.gate == "H" for op in circuitA.operations)
    had_superposition_B = any(op.gate == "H" for op in circuitB.operations)
    had_cnot_A = any(op.gate == "CX" for op in circuitA.operations)
    had_cnot_B = any(op.gate == "CX" for op in circuitB.operations)

    if had_superposition_A and not had_superposition_B and had_cnot_B:
        explanation = (
            "In Version B, removing the Hadamard gate eliminated quantum superposition. "
            "Because the control qubit was in a deterministic computational basis state, "
            "the CNOT acted as a classical conditional bit-flip rather than generating entanglement. "
            "The output collapsed from an entangled Bell state into a separable product state."
        )
    elif not had_superposition_A and had_superposition_B and had_cnot_B:
        explanation = (
            "Adding the Hadamard gate placed the control qubit into superposition (|0⟩ + |1⟩)/√2. "
            "The CNOT now acts on both basis components simultaneously, entangling the target qubit "
            "and generating quantum non-local correlation."
        )
    else:
        explanation = (
            f"Circuit modifications resulted in a state fidelity of {fidelity * 100:.1f}%. "
            f"{len(diff_items)} gate operation(s) shifted the interference amplitudes across the computational basis."
        )

    return WhatChangedResponse(
        circuitDiff=diff_items,
        stateSummaryA=format_statevector_readable(resA.statevector),
        stateSummaryB=format_statevector_readable(resB.statevector),
        stateFidelity=fidelity,
        probabilityDiff=prob_diff,
        conceptExplanation=explanation,
    )
