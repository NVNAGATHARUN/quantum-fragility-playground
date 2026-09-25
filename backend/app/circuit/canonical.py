"""Canonical Semantic Normalization for Quantum Circuits.

Extracts the purely scientific quantum semantics from CircuitIR,
completely stripping display IDs, UI layout columns/steps, titles,
and non-semantic metadata.
"""

from typing import Dict, Any, List
from .ir import CircuitIR, CircuitOperation
from .gate_registry import get_gate_definition


def canonical_operation(op: CircuitOperation) -> Dict[str, Any]:
    """Serializes a single operation into its canonical semantic form."""
    op_type = op.type.upper()
    if op_type == "DIRECTIVE":
        op_type = "BARRIER"

    gate_name = op.gate.upper() if op.gate else None
    gate_def = get_gate_definition(gate_name) if gate_name else None

    # Determine if targets are symmetric (e.g. SWAP, BARRIER)
    is_symmetric = False
    if gate_def and gate_def.symmetric:
        is_symmetric = True
    elif op_type == "BARRIER":
        is_symmetric = True

    targets = sorted(op.targets) if is_symmetric else list(op.targets)
    controls = sorted(op.controls) if op.controls else []
    classical = list(op.classicalTargets) if op.classicalTargets else []

    # Normalize floating-point parameters (round to 10 decimal places to eliminate IEEE-754 epsilon noise)
    normalized_params = [round(float(p), 10) for p in op.params]

    canonical: Dict[str, Any] = {
        "type": op_type,
        "gate": gate_name if op_type == "GATE" else None,
        "targets": targets,
        "controls": controls,
        "params": normalized_params,
        "classicalTargets": classical,
    }
    return canonical


def canonical_semantics(ir: CircuitIR) -> Dict[str, Any]:
    """Returns the canonical semantic representation of a CircuitIR instance.

    Guaranteed to be invariant to:
    - Operation display IDs
    - Circuit title, author, description
    - Step / column numbers
    - Layout and UI coordinates
    - Param floating point representations within 1e-10
    """
    return {
        "schemaVersion": "1.0",
        "qubits": int(ir.qubits),
        "classicalBits": int(ir.classicalBits),
        "operations": [canonical_operation(op) for op in ir.operations],
    }


def semantic_equal(ir_a: CircuitIR, ir_b: CircuitIR) -> bool:
    """Asserts deep quantum semantic equality between two circuits."""
    return canonical_semantics(ir_a) == canonical_semantics(ir_b)
