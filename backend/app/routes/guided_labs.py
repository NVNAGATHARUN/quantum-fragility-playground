"""Authoritative guided-lab checkpoint evaluation and progress."""

from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.security import decode_access_token
from ..circuit.ir import CircuitIR
from ..db.models import CircuitAttempt, LearnerProfile, User
from ..db.session import get_db
from ..quantum.guided_assessment import RUBRICS, evaluate_guided_checkpoint
from ..pedagogy.evidence import misconception_for_activity, record_assessment_evidence

router = APIRouter(prefix="/api/v1/guided-labs", tags=["guided-labs"])


class GuidedEvaluateRequest(BaseModel):
    circuit: CircuitIR


async def _optional_user(authorization: Optional[str], db: AsyncSession) -> Optional[User]:
    if not authorization:
        return None
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Invalid authorization header")
    payload = decode_access_token(authorization.split(" ", 1)[1])
    if not payload or "sub" not in payload:
        raise HTTPException(401, "Invalid or expired token")
    user = (await db.execute(select(User).where(User.id == payload["sub"]))).scalar_one_or_none()
    if not user:
        raise HTTPException(401, "Authenticated user not found")
    return user


@router.post("/{lab_id}/checkpoints/{checkpoint}/evaluate")
async def evaluate_checkpoint(lab_id: str, checkpoint: int, body: GuidedEvaluateRequest,
                              authorization: Optional[str] = Header(None), db: AsyncSession = Depends(get_db)):
    try:
        result = evaluate_guided_checkpoint(lab_id, checkpoint, body.circuit)
    except KeyError:
        raise HTTPException(404, "Guided checkpoint not found")
    user = await _optional_user(authorization, db)
    if user:
        misconception_id = misconception_for_activity("guided_lab", lab_id)
        attempt = CircuitAttempt(
            user_id=user.id,
            circuit_ir=body.circuit.model_dump(mode="json"),
            outcome={
                "source": "guided_lab",
                "lab_id": lab_id,
                "checkpoint": checkpoint,
                "misconception_id": misconception_id,
                **result,
            },
            was_correct=result["passed"],
        )
        db.add(attempt)
        await db.flush()
        await record_assessment_evidence(
            db,
            user_id=user.id,
            misconception_id=misconception_id,
            passed=result["passed"],
            evidence=f"Guided lab {lab_id}, checkpoint {checkpoint + 1}: {result['reason']}",
        )
        attempts = (await db.execute(select(CircuitAttempt).where(CircuitAttempt.user_id == user.id))).scalars().all()
        verified = [a for a in attempts if isinstance(a.outcome, dict) and a.outcome.get("source") in {"guided_lab", "server_assessment"}]
        profile = (await db.execute(select(LearnerProfile).where(LearnerProfile.user_id == user.id))).scalar_one_or_none()
        if profile and verified:
            profile.overall_mastery = round(sum(float(a.outcome.get("score", 0)) for a in verified) / (100 * len(verified)), 3)
        await db.commit()
    return result


@router.get("/progress")
async def guided_progress(authorization: Optional[str] = Header(None), db: AsyncSession = Depends(get_db)):
    user = await _optional_user(authorization, db)
    if not user:
        raise HTTPException(401, "Sign in to load guided progress")
    attempts = (await db.execute(select(CircuitAttempt).where(CircuitAttempt.user_id == user.id))).scalars().all()
    best = {}
    for attempt in attempts:
        out = attempt.outcome if isinstance(attempt.outcome, dict) else {}
        if out.get("source") == "guided_lab" and out.get("passed"):
            key = f'{out.get("lab_id")}:{out.get("checkpoint")}'
            best[key] = {"labId": out.get("lab_id"), "checkpoint": out.get("checkpoint"), "verifiedAt": attempt.timestamp, "circuit": attempt.circuit_ir}
    return {"completed": list(best.values()), "labCount": len(RUBRICS)}
