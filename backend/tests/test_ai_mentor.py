import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.ai.mentor import (
    MentorNumericClaim,
    MentorRequest,
    MentorContext,
    ask_mentor,
    generate_grounded_fallback_explanation,
    verify_numeric_claims,
)
from app.models.circuit_ir import CircuitIR, GateOperation
from app.quantum.simulator import simulate_circuit

client = TestClient(app)


def test_aria_tier1_socratic_hadamard_interference():
    """Tier 1 must ask a Socratic guiding question without giving away the direct answer."""
    circuit = CircuitIR(
        version="1.0",
        qubits=1,
        classicalBits=1,
        operations=[
            GateOperation(id="g-1", gate="H", targets=[0], controls=[], step=0),
            GateOperation(id="g-2", gate="H", targets=[0], controls=[], step=1),
        ]
    )
    sim_res = simulate_circuit(circuit)
    req = MentorRequest(
        message="Why did two Hadamards give me 0 instead of a coin flip?",
        context=MentorContext(
            circuit=circuit,
            simulationResult=sim_res,
            hintTier=1
        )
    )
    resp = ask_mentor(req)
    assert resp.hintTier == 1
    assert "Socratic Nudge" in resp.reply
    assert "100%" in resp.reply
    # Ground truth matches simulator
    assert resp.groundedTruth["probabilities"]["0"] == 1.0


def test_aria_tier2_conceptual_hadamard():
    """Tier 2 provides physical intuition of constructive and destructive interference."""
    circuit = CircuitIR(
        version="1.0",
        qubits=1,
        classicalBits=1,
        operations=[
            GateOperation(id="g-1", gate="H", targets=[0], controls=[], step=0),
            GateOperation(id="g-2", gate="H", targets=[0], controls=[], step=1),
        ]
    )
    sim_res = simulate_circuit(circuit)
    req = MentorRequest(
        message="Explain what happened conceptually.",
        context=MentorContext(
            circuit=circuit,
            simulationResult=sim_res,
            hintTier=2
        )
    )
    resp = ask_mentor(req)
    assert resp.hintTier == 2
    assert "Conceptual Hint" in resp.reply
    assert "destructive interference" in resp.reply.lower()


def test_aria_tier3_mathematical_resolution():
    """Tier 3 provides complete unitary matrix derivation and proof."""
    circuit = CircuitIR(
        version="1.0",
        qubits=1,
        classicalBits=1,
        operations=[
            GateOperation(id="g-1", gate="H", targets=[0], controls=[], step=0),
            GateOperation(id="g-2", gate="H", targets=[0], controls=[], step=1),
        ]
    )
    sim_res = simulate_circuit(circuit)
    req = MentorRequest(
        message="Show me the full math.",
        context=MentorContext(
            circuit=circuit,
            simulationResult=sim_res,
            hintTier=3
        )
    )
    resp = ask_mentor(req)
    assert resp.hintTier == 3
    assert "Mathematical Solution" in resp.reply
    assert "Identity" in resp.reply or "H @ H" in resp.reply


def test_aria_bell_state_entanglement_grounding():
    """ARIA must recognize entanglement entropy and EPR correlations from simulator."""
    circuit = CircuitIR(
        version="1.0",
        qubits=2,
        classicalBits=2,
        operations=[
            GateOperation(id="g-1", gate="H", targets=[0], controls=[], step=0),
            GateOperation(id="g-2", gate="CX", targets=[1], controls=[0], step=1),
        ]
    )
    sim_res = simulate_circuit(circuit)
    req = MentorRequest(
        message="Are my two qubits entangled?",
        context=MentorContext(
            circuit=circuit,
            simulationResult=sim_res,
            hintTier=2
        )
    )
    resp = ask_mentor(req)
    assert "Bell state" in resp.reply or "entangled" in resp.reply.lower()
    assert resp.groundedTruth["isEntangled"] is True


def test_mentor_api_endpoint():
    """Tests the REST endpoint /api/v1/ai/mentor."""
    payload = {
        "message": "Hello ARIA, can you explain this circuit?",
        "context": {
            "hintTier": 1,
            "location": "/gate-builder"
        },
        "history": []
    }
    resp = client.post("/api/v1/ai/mentor", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    assert "hintTier" in data
    assert data["hintTier"] == 1


def test_mentor_circuit_generation_zero_hallucinations():
    """Phase 11: Mentor generates semantically validated CircuitIR with zero hallucinated gates."""
    req = MentorRequest(
        message="Create a 3-qubit GHZ state circuit",
        mode="generate",
    )
    resp = ask_mentor(req)
    assert resp.mode == "generate"
    assert resp.suggestedCircuit is not None
    circ = resp.suggestedCircuit
    assert circ.qubits == 3
    assert len(circ.operations) == 3
    assert circ.operations[0].gate == "H"
    assert circ.operations[1].gate == "CX"
    assert circ.operations[2].gate == "CX"
    assert resp.isValidated is True


def test_mentor_circuit_optimization():
    """Phase 11: Mentor cancels self-inverses (H-H -> I) and provides mathematical optimization deltas."""
    circuit = CircuitIR(
        schemaVersion="1.0",
        qubits=2,
        classicalBits=2,
        operations=[
            GateOperation(gate="H", targets=[0], controls=[]),
            GateOperation(gate="H", targets=[0], controls=[]),
            GateOperation(gate="X", targets=[1], controls=[]),
            GateOperation(gate="X", targets=[1], controls=[]),
            GateOperation(gate="Z", targets=[0], controls=[]),
        ]
    )
    req = MentorRequest(
        message="Optimize my circuit",
        mode="optimize",
        context=MentorContext(circuit=circuit)
    )
    resp = ask_mentor(req)
    assert resp.mode == "optimize"
    assert resp.suggestedCircuit is not None
    assert resp.optimizationDeltas is not None
    deltas = resp.optimizationDeltas
    assert deltas["originalGateCount"] == 5
    assert deltas["optimizedGateCount"] == 1
    assert len(resp.suggestedCircuit.operations) == 1
    assert resp.suggestedCircuit.operations[0].gate == "Z"


def test_mentor_circuit_debugging():
    """Phase 11: Mentor debugger detects post-measurement operations and unused wires."""
    circuit = CircuitIR(
        schemaVersion="1.0",
        qubits=3,
        classicalBits=3,
        operations=[
            GateOperation(gate="H", targets=[0], controls=[]),
            GateOperation(gate="MEASURE", targets=[0], classicalTargets=[0], type="MEASURE"),
            GateOperation(gate="X", targets=[0], controls=[]),  # post-measurement flaw
        ]
    )
    req = MentorRequest(
        message="Why is my circuit flawed?",
        mode="debug",
        context=MentorContext(circuit=circuit)
    )
    resp = ask_mentor(req)
    assert resp.mode == "debug"
    assert resp.debugFindings is not None
    assert any("AFTER qubit 0 was measured" in f for f in resp.debugFindings)
    assert any("Qubit wire(s) [1, 2] have no operations" in f for f in resp.debugFindings)


def test_mentor_api_modes_integration():
    """Phase 11: REST API supports mode='generate' and returns validated suggestedCircuit."""
    payload = {
        "message": "Synthesize a Bell pair circuit",
        "mode": "generate",
    }
    resp = client.post("/api/v1/ai/mentor", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["mode"] == "generate"
    assert data["suggestedCircuit"] is not None
    assert data["suggestedCircuit"]["qubits"] == 2
    assert len(data["suggestedCircuit"]["operations"]) == 2


def test_mentor_exposes_personalization_evidence_and_course_citation():
    circuit = CircuitIR(
        schemaVersion="1.0",
        qubits=1,
        classicalBits=1,
        operations=[
            GateOperation(gate="H", targets=[0], step=0),
            GateOperation(gate="H", targets=[0], step=1),
        ],
    )
    result = simulate_circuit(circuit, shots=128)
    response = generate_grounded_fallback_explanation(MentorRequest(
        message="Help me understand why my prediction failed",
        context=MentorContext(
            circuit=circuit,
            simulationResult=result,
            misconceptionId="M01",
            learnerEvidence={
                "status": "detected",
                "evidence": "Predict Phase Interference: score 0.0",
            },
        ),
    ))
    assert {item.kind for item in response.evidenceUsed} == {"circuit", "simulation", "learner"}
    assert response.citations[0].route.endswith("/global-vs-relative-phase")
    assert response.verification.status == "verified"
    assert "Personalized from saved evidence (M01)" in response.reply


def test_numeric_claim_verifier_accepts_simulator_values_and_rejects_conflicts():
    truth = {
        "probabilities": {"00": 0.5, "11": 0.5},
        "purity": 0.5,
        "entanglementEntropy": 1.0,
    }
    accepted = verify_numeric_claims([
        MentorNumericClaim(metric="probability", basis="00", value=0.5),
        MentorNumericClaim(metric="purity", value=0.5),
    ], truth)
    assert accepted.status == "verified"
    assert len(accepted.checks) == 2

    rejected = verify_numeric_claims([
        MentorNumericClaim(metric="probability", basis="00", value=1.0),
    ], truth)
    assert rejected.status == "rejected"
    assert "differs from simulator evidence" in rejected.warnings[0]


@pytest.mark.parametrize("message", ["hello", "Hi Aria!", "namaste", "good evening"])
def test_social_greeting_does_not_invent_empty_circuit_context(message):
    response = generate_grounded_fallback_explanation(MentorRequest(message=message))
    assert "empty circuit" not in response.reply.lower()
    assert "open Circuit Studio" in response.reply
    assert response.evidenceUsed == []
    assert response.verification.status == "limited"
    assert "No circuit" in response.verification.warnings[0]


def test_capability_question_explains_evidence_boundary():
    response = generate_grounded_fallback_explanation(MentorRequest(message="What can you do?"))
    assert "three levels" in response.reply
    assert "show exactly which evidence" in response.reply


@pytest.mark.parametrize(
    ("question", "expected", "route"),
    [
        ("Why is superposition not a classical coin flip?", "complex probability amplitudes", "/qubit-states"),
        ("Explain measurement collapse", "Born rule", "/measurement-challenge"),
        ("How does relative phase affect interference?", "global phase", "/global-vs-relative-phase"),
        ("Can entanglement send information faster than light?", "local marginal", "/correlation-inspector"),
        ("Why does Grover need diffusion after the oracle?", "reflections rotate amplitude", "/grover-search"),
        ("What is pure dephasing noise?", "erase relative phase", "/decoherence-relaxation"),
        ("What does the optimizer do in VQE?", "classical optimizer", "/vqe"),
    ],
)
def test_generic_concept_questions_receive_grounded_guidance(question, expected, route):
    response = generate_grounded_fallback_explanation(MentorRequest(
        message=question,
        mode="explain",
        context=MentorContext(hintTier=2),
    ))
    assert expected.lower() in response.reply.lower()
    assert response.citations and response.citations[0].route.endswith(route)
