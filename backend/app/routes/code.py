"""Code Compilation, Validation and Multi-Framework Export Router.

Provides endpoints for OpenQASM 3 and Safe Qiskit compilation, validation with
structured Monaco diagnostics, and multi-framework code export.
"""

from typing import Literal, Optional, List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from ..circuit.ir import CircuitIR
from ..circuit.diagnostics import Diagnostic, ValidationResult
from ..circuit.validator import validate_circuit
from ..circuit.hash import calculate_circuit_hash
from ..circuit.qasm_parser import parse_openqasm3_to_ir
from ..circuit.safe_qiskit_parser import parse_safe_qiskit_to_ir
from ..circuit.codegen import generate_code, ExportFormat


router = APIRouter(prefix="/api/v1/code", tags=["code"])


class CodeValidateRequest(BaseModel):
    language: Literal["openqasm3", "qasm", "qasm3", "qiskit", "python"]
    source: str


class CodeValidateResponse(BaseModel):
    valid: bool
    diagnostics: List[Diagnostic]


class CodeCompileRequest(BaseModel):
    language: Literal["openqasm3", "qasm", "qasm3", "qiskit", "python"]
    source: str


class CodeCompileResponse(BaseModel):
    valid: bool
    circuit: Optional[CircuitIR] = None
    circuitHash: Optional[str] = None
    diagnostics: List[Diagnostic]


class CodeExportRequest(BaseModel):
    circuit: CircuitIR
    format: ExportFormat


class CodeExportResponse(BaseModel):
    format: str
    code: str


@router.post("/validate", response_model=CodeValidateResponse)
def validate_code(req: CodeValidateRequest):
    """Validates OpenQASM 3 or Qiskit source code and returns structured compiler diagnostics."""
    lang = req.language.lower()
    source = req.source

    if lang in ("openqasm3", "qasm", "qasm3"):
        ir, diags = parse_openqasm3_to_ir(source)
    elif lang in ("qiskit", "python"):
        ir, diags = parse_safe_qiskit_to_ir(source)
    else:
        return CodeValidateResponse(
            valid=False,
            diagnostics=[
                Diagnostic(
                    severity="error",
                    code="UNSUPPORTED_LANGUAGE",
                    message=f"Language '{req.language}' is not supported. Use 'openqasm3' or 'qiskit'.",
                )
            ],
        )

    if ir is not None:
        val_res = validate_circuit(ir)
        diags.extend(val_res.diagnostics)

    has_errors = any(d.severity == "error" for d in diags)
    return CodeValidateResponse(valid=not has_errors, diagnostics=diags)


@router.post("/compile", response_model=CodeCompileResponse)
def compile_code(req: CodeCompileRequest):
    """Compiles OpenQASM 3 or Qiskit source code into canonical CircuitIR with server-computed hash."""
    lang = req.language.lower()
    source = req.source

    if lang in ("openqasm3", "qasm", "qasm3"):
        ir, diags = parse_openqasm3_to_ir(source)
    elif lang in ("qiskit", "python"):
        ir, diags = parse_safe_qiskit_to_ir(source)
    else:
        return CodeCompileResponse(
            valid=False,
            circuit=None,
            circuitHash=None,
            diagnostics=[
                Diagnostic(
                    severity="error",
                    code="UNSUPPORTED_LANGUAGE",
                    message=f"Language '{req.language}' is not supported.",
                )
            ],
        )

    if ir is None:
        return CodeCompileResponse(
            valid=False,
            circuit=None,
            circuitHash=None,
            diagnostics=diags,
        )

    # Perform deep semantic validation on compiled IR
    val_res = validate_circuit(ir)
    all_diags = list(diags) + list(val_res.diagnostics)
    has_errors = any(d.severity == "error" for d in all_diags)

    if has_errors:
        return CodeCompileResponse(
            valid=False,
            circuit=ir,
            circuitHash=None,
            diagnostics=all_diags,
        )

    circuit_hash = calculate_circuit_hash(ir)
    return CodeCompileResponse(
        valid=True,
        circuit=ir,
        circuitHash=circuit_hash,
        diagnostics=all_diags,
    )


@router.post("/export", response_model=CodeExportResponse)
def export_code(req: CodeExportRequest):
    """Exports CircuitIR to target framework code (openqasm3, qiskit, cirq, pennylane)."""
    try:
        code = generate_code(req.circuit, req.format)
        return CodeExportResponse(format=req.format, code=code)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Export failed: {str(e)}",
        )
