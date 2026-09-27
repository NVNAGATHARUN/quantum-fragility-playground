from app.ai.evaluation import build_evaluation_cases, run_deterministic_evaluation


def test_aria_deterministic_grounded_benchmark():
    cases = build_evaluation_cases()
    assert len(cases) == 40
    report = run_deterministic_evaluation()
    assert report["passed"] == report["total"] == 40, [
        result for result in report["results"] if not result["passed"]
    ]
    assert "not an independent expert review" in report["claim_boundary"]
