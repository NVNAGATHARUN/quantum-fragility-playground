"""Create a repeatable local judge-demo cohort and learner evidence state."""

import argparse
import asyncio
import os
import sys
from pathlib import Path

from sqlalchemy import delete, select

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.auth.security import hash_password  # noqa: E402
from app.db.models import (  # noqa: E402
    Assignment,
    CircuitAttempt,
    Classroom,
    Enrollment,
    LearnerMisconception,
    LearnerProfile,
    LessonProgress,
    User,
)
from app.db.session import AsyncSessionLocal, init_db  # noqa: E402


STUDENT_EMAIL = "demo.student@quantumlens.local"
INSTRUCTOR_EMAIL = "demo.instructor@quantumlens.local"
CLASSROOM_CODE = "QL2026"


async def ensure_user(db, *, email: str, name: str, role: str, password: str) -> User:
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if user:
        user.full_name = name
        user.role = role
        user.hashed_password = hash_password(password)
        return user
    user = User(email=email, full_name=name, role=role, hashed_password=hash_password(password))
    db.add(user)
    await db.flush()
    db.add(LearnerProfile(user_id=user.id))
    return user


async def seed(reset: bool) -> None:
    await init_db()
    password = os.getenv("QL_DEMO_PASSWORD", "QuantumDemo!2026")
    async with AsyncSessionLocal() as db:
        student = await ensure_user(
            db,
            email=STUDENT_EMAIL,
            name="Demo Learner",
            role="student",
            password=password,
        )
        instructor = await ensure_user(
            db,
            email=INSTRUCTOR_EMAIL,
            name="Demo Instructor",
            role="instructor",
            password=password,
        )
        await db.flush()

        if reset:
            await db.execute(delete(CircuitAttempt).where(CircuitAttempt.user_id == student.id))
            await db.execute(delete(LearnerMisconception).where(LearnerMisconception.user_id == student.id))
            await db.execute(delete(LessonProgress).where(LessonProgress.user_id == student.id))
            profile = (await db.execute(
                select(LearnerProfile).where(LearnerProfile.user_id == student.id)
            )).scalar_one()
            profile.overall_mastery = 0.0
            profile.circuits_count = 0
            profile.total_time_minutes = 0

        classroom = (await db.execute(
            select(Classroom).where(Classroom.code == CLASSROOM_CODE)
        )).scalar_one_or_none()
        if not classroom:
            classroom = Classroom(
                name="Quantum Evidence Demo Cohort",
                code=CLASSROOM_CODE,
                instructor_id=instructor.id,
            )
            db.add(classroom)
            await db.flush()

        enrollment = (await db.execute(
            select(Enrollment).where(
                Enrollment.user_id == student.id,
                Enrollment.classroom_id == classroom.id,
            )
        )).scalar_one_or_none()
        if not enrollment:
            db.add(Enrollment(user_id=student.id, classroom_id=classroom.id))

        assignment = (await db.execute(
            select(Assignment).where(
                Assignment.classroom_id == classroom.id,
                Assignment.activity_id == "born-interference",
            )
        )).scalar_one_or_none()
        if not assignment:
            db.add(Assignment(
                classroom_id=classroom.id,
                instructor_id=instructor.id,
                title="Correct the phase-interference prediction",
                activity_type="challenge",
                activity_id="born-interference",
                route="/challenges/born-interference",
            ))

        existing_attempt = (await db.execute(
            select(CircuitAttempt).where(CircuitAttempt.user_id == student.id)
        )).scalars().first()
        if not existing_attempt:
            circuit = {
                "schemaVersion": "1.0",
                "version": "1.0",
                "qubits": 1,
                "classicalBits": 1,
                "operations": [
                    {"gate": "H", "targets": [0], "controls": [], "step": 0},
                    {"gate": "S", "targets": [0], "controls": [], "step": 1},
                    {"gate": "H", "targets": [0], "controls": [], "step": 2},
                ],
            }
            db.add(CircuitAttempt(
                user_id=student.id,
                circuit_ir=circuit,
                prediction={"0": 1.0, "1": 0.0},
                outcome={
                    "source": "server_assessment",
                    "challenge_id": "born-interference",
                    "challenge_title": "Predict Phase Interference",
                    "score": 0.0,
                    "passed": False,
                    "misconception_id": "M01",
                    "reason": "Prediction differed from the simulator-derived distribution.",
                },
                was_correct=False,
            ))
            db.add(LearnerMisconception(
                user_id=student.id,
                misconception_id="M01",
                status="detected",
                evidence="Predict Phase Interference: score 0.0%. Prediction differed from the simulator-derived distribution.",
            ))

        await db.commit()

    print("Judge demo state ready")
    print(f"Student:    {STUDENT_EMAIL}")
    print(f"Instructor: {INSTRUCTOR_EMAIL}")
    print(f"Password:   {password}")
    print(f"Class code: {CLASSROOM_CODE}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true", help="Reset the demo learner evidence before seeding")
    args = parser.parse_args()
    asyncio.run(seed(args.reset))
