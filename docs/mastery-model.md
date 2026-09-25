# QUANTUM LENS AI — LEARNER EVIDENCE & MASTERY ENGINE MODEL
**Document:** `docs/mastery-model.md`  
**Version:** 2.0.0 (SIH 2026 PS26140 Frozen Specification)  
**Status:** Authoritative Specification

---

## 1. Core Foundational Principle

$$\mathbf{Quantum\ Engine} \implies \text{Determines what is physically and mathematically true}$$
$$\mathbf{Learner\ Interaction} \implies \text{Provides raw behavioral inputs (predictions, circuit submissions, code)}$$
$$\mathbf{Pedagogy\ Engine} \implies \text{Evaluates learner behavior against verified truth (Cognitive Delta, grading)}$$
$$\mathbf{PostgreSQL\ Database} \implies \mathbf{Single\ Source\ of\ Truth}\ \text{(records attempts, predictions, evidence)}$$
$$\mathbf{Mastery\ Engine} \implies \text{Aggregates verified user evidence into versioned competency profiles}$$
$$\mathbf{Instructor\ Analytics} \implies \text{Aggregates actual learner evidence across an enrolled classroom}$$

### The Separation Rule:
- A circuit outcome (e.g. $P(|0\rangle) = 1.0$ for $H^2|0\rangle$ or Bell state fidelity $F = 1.0$) measures the **quantum system and simulator accuracy**.
- It provides **zero evidence** of student competence until a student **makes a prediction, builds a circuit, debugs an error, or answers an assessment**.
- Zero learner activity $\implies$ `score = null`, `status = NOT_STARTED`.
- **Never display "0% score" to a fresh student.** Display:  
  `NOT STARTED — No learning evidence yet. Complete your first lesson or experiment to begin building mastery. [Start →]`

---

## 2. Evidence Streams & Availability Model

A major flaw of static weighting is penalizing learners for unreached curriculum modules. The Quantum Lens Mastery Engine separates **evidence availability** from **evidence quality**.

```typescript
interface ConceptEvidenceState {
  conceptId: string;
  prediction: {
    available: boolean;
    score: number;      // [0.0 - 1.0]
    attempts: number;
    averageConfidence?: 'low' | 'medium' | 'high';
  };
  lab: {
    available: boolean;
    score: number;      // [0.0 - 1.0]
    completedCount: number;
    totalAvailable: number;
  };
  assessment: {
    available: boolean;
    score: number;      // [0.0 - 1.0]
    attempts: number;
  };
  retest: {
    available: boolean;
    required: boolean;  // true if a misconception was triggered
    resolved: boolean;  // true if re-test verified resolution
    score: number;      // [0.0 - 1.0]
  };
}
```

### 1. Prediction Evidence ($E_{\text{pred}}$)
- Measured during **Predict $\to$ Run $\to$ Explain** checkpoints.
- **Distribution Predictions:** Evaluated via Total Variation Distance:
  $$\text{TVD}(P_{\text{learner}}, P_{\text{verified}}) = \frac{1}{2} \sum_{i} |P_{\text{learner}}(i) - P_{\text{verified}}(i)| \in [0.0, 1.0]$$
  $$E_{\text{pred}, k} = 1.0 - \text{TVD}_k$$
- **Categorical Predictions:** Deterministic binary or weighted discrete scoring (e.g. "Does $H \to H$ return $|0\rangle$?" $\implies$ 1.0 for $|0\rangle$, 0.0 for $|1\rangle$).
- **"I'm not sure" Option:** Stored as unscored/low-confidence exploratory evidence; not counted as an incorrect answer.
- **Confidence Tracking:** Stored independently (`low`, `medium`, `high`) to evaluate calibration.

### 2. Lab & Challenge Evaluators ($E_{\text{lab}}$)
Different activities require different evaluation modes. We reject single-metric "fidelity $\ge 0.99$" constraints. Each lab or challenge configures a deterministic evaluator from the approved catalog:

| Evaluator Type | Evaluation Metric | Example Lab / Challenge |
| :--- | :--- | :--- |
| `TARGET_STATE_FIDELITY` | $F = \|\langle\psi_{\text{target}}\|\psi_{\text{student}}\rangle\|^2 \ge 0.99$ | Bell State preparation, $|+\rangle$ state build |
| `TARGET_DISTRIBUTION` | $\text{TVD}(P_{\text{student}}, P_{\text{target}}) \le 0.05$ | Multi-qubit superposition, random walk |
| `EXPECTED_COUNTS` | Statistical chi-square goodness of fit | Measurement basis verification |
| `EXPECTATION_VALUE` | $\|\langle Z \rangle - \langle Z \rangle_{\text{target}}\| \le 0.02$ | VQE energy minimization, Pauli measurements |
| `CIRCUIT_CONSTRAINT` | Gates $\le N$, Depth $\le D$, 2Q gates $\le K$ | Circuit optimization challenges |
| `PROTOCOL_OUTCOME` | Sifted key generated, QBER $\le 11\%$ | BB84 QKD protocol verification |
| `INTERPRETATION_RESPONSE`| Deterministic rubric matching | Statevector phase analysis |
| `PARAMETERIZED_TEST` | Passes hidden random angle test cases | Custom gate decomposition |
| `MULTI_STEP_OBJECTIVE` | Step progression and observation recorded | Quantum Fragility dephasing exploration |

$$E_{\text{lab}} = \frac{\sum_{i=1}^{L} \text{Score}(\text{Lab}_i)}{L} \quad (\text{over attempted labs in concept})$$

### 3. Assessment & Debugging Evidence ($E_{\text{assess}}$)
- Evaluated via deterministic automated grading (concept MCQs, circuit repair, code challenges).
- Zero LLM scoring.

### 4. Re-Test & Cognitive Conflict Evidence ($E_{\text{retest}}$)
- When a student's prediction triggers an active misconception ($M_j$), $M_j$ is flagged `ACTIVE`.
- The student is invited: *"Want to test an assumption?"* $\to$ enters the Cognitive Conflict Lab.
- After observing the counter-experiment, the student must pass an isomorphic **Re-Test Challenge**.
- Passing the re-test ($\text{TVD} \le 0.10$ or correct target) sets $M_j \to \text{RESOLVED}$.
- If no misconception was ever triggered and initial prediction was correct, `retest.required = false`.

---

## 3. Dynamic Mastery Score Formulation

Mastery score is computed **strictly over available/eligible evidence streams**:

$$W_{\text{total}} = \sum_{s \in \text{Available Streams}} w_s \quad (\text{default nominal weights: } w_{\text{pred}}=0.25, w_{\text{lab}}=0.25, w_{\text{assess}}=0.25, w_{\text{retest}}=0.25)$$

$$\text{MasteryScore}(C) = \frac{\sum_{s \in \text{Available Streams}} w_s \cdot E_s}{W_{\text{total}}} \times 100\%$$

If no evidence stream is available yet ($W_{\text{total}} = 0$):
$$\text{MasteryScore}(C) = \text{null}$$

---

## 4. Qualitative Competency Tiers & Coverage Gates

A student cannot achieve high mastery from one lucky prediction. Tier progression requires both **high score** and **evidence coverage**:

| Tier | Status Key | Prerequisites & Evidence Coverage Gates | UI Presentation |
| :---: | :---: | :--- | :--- |
| **0** | `NOT_STARTED` | `attempts == 0` (No evidence recorded). | Badge: Gray `Not Started`<br>Text: *"No learning evidence yet."* |
| **1** | `LEARNING` | At least 1 evidence item recorded; initial exploring. | Badge: Blue `Learning`<br>Score: Calculated value |
| **2** | `DEVELOPING` | Minimum 2 evidence items across at least 1 stream; score $\ge 60\%$. | Badge: Amber `Developing`<br>Score: Calculated value |
| **3** | `PROFICIENT` | **All 4 gates required:**<br>1. $\text{MasteryScore} \ge 80\%$<br>2. Minimum 3 evidence items across at least 2 distinct streams<br>3. At least 1 lab or assessment passed<br>4. **Zero active/unresolved critical misconceptions** | Badge: Emerald `Proficient`<br>Score: Calculated value |
| **4** | `NEEDS_REVIEW` | Previously proficient, but recent prediction or challenge failed ($TVD \ge 0.30$). | Badge: Rose `Needs Review`<br>Text: *"Revisit recommended"* |

---

## 5. Classroom Misconception Prevalence (Instructor Dashboard)

For any misconception $M_j$ across an enrolled classroom $\mathcal{S}$:

1. **Eligible Students ($\mathcal{S}_{\text{eligible}}$)**: Enrolled students with $\ge 1$ recorded attempt covering $M_j$.
2. **Affected Students ($\mathcal{S}_{\text{affected}}$)**: Students in $\mathcal{S}_{\text{eligible}}$ with an `ACTIVE` (unresolved) trigger for $M_j$.

$$\text{Prevalence}(M_j) = \begin{cases} 
\frac{|\mathcal{S}_{\text{affected}}|}{|\mathcal{S}_{\text{eligible}}|} \times 100\% & \text{if } |\mathcal{S}_{\text{eligible}}| > 0 \\ 
\text{No Data (0 attempts)} & \text{if } |\mathcal{S}_{\text{eligible}}| = 0 
\end{cases}$$

### Strict Empty State Contract:
If $|\mathcal{S}| = 0$ (no students enrolled) or $|\mathcal{S}_{\text{eligible}}| = 0$:
> *"No student learning evidence collected yet. Invite students or assign a guided lab to view live cohort misconception analytics."*
