# QUANTUM LENS AI
## Software Requirements Specification + Product Build Contract

* **Problem Statement:** SIH26140
* **Title:** AI-Based Interactive Quantum Algorithm Learning Platform
* **Organization:** Egreen Quanta
* **Theme:** Smart Education
* **Category:** Software
* **Product Name:** Quantum Lens AI

### Product Tagline
> **Predict. Build. Observe. Challenge. Understand Quantum.**

### Internal Product Statement
Quantum Lens AI is an adaptive quantum learning laboratory that connects what a learner thinks will happen, what verified quantum simulation actually produces, why the difference occurs, what misconception may be causing it, and what experiment the learner should perform next.

---

## 1. Document Status
**Version: 1.0 — Frozen Build Baseline**
* After approving this specification, major architectural or feature changes require a clear reason.
* Do not continuously redesign the project because another tool or team shows a new feature.
* Any new feature must pass this test:
  1. Does it directly help SIH26140?
  2. Does it solve a real learner problem?
  3. Is it better than improving an existing Tier-S feature?
  4. Can we implement it correctly?
  5. Can a judge understand its value quickly?
* If not, it goes to post-SIH backlog.

---

## 2. Core Problem
Quantum computing has an unusually high learning barrier.
Students encounter:
* qubits
* state vectors
* complex amplitudes
* phase
* measurement
* superposition
* interference
* entanglement
* decoherence
* algorithmic amplitude manipulation

but usually experience them through equations, slides, notebooks, or already-completed examples.

The central learning gap is:
$$\text{MATHEMATICAL DESCRIPTION} \implies \text{Student memorizes terminology} \implies \text{Little intuitive understanding} \implies \text{Can execute circuit} \implies \text{Cannot explain WHY result happened}$$

Quantum Lens transforms this into:
$$\text{CONCEPT} \to \text{PREDICTION} \to \text{INTERACTION} \to \text{VERIFIED SIMULATION} \to \text{VISUAL OBSERVATION} \to \text{COMPARISON} \to \text{MISCONCEPTION DETECTION} \to \text{TARGETED EXPERIMENT} \to \text{EXPLANATION} \to \text{RE-TEST} \to \text{MASTERY}$$
That is the fundamental product.

---

## 3. Product Objectives
* **O1 — Make quantum behavior observable:** Students should see how a state changes rather than merely receive final counts.
* **O2 — Turn simulations into learning experiences:** Running a circuit is not enough. The platform must ask: *What did you expect?* and later: *Why was the actual result different?*
* **O3 — Detect conceptual misunderstanding:** The platform should identify likely misconceptions from predictions, answers, circuit-building behavior and explanations.
* **O4 — Correct misconceptions experimentally:** Instead of repeating theory, the system triggers a short quantum experiment that makes the incorrect mental model fail visibly.
* **O5 — Connect abstraction levels:** Students move between:
  $$\text{ALGORITHM} \quad \longleftrightarrow \quad \text{CIRCUIT / STATE} \quad \longleftrightarrow \quad \text{PHYSICAL HARDWARE}$$
* **O6 — Provide measurable learning progress:** Educators and learners see concept mastery, not just “course completion.”

---

## 4. Explicit Non-Goals
Quantum Lens shall not initially attempt to become:
* a replacement for IBM Quantum
* a replacement for qBraid
* an enterprise quantum cloud
* a full research IDE
* a social network
* a QPU provider
* a 100-algorithm encyclopedia
* a quantum hardware CAD package
* a general-purpose AI coding platform
* an arbitrary Python execution service

This discipline is vital. qBraid already provides broad cloud quantum development across frameworks and devices, so competing on “number of backends” is pointless. Our differentiation is **pedagogy intelligence**.

---

## 5. Target Personas
* **P1 — Beginner Quantum Learner:** Engineering student, knows basic programming, limited linear algebra/quantum background. Needs intuitive explanations, visual learning, guided interaction, minimal jargon, gentle AI hints.
* **P2 — Intermediate Learner:** Understands gates, basic circuits, simple algorithms. Needs code, amplitudes, state evolution, noise, debugging, algorithm exploration.
* **P3 — Advanced Learner:** Needs density matrices, backend settings, deeper metrics, parameterized circuits, QAOA, experiment comparisons. Quantum Lens remains educational, not a replacement research environment.
* **P4 — Instructor:** Needs classroom creation, assignment creation, student analytics, mastery heatmaps, misconception analytics, challenge review.

---

## 6. Product Navigation
Do not build a navigation bar with 15–20 modules. Production navigation:
* **Primary:** `Home` | `Learn` | `Lab` | `Algorithms` | `Hardware` | `Progress`
* **Role-based additional item:** `Instructor`
* **Secondary:** `Search` | `Notifications` | `Profile` | `Settings` | `Help`

---

## 7. Product Experience Levels
* **Beginner Mode (Default):** Show intuitive explanations, simple probability visualizations, guided tasks, minimal settings, AI explanations, interactive diagrams. Hide by default: raw density matrix, backend-specific technical settings, advanced simulator configuration.
* **Advanced Mode:** Adds statevector, amplitudes, phase, density matrix, backend information, shot count, parameter controls, circuit depth, advanced noise settings.
* **Explore Mode:** Free experimentation. No forced curriculum. Create arbitrary supported circuits, simulate, save, compare, apply noise, ask AI.

---

## 10. Product Architecture Philosophy (5 Intelligence Layers)
1. **QUANTUM ENGINE:** What physically/mathematically happened?
2. **VISUALIZATION ENGINE:** How can we make that observable?
3. **PEDAGOGY ENGINE:** What does this mean educationally?
4. **AI MENTOR:** How should it be explained to this learner?
5. **LEARNING ENGINE:** What should the learner do next?

**Core Principle:** *Simulator determines truth. AI explains truth. Never reverse this.*

---

## 11. High-Level System Architecture
```
┌──────────────────────────────────────────────────────────┐
│                          USERS                           │
│         Students  |  Educators  |  Advanced Learners     │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│                  QUANTUM LENS WEB APP                    │
│                   React + TypeScript                     │
│      Learn | Lab | Algorithms | Hardware | Progress | AI │
└─────────────────────────┬────────────────────────────────┘
                          │ HTTPS / WebSockets
                          ▼
┌──────────────────────────────────────────────────────────┐
│                     FASTAPI PLATFORM                     │
│   Auth | Users | Learning | Circuits | Simulation | AI   │
│       Assessment | Pedagogy | Instructor | Hardware      │
└────────────┬─────────────────┬─────────────────┬─────────┘
             │                 │                 │
             ▼                 ▼                 ▼
     LEARNING ENGINE    QUANTUM ENGINE       AI ENGINE
     Skill Graph        Circuit IR           Context
     Mastery            Validator            Retrieval
     Recommendations    Orchestrator         Explanation
     Assessment                              Diff Engine
                                             Hints
                               │
                               ▼
                      SIMULATION ADAPTERS
                      ┌─────┼─────┐
                      ▼     ▼     ▼
                    Qiskit Penny Cirq
                     Aer   Lane
                      │
                      ▼
                 RESULT ENGINE
                       │
                       ▼
                PEDAGOGY ENGINE
             ┌─────────┼─────────┐
             ▼         ▼         ▼
        Prediction What Changed Misconception Engine
                                 │
                                 ▼
                         Cognitive Conflict
                                 │
                                 ▼
                              Resolve
                                 │
                                 ▼
                          Mastery Evidence
```

---

## 12. Recommended Technology Stack
* **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, Zustand, Three.js / React Three Fiber, Recharts, Monaco Editor, KaTeX.
* **Backend:** Python + FastAPI (Qiskit, PennyLane, Cirq, NumPy, SciPy, AI integration, scientific stack). Architecture: Modular Monolith.
* **Infrastructure:** PostgreSQL, Redis, Background worker, Object storage, Reverse proxy, Monitoring. (SIH prototype does not require Kubernetes).

---

## 15. Functional Requirements — Authentication
* **FR-AUTH-001:** Users shall be able to create an account.
* **FR-AUTH-002:** Users shall be able to sign in securely.
* **FR-AUTH-003:** Roles: `Student`, `Instructor`, `Admin`.
* **FR-AUTH-004:** Users shall retain learning progress across sessions.
* **FR-AUTH-005:** Authentication secrets shall never be stored in plaintext.

---

## 16. Student Dashboard
Answers: *“What should I do next?”*
* **Continue Learning:** e.g., Entanglement — 67%
* **Recommended Experiment:** Bell-State Interference Challenge
* **Skill Snapshot:** Qubits 92%, Gates 88%, Superposition 79%, Measurement 66%, Entanglement 43%
* **Recent Experiments**
* **Active Recommendation**
* **Unresolved Misconception:** Displayed gently (e.g., *“You may want to revisit phase vs probability”* — never display *“YOU HAVE A MISCONCEPTION”*).

---

## 17. Structured Learning System
* **Module 1 — Foundations:** classical vs quantum information, qubit, ket notation, state amplitudes, probability, Bloch sphere, measurement.
* **Module 2 — Gates:** X, Y, Z, H, S, T, RX, RY, RZ, CNOT, CZ, SWAP.
* **Module 3 — Core Phenomena:** superposition, phase, interference, entanglement, correlation.
* **Module 4 — Algorithms:** Deutsch, Deutsch-Jozsa, Grover, teleportation, QFT, QAOA.
* **Module 5 — Real Quantum Systems:** noise, decoherence, fidelity, T1/T2, readout error, quantum hardware.

---

## 18. Learning Content Contract
Every major concept must contain:
1. **WHY IT MATTERS**
2. **INTUITION**
3. **THEORY**
4. **VISUALIZATION**
5. **PREDICTION**
6. **EXPERIMENT**
7. **CHALLENGE**
8. **REFLECTION**

---

## 19. Quantum Circuit Studio
Layout:
```
┌─────────────────────────────────────────────────────────┐
│ Circuit Name                    Backend   Shots    Run  │
├────────────┬────────────────────────┬───────────────────┤
│            │                        │                   │
│   Gate     │        CIRCUIT         │   STATE / RESULT  │
│  Palette   │         CANVAS         │                   │
│            │                        │                   │
├────────────┴────────────────────────┴───────────────────┤
│ Code  |  Timeline  |  Compare  |  Noise  |  AI Mentor   │
└─────────────────────────────────────────────────────────┘
```

---

## 20 & 21. Supported Circuit Operations & Interactions
* **Supported Operations:** H, X, Y, Z, S, T, RX, RY, RZ, CX, CZ, SWAP, Measure, Reset (Later: Controlled-U, Toffoli).
* **Interactions:** drag gate, drop gate, select, move, delete, parameter edit, qubit add/remove, measurement, undo, redo, duplicate, clear, save, fork, compare, execute.

---

## 22 & 23. Canonical Circuit IR
Frontend must not store Qiskit-specific structures.
```json
{
  "version": "1.0",
  "qubits": 2,
  "classicalBits": 2,
  "operations": [
    { "id": "g-001", "gate": "H", "targets": [0], "controls": [], "params": {} },
    { "id": "g-002", "gate": "CX", "targets": [1], "controls": [0], "params": {} }
  ]
}
```
**Why Circuit IR Exists:** Decouples UI from simulation backends: `Circuit UI` $\to$ `Quantum Lens IR` $\to$ `[Qiskit | PennyLane | Cirq]`.

---

## 24. Circuit Validator
Validation happens before simulation: gate supported, qubit exists, control exists, target exists, control $\neq$ target, parameter valid, measurement valid, backend compatibility, qubit limit, circuit size limit. Returns human-friendly validation errors, never raw 500 errors.

---

## 25 & 26. Code Editor (Monaco) & Security
* **Language:** Qiskit-flavored supported code (`qc.h(0)`, `qc.cx(0, 1)`, `qc.measure_all()`).
* Visual changes update code; supported code updates visual circuit.
* **Security Rule:** Never execute arbitrary Python directly (prohibit `import os`, `subprocess`). Parse supported operations.

---

## 27–30. Simulation Backends
* **Primary (Qiskit Aer):** Authoritative simulator for statevector, shot simulation, density matrix, measurement, ideal and noisy circuits.
* **PennyLane Backend:** Variational circuits, QAOA, hybrid optimization, expectation values.
* **Cirq Backend:** Proves multi-backend independence for common gates and selected labs.
* **qBraid:** Reference/future integration.

---

## 31 & 32. Simulation Request Flow & Normalized Result
Flow: `User clicks RUN` $\to$ `Circuit IR` $\to$ `Circuit Validator` $\to$ `Backend Orchestrator` $\to$ `Adapter` $\to$ `Simulator` $\to$ `Raw Result` $\to$ `Result Normalizer` $\to$ `Pedagogy Processing` $\to$ `Frontend Visualizations`.

**Normalized Result Model:**
```json
{
  "backend": "qiskit-aer",
  "mode": "statevector",
  "shots": 1024,
  "counts": { "00": 510, "11": 514 },
  "probabilities": { "00": 0.498, "11": 0.502 },
  "statevector": [],
  "densityMatrix": null,
  "timeline": [],
  "metrics": { "depth": 2 }
}
```

---

## 33 & 34. Visualization Engine & State Timeline
* **Single-qubit:** Bloch sphere, probability, amplitudes, phase.
* **Multi-qubit:** Basis amplitude bars, probability histogram, phase visualization, correlation matrix, reduced density matrices, entanglement indicators.
* **Rule:** Do NOT visualize entanglement using only two independent Bloch spheres.
* **Gate-by-Gate State Timeline (Tier-S):** Stage-by-stage inspection updating highlighted gate, state, probability, phase, and physical explanation.

---

## 35–37. Predict $\to$ Run $\to$ Explain
* **FR-PED-001:** Before key lab executions, user is prompted: *What do you expect to happen?*
* Store prediction data: `{ concept, predictionType, answer, confidence }`.
* **Comparison:** Displays `YOUR PREDICTION` vs `ACTUAL RESULT`, followed by targeted pedagogical explanation.

---

## 38 & 39. What Changed? Engine
Version comparison (Version A vs Version B):
* **39.1 Circuit Diff:** Gate additions, removals, replacements.
* **39.2 State Diff:** Statevector transformation comparison.
* **39.3 Probability Diff:** Basis probability delta.
* **39.4 Concept Diff:** Why the physical behavior changed.
* **39.5 Visual Diff:** Side-by-side visualization.

---

## 40. Break the Circuit (Challenge Mode)
Learner investigates broken circuits (e.g. CNOT without superposition), diagnoses why the target state failed, repairs the circuit, and verifies the fix.

---

## 41–43. Quantum Fragility Lab
Connects ideal quantum computing to real physical devices:
* **Inputs:** Bit-flip, phase-flip, depolarization, amplitude damping ($T_1$), phase damping ($T_2$), readout error.
* **Outputs:** Ideal vs Noisy State, Probabilities, Counts, Fidelity, Purity, Bloch shrinkage trajectory.

---

## 44–47. Misconception Engine
* **Catalog:**
  * **M01:** Superposition means classical parallel checking.
  * **M02:** Entanglement enables controllable faster-than-light communication.
  * **M03:** Superposition is equivalent to a classical mixture.
  * **M04:** Measurement simply reveals a value that already existed.
  * **M05:** CNOT automatically creates entanglement.
  * **M06:** Grover works because quantum computers brute-force all answers.
  * **M07:** Quantum phase is irrelevant because probabilities look unchanged.
  * **M08:** Noise is only a software bug.
* **Detection Evidence:** Prediction evidence ($\times 0.30$) + Assessment ($\times 0.30$) + Explanation ($\times 0.25$) + Circuit construction ($\times 0.15$). Threshold $\ge 0.65$ triggers intervention.
* **Intervention Tone:** Respectful and scientific (*“Your recent predictions suggest an interesting assumption. Want to test it with a 90-second experiment?”*).

---

## 48–52. Cognitive Conflict Engine & Protocols
Make the learner's incorrect model fail visibly using curated scientific experiments:
* **Conflict 1 (Superposition as Classical Randomness):** $|0\rangle \to H \to H \to \text{Measure}$ ($100\% |0\rangle$) vs $|0\rangle \to H \to Z \to H \to \text{Measure}$ ($100\% |1\rangle$).
* **Conflict 2 (Entanglement as FTL Signaling):** Alice measures vs Alice does not measure; Bob observes identical $50/50$ marginal distribution in both cases.
* **Conflict 3 (Superposition vs Classical Mixture):** Measuring in Z-basis yields $50/50$ for both, but measuring in X-basis ($H \to \text{Measure}$) yields $100\% |0\rangle$ for pure $|+\rangle$ and $50/50$ for mixture.
* **Resolution:** Requires evidence (conflict $\to$ explanation $\to$ new prediction $\to$ verified experiment).

---

## 53–57. AI Quantum Mentor (ARIA)
* Contextually integrated throughout the platform.
* Injected with: Current Concept, Circuit, Simulation Result, Prediction, Misconception State, Learner Level, Recent Attempts.
* **Actions:** Explain, Hint, Debug, Compare, Simplify, Mathematical, Next Step.
* **Grounding Contract:** Circuit $\to$ Validator $\to$ Simulator $\to$ Verified Result $\to$ AI Context $\to$ Explanation.
* **3-Tier Hint Strategy:** Hint 1 (Socratic principle), Hint 2 (Gate category), Hint 3 (Exact operation).

---

## 58–61. Algorithm Laboratories
* **Standard Flow:** Problem $\to$ Classical intuition $\to$ Quantum idea $\to$ Principle $\to$ Circuit $\to$ State evolution $\to$ Simulation $\to$ Visualization $\to$ Code $\to$ Modification $\to$ Challenge.
* **Core Algorithm Set:**
  * **AL-01:** Bell State (Entanglement)
  * **AL-02:** Deutsch-Jozsa (Interference/oracle)
  * **AL-03:** Grover (Amplitude amplification)
  * **AL-04:** Teleportation (Entanglement + Classical correction)
  * **AL-05:** QFT (Phase/Fourier representation)
  * **AL-06:** QAOA MaxCut (PennyLane hybrid optimization)
  * **AL-07:** BB84 (Quantum communication/security)
  * **AL-08:** Quantum Fragility (Noise/decoherence)

---

## 62–67. Learning Skill Graph, Mastery & Assessment
* Explicit prerequisite graph: Qubits $\to$ Gates $\to$ Superposition $\to$ Phase/Measurement $\to$ Interference $\to$ Entanglement $\to$ Algorithms.
* **Mastery Model:** Concept quiz (15%) + Prediction accuracy (20%) + Experiment completion (20%) + Challenge performance (20%) + Debugging (10%) + Misconception status (15%).
* **Simulation-Verified Assessment:** Evaluates whether resulting quantum state satisfies target, permitting alternative valid circuit constructions.

---

## 68–73. Instructor Dashboard & Analytics
* Class creation, student enrollment, assignment creation, submission review, mastery heatmaps, misconception analytics.
* **Institutional Differentiator:** Aggregated Quantum Misconception Heatmap across classrooms.
* **Circuit Versioning & Experiment History:** Full audit trail and experiment replay.

---

## 74–83. Quantum Hardware Explorer & Three-Lens View
Directly answers SIH26140 hardware scarcity clause.
* **Three-Lens View:**
  * **Lens 1 (Algorithm Lens):** What computational process is happening?
  * **Lens 2 (State Lens):** What is happening mathematically to the quantum state?
  * **Lens 3 (Hardware Lens):** What physical system realizes this operation?
* **Scope:** 20–40 meaningful components across System, Cryogenic stages ($300\text{ K} \to 50\text{ K} \to 4\text{ K} \to \text{Still} \to 15\text{ mK}$), Microwave signal lines, and QPU chip package.
* **Signal Journey:** Interactive trace of a microwave pulse from classical AWG, down cryogenic attenuators, into superconducting transmon qubit.

---

## 84–92. Database Model
PostgreSQL/SQLite schema: `users`, `profiles`, `roles`, `courses`, `modules`, `concepts`, `skills`, `skill_dependencies`, `lessons`, `learning_activities`, `circuits`, `circuit_versions`, `circuit_operations`, `experiments`, `experiment_runs`, `simulation_results`, `predictions`, `misconceptions`, `misconception_evidence`, `user_misconceptions`, `cognitive_conflicts`, `resolution_attempts`, `challenges`, `challenge_submissions`, `skill_mastery`, `recommendations`, `ai_conversations`, `ai_messages`, `classes`, `class_enrollments`, `assignments`, `assignment_submissions`, `hardware_components`, `audit_events`.

---

## 93–107. API & Infrastructure Architecture
* **Base URL:** `/api/v1`
* Modular Monolith in FastAPI with clean service separation.
* Small circuits execute synchronously ($< 100\text{ ms}$).

---

## 108–114. Production UI & Accessibility
* **Scientific, calm, premium visual design:** Restrained color, no crypto/neon clutter.
* **Typography:** Inter, Geist, IBM Plex Sans, with KaTeX for mathematical notation.
* **Desktop-first workspace (1440px / 1280px).**
* **WCAG 2.1 AA Compliance:** Full keyboard navigation, contrast, screen-reader text, no information conveyed solely via color.

---

## 115–122. Performance, Security & Error States
* **NFR-PERF-001:** LCP $\approx 2.5\text{s}$.
* **NFR-PERF-002:** Circuit drag interactions at $60\text{ FPS}$.
* **NFR-PERF-003:** Simulator execution in $1\text{--}3\text{s}$.
* **SEC-04:** No arbitrary Python execution on host.
* **Actionable Error States:** Explains what happened and how to recover.

---

## 123–133. Testing & Definition of Done
* **Quantum Correctness Test Suite:** Known benchmark circuits (X, H, H-H, Bell, GHZ, Teleportation, Grover) verified against analytical solutions.
* **AI Grounding Tests:** Automated verification that AI explanation never contradicts simulator outputs.
* **Definition of Done:** User story complete, UI matches design, API integrated, validations handled, loading/empty/error states exist, accessibility verified, tests passing, no console errors.

---

## 134–136. Build Priority Tiers
* **TIER S (Must feel exceptional):**
  * Misconception + Cognitive Conflict
  * Predict $\to$ Run $\to$ Explain
  * What Changed?
  * Quantum Fragility Lab
  * Grounded AI Mentor (ARIA)
  * State Timeline
  * Circuit Studio + real Qiskit simulation
* **TIER A (Must feel complete):** Curriculum, code synchronization, multi-backend abstraction, algorithm labs, mastery, assessments, student dashboard.
* **TIER A+ (Visual Differentiator):** Three-Lens View, Hardware Explorer, Signal Journey.
* **TIER B:** Instructor analytics, circuit history, sharing, experiment replay.

---

## 137. Explicitly Forbidden Scope Creep
Before Tier-S features are excellent, do NOT build: mobile native app, AR/VR/metaverse, NFT/blockchain, live multiplayer, social feed, 50 algorithms, custom cloud QPU scheduler, 2000-part hardware model, Kubernetes, unnecessary microservices.

---

## 138. Product Demo Contract (7-Minute Winning Story)
* **Scene 1 (Learning):** Address gap in quantum mental models.
* **Scene 2 (Prediction):** Prompt learner expectation on Bell circuit.
* **Scene 3 (Build):** Visual circuit construction with synchronized code.
* **Scene 4 (Simulate):** Real Qiskit Aer simulation returns 50/50 Bell correlation.
* **Scene 5 (State Evolution):** Timeline view of statevector evolution.
* **Scene 6 (Explain):** Grounded AI explains why prediction differed.
* **Scene 7 (Modify):** Remove H, click *What Changed?*, view diff.
* **Scene 8 (Misconception):** Trigger 60-second cognitive-conflict experiment disproving false model.
* **Scene 9 (Reality):** Quantum Fragility Lab demonstrates decoherence under thermal noise.
* **Scene 10 (Hardware Lens):** Trace microwave signal down 3D dilution refrigerator to transmon QPU.
* **Scene 11 (Progress):** Mastery graph updates with verified empirical evidence.

---

## 139 & 140. 30-Second Elevator Pitch & Differentiation
> **Elevator Pitch:** Quantum Lens AI is an adaptive quantum learning laboratory. Instead of only showing lessons or circuit outputs, it first captures what a learner expects, executes the circuit on verified quantum simulators, visualizes how the state evolves, identifies why the learner's prediction differed, and detects conceptual misconceptions. When a misconception is likely, Quantum Lens launches a short cognitive-conflict experiment designed to make that incorrect mental model fail visibly and verifies that the learner has corrected it. The same system connects algorithms, quantum-state behavior, noise, and an interactive 3D hardware view, creating a complete path from theory to physical intuition.

> **One-Sentence Differentiation:** *Quantum Lens doesn't merely personalize what a student sees; it identifies what the student misunderstands and uses verified quantum experiments to change that mental model.*

---

## 141–143. Competitive Defenses
* **IBM Composer Defense:** Composer is a circuit CAD and job dispatcher for developers; Quantum Lens is an adaptive cognitive learning engine that models learner misconceptions and provides simulation-verified conflict resolution.
* **qBraid Defense:** qBraid provides cloud infrastructure and developer IDEs across QPUs; Quantum Lens focuses on pedagogical cognition, identifying where student mental models fail.
* **Hardware Explorer Defense:** IBM's cryostat is an isolated 3D museum; our Hardware Lens is dynamically coupled to active circuits, showing microwave pulse propagation for the exact gates in the circuit.

---

## 152. Traceability to SIH26140
Every single clause of SIH26140 is directly mapped to a concrete production module:
* Structured quantum education $\to$ Learning Academy & Skill Graph
* Abstract concepts difficult $\to$ Interactive visual labs & Cognitive Conflict
* Visual circuit design $\to$ Circuit Studio
* Code-based circuit design $\to$ Monaco editor with two-way sync
* Simulation $\to$ Qiskit Aer & Kraus noise engine
* Multi-framework $\to$ Canonical Circuit IR
* State visualization $\to$ Bloch sphere, reduced density matrices, statevector bars
* AI explanations $\to$ Grounded ARIA tutor
* Hardware access barrier $\to$ Three-Lens Hardware Explorer & Signal Journey
* Hands-on learning $\to$ Predict $\to$ Run $\to$ Experiment

---

## 153. Final Build Order (Execution Blueprint)
1. **Phase 1:** Preserve Existing Strength (Refactor current Quantum Fragility project).
2. **Phase 2:** Circuit Core (Circuit IR, Validator, Circuit Builder, Code Sync).
3. **Phase 3:** Real Simulation (FastAPI, Qiskit Aer, Result Normalization).
4. **Phase 4:** Visualization (Histogram, State View, Bloch, Timeline).
5. **Phase 5:** Core Pedagogy (Predict, Compare, Explain, What Changed).
6. **Phase 6:** AI (Grounded ARIA Mentor).
7. **Phase 7:** Fragility Integration (Kraus noise models in new architecture).
8. **Phase 8:** Misconception Engine (M01 Interference, M02 No-Signaling, M03 Coherent vs Mixed).
9. **Phase 9:** Mastery & Learning (Skill graph, recommendations, progress).
10. **Phase 10:** Algorithms (Bell, Grover, Teleportation, QAOA).
11. **Phase 11:** Instructor (Class system, Misconception heatmap, assignments).
12. **Phase 12:** Hardware Explorer (3D Cryostat model, Signal Journey, Three-Lens integration).
13. **Phase 13:** Production Hardening (Testing, accessibility, performance, observability).

---

## 155. The Final Non-Negotiable Build Contracts
* **Contract 1:** No feature exists only to impress judges; it must solve a user/learning problem.
* **Contract 2:** Quantum correctness outranks visual beauty.
* **Contract 3:** Simulator truth outranks AI.
* **Contract 4:** Pedagogy outranks number of features.
* **Contract 5:** Working depth outranks architecture diagrams.
* **Contract 6:** Production quality outranks hackathon decoration.
* **Contract 7:** The student should understand what to do within seconds.
* **Contract 8:** The interface should never feel like a collection of demos; everything belongs to one learning journey.
* **Contract 9:** Hardware Explorer is an integrated learning feature, not a 3D gimmick.
* **Contract 10:** No new major feature until Tier-S functionality works.
* **Contract 11:** Never claim a feature is implemented when it is only planned.
* **Contract 12:** Stop redesigning the concept after this baseline. From this point forward: **BUILD $\to$ TEST $\to$ IMPROVE.**

---

## 156. National Quantum Mission (NQM) Ecosystem Alignment
To support India's **National Quantum Mission (NQM)** (DST, Govt. of India, ₹6,003 Cr initiative), Quantum Lens AI maps directly onto the four mission verticals:
1. **Quantum Computing Vertical:** Qiskit Aer exact kernel, gate synthesis, canonical Circuit IR, Kraus noise modeling ($T_1$, $T_2$ relaxation & dephasing).
2. **Quantum Communication Vertical:** BB84 Visual Quantum Key Distribution (AL-07), photon polarization bases, Eve eavesdropping interception collapse, and QBER threat modeling.
3. **Quantum Networks & Hardware Emulation:** Quantum Teleportation (AL-04), EPR Bell state distribution (AL-01), Dilution refrigerator signal journey, and superconducting transmon qubit explorer.
4. **Quantum Human Capital & Education:** Adaptive AI Socratic mentor (Aria), 8-part learning contract, Cognitive Delta misconception evaluation.

---

## 157. AL-07: Visual Quantum Key Distribution (BB84) Specification
* **Objective:** Allow learners to observe how quantum mechanics guarantees cryptographic secrecy through the No-Cloning Theorem and wave-function collapse upon eavesdropping.
* **Protocol Pipeline:**
  1. **Alice (Sender):** Generates random bit string $b_i \in \{0, 1\}$ and randomly chooses polarization basis $B_A \in \{+, \times\}$ (Rectilinear: $0^\circ, 90^\circ$; Diagonal: $45^\circ, 135^\circ$).
  2. **Quantum Channel with Eve (Adversary):**
     - *Eve Inactive:* Photons traverse optical fiber/free-space channel undisturbed.
     - *Eve Active (Intercept-Resend Attack):* Eve intercepts photons, measures in random basis $B_E \in \{+, \times\}$, which collapses the state. Eve re-prepares and transmits a new photon in her measured state to Bob.
  3. **Bob (Receiver):** Chooses independent random basis $B_B \in \{+, \times\}$ and measures the incoming photon.
  4. **Classical Sifting:** Alice and Bob publicly announce bases over an authenticated classical channel. Mismatched bases ($B_A \neq B_B$) are discarded ($\approx 50\%$ sifted key retention).
  5. **QBER & Threat Assessment:**
     - Error rate $\text{QBER} = \frac{\text{Mismatched bits in sample}}{\text{Total sample bits}}$.
     - Without Eve: $\text{QBER} = 0\%$ (ideal) or $\le 2\%$ (with channel noise) $\to$ **KEY SECURE**.
     - With Eve: $\text{QBER} \approx 25\%$ which strictly exceeds the $11.0\%$ Shor-Preskill security bound $\to$ **EAVESDROPPER DETECTED — KEY ABORTED**.
  6. **One-Time Pad (OTP) Application:** Live encryption/decryption of arbitrary user messages with the quantum key.

---

## 158. Live Quantum Engine Telemetry Specification
* **Status Stream:** Persistent real-time operational monitor displaying:
  - `SYSTEM_STATUS: [ OPERATIONAL ]`
  - `NQM_CORE_v2.2 // ALIGNED`
  - `SIMULATOR: Qiskit Aer 0.17.2`
  - `GATE FIDELITY: 99.98%`
  - `COHERENCE T2: 120μs`
  - `LATENCY: < 0.15ms`
  - `ACTIVE NODE: QN_DELHI_01`
* **Pedagogical Purpose:** Demystifies quantum hardware benchmarks and bridges theoretical algorithms with real physical device metrics.

---

## 159. AL-08: Quantum Network & Entanglement Repeater Specification
* **The Fundamental Barrier:** In classical telecommunications, optical signals can be copied and amplified periodically using erbium-doped fiber amplifiers (EDFA). In quantum telecommunications, the **No-Cloning Theorem** strictly forbids copying arbitrary quantum states. Furthermore, standard telecom optical fiber exhibits an exponential attenuation rate of $\alpha \approx 0.2$ dB/km at $\lambda = 1550$ nm. Over $L = 500$ km, the survival probability of a single photon is $10^{-10}$, rendering direct transmission impossible.
* **The Solution — Entanglement Swapping:**
  1. **Dual EPR Generation:** Alice and the intermediate Repeater share a Bell pair $|\Phi^+\rangle_{AR_1}$. The Repeater and Bob share a second independent Bell pair $|\Phi^+\rangle_{R_2B}$.
  2. **Bell State Measurement (BSM) at Repeater:** The repeater performs a joint Bell measurement on qubits $(R_1, R_2)$ (CNOT followed by Hadamard and projection).
  3. **Entanglement Transfer:** The BSM projects the remaining distant qubits $(A, B)$ into a maximally entangled Bell pair with fidelity $F \ge 0.99$, without Alice and Bob's photons ever interacting or traversing the full length of the channel!
  4. **Scaling Advantage:** Replaces exponential loss $e^{-\alpha L}$ with polynomial scaling $(\eta)^{L/L_0}$, enabling the realization of an inter-city Quantum Internet.
