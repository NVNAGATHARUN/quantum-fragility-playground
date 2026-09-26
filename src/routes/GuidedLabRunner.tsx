import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FlaskConical,
  Lightbulb,
  Loader2,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  Undo2,
  Redo2,
  X,
} from "lucide-react";
import { GUIDED_LABS } from "../content/guidedLabs";
import type {
  CircuitIR,
  GateOperation,
  NormalizedSimulationResult,
  SupportedGate,
} from "../types/quantum";
import BlochSphere3D from "../components/BlochSphere3D";
import { useQuantumSession } from "../providers/QuantumSessionProvider";
import { useAuth } from "../providers/AuthProvider";
import "../guided-labs.css";

const GATES: {
  gate: SupportedGate;
  label: string;
  name: string;
  description: string;
}[] = [
  {
    gate: "H",
    label: "H",
    name: "Hadamard",
    description:
      "Mix the amplitudes of |0⟩ and |1⟩. On |0⟩, H prepares equal superposition.",
  },
  {
    gate: "X",
    label: "X",
    name: "Bit flip",
    description: "Exchange the amplitudes of |0⟩ and |1⟩.",
  },
  {
    gate: "Z",
    label: "Z",
    name: "Phase flip",
    description:
      "Reverse the sign of the |1⟩ amplitude without changing Z-basis probabilities.",
  },
  {
    gate: "S",
    label: "S",
    name: "Quarter phase",
    description: "Add a π/2 relative phase to the |1⟩ amplitude.",
  },
  {
    gate: "T",
    label: "T",
    name: "Eighth phase",
    description: "Add a π/4 relative phase to the |1⟩ amplitude.",
  },
  {
    gate: "Y",
    label: "Y",
    name: "Bit + phase",
    description: "Apply a bit flip with a relative phase change.",
  },
  {
    gate: "CX",
    label: "CX",
    name: "Controlled X",
    description:
      "Choose a control, then a target in the same column. Flip the target when the control is |1⟩.",
  },
  {
    gate: "CZ",
    label: "CZ",
    name: "Controlled Z",
    description:
      "Choose two qubits. Apply a minus sign to their joint |11⟩ amplitude.",
  },
  {
    gate: "SWAP",
    label: "SW",
    name: "Swap",
    description: "Choose two qubits in one column to exchange their states.",
  },
  {
    gate: "MEASURE",
    label: "M",
    name: "Measurement",
    description:
      "Read a qubit in the computational basis. Each shot produces a classical result.",
  },
  {
    gate: "RESET",
    label: "|0⟩",
    name: "Reset qubit",
    description: "Return a qubit to |0⟩ before the next operation.",
  },
];
type Action = {
  gate: SupportedGate;
  qubit: number;
  step: number;
  control?: number;
};
const ACTIONS: Record<string, Action[][]> = {
  superposition: [
    [{ gate: "H", qubit: 0, step: 0 }],
    [{ gate: "H", qubit: 0, step: 1 }],
    [{ gate: "MEASURE", qubit: 0, step: 2 }],
  ],
  phase: [
    [{ gate: "H", qubit: 0, step: 0 }],
    [{ gate: "Z", qubit: 0, step: 1 }],
    [{ gate: "H", qubit: 0, step: 2 }],
  ],
  measurement: [
    [{ gate: "H", qubit: 0, step: 0 }],
    [{ gate: "MEASURE", qubit: 0, step: 1 }],
    [
      { gate: "RESET", qubit: 0, step: 2 },
      { gate: "X", qubit: 0, step: 3 },
    ],
  ],
  "bell-state": [
    [{ gate: "H", qubit: 0, step: 0 }],
    [{ gate: "CX", qubit: 1, control: 0, step: 1 }],
    [
      { gate: "MEASURE", qubit: 0, step: 2 },
      { gate: "MEASURE", qubit: 1, step: 2 },
    ],
  ],
};
const touches = (op: GateOperation, q: number) =>
  op.targets.includes(q) || !!op.controls?.includes(q);
const isPaired = (gate: SupportedGate) => ["CX", "CZ", "SWAP"].includes(gate);
const clone = (c: CircuitIR): CircuitIR => JSON.parse(JSON.stringify(c));
type Snapshot = { circuit: CircuitIR; result: NormalizedSimulationResult };

export default function GuidedLabRunner() {
  const { labId } = useParams<{ labId: string }>();
  const lab = labId ? GUIDED_LABS[labId] : undefined;
  const { recordCircuitRun } = useQuantumSession();
  const { token } = useAuth();
  const [circuit, setCircuit] = useState<CircuitIR>(() =>
    clone(
      lab?.initialCircuit ?? {
        version: "1.0",
        qubits: 1,
        classicalBits: 1,
        operations: [],
      },
    ),
  );
  const [past, setPast] = useState<CircuitIR[]>([]);
  const [future, setFuture] = useState<CircuitIR[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [checkpoints, setCheckpoints] = useState<Record<number, Snapshot>>({});
  const [result, setResult] = useState<NormalizedSimulationResult | null>(null);
  const [running, setRunning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [selectedGate, setSelectedGate] = useState<SupportedGate>("H");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState<{
    qubit: number;
    step: number;
  } | null>(null);
  const [allGates, setAllGates] = useState(false);
  const [blochQubit, setBlochQubit] = useState(0);
  const request = useRef(0);
  useEffect(() => {
    request.current++;
    if (lab) setCircuit(clone(lab.initialCircuit));
    setPast([]);
    setFuture([]);
    setStepIndex(0);
    setCheckpoints({});
    setResult(null);
    setRunning(false);
    setError("");
    setHint(false);
    setCompleted(false);
    setSelectedGate("H");
    setSelectedId(null);
    setPending(null);
    setBlochQubit(0);
    return () => {
      request.current++;
    };
  }, [labId]);

  const step = lab?.steps[stepIndex];
  const validation = useMemo(
    () => step?.validate(circuit, result) ?? { pass: false, reason: "" },
    [step, circuit, result],
  );
  const action = (ACTIONS[labId ?? ""]?.[stepIndex] ?? []).find(
    (a) =>
      !circuit.operations.some(
        (op) =>
          op.gate === a.gate &&
          op.step === a.step &&
          op.targets.includes(a.qubit) &&
          (a.control === undefined || op.controls?.includes(a.control)),
      ),
  );
  useEffect(() => {
    if (action) setSelectedGate(action.gate);
    setPending(null);
    setSelectedId(null);
    setHint(false);
  }, [stepIndex, labId, action?.gate]);

  function edit(next: CircuitIR, history = true) {
    request.current++;
    if (history) {
      setPast((p) => [...p.slice(-39), clone(circuit)]);
      setFuture([]);
    }
    setCircuit(next);
    setResult(null);
    setRunning(false);
    setError("");
    setSelectedId(null);
    setPending(null);
    setCompleted(false);
  }
  function undo() {
    if (!past.length) return;
    setFuture((f) => [clone(circuit), ...f]);
    setPast((p) => p.slice(0, -1));
    edit(past[past.length - 1], false);
  }
  function redo() {
    if (!future.length) return;
    setPast((p) => [...p, clone(circuit)]);
    setFuture((f) => f.slice(1));
    edit(future[0], false);
  }
  function place(
    gate: SupportedGate,
    target: number,
    column: number,
    control?: number,
  ) {
    const wires = control === undefined ? [target] : [target, control];
    if (
      circuit.operations.some(
        (op) => op.step === column && wires.some((q) => touches(op, q)),
      )
    ) {
      setError(
        "That position is occupied. Select the existing gate and remove it first.",
      );
      return;
    }
    const op: GateOperation = {
      id: crypto.randomUUID(),
      gate,
      step: column,
      targets:
        gate === "SWAP" && control !== undefined ? [control, target] : [target],
      controls: gate !== "SWAP" && control !== undefined ? [control] : [],
    };
    edit({ ...circuit, operations: [...circuit.operations, op] });
  }
  function clickCell(q: number, column: number) {
    const op = circuit.operations.find(
      (o) => o.step === column && touches(o, q),
    );
    if (op) {
      setSelectedId(op.id);
      setPending(null);
      return;
    }
    if (isPaired(selectedGate)) {
      if (!pending) {
        setPending({ qubit: q, step: column });
        setSelectedId(null);
        return;
      }
      if (pending.step !== column || pending.qubit === q) {
        setError("Choose a different qubit in the highlighted column.");
        return;
      }
      place(selectedGate, q, column, pending.qubit);
    } else place(selectedGate, q, column);
  }
  async function run() {
    const id = ++request.current;
    setRunning(true);
    setError("");
    setResult(null);
    try {
      const base = (import.meta as any).env?.VITE_API_BASE_URL ?? "";
      const response = await fetch(base + "/api/v1/quantum/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ circuit, shots: 1024, backend: "qiskit-aer" }),
      });
      if (!response.ok)
        throw new Error(
          "Simulation is unavailable. Check that the quantum backend is running, then retry.",
        );
      const data: NormalizedSimulationResult = await response.json();
      if (request.current !== id) return;
      setResult(data);
      window.dispatchEvent(new CustomEvent("quantum-lens:studio-context", { detail: {
        circuit,
        simulationResult: data,
        location: `guided-lab:${labId}`,
        targetConcept: step?.title,
      }}));
      recordCircuitRun(circuit);
    } catch (e) {
      if (request.current === id)
        setError(
          e instanceof Error
            ? e.message
            : "Simulation failed. Please try again.",
        );
    } finally {
      if (request.current === id) setRunning(false);
    }
  }
  async function advance() {
    if (!lab || !result || !validation.pass) return;
    setVerifying(true);
    setError("");
    try {
      const base = (import.meta as any).env?.VITE_API_BASE_URL ?? "";
      const response = await fetch(`${base}/api/v1/guided-labs/${labId}/checkpoints/${stepIndex}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ circuit }),
      });
      const verified = await response.json();
      if (!response.ok || !verified.passed) {
        setError(verified.reason || verified.detail || "The server could not verify this checkpoint.");
        return;
      }
    setCheckpoints((p) => ({
      ...p,
      [stepIndex]: { circuit: clone(circuit), result },
    }));
    if (stepIndex === lab.steps.length - 1) setCompleted(true);
    else {
      setStepIndex((i) => i + 1);
      setHint(false);
    }
    } catch {
      setError("Checkpoint verification is unavailable. Your progress was not awarded; retry when the backend is online.");
    } finally {
      setVerifying(false);
    }
  }
  function visit(index: number) {
    if (index === stepIndex) return;
    const saved = checkpoints[index];
    if (!saved) return;
    edit(clone(saved.circuit));
    setResult(saved.result);
    setStepIndex(index);
  }
  if (!lab || !step)
    return (
      <div className="gl-empty">
        <h1>Lab not found</h1>
        <Link to="/labs">Return to Quantum Labs</Link>
      </div>
    );
  const activeGate = GATES.find((g) => g.gate === selectedGate)!;
  const selectedOp = circuit.operations.find((op) => op.id === selectedId);
  const columnCount = Math.min(
    16,
    Math.max(5, ...circuit.operations.map((op) => op.step + 2)),
  );
  const palette = allGates
    ? GATES
    : GATES.filter((g) =>
        [
          "H",
          "X",
          "Z",
          "MEASURE",
          "RESET",
          ...(circuit.qubits > 1 ? ["CX"] : []),
        ].includes(g.gate),
      );
  const bloch = result?.reducedStates?.find(
    (s) => s.qubit === blochQubit,
  )?.blochVector;
  const hasMeasurement = circuit.operations.some((op) => op.gate === "MEASURE");
  const progress = Object.keys(checkpoints).length;
  return (
    <div className="gl-page">
      <Link to="/labs" className="gl-back">
        <ArrowLeft size={15} /> Quantum Labs
      </Link>
      <header className="gl-heading">
        <div>
          <p className="gl-eyebrow">
            <FlaskConical size={14} /> GUIDED EXPERIMENT
          </p>
          <h1>{lab.title}</h1>
          <p>{lab.subtitle}</p>
        </div>
        <div className="gl-meta">
          <span>{lab.difficulty}</span>
          <span>
            <Clock3 size={14} /> {lab.estimatedTime}
          </span>
          <span>
            {circuit.qubits} qubit{circuit.qubits > 1 ? "s" : ""}
          </span>
        </div>
      </header>
      <nav className="gl-journey" aria-label="Lab checkpoints">
        {lab.steps.map((s, i) => (
          <button
            key={s.id}
            aria-current={i === stepIndex ? "step" : undefined}
            disabled={i !== stepIndex && !checkpoints[i]}
            onClick={() => visit(i)}
            className={
              i === stepIndex ? "is-current" : checkpoints[i] ? "is-done" : ""
            }
          >
            <span className="gl-step-number">
              {checkpoints[i] ? (
                <Check size={16} />
              ) : (
                String(i + 1).padStart(2, "0")
              )}
            </span>
            <span>
              <small>
                {checkpoints[i]
                  ? "COMPLETED"
                  : i === stepIndex
                    ? "CURRENT CHECKPOINT"
                    : "UP NEXT"}
              </small>
              <strong>{s.title}</strong>
            </span>
          </button>
        ))}
      </nav>
      <div className="gl-layout">
        <aside className="gl-guide">
          <div className="gl-guide-title">
            <span className="gl-eyebrow">YOUR MISSION</span>
            <span>
              {stepIndex + 1} / {lab.steps.length}
            </span>
          </div>
          <h2>{step.title}</h2>
          <p className="gl-instruction">{step.instruction}</p>
          <div className="gl-action-box">
            <span className="gl-eyebrow">NEXT ACTION</span>
            {action ? (
              <>
                <p>
                  Add{" "}
                  <strong>
                    {action.gate === "MEASURE" ? "measurement" : action.gate}
                  </strong>{" "}
                  at step {action.step + 1}
                  {action.control !== undefined
                    ? `: control q${action.control} → target q${action.qubit}`
                    : ` on q${action.qubit}`}
                  .
                </p>
                <button
                  className="gl-button gl-secondary"
                  onClick={() =>
                    place(
                      action.gate,
                      action.qubit,
                      action.step,
                      action.control,
                    )
                  }
                >
                  <Plus size={16} /> Add suggested gate
                </button>
              </>
            ) : (
              <p>
                {result
                  ? "Compare your result with the checkpoint below."
                  : "Your gates are in place. Run the circuit to inspect the result."}
              </p>
            )}
          </div>
          <button
            className="gl-hint-toggle"
            aria-expanded={hint}
            onClick={() => setHint((h) => !h)}
          >
            <Lightbulb size={16} /> {hint ? "Hide hint" : "Show a hint"}
            <ChevronDown size={14} />
          </button>
          {hint && (
            <p className="gl-hint">
              {step.hint.replace(
                /step (\d+)/gi,
                (_, n) => `step ${Number(n) + 1}`,
              )}
            </p>
          )}
          <div
            className={`gl-feedback ${validation.pass ? "is-success" : ""}`}
            aria-live="polite"
          >
            {validation.pass ? (
              <CheckCircle2 size={18} />
            ) : (
              <span className="gl-status-dot" />
            )}
            <div>
              <strong>
                {validation.pass
                  ? "Checkpoint matched"
                  : result
                    ? "Try one more change"
                    : "Ready when you are"}
              </strong>
              <p>
                {result
                  ? validation.reason
                  : "Build the circuit, make a prediction, then run it to check your work."}
              </p>
            </div>
          </div>
          {validation.pass && (
            <div className="gl-insight">
              <span className="gl-eyebrow">WHY THIS HAPPENS</span>
              <p>{step.targetExplanation}</p>
            </div>
          )}
          <button
            className="gl-button gl-primary gl-next"
            disabled={!validation.pass || running || verifying}
            onClick={advance}
          >
            {stepIndex < lab.steps.length - 1
              ? verifying ? "Verifying…" : "Next checkpoint"
              : "Finish experiment"}
            <ArrowRight size={16} />
          </button>
          <p className="gl-session-note">
            {progress} of {lab.steps.length} checkpoints completed in this
            session
          </p>
          {completed && (
            <div className="gl-complete" role="status">
              <CheckCircle2 size={23} />
              <h3>Experiment complete</h3>
              <p>
                You worked through each checkpoint. Try a new concept or build
                your own circuit.
              </p>
              <Link to="/labs">
                Choose another lab <ArrowRight size={14} />
              </Link>
              <Link to="/labs/studio">
                Open Circuit Studio <ArrowRight size={14} />
              </Link>
              {labId === "bell-state" && (
                <Link to="/challenges/bell-phase-verification">
                  Verify Bell phase mastery <ArrowRight size={14} />
                </Link>
              )}
            </div>
          )}
        </aside>
        <div className="gl-main">
          <section className="gl-workspace" aria-label="Circuit workspace">
            <div className="gl-workspace-heading">
              <div>
                <p className="gl-eyebrow">01 · BUILD & RUN</p>
                <h2>Your circuit</h2>
                <p>Gates act from left to right.</p>
              </div>
              <button
                className="gl-button gl-primary"
                onClick={run}
                disabled={running}
              >
                {running ? (
                  <Loader2 className="gl-spin" size={17} />
                ) : (
                  <Play size={17} />
                )}{" "}
                {running ? "Running…" : "Run circuit"}
              </button>
            </div>
            <div className="gl-palette-heading">
              <span>Choose a gate</span>
              <button
                onClick={() => setAllGates((a) => !a)}
                aria-expanded={allGates}
              >
                {allGates ? "Lesson gates" : "All gates"}{" "}
                <ChevronDown size={14} />
              </button>
            </div>
            <div className="gl-palette" role="group" aria-label="Gate palette">
              {palette.map((g) => (
                <button
                  key={g.gate}
                  aria-pressed={selectedGate === g.gate}
                  disabled={isPaired(g.gate) && circuit.qubits < 2}
                  onClick={() => {
                    setSelectedGate(g.gate);
                    setPending(null);
                    setError("");
                  }}
                  title={g.description}
                >
                  <b>{g.label}</b>
                  <span>{g.name}</span>
                </button>
              ))}
            </div>
            <p className="gl-gate-help">
              <strong>{activeGate.name}</strong>
              <span>{activeGate.description}</span>
            </p>
            <div
              className="gl-board-scroll"
              tabIndex={0}
              role="region"
              aria-label="Scrollable circuit board"
            >
              <div
                className="gl-board"
                style={{ width: 66 + columnCount * 76 }}
              >
                <div className="gl-board-labels">
                  <span>QUBIT</span>
                  {Array.from({ length: columnCount }, (_, s) => (
                    <span key={s}>STEP {s + 1}</span>
                  ))}
                </div>
                <div className="gl-wire-area">
                  {circuit.operations
                    .filter(
                      (op) =>
                        (op.controls?.length ?? 0) > 0 || op.targets.length > 1,
                    )
                    .map((op) => {
                      const qs = [...op.targets, ...(op.controls ?? [])];
                      const top = Math.min(...qs);
                      const bottom = Math.max(...qs);
                      return (
                        <span
                          key={op.id}
                          className="gl-connector"
                          style={{
                            left: 66 + op.step * 76 + 38,
                            top: top * 76 + 38,
                            height: (bottom - top) * 76,
                          }}
                        />
                      );
                    })}
                  {Array.from({ length: circuit.qubits }, (_, q) => (
                    <div className="gl-wire" key={q}>
                      <div className="gl-qubit">
                        <strong>q{q}</strong>
                        <small>|0⟩</small>
                      </div>
                      {Array.from({ length: columnCount }, (_, s) => {
                        const op = circuit.operations.find(
                          (o) => o.step === s && touches(o, q),
                        );
                        const control = op?.controls?.includes(q);
                        const suggested =
                          !op &&
                          action?.step === s &&
                          (action.qubit === q || action.control === q);
                        return (
                          <div className="gl-cell" key={s}>
                            <button
                              onClick={() => clickCell(q, s)}
                              className={`${op ? "has-gate" : ""} ${op?.id === selectedId ? "is-selected" : ""} ${suggested ? "is-suggested" : ""} ${pending?.step === s ? "is-target" : ""}`}
                              aria-label={
                                op
                                  ? `Select ${op.gate}${control ? " control" : ""} on q${q}, step ${s + 1}`
                                  : `Place ${selectedGate} on q${q}, step ${s + 1}`
                              }
                            >
                              {op ? (
                                control ? (
                                  "●"
                                ) : op.gate === "SWAP" ? (
                                  "×"
                                ) : (
                                  (GATES.find((g) => g.gate === op.gate)
                                    ?.label ?? op.gate)
                                )
                              ) : pending?.qubit === q && pending.step === s ? (
                                "●"
                              ) : (
                                <Plus size={17} />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="gl-canvas-tools">
              <div>
                <button
                  onClick={undo}
                  disabled={!past.length}
                  aria-label="Undo circuit edit"
                >
                  <Undo2 size={16} />
                </button>
                <button
                  onClick={redo}
                  disabled={!future.length}
                  aria-label="Redo circuit edit"
                >
                  <Redo2 size={16} />
                </button>
                <span>
                  {circuit.operations.length} gates · {circuit.qubits} qubit
                  {circuit.qubits > 1 ? "s" : ""}
                </span>
              </div>
              <div>
                <button onClick={() => edit(clone(lab.initialCircuit))}>
                  <RotateCcw size={14} /> Reset circuit
                </button>
              </div>
            </div>
            {pending ? (
              <div className="gl-selection">
                <p>
                  q{pending.qubit} selected. Choose the other qubit in step{" "}
                  {pending.step + 1}.
                </p>
                <button onClick={() => setPending(null)}>
                  <X size={15} /> Cancel
                </button>
              </div>
            ) : selectedOp ? (
              <div className="gl-selection">
                <p>
                  <strong>{selectedOp.gate}</strong> · Step{" "}
                  {selectedOp.step + 1} ·{" "}
                  {selectedOp.controls?.length
                    ? `Control q${selectedOp.controls[0]} → `
                    : ""}
                  Target {selectedOp.targets.map((q) => `q${q}`).join(", ")}
                </p>
                <button
                  onClick={() =>
                    edit({
                      ...circuit,
                      operations: circuit.operations.filter(
                        (o) => o.id !== selectedOp.id,
                      ),
                    })
                  }
                >
                  <Trash2 size={15} /> Remove gate
                </button>
              </div>
            ) : (
              <p className="gl-canvas-note">
                Choose a gate, then click a + on the wire. Select an existing
                gate to inspect or remove it.
              </p>
            )}
            {error && (
              <div className="gl-error" role="alert">
                {error}
              </div>
            )}
          </section>
          <section className="gl-results" aria-label="Simulation results">
            <div className="gl-results-heading">
              <div>
                <p className="gl-eyebrow">02 · OBSERVE & EXPLAIN</p>
                <h2>What does your circuit produce?</h2>
              </div>
              <span className="gl-result-status">
                {running
                  ? "Running…"
                  : result
                    ? "Current circuit"
                    : "Awaiting a run"}
              </span>
            </div>
            {!result ? (
              <div className="gl-results-empty">
                <span>0 → ?</span>
                <div>
                  <h3>Predict before you run</h3>
                  <p>
                    Will you see |0⟩, |1⟩, or a mix of outcomes? Run your
                    circuit to reveal probabilities and the qubit state.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="gl-result-grid">
                  <div className="gl-probabilities">
                    <h3>Measurement probabilities</h3>
                    <p>Ideal outcome distribution in the Z basis.</p>
                    {Object.entries(result.probabilities)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([basis, probability]) => (
                        <div className="gl-probability" key={basis}>
                          <div>
                            <strong>|{basis}⟩</strong>
                            <span>{(probability * 100).toFixed(1)}%</span>
                          </div>
                          <div className="gl-bar">
                            <span style={{ width: `${probability * 100}%` }} />
                          </div>
                          <small>
                            {result.counts[basis] ?? 0} / {result.shots} sampled
                            outcomes
                          </small>
                        </div>
                      ))}
                    <p className="gl-result-note">
                      Probabilities describe many repeated runs. A single shot
                      gives one outcome.{" "}
                      {circuit.qubits > 1
                        ? `Bit labels read q${circuit.qubits - 1}…q0.`
                        : "The bit label refers to q0."}
                    </p>
                  </div>
                  <div className="gl-bloch-panel">
                    <div className="gl-bloch-title">
                      <h3>Qubit state</h3>
                      <select
                        aria-label="Qubit shown on Bloch sphere"
                        value={blochQubit}
                        onChange={(e) => setBlochQubit(Number(e.target.value))}
                      >
                        {Array.from({ length: circuit.qubits }, (_, q) => (
                          <option key={q} value={q}>
                            q{q}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="gl-bloch">
                      {bloch && (
                        <BlochSphere3D
                          state={bloch}
                          health={100}
                          history={[]}
                        />
                      )}
                    </div>
                    <p className="gl-bloch-coordinates">
                      {bloch
                        ? `x ${bloch.x.toFixed(2)}   ·   y ${bloch.y.toFixed(2)}   ·   z ${bloch.z.toFixed(2)}`
                        : "State unavailable"}
                    </p>
                    <p className="gl-result-note">
                      Drag to rotate. For an entangled pair, one qubit's reduced
                      state can sit inside the sphere.
                    </p>
                  </div>
                </div>
                {hasMeasurement && (
                  <p className="gl-preview-note">
                    State preview omits measurement collapse; it does not
                    represent a post-measurement state.
                  </p>
                )}
                <details className="gl-amplitudes">
                  <summary>
                    Inspect amplitudes and phases <ChevronDown size={15} />
                  </summary>
                  <div className="gl-amplitude-table">
                    {result.statevector.map((a) => (
                      <div key={a.basis}>
                        <strong>|{a.basis}⟩</strong>
                        <span>
                          {a.real.toFixed(3)} {a.imag < 0 ? "−" : "+"}{" "}
                          {Math.abs(a.imag).toFixed(3)}i
                        </span>
                        <span>phase {a.phase.toFixed(2)} rad</span>
                      </div>
                    ))}
                  </div>
                </details>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
