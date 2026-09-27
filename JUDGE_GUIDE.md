# Quantum Lens AI — PS 26140 Judge Guide

Quantum Lens AI is an evidence-first quantum learning platform. Its strongest differentiator is not the number of screens: a learner can predict, build, simulate, receive server grading, and obtain a reasoned next activity while an instructor sees the same persisted evidence.

## What is real, and what is a teaching model?

| Result type | Implementation | Claim boundary |
| :--- | :--- | :--- |
| Circuit probabilities, counts and state metrics | Qiskit Aer | Simulator-derived |
| Cross-framework parity | Native Qiskit Aer, Cirq and PennyLane adapters | Supported unitary CircuitIR gate subset |
| Fragility/noise | Density-matrix and Kraus-channel model | Educational simulation, not hardware telemetry |
| VQE $H_2$ | Aer Pauli sampling over a fitted two-qubit Hamiltonian | Educational fitted model, not ab-initio chemistry |
| Quantum repeater | Ideal four-qubit Aer circuit plus analytical fiber loss | Excludes memory, detector and gate noise |
| AI mentor | Deterministic circuit-grounded mode; optional Gemini | Provenance is shown; generated CircuitIR is validated |
| Mastery | Persisted server-graded attempts | Browser-only interactions do not award authoritative mastery |

## Five-minute winning demo

Reset the repeatable local evidence state before the session:

```powershell
backend\.venv\Scripts\python.exe backend\scripts\seed_demo.py --reset
```

1. Sign in with the printed demo-student credentials and open `/progress`. Show that the failed graded prediction created an M01 diagnosis and a targeted phase lesson recommendation.
   For a learning-impact demonstration, open `/diagnostic?phase=baseline`, submit the baseline form, then use the alternate post form after remediation. The instructor dashboard reports only paired, persisted score differences.
2. Complete `/learn/m04-superposition-interference/global-vs-relative-phase`. Return to progress and show that the same diagnosis is now **targeted** and recommends the graded retry. A passing retry changes it to **resolved**.
3. Open `/labs/studio`, load the Bell circuit, and choose **Compare engines**. Show Qiskit, PennyLane and Cirq execution plus the measured total variation distance. State clearly that this is local simulator parity, not hardware execution.
   While signed in, name and save the circuit to the account. The resulting Share action creates a public permalink that another learner can load and fork with source attribution.
   To demonstrate non-unitary semantics, add a measurement or reset and run it on Qiskit. Counts use the complete circuit; the pure-state preview visibly stops before the first non-unitary operation, and cross-engine parity is disabled for that circuit.
4. Ask Aria why each local Bloch vector has purity 0.5. Point to the visible response source and validation-scope label.
   Expand **Evidence used** and open the cited lesson. Explain that structured probability, purity and entropy claims from Gemini are checked against simulator-owned values; conflicting claims trigger the deterministic fallback. The included 40-case benchmark is an automated contract regression, not an expert accuracy study.
5. Open `/labs/guided/bell-state`, complete its checkpoints, then run the phase-sensitive Bell challenge. The grader checks state fidelity rather than only counts.
6. Open the instructor workspace and show that the same persisted learner evidence drives cohort misconceptions and assignment completion.

This sequence directly addresses PS 26140's education, visual construction, simulation, visualization, AI guidance, assessment, personalization and instructor-dashboard requirements.

## Verification

From the repository root:

```powershell
# Backend
backend\.venv\Scripts\python.exe -m pytest backend/tests -q -o pythonpath=backend

# Circuit Studio regression suite
npm run test:studio

# TypeScript + production bundle
npm run build
```

CI runs the same three verification classes on every push and pull request. The exact passing-test count belongs to the test output and CI history, not to a manually maintained marketing number.

## Expected deliverables

| Deliverable | Demo evidence | Status |
| :--- | :--- | :---: |
| Structured theory | M01–M08 curriculum | Complete for the published curriculum |
| Drag/drop and code circuits | Circuit Studio + OpenQASM gate/measurement/reset subset | Complete for documented subset |
| Multiple simulators | Aer/Cirq/PennyLane parity | Complete for documented subset |
| AI tutor | Circuit context, validation and provenance | Core path complete |
| Visualization | Bloch, amplitudes, counts, probabilities, noise | Complete |
| Assessment | Guided rubrics + adversarial challenges | Core path complete |
| Progress | Server evidence + recommendations | Core path complete |
| Instructor dashboard | Roster, misconceptions and assignments | Core path complete |
| Real hardware | No hardware execution is claimed | Not implemented |

## Honest limitations

- OpenQASM import covers the documented gate, measurement and reset subset; Qiskit code is an export, not a general Python parser.
- Non-unitary circuits execute fully for Aer counts. Their pure-state preview stops before the first measurement/reset because a single statevector cannot represent the mixed post-measurement ensemble.
- M07–M08 provide focused VQE, QAOA, decoherence and cryostat lessons linked to their interactive labs.
- qBraid/real-hardware execution is not production-integrated.
- SQLite is the local default. PostgreSQL is supported through `DATABASE_URL`; production migration and load testing remain release work.
- Chromium Playwright covers the adaptive Bell journey, multi-engine execution, account-backed circuit saving, measurement-aware code import, and the baseline diagnostic UI. Firefox/WebKit coverage and a formal WCAG audit remain recommended release gates.
