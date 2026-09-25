"""Automated Tests for Phase 2: Real Database Persistence, Auth, RBAC & Honest States."""

import asyncio
import pytest
from fastapi.testclient import TestClient
from app.db.session import init_db
from app.main import app


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Ensure clean database schema is created before tests execute."""
    from app.db.session import engine, Base

    async def reset_db():
        from app.db import models  # noqa: F401
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(reset_db())



@pytest.fixture(scope="module")
def client():
    """TestClient that runs app lifespan context."""
    with TestClient(app) as c:
        yield c



def test_auth_signup_student(client):
    """Test student signup, token generation, and initial zero-state profile."""
    res = client.post("/api/v1/auth/signup", json={
        "email": "student_alpha@example.edu",
        "password": "quantum_password_123",
        "full_name": "Aarav Sharma",
        "role": "student"
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "student_alpha@example.edu"
    assert data["user"]["role"] == "student"


def test_auth_signup_instructor(client):
    """Test instructor signup with valid instructor role."""
    res = client.post("/api/v1/auth/signup", json={
        "email": "dr_physicist@example.edu",
        "password": "instructor_pass_456",
        "full_name": "Dr. Maya Raman",
        "role": "instructor"
    })
    assert res.status_code == 201
    data = res.json()
    assert data["user"]["role"] == "instructor"


def test_auth_duplicate_email_rejected(client):
    """Test duplicate registration returns HTTP 400."""
    res = client.post("/api/v1/auth/signup", json={
        "email": "student_alpha@example.edu",
        "password": "another_password",
        "full_name": "Clone User",
        "role": "student"
    })
    assert res.status_code == 400
    assert "already registered" in res.json()["detail"].lower()


def test_auth_login_success(client):
    """Test valid credentials login."""
    res = client.post("/api/v1/auth/login", json={
        "email": "student_alpha@example.edu",
        "password": "quantum_password_123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "student_alpha@example.edu"


def test_auth_login_invalid_password(client):
    """Test wrong password returns HTTP 401."""
    res = client.post("/api/v1/auth/login", json={
        "email": "student_alpha@example.edu",
        "password": "wrong_password"
    })
    assert res.status_code == 401


def test_auth_me_protected_route(client):
    """Test GET /api/v1/auth/me requires valid Bearer token."""
    # Unauthenticated
    unauth_res = client.get("/api/v1/auth/me")
    assert unauth_res.status_code == 401

    # Authenticated
    login_res = client.post("/api/v1/auth/login", json={
        "email": "student_alpha@example.edu",
        "password": "quantum_password_123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "student_alpha@example.edu"


def test_rbac_classroom_creation_and_enrollment(client):
    """Test instructor creates classroom, student enrolls with 6-char code, honest roster."""
    # 1. Login student and instructor
    student_token = client.post("/api/v1/auth/login", json={
        "email": "student_alpha@example.edu",
        "password": "quantum_password_123"
    }).json()["access_token"]

    inst_token = client.post("/api/v1/auth/login", json={
        "email": "dr_physicist@example.edu",
        "password": "instructor_pass_456"
    }).json()["access_token"]

    student_headers = {"Authorization": f"Bearer {student_token}"}
    inst_headers = {"Authorization": f"Bearer {inst_token}"}

    # 2. Student trying to create classroom must be FORBIDDEN (403)
    forbidden_res = client.post("/api/v1/classrooms", json={"name": "Illegal Class"}, headers=student_headers)
    assert forbidden_res.status_code == 403

    # 3. Instructor creates classroom
    create_res = client.post("/api/v1/classrooms", json={"name": "Intro to Quantum Mechanics 101"}, headers=inst_headers)
    assert create_res.status_code == 201
    class_data = create_res.json()
    class_id = class_data["id"]
    class_code = class_data["code"]
    assert len(class_code) == 6
    assert class_data["student_count"] == 0

    # 4. Empty roster check (honest empty state: exactly 0 students)
    empty_roster_res = client.get(f"/api/v1/classrooms/{class_id}/roster", headers=inst_headers)
    assert empty_roster_res.status_code == 200
    assert empty_roster_res.json() == []

    # 5. Student enrolls via code
    enroll_res = client.post("/api/v1/classrooms/enroll", json={"code": class_code}, headers=student_headers)
    assert enroll_res.status_code == 200
    assert enroll_res.json()["success"] is True

    # 6. Duplicate enrollment blocked
    dup_res = client.post("/api/v1/classrooms/enroll", json={"code": class_code}, headers=student_headers)
    assert dup_res.status_code == 400

    # 7. Roster now contains exactly 1 student
    roster_res = client.get(f"/api/v1/classrooms/{class_id}/roster", headers=inst_headers)
    assert roster_res.status_code == 200
    roster = roster_res.json()
    assert len(roster) == 1
    assert roster[0]["email"] == "student_alpha@example.edu"
    assert roster[0]["full_name"] == "Aarav Sharma"

    # 8. Misconceptions heatmap telemetry endpoint
    misc_res = client.get(f"/api/v1/classrooms/{class_id}/misconceptions", headers=inst_headers)
    assert misc_res.status_code == 200
    misc_data = misc_res.json()
    assert misc_data["total_students"] == 1
    assert len(misc_data["misconceptions"]) == 8
    assert len(misc_data["student_matrix"]) == 1
    assert misc_data["student_matrix"][0]["email"] == "student_alpha@example.edu"
    assert "M01" in misc_data["student_matrix"][0]["misconceptions"]


def test_saved_circuits_persistence(client):
    """Test saving and retrieving circuits."""
    student_token = client.post("/api/v1/auth/login", json={
        "email": "student_alpha@example.edu",
        "password": "quantum_password_123"
    }).json()["access_token"]
    headers = {"Authorization": f"Bearer {student_token}"}

    circuit_ir = {
        "num_qubits": 2,
        "gates": [
            {"gate": "H", "targets": [0]},
            {"gate": "CX", "controls": [0], "targets": [1]}
        ]
    }

    # Save circuit
    save_res = client.post("/api/v1/circuits", json={
        "title": "Bell State Phi Plus",
        "description": "Maximal entanglement test",
        "circuit_ir": circuit_ir,
        "is_public": False
    }, headers=headers)
    assert save_res.status_code == 201
    circuit_id = save_res.json()["id"]

    # List circuits
    list_res = client.get("/api/v1/circuits", headers=headers)
    assert list_res.status_code == 200
    circuits = list_res.json()
    assert any(c["id"] == circuit_id for c in circuits)


def test_honest_progress_summary(client):
    """Test learner progress summary derives only from real DB entries."""
    student_token = client.post("/api/v1/auth/login", json={
        "email": "student_alpha@example.edu",
        "password": "quantum_password_123"
    }).json()["access_token"]
    headers = {"Authorization": f"Bearer {student_token}"}

    summary_res = client.get("/api/v1/progress/summary", headers=headers)
    assert summary_res.status_code == 200
    data = summary_res.json()
    assert data["email"] == "student_alpha@example.edu"
    assert data["role"] == "student"
    assert isinstance(data["overall_mastery"], (int, float))
    assert data["enrolled_classrooms_count"] == 1
    assert isinstance(data["recent_attempts"], list)


def test_circuit_sharing_and_forking(client):
    """Phase 16 verification: Sharing via permalinks, forking, and provenance tracking."""
    # 1. Author (Student Alpha) creates a circuit
    token_a = client.post("/api/v1/auth/login", json={
        "email": "student_alpha@example.edu",
        "password": "quantum_password_123"
    }).json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    circuit_ir = {
        "num_qubits": 2,
        "gates": [
            {"gate": "H", "targets": [0]},
            {"gate": "CX", "controls": [0], "targets": [1]}
        ]
    }

    save_res = client.post("/api/v1/circuits", json={
        "title": "Quantum Teleportation Core",
        "description": "Bell pair generator for teleportation protocol",
        "circuit_ir": circuit_ir,
        "is_public": False
    }, headers=headers_a)
    assert save_res.status_code == 201
    circuit_a = save_res.json()
    cid_a = circuit_a["id"]

    # 2. Before sharing, public permalink access must fail (404/private)
    unshared_res = client.get(f"/api/v1/circuits/share/{cid_a}")
    assert unshared_res.status_code == 404

    # 3. Author shares the circuit publicly
    share_res = client.post(f"/api/v1/circuits/{cid_a}/share", json={"is_public": True}, headers=headers_a)
    assert share_res.status_code == 200
    shared_data = share_res.json()
    assert shared_data["is_public"] is True
    assert shared_data["permalink_url"] == f"/labs/studio/{cid_a}"
    assert shared_data["author_name"] == "Aarav Sharma"

    # 4. Public permalink access now succeeds (unauthenticated request)
    public_res = client.get(f"/api/v1/circuits/share/{cid_a}")
    assert public_res.status_code == 200
    pub_circuit = public_res.json()
    assert pub_circuit["title"] == "Quantum Teleportation Core"
    assert pub_circuit["author_name"] == "Aarav Sharma"

    # 5. Instructor forks the circuit
    inst_token = client.post("/api/v1/auth/login", json={
        "email": "dr_physicist@example.edu",
        "password": "instructor_pass_456"
    }).json()["access_token"]
    headers_inst = {"Authorization": f"Bearer {inst_token}"}

    fork_res = client.post(f"/api/v1/circuits/{cid_a}/fork", json={
        "title": "Instructor Customized Teleportation"
    }, headers=headers_inst)
    assert fork_res.status_code == 201
    forked_data = fork_res.json()
    assert forked_data["title"] == "Instructor Customized Teleportation"
    assert forked_data["parent_id"] == cid_a

    # 6. Provenance check on forked circuit
    prov_res = client.get(f"/api/v1/circuits/{forked_data['id']}/provenance")
    assert prov_res.status_code == 200
    prov = prov_res.json()
    assert prov["is_fork"] is True
    assert prov["parent"]["circuit_id"] == cid_a
    assert prov["parent"]["title"] == "Quantum Teleportation Core"
    assert prov["parent"]["author_name"] == "Aarav Sharma"

