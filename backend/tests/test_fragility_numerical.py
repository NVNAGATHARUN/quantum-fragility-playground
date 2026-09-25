import pytest
import math
from app.models.circuit_ir import CircuitIR, GateOperation, FragilityRequest
from app.quantum.fragility import simulate_fragility


def test_pure_dephasing_phase_damping_t2():
    """Under pure phase damping (T2 dephasing) on state |+⟩:
    1. Populations p0 and p1 must remain exactly 0.5 (no energy exchange).
    2. Coherence (bloch_x) must decay strictly as exp(-t / T2).
    3. Fidelity F(t) = (1 + exp(-t / T2)) / 2.
    """
    prep_plus = CircuitIR(
        version="1.0",
        qubits=1,
        classicalBits=1,
        operations=[
            GateOperation(id="g-01", gate="H", targets=[0], controls=[], step=0)
        ]
    )
    t2_val = 50.0
    req = FragilityRequest(
        circuit=prep_plus,
        t1_us=100.0,
        t2_us=t2_val,
        channel="phase_damping"
    )
    res = simulate_fragility(req)
    traj = res["trajectory"]
    assert len(traj) >= 40

    for step in traj:
        # Populations must never change under pure dephasing
        assert abs(step["p0"] - 0.5) < 1e-3
        assert abs(step["p1"] - 0.5) < 1e-3
        assert abs(step["bloch_z"]) < 1e-3

        t = step["time_us"]
        expected_x = math.exp(-t / t2_val)
        expected_fidelity = (1.0 + expected_x) / 2.0

        # Verify numerical accuracy against theoretical Lindblad solution
        assert abs(step["bloch_x"] - expected_x) < 0.02
        assert abs(step["fidelity"] - expected_fidelity) < 0.02


def test_depolarizing_channel_shrinks_to_maximally_mixed():
    """Depolarizing channel shrinks Bloch sphere uniformly toward the center.
    Purity Tr(rho^2) decays from 1.0 (pure) to 0.5 (maximally mixed).
    """
    prep_state = CircuitIR(
        version="1.0",
        qubits=1,
        classicalBits=1,
        operations=[
            GateOperation(id="g-01", gate="H", targets=[0], controls=[], step=0)
        ]
    )
    req = FragilityRequest(
        circuit=prep_state,
        t1_us=20.0,
        t2_us=20.0,
        channel="depolarizing"
    )
    res = simulate_fragility(req)
    traj = res["trajectory"]

    # Initial purity = 1.0
    assert traj[0]["purity"] == 1.0

    # Final purity decays towards 0.5
    assert traj[-1]["purity"] < 0.65
    assert traj[-1]["fidelity"] < 0.65


def test_combined_channel_convergence():
    """Combined channel applies both T1 energy loss and T2 phase loss."""
    prep_state = CircuitIR(
        version="1.0",
        qubits=1,
        classicalBits=1,
        operations=[
            GateOperation(id="g-01", gate="H", targets=[0], controls=[], step=0)
        ]
    )
    req = FragilityRequest(
        circuit=prep_state,
        t1_us=30.0,
        t2_us=20.0,
        channel="combined"
    )
    res = simulate_fragility(req)
    traj = res["trajectory"]

    # At late times, state decays towards ground state |0> (p0 -> 1)
    assert traj[-1]["p0"] > 0.85
    assert abs(traj[-1]["bloch_x"]) < 0.05


def test_amplitude_damping_t1_relaxation():
    """Phase 12: Under amplitude damping on excited state |1⟩:
    1. Population p1 decays exponentially as exp(-t / T1).
    2. Population p0 grows as 1 - exp(-t / T1).
    3. Statevector moves vertically from South pole (z=-1) towards North pole (z=1).
    """
    prep_one = CircuitIR(
        version="1.0",
        qubits=1,
        classicalBits=1,
        operations=[
            GateOperation(id="g-x", gate="X", targets=[0], controls=[], step=0)
        ]
    )
    t1_val = 40.0
    req = FragilityRequest(
        circuit=prep_one,
        t1_us=t1_val,
        t2_us=30.0,
        channel="amplitude_damping"
    )
    res = simulate_fragility(req)
    assert res["is_physical"] is True
    assert res["lindblad_limit_us"] == 80.0
    traj = res["trajectory"]

    # Initial state is |1⟩: p0=0, p1=1, bloch_z=-1
    assert traj[0]["p1"] == 1.0
    assert traj[0]["p0"] == 0.0
    assert traj[0]["bloch_z"] == -1.0

    for step in traj:
        t = step["time_us"]
        expected_p1 = math.exp(-t / t1_val)
        expected_p0 = 1.0 - expected_p1
        assert abs(step["p1"] - expected_p1) < 0.02
        assert abs(step["p0"] - expected_p0) < 0.02

    # At late times, excited state population has decayed towards ground state
    assert traj[-1]["p0"] > 0.90
    assert traj[-1]["bloch_z"] > 0.80
