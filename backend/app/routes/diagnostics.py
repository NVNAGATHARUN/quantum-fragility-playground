"""Server-owned baseline and alternate post-remediation diagnostics."""

from typing import Dict, Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.router import get_current_user
from ..db.models import User, DiagnosticAttempt
from ..db.session import get_db
from ..pedagogy.evidence import record_assessment_evidence
from ..quantum.diagnostic_assessment import FORMS, grade_form, public_form

router = APIRouter(prefix="/api/v1/diagnostics", tags=["diagnostics"])


class DiagnosticSubmission(BaseModel):
    phase: Literal["baseline", "post"]
    responses: Dict[str, int]
    confidence: Dict[str, int] = Field(default_factory=dict)


@router.get("/form/{phase}")
async def get_form(phase: str, current_user: User = Depends(get_current_user)):
    if phase not in FORMS:
        raise HTTPException(404, "Unknown diagnostic phase")
    return {"phase": phase, "form_version": "1.0", "items": public_form(phase)}


@router.post("/submit")
async def submit_form(
    body: DiagnosticSubmission,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    expected = {item[0] for item in FORMS[body.phase]}
    if set(body.responses) != expected:
        raise HTTPException(422, "Submit one answer for every diagnostic item")
    if any(value < 0 or value > 3 for value in body.responses.values()):
        raise HTTPException(422, "Diagnostic answer index is out of range")
    if any(value < 1 or value > 5 for value in body.confidence.values()):
        raise HTTPException(422, "Confidence must be between 1 and 5")

    graded, concept_scores = grade_form(body.phase, body.responses)
    correct = sum(1 for item in graded if item["passed"])
    for item in graded:
        confidence = body.confidence.get(item["item_id"])
        await record_assessment_evidence(
            db,
            user_id=current_user.id,
            misconception_id=item["misconception_id"],
            passed=item["passed"],
            evidence=f"{body.phase} diagnostic {item['item_id']}: {'passed' if item['passed'] else 'failed'}"
            + (f" at confidence {confidence}/5" if confidence is not None else ""),
        )
    attempt = DiagnosticAttempt(
        user_id=current_user.id,
        phase=body.phase,
        form_version="1.0",
        score=round(100 * correct / len(graded), 1),
        correct_count=correct,
        item_count=len(graded),
        concept_scores=concept_scores,
        responses={"answers": body.responses, "confidence": body.confidence},
    )
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)
    return {"attempt_id": attempt.id, "phase": body.phase, "score": attempt.score, "correct_count": correct, "item_count": len(graded), "concept_scores": concept_scores, "items": graded}


@router.get("/summary")
async def diagnostic_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    attempts = (await db.execute(
        select(DiagnosticAttempt)
        .where(DiagnosticAttempt.user_id == current_user.id)
        .order_by(DiagnosticAttempt.completed_at.desc())
    )).scalars().all()
    baseline = next((a for a in attempts if a.phase == "baseline"), None)
    post = next((a for a in attempts if a.phase == "post"), None)
    def view(a):
        return None if not a else {"id": a.id, "score": a.score, "concept_scores": a.concept_scores, "completed_at": a.completed_at}
    return {
        "baseline": view(baseline),
        "post": view(post),
        "improvement": round(post.score - baseline.score, 1) if baseline and post else None,
        "attempts_count": len(attempts),
        "recommended_phase": "baseline" if not baseline else "post",
    }
