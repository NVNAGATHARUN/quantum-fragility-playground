"""Circuit IR Validator Bridge for Quantum Lens AI.

Bridges existing validation calls to the canonical deep compiler validator in app.circuit.validator.
"""

from typing import Tuple, Optional
from ..models.circuit_ir import CircuitIR
from ..circuit.validator import validate_circuit


def validate_circuit_ir(circuit: CircuitIR) -> Tuple[bool, Optional[str]]:
    """Validates a CircuitIR instance, returning legacy (bool, error_string) tuple."""
    result = validate_circuit(circuit)
    if result.valid:
        return True, None

    # Map compiler diagnostic code to legacy error string for backwards compatibility
    error_diag = next((d for d in result.diagnostics if d.severity == "error"), None)
    if not error_diag:
        return True, None

    code_map = {
        "CONTROL_TARGET_COLLISION": "ERR_IR_COLLISION",
        "QUBIT_INDEX_OUT_OF_BOUNDS": "ERR_IR_OUT_OF_BOUNDS",
        "PARAM_COUNT_MISMATCH": "ERR_IR_MISSING_PARAM",
        "UNSUPPORTED_GATE": "ERR_IR_INVALID_GATE",
        "TARGET_COUNT_MISMATCH": "ERR_IR_INVALID_TOPOLOGY",
        "CONTROL_COUNT_MISMATCH": "ERR_IR_INVALID_TOPOLOGY",
        "INVALID_QUBIT_COUNT": "ERR_IR_QUBIT_COUNT",
    }
    legacy_prefix = code_map.get(error_diag.code, error_diag.code)
    return False, f"{legacy_prefix}: {error_diag.message}"
