"""Grounded Learner & Instructor Progress Router for Quantum Lens AI.

All progress statistics are derived strictly from database-backed empirical records.
Zero synthetic students or fabricated benchmarks are returned.
"""

from typing import List, Optional, Any, Dict
from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from ..db.session import get_db
from ..db.models import (
    User,
    LearnerProfile,
    Classroom,
    Enrollment,
    CircuitAttempt,
    LearnerMisconception,
    SavedCircuit,
)
from ..auth.router import get_current_user

router = APIRouter(prefix="/api/v1/progress", tags=["progress"])


# --- Schemas ---

class MisconceptionItem(BaseModel):
    id: str
    misconception_id: str
    status: str
    evidence: str
    detected_at: datetime
    resolved_at: Optional[datetime] = None


class StudentProgressSummary(BaseModel):
    user_id: str
    full_name: str
    email: str
    role: str
    overall_mastery: float
    circuits_count: int
    attempts_count: int
    total_time_minutes: int
    recent_attempts: List[Dict[str, Any]]
    detected_misconceptions: List[MisconceptionItem]
    enrolled_classrooms_count: int
    verified_attempts: int
    passed_attempts: int
    competency_evidence: List[Dict[str, Any]]
    recommendation: Dict[str, Any]


class InstructorCohortSummary(BaseModel):
    instructor_id: str
    full_name: str
    email: str
    role: str
    classrooms_count: int
    total_enrolled_students: int
    active_misconceptions_count: int
    classrooms: List[Dict[str, Any]]


# --- Endpoints ---

@router.get("/summary")
async def get_progress_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve grounded, database-backed progress summary for learner or instructor."""
    if current_user.role == "instructor":
        # Aggregate across instructor's real classrooms
        cr_result = await db.execute(
            select(
                Classroom,
                func.count(Enrollment.id).label("student_count")
            )
            .outerjoin(Enrollment, Classroom.id == Enrollment.classroom_id)
            .where(Classroom.instructor_id == current_user.id)
            .group_by(Classroom.id)
        )
        cr_rows = cr_result.all()

        total_students = sum(count for _, count in cr_rows)

        # Count detected misconceptions across enrolled students
        student_ids = []
        for cr, _ in cr_rows:
            enr_res = await db.execute(select(Enrollment.user_id).where(Enrollment.classroom_id == cr.id))
            student_ids.extend([row[0] for row in enr_res.all()])

        active_misc_count = 0
        if student_ids:
            misc_res = await db.execute(
                select(func.count(LearnerMisconception.id))
                .where(
                    LearnerMisconception.user_id.in_(student_ids),
                    LearnerMisconception.status == "detected",
                )
            )
            active_misc_count = misc_res.scalar() or 0

        return InstructorCohortSummary(
            instructor_id=current_user.id,
            full_name=current_user.full_name,
            email=current_user.email,
            role=current_user.role,
            classrooms_count=len(cr_rows),
            total_enrolled_students=total_students,
            active_misconceptions_count=active_misc_count,
            classrooms=[
                {
                    "id": c.id,
                    "name": c.name,
                    "code": c.code,
                    "created_at": c.created_at.isoformat(),
                    "student_count": count,
                }
                for c, count in cr_rows
            ],
        )

    else:
        # Student summary
        prof_res = await db.execute(select(LearnerProfile).where(LearnerProfile.user_id == current_user.id))
        profile = prof_res.scalar_one_or_none()

        att_count_res = await db.execute(
            select(func.count(CircuitAttempt.id)).where(CircuitAttempt.user_id == current_user.id)
        )
        attempts_count = att_count_res.scalar() or 0

        rec_att_res = await db.execute(
            select(CircuitAttempt)
            .where(CircuitAttempt.user_id == current_user.id)
            .order_by(desc(CircuitAttempt.timestamp))
            .limit(5)
        )
        recent_attempts = [
            {
                "id": a.id,
                "timestamp": a.timestamp.isoformat(),
                "cognitive_delta": a.cognitive_delta,
                "was_correct": a.was_correct,
                "source": a.outcome.get("source") if isinstance(a.outcome, dict) else None,
                "challenge_id": a.outcome.get("challenge_id") if isinstance(a.outcome, dict) else None,
                "challenge_title": a.outcome.get("challenge_title") if isinstance(a.outcome, dict) else None,
                "score": a.outcome.get("score") if isinstance(a.outcome, dict) else None,
            }
            for a in rec_att_res.scalars().all()
        ]

        misc_res = await db.execute(
            select(LearnerMisconception)
            .where(LearnerMisconception.user_id == current_user.id)
            .order_by(desc(LearnerMisconception.detected_at))
        )
        misconceptions = [
            MisconceptionItem(
                id=m.id,
                misconception_id=m.misconception_id,
                status=m.status,
                evidence=m.evidence,
                detected_at=m.detected_at,
                resolved_at=m.resolved_at,
            )
            for m in misc_res.scalars().all()
        ]

        enr_res = await db.execute(
            select(func.count(Enrollment.id)).where(Enrollment.user_id == current_user.id)
        )
        enrolled_count = enr_res.scalar() or 0

        all_attempts = (await db.execute(
            select(CircuitAttempt).where(CircuitAttempt.user_id == current_user.id).order_by(CircuitAttempt.timestamp)
        )).scalars().all()
        verified = [a for a in all_attempts if isinstance(a.outcome, dict) and a.outcome.get("source") in {"guided_lab", "server_assessment"}]
        passed = [a for a in verified if a.outcome.get("passed")]
        domain_rules = {
            "Superposition": lambda o: o.get("lab_id") == "superposition",
            "Phase": lambda o: o.get("lab_id") == "phase" or o.get("challenge_id") in {"born-interference", "bell-phase-verification"},
            "Measurement": lambda o: o.get("lab_id") == "measurement",
            "Entanglement": lambda o: o.get("lab_id") == "bell-state" or o.get("challenge_id") in {"bell-phase-verification", "ghz-3qubit"},
            "Algorithms": lambda o: o.get("challenge_id") in {"qasm-deutsch-oracle", "swap-direction-debug", "cnot-swap-optimization"},
        }
        competency_evidence = []
        for domain, matches in domain_rules.items():
            items = [a for a in verified if matches(a.outcome)]
            competency_evidence.append({
                "domain": domain,
                "score": round(sum(float(a.outcome.get("score", 0)) for a in items) / len(items), 1) if items else 0.0,
                "attempts": len(items),
                "passed": sum(1 for a in items if a.outcome.get("passed")),
                "evidence": "Server-graded guided checkpoints and challenges" if items else "No verified evidence yet",
            })

        passed_keys = {(a.outcome.get("source"), a.outcome.get("lab_id"), a.outcome.get("checkpoint"), a.outcome.get("challenge_id")) for a in passed}
        if not verified:
            recommendation = {"title": "Start with phase and interference", "reason": "No verified assessment evidence exists yet.", "route": "/learn/m04-superposition-interference/global-vs-relative-phase", "evidence": "0 verified attempts"}
        elif ("guided_lab", "bell-state", 2, None) in passed_keys and not any(a.outcome.get("challenge_id") == "bell-phase-verification" and a.outcome.get("passed") for a in verified):
            recommendation = {"title": "Verify the Bell pair's hidden phase", "reason": "You completed the Bell construction; the next step is a phase-sensitive mastery check.", "route": "/challenges/bell-phase-verification", "evidence": "Bell guided lab completed"}
        elif any(not a.outcome.get("passed") for a in verified[-3:]):
            last_failed = next(a for a in reversed(verified) if not a.outcome.get("passed"))
            is_bell = last_failed.outcome.get("challenge_id") == "bell-phase-verification" or last_failed.outcome.get("lab_id") == "bell-state"
            recommendation = {"title": "Rebuild the missing concept", "reason": last_failed.outcome.get("reason") or "A recent verified attempt did not pass.", "route": "/learn/m05-entanglement-correlation/bell-states" if is_bell else "/learn/m04-superposition-interference/phase-challenge", "evidence": f"Attempt {last_failed.id[:8]}"}
        else:
            recommendation = {"title": "Continue to algorithmic interference", "reason": "Your recent verified evidence is passing; apply the same phase reasoning in an algorithm.", "route": "/learn/m06-standard-algorithms/deutsch-jozsa", "evidence": f"{len(passed)} passed verified attempts"}

        verified_mastery = round(sum(float(a.outcome.get("score", 0)) for a in verified) / (100 * len(verified)), 3) if verified else 0.0
        return StudentProgressSummary(
            user_id=current_user.id,
            full_name=current_user.full_name,
            email=current_user.email,
            role=current_user.role,
            overall_mastery=verified_mastery,
            circuits_count=profile.circuits_count if profile else 0,
            attempts_count=attempts_count,
            total_time_minutes=profile.total_time_minutes if profile else 0,
            recent_attempts=recent_attempts,
            detected_misconceptions=misconceptions,
            enrolled_classrooms_count=enrolled_count,
            verified_attempts=len(verified),
            passed_attempts=len(passed),
            competency_evidence=competency_evidence,
            recommendation=recommendation,
        )
