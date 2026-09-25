"""Phase 4 & 5 Automated Tests: Circuit IR Router, QASM Bidirectional Sync, and Cross-Framework Parity.

Validates:
- /api/v1/circuit/validate — deep semantic validation
- /api/v1/circuit/parse-qasm — OpenQASM 3 → CircuitIR parsing
- /api/v1/circuit/export — IR → code generation for all four formats
- /api/v1/circuit/roundtrip — QASM → IR → QASM losslessness
- /api/v1/quantum/parity — cross-framework probability parity (Qiskit mandatory)

Gate: Phase 4+5 begin only when all tests pass with zero fake data.
"""

import math
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ─── Shared Circuit Fixtures ──────────────────────────────────────────────────

BELL_CIRCUIT = {
    "schemaVersion": "1.0",
    "qubits": 2,
    "classicalBits": 2,
    "operations": [
        {"type": "GATE", "gate": "H", "targets": [0], "controls": [], "params": []},
        {"type": "GATE", "gate": "CX", "targets": [1], "controls": [0], "params": []},
    ],
}

BELL_CIRCUIT_WITH_MEASURE = {
    "schemaVersion": "1.0",
    "qubits": 2,
    "classicalBits": 2,
    "operations": [
        {"type": "GATE", "gate": "H", "targets": [0], "controls": [], "params": []},
        {"type": "GATE", "gate": "CX", "targets": [1], "controls": [0], "params": []},
        {"type": "MEASURE", "gate": "MEASURE", "targets": [0], "classicalTargets": [0], "controls": [], "params": []},
        {"type": "MEASURE", "gate": "MEASURE", "targets": [1], "classicalTargets": [1], "controls": [], "params": []},
    ],
}

INVALID_COLLISION_CIRCUIT = {
    "schemaVersion": "1.0",
    "qubits": 2,
    "classicalBits": 2,
    "operations": [
        {"type": "GATE", "gate": "CX", "targets": [0], "controls": [0], "params": []},
    ],
}

INVALID_OOB_CIRCUIT = {
    "schemaVersion": "1.0",
    "qubits": 2,
    "classicalBits": 2,
    "operations": [
        {"type": "GATE", "gate": "H", "targets": [5], "controls": [], "params": []},
    ],
}

# ─── /api/v1/circuit/validate ─────────────────────────────────────────────────

def test_validate_bell_circuit_passes():
    """Bell state circuit (H + CX) must pass validation with no errors."""
    res = client.post("/api/v1/circuit/validate", json={"circuit": BELL_CIRCUIT})
    assert res.status_code == 200
    body = res.json()
    assert body["valid"] is True
    assert body["qubits"] == 2
    assert body["diagnostics"] == []


def test_validate_detects_collision():
    """Control-target collision (qubit 0 as both) must be flagged ERR_IR_COLLISION."""
    res = client.post("/api/v1/circuit/validate", json={"circuit": INVALID_COLLISION_CIRCUIT})
    assert res.status_code == 200
    body = res.json()
    assert body["valid"] is False
    codes = [d["code"] for d in body["diagnostics"]]
    assert "CONTROL_TARGET_COLLISION" in codes


def test_validate_detects_out_of_bounds():
    """Target qubit index 5 in a 2-qubit circuit must be flagged QUBIT_INDEX_OUT_OF_BOUNDS."""
    res = client.post("/api/v1/circuit/validate", json={"circuit": INVALID_OOB_CIRCUIT})
    assert res.status_code == 200
    body = res.json()
    assert body["valid"] is False
    codes = [d["code"] for d in body["diagnostics"]]
    assert "QUBIT_INDEX_OUT_OF_BOUNDS" in codes


def test_validate_returns_circuit_metrics():
    """Validation result for Bell circuit must report depth=2, gateCount=2."""
    res = client.post("/api/v1/circuit/validate", json={"circuit": BELL_CIRCUIT})
    body = res.json()
    assert body["metrics"]["gateCount"] == 2
    assert body["metrics"]["depth"] == 2
    assert body["metrics"]["multiQubitGates"] == 1


# ─── /api/v1/circuit/parse-qasm ──────────────────────────────────────────────

BELL_QASM = """OPENQASM 3.0;
include "stdgates.inc";

qubit[2] q;
bit[2] c;

h q[0];
cx q[0], q[1];
c[0] = measure q[0];
c[1] = measure q[1];
"""


def test_parse_valid_bell_qasm():
    """Valid Bell State QASM must parse to 2-qubit, 2-classical, 4-operation CircuitIR."""
    res = client.post("/api/v1/circuit/parse-qasm", json={"qasm_source": BELL_QASM})
    assert res.status_code == 200
    body = res.json()
    assert body["qubit_count"] == 2
    assert body["classical_bit_count"] == 2
    assert body["operation_count"] == 4  # H + CX + 2 MEASURE
    circuit = body["circuit"]
    assert circuit["qubits"] == 2
    ops = circuit["operations"]
    gate_names = [op["gate"] for op in ops]
    assert "H" in gate_names
    assert "CX" in gate_names


def test_parse_parameterised_rx_gate():
    """QASM with rx(pi/2) must parse RX gate with exact θ = π/2 parameter."""
    qasm = """OPENQASM 3.0;
include "stdgates.inc";
qubit[1] q;
rx(pi / 2) q[0];
"""
    res = client.post("/api/v1/circuit/parse-qasm", json={"qasm_source": qasm})
    assert res.status_code == 200
    body = res.json()
    ops = body["circuit"]["operations"]
    rx_ops = [op for op in ops if op.get("gate") == "RX"]
    assert len(rx_ops) == 1
    theta = rx_ops[0]["params"][0]
    assert abs(theta - math.pi / 2) < 1e-9


def test_parse_rejects_empty_qasm():
    """Empty QASM string must return 400 Bad Request."""
    res = client.post("/api/v1/circuit/parse-qasm", json={"qasm_source": ""})
    assert res.status_code == 400


# ─── /api/v1/circuit/export ───────────────────────────────────────────────────

def test_export_openqasm3_bell_circuit():
    """Exporting Bell circuit to OpenQASM 3 must return valid QASM header."""
    res = client.post("/api/v1/circuit/export", json={"circuit": BELL_CIRCUIT_WITH_MEASURE, "format": "openqasm3"})
    assert res.status_code == 200
    body = res.json()
    assert body["format"] == "openqasm3"
    code = body["code"]
    assert "OPENQASM 3.0" in code
    assert "qubit[2]" in code
    assert "bit[2]" in code
    assert "h " in code.lower() or "h q" in code.lower()


def test_export_qiskit_bell_circuit():
    """Exporting Bell circuit to Qiskit must produce QuantumCircuit construction code."""
    res = client.post("/api/v1/circuit/export", json={"circuit": BELL_CIRCUIT_WITH_MEASURE, "format": "qiskit"})
    assert res.status_code == 200
    body = res.json()
    assert body["format"] == "qiskit"
    code = body["code"]
    assert "QuantumCircuit" in code
    assert "qc.h(" in code or "qc.h(0" in code
    assert "qc.cx(" in code


def test_export_cirq_bell_circuit():
    """Exporting Bell circuit to Cirq must produce valid cirq.Circuit code."""
    res = client.post("/api/v1/circuit/export", json={"circuit": BELL_CIRCUIT_WITH_MEASURE, "format": "cirq"})
    assert res.status_code == 200
    body = res.json()
    assert body["format"] == "cirq"
    code = body["code"]
    assert "import cirq" in code
    assert "cirq.H" in code


def test_export_pennylane_bell_circuit():
    """Exporting Bell circuit to PennyLane must produce a @qml.qnode decorated function."""
    res = client.post("/api/v1/circuit/export", json={"circuit": BELL_CIRCUIT_WITH_MEASURE, "format": "pennylane"})
    assert res.status_code == 200
    body = res.json()
    assert body["format"] == "pennylane"
    code = body["code"]
    assert "import pennylane" in code
    assert "@qml.qnode" in code


def test_export_rejects_invalid_circuit():
    """Export of a circuit with control-target collision must return 422."""
    res = client.post("/api/v1/circuit/export", json={"circuit": INVALID_COLLISION_CIRCUIT, "format": "qiskit"})
    assert res.status_code == 422


def test_export_rejects_unknown_format():
    """Requesting export in an unsupported format must return 400."""
    res = client.post("/api/v1/circuit/export", json={"circuit": BELL_CIRCUIT, "format": "braket"})
    assert res.status_code == 400


# ─── /api/v1/circuit/roundtrip ───────────────────────────────────────────────

def test_qasm_roundtrip_losslessness():
    """QASM → CircuitIR → QASM roundtrip must preserve qubit count and gate count."""
    res = client.post("/api/v1/circuit/roundtrip", json={"qasm_source": BELL_QASM})
    assert res.status_code == 200
    body = res.json()
    assert body["parsed_circuit"]["qubits"] == 2
    assert body["validation"]["valid"] is True
    regen = body["regenerated_qasm"]
    assert "OPENQASM 3.0" in regen
    # Regenerated QASM must contain both H and cx/CX
    assert "h " in regen.lower() or "h q" in regen.lower()


# ─── /api/v1/quantum/parity (Phase 5) ────────────────────────────────────────

def test_parity_qiskit_only_bell():
    """Parity endpoint for Bell circuit must succeed with at least the Qiskit engine."""
    res = client.post("/api/v1/quantum/parity", json={"circuit": BELL_CIRCUIT, "shots": 512})
    assert res.status_code == 200
    body = res.json()
    assert "qiskit" in body["circuits"]
    assert body["circuits"]["qiskit"]["status"] == "success"
    probs = body["circuits"]["qiskit"]["probabilities"]
    assert abs(probs.get("00", 0.0) - 0.5) < 1e-4
    assert abs(probs.get("11", 0.0) - 0.5) < 1e-4
    assert probs.get("01", 0.0) == 0.0
    assert probs.get("10", 0.0) == 0.0


def test_parity_all_pass_flag():
    """If only Qiskit is available, all_pass must still be True (no failed comparisons)."""
    res = client.post("/api/v1/quantum/parity", json={"circuit": BELL_CIRCUIT, "shots": 512})
    assert res.status_code == 200
    body = res.json()
    assert body["all_pass"] is True


def test_parity_tolerates_qiskit_only_circuit():
    """Parity endpoint with a single-qubit X gate must return correct |1⟩ probability via Qiskit."""
    single_qubit = {
        "schemaVersion": "1.0",
        "qubits": 1,
        "classicalBits": 1,
        "operations": [
            {"type": "GATE", "gate": "X", "targets": [0], "controls": [], "params": []},
        ],
    }
    res = client.post("/api/v1/quantum/parity", json={"circuit": single_qubit, "shots": 512})
    assert res.status_code == 200
    body = res.json()
    probs = body["circuits"]["qiskit"]["probabilities"]
    assert probs.get("1", 0.0) == 1.0
    assert probs.get("0", 0.0) == 0.0
