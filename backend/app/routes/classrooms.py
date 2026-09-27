"""Classroom Management and Student Enrollment Router for Quantum Lens AI.

Enables instructors to create verified cohorts with unique 6-character join codes,
and enables students to enroll in classrooms. Real empty rosters return empty lists.
"""

import random
import string
from typing import List, Optional, Dict
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from ..db.session import get_db
from ..db.models import User, Classroom, Enrollment, LearnerProfile, LearnerMisconception, CircuitAttempt, Assignment, LessonProgress, DiagnosticAttempt
from ..auth.router import get_current_user, require_roles

router = APIRouter(prefix="/api/v1/classrooms", tags=["classrooms"])


@router.get("/{classroom_id}/learning-gains")
async def get_classroom_learning_gains(
    classroom_id: str,
    current_user: User = Depends(require_roles(["instructor"])),
    db: AsyncSession = Depends(get_db),
):
    classroom = (await db.execute(select(Classroom).where(
        Classroom.id == classroom_id, Classroom.instructor_id == current_user.id
    ))).scalar_one_or_none()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    students = (await db.execute(
        select(User).join(Enrollment, User.id == Enrollment.user_id).where(Enrollment.classroom_id == classroom_id)
    )).scalars().all()
    student_ids = [student.id for student in students]
    attempts = [] if not student_ids else (await db.execute(
        select(DiagnosticAttempt).where(DiagnosticAttempt.user_id.in_(student_ids)).order_by(DiagnosticAttempt.completed_at.desc())
    )).scalars().all()
    latest = {}
    for attempt in attempts:
        latest.setdefault((attempt.user_id, attempt.phase), attempt)
    rows = []
    for student in students:
        baseline = latest.get((student.id, "baseline"))
        post = latest.get((student.id, "post"))
        rows.append({
            "student_id": student.id, "full_name": student.full_name,
            "baseline_score": baseline.score if baseline else None,
            "post_score": post.score if post else None,
            "improvement": round(post.score - baseline.score, 1) if baseline and post else None,
        })
    paired = [row for row in rows if row["improvement"] is not None]
    baseline_rows = [row for row in rows if row["baseline_score"] is not None]
    post_rows = [row for row in rows if row["post_score"] is not None]
    average = lambda values: round(sum(values) / len(values), 1) if values else None
    return {
        "classroom_id": classroom_id, "student_count": len(students), "paired_learners": len(paired),
        "average_baseline": average([row["baseline_score"] for row in baseline_rows]),
        "average_post": average([row["post_score"] for row in post_rows]),
        "average_improvement": average([row["improvement"] for row in paired]),
        "students": rows,
    }


def generate_classroom_code() -> str:
    """Generate a clean, unambiguous 6-character alphanumeric code."""
    # Exclude ambiguous characters (0, O, 1, I, L)
    chars = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
    return "".join(random.choices(chars, k=6))


# --- Schemas ---

class CreateClassroomRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Name of the classroom/cohort")


class ClassroomResponse(BaseModel):
    id: str
    name: str
    code: str
    instructor_id: str
    created_at: datetime
    student_count: int = 0


class EnrollRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=10, description="6-character classroom join code")


class EnrolledStudentResponse(BaseModel):
    student_id: str
    full_name: str
    email: str
    enrolled_at: datetime
    overall_mastery: float
    circuits_count: int
    verified_attempts: int
    passed_attempts: int
    average_verified_score: float
    latest_verified_at: Optional[datetime] = None


class CreateAssignmentRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    activity_type: str = Field(..., pattern="^(lesson|guided|challenge)$")
    activity_id: str = Field(..., min_length=2, max_length=200)
    route: str = Field(..., min_length=2, max_length=300, pattern="^/")
    due_at: Optional[datetime] = None


# --- Endpoints ---

@router.post("", response_model=ClassroomResponse, status_code=status.HTTP_201_CREATED)
async def create_classroom(
    body: CreateClassroomRequest,
    current_user: User = Depends(require_roles(["instructor"])),
    db: AsyncSession = Depends(get_db),
):
    """Create a new classroom cohort with a unique 6-character code (Instructors only)."""
    # Generate unique code
    code = ""
    for _ in range(10):
        candidate = generate_classroom_code()
        existing = await db.execute(select(Classroom).where(Classroom.code == candidate))
        if not existing.scalar_one_or_none():
            code = candidate
            break
    if not code:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate unique classroom code",
        )

    classroom = Classroom(
        name=body.name.strip(),
        code=code,
        instructor_id=current_user.id,
    )
    db.add(classroom)
    await db.commit()
    await db.refresh(classroom)

    return ClassroomResponse(
        id=classroom.id,
        name=classroom.name,
        code=classroom.code,
        instructor_id=classroom.instructor_id,
        created_at=classroom.created_at,
        student_count=0,
    )


@router.get("", response_model=List[ClassroomResponse])
async def list_classrooms(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List classrooms relevant to the authenticated user.
    Instructors see their created classrooms; Students see enrolled classrooms.
    """
    if current_user.role == "instructor":
        result = await db.execute(
            select(
                Classroom,
                func.count(Enrollment.id).label("student_count")
            )
            .outerjoin(Enrollment, Classroom.id == Enrollment.classroom_id)
            .where(Classroom.instructor_id == current_user.id)
            .group_by(Classroom.id)
        )
        rows = result.all()
        return [
            ClassroomResponse(
                id=c.id,
                name=c.name,
                code=c.code,
                instructor_id=c.instructor_id,
                created_at=c.created_at,
                student_count=count,
            )
            for c, count in rows
        ]
    else:
        # Student enrollments
        result = await db.execute(
            select(Classroom)
            .join(Enrollment, Classroom.id == Enrollment.classroom_id)
            .where(Enrollment.user_id == current_user.id)
        )
        classrooms = result.scalars().all()
        return [
            ClassroomResponse(
                id=c.id,
                name=c.name,
                code=c.code,
                instructor_id=c.instructor_id,
                created_at=c.created_at,
                student_count=0,
            )
            for c in classrooms
        ]


@router.post("/enroll", status_code=status.HTTP_200_OK)
async def enroll_in_classroom(
    body: EnrollRequest,
    current_user: User = Depends(require_roles(["student"])),
    db: AsyncSession = Depends(get_db),
):
    """Enroll a student in a classroom cohort using the 6-character code."""
    clean_code = body.code.strip().upper()
    result = await db.execute(select(Classroom).where(Classroom.code == clean_code))
    classroom = result.scalar_one_or_none()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No classroom found with join code '{clean_code}'",
        )

    # Check for existing enrollment
    existing_enrollment = await db.execute(
        select(Enrollment).where(
            Enrollment.user_id == current_user.id,
            Enrollment.classroom_id == classroom.id,
        )
    )
    if existing_enrollment.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You are already enrolled in classroom '{classroom.name}'",
        )

    enrollment = Enrollment(user_id=current_user.id, classroom_id=classroom.id)
    db.add(enrollment)
    await db.commit()

    return {
        "success": True,
        "message": f"Successfully enrolled in {classroom.name}",
        "classroom_id": classroom.id,
        "classroom_name": classroom.name,
        "code": classroom.code,
    }


@router.get("/{classroom_id}/roster", response_model=List[EnrolledStudentResponse])
async def get_classroom_roster(
    classroom_id: str,
    current_user: User = Depends(require_roles(["instructor"])),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve verified roster of enrolled students for a classroom (Instructor only).
    Returns an honest empty list if no students are enrolled yet.
    """
    # Verify instructor owns the classroom
    result = await db.execute(
        select(Classroom).where(
            Classroom.id == classroom_id,
            Classroom.instructor_id == current_user.id,
        )
    )
    classroom = result.scalar_one_or_none()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom not found or you do not have permission to view its roster",
        )

    # Fetch students enrolled in this classroom with their LearnerProfile
    roster_query = (
        select(User, Enrollment.enrolled_at, LearnerProfile)
        .join(Enrollment, User.id == Enrollment.user_id)
        .outerjoin(LearnerProfile, User.id == LearnerProfile.user_id)
        .where(Enrollment.classroom_id == classroom.id)
        .order_by(Enrollment.enrolled_at.desc())
    )
    roster_result = await db.execute(roster_query)
    rows = roster_result.all()

    # Honest empty state if zero students
    response = []
    for student, enrolled_at, profile in rows:
        attempts = (await db.execute(select(CircuitAttempt).where(CircuitAttempt.user_id == student.id))).scalars().all()
        verified = [a for a in attempts if isinstance(a.outcome, dict) and a.outcome.get("source") in {"guided_lab", "server_assessment"}]
        passed = [a for a in verified if a.outcome.get("passed")]
        response.append(EnrolledStudentResponse(
            student_id=student.id,
            full_name=student.full_name,
            email=student.email,
            enrolled_at=enrolled_at,
            overall_mastery=profile.overall_mastery if profile else 0.0,
            circuits_count=profile.circuits_count if profile else 0,
            verified_attempts=len(verified),
            passed_attempts=len(passed),
            average_verified_score=round(sum(float(a.outcome.get("score", 0)) for a in verified) / len(verified), 1) if verified else 0.0,
            latest_verified_at=max((a.timestamp for a in verified), default=None),
        ))
    return response


def _assignment_completed(assignment: Assignment, attempts, lessons) -> bool:
    if assignment.activity_type == "lesson":
        return any(f"{item.module_id}/{item.lesson_id}" == assignment.activity_id for item in lessons)
    if assignment.activity_type == "challenge":
        return any(isinstance(a.outcome, dict) and a.outcome.get("source") == "server_assessment" and a.outcome.get("challenge_id") == assignment.activity_id and a.outcome.get("passed") for a in attempts)
    lab_id, _, checkpoint = assignment.activity_id.partition(":")
    return any(isinstance(a.outcome, dict) and a.outcome.get("source") == "guided_lab" and a.outcome.get("lab_id") == lab_id and str(a.outcome.get("checkpoint")) == checkpoint and a.outcome.get("passed") for a in attempts)


@router.post("/{classroom_id}/assignments", status_code=status.HTTP_201_CREATED)
async def create_assignment(classroom_id: str, body: CreateAssignmentRequest,
                            current_user: User = Depends(require_roles(["instructor"])),
                            db: AsyncSession = Depends(get_db)):
    classroom = (await db.execute(select(Classroom).where(Classroom.id == classroom_id, Classroom.instructor_id == current_user.id))).scalar_one_or_none()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    assignment = Assignment(classroom_id=classroom_id, instructor_id=current_user.id, **body.model_dump())
    db.add(assignment)
    await db.commit(); await db.refresh(assignment)
    student_count = (await db.execute(select(func.count(Enrollment.id)).where(Enrollment.classroom_id == classroom_id))).scalar() or 0
    return {"id": assignment.id, **body.model_dump(mode="json"), "created_at": assignment.created_at, "completed_count": 0, "student_count": student_count}


@router.get("/{classroom_id}/assignments")
async def list_assignments(classroom_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    classroom = (await db.execute(select(Classroom).where(Classroom.id == classroom_id))).scalar_one_or_none()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    if current_user.role == "instructor" and classroom.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your classroom")
    if current_user.role == "student":
        enrolled = (await db.execute(select(Enrollment).where(Enrollment.classroom_id == classroom_id, Enrollment.user_id == current_user.id))).scalar_one_or_none()
        if not enrolled: raise HTTPException(status_code=403, detail="Not enrolled")
    assignments = (await db.execute(select(Assignment).where(Assignment.classroom_id == classroom_id).order_by(Assignment.created_at.desc()))).scalars().all()
    student_ids = [row[0] for row in (await db.execute(select(Enrollment.user_id).where(Enrollment.classroom_id == classroom_id))).all()]
    attempts_by_student = {student_id: [] for student_id in student_ids}
    lessons_by_student = {student_id: [] for student_id in student_ids}
    if student_ids:
        all_attempts = (await db.execute(select(CircuitAttempt).where(CircuitAttempt.user_id.in_(student_ids)))).scalars().all()
        all_lessons = (await db.execute(select(LessonProgress).where(LessonProgress.user_id.in_(student_ids)))).scalars().all()
        for attempt in all_attempts:
            attempts_by_student[attempt.user_id].append(attempt)
        for lesson in all_lessons:
            lessons_by_student[lesson.user_id].append(lesson)
    payload = []
    for item in assignments:
        completed = [
            student_id
            for student_id in student_ids
            if _assignment_completed(
                item,
                attempts_by_student[student_id],
                lessons_by_student[student_id],
            )
        ]
        payload.append({"id": item.id, "title": item.title, "activity_type": item.activity_type, "activity_id": item.activity_id, "route": item.route, "due_at": item.due_at, "created_at": item.created_at, "completed_count": len(completed), "student_count": len(student_ids), "current_user_completed": current_user.id in completed})
    return payload


# --- Cohort Misconception Analytics ---

MISCONCEPTION_METADATA = [
    {
        "id": "M01",
        "title": "Superposition = Classical Coin Toss",
        "description": "Treating |+⟩ as an incomplete classical 50/50 mixture instead of a coherent quantum state with phase interference.",
        "category": "superposition",
        "conflict_lab_id": "lab-m01-interference",
        "recommended_route": "/conflict-lab?lab=lab-m01-interference",
    },
    {
        "id": "M02",
        "title": "Entanglement Enables FTL Signaling",
        "description": "Believing local measurement on an entangled pair can transmit instantaneous faster-than-light signals to a remote party.",
        "category": "entanglement",
        "conflict_lab_id": "lab-m02-no-signaling",
        "recommended_route": "/conflict-lab?lab=lab-m02-no-signaling",
    },
    {
        "id": "M03",
        "title": "Superposition = Statistical Mixture",
        "description": "Failing to distinguish between a pure coherent state and an incoherent mixed density matrix ensemble.",
        "category": "coherence",
        "conflict_lab_id": "lab-m03-mixture",
        "recommended_route": "/conflict-lab?lab=lab-m03-mixture",
    },
    {
        "id": "M04",
        "title": "Measurement as Passive Inspection",
        "description": "Assuming quantum measurement merely observes pre-existing deterministic classical hidden variables.",
        "category": "measurement",
        "conflict_lab_id": "lab-m04-chsh",
        "recommended_route": "/conflict-lab?lab=lab-m04-chsh",
    },
    {
        "id": "M05",
        "title": "CNOT Always Produces Entanglement",
        "description": "Believing applying a CNOT gate always generates entanglement, even on separable computational basis states.",
        "category": "entanglement",
        "conflict_lab_id": "lab-m05-cnot",
        "recommended_route": "/conflict-lab?lab=lab-m05-cnot",
    },
    {
        "id": "M06",
        "title": "Grover Search = Brute-Force",
        "description": "Assuming Grover's algorithm checks search space items sequentially instead of rotating the state vector in Hilbert space.",
        "category": "algorithms",
        "conflict_lab_id": "lab-m06-grover",
        "recommended_route": "/explore/grover",
    },
    {
        "id": "M07",
        "title": "Teleportation = Matter Transmission",
        "description": "Believing quantum teleportation physically transports matter or duplicates information in violation of No-Cloning.",
        "category": "information",
        "conflict_lab_id": "lab-m07-teleportation",
        "recommended_route": "/explore/teleportation",
    },
    {
        "id": "M08",
        "title": "Decoherence = Information Destruction",
        "description": "Viewing environmental decoherence as intrinsic state loss rather than system-bath entanglement and phase randomization.",
        "category": "noise",
        "conflict_lab_id": "lab-m08-fragility",
        "recommended_route": "/fragility",
    },
]


class MisconceptionPrevalenceItem(BaseModel):
    id: str
    title: str
    description: str
    category: str
    conflict_lab_id: str
    recommended_route: str
    detected_count: int
    resolved_count: int
    prevalence_rate: float


class StudentMisconceptionStatus(BaseModel):
    misconception_id: str
    status: str  # "detected" | "targeted" | "resolved" | "unencountered"
    detected_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    evidence: Optional[str] = None


class StudentMatrixRow(BaseModel):
    student_id: str
    full_name: str
    email: str
    overall_mastery: float
    circuits_count: int
    misconceptions: Dict[str, StudentMisconceptionStatus]


class ClassroomMisconceptionsResponse(BaseModel):
    classroom_id: str
    classroom_name: str
    classroom_code: str
    total_students: int
    active_misconceptions_count: int
    resolved_misconceptions_count: int
    misconceptions: List[MisconceptionPrevalenceItem]
    student_matrix: List[StudentMatrixRow]


@router.get("/{classroom_id}/misconceptions", response_model=ClassroomMisconceptionsResponse)
async def get_classroom_misconceptions(
    classroom_id: str,
    current_user: User = Depends(require_roles(["instructor"])),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve cohort-wide aggregate misconception prevalence and student-misconception matrix.
    Derives telemetry strictly from real student records.
    Returns honest zero-states when no students are enrolled.
    """
    # 1. Verify instructor owns the classroom
    result = await db.execute(
        select(Classroom).where(
            Classroom.id == classroom_id,
            Classroom.instructor_id == current_user.id,
        )
    )
    classroom = result.scalar_one_or_none()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom not found or you do not have permission to view its analytics",
        )

    # 2. Query all enrolled students
    roster_query = (
        select(User, Enrollment.enrolled_at, LearnerProfile)
        .join(Enrollment, User.id == Enrollment.user_id)
        .outerjoin(LearnerProfile, User.id == LearnerProfile.user_id)
        .where(Enrollment.classroom_id == classroom.id)
        .order_by(Enrollment.enrolled_at.desc())
    )
    roster_rows = (await db.execute(roster_query)).all()
    total_students = len(roster_rows)

    # 3. Honest zero-state if zero students
    if total_students == 0:
        return ClassroomMisconceptionsResponse(
            classroom_id=classroom.id,
            classroom_name=classroom.name,
            classroom_code=classroom.code,
            total_students=0,
            active_misconceptions_count=0,
            resolved_misconceptions_count=0,
            misconceptions=[
                MisconceptionPrevalenceItem(
                    id=meta["id"],
                    title=meta["title"],
                    description=meta["description"],
                    category=meta["category"],
                    conflict_lab_id=meta["conflict_lab_id"],
                    recommended_route=meta["recommended_route"],
                    detected_count=0,
                    resolved_count=0,
                    prevalence_rate=0.0,
                )
                for meta in MISCONCEPTION_METADATA
            ],
            student_matrix=[],
        )

    # 4. Fetch all misconception records for students in this cohort
    student_ids = [student.id for student, _, _ in roster_rows]
    misc_query = (
        select(LearnerMisconception)
        .where(LearnerMisconception.user_id.in_(student_ids))
    )
    misc_rows = (await db.execute(misc_query)).scalars().all()

    # Map misconceptions by (user_id, misconception_id) -> record
    user_misc_map: Dict[str, Dict[str, LearnerMisconception]] = {uid: {} for uid in student_ids}
    for record in misc_rows:
        if record.user_id in user_misc_map:
            user_misc_map[record.user_id][record.misconception_id] = record

    # Calculate aggregate counts per misconception
    detected_counts: Dict[str, int] = {meta["id"]: 0 for meta in MISCONCEPTION_METADATA}
    resolved_counts: Dict[str, int] = {meta["id"]: 0 for meta in MISCONCEPTION_METADATA}

    for record in misc_rows:
        mid = record.misconception_id
        if mid in detected_counts:
            if record.status in ("detected", "targeted"):
                detected_counts[mid] += 1
            elif record.status == "resolved":
                resolved_counts[mid] += 1

    total_active = sum(detected_counts.values())
    total_resolved = sum(resolved_counts.values())

    prevalence_items = [
        MisconceptionPrevalenceItem(
            id=meta["id"],
            title=meta["title"],
            description=meta["description"],
            category=meta["category"],
            conflict_lab_id=meta["conflict_lab_id"],
            recommended_route=meta["recommended_route"],
            detected_count=detected_counts[meta["id"]],
            resolved_count=resolved_counts[meta["id"]],
            prevalence_rate=round(detected_counts[meta["id"]] / total_students, 3),
        )
        for meta in MISCONCEPTION_METADATA
    ]

    # Build student matrix
    student_matrix: List[StudentMatrixRow] = []
    for student, _, profile in roster_rows:
        student_statuses: Dict[str, StudentMisconceptionStatus] = {}
        student_records = user_misc_map.get(student.id, {})

        for meta in MISCONCEPTION_METADATA:
            mid = meta["id"]
            if mid in student_records:
                rec = student_records[mid]
                student_statuses[mid] = StudentMisconceptionStatus(
                    misconception_id=mid,
                    status=rec.status,
                    detected_at=rec.detected_at,
                    resolved_at=rec.resolved_at,
                    evidence=rec.evidence,
                )
            else:
                student_statuses[mid] = StudentMisconceptionStatus(
                    misconception_id=mid,
                    status="unencountered",
                )

        student_matrix.append(
            StudentMatrixRow(
                student_id=student.id,
                full_name=student.full_name,
                email=student.email,
                overall_mastery=profile.overall_mastery if profile else 0.0,
                circuits_count=profile.circuits_count if profile else 0,
                misconceptions=student_statuses,
            )
        )

    return ClassroomMisconceptionsResponse(
        classroom_id=classroom.id,
        classroom_name=classroom.name,
        classroom_code=classroom.code,
        total_students=total_students,
        active_misconceptions_count=total_active,
        resolved_misconceptions_count=total_resolved,
        misconceptions=prevalence_items,
        student_matrix=student_matrix,
    )

