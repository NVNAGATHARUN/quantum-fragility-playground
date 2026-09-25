"""Authoritative Gate Registry for Quantum Lens AI.

Single authoritative registry defining operand counts, parameter requirements,
and framework mappings for all supported quantum gates and directives.
"""

from dataclasses import dataclass
from typing import Dict, Literal, Optional, List


OperationKind = Literal["GATE", "DIRECTIVE", "MEASURE", "RESET"]


@dataclass(frozen=True)
class GateDefinition:
    name: str
    targets: int
    controls: int = 0
    parameters: int = 0
    kind: OperationKind = "GATE"
    symmetric: bool = False
    description: str = ""
    qiskit_name: str = ""
    openqasm_name: str = ""
    cirq_name: str = ""
    pennylane_name: str = ""


GATE_REGISTRY: Dict[str, GateDefinition] = {
    # ── Single Qubit Standard Unitaries ──────────────────────────────────────
    "H": GateDefinition(
        name="H",
        targets=1,
        controls=0,
        parameters=0,
        kind="GATE",
        description="Hadamard gate: creates equal superposition (|0⟩ -> |+⟩, |1⟩ -> |-⟩)",
        qiskit_name="h",
        openqasm_name="h",
        cirq_name="H",
        pennylane_name="Hadamard",
    ),
    "X": GateDefinition(
        name="X",
        targets=1,
        controls=0,
        parameters=0,
        kind="GATE",
        description="Pauli-X (NOT) gate: bit flip around X-axis",
        qiskit_name="x",
        openqasm_name="x",
        cirq_name="X",
        pennylane_name="PauliX",
    ),
    "Y": GateDefinition(
        name="Y",
        targets=1,
        controls=0,
        parameters=0,
        kind="GATE",
        description="Pauli-Y gate: bit and phase flip around Y-axis",
        qiskit_name="y",
        openqasm_name="y",
        cirq_name="Y",
        pennylane_name="PauliY",
    ),
    "Z": GateDefinition(
        name="Z",
        targets=1,
        controls=0,
        parameters=0,
        kind="GATE",
        description="Pauli-Z gate: phase flip around Z-axis (|1⟩ -> -|1⟩)",
        qiskit_name="z",
        openqasm_name="z",
        cirq_name="Z",
        pennylane_name="PauliZ",
    ),
    "S": GateDefinition(
        name="S",
        targets=1,
        controls=0,
        parameters=0,
        kind="GATE",
        description="S (Phase) gate: π/2 rotation around Z-axis",
        qiskit_name="s",
        openqasm_name="s",
        cirq_name="S",
        pennylane_name="S",
    ),
    "SDG": GateDefinition(
        name="SDG",
        targets=1,
        controls=0,
        parameters=0,
        kind="GATE",
        description="S-dagger gate: -π/2 rotation around Z-axis",
        qiskit_name="sdg",
        openqasm_name="sdg",
        cirq_name="S**-1",
        pennylane_name="adjoint(qml.S)",
    ),
    "T": GateDefinition(
        name="T",
        targets=1,
        controls=0,
        parameters=0,
        kind="GATE",
        description="T gate: π/4 rotation around Z-axis",
        qiskit_name="t",
        openqasm_name="t",
        cirq_name="T",
        pennylane_name="T",
    ),
    "TDG": GateDefinition(
        name="TDG",
        targets=1,
        controls=0,
        parameters=0,
        kind="GATE",
        description="T-dagger gate: -π/4 rotation around Z-axis",
        qiskit_name="tdg",
        openqasm_name="tdg",
        cirq_name="T**-1",
        pennylane_name="adjoint(qml.T)",
    ),

    # ── Single Qubit Parameterized Rotations ─────────────────────────────────
    "RX": GateDefinition(
        name="RX",
        targets=1,
        controls=0,
        parameters=1,
        kind="GATE",
        description="Rotation around X-axis by angle θ",
        qiskit_name="rx",
        openqasm_name="rx",
        cirq_name="rx",
        pennylane_name="RX",
    ),
    "RY": GateDefinition(
        name="RY",
        targets=1,
        controls=0,
        parameters=1,
        kind="GATE",
        description="Rotation around Y-axis by angle θ",
        qiskit_name="ry",
        openqasm_name="ry",
        cirq_name="ry",
        pennylane_name="RY",
    ),
    "RZ": GateDefinition(
        name="RZ",
        targets=1,
        controls=0,
        parameters=1,
        kind="GATE",
        description="Rotation around Z-axis by angle θ",
        qiskit_name="rz",
        openqasm_name="rz",
        cirq_name="rz",
        pennylane_name="RZ",
    ),
    "P": GateDefinition(
        name="P",
        targets=1,
        controls=0,
        parameters=1,
        kind="GATE",
        description="Phase shift gate: diag(1, e^{iλ})",
        qiskit_name="p",
        openqasm_name="p",
        cirq_name="ZPowGate",
        pennylane_name="PhaseShift",
    ),
    "U": GateDefinition(
        name="U",
        targets=1,
        controls=0,
        parameters=3,
        kind="GATE",
        description="Generic single-qubit 3-parameter unitary gate U(θ, φ, λ)",
        qiskit_name="u",
        openqasm_name="u",
        cirq_name="circuits.qasm_output.u3",
        pennylane_name="U3",
    ),

    # ── Two-Qubit Controlled Gates ───────────────────────────────────────────
    "CX": GateDefinition(
        name="CX",
        targets=1,
        controls=1,
        parameters=0,
        kind="GATE",
        description="Controlled-NOT (CNOT) gate: flips target if control is |1⟩",
        qiskit_name="cx",
        openqasm_name="cx",
        cirq_name="CNOT",
        pennylane_name="CNOT",
    ),
    "CY": GateDefinition(
        name="CY",
        targets=1,
        controls=1,
        parameters=0,
        kind="GATE",
        description="Controlled-Y gate",
        qiskit_name="cy",
        openqasm_name="cy",
        cirq_name="ControlledGate(cirq.Y)",
        pennylane_name="CY",
    ),
    "CZ": GateDefinition(
        name="CZ",
        targets=1,
        controls=1,
        parameters=0,
        kind="GATE",
        description="Controlled-Z gate: applies phase flip if both qubits are |1⟩",
        qiskit_name="cz",
        openqasm_name="cz",
        cirq_name="CZ",
        pennylane_name="CZ",
    ),
    "CH": GateDefinition(
        name="CH",
        targets=1,
        controls=1,
        parameters=0,
        kind="GATE",
        description="Controlled-Hadamard gate",
        qiskit_name="ch",
        openqasm_name="ch",
        cirq_name="ControlledGate(cirq.H)",
        pennylane_name="CH",
    ),
    "CRX": GateDefinition(
        name="CRX",
        targets=1,
        controls=1,
        parameters=1,
        kind="GATE",
        description="Controlled-RX rotation gate",
        qiskit_name="crx",
        openqasm_name="crx",
        cirq_name="ControlledGate(cirq.rx)",
        pennylane_name="CRX",
    ),
    "CRY": GateDefinition(
        name="CRY",
        targets=1,
        controls=1,
        parameters=1,
        kind="GATE",
        description="Controlled-RY rotation gate",
        qiskit_name="cry",
        openqasm_name="cry",
        cirq_name="ControlledGate(cirq.ry)",
        pennylane_name="CRY",
    ),
    "CRZ": GateDefinition(
        name="CRZ",
        targets=1,
        controls=1,
        parameters=1,
        kind="GATE",
        description="Controlled-RZ rotation gate",
        qiskit_name="crz",
        openqasm_name="crz",
        cirq_name="ControlledGate(cirq.rz)",
        pennylane_name="CRZ",
    ),
    "CP": GateDefinition(
        name="CP",
        targets=1,
        controls=1,
        parameters=1,
        kind="GATE",
        description="Controlled-Phase gate",
        qiskit_name="cp",
        openqasm_name="cp",
        cirq_name="CZPowGate",
        pennylane_name="ControlledPhaseShift",
    ),

    # ── Multi-Qubit Gates with Correct Semantics ─────────────────────────────
    # Note: SWAP has 2 symmetric target qubits, 0 controls!
    "SWAP": GateDefinition(
        name="SWAP",
        targets=2,
        controls=0,
        parameters=0,
        kind="GATE",
        symmetric=True,
        description="Swap gate: exchanges quantum states of two qubits (2 symmetric targets)",
        qiskit_name="swap",
        openqasm_name="swap",
        cirq_name="SWAP",
        pennylane_name="SWAP",
    ),
    # Note: CCX (Toffoli) has 1 target qubit, 2 control qubits!
    "CCX": GateDefinition(
        name="CCX",
        targets=1,
        controls=2,
        parameters=0,
        kind="GATE",
        description="Toffoli (CCX) gate: flips target if both controls are |1⟩ (1 target, 2 controls)",
        qiskit_name="ccx",
        openqasm_name="ccx",
        cirq_name="TOFFOLI",
        pennylane_name="Toffoli",
    ),
    # Note: CSWAP (Fredkin) has 2 swap targets, 1 control qubit!
    "CSWAP": GateDefinition(
        name="CSWAP",
        targets=2,
        controls=1,
        parameters=0,
        kind="GATE",
        symmetric=True,
        description="Fredkin (CSWAP) gate: swaps two targets if control is |1⟩ (2 targets, 1 control)",
        qiskit_name="cswap",
        openqasm_name="cswap",
        cirq_name="CSWAP",
        pennylane_name="CSWAP",
    ),

    # ── Non-Unitary Directives and Operations ─────────────────────────────────
    "BARRIER": GateDefinition(
        name="BARRIER",
        targets=-1,  # variable number of targets (>=1)
        controls=0,
        parameters=0,
        kind="DIRECTIVE",
        description="Compiler scheduling barrier: directive preventing gate reordering (no state change)",
        qiskit_name="barrier",
        openqasm_name="barrier",
        cirq_name="",
        pennylane_name="Barrier",
    ),
    "RESET": GateDefinition(
        name="RESET",
        targets=1,
        controls=0,
        parameters=0,
        kind="RESET",
        description="Reset operation: non-unitary reset of qubit to |0⟩ state",
        qiskit_name="reset",
        openqasm_name="reset",
        cirq_name="reset",
        pennylane_name="",
    ),
    "MEASURE": GateDefinition(
        name="MEASURE",
        targets=1,
        controls=0,
        parameters=0,
        kind="MEASURE",
        description="Computational basis projection measurement into classical bit register",
        qiskit_name="measure",
        openqasm_name="measure",
        cirq_name="measure",
        pennylane_name="measure",
    ),
}

# Alias standard synonyms for ease of parsing
GATE_ALIASES: Dict[str, str] = {
    "CNOT": "CX",
    "TOFFOLI": "CCX",
    "FREDKIN": "CSWAP",
    "PHASE": "P",
    "U3": "U",
}


def get_gate_definition(name: str) -> Optional[GateDefinition]:
    """Retrieves authoritative GateDefinition by normalized name or alias."""
    upper = name.strip().upper()
    resolved = GATE_ALIASES.get(upper, upper)
    return GATE_REGISTRY.get(resolved)


def list_supported_gates() -> List[Dict]:
    """Returns serialized metadata for all supported gates."""
    return [
        {
            "name": g.name,
            "targets": g.targets,
            "controls": g.controls,
            "parameters": g.parameters,
            "kind": g.kind,
            "symmetric": g.symmetric,
            "description": g.description,
        }
        for g in GATE_REGISTRY.values()
    ]
