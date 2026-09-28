from app.ai.evaluation import build_evaluation_cases, run_deterministic_evaluation
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_aria_deterministic_grounded_benchmark():
    cases = build_evaluation_cases()
    assert len(cases) == 40
    report = run_deterministic_evaluation()
    assert report["passed"] == report["total"] == 40, [
        result for result in report["results"] if not result["passed"]
    ]
    assert "not an independent expert review" in report["claim_boundary"]


def test_ai_status_discloses_provider_and_claim_boundary(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    response = client.get("/api/v1/ai/status")
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "deterministic"
    assert data["deterministic_fallback"] is True
    assert data["simulator_claim_validation"] is True
    assert "not" in data["claim_boundary"].lower()


def test_ai_evaluation_is_publicly_inspectable():
    response = client.get("/api/v1/ai/evaluation")
    assert response.status_code == 200
    data = response.json()
    assert data["passed"] == data["total"] == 40
    assert data["pass_rate"] == 1.0
