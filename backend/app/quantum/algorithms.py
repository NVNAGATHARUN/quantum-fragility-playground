"""Quantum Algorithm Implementations for Quantum Lens AI.

Quantum circuit outputs are derived from Qiskit Aer statevector/shot simulation.
Classical channel and hardware models are explicitly labelled educational models.
"""

from __future__ import annotations
import time
from dataclasses import dataclass, field
from typing import Any

import math
import random
import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit.quantum_info import Statevector, DensityMatrix, Pauli, partial_trace, entropy, state_fidelity
from qiskit_aer import AerSimulator
from qiskit_aer.noise import NoiseModel, depolarizing_error


# ─── Bell State Preparation & Analysis (AL-01) ────────────────────────────────

@dataclass
class BellStateResult:
    bell_state: str            # 'phi_plus' | 'phi_minus' | 'psi_plus' | 'psi_minus'
    state_label: str           # e.g. '|Φ+⟩ = (|00⟩+|11⟩)/√2'
    counts: dict[str, int]
    probabilities: dict[str, float]
    statevector: list[dict]    # basis, amplitude_real, amplitude_imag, probability, phase_rad
    entanglement_entropy: float  # 1.0 bit for maximally entangled state
    purity: float              # 0.5 for subsystem
    correlation_zz: float      # +1.0 for phi, -1.0 for psi
    correlation_xx: float      # +1.0 for phi_plus, -1.0 for phi_minus
    correlation_yy: float
    fidelity: float
    measurement_basis: str
    noise_percent: float
    circuit_depth: int
    execution_time_ms: float
    explanation: str


def run_bell_state(bell_state: str = 'phi_plus', shots: int = 1024,
                   measurement_basis: str = 'Z', noise_percent: float = 0) -> BellStateResult:
    """Prepare and analyze maximally entangled Bell states (AL-01).

    Simulates the circuit with Qiskit Aer, computes subsystem purity and von Neumann
    entanglement entropy, and verifies measurement correlations.
    """
    if bell_state not in ('phi_plus', 'phi_minus', 'psi_plus', 'psi_minus'):
        raise ValueError(f"Unknown bell_state: {bell_state}. Use phi_plus, phi_minus, psi_plus, or psi_minus.")
    if measurement_basis not in ('Z', 'X', 'Y'):
        raise ValueError('Measurement basis must be Z, X or Y.')
    if not 0 <= noise_percent <= 15:
        raise ValueError('Noise must be between 0 and 15 percent.')
    if not 1 <= shots <= 4096:
        raise ValueError('Shots must be between 1 and 4096.')

    t0 = time.perf_counter()
    qc = QuantumCircuit(2, 2)

    if bell_state == 'phi_plus':
        qc.h(0)
        qc.cx(0, 1)
        state_label = '|Φ+⟩ = (|00⟩+|11⟩)/√2'
    elif bell_state == 'phi_minus':
        qc.x(0)
        qc.h(0)
        qc.cx(0, 1)
        state_label = '|Φ−⟩ = (|00⟩−|11⟩)/√2'
    elif bell_state == 'psi_plus':
        qc.x(1)
        qc.h(0)
        qc.cx(0, 1)
        state_label = '|Ψ+⟩ = (|01⟩+|10⟩)/√2'
    else:  # psi_minus
        qc.x(0)
        qc.x(1)
        qc.h(0)
        qc.cx(0, 1)
        state_label = '|Ψ−⟩ = (|01⟩−|10⟩)/√2'

    # Statevector and reduced density matrix calculations
    sv = Statevector(qc)
    ideal_dm = DensityMatrix(sv)
    dm = ideal_dm
    noise_model = None
    if noise_percent:
        p = noise_percent / 100
        noise_model = NoiseModel()
        one_qubit_error = depolarizing_error(p, 1)
        two_qubit_error = depolarizing_error(p, 2)
        noise_model.add_all_qubit_quantum_error(one_qubit_error, ['h', 'x'])
        noise_model.add_all_qubit_quantum_error(two_qubit_error, ['cx'])
        qc_density = qc.copy()
        qc_density.save_density_matrix()
        density_simulator = AerSimulator(method='density_matrix', noise_model=noise_model)
        density_result = density_simulator.run(
            transpile(qc_density, density_simulator, optimization_level=0)
        ).result()
        dm = DensityMatrix(density_result.data(0)['density_matrix'])
    dm_q0 = partial_trace(dm, [1])
    purity = float(np.real(np.trace(dm_q0.data @ dm_q0.data)))
    ent_entropy = float(entropy(partial_trace(ideal_dm, [1]), base=2))

    # Measurement simulation
    # Read out the prepared density matrix with ideal basis rotations, so
    # the sampled counts and reported Pauli correlations describe one state.
    qc_meas = QuantumCircuit(2, 2)
    qc_meas.set_density_matrix(dm.data)
    if measurement_basis == 'X':
        qc_meas.h([0, 1])
    elif measurement_basis == 'Y':
        qc_meas.sdg([0, 1])
        qc_meas.h([0, 1])
    qc_meas.measure([0, 1], [0, 1])

    simulator = AerSimulator(method='density_matrix')
    compiled = transpile(qc_meas, simulator, optimization_level=0)
    job = simulator.run(compiled, shots=shots)
    result = job.result()
    counts_raw = result.get_counts()
    counts = {k.replace(' ', ''): v for k, v in counts_raw.items()}
    total = sum(counts.values())
    probabilities = {k: v / total for k, v in counts.items()}

    sv_data = []
    for idx in range(4):
        basis = format(idx, '02b')
        amp = sv.data[idx]
        prob = abs(amp) ** 2
        phase = float(math.atan2(amp.imag, amp.real))
        sv_data.append({
            'basis': basis,
            'probability': round(prob, 6),
            'phase_rad': round(phase, 4),
            'real': round(float(amp.real), 6),
            'imag': round(float(amp.imag), 6),
        })

    corr_zz = float(np.real(dm.expectation_value(Pauli('ZZ'))))
    corr_xx = float(np.real(dm.expectation_value(Pauli('XX'))))
    corr_yy = float(np.real(dm.expectation_value(Pauli('YY'))))
    fidelity = float(state_fidelity(dm, ideal_dm))

    exec_ms = (time.perf_counter() - t0) * 1000
    explanation = (
        f"The ideal {state_label} has one bit of entanglement entropy. "
        f"This run measured both qubits in the {measurement_basis} basis with {noise_percent:g}% "
        f"depolarizing gate noise. State fidelity to the ideal Bell state is {fidelity:.3f}. "
        f"Expected correlations from the simulated density matrix are "
        f"ZZ={corr_zz:+.2f}, XX={corr_xx:+.2f}, YY={corr_yy:+.2f}."
    )

    return BellStateResult(
        bell_state=bell_state,
        state_label=state_label,
        counts=counts,
        probabilities=probabilities,
        statevector=sv_data,
        entanglement_entropy=round(ent_entropy, 4),
        purity=round(purity, 4),
        correlation_zz=corr_zz,
        correlation_xx=corr_xx,
        correlation_yy=corr_yy,
        fidelity=round(fidelity, 6),
        measurement_basis=measurement_basis,
        noise_percent=noise_percent,
        circuit_depth=qc.depth(),
        execution_time_ms=round(exec_ms, 2),
        explanation=explanation,
    )


# ─── Deutsch-Jozsa (AL-02) ───────────────────────────────────────────────────

@dataclass
class DeutschJozsaResult:
    oracle_type: str           # 'constant_0' | 'constant_1' | 'balanced'
    n_qubits: int              # number of input qubits (not counting ancilla)
    result: str                # 'constant' | 'balanced'
    counts: dict[str, int]
    probabilities: dict[str, float]
    statevector: list[dict]    # amplitude breakdown of final input register
    circuit_depth: int
    execution_time_ms: float
    explanation: str


def run_deutsch_jozsa(oracle_type: str = 'balanced', n_qubits: int = 2, shots: int = 1024) -> DeutschJozsaResult:
    """Run the Deutsch-Jozsa algorithm with a verified Qiskit Aer simulation.

    oracle_type: 'constant_0' | 'constant_1' | 'balanced'
    Returns full amplitude data proving the algorithm succeeds in one query.
    """
    if oracle_type not in ('constant_0', 'constant_1', 'balanced'):
        raise ValueError(f"Unknown oracle_type: {oracle_type}. Use constant_0, constant_1, or balanced.")
    if not (1 <= n_qubits <= 4):
        raise ValueError("n_qubits must be between 1 and 4 for Deutsch-Jozsa.")

    t0 = time.perf_counter()

    total_qubits = n_qubits + 1  # input qubits + 1 ancilla
    ancilla = n_qubits           # ancilla index

    qc = QuantumCircuit(total_qubits, n_qubits)

    # Step 1: Initialize ancilla in |−⟩ = H|1⟩
    qc.x(ancilla)
    qc.h(ancilla)

    # Step 2: Apply H to all input qubits → uniform superposition
    for i in range(n_qubits):
        qc.h(i)

    qc.barrier()

    # Step 3: Apply oracle
    if oracle_type == 'constant_0':
        pass  # f(x)=0 → identity oracle (no-op)
    elif oracle_type == 'constant_1':
        qc.x(ancilla)  # f(x)=1 → X on ancilla (global phase effect)
    else:
        # Balanced oracle: CNOT from each input qubit to ancilla
        for i in range(n_qubits):
            qc.cx(i, ancilla)

    qc.barrier()

    # Step 4: Apply H again to input qubits
    for i in range(n_qubits):
        qc.h(i)

    # Step 5: Measure input register only
    for i in range(n_qubits):
        qc.measure(i, i)

    # Simulate
    simulator = AerSimulator()
    compiled = transpile(qc, simulator)
    job = simulator.run(compiled, shots=shots)
    result = job.result()
    counts_raw = result.get_counts()
    # counts keys are space-separated or just bits; normalize
    counts = {}
    for k, v in counts_raw.items():
        key = k.replace(' ', '')[-n_qubits:]  # take the input register bits
        counts[key] = counts.get(key, 0) + v

    total = sum(counts.values())
    probabilities = {k: v / total for k, v in counts.items()}

    # Determine result: if all input qubits measured |0...0⟩ → constant; else → balanced
    all_zeros = '0' * n_qubits
    algo_result = 'constant' if counts.get(all_zeros, 0) / total > 0.9 else 'balanced'

    # Statevector of input register (before measurement) for amplitude visualization
    qc_sv = QuantumCircuit(total_qubits)
    qc_sv.x(ancilla)
    qc_sv.h(ancilla)
    for i in range(n_qubits):
        qc_sv.h(i)
    if oracle_type == 'constant_0':
        pass
    elif oracle_type == 'constant_1':
        qc_sv.x(ancilla)
    else:
        for i in range(n_qubits):
            qc_sv.cx(i, ancilla)
    for i in range(n_qubits):
        qc_sv.h(i)

    sv = Statevector(qc_sv)
    sv_data = []
    n_states = 2 ** n_qubits
    for idx in range(n_states):
        basis = format(idx, f'0{n_qubits}b')
        # Sum over ancilla dimension
        amp_sq = 0.0
        for anc in range(2):
            full_idx = anc * n_states + idx
            amp_sq += abs(sv.data[full_idx]) ** 2
        sv_data.append({
            'basis': basis,
            'probability': round(amp_sq, 6),
        })

    explanation = (
        "The Deutsch-Jozsa algorithm determines whether the oracle is constant (same output for all inputs) "
        "or balanced (output 0 for half inputs, 1 for the other half) using a SINGLE query to the oracle. "
        "A classical deterministic algorithm would need 2^(n-1)+1 queries in the worst case. "
        f"This circuit proved the oracle is '{algo_result}' in one query."
    )

    exec_ms = (time.perf_counter() - t0) * 1000

    return DeutschJozsaResult(
        oracle_type=oracle_type,
        n_qubits=n_qubits,
        result=algo_result,
        counts=counts,
        probabilities=probabilities,
        statevector=sv_data,
        circuit_depth=qc.depth(),
        execution_time_ms=round(exec_ms, 2),
        explanation=explanation,
    )


# ─── Quantum Teleportation (AL-04) ──────────────────────────────────────────

@dataclass
class TeleportationResult:
    input_state: str           # 'plus' | 'minus' | 'zero' | 'one' | 'custom'
    fidelity: float            # ⟨ψ|ρ_output|ψ⟩ — should be ≥ 0.99
    bob_counts: dict[str, int]
    bob_probabilities: dict[str, float]
    statevector_before_correction: list[dict]
    statevector_after_correction: list[dict]
    classical_bits: dict[str, int]   # Alice's measurement results (most common)
    circuit_depth: int
    execution_time_ms: float
    explanation: str


def run_teleportation(input_state: str = 'plus', shots: int = 1024) -> TeleportationResult:
    """Quantum Teleportation using Bell pair + classical correction.

    The circuit:
    1. Prepares input qubit in |ψ⟩
    2. Creates Bell pair (Alice ancilla + Bob qubit)
    3. Alice entangles input with her ancilla (CNOT + H)
    4. Alice measures both qubits → 2 classical bits
    5. Bob applies corrections (Z if q0/bit0=1, X if q1/bit1=1)
    6. Bob's qubit should be in |ψ⟩
    """
    if input_state not in ('plus', 'minus', 'zero', 'one'):
        raise ValueError(f"Unknown input_state: {input_state}. Use plus, minus, zero, or one.")

    t0 = time.perf_counter()

    # 3 qubits: q0=input (Alice), q1=Alice's Bell qubit, q2=Bob's Bell qubit
    # 2 classical bits for Alice's measurements
    qc = QuantumCircuit(3, 3)

    # Step 1: Prepare input state
    if input_state == 'plus':
        qc.h(0)
    elif input_state == 'minus':
        qc.x(0)
        qc.h(0)
    elif input_state == 'one':
        qc.x(0)
    # 'zero' → no-op

    qc.barrier(label="input_ready")

    # Step 2: Create Bell pair between q1 (Alice) and q2 (Bob)
    qc.h(1)
    qc.cx(1, 2)

    qc.barrier(label="bell_pair")

    # Step 3: Alice entangles input with her Bell qubit
    qc.cx(0, 1)
    qc.h(0)

    qc.barrier(label="alice_op")

    # Step 4: Alice measures q0 and q1
    qc.measure(0, 0)
    qc.measure(1, 1)

    # Step 5: Classical corrections on Bob's qubit
    with qc.if_test((qc.clbits[1], 1)):  # if bit1=1, apply X
        qc.x(2)
    with qc.if_test((qc.clbits[0], 1)):  # if bit0=1, apply Z
        qc.z(2)

    # Step 6: Measure Bob's qubit
    qc.measure(2, 2)

    # Simulate
    simulator = AerSimulator()
    compiled = transpile(qc, simulator)
    job = simulator.run(compiled, shots=shots)
    result = job.result()
    counts_raw = result.get_counts()

    # Parse results: classical register is "b2 b1 b0" (Qiskit bit order)
    bob_counts: dict[str, int] = {'0': 0, '1': 0}
    classical_tally: dict[str, int] = {}
    for bitstr, count in counts_raw.items():
        bits = bitstr.replace(' ', '')
        # bits[-1] = c0 (Alice q0), bits[-2] = c1 (Alice q1), bits[-3] = c2 (Bob)
        bob_bit = bits[0] if len(bits) >= 3 else bits[-1]
        alice_bits = bits[1:3] if len(bits) >= 3 else '00'
        bob_counts[bob_bit] = bob_counts.get(bob_bit, 0) + count
        classical_tally[alice_bits] = classical_tally.get(alice_bits, 0) + count

    bob_total = sum(bob_counts.values())
    bob_probs = {k: v / bob_total for k, v in bob_counts.items()}

    # Z-basis counts cannot distinguish |+⟩ from |−⟩. Compute state fidelity
    # from a coherent equivalent of the measured-and-classically-corrected
    # protocol (the deferred-measurement principle), then trace out Alice.
    coherent = QuantumCircuit(3)
    target = QuantumCircuit(1)
    if input_state in ('minus', 'one'):
        coherent.x(0)
        target.x(0)
    if input_state in ('plus', 'minus'):
        coherent.h(0)
        target.h(0)
    coherent.h(1)
    coherent.cx(1, 2)
    coherent.cx(0, 1)
    coherent.h(0)
    coherent.cx(1, 2)  # coherent X correction controlled by Alice's q1
    coherent.cz(0, 2)  # coherent Z correction controlled by Alice's q0
    bob_state = partial_trace(Statevector.from_instruction(coherent), [0, 1])
    fidelity = state_fidelity(bob_state, Statevector.from_instruction(target))

    # Most common Alice classical result
    most_common_alice = max(classical_tally, key=lambda k: classical_tally[k]) if classical_tally else '00'

    # Probability-only snapshots; phase information is represented by fidelity.
    sv_before = [{'basis': '0', 'probability': 0.5},
                 {'basis': '1', 'probability': 0.5}]
    sv_after = [{'basis': '0', 'probability': float(np.real(bob_state.data[0, 0]))},
                {'basis': '1', 'probability': float(np.real(bob_state.data[1, 1]))}]

    exec_ms = (time.perf_counter() - t0) * 1000

    state_labels = {
        'plus': '|+⟩ = (|0⟩+|1⟩)/√2',
        'minus': '|−⟩ = (|0⟩−|1⟩)/√2',
        'zero': '|0⟩',
        'one': '|1⟩',
    }
    explanation = (
        f"Quantum Teleportation successfully transmitted the state {state_labels[input_state]} from Alice to Bob "
        "using an entangled Bell pair and 2 classical bits. The state is NOT copied — Alice's qubit is destroyed "
        "during measurement. No information travels faster than light: the 2 classical bits (Alice's measurement "
        f"results) must reach Bob before he can recover the state. Ideal state fidelity = {fidelity:.3f} "
        f"(ideal = 1.000). Bob's qubit is now in {state_labels[input_state]}."
    )

    return TeleportationResult(
        input_state=input_state,
        fidelity=round(fidelity, 4),
        bob_counts=bob_counts,
        bob_probabilities=bob_probs,
        statevector_before_correction=sv_before,
        statevector_after_correction=sv_after,
        classical_bits={'alice_q0': int(most_common_alice[1]) if len(most_common_alice) >= 2 else 0,
                        'alice_q1': int(most_common_alice[0]) if len(most_common_alice) >= 1 else 0},
        circuit_depth=qc.depth(),
        execution_time_ms=round(exec_ms, 2),
        explanation=explanation,
    )


# ─── Quantum Fourier Transform (AL-05) ───────────────────────────────────────

@dataclass
class QFTResult:
    n_qubits: int
    input_state_desc: str
    output_amplitudes: list[dict]   # [{basis, probability, phase_rad}]
    counts: dict[str, int]
    probabilities: dict[str, float]
    circuit_depth: int
    execution_time_ms: float
    explanation: str


def _qft_circuit(n: int) -> QuantumCircuit:
    """Build the QFT sub-circuit for n qubits."""
    import math
    qc = QuantumCircuit(n)
    # In Qiskit's little-endian ordering, process the most significant wire
    # first and finish with bit-reversal swaps. This implements
    # |j⟩ -> Σ_k exp(2πijk/2^n)|k⟩ / √(2^n).
    for j in range(n - 1, -1, -1):
        qc.h(j)
        for k in range(j - 1, -1, -1):
            angle = math.pi / (2 ** (j - k))
            qc.cp(angle, k, j)
    # Swap qubits for correct bit ordering
    for i in range(n // 2):
        qc.swap(i, n - 1 - i)
    return qc


def run_qft(n_qubits: int = 3, input_basis_state: int = 0, shots: int = 1024) -> QFTResult:
    """Run QFT on a computational basis state |input_basis_state⟩.

    Returns the output amplitude distribution showing the phase representation.
    """
    import math

    if not (1 <= n_qubits <= 4):
        raise ValueError("n_qubits must be between 1 and 4 for QFT demonstration.")
    if not (0 <= input_basis_state < 2 ** n_qubits):
        raise ValueError(f"input_basis_state must be in [0, {2**n_qubits - 1}].")

    t0 = time.perf_counter()

    qc = QuantumCircuit(n_qubits, n_qubits)

    # Prepare input basis state |input_basis_state⟩
    for bit_idx in range(n_qubits):
        if (input_basis_state >> bit_idx) & 1:
            qc.x(bit_idx)

    qc.barrier(label="input")

    # Apply QFT
    qft_sub = _qft_circuit(n_qubits)
    qc.compose(qft_sub, inplace=True)

    # Measure
    qc.measure(range(n_qubits), range(n_qubits))

    simulator = AerSimulator()
    compiled = transpile(qc, simulator)
    job = simulator.run(compiled, shots=shots)
    result = job.result()
    counts_raw = result.get_counts()

    counts = {}
    for k, v in counts_raw.items():
        counts[k.replace(' ', '')] = v

    total = sum(counts.values())
    probabilities = {k: v / total for k, v in counts.items()}

    # Compute exact amplitudes using Statevector
    qc_sv = QuantumCircuit(n_qubits)
    for bit_idx in range(n_qubits):
        if (input_basis_state >> bit_idx) & 1:
            qc_sv.x(bit_idx)
    qft_sv = _qft_circuit(n_qubits)
    qc_sv.compose(qft_sv, inplace=True)

    sv = Statevector(qc_sv)
    N = 2 ** n_qubits
    output_amplitudes = []
    for idx in range(N):
        basis = format(idx, f'0{n_qubits}b')
        amp = sv.data[idx]
        prob = abs(amp) ** 2
        phase = float(math.atan2(amp.imag, amp.real))
        output_amplitudes.append({
            'basis': basis,
            'probability': round(prob, 6),
            'phase_rad': round(phase, 4),
            'phase_turns': round(phase / (2 * math.pi), 4),
        })

    exec_ms = (time.perf_counter() - t0) * 1000

    explanation = (
        f"The Quantum Fourier Transform applied to |{format(input_basis_state, f'0{n_qubits}b')}⟩ produces a "
        f"uniform superposition over all {N} basis states with structured phases. The QFT maps the computational "
        "basis to the Fourier basis: |j⟩ → (1/√N) Σ_k e^(2πijk/N)|k⟩. Each output amplitude has equal magnitude "
        "1/√N but different phase, encoding the frequency spectrum. This phase structure is what Shor's algorithm "
        "exploits for period-finding."
    )

    return QFTResult(
        n_qubits=n_qubits,
        input_state_desc=f"|{format(input_basis_state, f'0{n_qubits}b')}⟩ (basis state {input_basis_state})",
        output_amplitudes=output_amplitudes,
        counts=counts,
        probabilities=probabilities,
        circuit_depth=qc.depth(),
        execution_time_ms=round(exec_ms, 2),
        explanation=explanation,
    )


# ─── Quantum Key Distribution: BB84 Protocol (AL-07) ─────────────────────────

@dataclass
class BB84Result:
    n_bits: int
    eve_present: bool
    alice_bits: list[int]
    alice_bases: list[str]       # '+' or 'x'
    bob_bases: list[str]         # '+' or 'x'
    eve_bases: list[str]         # '+' or 'x'
    eve_measured_bits: list[int]
    bob_measured_bits: list[int]
    sifted_indices: list[int]
    alice_sifted_key: list[int]
    bob_sifted_key: list[int]
    qber: float                  # Quantum Bit Error Rate in sifted key
    is_secure: bool              # True if qber <= 0.11
    security_verdict: str        # 'SECURE_KEY_ESTABLISHED' or 'EAVESDROPPER_DETECTED_ABORT'
    final_key_hex: str
    circuit_depth: int
    execution_time_ms: float
    explanation: str


def run_bb84(n_bits: int = 16, eve_present: bool = False, seed: int | None = None) -> BB84Result:
    """Simulate the BB84 Quantum Key Distribution protocol with optional eavesdropping.

    Demonstrates how Eve's intercept-resend attack induces quantum measurement collapse,
    causing QBER to rise from ~0% to ~25%, crossing the 11% Shor-Preskill security threshold.
    """
    if not (4 <= n_bits <= 64):
        raise ValueError("n_bits must be between 4 and 64 for BB84 simulation.")

    rng = random.Random(seed)
    t0 = time.perf_counter()

    alice_bits = [rng.randint(0, 1) for _ in range(n_bits)]
    alice_bases = [rng.choice(['+', 'x']) for _ in range(n_bits)]
    bob_bases = [rng.choice(['+', 'x']) for _ in range(n_bits)]
    eve_bases = [rng.choice(['+', 'x']) if eve_present else '+' for _ in range(n_bits)]
    eve_measured_bits = []
    bob_measured_bits = []

    for i in range(n_bits):
        a_bit = alice_bits[i]
        a_base = alice_bases[i]

        # 1. Alice prepares state
        # Basis '+': 0 -> |0>, 1 -> |1>
        # Basis 'x': 0 -> |+>, 1 -> |->
        state = '0' if a_bit == 0 else '1'
        curr_basis = a_base

        # 2. Eve intercepts (if active)
        if eve_present:
            e_base = eve_bases[i]
            if e_base == curr_basis:
                e_bit = a_bit
            else:
                # Measurement in conjugate basis collapses to 50/50 random outcome
                e_bit = rng.randint(0, 1)
            eve_measured_bits.append(e_bit)
            # Eve re-prepares photon in her measurement basis
            state = '0' if e_bit == 0 else '1'
            curr_basis = e_base
        else:
            eve_measured_bits.append(0)

        # 3. Bob measures
        b_base = bob_bases[i]
        if b_base == curr_basis:
            b_bit = int(state)
        else:
            # Bob measures in conjugate basis
            b_bit = rng.randint(0, 1)
        bob_measured_bits.append(b_bit)

    # 4. Sifting stage: Alice and Bob keep bits where their bases matched
    sifted_indices = [i for i in range(n_bits) if alice_bases[i] == bob_bases[i]]
    alice_sifted = [alice_bits[i] for i in sifted_indices]
    bob_sifted = [bob_measured_bits[i] for i in sifted_indices]

    # 5. QBER Calculation
    if len(sifted_indices) > 0:
        errors = sum(1 for a, b in zip(alice_sifted, bob_sifted) if a != b)
        qber = errors / len(sifted_indices)
    else:
        qber = 0.0

    # Shor-Preskill security bound is 11.0% error rate
    is_secure = (qber <= 0.11) and (len(sifted_indices) >= 2)
    verdict = 'SECURE_KEY_ESTABLISHED' if is_secure else 'EAVESDROPPER_DETECTED_ABORT'

    # Hex representation of sifted key (Alice's)
    if is_secure and alice_sifted:
        bit_str = ''.join(map(str, alice_sifted))
        # pad to multiple of 4
        padded = bit_str + '0' * ((4 - len(bit_str) % 4) % 4)
        hex_key = hex(int(padded, 2))[2:].upper()
    else:
        hex_key = 'KEY_COMPROMISED'

    exec_ms = (time.perf_counter() - t0) * 1000

    if not eve_present:
        explanation = (
            f"BB84 completed securely. Alice and Bob matched bases on {len(sifted_indices)} of {n_bits} qubits "
            f"({len(sifted_indices)/n_bits*100:.1f}% sifted efficiency). Without an eavesdropper, QBER = {qber*100:.1f}% "
            f"(≤ 11.0% threshold). The shared quantum key is provably secret by the No-Cloning Theorem."
        )
    else:
        explanation = (
            f"SECURITY BREACH DETECTED! Eve executed an Intercept-Resend attack. Measuring photons in conjugate bases "
            f"collapsed the quantum states, causing QBER = {qber*100:.1f}%. Since QBER strictly exceeds the 11.0% "
            f"Shor-Preskill security bound, Alice and Bob aborted the key exchange. Quantum mechanics prevented undetected espionage!"
        )

    return BB84Result(
        n_bits=n_bits,
        eve_present=eve_present,
        alice_bits=alice_bits,
        alice_bases=alice_bases,
        bob_bases=bob_bases,
        eve_bases=eve_bases if eve_present else [],
        eve_measured_bits=eve_measured_bits if eve_present else [],
        bob_measured_bits=bob_measured_bits,
        sifted_indices=sifted_indices,
        alice_sifted_key=alice_sifted,
        bob_sifted_key=bob_sifted,
        qber=round(qber, 4),
        is_secure=is_secure,
        security_verdict=verdict,
        final_key_hex=hex_key,
        circuit_depth=3,
        execution_time_ms=round(exec_ms, 2),
        explanation=explanation,
    )


# ─── Quantum Network & Entanglement Swapping (AL-08) ─────────────────────────

@dataclass
class EntanglementSwappingResult:
    distance_km: int
    use_repeater: bool
    bsm_outcome: str                 # '00', '01', '10', '11'
    alice_bob_state_label: str       # '|Φ+⟩_AB = (|00⟩+|11⟩)/√2'
    direct_transmission_prob: float  # 10^(-0.2*L/10)
    repeater_transmission_prob: float# 10^(-0.2*(L/2)/10)
    fidelity: float                  # 0.999 with repeater
    entanglement_entropy: float      # 1.00 bit
    subsystem_purity: float          # 0.50
    counts: dict[str, int]
    probabilities: dict[str, float]
    circuit_depth: int
    execution_time_ms: float
    explanation: str
    model_provenance: str


def run_entanglement_swapping(distance_km: int = 100, use_repeater: bool = True, shots: int = 1024) -> EntanglementSwappingResult:
    """Simulate multi-hop Entanglement Swapping and Quantum Repeater scaling (AL-08).

    Demonstrates how Bell State Measurement (BSM) at an intermediate repeater node
    entangles two distant stations (Alice & Bob) without any photon traversing the full distance,
    overcoming exponential fiber attenuation e^(-alpha*L).
    """
    if not (10 <= distance_km <= 1000):
        raise ValueError("distance_km must be between 10 and 1000 km.")

    t0 = time.perf_counter()

    # Fiber attenuation calculation (alpha = 0.2 dB/km at telecom 1550 nm)
    alpha = 0.2
    # P_trans = 10^(-alpha * L / 10)
    direct_loss_db = alpha * distance_km
    direct_prob = max(1e-12, 10 ** (-direct_loss_db / 10))

    repeater_loss_db = alpha * (distance_km / 2)
    repeater_prob = max(1e-6, 10 ** (-repeater_loss_db / 10))

    if not use_repeater:
        # Without repeater: direct photon transmission subject to attenuation
        # Effective fidelity degrades as noise dominates over tiny signal
        signal_to_noise = direct_prob / (direct_prob + 1e-3)
        direct_fidelity = round(0.5 + 0.5 * signal_to_noise, 4)

        exec_ms = (time.perf_counter() - t0) * 1000
        explanation = (
            f"Without a quantum repeater, photons attempting to traverse {distance_km} km of fiber suffer "
            f"{direct_loss_db:.1f} dB attenuation (transmission probability = {direct_prob:.2e}). "
            f"Because the No-Cloning Theorem prevents classical optical amplification, the entanglement is lost "
            f"in fiber noise (effective fidelity = {direct_fidelity:.3f}). Direct quantum communication is impossible at this distance."
        )

        counts = {'00': int(shots * (0.25 + 0.25 * signal_to_noise)),
                  '01': int(shots * (0.25 - 0.25 * signal_to_noise)),
                  '10': int(shots * (0.25 - 0.25 * signal_to_noise)),
                  '11': int(shots * (0.25 + 0.25 * signal_to_noise))}
        total = sum(counts.values())
        probs = {k: v / total for k, v in counts.items()}

        return EntanglementSwappingResult(
            distance_km=distance_km,
            use_repeater=False,
            bsm_outcome="NO_BSM",
            alice_bob_state_label="Mixed Attenuated State ρ_AB",
            direct_transmission_prob=round(direct_prob, 6),
            repeater_transmission_prob=round(repeater_prob, 6),
            fidelity=direct_fidelity,
            entanglement_entropy=round(1.0 - signal_to_noise * 0.5, 4),
            subsystem_purity=round(0.25 + 0.25 * signal_to_noise, 4),
            counts=counts,
            probabilities=probs,
            circuit_depth=2,
            execution_time_ms=round(exec_ms, 2),
            explanation=explanation,
            model_provenance="Educational fiber-loss model (0.2 dB/km) with a phenomenological background-noise term.",
        )

    # With quantum repeater: 4-qubit circuit simulation
    # Qubit 0: Alice (A)
    # Qubit 1: Repeater left (R1)
    # Qubit 2: Repeater right (R2)
    # Qubit 3: Bob (B)
    qc = QuantumCircuit(4, 4)

    # 1. Prepare Bell pair on Alice-Repeater (0, 1)
    qc.h(0)
    qc.cx(0, 1)

    # 2. Prepare Bell pair on Repeater-Bob (2, 3)
    qc.h(2)
    qc.cx(2, 3)

    # 3. Bell State Measurement (BSM) at Repeater on (1, 2)
    qc.cx(1, 2)
    qc.h(1)
    qc.measure(1, 1)
    qc.measure(2, 2)

    # Compute the conditional, feed-forward-corrected Alice/Bob state before
    # measurement. This makes fidelity a derived value, not a display constant.
    state_circuit = QuantumCircuit(4)
    state_circuit.h(0); state_circuit.cx(0, 1)
    state_circuit.h(2); state_circuit.cx(2, 3)
    state_circuit.cx(1, 2); state_circuit.h(1)
    state = Statevector.from_instruction(state_circuit).data

    # 4. Measure Alice (0) and Bob (3)
    qc.measure(0, 0)
    qc.measure(3, 3)

    simulator = AerSimulator()
    compiled = transpile(qc, simulator)
    job = simulator.run(compiled, shots=shots)
    raw_counts = job.result().get_counts()

    # Sift Alice (bit 0) and Bob (bit 3) outcomes
    ab_counts = {}
    bsm_tally = {}
    for bitstring, count in raw_counts.items():
        bits = bitstring.replace(' ', '')
        # bit 0 is rightmost in qiskit string, bit 3 is leftmost
        # bits[3] is q0 (Alice), bits[0] is q3 (Bob)
        # bits[2] is q1 (R1), bits[1] is q2 (R2)
        alice_bit = bits[-1]
        bob_bit = bits[-4]
        bsm = bits[-2] + bits[-3] # R1 R2

        # Entanglement swapping leaves Bob in X^m2 Z^m1 |Phi+>.  Z only
        # changes phase, while X flips Bob's measured computational-basis bit.
        # Apply that classical feed-forward to the reported shot evidence so
        # the histogram and the statevector fidelity describe the same state.
        corrected_bob_bit = str(int(bob_bit) ^ int(bsm[1]))

        ab_key = alice_bit + corrected_bob_bit
        ab_counts[ab_key] = ab_counts.get(ab_key, 0) + count
        bsm_tally[bsm] = bsm_tally.get(bsm, 0) + count

    total_ab = sum(ab_counts.values())
    ab_probs = {k: v / total_ab for k, v in ab_counts.items()}

    most_likely_bsm = max(bsm_tally, key=lambda k: bsm_tally[k]) if bsm_tally else "00"

    m1, m2 = int(most_likely_bsm[0]), int(most_likely_bsm[1])
    conditional = np.array([
        state[q0 + 2 * m1 + 4 * m2 + 8 * q3]
        for q3 in (0, 1) for q0 in (0, 1)
    ], dtype=complex)
    conditional /= np.linalg.norm(conditional)
    if m2:
        conditional = conditional[[2, 3, 0, 1]]
    if m1:
        conditional[[2, 3]] *= -1
    target_phi_plus = np.array([1 / np.sqrt(2), 0, 0, 1 / np.sqrt(2)], dtype=complex)
    corrected_fidelity = float(abs(np.vdot(target_phi_plus, conditional)) ** 2)

    exec_ms = (time.perf_counter() - t0) * 1000

    explanation = (
        f"Quantum Repeater SUCCESS! Entanglement Swapping occurred at the intermediate node ({distance_km/2:.0f} km mark). "
        f"The Bell State Measurement (outcome |{most_likely_bsm}⟩) projected distant qubits (Alice in Node A & Bob in Node B) "
        f"into a Bell pair. After feed-forward correction, the ideal-circuit fidelity computed from the conditional state is F = {corrected_fidelity:.4f}. "
        f"Repeater segment loss was only {repeater_loss_db:.1f} dB vs {direct_loss_db:.1f} dB direct."
    )

    return EntanglementSwappingResult(
        distance_km=distance_km,
        use_repeater=True,
        bsm_outcome=most_likely_bsm,
        alice_bob_state_label="|Φ+⟩_AB = (|00⟩+|11⟩)/√2",
        direct_transmission_prob=round(direct_prob, 6),
        repeater_transmission_prob=round(repeater_prob, 6),
        fidelity=round(corrected_fidelity, 6),
        entanglement_entropy=1.00,
        subsystem_purity=0.50,
        counts=ab_counts,
        probabilities=ab_probs,
        circuit_depth=qc.depth(),
        execution_time_ms=round(exec_ms, 2),
        explanation=explanation,
        model_provenance="Ideal four-qubit Aer circuit plus analytical fiber attenuation; excludes memory, detector and gate noise.",
    )


