# Quantum Lens AI — living task list

Updated: 2026-09-28. Mark an item complete only after implementation and verification. This tracked roadmap records the current repository state; the earlier research snapshot remains in the local review outputs.

## Completed — algorithm lab UI sprint

### Guided lab workspace redesign

- [x] Rebuild the guided runner with a blue lesson rail, named checkpoints, readable gate tiles, fixed-size circuit cells and responsive results panels.
- [x] Add explicit control/target placement, connected paired gates, gate inspection with explicit removal, and circuit undo/redo.
- [x] Replace text-derived gate recommendations with checkpoint-specific actions, including RESET then X and both Bell measurements.
- [x] Use deliberate Run actions, clear stale results on edits, ignore obsolete responses, display backend errors, and remove the runner's silent analytical fallback.
- [x] Restore completed checkpoint snapshots when revisiting them; show session-only completion honestly.
- [x] Give the Bloch sphere a real 240px/260px viewport, add qubit selection, separate probabilities from sampled counts, and expose complex amplitudes without lossy Dirac formatting.
- [x] Correct the Bell first checkpoint to q1q0 bit order and simplify checkpoint titles and breadcrumbs.
- [x] Verification: production build and diff checks pass; browser journeys complete all four guided labs. Manually verify undo/redo, stale-result clearing, explicit gate removal and paired placement; desktop (1440px) and mobile (390px) layout checks show no page-width overflow.

The generic simulator now executes measurement/reset shot semantics in Aer. Its labelled pure-state preview stops before the first non-unitary operation rather than presenting later gates as if collapse had not occurred.

### Library and Labs discovery clarity

- [x] Explain the difference between guided concept labs, free Circuit Studio building, and full algorithm walkthroughs with clear starting routes on both index pages.
- [x] Add a recommended Bell walkthrough and a three-step reading guide to the Algorithm Library; feature a distinct open experiment in Labs.
- [x] Add a concrete question and learning goal to every lab and algorithm card; retain category, difficulty and search filters.
- [x] Verify with a production frontend build and browser visual checks of both index pages. The Labs choice grid was adjusted after visual review at the active desktop width.

The page indexes now guide discovery. The pedagogical depth and correctness of individual advanced algorithm pages still need the broader roadmap review.

### Circuit Studio usability

- [x] Gate clicks open an inspector; deletion is explicit. Edit control/target qubits, step, and rotation angle with validation.
- [x] Paired-gate placement highlights eligible target cells and identifies the selected control, column, and cancellation action.
- [x] Visible undo/redo labels and Ctrl/Command-Z, Shift-Z, and Ctrl-Y shortcuts; text fields retain their native editing shortcuts.
- [x] Live OpenQASM validation with operation line numbers, disabled invalid imports, preserved last valid circuit, and synchronized generated code after visual edits/history. Applying unchanged generated code preserves canvas placement.
- [x] Protect code drafts from canvas edits, saving a stale circuit, and incoming suggested circuits.
- [x] Verification: 14 Studio tests pass; production build passes; browser checks cover control reversal, angle edits, button/keyboard undo/redo, invalid QASM, valid code import, and measurement/reset semantics.

Qiskit remains a generated export; editable import supports the documented OpenQASM gate, measurement and reset subset.

- [x] Unified blue theme: dark navy workspace, blue-indigo actions and navigation, cool white typography, blue illustrations and common lab accents. Dark theme now loads for returning users too; removed the workspace light-mode switch. Verified overview, learning path, Circuit Studio and Bell lab visually; production build and diff checks pass.

- [x] AL-01 Bell: unified dark lab layout, result-first hierarchy, all four Bell states, X/Y/Z measurement basis, adjustable Aer depolarizing noise, live correlations, fidelity and shot results.
- [x] AL-02 Deutsch–Jozsa: prominent one-query decision, parity-oracle preview, clickable phase-kickback sequence and classical worst-case comparison.
- [x] AL-03 Grover: prominent run/result, iteration timeline, readable amplitude chart, actual Aer shot sampling and clear target amplification.
- [x] AL-04 Teleportation: interactive six-stage protocol, no-cloning transfer strip, corrected classical-bit mapping and true quantum-state fidelity (not fidelity inferred from Z-basis counts).
- [x] AL-05 QFT: result-first view, phase/amplitude toggle, exact ideal probabilities and corrected QFT gate order/phase spectrum.
- [x] Shared lab UI: responsive styling, explicit backend failures instead of silent synthetic fallback, stale-response guards when controls change.
- [x] Verification: production frontend build, 111 backend tests, 11 Circuit Studio tests, desktop/mobile browser checks for all five labs.

## Still pending — broader platform roadmap

### Judge-readiness correction sprint (active)

- [x] Replace calibrated/hard-coded advanced-lab claims with transparent educational-model provenance and derived metrics. VQE and network limits are visible; repeater fidelity and corrected shot evidence are derived and tested.
- [x] Complete the core M04–M06 curriculum and connect every lesson to an existing lab or graded challenge. Manifest contract tests cover all 11 released lessons.
- [x] Make PennyLane a native CircuitIR execution path with independent phase-sensitive conformance tests.
- [x] Unify learner progress around server-verified evidence and remove browser-local data from authoritative mastery claims.
- [x] Add an evidence-based next-activity recommendation API and surface its reason and evidence to learners.
- [x] Add an instructor assignment workflow with due dates and learner completion evidence; assignment aggregation avoids per-assignment database queries.
- [x] Add API integration coverage for the winning Bell learning journey and include the 13 Circuit Studio tests in CI.
- [x] Audit product claims and judge documentation; add the required delivery table, reproducible Python lock, configurable CORS, security headers and simulation resource budgets.
- [ ] Run a formal WCAG 2.2 accessibility audit, cross-browser Playwright suite, production database migration rehearsal and load test before calling the platform production-ready.

- [x] Research and review PS 26140 against the current working tree and comparable platforms; document evidence, reproduced defects, and a proposed acceptance table in `../../outputs/PS26140_PROJECT_REVIEW.md`.
- [x] P0: GHZ grader uses phase-sensitive target-state fidelity and rejects GHZ− when GHZ+ is requested.
- [x] P0: Parity-oracle grader compares the complete unitary and rejects canceling CX pairs/identity.
- [x] P0: General simulator executes measurement/reset shot semantics in Aer and labels the pure-state preview limitation.
- [x] P1: Challenge and guided-checkpoint mastery is server-graded and persisted; instructor roster metrics derive from verified attempts.
- [x] P1: Cirq uses an independent native gate adapter; both conformance tests pass with the declared `cirq-core` dependency.

### Winning-probability implementation sprint

- [x] Add server-owned alternate baseline/post diagnostics for all M01–M08 concepts, persist attempts, drive misconception transitions, and expose measured cohort learning gains without fabricated metrics.
- [x] Connect Circuit Studio account saves, public permalink sharing, shared-circuit loading and provenance-preserving forks to the existing backend APIs.

- [x] Add adversarial scientific tests for GHZ phase, oracle cancellation, measurement collapse and reset semantics.
- [x] Add server-owned rubrics for all 12 guided checkpoints, authenticated persistence, and failure-safe frontend verification.
- [x] Add a phase-sensitive Bell mastery challenge and connect the Bell guided journey to it.
- [x] Pass live guided/studio circuit context into Aria, expose deterministic vs Gemini provenance, reject invalid generated circuits, and remove unprovable optimizer claims.
- [x] Expose Aria's circuit/simulator/learner evidence and course citations, verify structured Gemini numerical claims, reject conflicts, and add a reproducible 40-case offline capability benchmark with an explicit non-expert-review boundary.
- [x] Replace instructor roster vanity metrics with verified attempts, pass count and average server score.
- [x] Harden instructor provisioning, JWT configuration, Docker database persistence and clean-install dependency declarations.
- [x] Final verification: native Cirq and PennyLane are installed; 154 backend tests, 14 Studio tests and 2 Chromium journeys pass; the production build, dependency audit and diff check pass.

- [x] QL-001–005: dependency locks, authoritative CI, Docker baseline, claim audit and hosted Vercel/Render/PostgreSQL verification are complete.
- [ ] QL-006–009: role provisioning, production secrets and simulation budgets are complete; public rate limiting and a configured production Gemini provider remain.
- [x] QL-010–013: persistent server-graded learner evidence, mastery summary, recommendations and evidence-based instructor analytics.
- [ ] QL-014–017: finish Circuit Studio parity with the full brief, including all specified gates, robust code editing/import and noisy execution. Existing Studio work is partial.
- [ ] QL-018–020: user-selectable independent Qiskit/Cirq/PennyLane execution, parity and conformance tests are complete; optional qBraid integration remains.
- [ ] QL-021–025: curriculum, connected labs, semantic grading, recommendations and the grounded tutor contract benchmark are complete; independent educator review and a real learner-impact study remain.
- [ ] QL-026–029: API and Chromium winning-journey coverage are complete; Firefox/WebKit, formal accessibility and operational scaling remain.
- [ ] QL-030–033: evidence-based README, repository hygiene and the public seven-minute judge walkthrough are complete; the final technical Q&A package remains.

## Current release notes

- The five lab routes require a working FastAPI/Qiskit backend; they now show an error when it is unavailable rather than presenting invented results.
- Automated API integration covers the instructor assignment → guided Bell checkpoint → phase challenge → recommendation/completion journey. Cross-browser UI automation remains pending under QL-027.
- Final verification for the current release candidate: 162 backend tests, 14 Circuit Studio tests and all 3 Chromium journeys pass; the production build, dependency audit and diff check pass. Public deployment smoke testing and the hosted CI rerun remain. The 555 kB BlochSphere3D chunk warning remains.
- The build succeeds with non-blocking outdated Browserslist data and a large BlochSphere3D chunk warning; bundle cleanup remains pending.
