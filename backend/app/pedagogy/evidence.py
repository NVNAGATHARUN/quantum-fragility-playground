"""Persisted misconception evidence and adaptive intervention rules.

The assessment engines own correctness.  This module only translates a
server-graded result into a learner-state transition and a review route.
"""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.models import LearnerMisconception


INTERVENTIONS = {
    "M01": {
        "title": "Rebuild phase and interference",
        "lesson_route": "/learn/m04-superposition-interference/global-vs-relative-phase",
        "retry_route": "/challenges/born-interference",
        "conflict_route": "/conflict-lab?lab=lab-m01-interference",
    },
    "M02": {
        "title": "Test the no-signalling principle",
        "lesson_route": "/learn/m05-entanglement-correlation/correlation-inspector",
        "retry_route": "/diagnostic?phase=post",
        "conflict_route": "/conflict-lab?lab=lab-m02-no-signalling",
    },
    "M03": {
        "title": "Distinguish coherence from a mixture",
        "lesson_route": "/learn/m04-superposition-interference/interference-experiment",
        "retry_route": "/challenges/bell-phase-verification",
        "conflict_route": "/conflict-lab?lab=lab-m03-mixture",
    },
    "M04": {
        "title": "Revisit measurement back-action",
        "lesson_route": "/learn/m02-qubits-measurement/measurement-challenge",
        "retry_route": "/labs/guided/measurement",
        "conflict_route": "/conflict-lab?lab=lab-m04-chsh",
    },
    "M05": {
        "title": "Test when CNOT creates entanglement",
        "lesson_route": "/learn/m05-entanglement-correlation/cnot-entangler",
        "retry_route": "/labs/guided/bell-state",
        "conflict_route": "/conflict-lab?lab=lab-m05-cnot",
    },
    "M06": {
        "title": "Rebuild Grover amplitude amplification",
        "lesson_route": "/learn/m06-standard-algorithms/grover-search",
        "retry_route": "/diagnostic?phase=post",
        "conflict_route": "/experiments/grover",
    },
    "M07": {
        "title": "Make relative phase observable",
        "lesson_route": "/learn/m04-superposition-interference/global-vs-relative-phase",
        "retry_route": "/diagnostic?phase=post",
        "conflict_route": "/conflict-lab?lab=lab-m01-interference",
    },
    "M08": {
        "title": "Separate physical noise from software error",
        "lesson_route": "/learn/m08-real-systems/decoherence-relaxation",
        "retry_route": "/diagnostic?phase=post",
        "conflict_route": "/labs/fragility",
    },
}

ACTIVITY_MISCONCEPTIONS = {
    ("server_assessment", "born-interference"): "M01",
    ("server_assessment", "bell-phase-verification"): "M03",
    ("server_assessment", "ghz-3qubit"): "M05",
    ("guided_lab", "superposition"): "M01",
    ("guided_lab", "phase"): "M01",
    ("guided_lab", "measurement"): "M04",
    ("guided_lab", "bell-state"): "M05",
}

LESSON_MISCONCEPTIONS = {
    ("m04-superposition-interference", "global-vs-relative-phase"): "M01",
    ("m04-superposition-interference", "interference-experiment"): "M03",
    ("m02-qubits-measurement", "measurement-challenge"): "M04",
    ("m05-entanglement-correlation", "cnot-entangler"): "M05",
    ("m05-entanglement-correlation", "correlation-inspector"): "M02",
    ("m06-standard-algorithms", "grover-search"): "M06",
    ("m08-real-systems", "decoherence-relaxation"): "M08",
}


def misconception_for_activity(source: str, activity_id: str) -> Optional[str]:
    return ACTIVITY_MISCONCEPTIONS.get((source, activity_id))


def misconception_for_lesson(module_id: str, lesson_id: str) -> Optional[str]:
    return LESSON_MISCONCEPTIONS.get((module_id, lesson_id))


async def record_assessment_evidence(
    db: AsyncSession,
    *,
    user_id: str,
    misconception_id: Optional[str],
    passed: bool,
    evidence: str,
) -> Optional[LearnerMisconception]:
    """Detect on failure and resolve an existing misconception on a passing retry."""
    if not misconception_id:
        return None
    result = await db.execute(
        select(LearnerMisconception)
        .where(
            LearnerMisconception.user_id == user_id,
            LearnerMisconception.misconception_id == misconception_id,
        )
        .order_by(LearnerMisconception.detected_at.desc())
    )
    record = result.scalars().first()
    now = datetime.now(timezone.utc)
    if passed:
        if record and record.status in {"detected", "targeted"}:
            record.status = "resolved"
            record.resolved_at = now
            record.evidence = f"{record.evidence}\nResolved by: {evidence}".strip()
        return record
    if record and record.status != "resolved":
        record.status = "detected"
        record.evidence = evidence
        record.detected_at = now
        record.resolved_at = None
        return record
    record = LearnerMisconception(
        user_id=user_id,
        misconception_id=misconception_id,
        status="detected",
        evidence=evidence,
        detected_at=now,
    )
    db.add(record)
    return record


async def mark_intervention_studied(
    db: AsyncSession,
    *,
    user_id: str,
    module_id: str,
    lesson_id: str,
) -> Optional[LearnerMisconception]:
    """Mark an active diagnosis as targeted after its mapped remediation lesson."""
    misconception_id = misconception_for_lesson(module_id, lesson_id)
    if not misconception_id:
        return None
    result = await db.execute(
        select(LearnerMisconception)
        .where(
            LearnerMisconception.user_id == user_id,
            LearnerMisconception.misconception_id == misconception_id,
            LearnerMisconception.status.in_(["detected", "targeted"]),
        )
        .order_by(LearnerMisconception.detected_at.desc())
    )
    record = result.scalars().first()
    if record:
        record.status = "targeted"
        marker = f"Remediation studied: {module_id}/{lesson_id}"
        if marker not in record.evidence:
            record.evidence = f"{record.evidence}\n{marker}".strip()
    return record


def intervention_recommendation(record: LearnerMisconception) -> dict:
    intervention = INTERVENTIONS.get(record.misconception_id)
    if not intervention:
        return {
            "title": "Review the latest diagnostic",
            "reason": "A server-graded attempt identified a concept to revisit.",
            "route": "/progress/details",
            "evidence": record.evidence,
            "misconception_id": record.misconception_id,
            "stage": record.status,
        }
    targeted = record.status == "targeted"
    return {
        "title": f"Retry: {intervention['title']}" if targeted else intervention["title"],
        "reason": (
            "You completed the targeted explanation. Retry the graded activity to demonstrate the corrected model."
            if targeted
            else "Your latest server-graded evidence indicates this specific conceptual model needs attention."
        ),
        "route": intervention["retry_route"] if targeted else intervention["lesson_route"],
        "evidence": record.evidence,
        "misconception_id": record.misconception_id,
        "stage": record.status,
        "conflict_route": intervention["conflict_route"],
    }
