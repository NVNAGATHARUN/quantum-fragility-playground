"""Reproducible deterministic benchmark for ARIA's grounded tutor contract.

This is a regression benchmark, not a human-subject learning study or an
independent expert review. It measures capabilities the server can verify:
concept routing, progressive hints, artifact validation, debugging,
optimization, evidence disclosure, and citation selection.
"""

from dataclasses import dataclass
from typing import Optional

from .mentor import MentorContext, MentorRequest, generate_grounded_fallback_explanation
from ..circuit.ir import CircuitIR, CircuitOperation
from ..circuit.validator import validate_circuit


@dataclass(frozen=True)
class TutorEvalCase:
    id: str
    category: str
    request: MentorRequest
    required_terms: tuple[str, ...] = ()
    expected_route_suffix: Optional[str] = None
    require_circuit: bool = False
    require_findings: bool = False
    expect_reduction: Optional[bool] = None
    require_evidence_kinds: tuple[str, ...] = ()


CONCEPT_CASES = [
    ("superposition", "Why is superposition not a classical coin flip?", ("observable experiment", "complex probability amplitudes", "normalization"), "/qubit-states"),
    ("measurement", "Explain measurement collapse and the Born rule", ("repeated measurement", "born rule", "projectors"), "/measurement-challenge"),
    ("phase", "How does relative phase affect interference?", ("basis-changing", "global phase", "identical z"), "/global-vs-relative-phase"),
    ("entanglement", "What makes a Bell pair entangled?", ("alice", "non-separability", "purity"), "/cnot-entangler"),
    ("no-signalling", "Why can entanglement not send information faster than light?", ("classical channel", "local marginal", "tracing out"), "/correlation-inspector"),
    ("grover", "Why does Grover need diffusion after the oracle?", ("oracle marks", "diffusion", "iteration count"), "/grover-search"),
    ("noise", "How are dephasing noise and relaxation different?", ("populations", "non-unitary", "t₂"), "/decoherence-relaxation"),
    ("variational", "What does the optimizer do in VQE?", ("classical optimizer", "parameterized", "upper bound"), "/vqe"),
]


def _ir(operations: list[CircuitOperation], qubits: int = 2) -> CircuitIR:
    return CircuitIR(
        schemaVersion="1.0",
        qubits=qubits,
        classicalBits=qubits,
        operations=operations,
    )


def build_evaluation_cases() -> list[TutorEvalCase]:
    cases: list[TutorEvalCase] = []
    for concept, question, tier_terms, route in CONCEPT_CASES:
        for tier, term in enumerate(tier_terms, start=1):
            cases.append(TutorEvalCase(
                id=f"concept-{concept}-tier-{tier}",
                category="progressive_concept_guidance",
                request=MentorRequest(
                    message=question,
                    mode="hint" if tier > 1 else "socratic",
                    context=MentorContext(hintTier=tier),
                ),
                required_terms=(term,),
                expected_route_suffix=route,
            ))

    generation_prompts = [
        ("ghz", "Create a three-qubit GHZ circuit"),
        ("bell", "Build a Bell pair"),
        ("singlet", "Generate the psi minus singlet"),
        ("superposition", "Create a uniform superposition"),
        ("qft", "Generate a three-qubit QFT circuit"),
        ("teleportation", "Build a quantum teleportation circuit"),
    ]
    for case_id, prompt in generation_prompts:
        cases.append(TutorEvalCase(
            id=f"generation-{case_id}",
            category="validated_circuit_generation",
            request=MentorRequest(message=prompt, mode="generate"),
            required_terms=("validated",),
            require_circuit=True,
        ))

    debug_circuits = [
        ("no-context", None, "no circuit loaded"),
        ("empty", _ir([], 1), "0 operations"),
        ("post-measurement", _ir([
            CircuitOperation(gate="H", targets=[0]),
            CircuitOperation(gate="MEASURE", targets=[0], classicalTargets=[0], type="MEASURE"),
            CircuitOperation(gate="X", targets=[0]),
        ], 1), "after qubit 0 was measured"),
        ("inactive-wires", _ir([CircuitOperation(gate="H", targets=[0])], 3), "wire(s) [1, 2]"),
    ]
    for case_id, circuit, term in debug_circuits:
        cases.append(TutorEvalCase(
            id=f"debug-{case_id}",
            category="circuit_debugging",
            request=MentorRequest(
                message="Debug this circuit",
                mode="debug",
                context=MentorContext(circuit=circuit),
            ),
            required_terms=(term,),
            require_findings=True,
        ))

    optimization_circuits = [
        ("cancel-h", _ir([CircuitOperation(gate="H", targets=[0]), CircuitOperation(gate="H", targets=[0])], 1), True),
        ("cancel-x", _ir([CircuitOperation(gate="X", targets=[0]), CircuitOperation(gate="X", targets=[0])], 1), True),
        ("no-local-rewrite", _ir([CircuitOperation(gate="H", targets=[0]), CircuitOperation(gate="CX", controls=[0], targets=[1])]), False),
    ]
    for case_id, circuit, reduced in optimization_circuits:
        cases.append(TutorEvalCase(
            id=f"optimize-{case_id}",
            category="bounded_optimization",
            request=MentorRequest(
                message="Optimize this circuit",
                mode="optimize",
                context=MentorContext(circuit=circuit),
            ),
            expect_reduction=reduced,
            require_circuit=True,
        ))

    evidence_circuit = _ir([
        CircuitOperation(gate="H", targets=[0], step=0),
        CircuitOperation(gate="H", targets=[0], step=1),
    ], 1)
    for status in ("detected", "targeted", "resolved"):
        cases.append(TutorEvalCase(
            id=f"personalization-{status}",
            category="evidence_transparency",
            request=MentorRequest(
                message="Help me understand this interference result",
                context=MentorContext(
                    circuit=evidence_circuit,
                    misconceptionId="M01",
                    learnerEvidence={
                        "status": status,
                        "evidence": "Server-graded phase challenge evidence",
                    },
                ),
            ),
            required_terms=("personalized from saved evidence",),
            expected_route_suffix="/global-vs-relative-phase",
            require_evidence_kinds=("circuit", "learner"),
        ))

    assert len(cases) == 40
    return cases


def evaluate_case(case: TutorEvalCase) -> dict:
    response = generate_grounded_fallback_explanation(case.request)
    failures: list[str] = []
    lowered = "\n".join([response.reply, *(response.debugFindings or [])]).lower()
    for term in case.required_terms:
        if term.lower() not in lowered:
            failures.append(f"missing expected term: {term}")
    if case.expected_route_suffix and not any(
        citation.route.endswith(case.expected_route_suffix) for citation in response.citations
    ):
        failures.append(f"missing citation ending in {case.expected_route_suffix}")
    if case.require_circuit:
        if response.suggestedCircuit is None:
            failures.append("missing suggested circuit")
        elif not validate_circuit(response.suggestedCircuit).valid:
            failures.append("suggested circuit failed canonical validation")
    if case.require_findings and not response.debugFindings:
        failures.append("missing structured debug findings")
    if case.expect_reduction is not None:
        deltas = response.optimizationDeltas or {}
        reduced = deltas.get("optimizedGateCount", 0) < deltas.get("originalGateCount", 0)
        if reduced != case.expect_reduction:
            failures.append(f"expected reduction={case.expect_reduction}, got {reduced}")
    evidence_kinds = {item.kind for item in response.evidenceUsed}
    for kind in case.require_evidence_kinds:
        if kind not in evidence_kinds:
            failures.append(f"missing {kind} evidence")
    if response.source != "deterministic":
        failures.append("benchmark unexpectedly used a network model")
    if response.verification.status == "rejected":
        failures.append("response verification rejected")
    return {
        "id": case.id,
        "category": case.category,
        "passed": not failures,
        "failures": failures,
    }


def run_deterministic_evaluation() -> dict:
    results = [evaluate_case(case) for case in build_evaluation_cases()]
    categories: dict[str, dict[str, int]] = {}
    for result in results:
        bucket = categories.setdefault(result["category"], {"passed": 0, "total": 0})
        bucket["total"] += 1
        bucket["passed"] += int(result["passed"])
    passed = sum(int(result["passed"]) for result in results)
    return {
        "benchmark": "ARIA deterministic grounded tutor regression",
        "passed": passed,
        "total": len(results),
        "pass_rate": passed / len(results),
        "categories": categories,
        "results": results,
        "claim_boundary": (
            "Automated contract regression only; not an independent expert review, "
            "LLM quality score, or evidence of learner impact."
        ),
    }
