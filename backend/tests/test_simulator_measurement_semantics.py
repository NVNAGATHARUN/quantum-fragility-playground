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


def test_unitary_editor_circuit_allocates_final_readout_register():
    circuit = CircuitIR(
        schemaVersion="1.0",
        qubits=2,
        classicalBits=0,
        operations=[
            CircuitOperation(gate="H", targets=[0], step=0),
            CircuitOperation(gate="CX", controls=[0], targets=[1], step=1),
        ],
    )
    result = simulate_circuit(circuit, shots=128)
    assert set(result.counts) == {"00", "01", "10", "11"}
    assert result.counts["00"] + result.counts["11"] == 128
    assert result.counts["01"] == result.counts["10"] == 0
