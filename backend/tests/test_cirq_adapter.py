import importlib.util
import pytest

from app.circuit.ir import CircuitIR, CircuitOperation


pytestmark = pytest.mark.skipif(importlib.util.find_spec("cirq") is None, reason="cirq not installed")


def test_native_cirq_bell_probabilities_match_expected_bit_order():
    from app.quantum.cirq_adapter import simulate_cirq_probabilities

    circuit = CircuitIR(schemaVersion="1.0", qubits=2, classicalBits=2, operations=[
        CircuitOperation(gate="H", targets=[0], step=0),
        CircuitOperation(gate="CX", controls=[0], targets=[1], step=1),
    ])
    probabilities = simulate_cirq_probabilities(circuit)
    assert probabilities["00"] == pytest.approx(0.5, abs=1e-8)
    assert probabilities["11"] == pytest.approx(0.5, abs=1e-8)
    assert probabilities["01"] == pytest.approx(0.0, abs=1e-8)
    assert probabilities["10"] == pytest.approx(0.0, abs=1e-8)


def test_native_cirq_preserves_relative_phase_interference():
    from app.quantum.cirq_adapter import simulate_cirq_probabilities

    circuit = CircuitIR(schemaVersion="1.0", qubits=1, classicalBits=1, operations=[
        CircuitOperation(gate="H", targets=[0], step=0),
        CircuitOperation(gate="Z", targets=[0], step=1),
        CircuitOperation(gate="H", targets=[0], step=2),
    ])
    probabilities = simulate_cirq_probabilities(circuit)
    assert probabilities["1"] == pytest.approx(1.0, abs=1e-8)
