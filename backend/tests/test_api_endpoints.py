"""FastAPI Integration Tests for Quantum Lens AI.

Tests /health, /api/v1/quantum/simulate, and /api/v1/quantum/fragility endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_api_root_is_a_useful_landing_response():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Quantum Lens AI API"
    assert data["status"] == "online"
    assert data["documentation"] == "/docs"
    assert data["readiness"] == "/health/ready"


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "Qiskit Aer" in data["kernel"]


def test_readiness_endpoint_checks_database_and_simulator():
    response = client.get("/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["database"] == "reachable"
    assert "aer" in data["simulation_backend"].lower()


def test_simulate_api_endpoint():
    payload = {
        "circuit": {
            "version": "1.0",
            "qubits": 2,
            "classicalBits": 2,
            "operations": [
                {"id": "g-01", "gate": "H", "targets": [0], "controls": [], "step": 0},
                {"id": "g-02", "gate": "CX", "targets": [1], "controls": [0], "step": 1},
            ],
        },
        "backend": "qiskit-aer",
        "shots": 500,
    }
    response = client.post("/api/v1/quantum/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["backend"] == "qiskit-aer"
    assert data["probabilities"]["00"] > 0.45
    assert data["probabilities"]["11"] > 0.45
    assert data["reducedStates"][0]["isEntangled"] is True


@pytest.mark.parametrize(
    ("requested_backend", "resolved_backend"),
    [
        ("qiskit-aer", "qiskit-aer"),
        ("cirq", "cirq-simulator"),
        ("pennylane", "pennylane-default.qubit"),
    ],
)
def test_simulate_executes_the_selected_framework(requested_backend, resolved_backend):
    payload = {
        "circuit": {
            "version": "1.0",
            "qubits": 2,
            "classicalBits": 2,
            "operations": [
                {"gate": "H", "targets": [0], "controls": [], "step": 0},
                {"gate": "CX", "targets": [1], "controls": [0], "step": 1},
            ],
        },
        "backend": requested_backend,
        "shots": 256,
    }
    response = client.post("/api/v1/quantum/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["backend"] == resolved_backend
    assert data["probabilities"]["00"] == pytest.approx(0.5, abs=1e-5)
    assert data["probabilities"]["11"] == pytest.approx(0.5, abs=1e-5)
    assert sum(data["counts"].values()) == 256


@pytest.mark.parametrize("backend", ["cirq", "pennylane"])
def test_unitary_only_backends_explain_measurement_limitation(backend):
    payload = {
        "circuit": {
            "version": "1.0",
            "qubits": 1,
            "classicalBits": 1,
            "operations": [
                {"gate": "H", "targets": [0], "step": 0},
                {
                    "gate": "MEASURE",
                    "type": "MEASURE",
                    "targets": [0],
                    "classicalTargets": [0],
                    "step": 1,
                },
            ],
        },
        "backend": backend,
        "shots": 128,
    }
    response = client.post("/api/v1/quantum/simulate", json=payload)
    assert response.status_code == 400
    assert "unitary circuits only" in response.json()["detail"]


def test_simulation_rejects_unbounded_statevector_requests():
    payload = {
        "circuit": {
            "schemaVersion": "1.0",
            "qubits": 17,
            "classicalBits": 0,
            "operations": [],
        },
        "shots": 100,
    }
    response = client.post("/api/v1/quantum/simulate", json=payload)
    assert response.status_code == 413
    assert "limited to 16 qubits" in response.json()["detail"]


def test_fragility_api_endpoint():
    payload = {
        "circuit": {
            "version": "1.0",
            "qubits": 1,
            "classicalBits": 1,
            "operations": [
                {"id": "g-01", "gate": "X", "targets": [0], "controls": [], "step": 0}
            ],
        },
        "t1_us": 20.0,
        "t2_us": 30.0,
        "channel": "amplitude_damping",
    }
    response = client.post("/api/v1/quantum/fragility", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "trajectory" in data
    assert len(data["trajectory"]) > 0


def test_capabilities_endpoint_structure():
    """GET /api/v1/system/capabilities returns real self-test results."""
    response = client.get("/api/v1/system/capabilities")
    assert response.status_code == 200
    data = response.json()

    # Top-level fields
    assert "overallSimulationStatus" in data
    assert data["overallSimulationStatus"] in ("available", "partially_available", "unavailable")
    assert "frameworks" in data
    assert "api" in data

    # Required framework keys
    frameworks = data["frameworks"]
    for key in ("qiskit_aer", "pennylane", "cirq", "qbraid"):
        assert key in frameworks, f"Missing framework key: {key}"
        fw = frameworks[key]
        assert "installed" in fw
        assert "configured" in fw
        assert "selfTestPassed" in fw
        assert fw["status"] in ("available", "partially_available", "unavailable")


def test_capabilities_qiskit_aer_self_test_passes():
    """Qiskit Aer must pass its own self-test since it is the primary kernel."""
    response = client.get("/api/v1/system/capabilities")
    assert response.status_code == 200
    data = response.json()
    qiskit = data["frameworks"]["qiskit_aer"]
    assert qiskit["installed"] is True, "Qiskit Aer must be installed"
    assert qiskit["selfTestPassed"] is True, f"Qiskit Aer self-test failed: {qiskit.get('reason')}"
    assert qiskit["status"] == "available"
    assert data["overallSimulationStatus"] == "available"
