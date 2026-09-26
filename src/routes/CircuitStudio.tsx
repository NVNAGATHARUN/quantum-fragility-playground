import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Code2,
  Copy,
  Download,
  Info,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Undo2,
} from "lucide-react";
import type {
  CircuitIR,
  GateOperation,
  NormalizedSimulationResult,
  SupportedGate,
} from "../types/quantum";
import {
  circuitCode,
  MAX_QUBITS,
  MAX_STEPS,
  parseStudioQasm,
  presetCircuit,
  previewCircuit,
  STUDIO_GATES,
  validateStudioCircuit,
} from "../lib/studio";
import { useQuantumSession } from "../providers/QuantumSessionProvider";

const DRAFT_KEY = "ql_studio_draft_v1";
const descriptions: Record<string, string> = {
  H: "Hadamard creates or recombines superposition.",
  X: "Pauli X exchanges the amplitudes of |0⟩ and |1⟩.",
  Y: "Pauli Y rotates by π about the Y axis, up to a global phase.",
  Z: "Pauli Z flips the phase of the |1⟩ amplitude.",
  S: "S adds a π/2 phase to |1⟩.",
  T: "T adds a π/4 phase to |1⟩.",
  RX: "Rotate the state about the X axis.",
  RY: "Rotate the state about the Y axis.",
  RZ: "Rotate the state about the Z axis.",
  CX: "Controlled X: flip the target when the control is |1⟩.",
  CZ: "Controlled Z adds a minus sign to the |11⟩ component.",
  SWAP: "Exchange the quantum states of two qubits.",
};
function initialCircuit() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const value = JSON.parse(raw);
      validateStudioCircuit(value);
      return value as CircuitIR;
    }
  } catch {
    /* Invalid/old drafts fall back to a valid starter. */
  }
  return presetCircuit("bell");
}

function BlochPreview({
  x,
  y,
  z,
  purity,
}: {
  x: number;
  y: number;
  z: number;
  purity: number;
}) {
  const px = 90 + x * 49 + y * 23,
    py = 78 - z * 51 + y * 15;
  return (
    <svg
      viewBox="0 0 180 160"
      role="img"
      aria-label={`Reduced qubit state: x ${x.toFixed(2)}, y ${y.toFixed(2)}, z ${z.toFixed(2)}, purity ${purity.toFixed(2)}`}
    >
      <circle
        cx="90"
        cy="78"
        r="54"
        fill="none"
        stroke="currentColor"
        strokeOpacity=".3"
      />
      <ellipse
        cx="90"
        cy="78"
        rx="54"
        ry="18"
        fill="none"
        stroke="currentColor"
        strokeOpacity=".25"
      />
      <ellipse
        cx="90"
        cy="78"
        rx="20"
        ry="54"
        fill="none"
        stroke="currentColor"
        strokeOpacity=".2"
      />
      <path
        d="M90 17V142M27 78H153M55 56L126 100"
        stroke="currentColor"
        strokeOpacity=".25"
        strokeDasharray="3 3"
      />
      <path d={`M90 78L${px} ${py}`} stroke="currentColor" strokeWidth="2" />
      <circle cx={px} cy={py} r="4" fill="currentColor" />
      <text x="97" y="17" fill="currentColor" fontSize="9">
        |0⟩
      </text>
      <text x="97" y="148" fill="currentColor" fontSize="9">
        |1⟩
      </text>
    </svg>
  );
}

export default function CircuitStudio() {
  const { recordCircuitRun } = useQuantumSession();
  const [circuit, setCircuit] = useState<CircuitIR>(initialCircuit);
  const [past, setPast] = useState<CircuitIR[]>([]);
  const [future, setFuture] = useState<CircuitIR[]>([]);
  const [selectedGate, setSelectedGate] = useState<SupportedGate>("H");
  const [angle, setAngle] = useState("90");
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const [gateDraft, setGateDraft] = useState({
    target: 0,
    control: 1,
    step: 1,
    angle: "90",
  });
  const [pending, setPending] = useState<{
    qubit: number;
    step: number;
    gate: SupportedGate;
  } | null>(null);
  const [format, setFormat] = useState<"qasm" | "qiskit">("qasm");
  const [editing, setEditing] = useState(false);
  const [source, setSource] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [shots, setShots] = useState(1024);
  const [result, setResult] = useState<NormalizedSimulationResult | null>(null);
  const [resultCircuit, setResultCircuit] = useState("");
  const [resultTab, setResultTab] = useState("Probabilities");
  const [selectedQubit, setSelectedQubit] = useState(0);
  const [saved, setSaved] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const preview = useMemo(() => previewCircuit(circuit), [circuit]);
  const code = circuitCode(circuit, format);
  const inspected = circuit.operations.find((op) => op.id === inspectedId);
  const codeValidation = useMemo(() => {
    if (!editing) return { circuit: null, error: "" };
    try {
      return { circuit: parseStudioQasm(source), error: "" };
    } catch (e) {
      return { circuit: null, error: (e as Error).message };
    }
  }, [editing, source]);
  const columns = Math.min(
    MAX_STEPS,
    Math.max(8, ...circuit.operations.map((o) => o.step + 2)),
  );
  const signature = JSON.stringify(circuit);
  const currentResult = result && resultCircuit === signature;
  const staleResult = result && !currentResult;
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("quantum-lens:studio-context", {
        detail: {
          circuit,
          simulationResult: currentResult ? result : undefined,
        },
      }),
    );
  }, [circuit, result, currentResult]);

  function commit(next: CircuitIR) {
    try {
      validateStudioCircuit(next);
      setPast((p) => [...p.slice(-49), circuit]);
      setFuture([]);
      setCircuit(next);
      setInspectedId(null);
      setPending(null);
      setSaved(false);
      setError("");
      setSelectedQubit((q) => Math.min(q, next.qubits - 1));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPending(null);
        setInspectedId(null);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  useEffect(() => {
    const shortcut = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        editing ||
        target.closest("input, textarea, select, [contenteditable=true]")
      )
        return;
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
      if (e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [editing, past, future, circuit]);
  useEffect(() => {
    const receive = (e: Event) => {
      const next = (e as CustomEvent).detail?.circuit;
      if (editing) {
        setError(
          "Apply or discard your code edits before loading a suggested circuit.",
        );
        return;
      }
      if (next) commit(next);
    };
    window.addEventListener("quantum-lens:load-circuit", receive);
    try {
      const draft = sessionStorage.getItem("ql_mentor_circuit");
      if (draft) {
        sessionStorage.removeItem("ql_mentor_circuit");
        commit(JSON.parse(draft));
      }
    } catch {
      setError("The suggested circuit could not be loaded.");
    }
    return () =>
      window.removeEventListener("quantum-lens:load-circuit", receive);
  }, [circuit, editing]);

  function place(
    qubit: number,
    step: number,
    gate: SupportedGate = selectedGate,
  ) {
    if (editing) {
      setError("Apply or discard your code edits before changing the canvas.");
      return;
    }
    const existing = circuit.operations.find(
      (o) =>
        o.step === step &&
        [...o.targets, ...(o.controls || [])].includes(qubit),
    );
    if (existing) {
      if (pending) {
        setError(
          "That wire is occupied. Choose an empty target in the highlighted column.",
        );
        return;
      }
      setInspectedId(existing.id);
      setGateDraft({
        target: existing.targets[0],
        control:
          existing.controls?.[0] ??
          existing.targets[1] ??
          (existing.targets[0] === 0 ? 1 : 0),
        step: existing.step + 1,
        angle: String(
          Number(
            (((existing.params?.theta ?? Math.PI / 2) * 180) / Math.PI).toFixed(
              6,
            ),
          ),
        ),
      });
      setError("");
      return;
    }
    if (["CX", "CZ", "SWAP"].includes(gate)) {
      if (!pending || pending.gate !== gate) {
        setPending({ qubit, step, gate });
        setInspectedId(null);
        setNotice(
          gate === "SWAP"
            ? "Select the second qubit in the same column."
            : "Control selected. Select a target qubit in the same column.",
        );
        return;
      }
      if (pending.step !== step || pending.qubit === qubit) {
        setError(
          "Choose a different qubit in the same column. Escape cancels.",
        );
        return;
      }
      const op: GateOperation = {
        id: crypto.randomUUID(),
        gate,
        step,
        targets: gate === "SWAP" ? [pending.qubit, qubit] : [qubit],
        ...(gate === "SWAP" ? {} : { controls: [pending.qubit] }),
      };
      commit({ ...circuit, operations: [...circuit.operations, op] });
      setNotice("Gate added. Click it to edit its wires or delete it.");
      return;
    }
    const theta = (Number(angle) * Math.PI) / 180;
    if (gate.startsWith("R") && (!angle.trim() || !Number.isFinite(theta))) {
      setError("Enter a valid rotation angle.");
      return;
    }
    commit({
      ...circuit,
      operations: [
        ...circuit.operations,
        {
          id: crypto.randomUUID(),
          gate,
          targets: [qubit],
          step,
          ...(gate.startsWith("R") ? { params: { theta } } : {}),
        },
      ],
    });
    setNotice(`${gate} added to q${qubit}.`);
  }
  function undo() {
    if (!past.length || editing) return;
    setFuture((f) => [circuit, ...f]);
    setCircuit(past[past.length - 1]);
    setPast((p) => p.slice(0, -1));
    setPending(null);
    setSaved(false);
    setSelectedQubit(0);
    setInspectedId(null);
    setError("");
    setNotice("Undid the last circuit change.");
  }
  function redo() {
    if (!future.length || editing) return;
    setPast((p) => [...p, circuit]);
    setCircuit(future[0]);
    setFuture((f) => f.slice(1));
    setPending(null);
    setSaved(false);
    setSelectedQubit(0);
    setInspectedId(null);
    setError("");
    setNotice("Redid the circuit change.");
  }
  function updateGate() {
    if (!inspected || editing) return;
    const paired = ["CX", "CZ", "SWAP"].includes(inspected.gate);
    if (paired && gateDraft.target === gateDraft.control) {
      setError("Choose two different qubits.");
      return;
    }
    const theta = (Number(gateDraft.angle) * Math.PI) / 180;
    if (
      inspected.gate.startsWith("R") &&
      (!gateDraft.angle.trim() || !Number.isFinite(theta))
    ) {
      setError("Enter a finite rotation angle in degrees.");
      return;
    }
    const next = {
      ...inspected,
      step: gateDraft.step - 1,
      targets:
        inspected.gate === "SWAP"
          ? [gateDraft.target, gateDraft.control]
          : [gateDraft.target],
      ...(inspected.controls?.length ? { controls: [gateDraft.control] } : {}),
      ...(inspected.gate.startsWith("R") ? { params: { theta } } : {}),
    };
    commit({
      ...circuit,
      operations: circuit.operations.map((op) =>
        op.id === next.id ? next : op,
      ),
    });
  }
  function save() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(circuit));
      setSaved(true);
      setNotice("Circuit saved to this browser.");
    } catch {
      setError(
        "Browser storage is unavailable. Download your QASM to keep a copy.",
      );
    }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([code], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = format === "qasm" ? "quantum-lens.qasm" : "quantum-lens.py";
    a.click();
    URL.revokeObjectURL(url);
    setNotice("Circuit exported.");
  }
  async function runBackend() {
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    setRunning(true);
    setError("");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || ""}/api/v1/quantum/simulate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ circuit, shots, backend: "qiskit-aer" }),
          signal: controller.signal,
        },
      );
      if (
        !res.ok ||
        !res.headers.get("content-type")?.includes("application/json")
      )
        throw new Error("Simulator unavailable");
      const data = (await res.json()) as NormalizedSimulationResult;
      if (!data.counts || !data.backend)
        throw new Error("Invalid simulator response");
      setResult(data);
      setResultCircuit(signature);
      setResultTab("Shot counts");
      recordCircuitRun();
      setNotice(`Completed ${data.shots} shots with ${data.backend}.`);
    } catch {
      setError(
        "Qiskit could not be reached. The ideal browser preview is still available. Start the backend and try again for shot-based results.",
      );
    } finally {
      clearTimeout(timeout);
      setRunning(false);
    }
  }

  return (
    <div className="ql-page ql-studio">
      <div className="ql-page-heading">
        <div>
          <p className="ql-eyebrow">YOUR QUANTUM PLAYGROUND</p>
          <h1>Small gates. Big possibilities.</h1>
          <p>Build a circuit and watch the quantum state change.</p>
        </div>
        <div className="ql-studio-heading-actions">
          <button
            className="ql-button ql-button-white"
            onClick={save}
            disabled={editing}
          >
            {saved ? <Check size={15} /> : <Save size={15} />}
            {saved ? "Saved locally" : "Save circuit"}
          </button>
          <button
            className="ql-button ql-button-primary"
            disabled={running || editing}
            onClick={runBackend}
          >
            <Play size={14} />
            {running ? "Running…" : "Run on Qiskit"}
          </button>
        </div>
      </div>
      <div className="ql-studio-toolbar">
        <label>
          STARTER CIRCUIT
          <select
            className="ql-select"
            aria-label="Load starter circuit"
            value=""
            disabled={editing}
            onChange={(e) => {
              commit(presetCircuit(e.target.value));
              setNotice(
                "Starter circuit loaded. Undo restores your previous circuit.",
              );
            }}
          >
            <option value="" disabled>
              Choose a starting point
            </option>
            <option value="bell">Bell pair · 2 qubits</option>
            <option value="ghz">GHZ state · 3 qubits</option>
            <option value="superposition">Superposition</option>
            <option value="interference">Hadamard interference</option>
            <option value="empty">Empty circuit</option>
          </select>
        </label>
        <div className="ql-studio-toolbar-right">
          <span className="ql-status-label">
            <span className="ql-dot" /> Ideal browser preview
          </span>
          <label>
            QISKIT SHOTS
            <select
              className="ql-select"
              value={shots}
              onChange={(e) => setShots(Number(e.target.value))}
            >
              <option>256</option>
              <option>1024</option>
              <option>4096</option>
            </select>
          </label>
        </div>
      </div>
      <div className="ql-studio-workspace">
        <aside className="ql-gate-palette">
          <div className="ql-panel-title">
            <h2>Gate library</h2>
            <Info size={14} />
          </div>
          <p>Choose a gate, then click a wire. Or drag it onto the circuit.</p>
          <span className="ql-eyebrow">SINGLE QUBIT</span>
          <div className="ql-gate-buttons">
            {STUDIO_GATES.filter((g) => !["CX", "CZ", "SWAP"].includes(g)).map(
              (g) => (
                <button
                  key={g}
                  draggable
                  aria-pressed={selectedGate === g}
                  aria-label={`${g} gate`}
                  title={descriptions[g]}
                  className={`ql-gate-pick ${selectedGate === g ? "selected" : ""} ${g.startsWith("R") ? "rotation" : ""}`}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", g);
                    setSelectedGate(g);
                    setPending(null);
                  }}
                  onClick={() => {
                    setSelectedGate(g);
                    setPending(null);
                  }}
                >
                  {g}
                </button>
              ),
            )}
          </div>
          <span className="ql-eyebrow">TWO QUBITS</span>
          <div className="ql-gate-buttons">
            {(["CX", "CZ", "SWAP"] as const).map((g) => (
              <button
                key={g}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", g);
                  setSelectedGate(g);
                  setPending(null);
                }}
                aria-pressed={selectedGate === g}
                aria-label={`${g} gate`}
                className={`ql-gate-pick paired ${selectedGate === g ? "selected" : ""}`}
                onClick={() => {
                  setSelectedGate(g);
                  setPending(null);
                }}
              >
                {g === "SWAP" ? "⇄" : g}
              </button>
            ))}
          </div>
          {selectedGate.startsWith("R") && (
            <label className="ql-angle-field">
              Rotation (degrees)
              <input
                type="number"
                value={angle}
                onChange={(e) => setAngle(e.target.value)}
              />
            </label>
          )}
          <div className="ql-gate-description">
            <strong>{selectedGate}</strong>
            <p>{descriptions[selectedGate]}</p>
            {["CX", "CZ", "SWAP"].includes(selectedGate) && (
              <small>Select two wires in the same column.</small>
            )}
          </div>
        </aside>
        <section className="ql-canvas-panel" aria-label="Circuit editor">
          <div className="ql-panel-title">
            <h2>
              Quantum circuit{" "}
              <span>
                {circuit.qubits} qubits · {circuit.operations.length} gates
              </span>
            </h2>
            <div className="ql-history-actions">
              <button
                className="ql-icon-button"
                disabled={!past.length || editing}
                onClick={undo}
                aria-label="Undo"
                title="Undo (Ctrl/⌘ Z)"
              >
                <Undo2 size={16} />
                <span>Undo</span>
              </button>
              <button
                className="ql-icon-button"
                disabled={!future.length || editing}
                onClick={redo}
                aria-label="Redo"
                title="Redo (Ctrl/⌘ Shift Z)"
              >
                <Redo2 size={16} />
                <span>Redo</span>
              </button>
              <button
                className="ql-icon-button"
                disabled={!circuit.operations.length || editing}
                onClick={() => {
                  commit({ ...circuit, operations: [] });
                  setNotice("Circuit cleared. Undo restores it.");
                }}
                aria-label="Clear circuit"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <div className="ql-circuit-scroll">
            <div
              className="ql-circuit-grid"
              style={{
                gridTemplateColumns: `65px repeat(${columns}, 55px)`,
                gridTemplateRows: `30px repeat(${circuit.qubits}, 68px)`,
              }}
            >
              <span className="ql-wire-head">QUBIT</span>
              {Array.from({ length: columns }, (_, s) => (
                <span className="ql-step-head" key={s}>
                  {String(s + 1).padStart(2, "0")}
                </span>
              ))}
              {Array.from({ length: circuit.qubits }, (_, q) => (
                <React.Fragment key={q}>
                  <span className="ql-wire-label">
                    q<sub>{q}</sub>
                    <small>|0⟩</small>
                  </span>
                  {Array.from({ length: columns }, (_, s) => {
                    const op = circuit.operations.find(
                      (o) =>
                        o.step === s &&
                        [...o.targets, ...(o.controls || [])].includes(q),
                    );
                    const connection = circuit.operations.find((o) => {
                      const wires = [...o.targets, ...(o.controls || [])];
                      return (
                        o.step === s &&
                        wires.length > 1 &&
                        q >= Math.min(...wires) &&
                        q <= Math.max(...wires)
                      );
                    });
                    const connectedWires = connection
                      ? [...connection.targets, ...(connection.controls || [])]
                      : [];
                    const control = op?.controls?.includes(q);
                    return (
                      <button
                        key={s}
                        style={
                          connection
                            ? ({
                                "--connection-top":
                                  q === Math.min(...connectedWires)
                                    ? "50%"
                                    : "0",
                                "--connection-bottom":
                                  q === Math.max(...connectedWires)
                                    ? "50%"
                                    : "0",
                              } as React.CSSProperties)
                            : undefined
                        }
                        className={`ql-circuit-cell ${connection ? "connected" : ""} ${pending?.qubit === q && pending.step === s ? "pending" : ""} ${pending?.step === s && pending.qubit !== q && !op ? "target-choice" : ""} ${op?.id === inspectedId ? "inspected" : ""}`}
                        aria-label={
                          op
                            ? `Edit ${op.gate} at qubit ${q}, step ${s + 1}${control ? ", control" : ", target"}`
                            : `Place ${selectedGate} at qubit ${q}, step ${s + 1}`
                        }
                        title={
                          op
                            ? `${op.gate} · ${control ? "control" : "target"} · click to edit`
                            : `q${q}, step ${s + 1}`
                        }
                        onClick={() => place(q, s)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const gate = e.dataTransfer.getData(
                            "text/plain",
                          ) as SupportedGate;
                          if (
                            STUDIO_GATES.includes(
                              gate as (typeof STUDIO_GATES)[number],
                            )
                          ) {
                            setSelectedGate(gate);
                            place(q, s, gate);
                          }
                        }}
                      >
                        {op ? (
                          <span
                            className={`ql-placed-gate ${op.controls?.length || op.gate === "SWAP" ? "paired" : ""} ${control ? "control-dot" : ""}`}
                          >
                            {control
                              ? "●"
                              : op.gate === "CX"
                                ? "⊕"
                                : op.gate === "SWAP"
                                  ? "×"
                                  : op.gate === "CZ"
                                    ? "Z"
                                    : op.gate}
                          </span>
                        ) : (
                          <span className="ql-cell-plus">+</span>
                        )}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="ql-canvas-bottom">
            <button
              disabled={circuit.qubits >= MAX_QUBITS || editing}
              onClick={() => commit({ ...circuit, qubits: circuit.qubits + 1 })}
            >
              <Plus size={14} /> Add qubit
            </button>
            <span>Click a gate to edit it · {MAX_QUBITS} qubits maximum</span>
          </div>
          <div className="ql-circuit-instruction">
            <Info size={15} />
            <span>
              {pending
                ? `${pending.gate}: ${pending.gate === "SWAP" ? "first wire" : "control"} q${pending.qubit} selected at step ${pending.step + 1}. Choose a highlighted ${pending.gate === "SWAP" ? "second wire" : "target"}. Escape cancels.`
                : "A circuit reads from left to right. Try a Hadamard gate, then a controlled X."}
            </span>
            {pending && (
              <button
                onClick={() => {
                  setPending(null);
                  setNotice("Placement cancelled.");
                }}
              >
                Cancel
              </button>
            )}
          </div>
          {inspected && (
            <section
              className="ql-gate-inspector"
              aria-label="Selected gate settings"
            >
              <div className="ql-panel-title">
                <h3>Edit {inspected.gate} gate</h3>
                <button onClick={() => setInspectedId(null)}>Close</button>
              </div>
              <p>
                {descriptions[inspected.gate]} Changes update the circuit and
                generated code together.
              </p>
              <div className="ql-inspector-fields">
                {["CX", "CZ", "SWAP"].includes(inspected.gate) && (
                  <label>
                    {inspected.gate === "SWAP"
                      ? "Second qubit"
                      : "Control qubit"}
                    <select
                      className="ql-select"
                      value={gateDraft.control}
                      onChange={(e) =>
                        setGateDraft((d) => ({
                          ...d,
                          control: Number(e.target.value),
                        }))
                      }
                    >
                      {Array.from({ length: circuit.qubits }, (_, q) => (
                        <option key={q} value={q}>
                          q{q}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label>
                  {inspected.gate === "SWAP" ? "First qubit" : "Target qubit"}
                  <select
                    className="ql-select"
                    value={gateDraft.target}
                    onChange={(e) =>
                      setGateDraft((d) => ({
                        ...d,
                        target: Number(e.target.value),
                      }))
                    }
                  >
                    {Array.from({ length: circuit.qubits }, (_, q) => (
                      <option key={q} value={q}>
                        q{q}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Step
                  <input
                    type="number"
                    min="1"
                    max={MAX_STEPS}
                    value={gateDraft.step}
                    onChange={(e) =>
                      setGateDraft((d) => ({
                        ...d,
                        step: Number(e.target.value),
                      }))
                    }
                  />
                </label>
                {inspected.gate.startsWith("R") && (
                  <label>
                    Angle (degrees)
                    <input
                      type="number"
                      value={gateDraft.angle}
                      onChange={(e) =>
                        setGateDraft((d) => ({ ...d, angle: e.target.value }))
                      }
                    />
                  </label>
                )}
              </div>
              <div className="ql-inspector-actions">
                <button
                  className="ql-button ql-button-white"
                  disabled={editing}
                  onClick={() =>
                    commit({
                      ...circuit,
                      operations: circuit.operations.filter(
                        (op) => op.id !== inspected.id,
                      ),
                    })
                  }
                >
                  <Trash2 size={14} /> Delete gate
                </button>
                <button
                  className="ql-button ql-button-primary"
                  disabled={editing}
                  onClick={updateGate}
                >
                  Apply gate changes
                </button>
              </div>
            </section>
          )}
        </section>
      </div>
      {error && (
        <div className="ql-notice error" role="alert">
          <Info size={17} />
          {error}
          <button onClick={() => setError("")} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}
      <div className="ql-studio-notice" role="status">
        {notice ||
          "Tip: The Bell starter has a 50% chance of 00 and a 50% chance of 11."}
      </div>
      <div className="ql-studio-results">
        <section className="ql-panel ql-results-panel">
          <div className="ql-panel-title">
            <h2>State inspector</h2>
            <span className="ql-pill">Exact probabilities</span>
          </div>
          <div className="ql-tabs ql-result-tabs">
            {["Probabilities", "Statevector", "Shot counts"].map((t) => (
              <button
                key={t}
                className={resultTab === t ? "active" : ""}
                aria-pressed={resultTab === t}
                onClick={() => setResultTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          {resultTab === "Probabilities" && (
            <>
              <div
                className="ql-histogram"
                role="img"
                aria-label={preview.states
                  .map(
                    (s) =>
                      `${s.basis}: ${(s.probability * 100).toFixed(1)} percent`,
                  )
                  .join(", ")}
              >
                {preview.states.map((s) => (
                  <div className="ql-histogram-column" key={s.basis}>
                    <span>
                      {s.probability > 0.001
                        ? `${(s.probability * 100).toFixed(0)}%`
                        : "0"}
                    </span>
                    <div className="ql-histogram-track">
                      <i style={{ height: `${s.probability * 100}%` }} />
                    </div>
                    <small>{s.basis}</small>
                  </div>
                ))}
              </div>
              <p className="ql-chart-caption">
                Computational basis · bit order |q{circuit.qubits - 1}…q0⟩ ·
                ideal, noiseless state
              </p>
            </>
          )}
          {resultTab === "Statevector" && (
            <div className="ql-state-table-wrap">
              <table className="ql-state-table">
                <thead>
                  <tr>
                    <th>Basis</th>
                    <th>Real</th>
                    <th>Imaginary</th>
                    <th>Probability</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.states.map((s) => (
                    <tr key={s.basis}>
                      <td>|{s.basis}⟩</td>
                      <td>{s.real.toFixed(4)}</td>
                      <td>{s.imag.toFixed(4)}i</td>
                      <td>{(s.probability * 100).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {resultTab === "Shot counts" && (
            <div className="ql-shot-results">
              {currentResult ? (
                <>
                  <p>
                    {result!.shots} shots · {result!.backend}
                  </p>
                  {Object.entries(result!.counts).map(([basis, count]) => (
                    <div key={basis}>
                      <code>|{basis}⟩</code>
                      <div>
                        <i
                          style={{ width: `${(count / result!.shots) * 100}%` }}
                        />
                      </div>
                      <strong>{count}</strong>
                    </div>
                  ))}
                </>
              ) : (
                <div className="ql-empty">
                  <Play size={24} />
                  <h3>
                    {staleResult
                      ? "Your circuit has changed."
                      : "Ready when you are."}
                  </h3>
                  <p>
                    {staleResult
                      ? "Run again to see counts for this circuit."
                      : "Run on Qiskit to see sampled measurement counts."}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
        <section className="ql-panel ql-bloch-panel">
          <div className="ql-panel-title">
            <h2>Qubit state</h2>
            <select
              aria-label="Inspect qubit"
              className="ql-select"
              value={selectedQubit}
              onChange={(e) => setSelectedQubit(Number(e.target.value))}
            >
              {preview.bloch.map((_, q) => (
                <option key={q} value={q}>
                  q{q}
                </option>
              ))}
            </select>
          </div>
          <BlochPreview {...preview.bloch[selectedQubit]} />
          <div className="ql-bloch-metrics">
            {(["x", "y", "z"] as const).map((axis) => (
              <span key={axis}>
                {axis}
                <strong>{preview.bloch[selectedQubit][axis].toFixed(2)}</strong>
              </span>
            ))}
          </div>
          <p>
            {preview.bloch[selectedQubit].purity < 0.999
              ? "A mixed local state. This qubit is entangled with the rest of the circuit."
              : "A pure local state. The vector points to the surface of the Bloch sphere."}
          </p>
        </section>
      </div>
      <section className="ql-panel ql-code-panel">
        <div className="ql-panel-title">
          <h2>
            <Code2 size={17} /> Behind the circuit
          </h2>
          <div className="ql-code-tools">
            <div className="ql-tabs">
              {(["qasm", "qiskit"] as const).map((f) => (
                <button
                  key={f}
                  disabled={editing}
                  className={format === f ? "active" : ""}
                  onClick={() => setFormat(f)}
                >
                  {f === "qasm" ? "OpenQASM 3" : "Qiskit"}
                </button>
              ))}
            </div>
            <button
              className="ql-icon-button"
              aria-label="Copy code"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(editing ? source : code);
                  setNotice("Code copied.");
                } catch {
                  setError(
                    "Clipboard unavailable. Select and copy the code, or download it.",
                  );
                }
              }}
            >
              <Copy size={15} />
            </button>
            <button
              className="ql-icon-button"
              aria-label="Download code"
              disabled={editing}
              onClick={download}
            >
              <Download size={15} />
            </button>
          </div>
        </div>
        {editing ? (
          <>
            <textarea
              maxLength={20000}
              aria-label="OpenQASM editor"
              spellCheck={false}
              className="ql-code-editor"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
            <div
              className={`ql-code-validation ${codeValidation.error ? "invalid" : ""}`}
              role="status"
              aria-live="polite"
            >
              {codeValidation.error ||
                `Valid OpenQASM · ${codeValidation.circuit?.qubits} qubits · ${codeValidation.circuit?.operations.length} gates. Apply to synchronize the canvas.`}
            </div>
          </>
        ) : (
          <pre className="ql-code-readout">
            <code>
              {code.split("\n").map((line, i) => (
                <span key={i}>
                  <i>{i + 1}</i>
                  {line || " "}
                </span>
              ))}
            </code>
          </pre>
        )}
        <div className="ql-code-footer">
          <span>
            {format === "qasm"
              ? "Editable unitary subset · 12 gates · angles in radians"
              : "Generated Python · run in your own Qiskit environment"}
          </span>
          <div>
            {editing ? (
              <>
                <button
                  className="ql-button ql-button-white"
                  onClick={() => {
                    setEditing(false);
                    setError("");
                  }}
                >
                  Discard edits
                </button>
                <button
                  className="ql-button ql-button-primary"
                  disabled={!!codeValidation.error}
                  onClick={() => {
                    try {
                      const next = codeValidation.circuit!;
                      if (source !== circuitCode(circuit, "qasm")) commit(next);
                      setEditing(false);
                      setNotice("Circuit updated from OpenQASM.");
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  Apply to circuit <ArrowRight size={14} />
                </button>
              </>
            ) : (
              format === "qasm" && (
                <button
                  className="ql-button ql-button-white"
                  onClick={() => {
                    setSource(code);
                    setEditing(true);
                    setInspectedId(null);
                    setPending(null);
                  }}
                >
                  Edit code <Code2 size={14} />
                </button>
              )
            )}
          </div>
        </div>
      </section>
      <div className="ql-studio-learn">
        <Sparkles size={18} />
        <p>Want to understand what you just built?</p>
        <Link to="/labs/guided/bell-state">
          Explore the Bell state lab <ChevronRight size={15} />
        </Link>
        <Link to="/qasm-visualizer">
          Advanced QASM visualizer <ChevronRight size={15} />
        </Link>
      </div>
    </div>
  );
}
