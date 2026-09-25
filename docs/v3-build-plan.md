# QUANTUM LENS AI — V3 MASTER PRODUCTION BUILD PLAN
**Document:** `docs/v3-build-plan.md`  
**Reference Document:** `D:\Quantum_Lens_AI_Final_SRS_Build_Contract_v3.0.docx`  
**Standard:** SIH 2026 — PS26140 Master Production Build Contract v3.0  
**Status:** Frozen Implementation Baseline

---

## 1. Frozen Canonical Routes

```text
PUBLIC
/                       → Premium public landing page
/login                  → Login
/signup                 → Sign up

AUTHENTICATED PRODUCT
/app/home               → Learner Home
/learn                  → Learn Curriculum
/learn/:module/:lesson  → Interactive Lesson
/labs                   → Labs Landing
/labs/studio/:circuitId?→ Flagship Circuit Studio
/labs/:slug             → Guided Virtual Lab (e.g. /labs/fragility, /labs/conflict)
/challenges             → Coding & Circuit Challenges
/explore                → Explore Landing
/explore/algorithms     → Algorithm Explorer
/explore/algorithms/:slug
/explore/hardware       → 3D Cryostat Hardware Explorer
/progress               → Student Progress & Mastery
/instructor/*           → Instructor-role-only (Overview, Classes, Assignments, Mastery, Misconceptions)

DEVELOPMENT
/design-system          → Living Design System & Component Showcase

LEGACY REDIRECTS (Compatibility)
/lab                    → Redirect to /labs/studio
/gate-builder           → Redirect to /labs/studio
/algorithms             → Redirect to /explore/algorithms
/fragility-lab          → Redirect to /labs/fragility
/conflict-lab           → Redirect to /labs/conflict
/hardware-explorer      → Redirect to /explore/hardware
```

---

## 2. Capabilities Probing Semantics

Local quantum frameworks (`qiskit_aer`, `pennylane`, `cirq`) execute tiny startup self-tests rather than assuming package installation equals operational availability.

Schema:
```typescript
interface FrameworkCapability {
  id: string;
  installed: boolean;
  version: string | null;
  configured: boolean;
  selfTestPassed: boolean;
  reachable: boolean | null; // null for local Python frameworks
  status: 'available' | 'partially_available' | 'unavailable';
  reason: string | null;
}

interface SystemCapabilitiesResponse {
  api: {
    status: 'online' | 'degraded' | 'offline';
    version: string;
  };
  overallSimulationStatus: 'available' | 'partially_available' | 'unavailable';
  frameworks: Record<string, FrameworkCapability>;
}
```

Self-Test Logic:
- **Qiskit Aer:** Import `qiskit_aer`, instantiate `AerSimulator()`, run 1-qubit $X$ gate circuit, assert count `{"1": shots}`.
- **PennyLane:** Import `pennylane`, instantiate `qml.device("default.qubit", wires=1)`, execute $X$ gate, assert expected measurement.
- **Cirq:** Import `cirq`, instantiate `cirq.Simulator()`, simulate $X$ gate, assert statevector $|1\rangle$.
- **qBraid:** Dynamically inspect `importlib.util.find_spec('qbraid')`, inspect environment variables (`QBRAID_API_KEY`), attempt client init. (Never hardcode `configured: false`).

---

## 3. Restrained Telemetry UX

TopBar displays a clean, non-DevOps status pill:
- `● Simulation services available` (Emerald dot)
- `● Simulation services partially available` (Amber dot)
- `● Simulation services unavailable` (Rose dot)

Clicking the pill opens a focused **System Status Popover**:
- API status & round-trip HTTP ping latency (measured live)
- Framework status table (Qiskit Aer, PennyLane, Cirq, qBraid)
- Zero permanently visible DevOps clutter (no permanent CPU, RAM, or fake global fidelity).

---

## 4. Role-Aware Navigation

- **Student:** `Home`, `Learn`, `Labs`, `Explore`, `Progress`
- **Instructor:** `Home`, `Learn`, `Labs`, `Explore`, `Progress`, `────────`, `Instructor`
- In Phase 1 (pre-auth), a development role switch pill `[DEV] Role: Student / Instructor` is provided in the TopBar for UI validation.

---

## 5. Unified Scientific Design System

Visual Philosophy: **Scientific Editorial $\times$ Precision Instrumentation $\times$ Premium Software**.
- Default Theme: Light / Soft Neutral (`#F7F8FA`, `#FAFAFB`, white elevated panels, deep navy text `#0F172A`).
- Dark Theme: True dark graphite/navy (`#0B0F17`, elevated `#111827`, border `#1E293B`).
- No neon quantum glows, no arbitrary particle backgrounds, no giant SaaS hero typography.
- Production Primitives: `Button`, `IconButton`, `Input`, `Select`, `Tabs`, `Tooltip`, `Popover`, `Dialog`, `Drawer`, `Badge`, `StatusIndicator`, `Panel`, `EmptyState`, `ErrorState`, `Skeleton`, `PageHeader`, `Breadcrumb`, `ResizablePanel`.
- Documented in `/design-system`.

---

## 6. Phase Roadmap & Execution Gate

```text
PHASE 0: Repository Audit & Traceability Matrix (DONE)
PHASE 1: Design System, App Shell, Capabilities API & Restrained Telemetry (IMMEDIATE)
PHASE 2: PostgreSQL Persistence, Authentication, Roles & Real Empty States
PHASE 3: Structured Learn Curriculum & Interactive Lesson Framework
PHASE 4: Canonical Circuit IR, Validation, OpenQASM 3 Subset & Safe Qiskit Code Mode
PHASE 5: Quantum Simulation Engine (Qiskit Aer, PennyLane, Cirq, qBraid status) & Parity Tests
PHASE 6: Flagship Circuit Studio Workspace (Canvas, Code Sync, State Inspector, Timeline, Versioning)
PHASE 7: Guided Virtual Lab Engine (Superposition, Phase, Measurement, Bell State)
PHASE 8: Assessment System, Coding Challenges & Automated Grading Engine
PHASE 9: Predict → Run → Explain, What Changed? & Circuit Insights
PHASE 10: Misconception Engine, Cognitive Conflict Labs (M01, M02, M03) & Mastery Model v2
PHASE 11: Grounded AI Quantum Mentor (Explain, Hint, Generate with IR validator, Debug, Optimize)
PHASE 12: Quantum Fragility Lab (Kraus decoherence models, dynamic fidelity, scrub cursor)
PHASE 13: Algorithm Explorer (Deutsch-Jozsa, Grover, QAOA, VQE, Teleportation, then QFT / BB84)
PHASE 14: Evidence-Based Student Progress, Recommendations & Learning History
PHASE 15: Instructor Classroom Workspace (Classes, Enrollment, Assignments, Real Prevalence Heatmap)
PHASE 16: Lightweight Collaboration (Share Links, Forking, Provenance Tracking)
PHASE 17: Three-Lens Experience & 3D Hardware Explorer (Cryostat & Signal Journey)
PHASE 18: Security Hardening, WCAG 2.1 AA Accessibility & Performance Optimization
PHASE 19: Production Cloud Deployment, CI/CD Pipeline & Grand Finale Demo Hardening
```

**Quality Gate:** Execute Phase 1 ONLY. All discovered tests must pass with zero failed scientific golden tests. Browser verification must confirm premium visual identity.
