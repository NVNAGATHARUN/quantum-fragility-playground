"""End-to-end evidence journey used in the judge demonstration."""

import asyncio
import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="module", autouse=True)
def clean_database():
    from app.db.session import engine, Base
    from app.db import models  # noqa
    async def reset():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
    asyncio.run(reset())


def signup(client, email, role="student", invite=None):
    body = {"email": email, "password": "quantum-test-123", "full_name": email.split("@")[0], "role": role}
    if invite: body["instructor_invite_code"] = invite
    response = client.post("/api/v1/auth/signup", json=body)
    assert response.status_code == 201
    return response.json()["access_token"]


def test_bell_learning_journey_persists_evidence_and_assignment(monkeypatch):
    monkeypatch.setenv("INSTRUCTOR_INVITE_CODE", "journey-invite")
    with TestClient(app) as client:
        student = signup(client, "journey-student@example.test")
        instructor = signup(client, "journey-instructor@example.test", "instructor", "journey-invite")
        sh = {"Authorization": f"Bearer {student}"}
        ih = {"Authorization": f"Bearer {instructor}"}

        classroom = client.post("/api/v1/classrooms", json={"name": "Bell Evidence Cohort"}, headers=ih).json()
        assert client.post("/api/v1/classrooms/enroll", json={"code": classroom["code"]}, headers=sh).status_code == 200

        assignment = client.post(f'/api/v1/classrooms/{classroom["id"]}/assignments', json={
            "title": "Verify Bell phase", "activity_type": "challenge",
            "activity_id": "bell-phase-verification", "route": "/challenges/bell-phase-verification",
        }, headers=ih)
        assert assignment.status_code == 201

        bell_measured = {"schemaVersion":"1.0", "qubits":2, "classicalBits":2, "operations":[
            {"gate":"H","targets":[0],"step":0},
            {"gate":"CX","controls":[0],"targets":[1],"step":1},
            {"gate":"MEASURE","targets":[0],"step":2},
            {"gate":"MEASURE","targets":[1],"step":2},
        ]}
        guided = client.post("/api/v1/guided-labs/bell-state/checkpoints/2/evaluate", json={"circuit":bell_measured}, headers=sh)
        assert guided.status_code == 200 and guided.json()["passed"] is True
        summary = client.get("/api/v1/progress/summary", headers=sh).json()
        assert summary["recommendation"]["route"] == "/challenges/bell-phase-verification"

        bell = {**bell_measured, "operations": bell_measured["operations"][:2]}
        assessed = client.post("/api/v1/challenges/bell-phase-verification/evaluate", json={"circuit":bell}, headers=sh)
        assert assessed.status_code == 200 and assessed.json()["passed"] is True
        summary = client.get("/api/v1/progress/summary", headers=sh).json()
        assert summary["verified_attempts"] == 2
        assert summary["passed_attempts"] == 2
        assert summary["overall_mastery"] == 1.0

        assignments = client.get(f'/api/v1/classrooms/{classroom["id"]}/assignments', headers=ih).json()
        assert assignments[0]["completed_count"] == 1
        assert assignments[0]["student_count"] == 1
