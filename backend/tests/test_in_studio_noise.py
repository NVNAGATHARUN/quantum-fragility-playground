"""Tests for In-Studio Physical Kraus & Lindblad Noise Integration.

Verifies that physical noise models (thermal relaxation, dephasing, depolarizing,
and readout errors) execute through the Qiskit Aer simulation kernel, return dual
ideal vs noisy distributions, enforce Lindblad bounds, and accurately compute fidelity.
"""

import pytest
from app.models.circuit_ir import CircuitIR, GateOperation, NoiseConfig, SimulateRequest
from app.quantum.simulator import simulate_circuit
from app.quantum.multi_backend import simulate_selected_backend


def _bell_circuit() -> CircuitIR:
    return CircuitIR(
        version="1.0",
        qubits=2,
        classicalBits=2,
        operations=[
            GateOperation(gate="H", targets=[0], step=0),
            GateOperation(gate="CX", targets=[1], controls=[0], step=1),
        ],
    )


def test_noiseless_simulation_returns_clean_result():
    circuit = _bell_circuit()
    res = simulate_circuit(circuit, shots=512)
    assert res.backend == "qiskit-aer"
    assert res.noisyCounts is None
    assert res.noisyProbabilities is None
    assert res.fidelity is None
    assert res.counts["00"] + res.counts["11"] >= 500


def test_thermal_relaxation_degrades_bell_state_fidelity():
    circuit = _bell_circuit()
    noise = NoiseConfig(
        enabled=True,
        modelType="thermal_relaxation",
        t1_us=20.0,
        t2_us=15.0,
        gate_time_ns=50.0,
        two_qubit_gate_time_ns=300.0,
    )
    res = simulate_circuit(circuit, shots=1024, noise=noise)

    assert res.noisyCounts is not None
    assert res.noisyProbabilities is not None
    assert res.fidelity is not None
    assert 0.0 < res.fidelity <= 1.0
    assert res.lindbladCompliant is True
    assert "Energy Relaxation" in res.noiseExplanation

    # Under thermal relaxation, state decays toward |00>
    assert res.noisyCounts["00"] > 0
    # Noisy probabilities sum to ~1.0
    assert abs(sum(res.noisyProbabilities.values()) - 1.0) < 0.01


def test_lindblad_bound_violation_clamped_and_flagged():
    circuit = _bell_circuit()
    # T2 = 300 us > 2 * T1 = 200 us -> violates T2 <= 2*T1
    noise = NoiseConfig(
        enabled=True,
        modelType="thermal_relaxation",
        t1_us=100.0,
        t2_us=300.0,
    )
    res = simulate_circuit(circuit, shots=256, noise=noise)

    assert res.lindbladCompliant is False
    assert "Lindblad" in res.noiseExplanation
    assert res.fidelity is not None


def test_depolarizing_channel_creates_noise_floor():
    circuit = _bell_circuit()
    noise = NoiseConfig(
        enabled=True,
        modelType="depolarizing",
        depolarizing_p=0.08,
    )
    res = simulate_circuit(circuit, shots=1024, noise=noise)

    assert res.noisyCounts is not None
    # In ideal Bell state, 01 and 10 have 0 counts
    # With 8% depolarizing noise, leakage into 01 and 10 occurs
    leakage = res.noisyCounts.get("01", 0) + res.noisyCounts.get("10", 0)
    assert leakage > 0
    assert res.fidelity < 0.99
    assert "Depolarizing" in res.noiseExplanation


def test_readout_error_perturbs_measurements():
    circuit = _bell_circuit()
    noise = NoiseConfig(
        enabled=True,
        modelType="readout_error",
        readout_error_p=0.10,
    )
    res = simulate_circuit(circuit, shots=1024, noise=noise)

    assert res.noisyCounts is not None
    # 10% readout error guarantees bit flips
    assert res.noisyCounts.get("01", 0) + res.noisyCounts.get("10", 0) > 0
    assert "Readout error" in res.noiseExplanation


def test_multi_backend_noise_routing():
    circuit = _bell_circuit()
    noise = NoiseConfig(enabled=True, modelType="thermal_relaxation", t1_us=50.0, t2_us=40.0)

    # Aer should succeed
    res = simulate_selected_backend(circuit, backend="qiskit-aer", shots=256, noise=noise)
    assert res.noisyCounts is not None

    # Cirq should raise an informative ValueError asking for Aer
    with pytest.raises(ValueError, match="Qiskit Aer"):
        simulate_selected_backend(circuit, backend="cirq", shots=256, noise=noise)
