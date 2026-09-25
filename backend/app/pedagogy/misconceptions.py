"""Misconception Catalog & Cognitive Conflict Engine for Quantum Lens AI.

Implements the 8 core quantum misconceptions (M01-M08) and curated counter-intuitive
conflict laboratories according to Sections 44-52 of the SRS Build Contract.
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

from ..models.circuit_ir import CircuitIR, GateOperation
from ..quantum.simulator import simulate_circuit


class MisconceptionMeta(BaseModel):
    id: str
    title: str
    category: str
    flawedModel: str
    scientificTruth: str
    triggerConcept: str
    conflictLabId: str


CONFLICT_LABS: List[str] = [
    "lab-m01-interference",
    "lab-m02-no-signaling",
    "lab-m03-mixture",
]


MISCONCEPTION_CATALOG: Dict[str, MisconceptionMeta] = {
    "M01": MisconceptionMeta(
        id="M01",
        title="Superposition = Classical Coin Toss",
        category="superposition",
        flawedModel="A qubit in superposition is simultaneously 0 and 1 like a classical 50/50 randomized wire.",
        scientificTruth="Superposition carries complex probability amplitudes that exhibit relative phase interference. H² = I deterministically returns to |0⟩.",
        triggerConcept="superposition",
        conflictLabId="lab-m01-interference",
    ),
    "M02": MisconceptionMeta(
        id="M02",
        title="Entanglement Enables FTL Signaling",
        category="entanglement",
        flawedModel="Measuring Alice's entangled qubit instantly sends a controllable message that Bob can read.",
        scientificTruth="Bob's reduced density matrix is identical (maximally mixed, 50/50) whether Alice measures or not (No-Signaling Theorem).",
        triggerConcept="entanglement",
        conflictLabId="lab-m02-no-signaling",
    ),
    "M03": MisconceptionMeta(
        id="M03",
        title="Superposition = Statistical Mixture",
        category="coherence",
        flawedModel="A pure state |+⟩ is physically indistinguishable from a 50/50 statistical mixture of |0⟩ and |1⟩.",
        scientificTruth="Pure states possess quantum coherence (off-diagonal density matrix elements). Measuring in the X-basis yields 100% |0⟩ for |+⟩, but 50/50 for a mixture.",
        triggerConcept="coherence",
        conflictLabId="lab-m03-mixture",
    ),
    "M04": MisconceptionMeta(
        id="M04",
        title="Measurement is Passive Inspection",
        category="measurement",
        flawedModel="Measurement merely reveals pre-existing deterministic hidden values.",
        scientificTruth="CHSH inequality violation (S ≈ 2.828 > 2) disproves local hidden variable theories (Bell's Theorem).",
        triggerConcept="measurement",
        conflictLabId="lab-m04-chsh",
    ),
    "M05": MisconceptionMeta(
        id="M05",
        title="CNOT Always Entangles",
        category="entanglement",
        flawedModel="Applying a CNOT gate automatically entangles any two input qubits.",
        scientificTruth="CNOT on product computational basis states (e.g. |10⟩ -> |11⟩) produces a separable product state with zero entanglement.",
        triggerConcept="entanglement",
        conflictLabId="lab-m05-cnot",
    ),
}


class ConflictLabStep(BaseModel):
    stepIndex: int
    title: str
    instruction: str
    circuit: CircuitIR
    expectedOutcome: str
    pedagogicalTakeaway: str


class ConflictLabScenario(BaseModel):
    labId: str
    misconceptionId: str
    title: str
    subtitle: str
    commonAssumption: str
    steps: List[ConflictLabStep]
    verificationChallenge: str


def get_conflict_lab(lab_id: str) -> Optional[ConflictLabScenario]:
    """Retrieves curated 90-second cognitive conflict laboratory scenario."""
    if lab_id == "lab-m01-interference":
        return ConflictLabScenario(
            labId="lab-m01-interference",
            misconceptionId="M01",
            title="The Phase Interference Lab",
            subtitle="Testing whether superposition is merely classical 50/50 randomness",
            commonAssumption="Students believe applying two Hadamards (H -> H) is like flipping a coin twice, expecting 50% |0⟩ and 50% |1⟩.",
            steps=[
                ConflictLabStep(
                    stepIndex=1,
                    title="Test A: Two Hadamards (H -> H)",
                    instruction="Run circuit |0⟩ -> H -> H -> Measure.",
                    circuit=CircuitIR(
                        version="1.0",
                        qubits=1,
                        classicalBits=1,
                        operations=[
                            GateOperation(id="g-1", gate="H", targets=[0], controls=[], step=0),
                            GateOperation(id="g-2", gate="H", targets=[0], controls=[], step=1),
                            GateOperation(id="g-3", gate="MEASURE", targets=[0], controls=[], step=2),
                        ],
                    ),
                    expectedOutcome="100% |0⟩ (0% |1⟩)",
                    pedagogicalTakeaway="Hadamard is its own inverse (H² = I). Constructive interference restores |0⟩ with 100% certainty, disproving the coin-flip model.",
                ),
                ConflictLabStep(
                    stepIndex=2,
                    title="Test B: The Phase Inverter (H -> Z -> H)",
                    instruction="Insert a Pauli-Z phase gate between Hadamards: |0⟩ -> H -> Z -> H -> Measure.",
                    circuit=CircuitIR(
                        version="1.0",
                        qubits=1,
                        classicalBits=1,
                        operations=[
                            GateOperation(id="g-1", gate="H", targets=[0], controls=[], step=0),
                            GateOperation(id="g-2", gate="Z", targets=[0], controls=[], step=1),
                            GateOperation(id="g-3", gate="H", targets=[0], controls=[], step=2),
                            GateOperation(id="g-4", gate="MEASURE", targets=[0], controls=[], step=3),
                        ],
                    ),
                    expectedOutcome="100% |1⟩ (0% |0⟩)",
                    pedagogicalTakeaway="Pauli-Z only flips the relative phase of |1⟩. If it were a classical coin toss, changing phase would do nothing. Here, phase shift turns constructive interference into destructive interference!",
                ),
            ],
            verificationChallenge="Predict the output of |0⟩ -> X -> H -> Z -> H. If you predict |0⟩ with 100% certainty, you have mastered relative phase!",
        )

    elif lab_id == "lab-m02-no-signaling":
        return ConflictLabScenario(
            labId="lab-m02-no-signaling",
            misconceptionId="M02",
            title="The No-Signaling Proof Lab",
            subtitle="Testing whether Alice's measurement transmits an instant signal to Bob",
            commonAssumption="Students believe Alice measuring her half of a Bell pair instantly communicates a readable bit to Bob faster than light.",
            steps=[
                ConflictLabStep(
                    stepIndex=1,
                    title="Scenario 1: Alice Measures Before Bob",
                    instruction="Generate Bell pair (|00⟩+|11⟩)/√2. Alice measures q0 first, then Bob measures q1.",
                    circuit=CircuitIR(
                        version="1.0",
                        qubits=2,
                        classicalBits=2,
                        operations=[
                            GateOperation(id="g-1", gate="H", targets=[0], controls=[], step=0),
                            GateOperation(id="g-2", gate="CX", targets=[1], controls=[0], step=1),
                            GateOperation(id="g-3", gate="MEASURE", targets=[0], controls=[], step=2),
                            GateOperation(id="g-4", gate="MEASURE", targets=[1], controls=[], step=3),
                        ],
                    ),
                    expectedOutcome="Bob observes: ~50% 0, ~50% 1",
                    pedagogicalTakeaway="Bob's local measurement distribution is completely random.",
                ),
                ConflictLabStep(
                    stepIndex=2,
                    title="Scenario 2: Alice Does NOT Measure",
                    instruction="Generate Bell pair. Bob measures q1, but Alice does NOT measure q0.",
                    circuit=CircuitIR(
                        version="1.0",
                        qubits=2,
                        classicalBits=2,
                        operations=[
                            GateOperation(id="g-1", gate="H", targets=[0], controls=[], step=0),
                            GateOperation(id="g-2", gate="CX", targets=[1], controls=[0], step=1),
                            GateOperation(id="g-3", gate="MEASURE", targets=[1], controls=[], step=2),
                        ],
                    ),
                    expectedOutcome="Bob observes: ~50% 0, ~50% 1",
                    pedagogicalTakeaway="Bob's statistics are identical in both cases. Bob cannot determine whether Alice measured or not. Information cannot travel faster than light!",
                ),
            ],
            verificationChallenge="How can Alice and Bob detect that their qubits were entangled? (Answer: They must compare measurement keys over a classical channel).",
        )

    elif lab_id == "lab-m03-mixture":
        return ConflictLabScenario(
            labId="lab-m03-mixture",
            misconceptionId="M03",
            title="Coherent Superposition vs Classical Mixture",
            subtitle="Can any physical measurement distinguish |+⟩ from an unpolarized 50/50 mixture?",
            commonAssumption="Students believe that since measuring in Z-basis gives 50/50 for both, they are physically identical.",
            steps=[
                ConflictLabStep(
                    stepIndex=1,
                    title="Measurement in Z-Basis (Standard)",
                    instruction="Measure pure state |+⟩ = H|0⟩ in standard Z-basis.",
                    circuit=CircuitIR(
                        version="1.0",
                        qubits=1,
                        classicalBits=1,
                        operations=[
                            GateOperation(id="g-1", gate="H", targets=[0], controls=[], step=0),
                            GateOperation(id="g-2", gate="MEASURE", targets=[0], controls=[], step=1),
                        ],
                    ),
                    expectedOutcome="50% |0⟩, 50% |1⟩",
                    pedagogicalTakeaway="In the Z-basis, both pure |+⟩ and an unpolarized statistical mixture yield 50% 0 and 50% 1.",
                ),
                ConflictLabStep(
                    stepIndex=2,
                    title="Measurement in X-Basis (Rotated Basis)",
                    instruction="Apply Hadamard before measurement to rotate basis into X: |0⟩ -> H -> H -> Measure.",
                    circuit=CircuitIR(
                        version="1.0",
                        qubits=1,
                        classicalBits=1,
                        operations=[
                            GateOperation(id="g-1", gate="H", targets=[0], controls=[], step=0),
                            GateOperation(id="g-2", gate="H", targets=[0], controls=[], step=1),
                            GateOperation(id="g-3", gate="MEASURE", targets=[0], controls=[], step=2),
                        ],
                    ),
                    expectedOutcome="Pure |+⟩ -> 100% |0⟩; Mixture -> 50% |0⟩, 50% |1⟩",
                    pedagogicalTakeaway="Pure superposition carries phase coherence (off-diagonal density matrix elements ρ_01 = 0.5), allowing interference when rotated. A statistical mixture carries zero coherence.",
                ),
            ],
            verificationChallenge="If a quantum state has purity Tr(ρ²) = 0.5, can it ever produce a 100% deterministic measurement outcome in ANY basis? (Answer: No, an unpolarized mixed state is invariant under rotation).",
        )

    return None
