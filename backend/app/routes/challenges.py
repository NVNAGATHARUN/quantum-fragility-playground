"""Challenges & Automated Assessment Router (Phase 8).

Exposes endpoints for listing canonical coding challenges across five types
(Build, Predict, Debug, Code, Optimize) and evaluating submissions against
rigorous unitary, statevector, and constraint unit tests.
"""

from typing import List, Optional, Dict
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from ..circuit.ir import CircuitIR
from ..quantum.assessment import (
    CANONICAL_CHALLENGES,
    ChallengeDefinition,
    AssessmentResult,
    evaluate_challenge_submission,
)

router = APIRouter(prefix="/api/v1/challenges", tags=["challenges"])


class ChallengeEvaluateRequest(BaseModel):
    circuit: CircuitIR
    prediction: Optional[Dict[str, float]] = None


@router.get("", response_model=List[ChallengeDefinition])
def list_challenges():
    """Returns the full catalog of canonical quantum coding challenges."""
    return list(CANONICAL_CHALLENGES.values())


@router.get("/{challenge_id}", response_model=ChallengeDefinition)
def get_challenge(challenge_id: str):
    """Returns details, instructions, starter circuit, and constraints for a challenge."""
    challenge = CANONICAL_CHALLENGES.get(challenge_id)
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Challenge '{challenge_id}' not found.",
        )
    return challenge


@router.post("/{challenge_id}/evaluate", response_model=AssessmentResult)
def evaluate_challenge(challenge_id: str, req: ChallengeEvaluateRequest):
    """Evaluates a learner's submitted CircuitIR against target unit tests.

    Returns structured pass/fail results, mathematical fidelity, constraint checks,
    and pedagogical diagnostic feedback.
    """
    if challenge_id not in CANONICAL_CHALLENGES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Challenge '{challenge_id}' not found.",
        )

    try:
        result = evaluate_challenge_submission(
            challenge_id=challenge_id,
            circuit=req.circuit,
            prediction=req.prediction,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Challenge evaluation failed: {str(e)}",
        )
