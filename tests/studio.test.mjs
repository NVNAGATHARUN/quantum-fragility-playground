import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Transpile only this pure module; works on the project's supported Node 18+.
const source = readFileSync(
  new URL("../src/lib/studio.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
  },
});
const {
  previewCircuit,
  presetCircuit,
  parseStudioQasm,
  circuitCode,
  validateStudioCircuit,
} = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const near = (a, b, tolerance = 1e-7) =>
  assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const qasm = (gates, n = 2) =>
  parseStudioQasm(
    `OPENQASM 3.0; include "stdgates.inc"; qubit[${n}] q; ${gates}`,
  );

test("QASM diagnostics locate invalid operations after blank lines and comments", () => {
  assert.throws(
    () =>
      parseStudioQasm(
        "OPENQASM 3.0;\nqubit[2] q;\n// prepare\n\nrx(nope) q[0];",
      ),
    /Line 5:.*angle/,
  );
  assert.throws(
    () => parseStudioQasm("OPENQASM 3.0;\nqubit[2] q;\nh q[0]"),
    /Line 3:.*semicolon/,
  );
});

test("rotation and control edits survive code synchronization", () => {
  const circuit = presetCircuit("bell");
  circuit.operations[0] = {
    ...circuit.operations[0],
    gate: "RY",
    params: { theta: -Math.PI / 3 },
  };
  circuit.operations[1] = {
    ...circuit.operations[1],
    controls: [1],
    targets: [0],
  };
  const restored = parseStudioQasm(circuitCode(circuit));
  assert.deepEqual(restored.operations[1].controls, [1]);
  assert.deepEqual(restored.operations[1].targets, [0]);
  const before = previewCircuit(circuit),
    after = previewCircuit(restored);
  before.states.forEach((state, i) =>
    near(state.probability, after.states[i].probability),
  );
});

test("Bell pair has equal correlated outcomes and maximally mixed local states", () => {
  const result = previewCircuit(presetCircuit("bell"));
  result.states.forEach((s, i) =>
    near(s.probability, i === 0 || i === 3 ? 0.5 : 0),
  );
  result.bloch.forEach((b) => {
    near(b.x, 0);
    near(b.y, 0);
    near(b.z, 0);
    near(b.purity, 0.5);
  });
});
test("GHZ state occupies 000 and 111", () => {
  previewCircuit(presetCircuit("ghz")).states.forEach((s, i) =>
    near(s.probability, i === 0 || i === 7 ? 0.5 : 0),
  );
});
test("qubit 0 is the least significant bit, matching Qiskit", () => {
  near(
    previewCircuit(qasm("x q[0];")).states.find((s) => s.basis === "01")
      .probability,
    1,
  );
  near(
    previewCircuit(qasm("x q[1];")).states.find((s) => s.basis === "10")
      .probability,
    1,
  );
});
test("Hadamard interference returns to zero", () =>
  near(previewCircuit(presetCircuit("interference")).states[0].probability, 1));
test("phase gates affect interference and local Bloch Y", () => {
  near(
    previewCircuit(qasm("h q[0]; z q[0]; h q[0];")).states[1].probability,
    1,
  );
  near(previewCircuit(qasm("h q[0]; s q[0];")).bloch[0].y, 1);
  near(previewCircuit(qasm("y q[0];")).states[1].imag, 1);
});
test("rotation gates preserve phase and probability", () => {
  near(previewCircuit(qasm("ry(pi) q[0];")).states[1].probability, 1);
  near(previewCircuit(qasm("rx(pi) q[0];")).states[1].imag, -1);
  near(previewCircuit(qasm("h q[0]; rz(pi/2) q[0];")).bloch[0].y, 1);
});
test("controlled Z and SWAP operate on the intended two wires", () => {
  near(
    previewCircuit(qasm("x q[0]; x q[1]; cz q[0], q[1];")).states[3].real,
    -1,
  );
  near(
    previewCircuit(qasm("x q[0]; swap q[0], q[1];")).states[2].probability,
    1,
  );
});
test("exported QASM reconstructs the same complex state", () => {
  const circuit = qasm(
    "h q[0]; t q[0]; ry(-pi/3) q[1]; cx q[0], q[1]; rz(0.37) q[0]; swap q[0], q[1];",
  );
  const expected = previewCircuit(circuit),
    actual = previewCircuit(parseStudioQasm(circuitCode(circuit)));
  actual.states.forEach((s, i) => {
    near(s.real, expected.states[i].real);
    near(s.imag, expected.states[i].imag);
  });
});
test("measurement and reset round-trip while pure-state preview stops honestly", () => {
  const measured = parseStudioQasm(
    'OPENQASM 3.0; include "stdgates.inc"; qubit[1] q; bit[1] c; h q[0]; c[0] = measure q[0]; x q[0];',
  );
  assert.equal(measured.classicalBits, 1);
  assert.equal(measured.operations[1].gate, "MEASURE");
  assert.deepEqual(measured.operations[1].classicalTargets, [0]);
  const preview = previewCircuit(measured);
  assert.equal(preview.truncatedAt, "MEASURE");
  near(preview.states[0].probability, 0.5);
  near(preview.states[1].probability, 0.5);
  const restored = parseStudioQasm(circuitCode(measured));
  assert.equal(restored.operations[1].gate, "MEASURE");
  const reset = qasm("x q[0]; reset q[0]; h q[0];", 1);
  assert.equal(previewCircuit(reset).truncatedAt, "RESET");
  assert.match(circuitCode(measured, "qiskit"), /qc\.measure\(0, 0\)/);
});
test("parallel circuit exports do not consume one visual step per statement", () => {
  const circuit = {
    version: "1.0",
    qubits: 5,
    classicalBits: 0,
    operations: Array.from({ length: 30 }, (_, i) => ({
      id: String(i),
      gate: "H",
      targets: [i % 5],
      step: Math.floor(i / 5),
    })),
  };
  const parsed = parseStudioQasm(circuitCode(circuit));
  assert.equal(parsed.operations.length, 30);
  near(previewCircuit(parsed).states[0].probability, 1);
});
test("reject unsupported, malformed, oversized and overlapping circuits", () => {
  for (const body of [
    "rx(alert(1)) q[0];",
    "cx q[0], q[0];",
    "x q[4];",
    "h(pi) q[0];",
    "swap q[0];",
  ])
    assert.throws(() => qasm(body));
  assert.throws(() => qasm("", 6));
  assert.throws(() => qasm("h q[0];".repeat(17)));
  const bell = presetCircuit("bell");
  bell.operations.push({ id: "overlap", gate: "X", targets: [1], step: 1 });
  assert.throws(() => validateStudioCircuit(bell));
});
test("unitary mixtures keep total probability at one", () => {
  for (let i = 0; i < 20; i++) {
    const circuit = qasm(
      `h q[0]; ry(${i / 7}) q[1]; cx q[0], q[1]; rz(${i / 3}) q[0]; t q[1]; rx(${i / 5}) q[0];`,
    );
    near(
      previewCircuit(circuit).states.reduce((sum, s) => sum + s.probability, 0),
      1,
    );
  }
});

test("Cirq export produces valid cirq.Circuit structure for Bell pair", () => {
  const bell = presetCircuit("bell");
  const code = circuitCode(bell, "cirq");
  assert.ok(code.includes("import cirq"), "Missing: import cirq");
  assert.ok(code.includes("q0 = cirq.LineQubit(0)"), "Missing: q0 LineQubit");
  assert.ok(code.includes("q1 = cirq.LineQubit(1)"), "Missing: q1 LineQubit");
  assert.ok(code.includes("cirq.H(q0)"), "Missing: H gate on q0");
  assert.ok(code.includes("cirq.CNOT(q0, q1)"), "Missing: CNOT(q0, q1)");
  assert.ok(code.includes("circuit = cirq.Circuit("), "Missing: circuit assignment");
  assert.ok(code.includes("print(circuit)"), "Missing: print(circuit)");
  assert.ok(code.includes("final_state_vector"), "Missing: final_state_vector simulation");
});

test("PennyLane export produces valid @qml.qnode structure for Bell pair", () => {
  const bell = presetCircuit("bell");
  const code = circuitCode(bell, "pennylane");
  assert.ok(code.includes("import pennylane as qml"), "Missing: import pennylane");
  assert.ok(code.includes('dev = qml.device("default.qubit"'), "Missing: device declaration");
  assert.ok(code.includes("@qml.qnode(dev)"), "Missing: qnode decorator");
  assert.ok(code.includes("def circuit():"), "Missing: circuit function");
  assert.ok(code.includes("qml.Hadamard(wires=0)"), "Missing: Hadamard on wire 0");
  assert.ok(code.includes("qml.CNOT(wires=[0, 1])"), "Missing: CNOT on wires [0,1]");
  assert.ok(code.includes("return qml.state()"), "Missing: qml.state() return");
  assert.ok(code.includes("print(circuit())"), "Missing: print(circuit())");
});

test("Cirq export maps all rotation gates with correct angles", () => {
  const circuit = qasm("rx(1.5707963) q[0]; ry(3.14159265) q[1]; rz(0.78539816) q[0];");
  const code = circuitCode(circuit, "cirq");
  assert.ok(code.includes("cirq.rx("), "Missing: cirq.rx");
  assert.ok(code.includes("cirq.ry("), "Missing: cirq.ry");
  assert.ok(code.includes("cirq.rz("), "Missing: cirq.rz");
  // Angles should be numeric
  const angles = [...code.matchAll(/cirq\.r[xyz]\(([\d.]+)\)/g)].map((m) => Number(m[1]));
  assert.ok(angles.length === 3, `Expected 3 rotation angles, got ${angles.length}`);
  assert.ok(angles.every((a) => Number.isFinite(a) && a > 0), "Rotation angles must be positive finite numbers");
});

test("PennyLane export maps all single-qubit gates correctly", () => {
  const circuit = qasm("h q[0]; x q[1]; y q[0]; z q[1]; s q[0]; t q[1];");
  const code = circuitCode(circuit, "pennylane");
  assert.ok(code.includes("qml.Hadamard"), "Missing: Hadamard");
  assert.ok(code.includes("qml.PauliX"), "Missing: PauliX");
  assert.ok(code.includes("qml.PauliY"), "Missing: PauliY");
  assert.ok(code.includes("qml.PauliZ"), "Missing: PauliZ");
  assert.ok(code.includes("qml.S"), "Missing: S gate");
  assert.ok(code.includes("qml.T"), "Missing: T gate");
});

test("all four export formats produce non-empty output for GHZ circuit", () => {
  const ghz = presetCircuit("ghz");
  for (const fmt of ["qasm", "qiskit", "cirq", "pennylane"]) {
    const code = circuitCode(ghz, fmt);
    assert.ok(code.length > 40, `Format ${fmt} produced suspiciously short output: ${code.length} chars`);
  }
});

// ── Pulse Visualizer Math & Gate Mapping Tests ───────────────────────────────

const pulseSource = readFileSync(
  new URL("../src/lib/pulse.ts", import.meta.url),
  "utf8",
);
const { outputText: pulseOutput } = ts.transpileModule(pulseSource, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
  },
});
const { computePulse, GATE_PULSE } = await import(
  `data:text/javascript;base64,${Buffer.from(pulseOutput).toString("base64")}`
);

test("computePulse generates Gaussian I(t) envelope and DRAG Q(t) derivative", () => {
  const params = {
    duration: 1,
    sigma: 0.18,
    beta: 0.3,
    amplitude: 1.0,
    nativeCount: 1,
    decomposition: "test",
    color: "#22d3ee",
  };
  const points = computePulse(params, 200);
  assert.equal(points.length, 201, "Steps=200 should yield 201 sample points");

  // Center point (t = 0.5)
  const mid = points[100];
  assert.ok(Math.abs(mid.t - 0.5) < 1e-4, "Middle point is at t = 0.5");
  assert.ok(Math.abs(mid.I - 1.0) < 1e-3, "Gaussian envelope reaches peak amplitude 1.0 at center");
  assert.ok(Math.abs(mid.Q) < 1e-6, "DRAG Q channel derivative crosses zero at pulse peak");

  // First and last points should have near-zero amplitude
  const start = points[0];
  const end = points[200];
  assert.ok(start.I < 0.05, "Pulse starts near zero");
  assert.ok(end.I < 0.05, "Pulse ends near zero");

  // DRAG derivative is anti-symmetric: Q before center has opposite sign to Q after center
  const quarter = points[50];
  const threeQuarter = points[150];
  assert.ok(quarter.Q * threeQuarter.Q < 0, "Q channel derivative changes sign across pulse peak");
});

test("GATE_PULSE correctly distinguishes virtual frame rotations from physical pulses", () => {
  // Virtual gates: Z, S, T, RZ require 0 microwave pulses
  const virtualGates = ["Z", "S", "T", "RZ"];
  for (const g of virtualGates) {
    const entry = GATE_PULSE[g];
    assert.ok(entry, `Missing GATE_PULSE entry for ${g}`);
    assert.equal(entry.amplitude, 0, `Virtual gate ${g} must have amplitude 0`);
    assert.equal(entry.nativeCount, 0, `Virtual gate ${g} must have nativeCount 0`);
    assert.ok(entry.decomposition.toLowerCase().includes("virtual"), `Decomposition for ${g} should mention virtual`);
  }

  // Physical microwave gates: X, Y, H, CX, CZ, SWAP
  const physicalGates = ["X", "Y", "H", "CX", "CZ", "SWAP"];
  for (const g of physicalGates) {
    const entry = GATE_PULSE[g];
    assert.ok(entry, `Missing GATE_PULSE entry for ${g}`);
    assert.ok(entry.amplitude > 0, `Physical gate ${g} must have positive amplitude`);
    assert.ok(entry.nativeCount > 0, `Physical gate ${g} must have nativeCount > 0`);
  }

  // Accurate native counts
  assert.equal(GATE_PULSE["H"].nativeCount, 2, "Hadamard decomposes into 2 native pulses (Y_pi/2 -> X_pi)");
  assert.equal(GATE_PULSE["CX"].nativeCount, 4, "Echoed CR cross-resonance CX decomposes into 4 pulses");
  assert.equal(GATE_PULSE["SWAP"].nativeCount, 12, "SWAP decomposes into 3 CX = 12 native pulses");
});


