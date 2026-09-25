"""Deep Semantic Circuit Validator.

Validates topological correctness, register bounds, operand distinctness,
parameter counts, and derives scheduling depth without relying on client-supplied steps.
"""

from typing import List, Dict, Set
from .ir import CircuitIR, CircuitOperation, SUPPORTED_SCHEMA_VERSIONS
from .diagnostics import Diagnostic, ValidationResult, CircuitMetrics
from .gate_registry import GATE_REGISTRY, get_gate_definition
from .hash import calculate_circuit_hash


def derive_circuit_layout(circuit: CircuitIR) -> tuple[int, List[int]]:
    """Derives layer assignment per operation and total depth from wire dependency DAG.

    Independent gates on separate qubits share a layer.
    Overlapping gates advance the wire layer.
    Barrier gates align all affected qubits to max(current_wire_layers) + 1.
    """
    wire_layers = [0] * circuit.qubits
    op_layers = []

    for op in circuit.operations:
        affected = set(op.targets).union(set(op.controls))
        valid_affected = [q for q in affected if 0 <= q < circuit.qubits]

        if not valid_affected:
            op_layers.append(0)
            continue

        op_type = op.type.upper()
        if op_type in ("BARRIER", "DIRECTIVE"):
            barrier_layer = max(wire_layers[q] for q in valid_affected)
            op_layers.append(barrier_layer)
            for q in valid_affected:
                wire_layers[q] = barrier_layer + 1
        else:
            current_layer = max(wire_layers[q] for q in valid_affected)
            op_layers.append(current_layer)
            for q in valid_affected:
                wire_layers[q] = current_layer + 1

    total_depth = max(wire_layers) if wire_layers else 0
    return total_depth, op_layers


def validate_circuit(circuit: CircuitIR) -> ValidationResult:
    """Performs comprehensive semantic validation on a CircuitIR instance."""
    diagnostics: List[Diagnostic] = []

    # 1. Schema Version Check
    if circuit.schemaVersion not in SUPPORTED_SCHEMA_VERSIONS:
        diagnostics.append(
            Diagnostic(
                severity="error",
                code="UNSUPPORTED_SCHEMA_VERSION",
                message=f"Schema version '{circuit.schemaVersion}' is not supported.",
                suggestion=f"Supported schema versions are: {', '.join(SUPPORTED_SCHEMA_VERSIONS)}.",
            )
        )

    # 2. Register Bounds Check
    if circuit.qubits < 1 or circuit.qubits > 64:
        diagnostics.append(
            Diagnostic(
                severity="error",
                code="INVALID_QUBIT_COUNT",
                message=f"Circuit qubit count must be between 1 and 64, got {circuit.qubits}.",
                suggestion="Resize the qubit register to between 1 and 64 qubits.",
            )
        )

    if circuit.classicalBits < 0 or circuit.classicalBits > 64:
        diagnostics.append(
            Diagnostic(
                severity="error",
                code="INVALID_CLASSICAL_BIT_COUNT",
                message=f"Classical bit count must be between 0 and 64, got {circuit.classicalBits}.",
                suggestion="Set classical bit count to between 0 and 64.",
            )
        )

    gate_count = 0
    multi_qubit_count = 0
    measurement_count = 0

    # 3. Validate Individual Operations
    for idx, op in enumerate(circuit.operations):
        op_id = op.id or f"op_{idx}"
        op_type = op.type.upper()

        # Target out of bounds
        for t in op.targets:
            if t < 0 or t >= circuit.qubits:
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="QUBIT_INDEX_OUT_OF_BOUNDS",
                        message=f"Target qubit {t} is outside register (0 to {circuit.qubits - 1}).",
                        operationId=op_id,
                        qubit=t,
                        suggestion=f"Specify a target qubit index between 0 and {circuit.qubits - 1}.",
                    )
                )

        # Control out of bounds
        for c in op.controls:
            if c < 0 or c >= circuit.qubits:
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="QUBIT_INDEX_OUT_OF_BOUNDS",
                        message=f"Control qubit {c} is outside register (0 to {circuit.qubits - 1}).",
                        operationId=op_id,
                        qubit=c,
                        suggestion=f"Specify a control qubit index between 0 and {circuit.qubits - 1}.",
                    )
                )

        # Control-target collision check
        common = set(op.targets).intersection(set(op.controls))
        if common:
            colliding = sorted(list(common))
            diagnostics.append(
                Diagnostic(
                    severity="error",
                    code="CONTROL_TARGET_COLLISION",
                    message=f"Operation references qubit {colliding[0]} as both control and target.",
                    operationId=op_id,
                    qubit=colliding[0],
                    suggestion="Ensure control and target qubits are completely distinct.",
                )
            )

        # Duplicate targets check
        if len(op.targets) != len(set(op.targets)):
            diagnostics.append(
                Diagnostic(
                    severity="error",
                    code="DUPLICATE_TARGET_QUBITS",
                    message="Operation contains duplicate target qubits.",
                    operationId=op_id,
                    suggestion="Provide distinct target qubits.",
                )
            )

        # Duplicate controls check
        if len(op.controls) != len(set(op.controls)):
            diagnostics.append(
                Diagnostic(
                    severity="error",
                    code="DUPLICATE_CONTROL_QUBITS",
                    message="Operation contains duplicate control qubits.",
                    operationId=op_id,
                    suggestion="Provide distinct control qubits.",
                )
            )

        if op_type == "GATE":
            if not op.gate:
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="MISSING_GATE_NAME",
                        message="GATE operation missing 'gate' identifier.",
                        operationId=op_id,
                        suggestion="Specify a valid gate name from the Gate Registry.",
                    )
                )
                continue

            gate_def = get_gate_definition(op.gate)
            if not gate_def:
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="UNSUPPORTED_GATE",
                        message=f"Gate '{op.gate}' is not supported in the Quantum Lens registry.",
                        operationId=op_id,
                        suggestion=f"Available gates include: {', '.join(sorted(GATE_REGISTRY.keys()))}.",
                    )
                )
                continue

            gate_count += 1
            total_qubits_in_gate = len(op.targets) + len(op.controls)
            if total_qubits_in_gate > 1:
                multi_qubit_count += 1

            # Validate target count
            if gate_def.targets != -1 and len(op.targets) != gate_def.targets:
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="TARGET_COUNT_MISMATCH",
                        message=f"Gate '{gate_def.name}' requires exactly {gate_def.targets} target(s), got {len(op.targets)}.",
                        operationId=op_id,
                        suggestion=f"Provide {gate_def.targets} target qubit(s).",
                    )
                )

            # Validate control count
            if len(op.controls) != gate_def.controls:
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="CONTROL_COUNT_MISMATCH",
                        message=f"Gate '{gate_def.name}' requires exactly {gate_def.controls} control(s), got {len(op.controls)}.",
                        operationId=op_id,
                        suggestion=f"Provide {gate_def.controls} control qubit(s).",
                    )
                )

            # Validate parameter count
            if len(op.params) != gate_def.parameters:
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="PARAM_COUNT_MISMATCH",
                        message=f"Gate '{gate_def.name}' requires exactly {gate_def.parameters} parameter(s), got {len(op.params)}.",
                        operationId=op_id,
                        suggestion=f"Provide {gate_def.parameters} floating point parameter(s).",
                    )
                )

        elif op_type == "MEASURE":
            measurement_count += 1
            if not op.targets:
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="MEASURE_MISSING_TARGET",
                        message="MEASURE operation requires at least 1 target qubit.",
                        operationId=op_id,
                        suggestion="Specify the qubit being measured.",
                    )
                )

            for cb in op.classicalTargets:
                if cb < 0 or cb >= circuit.classicalBits:
                    diagnostics.append(
                        Diagnostic(
                            severity="error",
                            code="CLASSICAL_BIT_OUT_OF_BOUNDS",
                            message=f"Classical bit {cb} is outside register (0 to {circuit.classicalBits - 1}).",
                            operationId=op_id,
                            suggestion=f"Specify a classical bit between 0 and {circuit.classicalBits - 1}.",
                        )
                    )

            if len(op.targets) != len(op.classicalTargets):
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="MEASURE_TARGET_MISMATCH",
                        message=f"MEASURE target count ({len(op.targets)}) does not match classical bit count ({len(op.classicalTargets)}).",
                        operationId=op_id,
                        suggestion="Map each measured qubit to exactly one classical bit.",
                    )
                )

        elif op_type == "RESET":
            if len(op.targets) != 1:
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="RESET_TARGET_COUNT",
                        message=f"RESET operation requires exactly 1 target qubit, got {len(op.targets)}.",
                        operationId=op_id,
                        suggestion="Specify a single qubit to reset.",
                    )
                )
            if op.controls:
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="RESET_WITH_CONTROLS",
                        message="RESET cannot have control qubits.",
                        operationId=op_id,
                        suggestion="Remove control qubits from RESET operation.",
                    )
                )

        elif op_type in ("BARRIER", "DIRECTIVE"):
            if not op.targets:
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="BARRIER_MISSING_TARGETS",
                        message="BARRIER directive requires at least 1 target qubit.",
                        operationId=op_id,
                        suggestion="Specify the qubits across which the barrier is placed.",
                    )
                )

    has_errors = any(d.severity == "error" for d in diagnostics)
    valid = not has_errors

    derived_depth, _ = derive_circuit_layout(circuit)
    circuit_hash = calculate_circuit_hash(circuit) if valid else None

    metrics = CircuitMetrics(
        depth=derived_depth,
        gateCount=gate_count,
        multiQubitGates=multi_qubit_count,
        measurementCount=measurement_count,
    )

    return ValidationResult(
        valid=valid,
        diagnostics=diagnostics,
        circuitHash=circuit_hash,
        qubits=circuit.qubits,
        classicalBits=circuit.classicalBits,
        metrics=metrics,
    )
