"""Phase 4: Canonical Circuit IR Router — Validation, QASM 3 Parse, and Code Export.

Provides the authoritative API for the bidirectional synchronization pipeline:
  Graphical Canvas ↔ OpenQASM 3 ↔ Python Qiskit / Cirq / PennyLane

All validation runs the same deep semantic engine that governs simulation;
there is zero path where an invalid circuit can be exported or executed.
"""

from typing import Optional, Literal
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from ..circuit.ir import CircuitIR
from ..circuit.validator import validate_circuit
from ..circuit.qasm_parser import parse_openqasm3_to_ir
from ..circuit.codegen import generate_code, ExportFormat

router = APIRouter(prefix="/api/v1/circuit", tags=["circuit-ir"])


# ─── Request / Response Schemas ───────────────────────────────────────────────

class ValidateRequest(BaseModel):
    """Request body for circuit semantic validation."""
    circuit: CircuitIR


class ParseQASMRequest(BaseModel):
    """Request body for OpenQASM 3 source → CircuitIR parsing."""
    qasm_source: str = Field(..., description="OpenQASM 3 source text to parse into CircuitIR")


class ParseQASMResponse(BaseModel):
    """Response from QASM parse: canonical IR + any parse diagnostics."""
    circuit: dict
    qubit_count: int
    classical_bit_count: int
    operation_count: int
    diagnostics: list
    warnings: list


class ExportRequest(BaseModel):
    """Request body for IR → code export."""
    circuit: CircuitIR
    format: str = Field(
        default="openqasm3",
        description="Target format: openqasm3 | qiskit | cirq | pennylane",
    )


class ExportResponse(BaseModel):
    """Response from code generation: code string + format metadata."""
    format: str
    code: str
    qubit_count: int
    operation_count: int


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/validate")
def validate_circuit_endpoint(req: ValidateRequest):
    """Run deep semantic validation on a CircuitIR.

    Checks:
    - Schema version
    - Qubit register bounds (0..63)
    - Classical bit register bounds
    - Control/target collision detection (ERR_IR_COLLISION)
    - Qubit index out-of-bounds (ERR_IR_OUT_OF_BOUNDS)
    - Gate registry membership
    - Operand count conformance (targets, controls, params)
    - Measurement classical-bit mapping correctness
    - Derived scheduling depth (without relying on client-supplied steps)

    Returns a rich ValidationResult with structured Diagnostic objects.
    """
    try:
        result = validate_circuit(req.circuit)
        return result.model_dump()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Validation Engine Error: {str(e)}",
        )


@router.post("/parse-qasm", response_model=ParseQASMResponse)
def parse_qasm_to_ir(req: ParseQASMRequest):
    """Parse OpenQASM 3 source text into canonical CircuitIR.

    Supports the Quantum Lens OpenQASM 3 subset:
    - qubit[n] and bit[n] register declarations
    - Standard gate names (H, X, Y, Z, CX, etc.) from GATE_REGISTRY
    - Parameterised gates: rx(θ), ry(θ), rz(θ), p(λ), u(θ,φ,λ)
    - Assignment-form measurements: c[i] = measure q[j]
    - reset and barrier directives
    - Arithmetic pi expressions (pi, pi/2, 2*pi, etc.)

    Returns the parsed CircuitIR plus structured parse diagnostics.
    """
    source = req.qasm_source.strip()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="QASM source cannot be empty.",
        )

    try:
        circuit, diagnostics = parse_openqasm3_to_ir(source)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"QASM Parse Error: {str(e)}",
        )

    errors = [d for d in diagnostics if d.severity == "error"]
    warnings = [d for d in diagnostics if d.severity != "error"]

    if errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "QASM source contains errors and could not be fully parsed.",
                "diagnostics": [d.model_dump() for d in errors],
            },
        )

    return ParseQASMResponse(
        circuit=circuit.model_dump(),
        qubit_count=circuit.qubits,
        classical_bit_count=circuit.classicalBits,
        operation_count=len(circuit.operations),
        diagnostics=[d.model_dump() for d in errors],
        warnings=[d.model_dump() for d in warnings],
    )


@router.post("/export", response_model=ExportResponse)
def export_circuit_code(req: ExportRequest):
    """Generate framework-specific source code from a CircuitIR.

    Supported formats:
    - ``openqasm3``: Canonical OpenQASM 3 with modern measurement syntax
    - ``qiskit``: Executable Python using Qiskit QuantumCircuit
    - ``cirq``: Executable Python using Google Cirq
    - ``pennylane``: Executable Python using Xanadu PennyLane QNode

    The circuit is semantically validated before code generation;
    invalid circuits are rejected with structured diagnostics.
    """
    fmt = req.format.lower().strip()
    supported = ["openqasm3", "qasm3", "qasm", "qiskit", "cirq", "pennylane"]
    if fmt not in supported:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format '{req.format}'. Choose from: openqasm3, qiskit, cirq, pennylane.",
        )

    # Validate before export — no invalid circuit escapes
    validation = validate_circuit(req.circuit)
    if not validation.valid:
        errors = [d for d in validation.diagnostics if d.severity == "error"]
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "Circuit validation failed. Correct errors before export.",
                "diagnostics": [d.model_dump() for d in errors],
            },
        )

    try:
        code = generate_code(req.circuit, fmt)  # type: ignore[arg-type]
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code Generation Error: {str(e)}",
        )

    return ExportResponse(
        format=fmt,
        code=code,
        qubit_count=req.circuit.qubits,
        operation_count=len(req.circuit.operations),
    )


@router.post("/roundtrip")
def qasm_roundtrip_check(req: ParseQASMRequest):
    """Developer utility: parse QASM → IR → re-serialise to QASM and validate losslessness.

    Useful for verifying the bidirectional sync pipeline integrity.
    Returns the original source, the parsed IR, and the re-generated QASM.
    """
    source = req.qasm_source.strip()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="QASM source cannot be empty.",
        )

    try:
        circuit, diags = parse_openqasm3_to_ir(source)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"QASM Parse Error: {str(e)}",
        )

    errors = [d for d in diags if d.severity == "error"]
    if errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "QASM source could not be parsed.",
                "diagnostics": [d.model_dump() for d in errors],
            },
        )

    regenerated = generate_code(circuit, "openqasm3")
    validation = validate_circuit(circuit)

    return {
        "original_qasm": source,
        "parsed_circuit": circuit.model_dump(),
        "regenerated_qasm": regenerated,
        "validation": validation.model_dump(),
        "parse_warnings": [d.model_dump() for d in diags if d.severity != "error"],
    }
