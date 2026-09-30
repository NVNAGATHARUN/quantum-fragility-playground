"""Canonical Circuit IR v1.0 and Normalized Simulation Result Pydantic Models.

Single source of truth for all quantum data structures across Quantum Lens AI.
"""

from typing import List, Dict, Optional, Literal, Any, Union
from pydantic import BaseModel, Field

from ..circuit.ir import (
    CircuitIR,
    CircuitOperation,
    OperationType,
    SUPPORTED_SCHEMA_VERSIONS,
)

# Backwards-compatible alias for existing code
GateOperation = CircuitOperation

SupportedGate = Literal[
    "H", "X", "Y", "Z", "S", "T", "SDG", "TDG",
    "RX", "RY", "RZ", "P", "U", "CX", "CY", "CZ", "CH",
    "CRX", "CRY", "CRZ", "CP", "SWAP", "CCX", "CSWAP",
    "MEASURE", "RESET", "BARRIER"
]


class GateParams(BaseModel):
    theta: Optional[float] = None
    phi: Optional[float] = None
    lam: Optional[float] = None


# --- Simulation Output Models ---

class StateAmplitude(BaseModel):
    basis: str
    real: float
    imag: float
    magnitude: float
    phase: float
    probability: float


class BlochVector(BaseModel):
    x: float
    y: float
    z: float


class ReducedSubsystemState(BaseModel):
    qubit: int
    blochVector: BlochVector
    purity: float
    isEntangled: bool
    entropy: float


class TimelineStep(BaseModel):
    step: int
    gate: str
    targets: List[int]
    controls: List[int]
    stateSummary: str
    probabilities: Dict[str, float]


class SimulationMetrics(BaseModel):
    depth: int
    gateCount: int
    entanglementEntropy: float
    purity: float
    executionTimeMs: float


class NormalizedSimulationResult(BaseModel):
    circuitId: Optional[str] = None
    backend: str = "qiskit-aer"
    shots: int = 1024
    qubitCount: int = 2
    statevector: List[StateAmplitude]
    counts: Dict[str, int]
    probabilities: Dict[str, float]
    densityMatrix: Optional[List[List[Dict[str, float]]]] = None
    reducedStates: List[ReducedSubsystemState]
    timeline: List[TimelineStep] = Field(default_factory=list)
    metrics: SimulationMetrics


# --- API Request Models ---

class SimulateRequest(BaseModel):
    circuit: CircuitIR
    backend: Literal[
        "qiskit-aer", "ideal-statevector", "cirq", "pennylane", "qbraid", "qbraid-unified-transpiler", "qbraid-cloud-qpu"
    ] = "qiskit-aer"
    shots: int = Field(default=1024, ge=1, le=10000)


class FragilityRequest(BaseModel):
    circuit: CircuitIR
    t1_us: float = Field(default=50.0, ge=0.1, le=1000.0)
    t2_us: float = Field(default=70.0, ge=0.1, le=1000.0)
    gate_time_ns: float = Field(default=20.0, ge=1.0, le=500.0)
    channel: Literal["amplitude_damping", "phase_damping", "depolarizing", "combined"] = "amplitude_damping"
