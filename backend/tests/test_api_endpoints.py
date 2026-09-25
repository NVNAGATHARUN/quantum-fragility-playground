"""FastAPI Integration Tests for Quantum Lens AI.

Tests /health, /api/v1/quantum/simulate, and /api/v1/quantum/fragility endpoints.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "Qiskit Aer" in data["kernel"]


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
