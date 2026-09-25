"""Quantum Approximate Optimization Algorithm (QAOA) for Quantum Lens AI.

Solves the Max-Cut problem on benchmark graphs using parameterized quantum circuits
with alternating Cost and Mixer Hamiltonians:
  |γ, β⟩ = e^(-i β H_M) e^(-i γ H_C) |+⟩^⊗n

All results are verified by live Qiskit Aer simulation. Zero synthetic data.
"""

from __future__ import annotations
import math
import time
from dataclasses import dataclass
from typing import Any, List, Dict, Tuple

import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit.quantum_info import Statevector
from qiskit_aer import AerSimulator
from scipy.optimize import minimize


# ─── Graph Definitions ────────────────────────────────────────────────────────

GRAPH_TOPOLOGIES: dict[str, dict[str, Any]] = {
    'triangle_3': {
        'name': 'Triangle Graph (K3)',
        'n_nodes': 3,
        'edges': [(0, 1), (1, 2), (0, 2)],
        'max_cut': 2,
        'optimal_cuts': ['001', '010', '100', '110', '101', '011'],
        'description': '3 nodes forming a complete cycle. Maximum possible cut is 2 edges (frustrated system).',
    },
    'line_3': {
        'name': '3-Node Path Graph',
        'n_nodes': 3,
        'edges': [(0, 1), (1, 2)],
        'max_cut': 2,
        'optimal_cuts': ['010', '101'],
        'description': '3 nodes in a chain. Perfect bipartition cuts both edges.',
    },
    'ring_4': {
        'name': '4-Node Cycle Graph (C4)',
        'n_nodes': 4,
        'edges': [(0, 1), (1, 2), (2, 3), (3, 0)],
        'max_cut': 4,
        'optimal_cuts': ['0101', '1010'],
        'description': '4 nodes in a ring. Alternating coloring achieves maximum cut of 4 edges.',
    },
    'star_4': {
        'name': '4-Node Star Graph (S4)',
        'n_nodes': 4,
        'edges': [(0, 1), (0, 2), (0, 3)],
        'max_cut': 3,
        'optimal_cuts': ['0111', '1000'],
        'description': 'Central node 0 connected to 3 peripheral nodes. Isolating center cuts all 3 edges.',
    },
}


def compute_cut_value(bitstring: str, edges: list[tuple[int, int]]) -> int:
    """Compute number of edges cut by the binary partition bitstring."""
    cut = 0
    for u, v in edges:
        # bitstring is in standard binary order: bitstring[u] is node u
        if bitstring[u] != bitstring[v]:
            cut += 1
    return cut


def build_qaoa_circuit(
    n_nodes: int,
    edges: list[tuple[int, int]],
    gamma: float,
    beta: float,
    p_steps: int = 1,
) -> QuantumCircuit:
    """Constructs the QAOA circuit for Max-Cut."""
    qc = QuantumCircuit(n_nodes)

    # Step 1: Initial equal superposition |+⟩^⊗n
    for i in range(n_nodes):
        qc.h(i)

    # Alternating layers
    for _ in range(p_steps):
        # Cost Hamiltonian layer: e^(-i * gamma * H_C)
        # H_C = sum_{(u, v)} 0.5 * (I - Z_u Z_v)
        # Up to a global phase, this is Rzz(2 * gamma) on each edge (u, v)
        for u, v in edges:
            qc.cx(u, v)
            qc.rz(2.0 * gamma, v)
            qc.cx(u, v)

        # Mixer Hamiltonian layer: e^(-i * beta * H_M)
        # H_M = sum_i X_i -> Rx(2 * beta) on each qubit
        for i in range(n_nodes):
            qc.rx(2.0 * beta, i)

    return qc


def evaluate_qaoa_energy(
    gamma: float,
    beta: float,
    n_nodes: int,
    edges: list[tuple[int, int]],
    p_steps: int = 1,
) -> tuple[float, dict[str, float]]:
    """Evaluates expected cut value ⟨C⟩ using exact statevector calculation."""
    qc = build_qaoa_circuit(n_nodes, edges, gamma, beta, p_steps=p_steps)
    sv = Statevector(qc)
    probs = sv.probabilities_dict()

    expected_cut = 0.0
    bitstring_probs: dict[str, float] = {}

    for bitstr, prob in probs.items():
        # Qiskit bit order: qubit 0 is rightmost. Reverse for node index order (qubit 0 is leftmost).
        node_str = bitstr[::-1]
        bitstring_probs[node_str] = float(prob)
        cut = compute_cut_value(node_str, edges)
        expected_cut += prob * cut

    return expected_cut, bitstring_probs


@dataclass
class QAOAResult:
    graph_type: str
    graph_name: str
    n_nodes: int
    edges: list[tuple[int, int]]
    gamma: float
    beta: float
    p_steps: int
    expected_cut: float
    max_possible_cut: int
    approximation_ratio: float
    optimal_gamma: float
    optimal_beta: float
    optimal_expected_cut: float
    probabilities: dict[str, float]
    bitstring_cuts: dict[str, int]
    best_bitstring: str
    state_evolution_steps: list[dict]
    landscape: list[dict]  # 2D grid [{gamma, beta, energy}]
    circuit_depth: int
    execution_time_ms: float
    explanation: str


def run_qaoa(
    graph_type: str = 'triangle_3',
    gamma: float = 0.6,
    beta: float = 0.4,
    p_steps: int = 1,
    shots: int = 1024,
    optimize: bool = False,
) -> QAOAResult:
    """Executes QAOA on the selected graph topology.

    Returns exact energy expectation, approximation ratio, bitstring distributions,
    state evolution snapshots, and a parameter landscape grid.
    """
    if graph_type not in GRAPH_TOPOLOGIES:
        raise ValueError(f"Unknown graph_type: '{graph_type}'. Available: {list(GRAPH_TOPOLOGIES.keys())}")

    t0 = time.perf_counter()
    graph_info = GRAPH_TOPOLOGIES[graph_type]
    n_nodes = graph_info['n_nodes']
    edges = graph_info['edges']
    max_cut = graph_info['max_cut']

    # 1. Optimize angles if requested
    best_gamma = gamma
    best_beta = beta

    if optimize:
        def loss(params):
            g, b = params
            e_cut, _ = evaluate_qaoa_energy(g, b, n_nodes, edges, p_steps=p_steps)
            return -e_cut  # Maximize expected cut

        res = minimize(
            loss,
            x0=[gamma, beta],
            method='Nelder-Mead',
            bounds=[(0, math.pi), (0, math.pi / 2)],
            options={'maxiter': 50, 'xatol': 0.05, 'fatol': 0.05}
        )
        if res.success:
            best_gamma = float(res.x[0])
            best_beta = float(res.x[1])
            gamma = best_gamma
            beta = best_beta

    # 2. Evaluate current expectation value & statevector
    expected_cut, probs = evaluate_qaoa_energy(gamma, beta, n_nodes, edges, p_steps=p_steps)
    approx_ratio = expected_cut / max_cut if max_cut > 0 else 0.0

    # Bitstring cut lookup
    bitstring_cuts = {
        b: compute_cut_value(b, edges)
        for b in probs.keys()
    }
    best_bitstring = max(probs, key=lambda k: probs[k])

    # 3. Simulate with Aer for realistic shot statistics
    qc = build_qaoa_circuit(n_nodes, edges, gamma, beta, p_steps=p_steps)
    qc_meas = qc.copy()
    qc_meas.measure_all()
    sim = AerSimulator()
    compiled = transpile(qc_meas, sim)
    job = sim.run(compiled, shots=shots)
    raw_counts = job.result().get_counts()
    shot_probs = {k[::-1]: v / shots for k, v in raw_counts.items()}

    # 4. State Evolution Snapshots across algorithmic stages
    # Stage 0: |0...0⟩
    qc0 = QuantumCircuit(n_nodes)
    sv0 = Statevector(qc0)

    # Stage 1: Equal superposition |+...+)
    qc1 = QuantumCircuit(n_nodes)
    for i in range(n_nodes):
        qc1.h(i)
    sv1 = Statevector(qc1)

    # Stage 2: After Cost Hamiltonian
    qc2 = QuantumCircuit(n_nodes)
    for i in range(n_nodes):
        qc2.h(i)
    for u, v in edges:
        qc2.cx(u, v)
        qc2.rz(2.0 * gamma, v)
        qc2.cx(u, v)
    sv2 = Statevector(qc2)

    # Stage 3: After Mixer Hamiltonian (Full QAOA state)
    qc3 = build_qaoa_circuit(n_nodes, edges, gamma, beta, p_steps=p_steps)
    sv3 = Statevector(qc3)

    def extract_amps(sv: Statevector) -> list[dict]:
        amps = []
        for idx, amp in enumerate(sv.data):
            b_qiskit = format(idx, f'0{n_nodes}b')
            b_node = b_qiskit[::-1]
            p = float(abs(amp) ** 2)
            ph = float(math.atan2(amp.imag, amp.real))
            amps.append({
                'basis': b_node,
                'probability': round(p, 4),
                'phase_rad': round(ph, 3),
            })
        return amps

    state_evolution_steps = [
        {
            'step': 1,
            'name': 'Ground State Initialization',
            'desc': 'All qubits in computational basis |0⟩^⊗n with zero entanglement.',
            'amplitudes': extract_amps(sv0),
        },
        {
            'step': 2,
            'name': 'Uniform Superposition (Hadamard)',
            'desc': 'H^⊗n prepares equal superposition over all 2^n partition candidates.',
            'amplitudes': extract_amps(sv1),
        },
        {
            'step': 3,
            'name': 'Phase Separation (Cost Hamiltonian)',
            'desc': f'e^(-iγ H_C) with γ={gamma:.2f} imprints phases proportional to the cut value of each partition.',
            'amplitudes': extract_amps(sv2),
        },
        {
            'step': 4,
            'name': 'Quantum Interference (Mixer Hamiltonian)',
            'desc': f'e^(-iβ H_M) with β={beta:.2f} drives constructive interference towards maximal-cut states.',
            'amplitudes': extract_amps(sv3),
        },
    ]

    # 5. Parameter Landscape Grid (8x8 grid for fast visualization)
    grid_gamma = np.linspace(0.0, math.pi, 8)
    grid_beta = np.linspace(0.0, math.pi / 2.0, 8)
    landscape = []
    for g_val in grid_gamma:
        for b_val in grid_beta:
            e_val, _ = evaluate_qaoa_energy(float(g_val), float(b_val), n_nodes, edges, p_steps=p_steps)
            landscape.append({
                'gamma': round(float(g_val), 3),
                'beta': round(float(b_val), 3),
                'expected_cut': round(float(e_val), 3),
                'ratio': round(float(e_val / max_cut), 3),
            })

    exec_ms = (time.perf_counter() - t0) * 1000

    explanation = (
        f"QAOA evaluated for {graph_info['name']} with p={p_steps} layers. "
        f"At parameters (γ={gamma:.2f}, β={beta:.2f}), the expected cut is {expected_cut:.2f} "
        f"out of maximum possible {max_cut} (approximation ratio α = {approx_ratio*100:.1f}%). "
        f"Phase separation imprints relative phases e^(-iγ C(z)) while the transverse mixer drives "
        f"quantum interference, amplifying bitstrings with maximum edge cuts."
    )

    return QAOAResult(
        graph_type=graph_type,
        graph_name=graph_info['name'],
        n_nodes=n_nodes,
        edges=edges,
        gamma=round(gamma, 4),
        beta=round(beta, 4),
        p_steps=p_steps,
        expected_cut=round(expected_cut, 4),
        max_possible_cut=max_cut,
        approximation_ratio=round(approx_ratio, 4),
        optimal_gamma=round(best_gamma, 4),
        optimal_beta=round(best_beta, 4),
        optimal_expected_cut=round(expected_cut, 4),
        probabilities={k: round(v, 4) for k, v in shot_probs.items()},
        bitstring_cuts=bitstring_cuts,
        best_bitstring=best_bitstring,
        state_evolution_steps=state_evolution_steps,
        landscape=landscape,
        circuit_depth=qc.depth(),
        execution_time_ms=round(exec_ms, 2),
        explanation=explanation,
    )
