"""Pedagogy & Cognitive Delta Engine for Quantum Lens AI.

Calculates statistical deviation between learner expectations and verified Qiskit simulation,
identifying specific conceptual gaps and triggering cognitive-conflict interventions.
SRS Build Contract Section 35-37.
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    circuitId: Optional[str] = None
    conceptKey: str = Field(default="general")
    predictedProbabilities: Dict[str, float]
    actualProbabilities: Dict[str, float]


class CognitiveDeltaResponse(BaseModel):
    cognitiveDelta: float = Field(..., description="Total Variation Distance [0.0 to 1.0]")
    matchesSimulation: bool
    detectedMisconceptions: List[str]
    deltaSummary: str
    interventionRecommended: bool
    conflictLabId: Optional[str] = None
    remediationExperiment: Optional[str] = None


def evaluate_cognitive_delta(req: PredictionRequest) -> CognitiveDeltaResponse:
    """Calculates Total Variation Distance (TVD) between predicted and simulated probability distributions."""
    pred = req.predictedProbabilities
    actual = req.actualProbabilities

    all_keys = set(pred.keys()).union(set(actual.keys()))
    if not all_keys:
        return CognitiveDeltaResponse(
            cognitiveDelta=0.0,
            matchesSimulation=True,
            detectedMisconceptions=[],
            deltaSummary="No states to compare.",
            interventionRecommended=False,
        )

    tvd = 0.0
    for k in all_keys:
        p_val = pred.get(k, 0.0)
        a_val = actual.get(k, 0.0)
        tvd += abs(p_val - a_val)

    tvd = round(tvd / 2.0, 4)
    matches = tvd < 0.08  # Tolerant threshold for statistical noise

    misconceptions: List[str] = []
    conflict_lab: Optional[str] = None
    remediation: Optional[str] = None
    summary: str = ""

    # Pattern recognition for known cognitive traps
    if req.conceptKey in ("bell", "entanglement"):
        # Did student predict 25% on all 4 states? (Treating qubits as independent random coins)
        if all(abs(pred.get(b, 0.0) - 0.25) < 0.1 for b in ["00", "01", "10", "11"]):
            misconceptions.append("M01")  # Superposition as classical parallel coin toss
            misconceptions.append("M05")  # CNOT creates independent randomness
            conflict_lab = "lab-m01-interference"
            remediation = "Test whether relative phase alters the output using H -> Z -> H."
            summary = (
                "Your prediction assumed all four outcomes (|00⟩, |01⟩, |10⟩, |11⟩) are equally likely, "
                "treating the qubits as independent random variables. However, the CNOT gate entangles q1 "
                "with the coherent superposition on q0, causing destructive interference on |01⟩ and |10⟩."
            )
        elif abs(actual.get("00", 0.0) - 0.5) < 0.1 and abs(actual.get("11", 0.0) - 0.5) < 0.1:
            if not matches:
                summary = f"Your predicted distribution differed from verified simulation by a delta of {tvd * 100:.1f}%."

    elif req.conceptKey in ("interference", "superposition"):
        # Did student predict 50/50 for H -> H?
        if abs(pred.get("0", 0.0) - 0.5) < 0.15 and abs(actual.get("0", 0.0) - 1.0) < 0.05:
            misconceptions.append("M01")
            conflict_lab = "lab-m01-interference"
            remediation = "Compare |0⟩ -> H -> H against |0⟩ -> H -> Z -> H."
            summary = (
                "You predicted a 50/50 random outcome for two successive Hadamards. "
                "In reality, quantum amplitudes interfere: H applied twice is identity (H² = I), "
                "returning the state deterministically to |0⟩ with 100% probability."
            )

    if not summary:
        if matches:
            summary = "Excellent prediction! Your mental model precisely matches verified quantum simulation."
        else:
            summary = (
                f"Your expectation diverged from the verified quantum state by a Cognitive Delta of {tvd * 100:.1f}%. "
                "Inspect how the unitary matrix transformations acted on the register amplitudes."
            )

    return CognitiveDeltaResponse(
        cognitiveDelta=tvd,
        matchesSimulation=matches,
        detectedMisconceptions=misconceptions,
        deltaSummary=summary,
        interventionRecommended=len(misconceptions) > 0 or tvd >= 0.25,
        conflictLabId=conflict_lab,
        remediationExperiment=remediation,
    )
