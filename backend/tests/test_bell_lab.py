"""Bell laboratory checks for basis readout, correlations and real noise simulation."""

import pytest

from app.quantum.algorithms import run_bell_state


@pytest.mark.parametrize(
    "state,expected",
    [
        ("phi_plus", {"Z": 1, "X": 1, "Y": -1}),
        ("phi_minus", {"Z": 1, "X": -1, "Y": 1}),
        ("psi_plus", {"Z": -1, "X": 1, "Y": 1}),
        ("psi_minus", {"Z": -1, "X": -1, "Y": -1}),
    ],
)
def test_ideal_bell_basis_parity_and_correlations(state, expected):
    for basis, sign in expected.items():
        result = run_bell_state(state, shots=128, measurement_basis=basis)
        parity = sum(count for bits, count in result.counts.items() if bits in ("00", "11"))
        assert parity == (128 if sign > 0 else 0)
        assert result.fidelity == pytest.approx(1.0)
        assert getattr(result, f"correlation_{basis.lower() * 2}") == pytest.approx(sign)


def test_noise_reduces_fidelity_without_fabricating_shots():
    result = run_bell_state("phi_plus", shots=256, noise_percent=5)
    assert 0 < result.fidelity < 1
    assert sum(result.counts.values()) == 256
    assert abs(result.correlation_zz) < 1


def test_noisy_basis_counts_match_reported_state_correlation():
    result = run_bell_state("phi_plus", shots=2048, measurement_basis="Y", noise_percent=15)
    even = result.counts.get("00", 0) + result.counts.get("11", 0)
    odd = result.counts.get("01", 0) + result.counts.get("10", 0)
    empirical_yy = (even - odd) / 2048
    assert empirical_yy == pytest.approx(result.correlation_yy, abs=0.12)


@pytest.mark.parametrize("kwargs", [{"measurement_basis": "A"}, {"noise_percent": 16}, {"shots": 5000}])
def test_invalid_configuration_rejected(kwargs):
    with pytest.raises(ValueError):
        run_bell_state(**kwargs)
