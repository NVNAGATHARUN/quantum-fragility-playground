"""Native CircuitIR to PennyLane execution.

Every gate is constructed directly in PennyLane. No Qiskit statevector or
StatePrep bridge is used, keeping cross-framework verification independent.
"""

from typing import Dict
import numpy as np
from ..circuit.ir import CircuitIR


def simulate_pennylane_statevector(circuit: CircuitIR) -> np.ndarray:
    import pennylane as qml

    operations = sorted(circuit.operations, key=lambda op: op.step or 0)
    dev = qml.device("default.qubit", wires=circuit.qubits)

    @qml.qnode(dev)
    def execute():
        for op in operations:
            gate = (op.gate or "").upper()
            if gate == "BARRIER":
                continue
            if gate in {"MEASURE", "RESET"}:
                raise ValueError("PennyLane parity currently supports unitary circuits only")
            target = op.targets[0] if op.targets else None
            theta = float(op.params[0]) if op.params else 0.0
            if gate == "H": qml.Hadamard(wires=target)
            elif gate == "X": qml.PauliX(wires=target)
            elif gate == "Y": qml.PauliY(wires=target)
            elif gate == "Z": qml.PauliZ(wires=target)
            elif gate == "S": qml.S(wires=target)
            elif gate == "T": qml.T(wires=target)
            elif gate == "SDG": qml.adjoint(qml.S)(wires=target)
            elif gate == "TDG": qml.adjoint(qml.T)(wires=target)
            elif gate == "RX": qml.RX(theta, wires=target)
            elif gate == "RY": qml.RY(theta, wires=target)
            elif gate == "RZ": qml.RZ(theta, wires=target)
            elif gate == "CX": qml.CNOT(wires=[op.controls[0], target])
            elif gate == "CZ": qml.CZ(wires=[op.controls[0], target])
            elif gate == "SWAP": qml.SWAP(wires=op.targets)
            else: raise ValueError(f"Gate {gate} is not supported by the PennyLane adapter")
        return qml.state()

    raw = execute()
    canonical = np.zeros(len(raw), dtype=np.complex128)
    for index, amplitude in enumerate(raw):
        pennylane_bits = format(index, f"0{circuit.qubits}b")
        canonical[int(pennylane_bits[::-1], 2)] = complex(amplitude)
    return canonical


def simulate_pennylane_probabilities(circuit: CircuitIR) -> Dict[str, float]:
    state = simulate_pennylane_statevector(circuit)
    return {
        format(index, f"0{circuit.qubits}b"): float(abs(amplitude) ** 2)
        for index, amplitude in enumerate(state)
    }
