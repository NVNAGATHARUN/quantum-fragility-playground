"""Automated Quantum Correctness Test Suite for Quantum Lens AI.

Validates Qiskit Aer simulation kernel and Kraus noise channels against analytical ground truth.
SRS Build Contract Gate Requirement for Milestone 1.
"""

import pytest
import math
from app.models.circuit_ir import CircuitIR, GateOperation, FragilityRequest
from app.quantum.validator import validate_circuit_ir
from app.quantum.simulator import simulate_circuit
from app.quantum.fragility import simulate_fragility


def test_pauli_x_flips_zero_to_one():
    """Single-qubit X gate on |0⟩ must yield exactly |1⟩."""
    circuit = CircuitIR(
        version="1.0",
        qubits=1,
        classicalBits=1,
        operations=[
            GateOperation(id="g-01", gate="X", targets=[0], controls=[], step=0)
        ]
    )
    res = simulate_circuit(circuit, shots=500)
    assert res.probabilities["1"] == 1.0
    assert res.probabilities["0"] == 0.0
    assert res.reducedStates[0].blochVector.z == -1.0
    assert res.reducedStates[0].purity == 1.0
    assert res.reducedStates[0].isEntangled is False


def test_hadamard_creates_equal_superposition():
    """Hadamard gate on |0⟩ must yield |+⟩ = (|0⟩+|1⟩)/√2."""
    circuit = CircuitIR(
        version="1.0",
        qubits=1,
        classicalBits=1,
        operations=[
            GateOperation(id="g-01", gate="H", targets=[0], controls=[], step=0)
        ]
    )
    res = simulate_circuit(circuit, shots=1000)
    assert abs(res.probabilities["0"] - 0.5) < 1e-4
    assert abs(res.probabilities["1"] - 0.5) < 1e-4
    # On Bloch sphere, |+⟩ has coordinates (1, 0, 0)
    assert abs(res.reducedStates[0].blochVector.x - 1.0) < 1e-3
    assert abs(res.reducedStates[0].blochVector.y - 0.0) < 1e-3
    assert abs(res.reducedStates[0].blochVector.z - 0.0) < 1e-3
    assert res.reducedStates[0].purity == 1.0


def test_interference_h_h_vs_h_z_h():
    """Cognitive Conflict M01 Verification:

    H -> H yields |0⟩ with 100% probability.
    H -> Z -> H yields |1⟩ with 100% probability.
    Proves relative phase interference and refutes classical 50/50 randomness.
    """
    # 1. H -> H
    c_hh = CircuitIR(
        version="1.0",
        qubits=1,
        classicalBits=1,
        operations=[
            GateOperation(id="g-01", gate="H", targets=[0], controls=[], step=0),
            GateOperation(id="g-02", gate="H", targets=[0], controls=[], step=1),
        ]
    )
    res_hh = simulate_circuit(c_hh)
    assert res_hh.probabilities["0"] == 1.0
    assert res_hh.probabilities["1"] == 0.0

    # 2. H -> Z -> H
    c_hzh = CircuitIR(
        version="1.0",
        qubits=1,
        classicalBits=1,
        operations=[
            GateOperation(id="g-01", gate="H", targets=[0], controls=[], step=0),
            GateOperation(id="g-02", gate="Z", targets=[0], controls=[], step=1),
            GateOperation(id="g-03", gate="H", targets=[0], controls=[], step=2),
        ]
    )
    res_hzh = simulate_circuit(c_hzh)
    assert res_hzh.probabilities["0"] == 0.0
    assert res_hzh.probabilities["1"] == 1.0


def test_bell_state_entanglement_and_purity():
    """Bell State |Φ⁺⟩ = (|00⟩+|11⟩)/√2:

    Must produce 50% |00⟩, 50% |11⟩, zero cross-terms (|01⟩, |10⟩).
    Reduced subsystems must be maximally mixed (purity = 0.5, entropy = 1.0, isEntangled = True).
    """
    circuit = CircuitIR(
        version="1.0",
        qubits=2,
        classicalBits=2,
        operations=[
            GateOperation(id="g-01", gate="H", targets=[0], controls=[], step=0),
            GateOperation(id="g-02", gate="CX", targets=[1], controls=[0], step=1),
        ]
    )
    res = simulate_circuit(circuit, shots=1024)

    assert abs(res.probabilities["00"] - 0.5) < 1e-4
    assert abs(res.probabilities["11"] - 0.5) < 1e-4
    assert res.probabilities["01"] == 0.0
    assert res.probabilities["10"] == 0.0

    # Both qubits must show entanglement
    for state in res.reducedStates:
        assert state.isEntangled is True
        assert abs(state.purity - 0.5) < 1e-3
        assert abs(state.entropy - 1.0) < 1e-3
        # Bloch vector is at sphere center (0, 0, 0)
        assert abs(state.blochVector.x) < 1e-3
        assert abs(state.blochVector.y) < 1e-3
        assert abs(state.blochVector.z) < 1e-3


def test_circuit_validator_rejects_collisions_and_out_of_bounds():
    """Validator must strictly reject invalid topologies with actionable error strings."""
    # Collision test: Control == Target
    bad_cx = CircuitIR(
        version="1.0",
        qubits=2,
        classicalBits=2,
        operations=[
            GateOperation(id="g-01", gate="CX", targets=[0], controls=[0], step=0)
        ]
    )
    valid, err = validate_circuit_ir(bad_cx)
    assert valid is False
    assert "ERR_IR_COLLISION" in err

    # Out-of-bounds qubit test
    bad_target = CircuitIR(
        version="1.0",
        qubits=2,
        classicalBits=2,
        operations=[
            GateOperation(id="g-01", gate="H", targets=[5], controls=[], step=0)
        ]
    )
    valid2, err2 = validate_circuit_ir(bad_target)
    assert valid2 is False
    assert "ERR_IR_OUT_OF_BOUNDS" in err2


def test_kraus_amplitude_damping_t1_relaxation():
    """Amplitude Damping channel must cause relaxation from |1⟩ towards ground |0⟩.

    At t = 0: p0 = 0.0, p1 = 1.0 (state is |1⟩)
    At t >> T1: state relaxes towards |0⟩ (p0 -> 1.0, p1 -> 0.0).
    """
    # Circuit prepares excited state |1⟩
    prep_one = CircuitIR(
        version="1.0",
        qubits=1,
        classicalBits=1,
        operations=[
            GateOperation(id="g-01", gate="X", targets=[0], controls=[], step=0)
        ]
    )
    req = FragilityRequest(
        circuit=prep_one,
        t1_us=20.0,
        t2_us=30.0,
        channel="amplitude_damping"
    )
    res = simulate_fragility(req)

    traj = res["trajectory"]
    assert len(traj) > 10

    # Initial step at t=0
    assert traj[0]["p1"] == 1.0
    assert traj[0]["p0"] == 0.0

    # Final step at t = 3*T1 (approx 95% relaxation to |0⟩)
    last_step = traj[-1]
    assert last_step["p0"] > 0.90
    assert last_step["p1"] < 0.10
    assert last_step["bloch_z"] > 0.80


# ─── Grover's Algorithm Correctness Tests (M06 Correction) ───────────────────

from app.quantum.grover import run_grover, optimal_grover_iterations


def test_grover_2qubit_finds_target_11():
    """Grover on 2 qubits targeting |11⟩: after 1 optimal iteration,
    probability of measuring '11' must exceed 97.5% (exact analytical: 100%).
    Corrects Misconception M06 — Grover is NOT brute-force search.
    """
    result = run_grover(n_qubits=2, target_state="11", shots=2048)

    assert result.optimal_iterations == 1, (
        f"2-qubit Grover requires exactly 1 optimal iteration, got {result.optimal_iterations}"
    )

    # Verify Qiskit statevector probability for target state
    target_prob = result.final_probabilities.get("11", 0.0)
    assert target_prob > 0.975, (
        f"2-qubit Grover targeting '11' must reach P(|11⟩) > 97.5%, got {target_prob:.4f}"
    )

    # Shot counts should heavily favour the target
    target_count = result.counts.get("11", 0)
    total_shots = sum(result.counts.values())
    assert target_count / total_shots > 0.93, (
        f"Shot ratio for '11' should be > 93%, got {target_count / total_shots:.3f}"
    )

    # Amplitude snapshots: iteration 0 = uniform, iteration 1 = amplified
    assert len(result.amplitude_snapshots) == 2  # iter 0 + iter 1
    initial_target_prob = next(
        a.probability for a in result.amplitude_snapshots[0] if a.basis == "11"
    )
    final_target_prob = next(
        a.probability for a in result.amplitude_snapshots[1] if a.basis == "11"
    )
    # After 1 iteration the target amplitude must have grown from 1/N = 0.25
    assert final_target_prob > initial_target_prob, (
        "Target state amplitude must INCREASE after Grover iteration (amplitude amplification)"
    )


def test_grover_3qubit_finds_target_101():
    """Grover on 3 qubits targeting |101⟩: after 2 optimal iterations,
    probability of measuring '101' must exceed 94%.
    Verifies quadratic speedup behaviour (N=8, k=2 iterations, classically needs up to 8 checks).
    """
    result = run_grover(n_qubits=3, target_state="101", shots=2048)

    assert result.optimal_iterations == 2, (
        f"3-qubit Grover requires exactly 2 optimal iterations, got {result.optimal_iterations}"
    )

    target_prob = result.final_probabilities.get("101", 0.0)
    assert target_prob > 0.94, (
        f"3-qubit Grover targeting '101' must reach P(|101⟩) > 94%, got {target_prob:.4f}"
    )

    # Amplitude amplification: each iteration should increase the target amplitude
    assert len(result.amplitude_snapshots) == 3  # iter 0, 1, 2
    prob_iter0 = next(a.probability for a in result.amplitude_snapshots[0] if a.basis == "101")
    prob_iter1 = next(a.probability for a in result.amplitude_snapshots[1] if a.basis == "101")
    prob_iter2 = next(a.probability for a in result.amplitude_snapshots[2] if a.basis == "101")

    assert prob_iter1 > prob_iter0, "Probability must grow after iteration 1"
    assert prob_iter2 > prob_iter1, "Probability must grow after iteration 2"
