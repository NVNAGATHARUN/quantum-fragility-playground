# Quantum Lens AI — SIH 2026 Grand Finale Judge Guide
**Problem Statement:** SIH 2026 — PS26140  
**Project Title:** Quantum Lens AI: Next-Generation Quantum Computing Laboratory & Grounded Pedagogical Platform  
**Live Target Architecture:** Qiskit Aer Simulation Kernel • Three.js 3D Dilution Refrigerator • Grounded ARIA Quantum Mentor

---

## 🏛 Executive Summary

Quantum Lens AI is a production-grade quantum computing learning platform developed for **Smart India Hackathon 2026 (PS26140)**. Addressing the critical gap between abstract mathematical linear algebra and physical quantum hardware, Quantum Lens AI unites three synchronous perspectives:
1. **Computation Lens:** Graphical Circuit Studio, OpenQASM 3 bidirectional sync, and algorithm walkthroughs.
2. **Mathematics Lens:** Exact statevector evolution, density matrix, and 3D Bloch sphere vector contraction.
3. **Hardware / Physics Lens:** Microwave DRAG pulse synthesis, cryostat thermal stage attenuation ($300\text{ K} \to 15\text{ mK}$), and transmon QPU coupling.

---

## 🚀 Key Innovations & Architecture (Phases 1–19)

### 1. Grounded Simulation Kernel (Zero Synthetic Data)
- **Engine:** Python 3.11 with `qiskit_aer` (statevector, unitary, and shot measurement simulation).
- **Physical Noise:** Lindblad-constrained Kraus operators ($\mathcal{E}(\rho) = \sum K_i \rho K_i^\dagger$, enforcing $T_2 \le 2T_1$).
- **Numerical Verification:** 76 automated backend tests passing in `backend/tests/` with 100% pass rate.

### 2. ARIA Grounded AI Quantum Mentor (Phase 11)
- Strict 6-mode pedagogical engine: `explain`, `hint`, `generate`, `debug`, `optimize`, `chat`.
- Validates generated quantum circuits through a semantic IR validator before rendering, preventing LLM hallucinations.

### 3. Comprehensive Algorithm Suite (Phase 13)
Walkthroughs with step-by-step state evolutions and oracle truth tables:
- **Deutsch-Jozsa:** Phase kickback oracle verification.
- **Grover's Search:** Amplitude amplification and geometric state reflections.
- **Quantum Teleportation:** Bell measurement with classical feed-forward Pauli corrections.
- **Quantum Fourier Transform (QFT):** Frequency-domain phase rotations.
- **QAOA (Max-Cut):** 2D energy landscape $\langle C \rangle(\gamma, \beta)$ heatmap and graph bipartition coloring.
- **VQE (Molecular $H_2$):** Ground state dissociation curve and Hartree-Fock comparison.
- **BB84 QKD:** Intercept-resend eavesdropper slider and 11% QBER threshold.
- **Quantum Repeater:** Entanglement swapping across intermediate Bell state measurement repeaters.

### 4. Instructor Classroom Workspace & Diagnostics (Phase 15)
- Real cohort management with unique 6-character join codes (`e.g. 7X9K2M`).
- $8 \times \text{Students}$ aggregate misconception heatmap covering the 8 canonical quantum misconceptions (M01–M08).
- One-click remediation dispatch to cognitive conflict labs.
- CSV Roster Export and honest zero-states when no students are enrolled.

### 5. Lightweight Collaboration & Provenance (Phase 16)
- Immutable URL permalinks (`/labs/studio/:circuitId`).
- Forking mechanism that preserves lineage and displays provenance banners (`⑂ Forked from [Parent] by [Author]`).

### 6. Three-Lens 3D Cryostat Hardware Explorer (Phase 17)
- 3D Dilution Refrigerator model with interactive temperature stages ($300\text{ K} \to 50\text{ K} \to 4\text{ K} \to 800\text{ mK} \to 100\text{ mK} \to 15\text{ mK}$).
- Microwave signal journey animation from room temperature DAC through attenuators to QPU plane.
- Real-time 60 FPS microwave pulse synthesizer with DRAG envelope control.

---

## 🔬 How to Verify & Demo for Judges

### 1. Run Automated Backend Test Suite
```powershell
backend\.venv\Scripts\python.exe -m pytest backend/tests -v -o pythonpath=backend
```
*Expected Result:* **76 passed in ~12s (100% pass rate)**.

### 2. Verify Frontend Production Build
```powershell
npm run build
```
*Expected Result:* **Vite production bundle compiled with 0 TypeScript errors**.

### 3. Run Application Locally
- **Backend:** `python -m uvicorn backend.app.main:app --port 8000`
- **Frontend:** `npm run dev` (Available at `http://localhost:5173`)

### 4. Suggested 3-Minute Demo Sequence
1. **Landing & Capabilities:** Visit `/`, open TopBar capabilities popover showing live runtime Qiskit Aer verification.
2. **Circuit Studio & Three-Lens:** Go to `/labs/studio`, load "Bell State |Φ⁺⟩", click "Share" to generate permalink, toggle "Hardware Lens" to see microwave pulse duration (10ns) and cryo stage (15mK).
3. **Algorithm Explorer:** Go to `/explore/vqe`, inspect the $H_2$ molecular dissociation curve and exact minimum at $R = 0.7414$ Å.
4. **Instructor Misconception Heatmap:** Switch role to Instructor, open `/instructor`, inspect the 8×Cohort misconception matrix, click on cell M01, and dispatch the Cognitive Conflict Lab.
5. **3D Hardware Explorer:** Go to `/explore/hardware`, click "Transmit Microwave Pulse", observe the pulse travel down the cryostat stages into the 15 mK transmon chip, collapsing the Bloch sphere.
