"""Run ARIA's reproducible offline benchmark and write its evidence report."""

from datetime import datetime, timezone
import json
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))

from app.ai.evaluation import run_deterministic_evaluation  # noqa: E402


def main() -> int:
    report = run_deterministic_evaluation()
    output = ROOT / "docs" / "ARIA_EVALUATION.md"
    rows = "\n".join(
        f"| {name.replace('_', ' ').title()} | {values['passed']} | {values['total']} |"
        for name, values in report["categories"].items()
    )
    failures = [item for item in report["results"] if not item["passed"]]
    failure_text = "None." if not failures else "\n".join(
        f"- `{item['id']}`: {', '.join(item['failures'])}" for item in failures
    )
    output.write_text(
        "# ARIA Evaluation Evidence\n\n"
        f"Generated: {datetime.now(timezone.utc).isoformat()}\n\n"
        f"**Result: {report['passed']}/{report['total']} "
        f"({report['pass_rate'] * 100:.1f}%)**\n\n"
        "| Capability | Passed | Total |\n| :--- | ---: | ---: |\n"
        f"{rows}\n\n"
        "## Scope\n\n"
        f"{report['claim_boundary']} The benchmark runs without Gemini or network access. "
        "It verifies tiered concept routing, internal citations, canonical circuit validation, "
        "debug findings, bounded optimization, and visible learner-evidence provenance.\n\n"
        "Structured numerical claims returned by the Gemini path are separately checked against "
        "server simulator values. Conflicting claims are rejected and replaced by the deterministic tutor.\n\n"
        "## Failures\n\n"
        f"{failure_text}\n\n"
        "## Reproduce\n\n"
        "```powershell\n"
        "backend\\.venv\\Scripts\\python.exe backend\\scripts\\evaluate_aria.py\n"
        "```\n",
        encoding="utf-8",
    )
    print(json.dumps({key: report[key] for key in ("benchmark", "passed", "total", "pass_rate")}, indent=2))
    print(f"Wrote {output}")
    return 0 if report["passed"] == report["total"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
