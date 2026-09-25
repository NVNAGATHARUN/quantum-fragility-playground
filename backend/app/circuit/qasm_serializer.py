"""Canonical OpenQASM 3 Serializer.

Produces deterministic, canonical OpenQASM 3 code from CircuitIR using
modern assignment measurement syntax: c[i] = measure q[i];
"""

import math
from .ir import CircuitIR, CircuitOperation
from .gate_registry import get_gate_definition


def _format_param(val: float) -> str:
    """Formats a float parameter into clean canonical representation."""
    # Check for exact common pi multiples within small epsilon
    for denom in [1, 2, 3, 4, 6, 8]:
        for num in [-4, -3, -2, -1, 1, 2, 3, 4]:
            target = (num * math.pi) / denom
            if abs(val - target) < 1e-9:
                if num == 1 and denom == 1:
                    return "pi"
                if num == -1 and denom == 1:
                    return "-pi"
                if num == 1:
                    return f"pi / {denom}"
                if num == -1:
                    return f"-pi / {denom}"
                return f"{num} * pi / {denom}"

    # General float formatting
    formatted = f"{val:.10g}"
    if "." not in formatted and "e" not in formatted:
        formatted += ".0"
    return formatted


def serialize_ir_to_openqasm3(circuit: CircuitIR) -> str:
    """Generates canonical OpenQASM 3 source string from CircuitIR."""
    lines = [
        "OPENQASM 3.0;",
        'include "stdgates.inc";',
        "",
        f"qubit[{circuit.qubits}] q;",
    ]

    if circuit.classicalBits > 0:
        lines.append(f"bit[{circuit.classicalBits}] c;")

    lines.append("")

    for op in circuit.operations:
        op_type = op.type.upper()

        if op_type == "GATE":
            gate_name = op.gate.lower() if op.gate else "unknown"
            operands = [f"q[{c}]" for c in op.controls] + [f"q[{t}]" for t in op.targets]
            operands_str = ", ".join(operands)

            if op.params:
                params_str = ", ".join(_format_param(p) for p in op.params)
                lines.append(f"{gate_name}({params_str}) {operands_str};")
            else:
                lines.append(f"{gate_name} {operands_str};")

        elif op_type == "MEASURE":
            for q_idx, c_idx in zip(op.targets, op.classicalTargets):
                lines.append(f"c[{c_idx}] = measure q[{q_idx}];")

        elif op_type == "RESET":
            for q_idx in op.targets:
                lines.append(f"reset q[{q_idx}];")

        elif op_type in ("BARRIER", "DIRECTIVE"):
            targets_str = ", ".join(f"q[{t}]" for t in op.targets)
            lines.append(f"barrier {targets_str};")

    lines.append("")
    return "\n".join(lines)
