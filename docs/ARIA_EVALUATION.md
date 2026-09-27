# ARIA Evaluation Evidence

Generated: 2026-09-27T19:55:02.411233+00:00

**Result: 40/40 (100.0%)**

| Capability | Passed | Total |
| :--- | ---: | ---: |
| Progressive Concept Guidance | 24 | 24 |
| Validated Circuit Generation | 6 | 6 |
| Circuit Debugging | 4 | 4 |
| Bounded Optimization | 3 | 3 |
| Evidence Transparency | 3 | 3 |

## Scope

Automated contract regression only; not an independent expert review, LLM quality score, or evidence of learner impact. The benchmark runs without Gemini or network access. It verifies tiered concept routing, internal citations, canonical circuit validation, debug findings, bounded optimization, and visible learner-evidence provenance.

Structured numerical claims returned by the Gemini path are separately checked against server simulator values. Conflicting claims are rejected and replaced by the deterministic tutor.

## Failures

None.

## Reproduce

```powershell
backend\.venv\Scripts\python.exe backend\scripts\evaluate_aria.py
```
