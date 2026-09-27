"""Qiskit Aer Quantum Simulation Kernel for Quantum Lens AI.

Calculates exact complex statevectors, shot measurements, basis probabilities,
phase angles, reduced density matrices, and purity according to the SRS Build Contract.
"""

import time
import math
import numpy as np
from typing import List, Dict, Tuple, Optional
from qiskit import QuantumCircuit, transpile
from qiskit.quantum_info import Statevector, partial_trace, DensityMatrix
from qiskit_aer import AerSimulator

from ..models.circuit_ir import (
    CircuitIR,
    NormalizedSimulationResult,
    StateAmplitude,
    BlochVector,
    ReducedSubsystemState,
    TimelineStep,
    SimulationMetrics,
)
from .validator import validate_circuit_ir


def build_qiskit_circuit(circuit: CircuitIR, up_to_step: Optional[int] = None) -> QuantumCircuit:
    """Constructs a qiskit.QuantumCircuit from Canonical CircuitIR."""
    qc = QuantumCircuit(circuit.qubits, circuit.classicalBits)

    def _get_step(op):
        return op.step if op.step is not None else 0

    # Sort operations by step if steps are specified, preserving order
    sorted_ops = sorted(circuit.operations, key=_get_step) if any(op.step is not None for op in circuit.operations) else circuit.operations

    for idx, op in enumerate(sorted_ops):
        op_step = op.step if op.step is not None else idx
        if up_to_step is not None and op_step > up_to_step:
            break

        gate = (op.gate or "").upper()
        op_type = op.type.upper()
        targets = op.targets
        controls = op.controls
        params = op.params

        def _get_param(p_idx: int = 0) -> float:
            if isinstance(params, list) and len(params) > p_idx:
                return float(params[p_idx])
            if hasattr(params, "theta") and p_idx == 0 and params.theta is not None:
                return float(params.theta)
            if hasattr(params, "phi") and p_idx == 1 and params.phi is not None:
                return float(params.phi)
            if hasattr(params, "lam") and p_idx == 2 and params.lam is not None:
                return float(params.lam)
            return 0.0

        if op_type == "MEASURE" or gate == "MEASURE":
            c_bit = op.classicalTargets[0] if op.classicalTargets else (targets[0] if targets and targets[0] < circuit.classicalBits else 0)
            if targets:
                qc.measure(targets[0], c_bit)
        elif op_type == "RESET" or gate == "RESET":
            if targets:
                qc.reset(targets[0])
        elif op_type in ("BARRIER", "DIRECTIVE") or gate == "BARRIER":
            if targets:
                qc.barrier(*targets)
            else:
                qc.barrier()
        elif gate == "H":
            qc.h(targets[0])
        elif gate == "X":
            qc.x(targets[0])
        elif gate == "Y":
            qc.y(targets[0])
        elif gate == "Z":
            qc.z(targets[0])
        elif gate == "S":
            qc.s(targets[0])
        elif gate == "T":
            qc.t(targets[0])
        elif gate == "SDG":
            qc.sdg(targets[0])
        elif gate == "TDG":
            qc.tdg(targets[0])
        elif gate == "RX":
            qc.rx(_get_param(0), targets[0])
        elif gate == "RY":
            qc.ry(_get_param(0), targets[0])
        elif gate == "RZ":
            qc.rz(_get_param(0), targets[0])
        elif gate == "P":
            qc.p(_get_param(0), targets[0])
        elif gate == "U":
            qc.u(_get_param(0), _get_param(1), _get_param(2), targets[0])
        elif gate == "CX":
            ctrl = controls[0] if controls else targets[0]
            tgt = targets[0] if controls else targets[1]
            qc.cx(ctrl, tgt)
        elif gate == "CY":
            ctrl = controls[0] if controls else targets[0]
            tgt = targets[0] if controls else targets[1]
            qc.cy(ctrl, tgt)
        elif gate == "CZ":
            ctrl = controls[0] if controls else targets[0]
            tgt = targets[0] if controls else targets[1]
            qc.cz(ctrl, tgt)
        elif gate == "CH":
            ctrl = controls[0] if controls else targets[0]
            tgt = targets[0] if controls else targets[1]
            qc.ch(ctrl, tgt)
        elif gate == "CRX":
            ctrl = controls[0] if controls else targets[0]
            tgt = targets[0] if controls else targets[1]
            qc.crx(_get_param(0), ctrl, tgt)
        elif gate == "CRY":
            ctrl = controls[0] if controls else targets[0]
            tgt = targets[0] if controls else targets[1]
            qc.cry(_get_param(0), ctrl, tgt)
        elif gate == "CRZ":
            ctrl = controls[0] if controls else targets[0]
            tgt = targets[0] if controls else targets[1]
            qc.crz(_get_param(0), ctrl, tgt)
        elif gate == "CP":
            ctrl = controls[0] if controls else targets[0]
            tgt = targets[0] if controls else targets[1]
            qc.cp(_get_param(0), ctrl, tgt)
        elif gate == "SWAP":
            qc.swap(targets[0], targets[1])
        elif gate == "CCX":
            ctrl1 = controls[0] if len(controls) > 0 else targets[0]
            ctrl2 = controls[1] if len(controls) > 1 else targets[1]
            tgt = targets[0] if len(controls) >= 2 else targets[2]
            qc.ccx(ctrl1, ctrl2, tgt)
        elif gate == "CSWAP":
            ctrl = controls[0] if controls else targets[0]
            t1 = targets[0] if controls else targets[1]
            t2 = targets[1] if controls else targets[2]
            qc.cswap(ctrl, t1, t2)

    return qc


def compute_reduced_states(sv: Statevector, num_qubits: int) -> List[ReducedSubsystemState]:
    """Computes exact reduced density matrix, Bloch vector, purity, and entanglement entropy per qubit."""
    reduced_states: List[ReducedSubsystemState] = []

    for q in range(num_qubits):
        trace_qubits = [i for i in range(num_qubits) if i != q]
        if trace_qubits:
            rho = partial_trace(sv, trace_qubits)
        else:
            rho = DensityMatrix(sv)

        data = rho.data
        rho_00 = float(np.real(data[0, 0]))
        rho_11 = float(np.real(data[1, 1]))
        rho_01 = data[0, 1]

        x = float(2.0 * np.real(rho_01))
        y = float(-2.0 * np.imag(rho_01))
        z = float(rho_00 - rho_11)

        r = math.sqrt(max(0.0, x**2 + y**2 + z**2))
        purity = float(np.real(np.trace(data @ data)))
        is_entangled = purity < 0.999

        # Von Neumann Entropy
        l1 = (1.0 + r) / 2.0
        l2 = (1.0 - r) / 2.0
        entropy = 0.0
        if l1 > 1e-12:
            entropy -= l1 * math.log2(l1)
        if l2 > 1e-12:
            entropy -= l2 * math.log2(l2)

        reduced_states.append(
            ReducedSubsystemState(
                qubit=q,
                blochVector=BlochVector(x=round(x, 5), y=round(y, 5), z=round(z, 5)),
                purity=round(purity, 5),
                isEntangled=is_entangled,
                entropy=round(entropy, 5),
            )
        )

    return reduced_states


def simulate_circuit(circuit: CircuitIR, shots: int = 1024) -> NormalizedSimulationResult:
    """Execute CircuitIR shots with Aer and return an ideal state preview.

    Counts always come from the full circuit, including intermediate measurements
    and reset operations. The statevector/reduced-state fields describe the
    pure state immediately before the first non-unitary operation because a
    single statevector cannot represent the later mixed ensemble.
    """
    valid, err = validate_circuit_ir(circuit)
    if not valid:
        raise ValueError(err)

    t0 = time.perf_counter()
    num_qubits = circuit.qubits

    # 1. Ideal preview without non-unitary operations.
    first_non_unitary = next((i for i, op in enumerate(circuit.operations) if op.gate in ("MEASURE", "RESET")), len(circuit.operations))
    pure_ops = circuit.operations[:first_non_unitary]
    pure_ir = CircuitIR(version=circuit.version, qubits=num_qubits, classicalBits=circuit.classicalBits, operations=pure_ops)
    qc_pure = build_qiskit_circuit(pure_ir)
    sv = Statevector.from_instruction(qc_pure)

    # 2. Extract statevector amplitudes & probabilities
    statevector_list: List[StateAmplitude] = []
    probabilities_dict: Dict[str, float] = {}

    for idx, c in enumerate(sv.data):
        basis = format(idx, f"0{num_qubits}b")
        real = float(np.real(c))
        imag = float(np.imag(c))
        mag = float(np.abs(c))
        phase = float(np.angle(c))
        prob = float(mag**2)

        probabilities_dict[basis] = round(prob, 5)
        statevector_list.append(
            StateAmplitude(
                basis=basis,
                real=round(real, 5),
                imag=round(imag, 5),
                magnitude=round(mag, 5),
                phase=round(phase, 5),
                probability=round(prob, 5),
            )
        )

    # 3. Execute the full circuit on Aer. Final measurements are appended so
    # returned counts always describe the state after the complete circuit.
    # Visual/code-first circuits legitimately contain no classical register.
    # Allocate a readout register in an execution-only copy instead of forcing
    # the editor's unitary CircuitIR to carry synthetic measurement metadata.
    readout_ir = CircuitIR(
        version=circuit.version,
        qubits=num_qubits,
        classicalBits=max(circuit.classicalBits, num_qubits),
        operations=circuit.operations,
    )
    qc_shots = build_qiskit_circuit(readout_ir)
    for qubit in range(num_qubits):
        qc_shots.measure(qubit, qubit)
    aer = AerSimulator()
    raw_counts = aer.run(transpile(qc_shots, aer), shots=shots).result().get_counts()
    counts = {str(key).replace(" ", ""): int(value) for key, value in raw_counts.items()}
    for idx in range(2 ** num_qubits):
        counts.setdefault(format(idx, f"0{num_qubits}b"), 0)

    has_non_unitary = any(op.gate in ("MEASURE", "RESET") for op in circuit.operations)
    if has_non_unitary:
        probabilities_dict = {
            basis: round(count / shots, 5) for basis, count in sorted(counts.items())
        }

    # 4. Reduced states per qubit
    reduced_states = compute_reduced_states(sv, num_qubits)

    # 5. Timeline Step Evolution
    timeline: List[TimelineStep] = []

    # Auto-assign step indices from position if none are provided
    def _effective_step(op, idx: int) -> int:
        return op.step if op.step is not None else idx

    ops_with_steps = [(op, _effective_step(op, i)) for i, op in enumerate(circuit.operations)]
    unique_steps = sorted(list(set(s for _, s in ops_with_steps)))

    for step_num in unique_steps:
        step_ops = [op for op, s in ops_with_steps if s == step_num]
        sub_qc = build_qiskit_circuit(pure_ir, up_to_step=step_num)
        step_sv = Statevector.from_instruction(sub_qc)

        step_probs = {}
        for idx, c in enumerate(step_sv.data):
            b = format(idx, f"0{num_qubits}b")
            p = float(np.abs(c) ** 2)
            if p > 0.001:
                step_probs[b] = round(p, 4)

        for op in step_ops:
            summary = f"Gate {op.gate} applied to qubit(s) {op.targets}."
            if op.gate == "H":
                summary = f"Hadamard gate placed q{op.targets[0]} into coherent superposition."
            elif op.gate == "CX":
                ctrl = op.controls[0] if op.controls else op.targets[0]
                tgt = op.targets[0] if op.controls else op.targets[1]
                summary = f"CNOT correlated target q{tgt} with control q{ctrl}."

            timeline.append(
                TimelineStep(
                    step=step_num,
                    gate=op.gate,
                    targets=op.targets,
                    controls=op.controls,
                    stateSummary=summary,
                    probabilities=step_probs,
                )
            )

    execution_time_ms = round((time.perf_counter() - t0) * 1000.0, 2)

    # 6. Overall Metrics
    avg_entropy = sum(s.entropy for s in reduced_states) / len(reduced_states)
    avg_purity = sum(s.purity for s in reduced_states) / len(reduced_states)

    metrics = SimulationMetrics(
        depth=qc_pure.depth(),
        gateCount=len(circuit.operations),
        entanglementEntropy=round(avg_entropy, 4),
        purity=round(avg_purity, 4),
        executionTimeMs=execution_time_ms,
    )

    return NormalizedSimulationResult(
        circuitId="sim-" + str(int(t0 * 1000)),
        backend="qiskit-aer",
        shots=shots,
        qubitCount=num_qubits,
        statevector=statevector_list,
        counts=counts,
        probabilities=probabilities_dict,
        reducedStates=reduced_states,
        timeline=timeline,
        metrics=metrics,
    )
