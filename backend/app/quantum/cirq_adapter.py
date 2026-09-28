"""Native CircuitIR to Cirq translation.

This adapter constructs every supported operation in Cirq. It never imports a
statevector produced by Qiskit, so cross-framework checks are independent.
"""

from typing import Dict
import numpy as np

from ..circuit.ir import CircuitIR


def _build_cirq_circuit(circuit: CircuitIR):
    import cirq

    qubits = cirq.LineQubit.range(circuit.qubits)
    translated = cirq.Circuit()
    operations = sorted(circuit.operations, key=lambda op: op.step or 0)
    for op in operations:
        gate = (op.gate or "").upper()
        if gate in ("MEASURE", "RESET", "BARRIER"):
            if gate == "BARRIER":
                continue
            raise ValueError("Cirq parity currently supports unitary circuits only")
        target = qubits[op.targets[0]] if op.targets else None
        theta = float(op.params[0]) if op.params else 0.0
        if gate == "H": translated.append(cirq.H(target))
        elif gate == "X": translated.append(cirq.X(target))
        elif gate == "Y": translated.append(cirq.Y(target))
        elif gate == "Z": translated.append(cirq.Z(target))
        elif gate == "S": translated.append(cirq.S(target))
        elif gate == "T": translated.append(cirq.T(target))
        elif gate == "SDG": translated.append((cirq.S ** -1)(target))
        elif gate == "TDG": translated.append((cirq.T ** -1)(target))
        elif gate == "RX": translated.append(cirq.rx(theta)(target))
        elif gate == "RY": translated.append(cirq.ry(theta)(target))
        elif gate == "RZ": translated.append(cirq.rz(theta)(target))
        elif gate in ("CX", "CZ"):
            if len(op.controls) != 1 or len(op.targets) != 1:
                raise ValueError(f"{gate} requires one control and one target")
            control = qubits[op.controls[0]]
            translated.append((cirq.CNOT if gate == "CX" else cirq.CZ)(control, target))
        elif gate == "SWAP":
            if len(op.targets) != 2:
                raise ValueError("SWAP requires two targets")
            translated.append(cirq.SWAP(qubits[op.targets[0]], qubits[op.targets[1]]))
        else:
            raise ValueError(f"Gate {gate} is not supported by the Cirq adapter")

    return cirq, qubits, translated


def simulate_cirq_statevector(circuit: CircuitIR) -> np.ndarray:
    """Execute a unitary CircuitIR natively and return Qiskit-order amplitudes."""
    cirq, qubits, translated = _build_cirq_circuit(circuit)

    state = cirq.Simulator(dtype=np.complex128).simulate(
        translated, qubit_order=qubits
    ).final_state_vector

    # Cirq orders LineQubit(0)..LineQubit(n-1) as big-endian. The public IR
    # uses the Qiskit display convention q(n-1)..q0, so permute amplitudes once
    # here and keep every downstream result in the canonical order.
    canonical = np.zeros_like(state, dtype=np.complex128)
    for index, amplitude in enumerate(state):
        cirq_bits = format(index, f"0{circuit.qubits}b")
        canonical[int(cirq_bits[::-1], 2)] = amplitude
    return canonical


def simulate_cirq_probabilities(circuit: CircuitIR) -> Dict[str, float]:
    state = simulate_cirq_statevector(circuit)
    return {
        format(index, f"0{circuit.qubits}b"): float(abs(amplitude) ** 2)
        for index, amplitude in enumerate(state)
    }
