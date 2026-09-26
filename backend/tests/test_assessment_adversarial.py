import pytest

from app.circuit.ir import CircuitIR, CircuitOperation
from app.quantum.assessment import evaluate_challenge_submission


def circuit(qubits, operations):
    return CircuitIR(schemaVersion="1.0", qubits=qubits, classicalBits=qubits, operations=operations)


def test_ghz_plus_passes_phase_sensitive_fidelity():
    submission = circuit(3, [
        CircuitOperation(gate="H", targets=[0], step=0),
        CircuitOperation(gate="CX", controls=[0], targets=[1], step=1),
        CircuitOperation(gate="CX", controls=[1], targets=[2], step=2),
    ])
    result = evaluate_challenge_submission("ghz-3qubit", submission)
    assert result.passed
    assert result.fidelity == pytest.approx(1.0, abs=1e-9)


def test_orthogonal_ghz_minus_is_rejected():
    submission = circuit(3, [
        CircuitOperation(gate="H", targets=[0], step=0),
        CircuitOperation(gate="CX", controls=[0], targets=[1], step=1),
        CircuitOperation(gate="CX", controls=[1], targets=[2], step=2),
        CircuitOperation(gate="Z", targets=[0], step=3),
    ])
    result = evaluate_challenge_submission("ghz-3qubit", submission)
    assert not result.passed
    assert result.fidelity == pytest.approx(0.0, abs=1e-9)


def test_parity_oracle_passes_full_unitary_check():
    submission = circuit(3, [
        CircuitOperation(gate="CX", controls=[0], targets=[2], step=0),
        CircuitOperation(gate="CX", controls=[1], targets=[2], step=1),
    ])
    result = evaluate_challenge_submission("qasm-deutsch-oracle", submission)
    assert result.passed
    assert result.fidelity == pytest.approx(1.0, abs=1e-9)


def test_cancelling_cnot_pairs_do_not_pass_parity_oracle():
    submission = circuit(3, [
        CircuitOperation(gate="CX", controls=[0], targets=[2], step=0),
        CircuitOperation(gate="CX", controls=[0], targets=[2], step=1),
        CircuitOperation(gate="CX", controls=[1], targets=[2], step=2),
        CircuitOperation(gate="CX", controls=[1], targets=[2], step=3),
    ])
    result = evaluate_challenge_submission("qasm-deutsch-oracle", submission)
    assert not result.passed
    assert result.fidelity < 0.999
