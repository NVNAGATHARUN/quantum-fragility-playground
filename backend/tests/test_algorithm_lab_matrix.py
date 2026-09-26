"""Representative parameter matrix for the five interactive algorithm labs."""

import math
import pytest

from app.quantum.algorithms import run_deutsch_jozsa, run_qft, run_teleportation
from app.quantum.grover import run_grover


@pytest.mark.parametrize("n", [1, 2, 3, 4])
@pytest.mark.parametrize("oracle,decision", [
    ("constant_0", "constant"),
    ("constant_1", "constant"),
    ("balanced", "balanced"),
])
def test_deutsch_jozsa_parameter_matrix(n, oracle, decision):
    result = run_deutsch_jozsa(oracle, n, shots=128)
    assert result.result == decision
    assert sum(result.counts.values()) == 128


@pytest.mark.parametrize("n,target", [
    (2, "11"), (2, "00"), (3, "101"), (4, "1111"),
])
def test_grover_target_amplification_and_aer_counts(n, target):
    result = run_grover(n, target, shots=128)
    first = next(a.probability for a in result.amplitude_snapshots[0] if a.basis == target)
    last = result.final_probabilities[target]
    assert last > first
    assert sum(result.counts.values()) == 128


@pytest.mark.parametrize("input_state", ["zero", "one", "plus", "minus"])
def test_teleportation_four_inputs(input_state):
    result = run_teleportation(input_state, shots=128)
    assert result.fidelity > 0.99
    assert sum(result.bob_counts.values()) == 128


@pytest.mark.parametrize("n,input_state", [(2, 0), (2, 3), (3, 1), (3, 7), (4, 0), (4, 9)])
def test_qft_precision_and_state_count(n, input_state):
    result = run_qft(n, input_state, shots=128)
    assert len(result.output_amplitudes) == 2 ** n
    assert sum(result.counts.values()) == 128
    assert all(amp["probability"] == pytest.approx(1 / (2 ** n), abs=1e-5) for amp in result.output_amplitudes)
    for output_state, amp in enumerate(result.output_amplitudes):
        expected_turns = (input_state * output_state / (2 ** n)) % 1
        actual_turns = (amp["phase_rad"] / (2 * math.pi)) % 1
        circular_error = min(abs(actual_turns - expected_turns),
                             1 - abs(actual_turns - expected_turns))
        assert circular_error < 1e-4
