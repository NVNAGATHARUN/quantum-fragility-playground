"""Challenges & Automated Assessment Router (Phase 8).

Exposes endpoints for listing canonical coding challenges across five types
(Build, Predict, Debug, Code, Optimize) and evaluating submissions against
rigorous unitary, statevector, and constraint unit tests.
"""

from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..circuit.ir import CircuitIR
from ..auth.security import decode_access_token
from ..db.models import CircuitAttempt, LearnerProfile, User
from ..db.session import get_db
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
async def evaluate_challenge(
    challenge_id: str,
    req: ChallengeEvaluateRequest,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
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
        # Anonymous learners may practice. Authenticated student submissions are
        # persisted from the server-computed assessment only; the client cannot
        # declare its own correctness or mastery value.
        if authorization and authorization.startswith("Bearer "):
            payload = decode_access_token(authorization.split(" ", 1)[1])
            if not payload or "sub" not in payload:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
            user = (await db.execute(select(User).where(User.id == payload["sub"]))).scalar_one_or_none()
            if not user:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authenticated user not found")

            attempt = CircuitAttempt(
                user_id=user.id,
                circuit_ir=req.circuit.model_dump(mode="json"),
                prediction=req.prediction,
                outcome={
                    "source": "server_assessment",
                    "challenge_id": challenge_id,
                    "challenge_title": CANONICAL_CHALLENGES[challenge_id].title,
                    "score": result.score,
                    "passed": result.passed,
                    "fidelity": result.fidelity,
                    "test_cases": [case.model_dump(mode="json") for case in result.test_cases],
                },
                was_correct=result.passed,
            )
            db.add(attempt)
            await db.flush()

            attempts = (await db.execute(
                select(CircuitAttempt).where(CircuitAttempt.user_id == user.id)
            )).scalars().all()
            assessed = [a for a in attempts if isinstance(a.outcome, dict) and a.outcome.get("source") == "server_assessment"]
            profile = (await db.execute(
                select(LearnerProfile).where(LearnerProfile.user_id == user.id)
            )).scalar_one_or_none()
            if profile:
                profile.overall_mastery = round(
                    sum(float(a.outcome.get("score", 0.0)) for a in assessed) / (100.0 * len(assessed)), 3
                ) if assessed else 0.0
            await db.commit()
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Challenge evaluation failed: {str(e)}",
        )
