from app.circuit.ir import CircuitIR, CircuitOperation
from app.quantum.simulator import simulate_circuit


def test_intermediate_measurement_is_not_removed():
    circuit = CircuitIR(
        schemaVersion="1.0",
        qubits=1,
        classicalBits=1,
        operations=[
            CircuitOperation(gate="H", targets=[0], step=0),
            CircuitOperation(gate="MEASURE", targets=[0], step=1),
            CircuitOperation(gate="H", targets=[0], step=2),
        ],
    )
    result = simulate_circuit(circuit, shots=4096)
    assert result.backend == "qiskit-aer"
    assert 0.43 < result.probabilities["0"] < 0.57
    assert 0.43 < result.probabilities["1"] < 0.57


def test_reset_affects_final_aer_readout():
    circuit = CircuitIR(
        schemaVersion="1.0",
        qubits=1,
        classicalBits=1,
        operations=[
            CircuitOperation(gate="X", targets=[0], step=0),
            CircuitOperation(gate="RESET", targets=[0], step=1),
            CircuitOperation(gate="X", targets=[0], step=2),
        ],
    )
    result = simulate_circuit(circuit, shots=256)
    assert result.counts["1"] == 256
    assert result.probabilities["1"] == 1.0
