from app.circuit.ir import CircuitIR, CircuitOperation
from app.quantum.guided_assessment import evaluate_guided_checkpoint
from app.quantum.assessment import evaluate_challenge_submission


def circuit(qubits, ops):
    return CircuitIR(schemaVersion="1.0", qubits=qubits, classicalBits=qubits, operations=ops)


def test_bell_guided_checkpoint_is_phase_sensitive():
    good = circuit(2, [
        CircuitOperation(gate="H", targets=[0], step=0),
        CircuitOperation(gate="CX", controls=[0], targets=[1], step=1),
    ])
    bad = circuit(2, [*good.operations, CircuitOperation(gate="Z", targets=[0], step=2)])
    assert evaluate_guided_checkpoint("bell-state", 1, good)["passed"] is True
    assert evaluate_guided_checkpoint("bell-state", 1, bad)["passed"] is False


def test_measurement_final_checkpoint_requires_reset_then_x():
    incomplete = circuit(1, [
        CircuitOperation(gate="H", targets=[0], step=0),
        CircuitOperation(gate="MEASURE", targets=[0], step=1),
        CircuitOperation(gate="X", targets=[0], step=3),
    ])
    assert evaluate_guided_checkpoint("measurement", 2, incomplete)["passed"] is False


def test_bell_mastery_rejects_identical_counts_with_wrong_phase():
    phi_minus = circuit(2, [
        CircuitOperation(gate="H", targets=[0], step=0),
        CircuitOperation(gate="CX", controls=[0], targets=[1], step=1),
        CircuitOperation(gate="Z", targets=[0], step=2),
    ])
    result = evaluate_challenge_submission("bell-phase-verification", phi_minus)
    assert result.passed is False
    assert result.fidelity < 1e-12
