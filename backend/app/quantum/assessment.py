"""Quantum Assessment & Grading Engine (Phase 8).

Provides rigorous mathematical and physical evaluation of learner quantum circuits
against target unitaries, statevectors, and constraints without synthetic grading:
- Unitary fidelity: F_U = (1/d²) |Tr(U_target† U_actual)|² ≥ 0.999 (up to global phase)
- Statevector fidelity: F_ψ = |⟨ψ_target | ψ_actual⟩|² ≥ 0.99
- Circuit constraints: max depth, max gate count, restricted gate set
- Test case evaluation across input basis states
"""

from typing import Dict, List, Optional, Any, Literal
import numpy as np
from pydantic import BaseModel, Field

from ..circuit.ir import CircuitIR, CircuitOperation
from .simulator import simulate_circuit, build_qiskit_circuit
from ..circuit.diagnostics import Diagnostic


class TestCaseResult(BaseModel):
    name: str
    passed: bool
    expected: str
    actual: str
    details: Optional[str] = None


class ChallengeMetrics(BaseModel):
    depth: int
    gate_count: int
    two_qubit_count: int


class AssessmentResult(BaseModel):
    challenge_id: str
    passed: bool
    score: float  # Percentage of requirements satisfied [0.0, 100.0]
    fidelity: Optional[float] = None
    metrics: ChallengeMetrics
    test_cases: List[TestCaseResult]
    feedback: List[str]
    runtime_ms: float


class ChallengeDefinition(BaseModel):
    id: str
    type: Literal["build", "predict", "debug", "code", "optimize"]
    title: str
    subtitle: str
    difficulty: Literal["Beginner", "Intermediate", "Advanced"]
    category: str
    instructions: str
    starter_circuit: CircuitIR
    target_statevector: Optional[List[Dict[str, float]]] = None
    target_description: str
    max_gates: Optional[int] = None
    max_depth: Optional[int] = None
    max_two_qubit_gates: Optional[int] = None


def compute_statevector_fidelity(sv1: np.ndarray, sv2: np.ndarray) -> float:
    """Computes pure state fidelity F = |⟨ψ₁|ψ₂⟩|²."""
    inner = np.vdot(sv1, sv2)
    return float(np.abs(inner) ** 2)


def compute_unitary_fidelity(u1: np.ndarray, u2: np.ndarray) -> float:
    """Computes unitary fidelity invariant under global phase:

    F(U₁, U₂) = (1 / d²) |Tr(U₁† U₂)|²
    """
    d = u1.shape[0]
    u1_dag_u2 = np.dot(u1.conj().T, u2)
    trace = np.trace(u1_dag_u2)
    return float((np.abs(trace) ** 2) / (d ** 2))


# ─── Canonical Challenge Registry (5 Types) ───────────────────────────────────

CANONICAL_CHALLENGES: Dict[str, ChallengeDefinition] = {
    "bell-phase-verification": ChallengeDefinition(
        id="bell-phase-verification",
        type="debug",
        title="Verify the Bell Pair's Hidden Phase",
        subtitle="Repair a phase-flipped Bell circuit that looks identical in Z-basis counts.",
        difficulty="Intermediate",
        category="Entanglement & Phase",
        instructions="The starter prepares |Phi->, whose 00/11 counts mimic |Phi+>. Remove the phase error so the complex statevector matches (|00> + |11>)/sqrt(2).",
        target_description="Phase-sensitive statevector fidelity to |Phi+> >= 0.999",
        starter_circuit=CircuitIR(schemaVersion="1.0", qubits=2, classicalBits=2, operations=[
            CircuitOperation(id="b1", gate="H", targets=[0], step=0),
            CircuitOperation(id="b2", gate="CX", targets=[1], controls=[0], step=1),
            CircuitOperation(id="b3", gate="Z", targets=[0], step=2),
        ]),
        max_gates=4,
        max_two_qubit_gates=1,
    ),
    # 1. BUILD: 3-Qubit GHZ State
    "ghz-3qubit": ChallengeDefinition(
        id="ghz-3qubit",
        type="build",
        title="Synthesize 3-Qubit GHZ State",
        subtitle="Construct the maximally entangled Greenberger-Horne-Zeilinger state.",
        difficulty="Intermediate",
        category="Entanglement & Superposition",
        instructions="Create the 3-qubit GHZ state |GHZ⟩ = (|000⟩ + |111⟩)/√2 using Hadamard and CNOT gates.",
        target_description="Fidelity F = |⟨GHZ|ψ⟩|² ≥ 0.999",
        starter_circuit=CircuitIR(
            schemaVersion="1.0",
            qubits=3,
            classicalBits=3,
            operations=[],
        ),
        max_gates=10,
        max_two_qubit_gates=4,
    ),

    # 2. PREDICT: Relative Phase Born Rule
    "born-interference": ChallengeDefinition(
        id="born-interference",
        type="predict",
        title="Predict Phase Interference",
        subtitle="Forecast measurement statistics after a relative phase rotation.",
        difficulty="Beginner",
        category="Born Rule & Measurement",
        instructions="Analyze the circuit H -> S -> H on qubit q0 and submit your predicted probabilities for |0⟩ and |1⟩.",
        target_description="Predict measurement distribution within 5% TVD tolerance.",
        starter_circuit=CircuitIR(
            schemaVersion="1.0",
            qubits=1,
            classicalBits=1,
            operations=[
                CircuitOperation(id="op1", gate="H", targets=[0], step=0),
                CircuitOperation(id="op2", gate="S", targets=[0], step=1),
                CircuitOperation(id="op3", gate="H", targets=[0], step=2),
                CircuitOperation(id="op4", gate="MEASURE", targets=[0], step=3),
            ],
        ),
    ),

    # 3. DEBUG: Fix Inverted CNOT SWAP Circuit
    "swap-direction-debug": ChallengeDefinition(
        id="swap-direction-debug",
        type="debug",
        title="Debug Faulty SWAP Synthesis",
        subtitle="Correct the erroneous CNOT orientation in a 3-CNOT SWAP decomposition.",
        difficulty="Intermediate",
        category="Circuit Synthesis & Debugging",
        instructions="A 2-qubit SWAP gate requires 3 alternating CNOT gates (CX 0->1, CX 1->0, CX 0->1). The provided circuit has a bug where one gate is improperly oriented. Fix it to synthesize a true SWAP unitary.",
        target_description="Unitary matrix distance to SWAP U ≤ 0.001",
        starter_circuit=CircuitIR(
            schemaVersion="1.0",
            qubits=2,
            classicalBits=2,
            operations=[
                CircuitOperation(id="d1", gate="CX", targets=[1], controls=[0], step=0),
                CircuitOperation(id="d2", gate="CX", targets=[1], controls=[0], step=1),  # Bug: control/target inverted!
                CircuitOperation(id="d3", gate="CX", targets=[1], controls=[0], step=2),
            ],
        ),
        max_gates=3,
        max_two_qubit_gates=3,
    ),

    # 4. CODE: Balanced Deutsch-Jozsa Oracle
    "qasm-deutsch-oracle": ChallengeDefinition(
        id="qasm-deutsch-oracle",
        type="code",
        title="Implement Balanced Oracle in OpenQASM 3",
        subtitle="Code an oracle function f(x) = x0 ⊕ x1 that maps |x0 x1 y⟩ to |x0 x1 y ⊕ f(x)⟩.",
        difficulty="Advanced",
        category="Quantum Algorithms",
        instructions="Write OpenQASM 3 instructions for a 3-qubit circuit implementing a balanced oracle on inputs q0, q1 with ancillary target q2.",
        target_description="Computes f(x) = x0 ⊕ x1 for all 4 computational basis inputs.",
        starter_circuit=CircuitIR(
            schemaVersion="1.0",
            qubits=3,
            classicalBits=3,
            operations=[],
        ),
    ),

    # 5. OPTIMIZE: SWAP Gate Depth Minimization
    "cnot-swap-optimization": ChallengeDefinition(
        id="cnot-swap-optimization",
        type="optimize",
        title="Optimize SWAP Gate Decomposition",
        subtitle="Synthesize a 2-qubit SWAP gate with exactly 3 two-qubit CX gates and minimal circuit depth.",
        difficulty="Intermediate",
        category="Compilation & Optimization",
        instructions="Construct a 2-qubit SWAP operation using at most 3 gates and circuit depth ≤ 3.",
        target_description="Unitary matches SWAP with CX count ≤ 3 and depth ≤ 3.",
        starter_circuit=CircuitIR(
            schemaVersion="1.0",
            qubits=2,
            classicalBits=2,
            operations=[],
        ),
        max_gates=3,
        max_depth=3,
        max_two_qubit_gates=3,
    ),
}


# ─── Assessment Evaluator Function ───────────────────────────────────────────

def evaluate_challenge_submission(
    challenge_id: str,
    circuit: CircuitIR,
    prediction: Optional[Dict[str, float]] = None,
) -> AssessmentResult:
    """Evaluates a learner circuit against the specified challenge unit tests."""
    import time
    t0 = time.time()

    challenge = CANONICAL_CHALLENGES.get(challenge_id)
    if not challenge:
        raise ValueError(f"Unknown challenge: '{challenge_id}'")

    test_cases: List[TestCaseResult] = []
    feedback: List[str] = []
    fidelity: Optional[float] = None

    # Calculate circuit metrics
    ops = circuit.operations
    gate_count = len(ops)
    two_q_count = len([o for o in ops if o.gate in ("CX", "CZ", "SWAP")])
    depth = max([o.step for o in ops], default=0) + 1 if ops else 0
    metrics = ChallengeMetrics(
        depth=depth,
        gate_count=gate_count,
        two_qubit_count=two_q_count,
    )

    # 1. Constraint Checks
    if challenge.max_gates is not None:
        pass_gates = gate_count <= challenge.max_gates
        test_cases.append(TestCaseResult(
            name="Max Gate Count Constraint",
            passed=pass_gates,
            expected=f"≤ {challenge.max_gates} gates",
            actual=f"{gate_count} gates",
        ))
        if not pass_gates:
            feedback.append(f"Gate count ({gate_count}) exceeds limit of {challenge.max_gates}.")

    if challenge.max_two_qubit_gates is not None:
        pass_2q = two_q_count <= challenge.max_two_qubit_gates
        test_cases.append(TestCaseResult(
            name="Two-Qubit Gate Constraint",
            passed=pass_2q,
            expected=f"≤ {challenge.max_two_qubit_gates} two-qubit gates",
            actual=f"{two_q_count} two-qubit gates",
        ))
        if not pass_2q:
            feedback.append(f"Two-qubit gate count ({two_q_count}) exceeds limit of {challenge.max_two_qubit_gates}.")

    if challenge.max_depth is not None:
        pass_depth = depth <= challenge.max_depth
        test_cases.append(TestCaseResult(
            name="Max Circuit Depth Constraint",
            passed=pass_depth,
            expected=f"≤ {challenge.max_depth} depth",
            actual=f"{depth} depth",
        ))
        if not pass_depth:
            feedback.append(f"Circuit depth ({depth}) exceeds limit of {challenge.max_depth}.")

    # 2. Physics / Target Evaluation
    try:
        sim_res = simulate_circuit(circuit, shots=1024)
        sim_probs = sim_res.probabilities

        # Target Check by Challenge Type
        if challenge.id == "ghz-3qubit":
            # A probability-only check cannot distinguish GHZ+ from the
            # orthogonal GHZ- state. Grade the complex statevector instead.
            from qiskit.quantum_info import Statevector

            unitary_ops = [o for o in circuit.operations if o.gate not in ("MEASURE", "RESET")]
            unitary_ir = CircuitIR(
                schemaVersion=circuit.schemaVersion,
                qubits=circuit.qubits,
                classicalBits=circuit.classicalBits,
                operations=unitary_ops,
            )
            actual_state = Statevector.from_instruction(build_qiskit_circuit(unitary_ir)).data
            target_state = np.zeros(8, dtype=complex)
            target_state[0] = 1.0 / np.sqrt(2.0)
            target_state[7] = 1.0 / np.sqrt(2.0)
            fidelity = compute_statevector_fidelity(target_state, actual_state)
            ghz_match = fidelity >= 0.999

            test_cases.append(TestCaseResult(
                name="GHZ State Amplitudes",
                passed=ghz_match,
                expected="Statevector fidelity to GHZ+ ≥ 0.999, including relative phase",
                actual=f"Statevector fidelity F = {fidelity:.6f}",
                details="Checks amplitudes and relative phase; GHZ- is rejected.",
            ))
            if ghz_match:
                feedback.append("Superposition on q0 coupled with CX cascades successfully created |GHZ⟩.")
            else:
                feedback.append("The state does not match GHZ+. Check both the CNOT cascade and the relative phase between |000⟩ and |111⟩.")

        elif challenge.id == "bell-phase-verification":
            from qiskit.quantum_info import Statevector
            unitary = circuit.model_copy(update={"operations": [o for o in circuit.operations if o.gate not in ("MEASURE", "RESET")]})
            actual = Statevector.from_instruction(build_qiskit_circuit(unitary)).data
            target = np.array([1 / np.sqrt(2), 0, 0, 1 / np.sqrt(2)], dtype=complex)
            fidelity = compute_statevector_fidelity(target, actual)
            passed = fidelity >= 0.999
            test_cases.append(TestCaseResult(
                name="Bell relative-phase fidelity", passed=passed,
                expected="F(|Phi+>, psi) >= 0.999", actual=f"Statevector fidelity F = {fidelity:.6f}",
                details="This test distinguishes |Phi+> from |Phi-> even though both have identical Z-basis counts.",
            ))
            feedback.append("Bell phase verified." if passed else "The correlations look right, but the relative phase is wrong. Inspect or remove the extra Z operation.")

        elif challenge.id == "born-interference":
            # Target probabilities for H -> S -> H:
            # H|0⟩ = |+⟩
            # S|+⟩ = (|0⟩ + i|1⟩)/√2
            # H S|+⟩ = (|0⟩ + |1⟩)/2 + i(|0⟩ - |1⟩)/2 = (1+i)/2 |0⟩ + (1-i)/2 |1⟩
            # P(0) = |(1+i)/2|² = 2/4 = 0.5; P(1) = 0.5
            pred_0 = prediction.get("0", 0.0) if prediction else 0.0
            pred_1 = prediction.get("1", 0.0) if prediction else 0.0
            tvd = 0.5 * (abs(pred_0 - 0.5) + abs(pred_1 - 0.5))
            pred_pass = tvd <= 0.05

            test_cases.append(TestCaseResult(
                name="Prediction vs Born Rule",
                passed=pred_pass,
                expected="P(|0⟩) = 0.50, P(|1⟩) = 0.50 (TVD ≤ 0.05)",
                actual=f"P(|0⟩) = {pred_0:.2f}, P(|1⟩) = {pred_1:.2f} (TVD = {tvd:.3f})",
                details="Evaluates prediction against Born rule outcome.",
            ))
            if pred_pass:
                feedback.append("Accurate prediction! S gate creates relative phase π/2, giving equal 50/50 measurement probabilities after Hadamard.")
            else:
                feedback.append("Prediction deviated from actual Born rule distribution. S gate adds phase i to |1⟩ without altering single-qubit Z-basis projection balance.")

        elif challenge.id in ("swap-direction-debug", "cnot-swap-optimization"):
            # Target: SWAP unitary permutation: |00⟩->|00⟩, |01⟩->|10⟩, |10⟩->|01⟩, |11⟩->|11⟩
            from qiskit.quantum_info import Operator
            qc = build_qiskit_circuit(circuit)
            op_actual = Operator(qc).data
            # Target SWAP operator
            target_swap = np.array([
                [1, 0, 0, 0],
                [0, 0, 1, 0],
                [0, 1, 0, 0],
                [0, 0, 0, 1],
            ], dtype=complex)
            u_fid = compute_unitary_fidelity(target_swap, op_actual)
            fidelity = u_fid
            u_pass = u_fid >= 0.999

            test_cases.append(TestCaseResult(
                name="SWAP Unitary Equivalence",
                passed=u_pass,
                expected="Unitary Fidelity F_U ≥ 0.999 (matches SWAP operator)",
                actual=f"Unitary Fidelity F_U = {u_fid:.4f}",
                details="Verifies that circuit acts as a state swap permutation across all 4 computational basis inputs.",
            ))
            if u_pass:
                feedback.append("Unitary verified: 3 alternating CNOT gates successfully implement a bidirectional SWAP gate.")
            else:
                feedback.append("Unitary mismatch: ensure the second CNOT is controlled by q1 targeting q0 (CX 1->0).")

        elif challenge.id == "qasm-deutsch-oracle":
            # Verify the complete transformation. Gate-presence checks accept
            # cancelling pairs, so compare the submitted unitary to the oracle.
            from qiskit.quantum_info import Operator

            actual = Operator(build_qiskit_circuit(circuit)).data
            target_qc = build_qiskit_circuit(CircuitIR(
                schemaVersion="1.0",
                qubits=3,
                classicalBits=3,
                operations=[
                    CircuitOperation(gate="CX", controls=[0], targets=[2], step=0),
                    CircuitOperation(gate="CX", controls=[1], targets=[2], step=1),
                ],
            ))
            target = Operator(target_qc).data
            fidelity = compute_unitary_fidelity(target, actual)
            oracle_pass = fidelity >= 0.999

            test_cases.append(TestCaseResult(
                name="Balanced Oracle Truth Table",
                passed=oracle_pass,
                expected="Unitary truth table y → y ⊕ x0 ⊕ x1 for all basis inputs",
                actual=f"Oracle unitary fidelity F_U = {fidelity:.6f}",
                details="Compares the full transformation, so cancelling gate pairs fail.",
            ))
            if oracle_pass:
                feedback.append("Oracle correctly computes parity f(x) = x0 ⊕ x1 onto target ancilla q2.")
            else:
                feedback.append("The submitted circuit does not implement parity for every input. Check for missing, reversed, or cancelling gates.")

    except Exception as e:
        test_cases.append(TestCaseResult(
            name="Circuit Simulation Execution",
            passed=False,
            expected="Executable valid circuit",
            actual=f"Simulation error: {str(e)}",
        ))
        feedback.append(f"Simulation failed: {str(e)}")

    # Overall pass: all test cases passed
    all_passed = len(test_cases) > 0 and all(t.passed for t in test_cases)
    passed_count = len([t for t in test_cases if t.passed])
    score = round((passed_count / max(1, len(test_cases))) * 100.0, 1)

    elapsed_ms = (time.time() - t0) * 1000.0

    return AssessmentResult(
        challenge_id=challenge_id,
        passed=all_passed,
        score=score,
        fidelity=fidelity,
        metrics=metrics,
        test_cases=test_cases,
        feedback=feedback,
        runtime_ms=round(elapsed_ms, 2),
    )
