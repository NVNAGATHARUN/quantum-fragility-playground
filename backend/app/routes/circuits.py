"""Saved Circuits and Physical Simulation Attempts Persistence Router for Quantum Lens AI.

Enables learners to save and retrieve circuits from database persistence,
and logs physical simulation attempts with cognitive delta tracking.
"""

from typing import List, Optional, Any, Dict
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from ..db.session import get_db
from ..db.models import User, SavedCircuit, CircuitAttempt, LearnerProfile
from ..auth.router import get_current_user

router = APIRouter(prefix="/api/v1/circuits", tags=["circuits"])


# --- Schemas ---

class SaveCircuitRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = ""
    circuit_ir: Dict[str, Any]
    is_public: Optional[bool] = False


class SavedCircuitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    description: str
    circuit_ir: Dict[str, Any]
    is_public: bool
    parent_id: Optional[str] = None
    fork_count: int = 0
    created_at: datetime
    updated_at: datetime


class ShareCircuitRequest(BaseModel):
    is_public: bool = True


class SharedCircuitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    description: str
    circuit_ir: Dict[str, Any]
    is_public: bool
    author_id: str
    author_name: str
    parent_id: Optional[str] = None
    parent_title: Optional[str] = None
    parent_author_name: Optional[str] = None
    fork_count: int = 0
    created_at: datetime
    updated_at: datetime
    permalink_url: str


class ForkCircuitRequest(BaseModel):
    title: Optional[str] = None


class ProvenanceResponse(BaseModel):
    circuit_id: str
    title: str
    author_name: str
    created_at: datetime
    fork_count: int
    is_fork: bool
    parent: Optional[Dict[str, Any]] = None


class LogAttemptRequest(BaseModel):
    circuit_ir: Dict[str, Any]
    prediction: Optional[Dict[str, Any]] = None
    outcome: Dict[str, Any]
    cognitive_delta: Optional[float] = None
    was_correct: Optional[bool] = None


class CircuitAttemptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    circuit_ir: Dict[str, Any]
    prediction: Optional[Dict[str, Any]]
    outcome: Dict[str, Any]
    cognitive_delta: Optional[float]
    was_correct: Optional[bool]
    timestamp: datetime



# --- Endpoints ---

@router.get("", response_model=List[SavedCircuitResponse])
async def list_user_circuits(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all saved circuits belonging to the authenticated learner.
    Returns an honest empty list if the user hasn't saved any circuits yet.
    """
    result = await db.execute(
        select(SavedCircuit)
        .where(SavedCircuit.user_id == current_user.id)
        .order_by(desc(SavedCircuit.updated_at))
    )
    circuits = result.scalars().all()
    return circuits


@router.post("", response_model=SavedCircuitResponse, status_code=status.HTTP_201_CREATED)
async def save_circuit(
    body: SaveCircuitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save a quantum circuit to the database for the authenticated learner."""
    circuit = SavedCircuit(
        user_id=current_user.id,
        title=body.title.strip(),
        description=body.description or "",
        circuit_ir=body.circuit_ir,
        is_public=bool(body.is_public),
    )
    db.add(circuit)

    # Increment learner profile circuits_count
    prof_res = await db.execute(select(LearnerProfile).where(LearnerProfile.user_id == current_user.id))
    profile = prof_res.scalar_one_or_none()
    if profile:
        profile.circuits_count += 1

    await db.commit()
    await db.refresh(circuit)
    return circuit


@router.get("/share/{circuit_id}", response_model=SharedCircuitResponse)
async def get_shared_circuit(
    circuit_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Fetch a public circuit for shared immutable permalinks (no auth required)."""
    result = await db.execute(
        select(SavedCircuit)
        .options(selectinload(SavedCircuit.author), selectinload(SavedCircuit.parent).selectinload(SavedCircuit.author))
        .where(SavedCircuit.id == circuit_id)
    )
    circuit = result.scalar_one_or_none()
    if not circuit or not circuit.is_public:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared circuit not found or is private",
        )

    parent_title = circuit.parent.title if circuit.parent else None
    parent_author_name = circuit.parent.author.full_name if circuit.parent and circuit.parent.author else None

    return SharedCircuitResponse(
        id=circuit.id,
        title=circuit.title,
        description=circuit.description,
        circuit_ir=circuit.circuit_ir,
        is_public=circuit.is_public,
        author_id=circuit.author.id if circuit.author else circuit.user_id,
        author_name=circuit.author.full_name if circuit.author else "Quantum Learner",
        parent_id=circuit.parent_id,
        parent_title=parent_title,
        parent_author_name=parent_author_name,
        fork_count=circuit.fork_count,
        created_at=circuit.created_at,
        updated_at=circuit.updated_at,
        permalink_url=f"/labs/studio/{circuit.id}",
    )


@router.get("/{circuit_id}", response_model=SavedCircuitResponse)
async def get_circuit(
    circuit_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch a saved circuit by ID (author or public access)."""
    result = await db.execute(select(SavedCircuit).where(SavedCircuit.id == circuit_id))
    circuit = result.scalar_one_or_none()
    if not circuit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Circuit not found")

    if circuit.user_id != current_user.id and not circuit.is_public:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to private circuit")

    return circuit


@router.post("/{circuit_id}/share", response_model=SharedCircuitResponse)
async def toggle_circuit_share(
    circuit_id: str,
    body: Optional[ShareCircuitRequest] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Enable or toggle public sharing for a circuit (author only)."""
    result = await db.execute(
        select(SavedCircuit)
        .options(selectinload(SavedCircuit.author), selectinload(SavedCircuit.parent).selectinload(SavedCircuit.author))
        .where(SavedCircuit.id == circuit_id)
    )
    circuit = result.scalar_one_or_none()
    if not circuit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Circuit not found")

    if circuit.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the circuit author can configure sharing")

    if body is not None:
        circuit.is_public = body.is_public
    else:
        circuit.is_public = True

    await db.commit()
    await db.refresh(circuit)

    parent_title = circuit.parent.title if circuit.parent else None
    parent_author_name = circuit.parent.author.full_name if circuit.parent and circuit.parent.author else None

    return SharedCircuitResponse(
        id=circuit.id,
        title=circuit.title,
        description=circuit.description,
        circuit_ir=circuit.circuit_ir,
        is_public=circuit.is_public,
        author_id=circuit.author.id if circuit.author else circuit.user_id,
        author_name=circuit.author.full_name if circuit.author else current_user.full_name,
        parent_id=circuit.parent_id,
        parent_title=parent_title,
        parent_author_name=parent_author_name,
        fork_count=circuit.fork_count,
        created_at=circuit.created_at,
        updated_at=circuit.updated_at,
        permalink_url=f"/labs/studio/{circuit.id}",
    )


@router.post("/{circuit_id}/fork", response_model=SavedCircuitResponse, status_code=status.HTTP_201_CREATED)
async def fork_circuit(
    circuit_id: str,
    body: Optional[ForkCircuitRequest] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fork an existing public or accessible circuit into the authenticated learner's workspace with provenance."""
    result = await db.execute(
        select(SavedCircuit)
        .options(selectinload(SavedCircuit.author))
        .where(SavedCircuit.id == circuit_id)
    )
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source circuit not found")

    if not source.is_public and source.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot fork a private circuit")

    # Increment source fork count
    source.fork_count += 1

    author_name = source.author.full_name if source.author else "Learner"
    fork_title = body.title.strip() if (body and body.title and body.title.strip()) else f"Fork of {source.title}"
    fork_description = f"Forked from '{source.title}' originally by {author_name}"

    forked_circuit = SavedCircuit(
        user_id=current_user.id,
        title=fork_title,
        description=fork_description,
        circuit_ir=source.circuit_ir,
        is_public=False,
        parent_id=source.id,
        fork_count=0,
    )
    db.add(forked_circuit)

    # Increment learner profile circuits_count
    prof_res = await db.execute(select(LearnerProfile).where(LearnerProfile.user_id == current_user.id))
    profile = prof_res.scalar_one_or_none()
    if profile:
        profile.circuits_count += 1

    await db.commit()
    await db.refresh(forked_circuit)
    return forked_circuit


@router.get("/{circuit_id}/provenance", response_model=ProvenanceResponse)
async def get_circuit_provenance(
    circuit_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve lineage, fork provenance, and ancestor tracking for a circuit."""
    result = await db.execute(
        select(SavedCircuit)
        .options(selectinload(SavedCircuit.author), selectinload(SavedCircuit.parent).selectinload(SavedCircuit.author))
        .where(SavedCircuit.id == circuit_id)
    )
    circuit = result.scalar_one_or_none()
    if not circuit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Circuit not found")

    parent_node = None
    if circuit.parent:
        parent_node = {
            "circuit_id": circuit.parent.id,
            "title": circuit.parent.title,
            "author_name": circuit.parent.author.full_name if circuit.parent.author else "Quantum Learner",
            "created_at": circuit.parent.created_at.isoformat() if circuit.parent.created_at else None,
            "fork_count": circuit.parent.fork_count,
        }

    return ProvenanceResponse(
        circuit_id=circuit.id,
        title=circuit.title,
        author_name=circuit.author.full_name if circuit.author else "Quantum Learner",
        created_at=circuit.created_at,
        fork_count=circuit.fork_count,
        is_fork=bool(circuit.parent_id),
        parent=parent_node,
    )


@router.post("/attempts", response_model=CircuitAttemptResponse, status_code=status.HTTP_201_CREATED)
async def log_circuit_attempt(
    body: LogAttemptRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Log an empirical simulation attempt or prediction exercise.
    Updates learner profile mastery based on empirical learner evidence.
    """
    attempt = CircuitAttempt(
        user_id=current_user.id,
        circuit_ir=body.circuit_ir,
        prediction=body.prediction,
        outcome=body.outcome,
        cognitive_delta=body.cognitive_delta,
        was_correct=body.was_correct,
    )
    db.add(attempt)

    # Update profile evidence
    prof_res = await db.execute(select(LearnerProfile).where(LearnerProfile.user_id == current_user.id))
    profile = prof_res.scalar_one_or_none()
    if profile:
        profile.circuits_count += 1
        if body.was_correct is True:
            # Incrementally improve mastery based on real success evidence (0.0 to 1.0)
            profile.overall_mastery = min(1.0, round(profile.overall_mastery + 0.05, 3))
        elif body.was_correct is False:
            profile.overall_mastery = max(0.0, round(profile.overall_mastery - 0.02, 3))

    await db.commit()
    await db.refresh(attempt)
    return attempt


@router.get("/attempts/history", response_model=List[CircuitAttemptResponse])
async def get_attempt_history(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve recent simulation attempts for the authenticated learner."""
    result = await db.execute(
        select(CircuitAttempt)
        .where(CircuitAttempt.user_id == current_user.id)
        .order_by(desc(CircuitAttempt.timestamp))
        .limit(limit)
    )
    return result.scalars().all()
