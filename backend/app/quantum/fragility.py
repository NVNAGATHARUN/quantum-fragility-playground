"""Physical Kraus Decoherence Simulation Engine for Quantum Lens AI.

Simulates Amplitude Damping (T1), Phase Damping (T2), and Depolarizing noise channels
using open-quantum-system master equation Kraus operators according to Section 41-43 of the SRS.
"""

import math
import numpy as np
from typing import List, Dict, Any, Tuple
from qiskit.quantum_info import Statevector, DensityMatrix

from ..models.circuit_ir import CircuitIR, FragilityRequest
from .simulator import build_qiskit_circuit


# Pauli Matrices
SIGMA_X = np.array([[0, 1], [1, 0]], dtype=complex)
SIGMA_Y = np.array([[0, -1j], [1j, 0]], dtype=complex)
SIGMA_Z = np.array([[1, 0], [0, -1]], dtype=complex)
IDENTITY = np.eye(2, dtype=complex)


def build_amplitude_damping_kraus(gamma: float) -> List[np.ndarray]:
    """Kraus operators for T1 longitudinal energy relaxation."""
    gamma = max(0.0, min(1.0, gamma))
    e0 = np.array([[1.0, 0.0], [0.0, math.sqrt(1.0 - gamma)]], dtype=complex)
    e1 = np.array([[0.0, math.sqrt(gamma)], [0.0, 0.0]], dtype=complex)
    return [e0, e1]


def build_phase_damping_kraus(lam: float) -> List[np.ndarray]:
    """Kraus operators for T2 transverse phase dephasing."""
    lam = max(0.0, min(1.0, lam))
    e0 = np.array([[1.0, 0.0], [0.0, math.sqrt(1.0 - lam)]], dtype=complex)
    e1 = np.array([[0.0, 0.0], [0.0, math.sqrt(lam)]], dtype=complex)
    return [e0, e1]


def build_depolarizing_kraus(p: float) -> List[np.ndarray]:
    """Kraus operators for isotropic depolarizing channel."""
    p = max(0.0, min(1.0, p))
    e0 = math.sqrt(1.0 - 3.0 * p / 4.0) * IDENTITY
    e1 = math.sqrt(p / 4.0) * SIGMA_X
    e2 = math.sqrt(p / 4.0) * SIGMA_Y
    e3 = math.sqrt(p / 4.0) * SIGMA_Z
    return [e0, e1, e2, e3]


def apply_single_qubit_channel(rho: np.ndarray, kraus_ops: List[np.ndarray]) -> np.ndarray:
    """Applies Kraus operators: rho_out = sum_k E_k @ rho @ E_k.conj().T."""
    out = np.zeros_like(rho, dtype=complex)
    for k in kraus_ops:
        out += k @ rho @ k.conj().T
    return out


def simulate_fragility(req: FragilityRequest) -> Dict[str, Any]:
    """Simulates quantum state decoherence under specified physical noise parameters."""
    circuit = req.circuit
    pure_ops = [op for op in circuit.operations if op.gate != "MEASURE"]
    pure_ir = CircuitIR(version=circuit.version, qubits=circuit.qubits, classicalBits=circuit.classicalBits, operations=pure_ops)
    qc = build_qiskit_circuit(pure_ir)
    sv = Statevector.from_instruction(qc)

    # For multi-qubit or single-qubit, we evaluate the first qubit or entire system
    # Here we demonstrate exact single-qubit density matrix evolution on qubit 0
    from qiskit.quantum_info import partial_trace, DensityMatrix
    if circuit.qubits > 1:
        trace_q = [i for i in range(1, circuit.qubits)]
        rho_0 = partial_trace(sv, trace_q).data
    else:
        rho_0 = DensityMatrix(sv).data

    ideal_rho = rho_0.copy()

    # Time series simulation across 50 time steps
    t_max = 3.0 * req.t1_us
    num_steps = 40
    dt_list = np.linspace(0.0, t_max, num_steps)

    trajectory: List[Dict[str, float]] = []

    for t in dt_list:
        gamma = 1.0 - math.exp(-t / req.t1_us) if req.t1_us > 0 else 1.0
        lam = 1.0 - math.exp(-2.0 * t / req.t2_us) if req.t2_us > 0 else 1.0

        current_rho = rho_0.copy()

        if req.channel == "amplitude_damping":
            kraus = build_amplitude_damping_kraus(gamma)
            current_rho = apply_single_qubit_channel(current_rho, kraus)
        elif req.channel == "phase_damping":
            kraus = build_phase_damping_kraus(lam)
            current_rho = apply_single_qubit_channel(current_rho, kraus)
        elif req.channel == "depolarizing":
            p = min(1.0, t / (2.0 * req.t1_us))
            kraus = build_depolarizing_kraus(p)
            current_rho = apply_single_qubit_channel(current_rho, kraus)
        elif req.channel == "combined":
            k_amp = build_amplitude_damping_kraus(gamma)
            current_rho = apply_single_qubit_channel(current_rho, k_amp)
            k_phase = build_phase_damping_kraus(lam)
            current_rho = apply_single_qubit_channel(current_rho, k_phase)

        # Metrics at time t
        rho_00 = float(np.real(current_rho[0, 0]))
        rho_11 = float(np.real(current_rho[1, 1]))
        rho_01 = current_rho[0, 1]

        x = float(2.0 * np.real(rho_01))
        y = float(-2.0 * np.imag(rho_01))
        z = float(rho_00 - rho_11)

        purity = float(np.real(np.trace(current_rho @ current_rho)))
        # Fidelity with ideal pure state F = <psi|rho|psi> = Tr(ideal_rho @ current_rho)
        fidelity = float(np.real(np.trace(ideal_rho @ current_rho)))

        trajectory.append({
            "time_us": round(float(t), 3),
            "fidelity": round(max(0.0, min(1.0, fidelity)), 4),
            "purity": round(max(0.5, min(1.0, purity)), 4),
            "bloch_x": round(x, 4),
            "bloch_y": round(y, 4),
            "bloch_z": round(z, 4),
            "p0": round(rho_00, 4),
            "p1": round(rho_11, 4),
        })

    final_state = trajectory[-1]
    lindblad_limit = 2.0 * req.t1_us
    is_physical = req.t2_us <= (lindblad_limit + 1e-6)

    return {
        "channel": req.channel,
        "t1_us": req.t1_us,
        "t2_us": req.t2_us,
        "lindblad_limit_us": round(lindblad_limit, 2),
        "is_physical": is_physical,
        "initialState": {
            "p0": round(float(np.real(ideal_rho[0, 0])), 4),
            "p1": round(float(np.real(ideal_rho[1, 1])), 4),
            "bloch_z": round(float(np.real(ideal_rho[0, 0] - ideal_rho[1, 1])), 4),
        },
        "finalState": final_state,
        "trajectory": trajectory,
    }
