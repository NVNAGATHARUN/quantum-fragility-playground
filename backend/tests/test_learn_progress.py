"""Tests for Phase 3 Learn Curriculum and Lesson Completion Endpoints."""

import pytest
from app.main import app
from app.db.session import init_db
from fastapi.testclient import TestClient

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Ensure clean database schema with all tables initialized."""
    import asyncio
    asyncio.run(init_db())


@pytest.fixture
def client():
    return TestClient(app)


def test_get_curriculum_manifest(client):
    """Test public curriculum manifest endpoint."""
    res = client.get("/api/v1/learn/curriculum")
    assert res.status_code == 200
    data = res.json()
    assert "modules" in data
    assert len(data["modules"]) >= 2
    # Verify module 01 is present
    mod_ids = [m["id"] for m in data["modules"]]
    assert "m01-math-primer" in mod_ids
    assert "m02-qubits-measurement" in mod_ids


def test_all_ps26140_curriculum_modules_are_released(client):
    """Core concepts promised by PS26140 must not remain placeholder modules."""
    res = client.get("/api/v1/learn/curriculum")
    assert res.status_code == 200
    modules = {module["id"]: module for module in res.json()["modules"]}

    expected_counts = {
        "m04-superposition-interference": 4,
        "m05-entanglement-correlation": 4,
        "m06-standard-algorithms": 3,
        "m07-variational-hybrid": 2,
        "m08-real-systems": 2,
    }
    for module_id, lesson_count in expected_counts.items():
        assert modules[module_id]["status"] == "available"
        assert len(modules[module_id]["lessons"]) == lesson_count
        assert all(lesson["content_version"] == "1.0.0" for lesson in modules[module_id]["lessons"])


def test_unauthenticated_progress_rejected(client):
    """Unauthenticated calls to /api/v1/learn/progress must return 401."""
    res = client.post("/api/v1/learn/progress", json={
        "module_id": "m01-math-primer",
        "lesson_id": "dirac-notation",
        "content_version": "1.0.0",
        "completion_status": "completed",
    })
    assert res.status_code == 401


def test_authenticated_record_and_get_progress(client):
    """Test recording and retrieving lesson progress for authenticated student."""
    # 1. Sign up a new student
    email = "learner_phase3@example.com"
    pwd = "secure_password_123"
    signup_res = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": pwd,
        "full_name": "Phase3 Learner",
        "role": "student"
    })
    if signup_res.status_code == 400:
        # Already exists, just log in
        login_res = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
        token = login_res.json()["access_token"]
    else:
        token = signup_res.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Record completion of M01 Dirac Notation
    record_res = client.post("/api/v1/learn/progress", json={
        "module_id": "m01-math-primer",
        "lesson_id": "dirac-notation",
        "content_version": "1.0.0",
        "completion_status": "completed",
    }, headers=headers)
    assert record_res.status_code == 200
    rec_data = record_res.json()
    assert rec_data["module_id"] == "m01-math-primer"
    assert rec_data["lesson_id"] == "dirac-notation"
    assert rec_data["completion_status"] == "completed"

    # 3. Idempotent re-submission (e.g. user reviews lesson and completes again)
    re_res = client.post("/api/v1/learn/progress", json={
        "module_id": "m01-math-primer",
        "lesson_id": "dirac-notation",
        "content_version": "1.0.1",
        "completion_status": "completed",
    }, headers=headers)
    assert re_res.status_code == 200
    assert re_res.json()["content_version"] == "1.0.1"

    # 4. Fetch list of completed lessons
    list_res = client.get("/api/v1/learn/progress", headers=headers)
    assert list_res.status_code == 200
    progress_list = list_res.json()
    assert len(progress_list) >= 1
    assert any(p["lesson_id"] == "dirac-notation" for p in progress_list)


def test_invalid_lesson_or_module_rejected(client):
    """Validation against shared manifest rejects fake module or lesson IDs."""
    login_res = client.post("/api/v1/auth/login", json={
        "email": "learner_phase3@example.com",
        "password": "secure_password_123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Invalid module
    bad_mod_res = client.post("/api/v1/learn/progress", json={
        "module_id": "m99-fake-module",
        "lesson_id": "nonexistent-lesson",
        "content_version": "1.0.0",
        "completion_status": "completed",
    }, headers=headers)
    assert bad_mod_res.status_code == 422

    # Valid module, invalid lesson
    bad_les_res = client.post("/api/v1/learn/progress", json={
        "module_id": "m01-math-primer",
        "lesson_id": "fake-lesson-xyz",
        "content_version": "1.0.0",
        "completion_status": "completed",
    }, headers=headers)
    assert bad_les_res.status_code == 422
