"""Normalized execution for the user-selectable local simulator backends."""

from __future__ import annotations

import time

import numpy as np
from qiskit.quantum_info import Statevector

from ..models.circuit_ir import (
    CircuitIR,
    NormalizedSimulationResult,
    SimulationMetrics,
    StateAmplitude,
)
from .simulator import compute_reduced_states, simulate_circuit
from .validator import validate_circuit_ir


def _native_statevector(circuit: CircuitIR, backend: str) -> tuple[np.ndarray, str]:
    if backend == "cirq":
        from .cirq_adapter import simulate_cirq_statevector

        return simulate_cirq_statevector(circuit), "cirq-simulator"
    if backend == "pennylane":
        from .pennylane_adapter import simulate_pennylane_statevector

        return simulate_pennylane_statevector(circuit), "pennylane-default.qubit"
    if backend in {"qbraid", "qbraid-unified-transpiler", "qbraid-cloud-qpu"}:
        from .qbraid_adapter import simulate_qbraid_statevector

        return simulate_qbraid_statevector(circuit), "qbraid-unified-transpiler"
    raise ValueError(f"Unsupported simulation backend '{backend}'")


def simulate_selected_backend(
    circuit: CircuitIR, backend: str, shots: int = 1024
) -> NormalizedSimulationResult:
    """Execute the requested framework and return the shared result contract.

    Qiskit Aer supports the full editor contract, including measurement and
    reset. Cirq and PennyLane execute their own native unitary circuits. Their
    exact framework statevectors are normalized to the platform bit ordering,
    then shot counts are sampled from those native probability distributions.
    """
    if backend in {"qiskit-aer", "ideal-statevector"}:
        return simulate_circuit(circuit, shots=shots)

    valid, error = validate_circuit_ir(circuit)
    if not valid:
        raise ValueError(error)
    if any(op.gate in {"MEASURE", "RESET"} for op in circuit.operations):
        raise ValueError(
            f"{backend} execution currently supports unitary circuits only. "
            "Use Qiskit Aer for measurement or reset operations."
        )

    started = time.perf_counter()
    raw_state, resolved_backend = _native_statevector(circuit, backend)
    state = np.asarray(raw_state, dtype=np.complex128)
    probabilities_array = np.abs(state) ** 2
    probabilities_array = probabilities_array / probabilities_array.sum()

    labels = [format(index, f"0{circuit.qubits}b") for index in range(len(state))]
    probabilities = {
        label: round(float(probabilities_array[index]), 5)
        for index, label in enumerate(labels)
    }
    sampled = np.random.default_rng().multinomial(shots, probabilities_array)
    counts = {label: int(sampled[index]) for index, label in enumerate(labels)}
    amplitudes = [
        StateAmplitude(
            basis=label,
            real=round(float(np.real(state[index])), 5),
            imag=round(float(np.imag(state[index])), 5),
            magnitude=round(float(abs(state[index])), 5),
            phase=round(float(np.angle(state[index])), 5),
            probability=probabilities[label],
        )
        for index, label in enumerate(labels)
    ]

    reduced_states = compute_reduced_states(Statevector(state), circuit.qubits)
    average_entropy = sum(item.entropy for item in reduced_states) / len(reduced_states)
    average_purity = sum(item.purity for item in reduced_states) / len(reduced_states)
    steps = [op.step if op.step is not None else index for index, op in enumerate(circuit.operations)]
    depth = max(steps, default=-1) + 1
    elapsed_ms = round((time.perf_counter() - started) * 1000.0, 2)

    return NormalizedSimulationResult(
        circuitId=f"sim-{int(started * 1000)}",
        backend=resolved_backend,
        shots=shots,
        qubitCount=circuit.qubits,
        statevector=amplitudes,
        counts=counts,
        probabilities=probabilities,
        reducedStates=reduced_states,
        timeline=[],
        metrics=SimulationMetrics(
            depth=depth,
            gateCount=len(circuit.operations),
            entanglementEntropy=round(average_entropy, 4),
            purity=round(average_purity, 4),
            executionTimeMs=elapsed_ms,
        ),
    )
