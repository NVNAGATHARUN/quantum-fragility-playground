"""Grover's Amplitude Amplification Algorithm Engine for Quantum Lens AI.

Implements the canonical Grover oracle + diffusion operator using Qiskit,
producing per-iteration amplitude snapshots to visually demonstrate why
Grover is NOT brute-force search but geometric amplitude amplification
(corrects SRS Misconception M06).

Reference: SRS Build Contract Sections 58-61, AL-03, M06.
"""

import math
from typing import List, Dict, Tuple

import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit.quantum_info import Statevector
from qiskit_aer import AerSimulator

from ..models.circuit_ir import (
    CircuitIR,
    GateOperation,
    NormalizedSimulationResult,
    StateAmplitude,
    BlochVector,
    ReducedSubsystemState,
    TimelineStep,
    SimulationMetrics,
)
from .simulator import compute_reduced_states


# ─── Optimal Iteration Count ─────────────────────────────────────────────────


def optimal_grover_iterations(n_qubits: int) -> int:
    """Returns the theoretically optimal number of Grover iterations: floor(π/4 * √N)."""
    N = 2 ** n_qubits
    return max(1, math.floor(math.pi / 4 * math.sqrt(N)))


# ─── Qiskit Circuit Builders ─────────────────────────────────────────────────


def _build_oracle(n_qubits: int, target_state: str) -> QuantumCircuit:
    """Builds the phase-oracle that flips the amplitude of |target_state⟩.

    Uses a multi-controlled-Z gate with X gates to encode the target.
    For a k-qubit oracle marking |t_{n-1}...t_0⟩:
    - Apply X on qubits where target bit is '0' (to convert to |1...1⟩)
    - Apply multi-controlled-Z (H · MCX · H on target qubit = MCZ)
    - Uncompute X gates
    """
    qc = QuantumCircuit(n_qubits, name="oracle")

    # Convert target_state so qubit 0 = rightmost bit
    target_bits = list(reversed(target_state))  # target_bits[i] is for qubit i

    # Flip qubits where target is '0'
    for i, bit in enumerate(target_bits):
        if bit == "0":
            qc.x(i)

    # Multi-controlled Z: apply Z to qubit 0, controlled by all others
    if n_qubits == 1:
        qc.z(0)
    elif n_qubits == 2:
        qc.cz(0, 1)
    else:
        # MCZ via H-MCX-H pattern
        qc.h(0)
        qc.mcx(list(range(1, n_qubits)), 0)
        qc.h(0)

    # Uncompute X gates
    for i, bit in enumerate(target_bits):
        if bit == "0":
            qc.x(i)

    return qc


def _build_diffusion(n_qubits: int) -> QuantumCircuit:
    """Builds the Grover diffusion operator (inversion about the average).

    D = H⊗n (2|0⟩⟨0| - I) H⊗n
    """
    qc = QuantumCircuit(n_qubits, name="diffusion")

    # H⊗n
    for i in range(n_qubits):
        qc.h(i)

    # 2|0⟩⟨0| - I  via X gates + multi-controlled-Z
    for i in range(n_qubits):
        qc.x(i)

    if n_qubits == 1:
        qc.z(0)
    elif n_qubits == 2:
        qc.cz(0, 1)
    else:
        qc.h(0)
        qc.mcx(list(range(1, n_qubits)), 0)
        qc.h(0)

    for i in range(n_qubits):
        qc.x(i)

    # H⊗n
    for i in range(n_qubits):
        qc.h(i)

    return qc


def build_full_grover_circuit(n_qubits: int, target_state: str, iterations: int) -> QuantumCircuit:
    """Builds the complete Grover circuit with given number of iterations."""
    qc = QuantumCircuit(n_qubits, n_qubits)

    # Step 0: Initialize uniform superposition
    for i in range(n_qubits):
        qc.h(i)

    oracle = _build_oracle(n_qubits, target_state)
    diffusion = _build_diffusion(n_qubits)

    for _ in range(iterations):
        qc.compose(oracle, inplace=True)
        qc.barrier()
        qc.compose(diffusion, inplace=True)
        qc.barrier()

    # Measurement
    for i in range(n_qubits):
        qc.measure(i, i)

    return qc


# ─── Amplitude Snapshots ─────────────────────────────────────────────────────


def grover_amplitude_snapshots(
    n_qubits: int,
    target_state: str,
    max_iterations: int,
) -> List[List[StateAmplitude]]:
    """Returns the statevector amplitude list after each Grover iteration (0..max_iterations).

    Iteration 0 = after H⊗n initialization (uniform superposition).
    Iteration k = after k oracle+diffusion cycles.
    """
    snapshots: List[List[StateAmplitude]] = []
    N = 2 ** n_qubits

    # Start from uniform superposition
    qc = QuantumCircuit(n_qubits)
    for i in range(n_qubits):
        qc.h(i)

    sv = Statevector.from_instruction(qc)
    snapshots.append(_sv_to_amplitudes(sv, n_qubits))

    oracle = _build_oracle(n_qubits, target_state)
    diffusion = _build_diffusion(n_qubits)

    for _ in range(max_iterations):
        qc.compose(oracle, inplace=True)
        qc.compose(diffusion, inplace=True)
        sv = Statevector.from_instruction(qc)
        snapshots.append(_sv_to_amplitudes(sv, n_qubits))

    return snapshots


def _sv_to_amplitudes(sv: Statevector, n_qubits: int) -> List[StateAmplitude]:
    """Converts a Qiskit Statevector into a list of StateAmplitude pydantic models."""
    result = []
    for idx, c in enumerate(sv.data):
        basis = format(idx, f"0{n_qubits}b")
        real = float(np.real(c))
        imag = float(np.imag(c))
        mag = float(np.abs(c))
        phase = float(np.angle(c))
        prob = float(mag ** 2)
        result.append(
            StateAmplitude(
                basis=basis,
                real=round(real, 6),
                imag=round(imag, 6),
                magnitude=round(mag, 6),
                phase=round(phase, 6),
                probability=round(prob, 6),
            )
        )
    return result


# ─── Run Grover End-to-End ───────────────────────────────────────────────────


class GroverRequest:
    def __init__(self, n_qubits: int, target_state: str, shots: int = 1024):
        self.n_qubits = n_qubits
        self.target_state = target_state
        self.shots = shots


class GroverResult:
    def __init__(
        self,
        n_qubits: int,
        target_state: str,
        optimal_iterations: int,
        amplitude_snapshots: List[List[StateAmplitude]],
        final_probabilities: Dict[str, float],
        counts: Dict[str, int],
        circuit_ir: CircuitIR,
        execution_time_ms: float,
    ):
        self.n_qubits = n_qubits
        self.target_state = target_state
        self.optimal_iterations = optimal_iterations
        self.amplitude_snapshots = amplitude_snapshots
        self.final_probabilities = final_probabilities
        self.counts = counts
        self.circuit_ir = circuit_ir
        self.execution_time_ms = execution_time_ms


def run_grover(n_qubits: int, target_state: str, shots: int = 1024) -> GroverResult:
    """Main entry point: runs Grover's algorithm and returns amplitude snapshots + shot results.

    Args:
        n_qubits: Number of qubits (2-4).
        target_state: Binary string, e.g. '11' for n_qubits=2. Length must == n_qubits.
        shots: Number of measurement shots.

    Returns:
        GroverResult with per-iteration amplitude snapshots and final shot counts.

    Raises:
        ValueError: If inputs are invalid.
    """
    import time

    if not (2 <= n_qubits <= 4):
        raise ValueError(f"n_qubits must be between 2 and 4, got {n_qubits}")
    if len(target_state) != n_qubits or not all(b in "01" for b in target_state):
        raise ValueError(
            f"target_state must be a binary string of length {n_qubits}, got '{target_state}'"
        )
    if not (1 <= shots <= 10000):
        raise ValueError(f"shots must be between 1 and 10000, got {shots}")

    t0 = time.perf_counter()

    k = optimal_grover_iterations(n_qubits)

    # Get per-iteration amplitude snapshots (for visualization)
    snapshots = grover_amplitude_snapshots(n_qubits, target_state, k)

    # Final statevector after k iterations (no measurement)
    final_sv_amplitudes = snapshots[-1]
    final_probs: Dict[str, float] = {
        amp.basis: amp.probability for amp in final_sv_amplitudes
    }

    # Execute the same circuit on Aer for actual measured shot counts.
    simulator = AerSimulator()
    circuit = build_full_grover_circuit(n_qubits, target_state, k)
    measured = simulator.run(transpile(circuit, simulator), shots=shots).result().get_counts()
    counts: Dict[str, int] = {basis.replace(' ', ''): int(count) for basis, count in measured.items()}

    # Build CircuitIR representation of Grover circuit for display
    circuit_ir = _build_grover_circuit_ir(n_qubits, target_state, k)

    execution_time_ms = round((time.perf_counter() - t0) * 1000.0, 2)

    return GroverResult(
        n_qubits=n_qubits,
        target_state=target_state,
        optimal_iterations=k,
        amplitude_snapshots=snapshots,
        final_probabilities=final_probs,
        counts=counts,
        circuit_ir=circuit_ir,
        execution_time_ms=execution_time_ms,
    )


def _build_grover_circuit_ir(n_qubits: int, target_state: str, iterations: int) -> CircuitIR:
    """Builds a simplified CircuitIR representation of the Grover circuit for frontend display."""
    ops: List[GateOperation] = []
    step = 0

    # Initial Hadamards
    for q in range(n_qubits):
        ops.append(GateOperation(id=f"g-init-{q}", gate="H", targets=[q], controls=[], step=step))
    step += 1

    for it in range(iterations):
        # Oracle: mark target state with phase flip representation
        # We represent the oracle as X gates + phase marker for display clarity
        target_bits = list(reversed(target_state))
        for q, bit in enumerate(target_bits):
            if bit == "0":
                ops.append(GateOperation(id=f"g-oracle-x-{it}-{q}", gate="X", targets=[q], controls=[], step=step))
        step += 1

        # Multi-qubit Z: represent as CZ chain for 2 qubits, or barrier for n>2
        if n_qubits == 2:
            ops.append(GateOperation(id=f"g-oracle-cz-{it}", gate="CZ", targets=[0], controls=[1], step=step))
        step += 1

        # Uncompute X
        for q, bit in enumerate(target_bits):
            if bit == "0":
                ops.append(GateOperation(id=f"g-oracle-ux-{it}-{q}", gate="X", targets=[q], controls=[], step=step))
        step += 1

        # Diffusion: H - X - MCZ - X - H
        for q in range(n_qubits):
            ops.append(GateOperation(id=f"g-diff-h1-{it}-{q}", gate="H", targets=[q], controls=[], step=step))
        step += 1
        for q in range(n_qubits):
            ops.append(GateOperation(id=f"g-diff-x-{it}-{q}", gate="X", targets=[q], controls=[], step=step))
        step += 1
        if n_qubits == 2:
            ops.append(GateOperation(id=f"g-diff-cz-{it}", gate="CZ", targets=[0], controls=[1], step=step))
        step += 1
        for q in range(n_qubits):
            ops.append(GateOperation(id=f"g-diff-ux-{it}-{q}", gate="X", targets=[q], controls=[], step=step))
        step += 1
        for q in range(n_qubits):
            ops.append(GateOperation(id=f"g-diff-h2-{it}-{q}", gate="H", targets=[q], controls=[], step=step))
        step += 1

    # Measurement
    for q in range(n_qubits):
        ops.append(GateOperation(id=f"g-meas-{q}", gate="MEASURE", targets=[q], controls=[], step=step))

    return CircuitIR(version="1.0", qubits=n_qubits, classicalBits=n_qubits, operations=ops)
