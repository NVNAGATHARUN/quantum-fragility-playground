"""Curriculum and Lesson Progress Router for Quantum Lens AI.

PHASE 3 SCOPE:
  - Records lesson COMPLETION events (participation, not mastery)
  - Validates module_id and lesson_id against the shared curriculum manifest
  - Does NOT generate authoritative mastery scores (Phase 10+)
  - Does NOT store graded assessment results (Phase 8)

Completion record schema:
  { module_id, lesson_id, content_version, completion_status: "completed" }

Checkpoint telemetry is NOT sent to this backend in Phase 3 — it is
stored locally in the browser. Phase 8 will introduce server-side
checkpoint grading.
"""

import json
import os
from pathlib import Path
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, status, HTTPException
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..db.session import get_db
from ..db.models import User, LessonProgress, LearnerProfile
from ..auth.router import get_current_user
from ..pedagogy.evidence import mark_intervention_studied

router = APIRouter(prefix="/api/v1/learn", tags=["learn"])

# ─── Load shared curriculum manifest ─────────────────────────────────────────

def _load_manifest() -> dict:
    """Load the shared curriculum manifest from curriculum/manifest.json.
    Returns an empty structure on any read error to fail gracefully."""
    candidate_paths = [
        Path(__file__).parents[3] / "curriculum" / "manifest.json",
        Path.cwd() / "curriculum" / "manifest.json",
        Path.cwd().parent / "curriculum" / "manifest.json",
    ]
    for p in candidate_paths:
        try:
            if p.exists():
                with open(p, "r", encoding="utf-8") as f:
                    return json.load(f)
        except (OSError, json.JSONDecodeError):
            continue
    return {"version": "unknown", "modules": []}

_MANIFEST = _load_manifest()

# Build fast lookup sets from manifest
_VALID_LESSON_IDS: set[str] = set()
_VALID_MODULE_IDS: set[str] = set()
for _mod in _MANIFEST.get("modules", []):
    _mid = _mod.get("id", "")
    _VALID_MODULE_IDS.add(_mid)
    for _les in _mod.get("lessons", []):
        _VALID_LESSON_IDS.add(f"{_mid}/{_les.get('id', '')}")


def _validate_ids(module_id: str, lesson_id: str) -> None:
    """Raise 422 if module_id or lesson_id are not in the manifest."""
    if module_id not in _VALID_MODULE_IDS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unknown module_id '{module_id}'",
        )
    key = f"{module_id}/{lesson_id}"
    if key not in _VALID_LESSON_IDS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unknown lesson_id '{lesson_id}' in module '{module_id}'",
        )


# ─── Request / Response Schemas ───────────────────────────────────────────────

class RecordProgressRequest(BaseModel):
    module_id: str = Field(..., min_length=1, max_length=100)
    lesson_id: str = Field(..., min_length=1, max_length=100)
    content_version: str = Field(default="1.0.0", min_length=1, max_length=20)
    completion_status: str = Field(default="completed", pattern="^completed$")


class LessonProgressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    module_id: str
    lesson_id: str
    content_version: str
    completion_status: str
    completed_at: datetime


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/progress", response_model=LessonProgressResponse, status_code=status.HTTP_200_OK)
async def record_lesson_progress(
    body: RecordProgressRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Record a lesson completion event for the authenticated learner.

    This records PARTICIPATION, not mastery. Completion status is always
    "completed" — partial or scored completion tracking is deferred to Phase 8.

    Validates module_id and lesson_id against the shared curriculum manifest
    to prevent progress records for non-existent content.
    """
    _validate_ids(body.module_id, body.lesson_id)

    # Idempotent — if already completed, update content_version on re-completion
    stmt = select(LessonProgress).where(
        LessonProgress.user_id == current_user.id,
        LessonProgress.module_id == body.module_id,
        LessonProgress.lesson_id == body.lesson_id,
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        existing.content_version = body.content_version
        existing.completion_status = body.completion_status
        record = existing
    else:
        record = LessonProgress(
            user_id=current_user.id,
            module_id=body.module_id,
            lesson_id=body.lesson_id,
            content_version=body.content_version,
            completion_status=body.completion_status,
        )
        db.add(record)

        # Update learner profile time estimate on first completion
        # NOTE: 12 minutes is a per-lesson estimate only — not a mastery metric.
        prof_res = await db.execute(
            select(LearnerProfile).where(LearnerProfile.user_id == current_user.id)
        )
        profile = prof_res.scalar_one_or_none()
        if profile:
            profile.total_time_minutes += 12

    # Lesson completion remains participation evidence.  When it matches an
    # active diagnosis it advances the intervention to "targeted"; only a
    # later passing server assessment can resolve it.
    await mark_intervention_studied(
        db,
        user_id=current_user.id,
        module_id=body.module_id,
        lesson_id=body.lesson_id,
    )

    await db.commit()
    await db.refresh(record)
    return record


@router.get("/progress", response_model=List[LessonProgressResponse])
async def get_user_lesson_progress(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all completed lessons for the current authenticated learner."""
    stmt = select(LessonProgress).where(LessonProgress.user_id == current_user.id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/curriculum")
async def get_curriculum_manifest():
    """
    Return the shared curriculum manifest for clients.

    Frontend content and backend validation both derive from the same
    curriculum/manifest.json. This endpoint exposes it for clients
    that need to discover available module/lesson IDs without bundling
    the full content.
    """
    return _MANIFEST
