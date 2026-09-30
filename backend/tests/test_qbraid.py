"""Unit tests for the qBraid Unified Transpiler & Simulation Adapter."""

import pytest
import numpy as np

from app.models.circuit_ir import CircuitIR, GateOperation
from app.quantum.qbraid_adapter import (
    is_qbraid_available,
    simulate_qbraid_statevector,
    simulate_qbraid_probabilities,
    simulate_qbraid_execution,
)


def test_qbraid_availability():
    assert is_qbraid_available() is True


def test_qbraid_bell_state_simulation():
    # Bell state (|00> + |11>) / sqrt(2)
    circuit = CircuitIR(
        schemaVersion="1.0",
        qubits=2,
        classicalBits=2,
        operations=[
            GateOperation(gate="H", targets=[0], step=0),
            GateOperation(gate="CX", controls=[0], targets=[1], step=1),
        ],
    )
    state = simulate_qbraid_statevector(circuit)
    assert len(state) == 4
    # |00> amplitude
    assert np.isclose(abs(state[0]) ** 2, 0.5, atol=1e-4)
    # |01> amplitude
    assert np.isclose(abs(state[1]) ** 2, 0.0, atol=1e-4)
    # |10> amplitude
    assert np.isclose(abs(state[2]) ** 2, 0.0, atol=1e-4)
    # |11> amplitude
    assert np.isclose(abs(state[3]) ** 2, 0.5, atol=1e-4)


def test_qbraid_execution_contract():
    circuit = CircuitIR(
        schemaVersion="1.0",
        qubits=1,
        classicalBits=1,
        operations=[
            GateOperation(gate="X", targets=[0], step=0),
        ],
    )
    result = simulate_qbraid_execution(circuit, shots=512)
    assert result.qubitCount == 1
    assert result.shots == 512
    assert "qbraid" in result.backend
    assert result.probabilities["1"] == 1.0
    assert result.counts["1"] == 512
