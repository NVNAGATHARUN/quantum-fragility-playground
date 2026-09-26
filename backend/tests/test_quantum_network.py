"""Scientific-evidence tests for the educational quantum-network model."""

from app.quantum.algorithms import run_entanglement_swapping


def test_repeater_fidelity_and_counts_come_from_corrected_circuit_evidence():
    result = run_entanglement_swapping(distance_km=100, use_repeater=True, shots=2048)

    assert result.fidelity > 0.999999
    assert result.probabilities.get('00', 0) + result.probabilities.get('11', 0) > 0.95
    assert "ideal four-qubit aer circuit" in result.model_provenance.lower()
    assert "excludes" in result.model_provenance.lower()


def test_direct_link_is_explicitly_an_educational_loss_model():
    result = run_entanglement_swapping(distance_km=100, use_repeater=False, shots=1024)

    assert 0.0 <= result.fidelity <= 1.0
    assert "educational fiber-loss model" in result.model_provenance.lower()
