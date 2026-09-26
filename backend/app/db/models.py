"""SQLAlchemy Database Models for Quantum Lens AI.

Encapsulates Users, Classrooms, Enrollments, Learner Profiles, Saved Circuits,
and Physical Simulation Attempts for grounded progress tracking.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Float,
    Integer,
    DateTime,
    ForeignKey,
    Text,
    JSON,
)
from sqlalchemy.orm import relationship

from .session import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="student", nullable=False)  # "student" | "instructor"
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    profile = relationship("LearnerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    taught_classes = relationship("Classroom", back_populates="instructor", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    circuits = relationship("SavedCircuit", back_populates="author", cascade="all, delete-orphan")
    attempts = relationship("CircuitAttempt", back_populates="user", cascade="all, delete-orphan")
    misconceptions = relationship("LearnerMisconception", back_populates="user", cascade="all, delete-orphan")


class LearnerProfile(Base):
    __tablename__ = "learner_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    overall_mastery = Column(Float, default=0.0, nullable=False)
    circuits_count = Column(Integer, default=0, nullable=False)
    total_time_minutes = Column(Integer, default=0, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="profile")


class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    code = Column(String(10), unique=True, index=True, nullable=False)  # 6-character unique join code
    instructor_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    instructor = relationship("User", back_populates="taught_classes")
    enrollments = relationship("Enrollment", back_populates="classroom", cascade="all, delete-orphan")


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    classroom_id = Column(String(36), ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False)
    enrolled_at = Column(DateTime, default=utc_now, nullable=False)

    student = relationship("User", back_populates="enrollments")
    classroom = relationship("Classroom", back_populates="enrollments")


class Assignment(Base):
    """Instructor-issued learning activity with evidence derived from existing records."""
    __tablename__ = "assignments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    classroom_id = Column(String(36), ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False)
    instructor_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    activity_type = Column(String(30), nullable=False)  # lesson | guided | challenge
    activity_id = Column(String(200), nullable=False)
    route = Column(String(300), nullable=False)
    due_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)


class SavedCircuit(Base):
    __tablename__ = "saved_circuits"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="", nullable=False)
    circuit_ir = Column(JSON, nullable=False)
    is_public = Column(Boolean, default=False, nullable=False)
    parent_id = Column(String(36), ForeignKey("saved_circuits.id", ondelete="SET NULL"), nullable=True)
    fork_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    author = relationship("User", back_populates="circuits")
    parent = relationship("SavedCircuit", remote_side=[id], backref="forks")


class CircuitAttempt(Base):
    __tablename__ = "circuit_attempts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    circuit_ir = Column(JSON, nullable=False)
    prediction = Column(JSON, nullable=True)
    outcome = Column(JSON, nullable=False)
    cognitive_delta = Column(Float, nullable=True)
    was_correct = Column(Boolean, nullable=True)
    timestamp = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="attempts")


class LearnerMisconception(Base):
    __tablename__ = "learner_misconceptions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    misconception_id = Column(String(50), nullable=False)  # e.g. "M01", "M02", "M03"
    status = Column(String(50), default="detected", nullable=False)  # "detected" | "targeted" | "resolved"
    evidence = Column(Text, default="", nullable=False)
    detected_at = Column(DateTime, default=utc_now, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="misconceptions")


class LessonProgress(Base):
    """Records lesson completion events for a learner.

    Phase 3 scope:
    - Stores PARTICIPATION / COMPLETION, not mastery.
    - content_version records which version of the lesson was completed.
    - completion_status is always 'completed' (partial tracking deferred).
    - No client-generated score is stored. Authoritative assessment in Phase 8.
    """
    __tablename__ = "lesson_progress"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    module_id = Column(String(100), nullable=False)
    lesson_id = Column(String(100), nullable=False)
    content_version = Column(String(20), default="1.0.0", nullable=False)
    completion_status = Column(String(50), default="completed", nullable=False)
    completed_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", backref="lesson_progress")

