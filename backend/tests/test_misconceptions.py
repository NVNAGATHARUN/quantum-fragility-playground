import pytest
from app.pedagogy.misconceptions import get_conflict_lab, CONFLICT_LABS, MISCONCEPTION_CATALOG
from app.quantum.simulator import simulate_circuit
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_conflict_labs_catalog():
    assert "lab-m01-interference" in CONFLICT_LABS
    assert "lab-m02-no-signaling" in CONFLICT_LABS
    assert "lab-m03-mixture" in CONFLICT_LABS
    
    lab1 = get_conflict_lab("lab-m01-interference")
    assert lab1 is not None
    assert lab1.misconceptionId == "M01"
    assert len(lab1.steps) == 2
    assert lab1.steps[0].circuit.qubits == 1
    assert lab1.steps[1].circuit.qubits == 1

def test_interference_simulation():
    lab = get_conflict_lab("lab-m01-interference")
    assert lab is not None
    
    # Step 1: H -> H -> Measure: should constructively return to |0> with ~100%
    step1_circuit = lab.steps[0].circuit
    res_step1 = simulate_circuit(step1_circuit, shots=1024)
    assert res_step1.probabilities.get("0", 0) > 0.99
    assert res_step1.probabilities.get("1", 0) < 0.01

    # Step 2: H -> Z -> H -> Measure: phase flip turns outcome to |1> with ~100%
    step2_circuit = lab.steps[1].circuit
    res_step2 = simulate_circuit(step2_circuit, shots=1024)
    assert res_step2.probabilities.get("1", 0) > 0.99
    assert res_step2.probabilities.get("0", 0) < 0.01

def test_no_signaling_simulation():
    lab = get_conflict_lab("lab-m02-no-signaling")
    assert lab is not None
    
    # Step 1: Alice measures q0, Bob measures q1
    step1_circuit = lab.steps[0].circuit
    res_step1 = simulate_circuit(step1_circuit, shots=1024)
    # Bell state yields "00" and "11"
    assert res_step1.probabilities.get("00", 0) > 0.40
    assert res_step1.probabilities.get("11", 0) > 0.40
    assert any(st.isEntangled for st in res_step1.reducedStates) is True
    assert res_step1.metrics.entanglementEntropy > 0.5

    # Bob's marginal probability is 50/50
    bob_p0 = sum(p for bitstr, p in res_step1.probabilities.items() if len(bitstr) > 1 and bitstr[1] == '0')
    bob_p1 = sum(p for bitstr, p in res_step1.probabilities.items() if len(bitstr) > 1 and bitstr[1] == '1')
    assert abs(bob_p0 - 0.5) < 0.08
    assert abs(bob_p1 - 0.5) < 0.08

def test_api_conflict_lab_endpoint():
    resp = client.get("/api/v1/pedagogy/conflict-lab/lab-m01-interference")
    assert resp.status_code == 200
    data = resp.json()
    assert data["labId"] == "lab-m01-interference"
    assert data["misconceptionId"] == "M01"
    assert len(data["steps"]) == 2

    resp_404 = client.get("/api/v1/pedagogy/conflict-lab/nonexistent-lab")
    assert resp_404.status_code == 404
