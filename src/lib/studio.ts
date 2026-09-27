import type { CircuitIR, GateOperation, SupportedGate } from "../types/quantum";

export const STUDIO_GATES = [
  "H",
  "X",
  "Y",
  "Z",
  "S",
  "T",
  "RX",
  "RY",
  "RZ",
  "CX",
  "CZ",
  "SWAP",
  "MEASURE",
  "RESET",
] as const;
export const MAX_QUBITS = 5;
export const MAX_STEPS = 16;
export const isRotationGate = (gate: string) =>
  gate === "RX" || gate === "RY" || gate === "RZ";
type Complex = { r: number; i: number };
const add = (a: Complex, b: Complex): Complex => ({
  r: a.r + b.r,
  i: a.i + b.i,
});
const mul = (a: Complex, b: Complex): Complex => ({
  r: a.r * b.r - a.i * b.i,
  i: a.r * b.i + a.i * b.r,
});
const c = (r = 0, i = 0): Complex => ({ r, i });
export const ordered = (circuit: CircuitIR) =>
  [...circuit.operations].sort((a, b) => a.step - b.step);
export function validateStudioCircuit(circuit: CircuitIR) {
  if (
    circuit.version !== "1.0" ||
    !Number.isInteger(circuit.qubits) ||
    circuit.qubits < 1 ||
    circuit.qubits > MAX_QUBITS ||
    !Array.isArray(circuit.operations)
  )
    throw new Error("Choose between 1 and 5 qubits.");
  const occupied = new Set<string>();
  const ids = new Set<string>();
  for (const op of circuit.operations) {
    if (!STUDIO_GATES.includes(op.gate as (typeof STUDIO_GATES)[number]))
      throw new Error(
        `The interactive preview does not support ${op.gate}. Use the QASM visualizer for other operations.`,
      );
    if (!Number.isInteger(op.step) || op.step < 0 || op.step >= MAX_STEPS)
      throw new Error(`This studio supports ${MAX_STEPS} circuit steps.`);
    if (ids.has(op.id))
      throw new Error("Circuit operation IDs must be unique.");
    ids.add(op.id);
    const wires = [...op.targets, ...(op.controls || [])];
    const paired = ["CX", "CZ", "SWAP"].includes(op.gate);
    if (
      wires.length !== (paired ? 2 : 1) ||
      new Set(wires).size !== wires.length ||
      wires.some((q) => !Number.isInteger(q) || q < 0 || q >= circuit.qubits)
    )
      throw new Error(
        "Gate targets must be distinct qubits inside the circuit.",
      );
    if (
      op.gate === "SWAP"
        ? op.targets.length !== 2 || !!op.controls?.length
        : op.targets.length !== 1 ||
          (op.controls?.length || 0) !== (paired ? 1 : 0)
    )
      throw new Error("Invalid gate target/control configuration.");
    if (isRotationGate(op.gate) && !Number.isFinite(op.params?.theta))
      throw new Error("Rotation gates need a finite angle in radians.");
    if (op.gate === "MEASURE") {
      const classical = op.classicalTargets?.[0] ?? op.targets[0];
      if (!Number.isInteger(classical) || classical < 0 || classical >= circuit.classicalBits)
        throw new Error("Measurement needs a classical bit inside the circuit register.");
    }
    // Reserve the connection span so wires never hide overlapping gate operations.
    for (let q = Math.min(...wires); q <= Math.max(...wires); q++) {
      const key = `${op.step}:${q}`;
      if (occupied.has(key))
        throw new Error("Gates overlap in this step. Choose another column.");
      occupied.add(key);
    }
  }
}

/** Exact ideal unitary simulation, Qiskit order |q(n-1)…q0⟩. No sampling or noise. */
export function previewCircuit(circuit: CircuitIR) {
  validateStudioCircuit(circuit);
  let state = Array.from({ length: 2 ** circuit.qubits }, (_, i) =>
    c(i === 0 ? 1 : 0),
  );
  let truncatedAt: "MEASURE" | "RESET" | null = null;
  for (const op of ordered(circuit)) {
    if (op.gate === "MEASURE" || op.gate === "RESET") {
      truncatedAt = op.gate;
      break;
    }
    const target = op.targets[0],
      mask = 1 << target;
    if (["CX", "CZ", "SWAP"].includes(op.gate)) {
      const control = op.gate === "SWAP" ? op.targets[1] : op.controls![0];
      const cm = 1 << control;
      const next = state.map((a) => ({ ...a }));
      for (let i = 0; i < state.length; i++) {
        if (op.gate === "CX" && i & cm) next[i ^ mask] = state[i];
        if (op.gate === "CZ" && i & cm && i & mask)
          next[i] = mul(c(-1), state[i]);
        if (op.gate === "SWAP" && Boolean(i & cm) !== Boolean(i & mask))
          next[i ^ mask ^ cm] = state[i];
      }
      state = next;
      continue;
    }
    const s = Math.SQRT1_2,
      angle = op.params?.theta || 0;
    const co = Math.cos(angle / 2),
      si = Math.sin(angle / 2);
    const matrices: Record<string, Complex[]> = {
      H: [c(s), c(s), c(s), c(-s)],
      X: [c(), c(1), c(1), c()],
      Y: [c(), c(0, -1), c(0, 1), c()],
      Z: [c(1), c(), c(), c(-1)],
      S: [c(1), c(), c(), c(0, 1)],
      T: [c(1), c(), c(), c(s, s)],
      RX: [c(co), c(0, -si), c(0, -si), c(co)],
      RY: [c(co), c(-si), c(si), c(co)],
      RZ: [c(co, -si), c(), c(), c(co, si)],
    };
    const m = matrices[op.gate];
    const next = [...state];
    for (let i = 0; i < state.length; i++)
      if (!(i & mask)) {
        next[i] = add(mul(m[0], state[i]), mul(m[1], state[i | mask]));
        next[i | mask] = add(mul(m[2], state[i]), mul(m[3], state[i | mask]));
      }
    state = next;
  }
  const states = state.map((a, i) => ({
    basis: i.toString(2).padStart(circuit.qubits, "0"),
    real: a.r,
    imag: a.i,
    probability: a.r ** 2 + a.i ** 2,
    phase: Math.atan2(a.i, a.r),
  }));
  const bloch = Array.from({ length: circuit.qubits }, (_, q) => {
    let x = 0,
      y = 0,
      z = 0;
    for (let i = 0; i < state.length; i++)
      if (!(i & (1 << q))) {
        const a = state[i],
          b = state[i | (1 << q)];
        x += 2 * (a.r * b.r + a.i * b.i);
        y += 2 * (a.r * b.i - a.i * b.r);
        z += a.r * a.r + a.i * a.i - b.r * b.r - b.i * b.i;
      }
    return { x, y, z, purity: (1 + x * x + y * y + z * z) / 2 };
  });
  return { states, bloch, truncatedAt };
}

export function circuitCode(
  circuit: CircuitIR,
  format: "qasm" | "qiskit" = "qasm",
) {
  const operations = ordered(circuit).map((op) => {
    const wires = [...(op.controls || []), ...op.targets];
    const args = isRotationGate(op.gate)
      ? `${Number((op.params?.theta || 0).toFixed(8))}`
      : "";
    if (op.gate === "MEASURE") {
      const classical = op.classicalTargets?.[0] ?? op.targets[0];
      return format === "qasm" ? `c[${classical}] = measure q[${op.targets[0]}];` : `qc.measure(${op.targets[0]}, ${classical})`;
    }
    if (op.gate === "RESET") return format === "qasm" ? `reset q[${op.targets[0]}];` : `qc.reset(${op.targets[0]})`;
    return format === "qasm" ? `${op.gate.toLowerCase()}${args ? `(${args})` : ""} ${wires.map((q) => `q[${q}]`).join(", ")};` : `qc.${op.gate.toLowerCase()}(${[...(args ? [args] : []), ...wires].join(", ")})`;
  });
  return (
    format === "qasm"
      ? [
          `OPENQASM 3.0;`,
          `include "stdgates.inc";`,
          "",
          `qubit[${circuit.qubits}] q;`,
          ...(circuit.classicalBits ? [`bit[${circuit.classicalBits}] c;`] : []),
          ...operations,
        ]
      : [
          "from qiskit import QuantumCircuit",
          "",
          `qc = QuantumCircuit(${circuit.qubits}, ${circuit.classicalBits})`,
          ...operations,
          "",
          "print(qc)",
        ]
  ).join("\n");
}

/** Strict parser for the studio's documented OpenQASM subset; never executes code. */
export function parseStudioQasm(source: string): CircuitIR {
  if (source.length > 20000)
    throw new Error("Keep studio code under 20,000 characters.");
  const cleaned = source.replace(/\/\/[^\n]*/g, (match) =>
    " ".repeat(match.length),
  );
  const entries = [...cleaned.matchAll(/[^;]+(?:;|$)/g)]
    .filter((match) => match[0].replace(/;$/, "").trim())
    .map((match) => ({
      text: match[0].replace(/;$/, "").trim(),
      line: cleaned.slice(0, match.index! + match[0].search(/\S/)).split("\n")
        .length,
      terminated: match[0].endsWith(";"),
    }));
  const unterminated = entries.find((entry) => !entry.terminated);
  if (unterminated)
    throw new Error(
      `Line ${unterminated.line}: End the statement with a semicolon.`,
    );
  const statements = entries.map((entry) => entry.text);
  if (statements.shift() !== "OPENQASM 3.0")
    throw new Error("Start with OPENQASM 3.0;");
  if (statements[0] === 'include "stdgates.inc"') statements.shift();
  const register = statements.shift()?.match(/^qubit\s*\[\s*(\d+)\s*\]\s+q$/);
  if (!register) throw new Error("Declare one register: qubit[2] q;");
  if (Number(register[1]) < 1 || Number(register[1]) > MAX_QUBITS)
    throw new Error("Choose between 1 and 5 qubits.");
  let classicalBits = 0;
  const classicalRegister = statements[0]?.match(/^bit\s*\[\s*(\d+)\s*\]\s+c$/);
  if (classicalRegister) {
    classicalBits = Number(classicalRegister[1]);
    if (classicalBits < 1 || classicalBits > Number(register[1])) throw new Error("Classical register must contain between 1 and the number of qubits.");
    statements.shift();
  }
  const nextStep = Array.from({ length: MAX_QUBITS }, () => 0);
  const operations: GateOperation[] = statements.map((line, index) => {
    try {
      const measurement = line.match(/^c\[\s*(\d+)\s*\]\s*=\s*measure\s+q\[\s*(\d+)\s*\]$/i);
      if (measurement) {
        const classical = Number(measurement[1]), qubit = Number(measurement[2]);
        if (!classicalBits) throw new Error("Declare bit[n] c before measurement.");
        if (classical >= classicalBits || qubit >= Number(register[1])) throw new Error("Measurement references a bit outside its register.");
        const step = nextStep[qubit]++;
        return { id: `import-${index}`, gate: "MEASURE", targets: [qubit], classicalTargets: [classical], step };
      }
      const match = line.match(
        /^(h|x|y|z|s|t|rx|ry|rz|cx|cz|swap|reset)(?:\(\s*([^)]*)\s*\))?\s+q\[\s*(\d+)\s*\](?:\s*,\s*q\[\s*(\d+)\s*\])?$/i,
      );
      if (!match)
        throw new Error(
          `Unsupported statement: ${line}. Use supported gates, RESET, or c[i] = measure q[i].`,
        );
      const gate = match[1].toUpperCase() as SupportedGate;
      const first = Number(match[3]),
        second = match[4] === undefined ? undefined : Number(match[4]);
      let params;
      if (isRotationGate(gate)) {
        const raw = (match[2] || "").replace(/\s/g, "");
        const pi = raw.match(
          /^(-?)(?:(\d+(?:\.\d+)?)\*)?pi(?:\/(\d+(?:\.\d+)?))?$/,
        );
        const theta = pi
          ? ((pi[1] ? -1 : 1) * Number(pi[2] || 1) * Math.PI) /
            Number(pi[3] || 1)
          : /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(raw)
            ? Number(raw)
            : NaN;
        if (!Number.isFinite(theta))
          throw new Error(
            "Use a numeric angle in radians or an expression like pi/2.",
          );
        params = { theta };
      } else if (match[2] !== undefined)
        throw new Error(`${gate} does not accept an angle.`);
      const paired = ["CX", "CZ", "SWAP"].includes(gate);
      if (paired !== (second !== undefined))
        throw new Error(
          `${gate} requires ${paired ? "two" : "one"} qubit${paired ? "s" : ""}.`,
        );
      if (
        first >= Number(register[1]) ||
        (second !== undefined && second >= Number(register[1]))
      )
        throw new Error(
          "A gate references a qubit outside the declared register.",
        );
      const span = Array.from(
        { length: Math.abs((second ?? first) - first) + 1 },
        (_, n) => Math.min(first, second ?? first) + n,
      );
      const step = Math.max(...span.map((q) => nextStep[q]));
      span.forEach((q) => {
        nextStep[q] = step + 1;
      });
      return {
        id: `import-${index}`,
        gate,
        targets:
          gate === "SWAP"
            ? [first, second!]
            : gate === "CX" || gate === "CZ"
              ? [second!]
              : [first],
        ...(gate === "CX" || gate === "CZ" ? { controls: [first] } : {}),
        ...(params ? { params } : {}),
        step,
      };
    } catch (e) {
      throw new Error(
        `Line ${entries[entries.length - statements.length + index].line}: ${(e as Error).message}`,
      );
    }
  });
  const circuit: CircuitIR = {
    version: "1.0",
    qubits: Number(register[1]),
    classicalBits,
    operations,
  };
  validateStudioCircuit(circuit);
  return circuit;
}

export function presetCircuit(preset: string): CircuitIR {
  const qubits = preset === "ghz" ? 3 : 2;
  const operations: GateOperation[] =
    preset === "empty" ? [] : [{ id: "h0", gate: "H", targets: [0], step: 0 }];
  if (preset === "bell" || preset === "ghz")
    operations.push({
      id: "cx1",
      gate: "CX",
      controls: [0],
      targets: [1],
      step: 1,
    });
  if (preset === "ghz")
    operations.push({
      id: "cx2",
      gate: "CX",
      controls: [1],
      targets: [2],
      step: 2,
    });
  if (preset === "interference")
    operations.push({ id: "h1", gate: "H", targets: [0], step: 1 });
  return { version: "1.0", qubits, classicalBits: 0, operations };
}
