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

1. Sign in as a student and open `/learn/m04-superposition-interference/global-vs-relative-phase`. Show the lesson's misconception warning, prediction and linked activity.
2. Open `/labs/guided/bell-state`. Complete the three checkpoints. Emphasize explicit control/target placement, run-before-advance, state visualization and server verification.
3. Open `/challenges/bell-phase-verification`. Demonstrate that a histogram-compatible but wrong Bell phase is rejected; the grader checks state fidelity, not only counts.
4. Open `/progress`. Show verified attempts, domain evidence and the next activity together with the reason and evidence that selected it.
5. Sign in as an instructor, open `/instructor`, create an assignment with a due date, and show completion derived from learner evidence.
6. If time remains, open `/labs/studio`: edit a rotation parameter, reverse a CNOT control/target, undo it, edit valid OpenQASM, and run the circuit.

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
| Structured theory | M01–M06 curriculum | Core path complete |
| Drag/drop and code circuits | Circuit Studio + OpenQASM subset | Complete for documented subset |
| Multiple simulators | Aer/Cirq/PennyLane parity | Complete for documented subset |
| AI tutor | Circuit context, validation and provenance | Core path complete |
| Visualization | Bloch, amplitudes, counts, probabilities, noise | Complete |
| Assessment | Guided rubrics + adversarial challenges | Core path complete |
| Progress | Server evidence + recommendations | Core path complete |
| Instructor dashboard | Roster, misconceptions and assignments | Core path complete |
| Real hardware | No hardware execution is claimed | Not implemented |

## Honest limitations

- OpenQASM import covers the documented unitary subset; Qiskit code is an export, not a general Python parser.
- M07–M08 remain planned. M01–M06 are the coherent judged learning path.
- qBraid/real-hardware execution is not production-integrated.
- SQLite is the local default. PostgreSQL is supported through `DATABASE_URL`; production migration and load testing remain release work.
- The guided Bell journey has API integration coverage. Full cross-browser Playwright coverage and a formal WCAG audit remain recommended release gates.
