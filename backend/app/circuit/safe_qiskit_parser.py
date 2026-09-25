"""Safe Qiskit Python AST Parser.

Extracts canonical CircuitIR from user-provided Qiskit Python code via pure AST analysis.
NEVER imports, executes (no eval/exec), or runs user code at runtime.
Strictly whitelists safe syntax and rejects all arbitrary execution, loops, comprehensions,
attribute chains, and unknown imports.
"""

import ast
import math
from typing import Tuple, Optional, List, Dict, Any, Set

from .ir import CircuitIR, CircuitOperation
from .diagnostics import Diagnostic
from .gate_registry import get_gate_definition, GATE_REGISTRY


# Allowed top-level AST statement types
ALLOWED_STMT_TYPES = (
    ast.Import,
    ast.ImportFrom,
    ast.Assign,
    ast.Expr,
    ast.Pass,
)

# Whitelisted imports
ALLOWED_MODULES = {"qiskit", "math"}
ALLOWED_IMPORT_NAMES = {
    "QuantumCircuit",
    "pi",
}

# Whitelisted expression AST types
ALLOWED_EXPR_TYPES = (
    ast.Constant,
    ast.Name,
    ast.UnaryOp,
    ast.BinOp,
    ast.Tuple,
    ast.List,
    ast.Attribute,
)


class SecurityViolation(Exception):
    def __init__(self, message: str, line: Optional[int] = None, col: Optional[int] = None, suggestion: Optional[str] = None):
        super().__init__(message)
        self.message = message
        self.line = line
        self.col = col
        self.suggestion = suggestion


def _eval_ast_math(node: ast.AST) -> float:
    """Safely evaluates an arithmetic AST node containing numbers, pi, and basic operators."""
    if isinstance(node, ast.Constant):
        if isinstance(node.value, (int, float)):
            return float(node.value)
        raise SecurityViolation(f"Unsupported constant value: {node.value!r}", getattr(node, "lineno", None), getattr(node, "col_offset", None))

    if isinstance(node, ast.Name):
        name = node.id.lower()
        if name in ("pi", "π"):
            return math.pi
        if name in ("tau", "τ"):
            return 2.0 * math.pi
        if name == "e":
            return math.e
        raise SecurityViolation(f"Undefined variable or constant: '{node.id}'", getattr(node, "lineno", None), getattr(node, "col_offset", None), suggestion="Only 'pi' is allowed as a symbolic parameter.")

    if isinstance(node, ast.Attribute):
        # Allow math.pi
        if isinstance(node.value, ast.Name) and node.value.id == "math" and node.attr == "pi":
            return math.pi
        raise SecurityViolation(f"Disallowed attribute access: '{ast.dump(node)}'", getattr(node, "lineno", None), getattr(node, "col_offset", None), suggestion="Attribute chains and arbitrary object properties are forbidden.")

    if isinstance(node, ast.UnaryOp):
        operand = _eval_ast_math(node.operand)
        if isinstance(node.op, ast.USub):
            return -operand
        if isinstance(node.op, ast.UAdd):
            return operand
        raise SecurityViolation(f"Unsupported unary operator: {type(node.op).__name__}", getattr(node, "lineno", None), getattr(node, "col_offset", None))

    if isinstance(node, ast.BinOp):
        left = _eval_ast_math(node.left)
        right = _eval_ast_math(node.right)
        if isinstance(node.op, ast.Add):
            return left + right
        if isinstance(node.op, ast.Sub):
            return left - right
        if isinstance(node.op, ast.Mult):
            return left * right
        if isinstance(node.op, ast.Div):
            if right == 0.0:
                raise ZeroDivisionError("Division by zero in gate parameter expression.")
            return left / right
        if isinstance(node.op, ast.Pow):
            return left ** right
        raise SecurityViolation(f"Unsupported binary operator: {type(node.op).__name__}", getattr(node, "lineno", None), getattr(node, "col_offset", None))

    raise SecurityViolation(f"Expression type '{type(node).__name__}' is not allowed in parameters.", getattr(node, "lineno", None), getattr(node, "col_offset", None))


def _extract_int_or_list(node: ast.AST) -> List[int]:
    """Extracts integer qubit index or list of integer qubit indices from AST node."""
    if isinstance(node, ast.Constant) and isinstance(node.value, int):
        return [node.value]
    if isinstance(node, (ast.List, ast.Tuple)):
        res = []
        for el in node.elts:
            if isinstance(el, ast.Constant) and isinstance(el.value, int):
                res.append(el.value)
            else:
                raise SecurityViolation("Qubit indices in a list/tuple must be integer literals.", getattr(el, "lineno", None), getattr(el, "col_offset", None))
        return res
    raise SecurityViolation("Qubit index must be an integer literal or list of integers.", getattr(node, "lineno", None), getattr(node, "col_offset", None))


def parse_safe_qiskit_to_ir(source: str) -> Tuple[Optional[CircuitIR], List[Diagnostic]]:
    """Statically parses Qiskit Python code into canonical CircuitIR without code execution."""
    diagnostics: List[Diagnostic] = []

    if not source or not source.strip():
        diagnostics.append(
            Diagnostic(
                severity="error",
                code="EMPTY_SOURCE",
                message="Qiskit source code is empty.",
                suggestion="Provide valid Python code defining a QuantumCircuit.",
            )
        )
        return None, diagnostics

    # 1. Parse AST
    try:
        tree = ast.parse(source)
    except SyntaxError as se:
        diagnostics.append(
            Diagnostic(
                severity="error",
                code="PYTHON_SYNTAX_ERROR",
                message=f"Python syntax error: {se.msg}",
                line=se.lineno,
                column=se.offset,
                suggestion="Fix the syntax error in your Python code.",
            )
        )
        return None, diagnostics
    except Exception as e:
        diagnostics.append(
            Diagnostic(
                severity="error",
                code="PARSE_FAILED",
                message=f"Failed to parse Python code: {str(e)}",
            )
        )
        return None, diagnostics

    # 2. Walk AST statements and enforce strict whitelist
    circuit_var_name: Optional[str] = None
    num_qubits: Optional[int] = None
    num_clbits: int = 0
    operations: List[CircuitOperation] = []
    op_counter = 0

    for stmt in tree.body:
        line = getattr(stmt, "lineno", None)
        col = getattr(stmt, "col_offset", None)

        # Check statement whitelist
        if not isinstance(stmt, ALLOWED_STMT_TYPES):
            diagnostics.append(
                Diagnostic(
                    severity="error",
                    code="DISALLOWED_STATEMENT",
                    message=f"Statement '{type(stmt).__name__}' is forbidden in Safe Qiskit Mode.",
                    line=line,
                    column=col,
                    suggestion="Safe mode permits only imports, circuit instantiation, and gate method calls.",
                )
            )
            return None, diagnostics

        # A. Import checks
        if isinstance(stmt, ast.Import):
            for alias in stmt.names:
                if alias.name not in ALLOWED_MODULES:
                    diagnostics.append(
                        Diagnostic(
                            severity="error",
                            code="SECURITY_VIOLATION",
                            message=f"Importing module '{alias.name}' is strictly forbidden.",
                            line=line,
                            column=col,
                            suggestion="Only 'from qiskit import QuantumCircuit' and 'from math import pi' are allowed.",
                        )
                    )
                    return None, diagnostics
            continue

        if isinstance(stmt, ast.ImportFrom):
            if stmt.module not in ALLOWED_MODULES:
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="SECURITY_VIOLATION",
                        message=f"Importing from module '{stmt.module}' is strictly forbidden.",
                        line=line,
                        column=col,
                        suggestion="Only 'qiskit' and 'math' imports are permitted in Safe AST Mode.",
                    )
                )
                return None, diagnostics
            for alias in stmt.names:
                if alias.name not in ALLOWED_IMPORT_NAMES and stmt.module != "math":
                    diagnostics.append(
                        Diagnostic(
                            severity="error",
                            code="SECURITY_VIOLATION",
                            message=f"Importing '{alias.name}' from '{stmt.module}' is forbidden.",
                            line=line,
                            column=col,
                            suggestion="Only QuantumCircuit and pi may be imported.",
                        )
                    )
                    return None, diagnostics
            continue

        # B. QuantumCircuit instantiation: qc = QuantumCircuit(qubits, clbits)
        if isinstance(stmt, ast.Assign):
            if len(stmt.targets) != 1 or not isinstance(stmt.targets[0], ast.Name):
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="DISALLOWED_ASSIGNMENT",
                        message="Only single variable assignment (e.g. qc = QuantumCircuit(...)) is supported.",
                        line=line,
                        column=col,
                    )
                )
                return None, diagnostics

            var_name = stmt.targets[0].id
            value_node = stmt.value

            if not isinstance(value_node, ast.Call):
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="DISALLOWED_ASSIGNMENT",
                        message=f"Assigning arbitrary values to '{var_name}' is not supported.",
                        line=line,
                        column=col,
                        suggestion="Use 'qc = QuantumCircuit(num_qubits, num_classical_bits)'",
                    )
                )
                return None, diagnostics

            func_name = None
            if isinstance(value_node.func, ast.Name):
                func_name = value_node.func.id
            elif isinstance(value_node.func, ast.Attribute) and isinstance(value_node.func.value, ast.Name):
                func_name = f"{value_node.func.value.id}.{value_node.func.attr}"

            if func_name not in ("QuantumCircuit", "qiskit.QuantumCircuit"):
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="UNAUTHORIZED_CALL",
                        message=f"Function call '{func_name}' is forbidden.",
                        line=line,
                        column=col,
                        suggestion="Only QuantumCircuit instantiation and its methods are allowed.",
                    )
                )
                return None, diagnostics

            # Extract arguments
            if not value_node.args:
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="CIRCUIT_ARGS_MISSING",
                        message="QuantumCircuit requires at least the qubit count.",
                        line=line,
                        column=col,
                        suggestion="Specify QuantumCircuit(qubits, [classical_bits]).",
                    )
                )
                return None, diagnostics

            try:
                q_count = _eval_ast_math(value_node.args[0])
                num_qubits = int(q_count)
            except Exception as ex:
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="INVALID_QUBIT_COUNT",
                        message=f"Could not resolve qubit count: {ex}",
                        line=line,
                        column=col,
                    )
                )
                return None, diagnostics

            if len(value_node.args) >= 2:
                try:
                    c_count = _eval_ast_math(value_node.args[1])
                    num_clbits = int(c_count)
                except Exception as ex:
                    diagnostics.append(
                        Diagnostic(
                            severity="error",
                            code="INVALID_CLASSICAL_BIT_COUNT",
                            message=f"Could not resolve classical bit count: {ex}",
                            line=line,
                            column=col,
                        )
                    )
                    return None, diagnostics

            circuit_var_name = var_name
            continue

        # C. Circuit method calls: qc.<gate>(...)
        if isinstance(stmt, ast.Expr):
            if not isinstance(stmt.value, ast.Call):
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="DISALLOWED_EXPR",
                        message="Expression must be a circuit method call.",
                        line=line,
                        column=col,
                    )
                )
                return None, diagnostics

            call_node = stmt.value
            if not isinstance(call_node.func, ast.Attribute) or not isinstance(call_node.func.value, ast.Name):
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="DISALLOWED_CALL",
                        message="Calls must be direct methods on the QuantumCircuit variable.",
                        line=line,
                        column=col,
                    )
                )
                return None, diagnostics

            obj_name = call_node.func.value.id
            method_name = call_node.func.attr.lower()

            if circuit_var_name and obj_name != circuit_var_name:
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="UNKNOWN_CIRCUIT_VARIABLE",
                        message=f"Object '{obj_name}' does not match initialized circuit '{circuit_var_name}'.",
                        line=line,
                        column=col,
                    )
                )
                return None, diagnostics

            # Handle gate methods
            try:
                op_counter += 1
                op = _process_qiskit_method_call(method_name, call_node.args, op_counter, num_qubits or 64, num_clbits)
                if op:
                    if isinstance(op, list):
                        operations.extend(op)
                    else:
                        operations.append(op)
            except SecurityViolation as sv:
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="SECURITY_VIOLATION",
                        message=sv.message,
                        line=sv.line or line,
                        column=sv.col or col,
                        suggestion=sv.suggestion,
                    )
                )
                return None, diagnostics
            except Exception as ex:
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="METHOD_CALL_FAILED",
                        message=f"Error parsing call to '{method_name}': {str(ex)}",
                        line=line,
                        column=col,
                    )
                )
                return None, diagnostics

    if num_qubits is None:
        diagnostics.append(
            Diagnostic(
                severity="error",
                code="NO_CIRCUIT_INSTANTIATED",
                message="No QuantumCircuit instance was created in the source code.",
                suggestion="Instantiate a circuit with 'qc = QuantumCircuit(qubits, classical_bits)'.",
            )
        )
        return None, diagnostics

    circuit_ir = CircuitIR(
        schemaVersion="1.0",
        qubits=num_qubits,
        classicalBits=num_clbits,
        operations=operations,
    )
    return circuit_ir, diagnostics


def _process_qiskit_method_call(
    method: str, args: List[ast.AST], op_idx: int, max_qubits: int, max_clbits: int
) -> Optional[Any]:
    """Maps a Qiskit method invocation to one or more CircuitOperations."""
    # 1. Measurement
    if method == "measure":
        if len(args) != 2:
            raise ValueError(f"measure requires 2 arguments (qubits, clbits), got {len(args)}")
        q_targets = _extract_int_or_list(args[0])
        c_targets = _extract_int_or_list(args[1])
        if len(q_targets) != len(c_targets):
            raise ValueError(f"measure target count ({len(q_targets)}) != classical bit count ({len(c_targets)})")
        ops = []
        for i, (q, c) in enumerate(zip(q_targets, c_targets)):
            ops.append(
                CircuitOperation(
                    id=f"op_{op_idx}_{i}",
                    type="MEASURE",
                    gate="MEASURE",
                    targets=[q],
                    classicalTargets=[c],
                )
            )
        return ops

    if method == "measure_all":
        ops = []
        for q in range(max_qubits):
            ops.append(
                CircuitOperation(
                    id=f"op_{op_idx}_{q}",
                    type="MEASURE",
                    gate="MEASURE",
                    targets=[q],
                    classicalTargets=[q],
                )
            )
        return ops

    # 2. Reset
    if method == "reset":
        if len(args) != 1:
            raise ValueError(f"reset requires 1 argument (qubit), got {len(args)}")
        q_targets = _extract_int_or_list(args[0])
        return [
            CircuitOperation(
                id=f"op_{op_idx}_{i}",
                type="RESET",
                gate="RESET",
                targets=[q],
            )
            for i, q in enumerate(q_targets)
        ]

    # 3. Barrier
    if method == "barrier":
        if not args:
            targets = list(range(max_qubits))
        else:
            targets = []
            for a in args:
                targets.extend(_extract_int_or_list(a))
        return CircuitOperation(
            id=f"op_{op_idx}",
            type="BARRIER",
            gate="BARRIER",
            targets=targets,
        )

    # 4. Standard Gates
    upper_name = method.upper()
    # Normalize aliases
    if upper_name == "CNOT":
        upper_name = "CX"
    elif upper_name == "TOFFOLI":
        upper_name = "CCX"
    elif upper_name == "FREDKIN":
        upper_name = "CSWAP"

    gate_def = get_gate_definition(upper_name)
    if not gate_def:
        raise ValueError(f"Unsupported Qiskit gate method: '{method}'")

    n_params = gate_def.parameters
    n_controls = gate_def.controls
    n_targets = gate_def.targets

    if len(args) != (n_params + n_controls + n_targets):
        raise ValueError(
            f"Gate '{upper_name}' expects {n_params + n_controls + n_targets} arguments ({n_params} params, {n_controls} controls, {n_targets} targets), got {len(args)}"
        )

    # Evaluate parameters first
    params = []
    for p_arg in args[:n_params]:
        params.append(_eval_ast_math(p_arg))

    # Evaluate qubit operands
    qubit_args = args[n_params:]
    qubits = []
    for q_arg in qubit_args:
        qubits.extend(_extract_int_or_list(q_arg))

    controls = qubits[:n_controls]
    targets = qubits[n_controls:]

    return CircuitOperation(
        id=f"op_{op_idx:03d}",
        type="GATE",
        gate=gate_def.name,
        targets=targets,
        controls=controls,
        params=params,
    )
