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

        parity = client.post("/api/v1/quantum/parity", json={
            "circuit": bell, "shots": 256, "tolerance": 0.01,
        })
        assert parity.status_code == 200
        parity_body = parity.json()
        assert parity_body["all_pass"] is True
        assert set(parity_body["circuits"]) >= {"qiskit", "pennylane", "cirq"}
        assert all(item["pass"] for item in parity_body["parity_checks"])

        mentor = client.post("/api/v1/ai/mentor", json={
            "message": "Explain what this Bell circuit proves without inventing measurements.",
            "mode": "explain",
            "context": {"circuit": bell, "hintTier": 2},
        })
        assert mentor.status_code == 200
        mentor_body = mentor.json()
        assert mentor_body["source"] == "deterministic"
        assert "prose" in mentor_body["validationScope"].lower()

        assessed = client.post("/api/v1/challenges/bell-phase-verification/evaluate", json={"circuit":bell}, headers=sh)
        assert assessed.status_code == 200 and assessed.json()["passed"] is True
        summary = client.get("/api/v1/progress/summary", headers=sh).json()
        assert summary["verified_attempts"] == 2
        assert summary["passed_attempts"] == 2
        assert summary["overall_mastery"] == 1.0

        assignments = client.get(f'/api/v1/classrooms/{classroom["id"]}/assignments', headers=ih).json()
        assert assignments[0]["completed_count"] == 1
        assert assignments[0]["student_count"] == 1


def test_failed_prediction_drives_targeted_lesson_retry_and_resolution():
    """The adaptive loop must change state only from server-owned evidence."""
    with TestClient(app) as client:
        student = signup(client, "adaptive-loop@example.test")
        headers = {"Authorization": f"Bearer {student}"}
        circuit = {
            "schemaVersion": "1.0",
            "qubits": 1,
            "classicalBits": 1,
            "operations": [
                {"gate": "H", "targets": [0], "step": 0},
                {"gate": "S", "targets": [0], "step": 1},
                {"gate": "H", "targets": [0], "step": 2},
            ],
        }

        failed = client.post(
            "/api/v1/challenges/born-interference/evaluate",
            json={"circuit": circuit, "prediction": {"0": 1.0, "1": 0.0}},
            headers=headers,
        )
        assert failed.status_code == 200 and failed.json()["passed"] is False
        diagnosed = client.get("/api/v1/progress/summary", headers=headers).json()
        assert diagnosed["detected_misconceptions"][0]["misconception_id"] == "M01"
        assert diagnosed["detected_misconceptions"][0]["status"] == "detected"
        assert diagnosed["recommendation"]["route"] == "/learn/m04-superposition-interference/global-vs-relative-phase"
        assert diagnosed["recommendation"]["stage"] == "detected"

        studied = client.post(
            "/api/v1/learn/progress",
            json={
                "module_id": "m04-superposition-interference",
                "lesson_id": "global-vs-relative-phase",
                "content_version": "1.0.0",
                "completion_status": "completed",
            },
            headers=headers,
        )
        assert studied.status_code == 200
        targeted = client.get("/api/v1/progress/summary", headers=headers).json()
        assert targeted["detected_misconceptions"][0]["status"] == "targeted"
        assert targeted["recommendation"]["route"] == "/challenges/born-interference"

        passed = client.post(
            "/api/v1/challenges/born-interference/evaluate",
            json={"circuit": circuit, "prediction": {"0": 0.5, "1": 0.5}},
            headers=headers,
        )
        assert passed.status_code == 200 and passed.json()["passed"] is True
        resolved = client.get("/api/v1/progress/summary", headers=headers).json()
        assert resolved["detected_misconceptions"][0]["status"] == "resolved"
        assert resolved["detected_misconceptions"][0]["resolved_at"] is not None
        assert resolved["recommendation"]["route"] == "/learn/m06-standard-algorithms/deutsch-jozsa"
