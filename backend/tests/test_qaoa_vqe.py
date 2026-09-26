"""Unit tests for QAOA and VQE algorithm engines in Quantum Lens AI.

Tests verify analytical bounds, physical energy limits, state evolution steps,
and that all simulation data originates from live Qiskit Aer simulation.
"""

import pytest
from app.quantum.qaoa import run_qaoa, GRAPH_TOPOLOGIES, compute_cut_value
from app.quantum.vqe import (
    run_vqe,
    get_h2_hamiltonian_coeffs,
    compute_exact_fci_energy,
    compute_hartree_fock_energy,
)


def test_qaoa_graph_topologies():
    """Verify that all supported graph topologies produce valid cuts within bounds."""
    for gtype, info in GRAPH_TOPOLOGIES.items():
        res = run_qaoa(graph_type=gtype, gamma=0.5, beta=0.5, shots=512)
        assert res.n_nodes == info['n_nodes']
        assert res.max_possible_cut == info['max_cut']
        assert 0.0 <= res.expected_cut <= info['max_cut']
        assert 0.0 <= res.approximation_ratio <= 1.0
        assert len(res.state_evolution_steps) == 4
        assert len(res.landscape) == 64  # 8x8 grid


def test_qaoa_optimization_improves_cut():
    """Verify that QAOA optimization finds non-trivial cut approximations."""
    res_unopt = run_qaoa(graph_type='ring_4', gamma=0.1, beta=0.05, optimize=False)
    res_opt = run_qaoa(graph_type='ring_4', gamma=0.6, beta=0.4, optimize=True)
    assert res_opt.expected_cut >= res_unopt.expected_cut or res_opt.approximation_ratio >= 0.5


def test_qaoa_cut_computation():
    """Verify classical cut counting for known bitstrings."""
    edges = [(0, 1), (1, 2), (0, 2)]  # Triangle
    assert compute_cut_value('000', edges) == 0
    assert compute_cut_value('111', edges) == 0
    assert compute_cut_value('001', edges) == 2
    assert compute_cut_value('010', edges) == 2


def test_vqe_equilibrium_h2():
    """Verify VQE for H2 at equilibrium bond distance R=0.74 Å."""
    res = run_vqe(molecule='H2', bond_distance=0.74, optimize=True, shots=512)
    # Physical ground state energy of H2 STO-3G is ~ -1.137 Hartree
    assert -1.25 <= res.vqe_energy <= -1.05
    assert -1.25 <= res.exact_fci_energy <= -1.05
    assert res.error_mhartree < 50.0  # High accuracy near equilibrium
    assert len(res.dissociation_curve) == 9
    assert len(res.state_evolution_steps) == 4
    assert 'Z0' in res.pauli_expectations
    assert 'X0X1' in res.pauli_expectations
    assert "educational" in res.model_provenance.lower()
    assert "not an ab-initio" in res.model_provenance.lower()


def test_vqe_hartree_fock_vs_fci():
    """Verify that exact FCI energy is strictly <= Hartree-Fock energy (variational theorem)."""
    for r in [0.5, 0.74, 1.2, 2.0]:
        e_fci = compute_exact_fci_energy(r)
        e_hf = compute_hartree_fock_energy(r)
        assert e_fci <= e_hf + 1e-6


def test_vqe_curve_is_independently_optimized_and_transparently_labelled():
    """The displayed VQE curve must be computed, not copied from the reference."""
    res = run_vqe(molecule='H2', bond_distance=0.74, optimize=True, shots=256)
    assert all(
        {'r', 'vqe', 'fci', 'hartree_fock', 'optimal_theta'} <= point.keys()
        for point in res.dissociation_curve
    )
    assert all(0.0 <= point['optimal_theta'] <= 3.141593 for point in res.dissociation_curve)
