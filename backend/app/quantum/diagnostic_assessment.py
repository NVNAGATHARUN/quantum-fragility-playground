"""Alternate-form diagnostic item bank for the eight misconception models.

Correct answers never leave the server. Baseline and post forms test the same
concepts with different situations so improvement is not simple answer recall.
"""

FORMS = {
    "baseline": [
        ("b-m01", "M01", "Superposition", "A two-qubit register is in equal superposition. Does one measurement reveal the result of every possible input?", ["Yes, all branches are read", "No, it returns one sampled bit string", "Only on a noiseless simulator", "Only after entanglement"], 1),
        ("b-m02", "M02", "No-signalling", "Alice and Bob share a Bell pair. Alice chooses whether to measure. What distribution can Bob see locally before receiving a classical message?", ["Alice's chosen bit", "Always zero", "The same random marginal either way", "A faster-than-light signal"], 2),
        ("b-m03", "M03", "Coherence", "A coherent |+> state and a 50/50 classical mixture look identical in the Z basis. What can distinguish them?", ["Their X-basis statistics", "More Z-basis shots", "Their number of qubits", "Nothing can"], 0),
        ("b-m04", "M04", "Measurement", "After measuring |+> in the Z basis and obtaining 0, what is the state for an immediate repeated Z measurement?", ["Still |+>", "|0>", "A hidden pre-existing value", "An equal mixture"], 1),
        ("b-m05", "M05", "Entanglement", "Which input makes a CNOT create a Bell state?", ["|00>", "|10>", "|+0>", "|01>"], 2),
        ("b-m06", "M06", "Grover", "Why does Grover search need about sqrt(N) oracle calls rather than one?", ["A measurement cannot read every branch", "The oracle checks every answer classically", "Entanglement transmits the answer", "The database shrinks automatically"], 0),
        ("b-m07", "M07", "Relative phase", "H|0> and ZH|0> have the same Z probabilities. Can a later H gate make their outcomes different?", ["No, probabilities were equal", "Yes, relative phase controls interference", "Only with noise", "Only on hardware"], 1),
        ("b-m08", "M08", "Noise", "Pure dephasing leaves Z populations unchanged. What can it still damage?", ["Classical storage size", "Relative phase and interference", "The number of circuit wires", "Only the UI"], 1),
    ],
    "post": [
        ("p-m01", "M01", "Superposition", "A uniform four-state superposition is measured once. How much classical output is obtained?", ["All four states", "One two-bit outcome", "Four probabilities and four states", "No output"], 1),
        ("p-m02", "M02", "No-signalling", "Alice applies Z to her half of a Bell pair. Before basis comparison, what changes in Bob's local measurement distribution?", ["It becomes deterministic", "It flips", "Nothing observable locally", "It carries Alice's message"], 2),
        ("p-m03", "M03", "Coherence", "Which experiment separates |-> from an incoherent 50/50 Z mixture?", ["Measure both directly in Z", "Apply H, then measure Z", "Increase the shot count in Z only", "Discard phase information"], 1),
        ("p-m04", "M04", "Measurement", "A qubit measured in Z is then measured in X. Why is the X result generally random?", ["The first measurement prepared a Z eigenstate", "The original hidden X value was revealed", "The simulator forgot the state", "Measurements never affect states"], 0),
        ("p-m05", "M05", "Entanglement", "CNOT acts on |+1>. Is the output separable?", ["No; the branches correlate with different targets", "Yes; CNOT never entangles", "Yes; every CNOT output is classical", "It depends only on shots"], 0),
        ("p-m06", "M06", "Grover", "What does Grover's diffusion step do?", ["Reads every database entry", "Amplifies a marked state's amplitude through interference", "Copies the marked answer", "Guarantees success after one query"], 1),
        ("p-m07", "M07", "Relative phase", "Two states have identical basis probabilities but opposite relative phase. What is required to expose the difference?", ["An interference operation", "Only more shots in the same basis", "A classical sort", "Removing all gates"], 0),
        ("p-m08", "M08", "Noise", "A circuit is logically correct but loses fidelity as depth increases on a device. What is the best explanation?", ["Only a software syntax bug", "Accumulated physical decoherence and gate error", "Quantum gates stop being unitary in theory", "The histogram renderer"], 1),
    ],
}


def public_form(phase: str) -> list[dict]:
    return [
        {"id": qid, "misconception_id": mid, "concept": concept, "prompt": prompt, "options": options}
        for qid, mid, concept, prompt, options, _ in FORMS[phase]
    ]


def grade_form(phase: str, responses: dict[str, int]) -> tuple[list[dict], dict[str, float]]:
    graded = []
    concepts = {}
    for qid, mid, concept, prompt, options, correct in FORMS[phase]:
        selected = responses.get(qid)
        passed = selected == correct
        graded.append({"item_id": qid, "misconception_id": mid, "concept": concept, "passed": passed, "selected": selected})
        concepts[concept] = 1.0 if passed else 0.0
    return graded, concepts
