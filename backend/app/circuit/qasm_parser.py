"""OpenQASM 3 Parser using established openqasm3 AST parser.

Extracts canonical CircuitIR from OpenQASM 3 source code, enforcing the
Quantum Lens supported subset with structured line/column diagnostics.
"""

import math
import re
from typing import Tuple, Optional, List, Dict, Any
import openqasm3
from openqasm3.ast import (
    Program,
    QubitDeclaration,
    ClassicalDeclaration,
    QuantumGate,
    QuantumMeasurementStatement,
    QuantumReset,
    QuantumBarrier,
    Include,
    IntegerLiteral,
    FloatLiteral,
    Identifier,
    IndexedIdentifier,
    BinaryExpression,
    UnaryExpression,
    BinaryOperator,
    UnaryOperator,
)

from .ir import CircuitIR, CircuitOperation
from .diagnostics import Diagnostic
from .gate_registry import get_gate_definition, GATE_REGISTRY


def _extract_error_location(error_msg: str) -> Tuple[Optional[int], Optional[int]]:
    """Extracts line and column from an error string if present (e.g. 'L3:C17' or 'line 3:17')."""
    m = re.search(r"L(\d+):C(\d+)", error_msg)
    if m:
        return int(m.group(1)), int(m.group(2))
    m2 = re.search(r"line (\d+):(\d+)", error_msg)
    if m2:
        return int(m2.group(1)), int(m2.group(2))
    return None, None


def _eval_expression(expr: Any) -> float:
    """Safely evaluates an OpenQASM expression AST node into a numeric float."""
    if isinstance(expr, IntegerLiteral):
        return float(expr.value)
    if isinstance(expr, FloatLiteral):
        return float(expr.value)
    if isinstance(expr, Identifier):
        name = expr.name.lower()
        if name in ("pi", "π"):
            return math.pi
        if name in ("tau", "τ"):
            return 2.0 * math.pi
        if name == "e":
            return math.e
        raise ValueError(f"Unknown symbolic constant: '{expr.name}'")
    if isinstance(expr, UnaryExpression):
        val = _eval_expression(expr.expression)
        if expr.op in (UnaryOperator["-"], "-"):
            return -val
        if expr.op in (UnaryOperator["+"], "+"):
            return val
        raise ValueError(f"Unsupported unary operator: '{expr.op}'")
    if isinstance(expr, BinaryExpression):
        lhs = _eval_expression(expr.lhs)
        rhs = _eval_expression(expr.rhs)
        op_name = getattr(expr.op, "name", str(expr.op))
        if "/" in op_name:
            if rhs == 0.0:
                raise ZeroDivisionError("Division by zero in gate parameter expression.")
            return lhs / rhs
        elif "*" in op_name:
            return lhs * rhs
        elif "+" in op_name:
            return lhs + rhs
        elif "-" in op_name:
            return lhs - rhs
        elif "**" in op_name or "^" in op_name:
            return lhs ** rhs
        raise ValueError(f"Unsupported binary operator: '{expr.op}'")

    # If it is a string or primitive
    try:
        return float(expr)
    except Exception:
        raise ValueError(f"Cannot evaluate expression node of type {type(expr).__name__}")


def parse_openqasm3_to_ir(source: str) -> Tuple[Optional[CircuitIR], List[Diagnostic]]:
    """Parses OpenQASM 3 source into canonical CircuitIR using the openqasm3 parser."""
    diagnostics: List[Diagnostic] = []

    if not source or not source.strip():
        diagnostics.append(
            Diagnostic(
                severity="error",
                code="EMPTY_SOURCE",
                message="OpenQASM 3 source is empty.",
                suggestion="Provide valid OpenQASM 3 circuit code.",
            )
        )
        return None, diagnostics

    # 1. Parse AST with openqasm3
    try:
        ast: Program = openqasm3.parse(source)
    except Exception as e:
        err_str = str(e)
        line, col = _extract_error_location(err_str)
        diagnostics.append(
            Diagnostic(
                severity="error",
                code="QASM3_SYNTAX_ERROR",
                message=f"OpenQASM 3 syntax error: {err_str}",
                line=line,
                column=col,
                suggestion="Check OpenQASM 3 syntax around the indicated location.",
            )
        )
        return None, diagnostics

    # 2. Register mapping
    qubit_registers: Dict[str, Tuple[int, int]] = {}  # reg_name -> (start_idx, count)
    classical_registers: Dict[str, Tuple[int, int]] = {}
    total_qubits = 0
    total_clbits = 0

    operations: List[CircuitOperation] = []
    op_counter = 0

    for stmt in ast.statements:
        line = getattr(stmt.span, "start_line", None) if hasattr(stmt, "span") else None
        col = getattr(stmt.span, "start_column", None) if hasattr(stmt, "span") else None

        # A. Qubit declaration
        if isinstance(stmt, QubitDeclaration):
            reg_name = stmt.qubit.name
            size = stmt.size.value if stmt.size else 1
            qubit_registers[reg_name] = (total_qubits, size)
            total_qubits += size
            continue

        # B. Classical bit declaration
        if isinstance(stmt, ClassicalDeclaration):
            reg_name = stmt.identifier.name
            size = 1
            if hasattr(stmt.type, "size") and stmt.type.size:
                size = stmt.type.size.value
            classical_registers[reg_name] = (total_clbits, size)
            total_clbits += size
            continue

        # C. Include statements
        if isinstance(stmt, Include):
            # stdgates.inc is accepted and standard
            continue

        # Helper to resolve qubit identifier to global wire index
        def resolve_qubit(q_node: Any) -> Optional[int]:
            if isinstance(q_node, IndexedIdentifier):
                r_name = q_node.name.name
                if r_name not in qubit_registers:
                    return None
                offset, count = qubit_registers[r_name]
                idx = q_node.indices[0][0].value
                if idx < 0 or idx >= count:
                    return None
                return offset + idx
            elif isinstance(q_node, Identifier):
                r_name = q_node.name
                if r_name not in qubit_registers:
                    return None
                offset, count = qubit_registers[r_name]
                if count == 1:
                    return offset
                return None
            return None

        # Helper to resolve classical bit
        def resolve_clbit(c_node: Any) -> Optional[int]:
            if isinstance(c_node, IndexedIdentifier):
                r_name = c_node.name.name
                if r_name not in classical_registers:
                    return None
                offset, count = classical_registers[r_name]
                idx = c_node.indices[0][0].value
                if idx < 0 or idx >= count:
                    return None
                return offset + idx
            elif isinstance(c_node, Identifier):
                r_name = c_node.name
                if r_name not in classical_registers:
                    return None
                offset, count = classical_registers[r_name]
                if count == 1:
                    return offset
                return None
            return None

        # D. Quantum Gate
        if isinstance(stmt, QuantumGate):
            gate_name = stmt.name.name.upper()
            gate_def = get_gate_definition(gate_name)

            if not gate_def:
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="UNSUPPORTED_GATE",
                        message=f"Gate '{stmt.name.name}' is not supported in Quantum Lens.",
                        line=line,
                        column=col,
                        suggestion=f"Supported gates: {', '.join(sorted(GATE_REGISTRY.keys()))}.",
                    )
                )
                continue

            # Evaluate parameters
            evaluated_params = []
            param_error = False
            for arg in stmt.arguments:
                try:
                    evaluated_params.append(_eval_expression(arg))
                except Exception as ex:
                    param_error = True
                    diagnostics.append(
                        Diagnostic(
                            severity="error",
                            code="INVALID_PARAMETER_EXPRESSION",
                            message=f"Could not evaluate gate parameter: {ex}",
                            line=line,
                            column=col,
                            suggestion="Use numeric literals or arithmetic with 'pi'.",
                        )
                    )
            if param_error:
                continue

            # Resolve qubits
            resolved_qubits = []
            qubit_error = False
            for q_ref in stmt.qubits:
                q_idx = resolve_qubit(q_ref)
                if q_idx is None:
                    qubit_error = True
                    diagnostics.append(
                        Diagnostic(
                            severity="error",
                            code="UNDEFINED_QUBIT_REFERENCE",
                            message=f"Qubit reference in '{gate_name}' could not be resolved or is out of bounds.",
                            line=line,
                            column=col,
                            suggestion="Ensure register was declared before use and index is within bounds.",
                        )
                    )
                else:
                    resolved_qubits.append(q_idx)
            if qubit_error:
                continue

            # Partition qubits according to GateDefinition
            n_controls = gate_def.controls
            n_targets = gate_def.targets

            if n_targets != -1 and len(resolved_qubits) != (n_controls + n_targets):
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="OPERAND_COUNT_MISMATCH",
                        message=f"Gate '{gate_def.name}' expects {n_controls + n_targets} operands ({n_controls} controls, {n_targets} targets), got {len(resolved_qubits)}.",
                        line=line,
                        column=col,
                    )
                )
                continue

            controls = resolved_qubits[:n_controls]
            targets = resolved_qubits[n_controls:]

            op_counter += 1
            operations.append(
                CircuitOperation(
                    id=f"op_{op_counter:03d}",
                    type="GATE",
                    gate=gate_def.name,
                    targets=targets,
                    controls=controls,
                    params=evaluated_params,
                )
            )
            continue

        # E. Measurement statement
        if isinstance(stmt, QuantumMeasurementStatement):
            q_idx = resolve_qubit(stmt.measure.qubit)
            c_idx = resolve_clbit(stmt.target)
            if q_idx is None:
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="INVALID_MEASURE_QUBIT",
                        message="Measured qubit reference is invalid or out of bounds.",
                        line=line,
                        column=col,
                    )
                )
                continue
            if c_idx is None:
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="INVALID_MEASURE_CLBIT",
                        message="Measurement target classical bit is invalid or out of bounds.",
                        line=line,
                        column=col,
                    )
                )
                continue

            op_counter += 1
            operations.append(
                CircuitOperation(
                    id=f"op_{op_counter:03d}",
                    type="MEASURE",
                    gate="MEASURE",
                    targets=[q_idx],
                    controls=[],
                    params=[],
                    classicalTargets=[c_idx],
                )
            )
            continue

        # F. Quantum Reset
        if isinstance(stmt, QuantumReset):
            q_idx = resolve_qubit(stmt.qubits)
            if q_idx is None:
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="INVALID_RESET_QUBIT",
                        message="Reset qubit reference is invalid.",
                        line=line,
                        column=col,
                    )
                )
                continue
            op_counter += 1
            operations.append(
                CircuitOperation(
                    id=f"op_{op_counter:03d}",
                    type="RESET",
                    gate="RESET",
                    targets=[q_idx],
                )
            )
            continue

        # G. Quantum Barrier
        if isinstance(stmt, QuantumBarrier):
            qubits_in_barrier = []
            barrier_err = False
            for q_ref in stmt.qubits:
                q_idx = resolve_qubit(q_ref)
                if q_idx is None:
                    barrier_err = True
                    break
                qubits_in_barrier.append(q_idx)

            if barrier_err or not qubits_in_barrier:
                # If barrier has no args, covers all qubits in register
                qubits_in_barrier = list(range(total_qubits))

            op_counter += 1
            operations.append(
                CircuitOperation(
                    id=f"op_{op_counter:03d}",
                    type="BARRIER",
                    gate="BARRIER",
                    targets=qubits_in_barrier,
                )
            )
            continue

        # H. Unsupported statements (e.g. defcal, while, for)
        diagnostics.append(
            Diagnostic(
                severity="error",
                code="UNSUPPORTED_STATEMENT",
                message=f"Statement '{type(stmt).__name__}' is outside the supported Quantum Lens subset.",
                line=line,
                column=col,
                suggestion="Quantum Lens supports standard gate sequences, barrier, reset, and measurement.",
            )
        )

    has_errors = any(d.severity == "error" for d in diagnostics)
    if has_errors:
        return None, diagnostics

    # Construct CircuitIR
    circuit_ir = CircuitIR(
        schemaVersion="1.0",
        qubits=max(1, total_qubits),
        classicalBits=total_clbits,
        operations=operations,
    )
    return circuit_ir, diagnostics
