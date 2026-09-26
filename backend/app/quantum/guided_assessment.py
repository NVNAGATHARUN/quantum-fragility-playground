"""Server-owned rubrics for the four guided learning journeys."""

from dataclasses import dataclass
from typing import Dict, List, Tuple

from qiskit.quantum_info import Statevector, state_fidelity

from ..circuit.ir import CircuitIR
from .simulator import build_qiskit_circuit


@dataclass(frozen=True)
class GuidedRubric:
    title: str
    required: Tuple[Tuple[str, Tuple[int, ...], Tuple[int, ...], int], ...]
    target_state: List[complex] | None = None


RUBRICS: Dict[str, Tuple[GuidedRubric, ...]] = {
    "superposition": (
        GuidedRubric("Prepare equal superposition", (("H", (0,), (), 0),), [2**-0.5, 2**-0.5]),
        GuidedRubric("Interfere amplitudes", (("H", (0,), (), 0), ("H", (0,), (), 1)), [1, 0]),
        GuidedRubric("Measure the state", (("H", (0,), (), 0), ("H", (0,), (), 1), ("MEASURE", (0,), (), 2))),
    ),
    "phase": (
        GuidedRubric("Prepare |+>", (("H", (0,), (), 0),), [2**-0.5, 2**-0.5]),
        GuidedRubric("Apply relative phase", (("H", (0,), (), 0), ("Z", (0,), (), 1)), [2**-0.5, -(2**-0.5)]),
        GuidedRubric("Reveal phase by interference", (("H", (0,), (), 0), ("Z", (0,), (), 1), ("H", (0,), (), 2)), [0, 1]),
    ),
    "measurement": (
        GuidedRubric("Prepare uncertain state", (("H", (0,), (), 0),), [2**-0.5, 2**-0.5]),
        GuidedRubric("Measure the qubit", (("H", (0,), (), 0), ("MEASURE", (0,), (), 1))),
        GuidedRubric("Reset then prepare |1>", (("H", (0,), (), 0), ("MEASURE", (0,), (), 1), ("RESET", (0,), (), 2), ("X", (0,), (), 3))),
    ),
    "bell-state": (
        GuidedRubric("Prepare the control superposition", (("H", (0,), (), 0),), [2**-0.5, 2**-0.5, 0, 0]),
        GuidedRubric("Create phase-correct Bell state", (("H", (0,), (), 0), ("CX", (1,), (0,), 1)), [2**-0.5, 0, 0, 2**-0.5]),
        GuidedRubric("Measure both halves", (("H", (0,), (), 0), ("CX", (1,), (0,), 1), ("MEASURE", (0,), (), 2), ("MEASURE", (1,), (), 2))),
    ),
}


def evaluate_guided_checkpoint(lab_id: str, checkpoint: int, circuit: CircuitIR) -> dict:
    if lab_id not in RUBRICS or checkpoint < 0 or checkpoint >= len(RUBRICS[lab_id]):
        raise KeyError("Unknown guided checkpoint")
    rubric = RUBRICS[lab_id][checkpoint]
    actual = {
        (str(op.gate).upper(), tuple(op.targets), tuple(op.controls), op.step)
        for op in circuit.operations
    }
    missing = [item for item in rubric.required if item not in actual]
    fidelity = None
    if not missing and rubric.target_state is not None:
        unitary_ops = [op for op in circuit.operations if str(op.gate).upper() not in {"MEASURE", "RESET"}]
        unitary = circuit.model_copy(update={"operations": unitary_ops})
        state = Statevector.from_instruction(build_qiskit_circuit(unitary))
        fidelity = float(state_fidelity(state, Statevector(rubric.target_state)))
    passed = not missing and (fidelity is None or fidelity >= 0.999)
    if missing:
        reason = "Required circuit semantics are missing or placed on the wrong qubit/step."
    elif fidelity is not None and fidelity < 0.999:
        reason = f"Gate pattern exists, but target-state fidelity is only {fidelity:.4f}; phase and ordering matter."
    else:
        reason = "Server simulation verified this checkpoint."
    return {"passed": passed, "score": 100.0 if passed else 0.0, "fidelity": fidelity, "reason": reason, "title": rubric.title}
