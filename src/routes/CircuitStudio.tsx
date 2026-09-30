import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Code2,
  Copy,
  Download,
  GitCompare,
  Info,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  Save,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  Undo2,
  Zap,
} from "lucide-react";
import type {
  CircuitIR,
  GateOperation,
  NoiseConfig,
  NormalizedSimulationResult,
  SupportedGate,
} from "../types/quantum";
import {
  circuitCode,
  isRotationGate,
  MAX_QUBITS,
  MAX_STEPS,
  parseStudioQasm,
  presetCircuit,
  previewCircuit,
  STUDIO_GATES,
  validateStudioCircuit,
  type CodeFormat,
} from "../lib/studio";
import { useQuantumSession } from "../providers/QuantumSessionProvider";
import { apiUrl } from "../api/client";
import {
  runParityCheck,
  fetchSharedCircuit,
  forkCircuit,
  saveUserCircuit,
  shareCircuit,
  type ParityResponse,
} from "../api/circuit";
import { SyntaxHighlightedEditor } from "../components/circuit/SyntaxHighlightedEditor";
import { useAuth } from "../providers/AuthProvider";
import WhatChangedModal from "../components/pedagogy/WhatChangedModal";
import { PulseVisualizer } from "../components/PulseVisualizer";

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
  MEASURE: "Measure a qubit into the matching classical bit. This changes subsequent quantum evolution.",
  RESET: "Reset a qubit to |0⟩. This is non-unitary and can destroy coherence.",
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
  const { circuitId } = useParams();
  const { token, user, openAuthModal } = useAuth();
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
  const [format, setFormat] = useState<CodeFormat>("qasm");
  const [editing, setEditing] = useState(false);
  const [source, setSource] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [parityRunning, setParityRunning] = useState(false);
  const [shots, setShots] = useState(1024);
  const [simulationBackend, setSimulationBackend] = useState<
    "qiskit-aer" | "cirq" | "pennylane" | "qbraid"
  >("qiskit-aer");
  const [result, setResult] = useState<NormalizedSimulationResult | null>(null);
  const [resultCircuit, setResultCircuit] = useState("");
  const [resultBackendRequest, setResultBackendRequest] = useState("");
  const [parity, setParity] = useState<ParityResponse | null>(null);
  const [parityCircuit, setParityCircuit] = useState("");
  const [resultTab, setResultTab] = useState("Probabilities");
  const [noiseConfig, setNoiseConfig] = useState<NoiseConfig>({
    enabled: false,
    modelType: "thermal_relaxation",
    t1_us: 100.0,
    t2_us: 80.0,
    gate_time_ns: 50.0,
    two_qubit_gate_time_ns: 200.0,
    depolarizing_p: 0.015,
    readout_error_p: 0.02,
  });
  const [noiseAdvancedMode, setNoiseAdvancedMode] = useState(false);
  const [showNoiseDrawer, setShowNoiseDrawer] = useState(false);
  const [selectedQubit, setSelectedQubit] = useState(0);
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(circuitId ?? null);
  const [savedOwnerId, setSavedOwnerId] = useState<string | null>(null);
  const [circuitTitle, setCircuitTitle] = useState("Untitled circuit");
  const [lastExecutedCircuit, setLastExecutedCircuit] = useState<CircuitIR | null>(null);
  const [showWhatChanged, setShowWhatChanged] = useState(false);
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
  const currentResult =
    result &&
    resultCircuit === signature &&
    resultBackendRequest === simulationBackend;
  const staleResult = result && !currentResult;
  const currentParity = parity && parityCircuit === signature;
  const staleParity = parity && !currentParity;
  useEffect(() => {
    const dispatchContext = () => {
      window.dispatchEvent(
        new CustomEvent("quantum-lens:studio-context", {
          detail: {
            circuit,
            simulationResult: currentResult ? result : undefined,
          },
        }),
      );
    };
    dispatchContext();
    window.addEventListener("quantum-lens:request-studio-context", dispatchContext);
    return () => {
      window.removeEventListener("quantum-lens:request-studio-context", dispatchContext);
    };
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
    if (!circuitId) return;
    let active = true;
    fetchSharedCircuit(circuitId).then(shared => {
      if (!active) return;
      validateStudioCircuit(shared.circuit_ir);
      setCircuit(shared.circuit_ir);
      setCircuitTitle(shared.title);
      setSavedId(shared.id);
      setSavedOwnerId(shared.author_id);
      setSaved(true);
      setNotice(`Loaded shared circuit by ${shared.author_name}.`);
    }).catch(error => { if (active) setError(error instanceof Error ? error.message : "Could not load shared circuit"); });
    return () => { active = false; };
  }, [circuitId]);

  // Handle circuit loading from Aria AI Mentor (event or session queue)
  useEffect(() => {
    try {
      const queued = sessionStorage.getItem("ql_mentor_circuit");
      if (queued) {
        const parsed = JSON.parse(queued);
        const normalized: CircuitIR = {
          version: "1.0",
          qubits: Math.min(MAX_QUBITS, Math.max(1, parsed.qubits || 2)),
          classicalBits: Math.max(1, parsed.classicalBits || parsed.qubits || 2),
          operations: (parsed.operations || []).map((op: any, idx: number) => ({
            id: op.id || `op-ai-${idx}-${Date.now().toString(36)}`,
            gate: (op.gate || "H").toUpperCase(),
            targets: Array.isArray(op.targets) ? op.targets : [0],
            controls: Array.isArray(op.controls) ? op.controls : [],
            step: Number.isInteger(op.step) ? op.step : idx,
            params: op.params?.theta !== undefined ? { theta: Number(op.params.theta) } : undefined,
            classicalTargets: op.classicalTargets || (op.gate === "MEASURE" ? [0] : undefined),
          })),
        };
        validateStudioCircuit(normalized);
        commit(normalized);
        setNotice("Circuit loaded from Aria AI Mentor.");
        sessionStorage.removeItem("ql_mentor_circuit");
      }
    } catch {
      sessionStorage.removeItem("ql_mentor_circuit");
    }

    const handleLoadCircuit = (e: Event) => {
      const custom = e as CustomEvent<{ circuit: any }>;
      if (custom.detail?.circuit) {
        try {
          const raw = custom.detail.circuit;
          const normalized: CircuitIR = {
            version: "1.0",
            qubits: Math.min(MAX_QUBITS, Math.max(1, raw.qubits || 2)),
            classicalBits: Math.max(1, raw.classicalBits || raw.qubits || 2),
            operations: (raw.operations || []).map((op: any, idx: number) => ({
              id: op.id || `op-ai-${idx}-${Date.now().toString(36)}`,
              gate: (op.gate || "H").toUpperCase(),
              targets: Array.isArray(op.targets) ? op.targets : [0],
              controls: Array.isArray(op.controls) ? op.controls : [],
              step: Number.isInteger(op.step) ? op.step : idx,
              params: op.params?.theta !== undefined ? { theta: Number(op.params.theta) } : undefined,
              classicalTargets: op.classicalTargets || (op.gate === "MEASURE" ? [0] : undefined),
            })),
          };
          validateStudioCircuit(normalized);
          commit(normalized);
          setNotice("Circuit loaded from Aria AI Mentor.");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not load AI circuit");
        }
      }
    };

    window.addEventListener("quantum-lens:load-circuit", handleLoadCircuit);
    return () => window.removeEventListener("quantum-lens:load-circuit", handleLoadCircuit);
  }, []);
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
    if (isRotationGate(gate) && (!angle.trim() || !Number.isFinite(theta))) {
      setError("Enter a valid rotation angle.");
      return;
    }
    commit({
      ...circuit,
      classicalBits: gate === "MEASURE" ? Math.max(circuit.classicalBits, circuit.qubits) : circuit.classicalBits,
      operations: [
        ...circuit.operations,
        {
          id: crypto.randomUUID(),
          gate,
          targets: [qubit],
          step,
          ...(gate === "MEASURE" ? { classicalTargets: [qubit] } : {}),
          ...(isRotationGate(gate) ? { params: { theta } } : {}),
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
      isRotationGate(inspected.gate) &&
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
      ...(isRotationGate(inspected.gate) ? { params: { theta } } : {}),
      ...(inspected.gate === "MEASURE" ? { classicalTargets: [gateDraft.target] } : {}),
    };
    commit({
      ...circuit,
      operations: circuit.operations.map((op) =>
        op.id === next.id ? next : op,
      ),
    });
  }
  async function save() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(circuit));
      if (!token) {
        setSaved(true);
        setNotice("Draft saved in this browser. Sign in to save it to your account.");
        openAuthModal("login");
        return;
      }
      const savedCircuit = await saveUserCircuit(token, circuitTitle.trim() || "Untitled circuit", "Created in Quantum Lens Circuit Studio", circuit);
      setSavedId(savedCircuit.id);
      setSavedOwnerId(user?.id ?? null);
      setSaved(true);
      setNotice("Circuit saved to your account.");
    } catch {
      setError("The circuit could not be saved. Download the QASM to keep a copy.");
    }
  }
  async function share() {
    if (!token || !savedId) { setError("Save this circuit to your account before sharing it."); return; }
    try {
      const shared = await shareCircuit(token, savedId, true);
      const url = `${window.location.origin}${shared.permalink_url}`;
      await navigator.clipboard.writeText(url);
      setNotice("Public read-only link copied. Other learners can fork it.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not share circuit"); }
  }
  async function forkLoaded() {
    if (!token || !circuitId) { openAuthModal("login"); return; }
    try {
      const forked = await forkCircuit(token, circuitId, `${circuitTitle} — fork`);
      setSavedId(forked.id); setSavedOwnerId(user?.id ?? null); setSaved(true); setCircuitTitle(forked.title);
      setNotice("Fork saved to your account with source attribution.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not fork circuit"); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([code], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    const ext = format === "qasm" ? "quantum-lens.qasm" : `quantum-lens-${format}.py`;
    a.download = ext;
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
        apiUrl("/api/v1/quantum/simulate"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            circuit,
            shots,
            backend: simulationBackend,
            noise: noiseConfig.enabled ? noiseConfig : undefined,
          }),
          signal: controller.signal,
        },
      );
      if (!res.ok) {
        const payload = await res.json().catch(() => null) as { detail?: string } | null;
        throw new Error(payload?.detail || `${simulationBackend} execution failed.`);
      }
      if (!res.headers.get("content-type")?.includes("application/json"))
        throw new Error("Simulator returned an invalid response.");
      const data = (await res.json()) as NormalizedSimulationResult;
      if (!data.counts || !data.backend)
        throw new Error("Invalid simulator response");
      setResult(data);
      setResultCircuit(signature);
      setResultBackendRequest(simulationBackend);
      setLastExecutedCircuit(JSON.parse(JSON.stringify(circuit)));
      setResultTab(data.noisyCounts ? "Ideal vs Noisy" : "Shot counts");
      recordCircuitRun();
      setNotice(
        `Completed ${data.shots} shots with ${data.backend}${
          data.noisyCounts && data.fidelity !== undefined
            ? ` · Physical Noise Fidelity: ${(data.fidelity * 100).toFixed(1)}%`
            : ""
        }.`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : `${simulationBackend} could not execute this circuit.`,
      );
    } finally {
      clearTimeout(timeout);
      setRunning(false);
    }
  }

  async function compareFrameworks() {
    setParityRunning(true);
    setError("");
    try {
      const data = await runParityCheck(circuit, shots, 0.01);
      setParity(data);
      setParityCircuit(signature);
      setNotice(
        data.all_pass
          ? "Qiskit, PennyLane, and Cirq agree within the configured tolerance."
          : "A cross-framework difference exceeded the configured tolerance.",
      );
    } catch {
      setError(
        "Cross-framework verification could not run. Start the Python backend with Qiskit, PennyLane, and Cirq installed.",
      );
    } finally {
      setParityRunning(false);
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
          <input className="ql-input" aria-label="Circuit name" value={circuitTitle} onChange={event => { setCircuitTitle(event.target.value); setSaved(false); }} />
          <button
            className="ql-button ql-button-white"
            onClick={save}
            disabled={editing}
          >
            {saved ? <Check size={15} /> : <Save size={15} />}
            {saved ? "Saved" : "Save circuit"}
          </button>
          {savedId && token && savedOwnerId === user?.id && <button className="ql-button ql-button-white" onClick={share}><Share2 size={15}/> Share</button>}
          {circuitId && user && savedOwnerId !== user.id && <button className="ql-button ql-button-white" onClick={forkLoaded}>Fork to my workspace</button>}
          <button
            className="ql-button ql-button-primary"
            disabled={
              running ||
              parityRunning ||
              editing ||
              (simulationBackend !== "qiskit-aer" && Boolean(preview.truncatedAt))
            }
            onClick={runBackend}
            title={
              simulationBackend !== "qiskit-aer" && preview.truncatedAt
                ? "Cirq and PennyLane currently execute unitary circuits. Select Qiskit Aer for measurement or reset."
                : undefined
            }
          >
            <Play size={14} />
            {running
              ? "Running…"
              : `Run on ${
                  simulationBackend === "qiskit-aer"
                    ? "Qiskit"
                    : simulationBackend === "cirq"
                      ? "Cirq"
                      : simulationBackend === "pennylane"
                        ? "PennyLane"
                        : "qBraid"
                }`}
          </button>
          <button
            className="ql-button ql-button-white"
            disabled={running || parityRunning || editing || Boolean(preview.truncatedAt)}
            onClick={compareFrameworks}
            title={preview.truncatedAt ? "Cross-engine parity currently covers unitary circuits. Remove measurement/reset to compare." : undefined}
          >
            <GitCompare size={14} />
            {parityRunning ? "Comparing…" : "Compare engines"}
          </button>
          {lastExecutedCircuit && JSON.stringify(circuit) !== JSON.stringify(lastExecutedCircuit) && (
            <button
              className="ql-button"
              onClick={() => setShowWhatChanged(true)}
              title="Compare circuit modifications with the last executed simulation (State, Probabilities & Physics Diff)"
              style={{
                borderColor: "#06b6d4",
                background: "rgba(6, 182, 212, 0.18)",
                color: "#67e8f9",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <GitCompare size={14} color="#22d3ee" />
              Why did my result change?
            </button>
          )}
          <button
            className={`ql-button ${noiseConfig.enabled ? "ql-button-primary" : "ql-button-white"}`}
            disabled={running || editing}
            onClick={() => {
              setNoiseConfig((prev) => ({ ...prev, enabled: !prev.enabled }));
              setShowNoiseDrawer(true);
            }}
            title="Toggle realistic environmental decoherence and Kraus noise modeling"
            style={{
              borderColor: noiseConfig.enabled ? "#f59e0b" : undefined,
              background: noiseConfig.enabled ? "rgba(245, 158, 11, 0.18)" : undefined,
              color: noiseConfig.enabled ? "#fde68a" : undefined,
            }}
          >
            <Zap size={14} color={noiseConfig.enabled ? "#f59e0b" : undefined} />
            Physical Noise: {noiseConfig.enabled ? "ON" : "OFF"}
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
            <span className="ql-dot" /> {preview.truncatedAt ? `Pure-state preview stops before ${preview.truncatedAt.toLowerCase()}` : "Ideal browser preview"}
          </span>
          <label>
            EXECUTION BACKEND
            <select
              className="ql-select"
              aria-label="Execution backend"
              value={simulationBackend}
              onChange={(event) =>
                setSimulationBackend(
                  event.target.value as "qiskit-aer" | "cirq" | "pennylane" | "qbraid",
                )
              }
            >
              <option value="qiskit-aer">Qiskit Aer · full circuit</option>
              <option value="cirq">Cirq Simulator · unitary</option>
              <option value="pennylane">PennyLane · unitary</option>
              <option value="qbraid">qBraid Hub · unitary</option>
            </select>
          </label>
          <label>
            SHOTS
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

      {showNoiseDrawer && (
        <div className={`ql-noise-drawer ${noiseConfig.enabled ? "active" : ""}`}>
          <div className="ql-noise-header">
            <div className="ql-noise-header-left">
              <h2>
                <Zap size={16} color="#f59e0b" />
                Physical Kraus Noise & Thermal Decoherence Engine
              </h2>
              <span className={`ql-noise-badge ${noiseConfig.enabled ? "enabled" : "disabled"}`}>
                {noiseConfig.enabled ? "Active on Qiskit Aer" : "Disabled (Ideal)"}
              </span>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                className="ql-button ql-button-white"
                style={{ fontSize: "10px", padding: "4px 8px" }}
                onClick={() => setNoiseAdvancedMode(!noiseAdvancedMode)}
              >
                <Sliders size={12} /> {noiseAdvancedMode ? "Simple Sliders" : "Advanced Kraus"}
              </button>
              <button
                className={`ql-button ${noiseConfig.enabled ? "ql-button-primary" : "ql-button-white"}`}
                style={{
                  fontSize: "10px",
                  padding: "4px 12px",
                  borderColor: noiseConfig.enabled ? "#f59e0b" : undefined,
                  background: noiseConfig.enabled ? "rgba(245, 158, 11, 0.25)" : undefined,
                  color: noiseConfig.enabled ? "#fde68a" : undefined,
                }}
                onClick={() => setNoiseConfig((n) => ({ ...n, enabled: !n.enabled }))}
              >
                {noiseConfig.enabled ? "Turn Noise OFF" : "Turn Noise ON"}
              </button>
              <button
                onClick={() => setShowNoiseDrawer(false)}
                className="ql-button ql-button-white"
                style={{ fontSize: "12px", padding: "2px 8px" }}
                title="Minimize noise panel"
              >
                ×
              </button>
            </div>
          </div>

          <div className="ql-noise-body">
            <div className="ql-noise-models-grid">
              {[
                { id: "thermal_relaxation", label: "Energy Relaxation — T₁", sub: "Spontaneous |0⟩ decay", icon: "🌡️" },
                { id: "dephasing", label: "Dephasing / Coherence — T₂", sub: "Phase angle diffusion", icon: "🌊" },
                { id: "depolarizing", label: "Depolarizing (p)", sub: "Isotropic Pauli channel", icon: "🎲" },
                { id: "readout_error", label: "Readout Error (pro)", sub: "Detector bit-flip noise", icon: "📡" },
                { id: "combined", label: "Combined NISQ", sub: "Full transmon physics", icon: "⚡" },
              ].map((m) => (
                <button
                  key={m.id}
                  className={`ql-noise-model-btn ${noiseConfig.modelType === m.id ? "active" : ""}`}
                  onClick={() => setNoiseConfig((n) => ({ ...n, modelType: m.id as any }))}
                >
                  <span>{m.icon} {m.label}</span>
                  <small>{m.sub}</small>
                </button>
              ))}
            </div>

            <div className="ql-noise-params-row">
              {["thermal_relaxation", "combined"].includes(noiseConfig.modelType) && (
                <div className="ql-noise-param-item">
                  <label>
                    <span>Energy Relaxation T₁:</span>
                    <strong>{noiseConfig.t1_us.toFixed(1)} μs</strong>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="500"
                    step="1"
                    value={noiseConfig.t1_us}
                    onChange={(e) => setNoiseConfig((n) => ({ ...n, t1_us: Number(e.target.value) }))}
                  />
                </div>
              )}

              {["thermal_relaxation", "dephasing", "combined"].includes(noiseConfig.modelType) && (
                <div className="ql-noise-param-item">
                  <label>
                    <span>Dephasing / Coherence T₂:</span>
                    <strong>{noiseConfig.t2_us.toFixed(1)} μs</strong>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="500"
                    step="1"
                    value={noiseConfig.t2_us}
                    onChange={(e) => setNoiseConfig((n) => ({ ...n, t2_us: Number(e.target.value) }))}
                  />
                </div>
              )}

              {["depolarizing"].includes(noiseConfig.modelType) && (
                <div className="ql-noise-param-item">
                  <label>
                    <span>Depolarizing Error p:</span>
                    <strong>{(noiseConfig.depolarizing_p * 100).toFixed(2)}%</strong>
                  </label>
                  <input
                    type="range"
                    min="0.001"
                    max="0.25"
                    step="0.001"
                    value={noiseConfig.depolarizing_p}
                    onChange={(e) => setNoiseConfig((n) => ({ ...n, depolarizing_p: Number(e.target.value) }))}
                  />
                </div>
              )}

              {["readout_error", "combined"].includes(noiseConfig.modelType) && (
                <div className="ql-noise-param-item">
                  <label>
                    <span>Readout Error Rate:</span>
                    <strong>{(noiseConfig.readout_error_p * 100).toFixed(1)}%</strong>
                  </label>
                  <input
                    type="range"
                    min="0.005"
                    max="0.20"
                    step="0.005"
                    value={noiseConfig.readout_error_p}
                    onChange={(e) => setNoiseConfig((n) => ({ ...n, readout_error_p: Number(e.target.value) }))}
                  />
                </div>
              )}

              <div className="ql-noise-param-item">
                <label>
                  <span>1-Qubit Gate Duration:</span>
                  <strong>{noiseConfig.gate_time_ns} ns</strong>
                </label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="5"
                  value={noiseConfig.gate_time_ns}
                  onChange={(e) => setNoiseConfig((n) => ({ ...n, gate_time_ns: Number(e.target.value) }))}
                />
              </div>
            </div>

            {noiseAdvancedMode && (
              <div className="ql-noise-math-box">
                <div className="ql-noise-math-header">
                  <span>🔬 Open Quantum System Master Equation & Kraus Representation</span>
                  <span className={`ql-lindblad-indicator ${noiseConfig.t2_us <= 2 * noiseConfig.t1_us ? "valid" : "warning"}`}>
                    {noiseConfig.t2_us <= 2 * noiseConfig.t1_us ? (
                      <>
                        <ShieldCheck size={12} /> Lindblad Bound Valid (T₂ ≤ 2T₁)
                      </>
                    ) : (
                      <>
                        <ShieldAlert size={12} /> T₂ {">"} 2T₁ (Simulator clamps to 2T₁ for physics validity)
                      </>
                    )}
                  </span>
                </div>
                <div>
                  {noiseConfig.modelType === "thermal_relaxation" && (
                    <>
                      ρ(t) = E₀ ρ E₀† + E₁ ρ E₁† &emsp;|&emsp; γ = 1 - e^(-t_gate/T₁) = {(1 - Math.exp(-(noiseConfig.gate_time_ns * 1e-9) / (noiseConfig.t1_us * 1e-6))).toExponential(3)}
                    </>
                  )}
                  {noiseConfig.modelType === "dephasing" && (
                    <>
                      ρ₀₁(t) = ρ₀₁(0) · e^(-t_gate/T_φ) &emsp;|&emsp; 1/T₂ = 1/(2T₁) + 1/T_φ
                    </>
                  )}
                  {noiseConfig.modelType === "depolarizing" && (
                    <>
                      E(ρ) = (1 - p)ρ + (p/3)(XρX + YρY + ZρZ) &emsp;|&emsp; Total Gate Error = {(noiseConfig.depolarizing_p * 100).toFixed(2)}%
                    </>
                  )}
                  {noiseConfig.modelType === "readout_error" && (
                    <>
                      P(measure 1 | state 0) = P(measure 0 | state 1) = {(noiseConfig.readout_error_p * 100).toFixed(1)}% (Classical Detector Noise)
                    </>
                  )}
                  {noiseConfig.modelType === "combined" && (
                    <>
                      Full NISQ Channel: Thermal relaxation on unitaries (T₁={noiseConfig.t1_us}μs, T₂={noiseConfig.t2_us}μs) + Readout confusion (p_ro={(noiseConfig.readout_error_p * 100).toFixed(1)}%)
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="ql-studio-workspace">
        <aside className="ql-gate-palette">
          <div className="ql-panel-title">
            <h2>Gate library</h2>
            <Info size={14} />
          </div>
          <p>Choose a gate, then click a wire. Or drag it onto the circuit.</p>
          <span className="ql-eyebrow">SINGLE QUBIT</span>
          <div className="ql-gate-buttons">
            {STUDIO_GATES.filter((g) => !["CX", "CZ", "SWAP", "MEASURE", "RESET"].includes(g)).map(
              (g) => (
                <button
                  key={g}
                  draggable
                  aria-pressed={selectedGate === g}
                  aria-label={`${g} gate`}
                  title={descriptions[g]}
                  className={`ql-gate-pick ${selectedGate === g ? "selected" : ""} ${isRotationGate(g) ? "rotation" : ""}`}
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
          <span className="ql-eyebrow">OPERATIONS</span>
          <div className="ql-gate-buttons" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <button
              draggable
              aria-pressed={selectedGate === "MEASURE"}
              aria-label="Measurement operation"
              title={descriptions["MEASURE"]}
              className={`ql-gate-pick ${selectedGate === "MEASURE" ? "selected" : ""}`}
              style={{ width: "100%", fontSize: "11px", fontWeight: 600, letterSpacing: "0.03em" }}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", "MEASURE");
                setSelectedGate("MEASURE");
                setPending(null);
              }}
              onClick={() => {
                setSelectedGate("MEASURE");
                setPending(null);
              }}
            >
              MEASURE
            </button>
            <button
              draggable
              aria-pressed={selectedGate === "RESET"}
              aria-label="Reset to zero state"
              title={descriptions["RESET"]}
              className={`ql-gate-pick ${selectedGate === "RESET" ? "selected" : ""}`}
              style={{ width: "100%", fontSize: "11px", fontWeight: 600, letterSpacing: "0.03em" }}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", "RESET");
                setSelectedGate("RESET");
                setPending(null);
              }}
              onClick={() => {
                setSelectedGate("RESET");
                setPending(null);
              }}
            >
              |0⟩ RESET
            </button>
          </div>
          {isRotationGate(selectedGate) && (
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
                {isRotationGate(inspected.gate) && (
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

              {/* ── Pulse Coupling Drawer ─────────────────────────────── */}
              <div style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: "1px solid rgba(51,65,85,0.5)",
              }}>
                <PulseVisualizer gate={inspected} />
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
            <span className="ql-pill">
              {preview.truncatedAt ? "Pre-operation pure state" : "Exact probabilities"}
            </span>
          </div>
          <div className="ql-tabs ql-result-tabs">
            {[
              "Probabilities",
              "Statevector",
              "Shot counts",
              ...(currentResult && result?.noisyCounts ? ["Ideal vs Noisy"] : []),
            ].map((t) => (
              <button
                key={t}
                className={resultTab === t ? "active" : ""}
                aria-pressed={resultTab === t}
                onClick={() => setResultTab(t)}
                style={
                  t === "Ideal vs Noisy"
                    ? { color: "#f59e0b", fontWeight: 600 }
                    : undefined
                }
              >
                {t === "Ideal vs Noisy" ? "⚡ Ideal vs Noisy" : t}
              </button>
            ))}
          </div>
          {preview.truncatedAt && (
            <p className="ql-chart-caption">
              Pure-state views show the circuit immediately before the first {preview.truncatedAt.toLowerCase()} operation. Open Shot counts after running Qiskit for the complete circuit result.
            </p>
          )}
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
                {preview.truncatedAt ? " ideal state before the first non-unitary operation" : " ideal, noiseless state"}
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
                      : `Run on ${
                          simulationBackend === "qiskit-aer"
                            ? "Qiskit"
                            : simulationBackend === "cirq"
                              ? "Cirq"
                              : "PennyLane"
                        } to see sampled measurement counts.`}
                  </p>
                  {staleResult && lastExecutedCircuit && (
                    <button
                      style={{
                        marginTop: "10px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#67e8f9",
                        background: "rgba(6,182,212,0.12)",
                        border: "1px solid rgba(6,182,212,0.35)",
                        borderRadius: "8px",
                        padding: "6px 14px",
                        cursor: "pointer",
                      }}
                      onClick={() => setShowWhatChanged(true)}
                    >
                      <GitCompare size={13} color="#22d3ee" />
                      Why did my result change?
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          {resultTab === "Ideal vs Noisy" && (
            <div className="ql-dual-results-wrap">
              {currentResult && result?.noisyCounts ? (
                <>
                  <div className="ql-dual-results-banner">
                    <div className="ql-fidelity-meter">
                      <span style={{ fontSize: "11px", color: "var(--ql-muted)" }}>
                        State Fidelity:
                      </span>
                      <span
                        className={`ql-fidelity-score ${
                          (result.fidelity ?? 1) >= 0.9
                            ? "high"
                            : (result.fidelity ?? 1) >= 0.7
                              ? "medium"
                              : "low"
                        }`}
                      >
                        {((result.fidelity ?? 1) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="ql-dual-legend">
                      <div className="ql-legend-item">
                        <span className="ql-legend-color ideal" />
                        <span>Ideal Prob</span>
                      </div>
                      <div className="ql-legend-item">
                        <span className="ql-legend-color noisy" />
                        <span>Physical Noisy ({result.backend})</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="ql-dual-histogram"
                    role="img"
                    aria-label="Ideal vs Noisy probability comparison"
                  >
                    {Object.entries(result.probabilities).map(([basis, idealP]) => {
                      const noisyCount = result.noisyCounts?.[basis] ?? 0;
                      const noisyP =
                        result.noisyProbabilities?.[basis] ??
                        noisyCount / result.shots;
                      const delta = noisyP - idealP;
                      const deltaPct = (delta * 100).toFixed(1);
                      return (
                        <div className="ql-dual-column" key={basis}>
                          <div className="ql-dual-values">
                            <span className="ideal-val">
                              {(idealP * 100).toFixed(0)}%
                            </span>
                            <span className="noisy-val">
                              {(noisyP * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="ql-dual-bars-track">
                            <i
                              className="ql-bar-ideal"
                              style={{
                                height: `${Math.max(1, idealP * 100)}%`,
                              }}
                              title={`Ideal: ${(idealP * 100).toFixed(2)}%`}
                            />
                            <i
                              className="ql-bar-noisy"
                              style={{
                                height: `${Math.max(1, noisyP * 100)}%`,
                              }}
                              title={`Noisy: ${(noisyP * 100).toFixed(2)}% (${noisyCount} shots)`}
                            />
                          </div>
                          <small>|{basis}⟩</small>
                          <span
                            className={`ql-delta-chip ${
                              Math.abs(delta) < 0.01
                                ? "neutral"
                                : delta > 0
                                  ? "leakage"
                                  : "loss"
                            }`}
                          >
                            {delta >= 0 ? `+${deltaPct}%` : `${deltaPct}%`}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {result.noiseExplanation && (
                    <div className="ql-noise-explanation-card">
                      <strong>⚛️ Physical Noise Diagnosis: </strong>
                      {result.noiseExplanation}
                    </div>
                  )}
                </>
              ) : (
                <div className="ql-empty">
                  <Zap size={24} color="#f59e0b" />
                  <h3>Physical Noise Simulation</h3>
                  <p>
                    {staleResult
                      ? "Your circuit has changed. Run on Qiskit Aer to see noisy experimental comparison."
                      : "Enable Physical Noise in the toolbar and click 'Run on Qiskit' to observe experimental Kraus decay."}
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
      <section className="ql-panel ql-parity-panel" aria-label="Cross-framework verification">
        <div className="ql-panel-title">
          <h2>
            <GitCompare size={17} /> Cross-framework evidence
          </h2>
          <span className="ql-pill">Simulator-derived</span>
        </div>
        {!currentParity ? (
          <div className="ql-parity-empty">
            <div>
              <h3>{staleParity ? "The circuit changed after verification." : "Verify one circuit across three independent engines."}</h3>
              <p>
                Qiskit Aer is the reference. PennyLane and Cirq independently translate the same CircuitIR; total variation distance must remain at or below 0.01.
              </p>
            </div>
            <button
              className="ql-button ql-button-primary"
              disabled={parityRunning || running || editing || Boolean(preview.truncatedAt)}
              onClick={compareFrameworks}
              title={preview.truncatedAt ? "Cross-engine parity currently covers unitary circuits. Remove measurement/reset to compare." : undefined}
            >
              <GitCompare size={14} />
              {parityRunning ? "Comparing…" : staleParity ? "Verify again" : "Run parity check"}
            </button>
          </div>
        ) : (
          <div className="ql-parity-content">
            <div className="ql-framework-grid">
              {Object.entries(parity!.circuits).map(([framework, frameworkResult]) => (
                <article key={framework} className={frameworkResult.status === "success" ? "available" : "unavailable"}>
                  <span>{framework === "qiskit" ? "Reference engine" : "Independent adapter"}</span>
                  <h3>{framework === "qiskit" ? "Qiskit Aer" : framework === "pennylane" ? "PennyLane" : "Cirq"}</h3>
                  <p>{frameworkResult.backend || frameworkResult.error || frameworkResult.status}</p>
                  <strong>{frameworkResult.status === "success" ? "Executed" : "Unavailable"}</strong>
                </article>
              ))}
            </div>
            <div className="ql-parity-checks">
              {parity!.parity_checks.map((check) => (
                <div key={`${check.framework_a}-${check.framework_b}`}>
                  <span>{check.framework_a} ↔ {check.framework_b}</span>
                  <code>TVD {check.tvd.toFixed(6)} / {check.tolerance.toFixed(2)}</code>
                  <strong className={check.pass ? "pass" : "fail"}>{check.pass ? "PASS" : "REVIEW"}</strong>
                </div>
              ))}
            </div>
            <p className="ql-provenance-note">
              Provenance: probabilities were computed by the named local simulator engines. This comparison does not represent cloud or quantum-hardware execution.
            </p>
          </div>
        )}
      </section>
      <section className="ql-panel ql-code-panel">
        <div className="ql-panel-title">
          <h2>
            <Code2 size={17} /> Behind the circuit
          </h2>
          <div className="ql-code-tools">
            <div className="ql-tabs">
              {([
                { id: "qasm", label: "OpenQASM 3" },
                { id: "qiskit", label: "Qiskit" },
                { id: "cirq", label: "Cirq" },
                { id: "pennylane", label: "PennyLane" },
              ] as { id: CodeFormat; label: string }[]).map((f) => (
                <button
                  key={f.id}
                  disabled={editing}
                  className={format === f.id ? "active" : ""}
                  onClick={() => { setFormat(f.id); if (editing) setEditing(false); }}
                >
                  {f.label}
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
            <SyntaxHighlightedEditor
              value={source}
              onChange={setSource}
              language="qasm"
              placeholder="// Enter OpenQASM 3.0 code..."
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
          <SyntaxHighlightedEditor
            value={code}
            readOnly={true}
            language={format === "qasm" ? "qasm" : "qiskit"}
            key={format}
          />
        )}
        <div className="ql-code-footer">
          <span>
            {format === "qasm"
              ? "Editable OpenQASM subset · gates, measurement, reset · angles in radians"
              : format === "qiskit"
              ? "Generated Qiskit Python · run in your own Qiskit / Aer environment"
              : format === "cirq"
              ? "Generated Cirq Python · LineQubit layout · copy-paste into cirq-core environment"
              : "Generated PennyLane Python · default.qubit device · copy-paste into a PennyLane environment"}
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
              format === "qasm" ? (
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
              ) : (
                <span style={{ fontSize: "11px", color: "var(--ql-muted, #94a3b8)", fontStyle: "italic" }}>
                  Copy &amp; paste into your{" "}
                  {format === "qiskit" ? "Qiskit" : format === "cirq" ? "Cirq" : "PennyLane"} environment
                </span>
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

      {/* What Changed? 4-Layer Diff Modal */}
      {showWhatChanged && lastExecutedCircuit && (
        <WhatChangedModal
          isOpen={showWhatChanged}
          onClose={() => setShowWhatChanged(false)}
          circuitA={lastExecutedCircuit}
          circuitB={circuit}
          titleA="Last Run Circuit"
          titleB="Current Active Circuit"
        />
      )}
    </div>
  );
}
