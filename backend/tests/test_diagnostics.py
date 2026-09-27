"""Baseline/post diagnostics and eight-concept misconception evidence."""

import asyncio
import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="module", autouse=True)
def clean_database():
    from app.db.session import engine, Base
    from app.db import models  # noqa: F401
    async def reset():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
    asyncio.run(reset())


def signup(client, email="diagnostic@example.test"):
    response = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": "quantum-test-123",
        "full_name": "Diagnostic Learner",
        "role": "student",
    })
    assert response.status_code == 201
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_alternate_forms_measure_improvement_and_cover_all_misconceptions():
    with TestClient(app) as client:
        headers = signup(client, "diagnostic-incomplete@example.test")
        baseline = client.get("/api/v1/diagnostics/form/baseline", headers=headers)
        post = client.get("/api/v1/diagnostics/form/post", headers=headers)
        assert baseline.status_code == 200 and post.status_code == 200
        baseline_items = baseline.json()["items"]
        post_items = post.json()["items"]
        assert {item["misconception_id"] for item in baseline_items} == {f"M{i:02d}" for i in range(1, 9)}
        assert {item["id"] for item in baseline_items}.isdisjoint({item["id"] for item in post_items})

        failed = client.post("/api/v1/diagnostics/submit", headers=headers, json={
            "phase": "baseline",
            "responses": {item["id"]: 3 for item in baseline_items},
            "confidence": {item["id"]: 5 for item in baseline_items},
        })
        assert failed.status_code == 200
        assert failed.json()["score"] < 100
        progress = client.get("/api/v1/progress/summary", headers=headers).json()
        assert {m["misconception_id"] for m in progress["detected_misconceptions"]} == {f"M{i:02d}" for i in range(1, 9)}

        # Correct indices are held on the server and deliberately differ by form.
        correct_post = {"p-m01":1,"p-m02":2,"p-m03":1,"p-m04":0,"p-m05":0,"p-m06":1,"p-m07":0,"p-m08":1}
        passed = client.post("/api/v1/diagnostics/submit", headers=headers, json={
            "phase": "post", "responses": correct_post,
            "confidence": {key: 4 for key in correct_post},
        })
        assert passed.status_code == 200 and passed.json()["score"] == 100
        summary = client.get("/api/v1/diagnostics/summary", headers=headers).json()
        assert summary["baseline"]["score"] < summary["post"]["score"]
        assert summary["improvement"] > 0
        resolved = client.get("/api/v1/progress/summary", headers=headers).json()
        assert all(m["status"] == "resolved" for m in resolved["detected_misconceptions"])


def test_diagnostic_requires_complete_server_owned_form():
    with TestClient(app) as client:
        headers = signup(client)
        response = client.post("/api/v1/diagnostics/submit", headers=headers, json={
            "phase": "baseline", "responses": {"b-m01": 1}
        })
        assert response.status_code == 422


def test_instructor_sees_only_measured_paired_learning_gain(monkeypatch):
    monkeypatch.setenv("INSTRUCTOR_INVITE_CODE", "diagnostic-invite")
    with TestClient(app) as client:
        student = signup(client, "gain-student@example.test")
        instructor_response = client.post("/api/v1/auth/signup", json={
            "email": "gain-instructor@example.test", "password": "quantum-test-123",
            "full_name": "Gain Instructor", "role": "instructor", "instructor_invite_code": "diagnostic-invite",
        })
        assert instructor_response.status_code == 201
        instructor = {"Authorization": f"Bearer {instructor_response.json()['access_token']}"}
        classroom = client.post("/api/v1/classrooms", headers=instructor, json={"name": "Measured Cohort"}).json()
        code = classroom["code"]
        assert client.post("/api/v1/classrooms/enroll", headers=student, json={"code": code}).status_code == 200
        baseline_items = client.get("/api/v1/diagnostics/form/baseline", headers=student).json()["items"]
        client.post("/api/v1/diagnostics/submit", headers=student, json={"phase":"baseline", "responses":{item["id"]:3 for item in baseline_items}})
        correct_post = {"p-m01":1,"p-m02":2,"p-m03":1,"p-m04":0,"p-m05":0,"p-m06":1,"p-m07":0,"p-m08":1}
        client.post("/api/v1/diagnostics/submit", headers=student, json={"phase":"post", "responses":correct_post})
        gains = client.get(f"/api/v1/classrooms/{classroom['id']}/learning-gains", headers=instructor)
        assert gains.status_code == 200
        body = gains.json()
        assert body["paired_learners"] == 1
        assert body["average_post"] == 100
        assert body["average_improvement"] > 0
