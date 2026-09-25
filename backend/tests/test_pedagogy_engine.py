"""Automated Tests for Milestone 3: Pedagogy Engine.

Tests Cognitive Delta evaluator and What Changed diff engine.
SRS Build Contract Gate Requirement for Milestone 3.
"""

import pytest
from app.models.circuit_ir import CircuitIR, GateOperation
from app.pedagogy.evaluator import PredictionRequest, evaluate_cognitive_delta
from app.pedagogy.what_changed import compare_circuits


def test_cognitive_delta_detects_independent_randomness_trap():
    """Predicting 25% across all 4 states for a Bell pair must trigger Cognitive Delta = 0.5 and flag M01."""
    req = PredictionRequest(
        circuitId="c-bell",
        conceptKey="bell",
        predictedProbabilities={"00": 0.25, "01": 0.25, "10": 0.25, "11": 0.25},
        actualProbabilities={"00": 0.5, "01": 0.0, "10": 0.0, "11": 0.5},
    )
    res = evaluate_cognitive_delta(req)

    assert res.cognitiveDelta == 0.5
    assert res.matchesSimulation is False
    assert "M01" in res.detectedMisconceptions
    assert res.interventionRecommended is True
    assert res.conflictLabId == "lab-m01-interference"


def test_cognitive_delta_matches_on_correct_prediction():
    """Predicting exact 50% |00⟩ and 50% |11⟩ yields zero delta and matches simulation."""
    req = PredictionRequest(
        circuitId="c-bell",
        conceptKey="bell",
        predictedProbabilities={"00": 0.5, "01": 0.0, "10": 0.0, "11": 0.5},
        actualProbabilities={"00": 0.5, "01": 0.0, "10": 0.0, "11": 0.5},
    )
    res = evaluate_cognitive_delta(req)

    assert res.cognitiveDelta == 0.0
    assert res.matchesSimulation is True
    assert len(res.detectedMisconceptions) == 0
    assert res.interventionRecommended is False


def test_what_changed_diffs_hadamard_replacement_with_x():
    """Comparing H -> CX against X -> CX must show gate modification, state shift, and conceptual explanation."""
    circuitA = CircuitIR(
        version="1.0",
        qubits=2,
        classicalBits=2,
        operations=[
            GateOperation(id="g-01", gate="H", targets=[0], controls=[], step=0),
            GateOperation(id="g-02", gate="CX", targets=[1], controls=[0], step=1),
        ],
    )
    circuitB = CircuitIR(
        version="1.0",
        qubits=2,
        classicalBits=2,
        operations=[
            GateOperation(id="g-01", gate="X", targets=[0], controls=[], step=0),
            GateOperation(id="g-02", gate="CX", targets=[1], controls=[0], step=1),
        ],
    )

    diff = compare_circuits(circuitA, circuitB)

    # Topological Diff
    assert len(diff.circuitDiff) == 1
    assert diff.circuitDiff[0].gateA == "H"
    assert diff.circuitDiff[0].gateB == "X"
    assert diff.circuitDiff[0].changeType == "MODIFIED"

    # State Diff
    assert "1/√2|00⟩ + 1/√2|11⟩" in diff.stateSummaryA
    assert "|11⟩" in diff.stateSummaryB
    assert diff.stateFidelity == 0.5

    # Probability shift
    assert diff.probabilityDiff["00"]["versionA"] == 0.5
    assert diff.probabilityDiff["00"]["versionB"] == 0.0
    assert diff.probabilityDiff["11"]["versionA"] == 0.5
    assert diff.probabilityDiff["11"]["versionB"] == 1.0

    # Conceptual explanation
    assert "removing the Hadamard gate eliminated quantum superposition" in diff.conceptExplanation
