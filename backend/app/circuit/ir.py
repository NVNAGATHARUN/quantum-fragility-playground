"""Canonical Semantic Circuit IR v1.0.

Single authoritative representation of quantum circuits across Quantum Lens AI.
Separates canonical quantum semantics from display/editor layout metadata.
"""

from typing import List, Dict, Optional, Literal, Any, Union
from pydantic import BaseModel, Field, model_validator
from .gate_registry import get_gate_definition


SUPPORTED_SCHEMA_VERSIONS = ["1.0"]

OperationType = Literal["GATE", "DIRECTIVE", "MEASURE", "RESET", "BARRIER"]


class CircuitOperation(BaseModel):
    id: Optional[str] = Field(default=None, description="Non-semantic operation identifier")
    type: OperationType = Field(default="GATE", description="Operation classification")
    gate: Optional[str] = Field(default=None, description="Gate name from GATE_REGISTRY if type is GATE")
    targets: List[int] = Field(default_factory=list, description="Target qubit indices")
    controls: List[int] = Field(default_factory=list, description="Control qubit indices")
    params: List[float] = Field(default_factory=list, description="Ordered numerical parameters")
    classicalTargets: List[int] = Field(default_factory=list, description="Classical bit indices for MEASURE")
    ui: Optional[Dict[str, Any]] = Field(default=None, description="Editor layout metadata (e.g. column)")
    step: Optional[int] = Field(default=None, description="Legacy/visual step index (non-semantic)")

    @model_validator(mode="before")
    @classmethod
    def normalize_operation(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data

        # Normalize gate name if present
        gate_name = data.get("gate")
        if gate_name:
            data["gate"] = gate_name.strip().upper()

        # Deduce type if not explicitly given
        op_type = data.get("type")
        if not op_type:
            if gate_name == "MEASURE":
                data["type"] = "MEASURE"
            elif gate_name == "RESET":
                data["type"] = "RESET"
            elif gate_name == "BARRIER":
                data["type"] = "BARRIER"
            else:
                data["type"] = "GATE"
        else:
            data["type"] = str(op_type).upper()

        # Normalize params if given as dict, object, or GateParams (e.g. {"theta": 1.57})
        params_val = data.get("params")
        if isinstance(params_val, dict):
            # Extract ordered values from dict
            ordered = []
            if "theta" in params_val and params_val["theta"] is not None:
                ordered.append(float(params_val["theta"]))
            if "phi" in params_val and params_val["phi"] is not None:
                ordered.append(float(params_val["phi"]))
            if "lam" in params_val and params_val["lam"] is not None:
                ordered.append(float(params_val["lam"]))
            data["params"] = ordered
        elif hasattr(params_val, "theta"):
            ordered = []
            if getattr(params_val, "theta", None) is not None:
                ordered.append(float(params_val.theta))
            if getattr(params_val, "phi", None) is not None:
                ordered.append(float(params_val.phi))
            if getattr(params_val, "lam", None) is not None:
                ordered.append(float(params_val.lam))
            data["params"] = ordered
        elif params_val is None:
            data["params"] = []
        elif isinstance(params_val, list):
            data["params"] = [float(p) for p in params_val]

        # For MEASURE: if classicalTargets not set, default to targets[0]
        if data.get("type") == "MEASURE" and not data.get("classicalTargets"):
            targets = data.get("targets", [])
            if targets:
                data["classicalTargets"] = [targets[0]]

        return data


class CircuitIR(BaseModel):
    schemaVersion: str = Field(default="1.0", description="Schema specification version")
    qubits: int = Field(default=2, ge=1, le=64, description="Total qubits in register (1-64)")
    classicalBits: int = Field(default=2, ge=0, le=64, description="Total classical bits (0-64)")
    operations: List[CircuitOperation] = Field(default_factory=list, description="Ordered circuit operations")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Non-semantic metadata (title, author)")

    @model_validator(mode="before")
    @classmethod
    def normalize_circuit(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data

        # Support backward compatibility with "version" field
        if "version" in data and "schemaVersion" not in data:
            data["schemaVersion"] = data["version"]

        version = data.get("schemaVersion", "1.0")
        if version not in SUPPORTED_SCHEMA_VERSIONS:
            raise ValueError(
                f"Unsupported schemaVersion '{version}'. Supported versions are: {SUPPORTED_SCHEMA_VERSIONS}"
            )

        return data

    @property
    def version(self) -> str:
        return self.schemaVersion

    @version.setter
    def version(self, val: str):
        self.schemaVersion = val

