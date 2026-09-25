"""Structured Diagnostics and Validation Results.

Provides rich compiler diagnostic feedback for Monaco Editor and Circuit Studio.
"""

from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field


DiagnosticSeverity = Literal["error", "warning", "info"]


class Diagnostic(BaseModel):
    severity: DiagnosticSeverity = Field(default="error", description="Diagnostic severity level")
    code: str = Field(..., description="Machine-readable diagnostic code")
    message: str = Field(..., description="Human-readable error description")
    line: Optional[int] = Field(default=None, description="Source line number (1-indexed) if applicable")
    column: Optional[int] = Field(default=None, description="Source column number (1-indexed) if applicable")
    operationId: Optional[str] = Field(default=None, description="Identifier of the offending CircuitOperation")
    qubit: Optional[int] = Field(default=None, description="Qubit index associated with the issue")
    suggestion: Optional[str] = Field(default=None, description="Actionable fix suggestion")


class CircuitMetrics(BaseModel):
    depth: int = 0
    gateCount: int = 0
    multiQubitGates: int = 0
    measurementCount: int = 0


class ValidationResult(BaseModel):
    valid: bool
    diagnostics: List[Diagnostic] = Field(default_factory=list)
    circuitHash: Optional[str] = None
    qubits: Optional[int] = None
    classicalBits: Optional[int] = None
    metrics: Optional[CircuitMetrics] = None
