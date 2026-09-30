"""Quantum Framework & System Capabilities Probing Engine.

Performs dynamic environment detection and real startup self-tests.
Does NOT assume package installation equals operational availability.
"""

from typing import Dict, Any, Optional
import os
import importlib.util
import importlib.metadata
from pydantic import BaseModel


class FrameworkCapability(BaseModel):
    id: str
    name: str
    installed: bool
    version: Optional[str] = None
    configured: bool
    selfTestPassed: bool
    reachable: Optional[bool] = None  # null for purely local frameworks
    status: str  # "available" | "partially_available" | "unavailable"
    reason: Optional[str] = None


class SystemCapabilitiesResponse(BaseModel):
    api: Dict[str, Any]
    overallSimulationStatus: str  # "available" | "partially_available" | "unavailable"
    frameworks: Dict[str, FrameworkCapability]


def _test_qiskit_aer() -> FrameworkCapability:
    """Self-test Qiskit Aer: instantiates simulator and executes trivial 1-qubit circuit."""
    try:
        spec = importlib.util.find_spec("qiskit_aer")
        if spec is None:
            return FrameworkCapability(
                id="qiskit_aer",
                name="Qiskit Aer",
                installed=False,
                configured=False,
                selfTestPassed=False,
                reachable=None,
                status="unavailable",
                reason="Package 'qiskit_aer' is not installed.",
            )

        import qiskit_aer
        from qiskit import QuantumCircuit, transpile
        from qiskit_aer import AerSimulator

        version = getattr(qiskit_aer, "__version__", None)
        if not version:
            try:
                version = importlib.metadata.version("qiskit-aer")
            except Exception:
                version = "unknown"

        # Startup self-test: 1-qubit X gate, measure
        qc = QuantumCircuit(1, 1)
        qc.x(0)
        qc.measure(0, 0)

        sim = AerSimulator()
        compiled = transpile(qc, sim)
        job = sim.run(compiled, shots=16)
        counts = job.result().get_counts()

        # If X gate produced |1>, self-test passed
        if counts.get("1") == 16:
            return FrameworkCapability(
                id="qiskit_aer",
                name="Qiskit Aer",
                installed=True,
                version=version,
                configured=True,
                selfTestPassed=True,
                reachable=None,
                status="available",
                reason=None,
            )
        else:
            return FrameworkCapability(
                id="qiskit_aer",
                name="Qiskit Aer",
                installed=True,
                version=version,
                configured=True,
                selfTestPassed=False,
                reachable=None,
                status="partially_available",
                reason=f"Self-test returned unexpected counts: {counts}",
            )
    except Exception as e:
        return FrameworkCapability(
            id="qiskit_aer",
            name="Qiskit Aer",
            installed=True,
            version=None,
            configured=False,
            selfTestPassed=False,
            reachable=None,
            status="unavailable",
            reason=f"Qiskit Aer self-test failed: {str(e)}",
        )


def _test_pennylane() -> FrameworkCapability:
    """Self-test PennyLane: checks package and default.qubit execution."""
    try:
        spec = importlib.util.find_spec("pennylane")
        if spec is None:
            return FrameworkCapability(
                id="pennylane",
                name="PennyLane",
                installed=False,
                configured=False,
                selfTestPassed=False,
                reachable=None,
                status="unavailable",
                reason="Package 'pennylane' is not installed in runtime environment.",
            )

        import pennylane as qml
        version = getattr(qml, "__version__", "unknown")

        dev = qml.device("default.qubit", wires=1)

        @qml.qnode(dev)
        def circuit():
            qml.PauliX(wires=0)
            return qml.probs(wires=0)

        probs = circuit()
        if abs(probs[1] - 1.0) < 1e-5:
            return FrameworkCapability(
                id="pennylane",
                name="PennyLane",
                installed=True,
                version=version,
                configured=True,
                selfTestPassed=True,
                reachable=None,
                status="available",
                reason=None,
            )
        else:
            return FrameworkCapability(
                id="pennylane",
                name="PennyLane",
                installed=True,
                version=version,
                configured=True,
                selfTestPassed=False,
                reachable=None,
                status="partially_available",
                reason="PennyLane default.qubit self-test returned unexpected probability.",
            )
    except Exception as e:
        return FrameworkCapability(
            id="pennylane",
            name="PennyLane",
            installed=True,
            version=None,
            configured=False,
            selfTestPassed=False,
            reachable=None,
            status="unavailable",
            reason=f"PennyLane self-test failed: {str(e)}",
        )


def _test_cirq() -> FrameworkCapability:
    """Self-test Cirq: checks package and Simulator execution."""
    try:
        spec = importlib.util.find_spec("cirq")
        if spec is None:
            return FrameworkCapability(
                id="cirq",
                name="Cirq",
                installed=False,
                configured=False,
                selfTestPassed=False,
                reachable=None,
                status="unavailable",
                reason="Package 'cirq' is not installed in runtime environment.",
            )

        import cirq
        version = getattr(cirq, "__version__", "unknown")

        q = cirq.LineQubit(0)
        c = cirq.Circuit(cirq.X(q), cirq.measure(q, key="m"))
        sim = cirq.Simulator()
        result = sim.run(c, repetitions=16)
        measurements = result.measurements["m"]

        if all(m[0] == 1 for m in measurements):
            return FrameworkCapability(
                id="cirq",
                name="Cirq",
                installed=True,
                version=version,
                configured=True,
                selfTestPassed=True,
                reachable=None,
                status="available",
                reason=None,
            )
        else:
            return FrameworkCapability(
                id="cirq",
                name="Cirq",
                installed=True,
                version=version,
                configured=True,
                selfTestPassed=False,
                reachable=None,
                status="partially_available",
                reason="Cirq Simulator self-test returned unexpected measurement results.",
            )
    except Exception as e:
        return FrameworkCapability(
            id="cirq",
            name="Cirq",
            installed=True,
            version=None,
            configured=False,
            selfTestPassed=False,
            reachable=None,
            status="unavailable",
            reason=f"Cirq self-test failed: {str(e)}",
        )


def _test_qbraid() -> FrameworkCapability:
    """Dynamically tests qBraid availability and transpiler execution."""
    try:
        spec = importlib.util.find_spec("qbraid")
        if spec is None:
            return FrameworkCapability(
                id="qbraid",
                name="qBraid Platform",
                installed=False,
                configured=False,
                selfTestPassed=False,
                reachable=False,
                status="unavailable",
                reason="Package 'qbraid' is not installed.",
            )

        import qbraid
        from qiskit import QuantumCircuit

        version = getattr(qbraid, "__version__", "unknown")

        # Operational self-test: transpile 1-qubit circuit via qBraid conversion graph
        qc = QuantumCircuit(1)
        qc.x(0)
        cirq_circ = qbraid.transpile(qc, "cirq")

        if cirq_circ is not None:
            api_key = os.environ.get("QBRAID_API_KEY")
            cloud_status = "Cloud QPU enabled" if api_key else "Hybrid Transpiler Active (Set QBRAID_API_KEY for cloud devices)"
            return FrameworkCapability(
                id="qbraid",
                name="qBraid Platform",
                installed=True,
                version=version,
                configured=True,
                selfTestPassed=True,
                reachable=bool(api_key),
                status="available",
                reason=f"qBraid Unified Transpiler verified operational. {cloud_status}",
            )
        else:
            return FrameworkCapability(
                id="qbraid",
                name="qBraid Platform",
                installed=True,
                version=version,
                configured=False,
                selfTestPassed=False,
                reachable=False,
                status="partially_available",
                reason="qBraid self-test returned empty circuit.",
            )
    except Exception as e:
        return FrameworkCapability(
            id="qbraid",
            name="qBraid Platform",
            installed=True,
            version=getattr(qbraid, "__version__", None) if "qbraid" in locals() else None,
            configured=False,
            selfTestPassed=False,
            reachable=False,
            status="unavailable",
            reason=f"qBraid probe error: {str(e)}",
        )


def probe_system_capabilities() -> SystemCapabilitiesResponse:
    """Probes all quantum simulation frameworks with real self-tests."""
    qiskit_cap = _test_qiskit_aer()
    pennylane_cap = _test_pennylane()
    cirq_cap = _test_cirq()
    qbraid_cap = _test_qbraid()

    frameworks = {
        "qiskit_aer": qiskit_cap,
        "pennylane": pennylane_cap,
        "cirq": cirq_cap,
        "qbraid": qbraid_cap,
    }

    # Overall simulation status
    if qiskit_cap.status == "available":
        overall = "available"
    elif any(f.status == "available" for f in frameworks.values()):
        overall = "partially_available"
    else:
        overall = "unavailable"

    return SystemCapabilitiesResponse(
        api={
            "status": "online",
            "version": "3.0.0",
            "engine": "FastAPI",
        },
        overallSimulationStatus=overall,
        frameworks=frameworks,
    )
