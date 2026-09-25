"""Quantum Lens Canonical Circuit IR and Compiler Architecture.

Phase 4: Single source of truth for all quantum circuit representations,
parsing, validation, hashing, safe AST importing, and framework code generation.
"""

from .gate_registry import GATE_REGISTRY, GateDefinition, get_gate_definition
from .ir import (
    CircuitIR,
    CircuitOperation,
    OperationType,
    SUPPORTED_SCHEMA_VERSIONS,
)
from .diagnostics import Diagnostic, DiagnosticSeverity, ValidationResult
from .canonical import canonical_semantics, semantic_equal
from .hash import calculate_circuit_hash
from .validator import validate_circuit
from .qasm_parser import parse_openqasm3_to_ir
from .qasm_serializer import serialize_ir_to_openqasm3
from .safe_qiskit_parser import parse_safe_qiskit_to_ir
from .codegen import generate_code, ExportFormat

__all__ = [
    "GATE_REGISTRY",
    "GateDefinition",
    "get_gate_definition",
    "CircuitIR",
    "CircuitOperation",
    "OperationType",
    "SUPPORTED_SCHEMA_VERSIONS",
    "Diagnostic",
    "DiagnosticSeverity",
    "ValidationResult",
    "canonical_semantics",
    "semantic_equal",
    "calculate_circuit_hash",
    "validate_circuit",
    "parse_openqasm3_to_ir",
    "serialize_ir_to_openqasm3",
    "parse_safe_qiskit_to_ir",
    "generate_code",
    "ExportFormat",
]
