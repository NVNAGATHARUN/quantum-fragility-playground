"""Phase 8 Automated Tests: Assessment System, Coding Challenges & Automated Grading.

Validates:
- GET /api/v1/challenges — Challenge catalog retrieval
- GET /api/v1/challenges/{id} — Single challenge retrieval & 404 handling
- POST /api/v1/challenges/{id}/evaluate —
    - Build challenge (GHZ state synthesis)
    - Debug challenge (SWAP gate orientation correction)
    - Predict challenge (Born rule probability prediction)
    - Optimization constraints (max gates, max depth)
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_challenges():
    res = client.get("/api/v1/challenges")
    assert res.status_code == 200
    challenges = res.json()
    assert len(challenges) >= 5

    types = {c["type"] for c in challenges}
    assert "build" in types
    assert "predict" in types
    assert "debug" in types
    assert "code" in types
    assert "optimize" in types


def test_get_challenge_detail():
    res = client.get("/api/v1/challenges/ghz-3qubit")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "ghz-3qubit"
    assert data["type"] == "build"
    assert data["difficulty"] == "Intermediate"
    assert data["starter_circuit"]["qubits"] == 3

    # 404 for unknown challenge
    res_404 = client.get("/api/v1/challenges/nonexistent-challenge-id")
    assert res_404.status_code == 404


def test_evaluate_build_ghz_challenge_failure():
    # Empty circuit should fail GHZ evaluation
    payload = {
        "circuit": {
            "schemaVersion": "1.0",
            "qubits": 3,
            "classicalBits": 3,
            "operations": [],
        }
    }
    res = client.post("/api/v1/challenges/ghz-3qubit/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["passed"] is False
    assert data["score"] < 100.0
    assert any(not tc["passed"] for tc in data["test_cases"])


def test_evaluate_build_ghz_challenge_success():
    # Correct GHZ circuit: H(0), CX(0,1), CX(1,2)
    payload = {
        "circuit": {
            "schemaVersion": "1.0",
            "qubits": 3,
            "classicalBits": 3,
            "operations": [
                {"id": "op1", "gate": "H", "targets": [0], "step": 0},
                {"id": "op2", "gate": "CX", "targets": [1], "controls": [0], "step": 1},
                {"id": "op3", "gate": "CX", "targets": [2], "controls": [1], "step": 2},
            ],
        }
    }
    res = client.post("/api/v1/challenges/ghz-3qubit/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["passed"] is True
    assert data["score"] == 100.0
    assert data["fidelity"] is not None and data["fidelity"] >= 0.99
    assert all(tc["passed"] for tc in data["test_cases"])


def test_invalid_auth_token_keeps_401_semantics():
    payload = {
        "circuit": {
            "schemaVersion": "1.0",
            "qubits": 3,
            "classicalBits": 3,
            "operations": [],
        }
    }
    res = client.post(
        "/api/v1/challenges/ghz-3qubit/evaluate",
        json=payload,
        headers={"Authorization": "Bearer invalid-token"},
    )
    assert res.status_code == 401


def test_evaluate_debug_swap_challenge():
    # Corrected SWAP: CX(0->1), CX(1->0), CX(0->1)
    payload = {
        "circuit": {
            "schemaVersion": "1.0",
            "qubits": 2,
            "classicalBits": 2,
            "operations": [
                {"id": "s1", "gate": "CX", "targets": [1], "controls": [0], "step": 0},
                {"id": "s2", "gate": "CX", "targets": [0], "controls": [1], "step": 1},  # Fixed middle CX
                {"id": "s3", "gate": "CX", "targets": [1], "controls": [0], "step": 2},
            ],
        }
    }
    res = client.post("/api/v1/challenges/swap-direction-debug/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["passed"] is True
    assert data["fidelity"] is not None and data["fidelity"] >= 0.999


def test_evaluate_predict_challenge():
    # Predict challenge: H -> S -> H produces 50% |0> and 50% |1>
    circuit_payload = {
        "schemaVersion": "1.0",
        "qubits": 1,
        "classicalBits": 1,
        "operations": [
            {"id": "p1", "gate": "H", "targets": [0], "step": 0},
            {"id": "p2", "gate": "S", "targets": [0], "step": 1},
            {"id": "p3", "gate": "H", "targets": [0], "step": 2},
        ],
    }

    # Good prediction
    res_good = client.post(
        "/api/v1/challenges/born-interference/evaluate",
        json={"circuit": circuit_payload, "prediction": {"0": 0.50, "1": 0.50}},
    )
    assert res_good.status_code == 200
    assert res_good.json()["passed"] is True

    # Bad prediction
    res_bad = client.post(
        "/api/v1/challenges/born-interference/evaluate",
        json={"circuit": circuit_payload, "prediction": {"0": 1.0, "1": 0.0}},
    )
    assert res_bad.status_code == 200
    assert res_bad.json()["passed"] is False


def test_evaluate_optimization_constraints():
    # Exceeding max gates for optimize challenge
    payload = {
        "circuit": {
            "schemaVersion": "1.0",
            "qubits": 2,
            "classicalBits": 2,
            "operations": [
                {"id": "o1", "gate": "CX", "targets": [1], "controls": [0], "step": 0},
                {"id": "o2", "gate": "CX", "targets": [0], "controls": [1], "step": 1},
                {"id": "o3", "gate": "CX", "targets": [1], "controls": [0], "step": 2},
                {"id": "o4", "gate": "H", "targets": [0], "step": 3},  # Unnecessary 4th gate
            ],
        }
    }
    res = client.post("/api/v1/challenges/cnot-swap-optimization/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["passed"] is False
    constraint_tc = next((t for t in data["test_cases"] if "Constraint" in t["name"]), None)
    assert constraint_tc is not None
    assert constraint_tc["passed"] is False
