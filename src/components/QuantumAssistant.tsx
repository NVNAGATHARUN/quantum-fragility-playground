import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Mic,
  Send,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  X,
  Cpu,
  Zap,
  Search,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Layers,
  HelpCircle,
  Check,
  Copy,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  askMentor,
  type MentorMode,
  type MentorResponsePayload,
} from "../api/quantum";
import type { CircuitIR, NormalizedSimulationResult } from "../types/quantum";
import { circuitCode } from "../lib/studio";
import { useDialogFocus } from "../hooks/useDialogFocus";
import { useAuth } from "../providers/AuthProvider";
import { fetchProgressSummary } from "../api/progress";

interface Message {
  role: "user" | "model";
  text: string;
  circuit?: CircuitIR;
  findings?: string[];
  optimization?: MentorResponsePayload["optimizationDeltas"];
  source?: MentorResponsePayload["source"];
  validationScope?: string;
  evidence?: MentorResponsePayload["evidenceUsed"];
  citations?: MentorResponsePayload["citations"];
  verification?: MentorResponsePayload["verification"];
}

interface SpeechInput {
  start: () => void;
  stop: () => void;
  onresult:
    | ((event: {
        results: {
          [index: number]: { [index: number]: { transcript: string } };
        };
      }) => void)
    | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

function getGateTypeClass(gate: string): string {
  const g = (gate || "").toUpperCase();
  if (["H", "HADAMARD"].includes(g)) return "gate-h";
  if (["X", "Y", "Z", "NOT"].includes(g)) return "gate-pauli";
  if (["CX", "CNOT", "CZ", "SWAP", "ECR", "CH"].includes(g)) return "gate-entangle";
  if (["RZ", "RX", "RY", "PHASE", "P", "T", "S", "TDG", "SDG"].includes(g)) return "gate-phase";
  if (["MEASURE", "M"].includes(g)) return "gate-measure";
  return "gate-default";
}

function renderFormattedChunk(piece: string, n: number) {
  if (piece.startsWith("**") && piece.endsWith("**")) {
    return <strong key={n}>{piece.slice(2, -2)}</strong>;
  }
  if (piece.startsWith("`") && piece.endsWith("`")) {
    return <code key={n}>{piece.slice(1, -1)}</code>;
  }
  return piece;
}

function replyContent(
  text: string,
  onCopyCode: (code: string, id: string) => void,
  copiedCodeId: string | null,
  msgIdx: number,
) {
  return text.split(/(```[\s\S]*?```)/g).map((part, index) => {
    if (part.startsWith("```")) {
      const firstLineBreak = part.indexOf("\n");
      const lang = firstLineBreak !== -1 ? part.slice(3, firstLineBreak).trim() || "code" : "code";
      const code = part.replace(/^```[^\n]*\n?/, "").replace(/```$/, "").trim();
      const codeId = `code-${msgIdx}-${index}`;
      const isCopied = copiedCodeId === codeId;
      return (
        <div className="ql-aria-code-block" key={index}>
          <div className="ql-aria-code-header">
            <span>{lang.toUpperCase()}</span>
            <button
              type="button"
              className="ql-aria-code-copy-btn"
              onClick={() => onCopyCode(code, codeId)}
              title="Copy code snippet"
            >
              {isCopied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
              <span>{isCopied ? "Copied!" : "Copy"}</span>
            </button>
          </div>
          <pre className="ql-aria-code-content">
            <code>{code}</code>
          </pre>
        </div>
      );
    }
    const lines = part.split("\n");
    return (
      <React.Fragment key={index}>
        {lines.map((line, lIdx) => {
          if (line.startsWith("### ")) {
            return (
              <h3 key={lIdx} style={{ margin: "10px 0 4px", fontSize: "14px", fontWeight: 700, color: "#f8fafc" }}>
                {line.slice(4)}
              </h3>
            );
          }
          if (line.startsWith("## ")) {
            return (
              <h2 key={lIdx} style={{ margin: "12px 0 6px", fontSize: "15px", fontWeight: 700, color: "#ffffff" }}>
                {line.slice(3)}
              </h2>
            );
          }
          const isBullet = line.trimStart().startsWith("- ") || line.trimStart().startsWith("* ");
          const content = isBullet ? line.trimStart().slice(2) : line;

          return (
            <div
              key={lIdx}
              style={{
                display: isBullet ? "flex" : "block",
                alignItems: "baseline",
                gap: isBullet ? "8px" : undefined,
                margin: line.trim() ? "3px 0" : "5px 0",
              }}
            >
              {isBullet && (
                <span
                  style={{
                    display: "inline-block",
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: "#818cf8",
                    flexShrink: 0,
                    transform: "translateY(-1px)",
                  }}
                />
              )}
              <span>
                {content
                  .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
                  .map((piece, n) => renderFormattedChunk(piece, n))}
              </span>
            </div>
          );
        })}
      </React.Fragment>
    );
  });
}

const welcome: Message = {
  role: "model",
  text: "Hi, I\u2019m Aria. I\u2019m your quantum co-pilot. I can synthesize circuits, optimize gate schedules, debug subtle misconceptions, and explain principles with verified simulator grounding.",
};

const MODES: { id: MentorMode; label: string; icon: React.ReactNode; desc: string; tabClass: string }[] = [
  { id: "explain", label: "Explain", icon: <Lightbulb size={13} />, desc: "Physical principles & mathematics", tabClass: "tab-explain" },
  { id: "generate", label: "Synthesize", icon: <Layers size={13} />, desc: "Build & load circuits to canvas", tabClass: "tab-generate" },
  { id: "debug", label: "Debug", icon: <Search size={13} />, desc: "Find flaws, collapse & identity errors", tabClass: "tab-debug" },
  { id: "optimize", label: "Optimize", icon: <Zap size={13} />, desc: "Cancel inverses & reduce depth", tabClass: "tab-optimize" },
  { id: "socratic", label: "Socratic", icon: <Sparkles size={13} />, desc: "Guided inquiry & conceptual tests", tabClass: "tab-socratic" },
  { id: "hint", label: "Hint", icon: <HelpCircle size={13} />, desc: "Progressive hints (Nudge \u2192 Math)", tabClass: "tab-hint" },
];

const MODE_CHIPS: Record<MentorMode, { title: string; prompt: string }[]> = {
  explain: [
    { title: "Superposition", prompt: "Why does a Hadamard gate create quantum superposition?" },
    { title: "Bell States", prompt: "Explain the physics of the Bell state (|00\u27E9 + |11\u27E9)/\u221A2." },
    { title: "Phase Kickback", prompt: "Explain how phase kickback transfers phase from target to control." },
    { title: "Born Rule", prompt: "What physical changes occur during quantum measurement?" },
  ],
  generate: [
    { title: "\uD83D\uDE80 3-Qubit GHZ State", prompt: "Synthesize a 3-qubit GHZ entangled state circuit." },
    { title: "\uD83D\uDD14 Bell State |\u03A6\u207A\u27E9", prompt: "Build a maximally entangled Bell state circuit." },
    { title: "\uD83C\uDF0C Quantum Teleportation", prompt: "Build the quantum teleportation protocol circuit." },
    { title: "\u26A1 Phase Kickback", prompt: "Generate a phase kickback demonstration circuit." },
    { title: "\uD83D\uDD2E Deutsch-Jozsa", prompt: "Generate a Deutsch-Jozsa algorithm circuit." },
    { title: "\uD83C\uDF0A 3-Qubit QFT", prompt: "Synthesize a 3-qubit Quantum Fourier Transform circuit." },
  ],
  debug: [
    { title: "\uD83D\uDD0D Debug Active Canvas", prompt: "Analyze my active canvas circuit for any quantum bugs or misconceptions." },
    { title: "\u26A0\uFE0F Check Collapse", prompt: "Check if my circuit executes operations after measurement collapse." },
    { title: "\uD83D\uDD01 Hadamard Redundancy", prompt: "Check if consecutive Hadamards (H -> H) cancel to identity." },
    { title: "\uD83D\uDD17 CNOT Entanglement", prompt: "Check if my CNOT gates actually generate entanglement or act on classical basis states." },
  ],
  optimize: [
    { title: "\u26A1 Optimize Active Canvas", prompt: "Optimize my active canvas circuit to reduce gate count and depth." },
    { title: "\u2702\uFE0F Cancel Self-Inverses", prompt: "Identify and eliminate redundant self-inverse gate pairs (H-H, X-X, CX-CX)." },
    { title: "\uD83D\uDCD0 Combine Continuous Rotations", prompt: "Combine adjacent continuous phase rotations into single operations." },
  ],
  socratic: [
    { title: "\uD83D\uDCAD Superposition Probe", prompt: "Probe my understanding of superposition vs a classical mixture." },
    { title: "\uD83C\uDFAF Bell Pair Test", prompt: "Ask me a conceptual question about Bell state correlations." },
    { title: "\uD83D\uDCCA No-Signalling", prompt: "Test whether I understand why entanglement cannot send faster-than-light signals." },
  ],
  hint: [
    { title: "\uD83C\uDFAF Hadamard Hint", prompt: "Give me a hint on why two Hadamards return deterministically to |0\u27E9." },
    { title: "\uD83C\uDF0A Phase Hint", prompt: "Give me a hint on how relative phase differs from global phase." },
    { title: "\uD83D\uDD17 Entanglement Hint", prompt: "Give me a hint on why measuring qubit 0 affects qubit 1 in an EPR pair." },
  ],
};

export default function QuantumAssistant() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<MentorMode>("explain");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hintTier, setHintTier] = useState(1);
  const [readAloud, setReadAloud] = useState(false);
  const [listening, setListening] = useState(false);
  const [loadedCircuitId, setLoadedCircuitId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedMsgIdx, setCopiedMsgIdx] = useState<number | null>(null);
  const [copiedQasmId, setCopiedQasmId] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechInput | null>(null);
  const [studioContext, setStudioContext] = useState<{
    circuit?: CircuitIR;
    simulationResult?: NormalizedSimulationResult;
    location?: string;
    targetConcept?: string;
  }>({});
  const openRef = useRef(open);
  openRef.current = open;
  const ref = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  useDialogFocus(open, ref, () => setOpen(false));

  useEffect(() => {
    const show = () => {
      setOpen(true);
      window.dispatchEvent(new CustomEvent("quantum-lens:request-studio-context"));
    };
    window.addEventListener("quantum-lens:open-mentor", show);
    return () => window.removeEventListener("quantum-lens:open-mentor", show);
  }, []);

  useEffect(() => {
    const receive = (event: Event) =>
      setStudioContext((event as CustomEvent).detail);
    window.addEventListener("quantum-lens:studio-context", receive);
    window.dispatchEvent(new CustomEvent("quantum-lens:request-studio-context"));
    return () => {
      window.removeEventListener("quantum-lens:studio-context", receive);
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (!open) {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    } else {
      window.dispatchEvent(new CustomEvent("quantum-lens:request-studio-context"));
    }
  }, [open]);

  function handleCopyCode(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2500);
  }

  function handleCopyMessage(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedMsgIdx(idx);
    setTimeout(() => setCopiedMsgIdx(null), 2500);
  }

  function handleCopyQasm(circuit: CircuitIR, key: string) {
    try {
      const qasm = circuitCode(circuit, "qasm");
      navigator.clipboard.writeText(qasm);
      setCopiedQasmId(key);
      setTimeout(() => setCopiedQasmId(null), 2500);
    } catch {
      navigator.clipboard.writeText(JSON.stringify(circuit, null, 2));
      setCopiedQasmId(key);
      setTimeout(() => setCopiedQasmId(null), 2500);
    }
  }

  function dictate() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const speechWindow = window as typeof window & {
      SpeechRecognition?: new () => SpeechInput;
      webkitSpeechRecognition?: new () => SpeechInput;
    };
    const Recognition =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setError(
        "Voice input is not supported in this browser. You can type your question below.",
      );
      return;
    }
    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.onresult = (e) => setInput(e.results[0][0].transcript);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setError(
        "Voice input is unavailable. Check your microphone permission or type your question.",
      );
    };
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
      setError("Could not start voice input. Please type your question.");
    }
  }

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, loading, open]);

  async function send(text = input, overrideMode?: MentorMode) {
    const value = text.trim();
    if (!value || loading) return;
    const activeMode = overrideMode || mode;
    setInput("");
    setError("");
    setMessages((m) => [...m, { role: "user", text: value }]);
    setLoading(true);
    try {
      const progress = token ? await fetchProgressSummary(token) : null;
      const activeDiagnosis = progress?.detected_misconceptions.find(
        (item) => item.status === "detected" || item.status === "targeted",
      );
      const answer = await askMentor({
        message: value,
        mode: activeMode,
        context: {
          location: location.pathname,
          hintTier,
          ...studioContext,
          misconceptionId: activeDiagnosis?.misconception_id,
          learnerEvidence: progress
            ? {
                activeMisconception: activeDiagnosis?.misconception_id,
                status: activeDiagnosis?.status,
                recommendation: progress.recommendation.title,
                evidence: progress.recommendation.evidence,
              }
            : undefined,
        },
        history: messages
          .slice(-8)
          .map((m) => ({ role: m.role, text: m.text })),
      });
      setMessages((m) => [
        ...m,
        {
          role: "model",
          text: answer.reply,
          circuit: answer.suggestedCircuit || undefined,
          findings: answer.debugFindings || undefined,
          optimization: answer.optimizationDeltas,
          source: answer.source,
          validationScope: answer.validationScope,
          evidence: answer.evidenceUsed,
          citations: answer.citations,
          verification: answer.verification,
        },
      ]);
      if (readAloud && openRef.current && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(
          new SpeechSynthesisUtterance(answer.reply.replace(/[*`#]/g, "")),
        );
      }
    } catch {
      setError(
        "Aria couldn\u2019t connect. Your question is still here. Check the backend connection and try again.",
      );
      setInput(value);
    } finally {
      setLoading(false);
    }
  }

  function handleLoadCircuit(circuit: CircuitIR, indexKey: string) {
    if (location.pathname.startsWith("/labs/studio")) {
      window.dispatchEvent(
        new CustomEvent("quantum-lens:load-circuit", {
          detail: { circuit },
        }),
      );
    } else {
      sessionStorage.setItem("ql_mentor_circuit", JSON.stringify(circuit));
      navigate("/labs/studio");
    }
    setLoadedCircuitId(indexKey);
    setTimeout(() => setLoadedCircuitId(null), 3000);
  }

  const canvasOpsCount = studioContext.circuit?.operations?.length ?? 0;
  const canvasQubitsCount = studioContext.circuit?.qubits ?? 0;
  const isStudio = location.pathname.startsWith("/labs/studio");
  const dynamicStudioChips = isStudio && canvasOpsCount > 0 ? [
    { title: `\u26A1 Optimize Canvas (${canvasOpsCount} ops)`, prompt: "Optimize my active canvas circuit to reduce gate count and depth." },
    { title: `\uD83D\uDD0D Audit Canvas (${canvasOpsCount} ops)`, prompt: "Analyze my active canvas circuit for any quantum bugs or misconceptions." },
  ] : [];
  const activeChips = [...dynamicStudioChips, ...(MODE_CHIPS[mode] || [])];

  return (
    <>
      {!open && (
        <button
          className="ql-aria-launcher"
          onClick={() => setOpen(true)}
          aria-label="Open Aria AI Quantum Co-pilot"
        >
          <span className="ql-aria-launcher-sparkle">
            <Sparkles size={15} />
          </span>
          <span className="ql-aria-launcher-label">Ask Aria</span>
          <span className="ql-aria-launcher-tag">
            <span className="ql-aria-launcher-dot" />
            AI Co-pilot
          </span>
        </button>
      )}
      {open && (
        <div className="ql-mentor-backdrop" onClick={() => setOpen(false)}>
          <div
            ref={ref}
            className={`ql-aria-panel ${isExpanded ? "expanded" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="aria-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header>
              <div className="ql-aria-avatar-wrap">
                <span className="ql-aria-avatar">
                  <Sparkles size={20} />
                </span>
                <span className="ql-aria-online-badge" title="Aria AI Co-pilot Online" />
              </div>
              <div className="ql-aria-header-text">
                <div className="ql-aria-header-title">
                  <h2 id="aria-title">Aria</h2>
                  <span className="ql-aria-badge-quantum">Quantum AI</span>
                  {canvasOpsCount > 0 && (
                    <span
                      className="ql-aria-canvas-badge"
                      title="Studio visual canvas is linked"
                    >
                      <span className="ql-aria-pulse-dot" />
                      {canvasOpsCount} ops · {canvasQubitsCount}q linked
                    </span>
                  )}
                </div>
                <p className="ql-aria-header-sub">
                  <span className="ql-aria-live-engine-indicator" />
                  Grounded Qiskit Aer Physics &amp; Socratic Reasoning
                </p>
              </div>

              <div className="ql-aria-header-actions">
                <button
                  className={`ql-aria-btn-tool ${isExpanded ? "active" : ""}`}
                  aria-label={isExpanded ? "Standard width" : "Expand panel width"}
                  title={isExpanded ? "Standard view" : "Expand view"}
                  onClick={() => setIsExpanded((v) => !v)}
                >
                  {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
                <button
                  className={`ql-aria-btn-tool ${readAloud ? "active" : ""}`}
                  aria-label={
                    readAloud ? "Disable read aloud" : "Enable read aloud"
                  }
                  title={readAloud ? "Voice read-aloud active" : "Enable voice read-aloud"}
                  aria-pressed={readAloud}
                  onClick={() => {
                    setReadAloud((v) => !v);
                    window.speechSynthesis?.cancel();
                  }}
                >
                  {readAloud ? <Volume2 size={15} /> : <VolumeX size={15} />}
                </button>
                <button
                  disabled={loading}
                  className="ql-aria-btn-tool"
                  aria-label="Clear conversation"
                  title="Clear conversation"
                  onClick={() => {
                    setMessages([welcome]);
                    setError("");
                    window.speechSynthesis?.cancel();
                  }}
                >
                  <Trash2 size={15} />
                </button>
                <button
                  className="ql-aria-btn-tool"
                  aria-label="Close AI tutor"
                  title="Close (Esc)"
                  onClick={() => setOpen(false)}
                >
                  <X size={16} />
                </button>
              </div>
            </header>

            {/* Segmented Top Mode Switcher */}
            <div className="ql-aria-mode-tabs" role="tablist">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  role="tab"
                  aria-selected={mode === m.id}
                  className={`ql-aria-mode-tab ${m.tabClass} ${mode === m.id ? "active" : ""}`}
                  onClick={() => setMode(m.id)}
                  title={m.desc}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Hint Tier Sub-bar */}
            {mode === "hint" && (
              <div className="ql-aria-hint-tier-bar">
                <span style={{ fontWeight: 600, color: "#cbd5e1" }}>Pedagogical Depth:</span>
                {[
                  { tier: 1, label: "1: Nudge" },
                  { tier: 2, label: "2: Physical Insight" },
                  { tier: 3, label: "3: Math Solution" },
                ].map((t) => (
                  <button
                    key={t.tier}
                    className={`ql-aria-hint-tier-pill ${hintTier === t.tier ? "active" : ""}`}
                    onClick={() => setHintTier(t.tier)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            <div className="ql-aria-messages" aria-live="polite">
              {messages.map((m, i) => (
                <div className={`ql-message ${m.role}`} key={i}>
                  {m.role === "model" ? (
                    <div className="ql-aria-msg-header">
                      <div className="ql-aria-msg-author">
                        <span className="ql-aria-msg-micro-orb">
                          <Sparkles size={10} />
                        </span>
                        <span>ARIA CO-PILOT</span>
                      </div>
                      <button
                        type="button"
                        className="ql-aria-msg-copy-btn"
                        onClick={() => handleCopyMessage(m.text, i)}
                        title="Copy response"
                      >
                        {copiedMsgIdx === i ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                        <span>{copiedMsgIdx === i ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  ) : (
                    <span>YOU</span>
                  )}

                  <div className="ql-aria-msg-body">
                    {replyContent(m.text, handleCopyCode, copiedCodeId, i)}
                  </div>

                  {/* Optimization Metrics Dashboard */}
                  {m.optimization && (
                    <div className="ql-aria-opt-dashboard">
                      <div className="ql-aria-opt-grid">
                        <div className="ql-aria-opt-box">
                          <div className="val">
                            {m.optimization.originalGateCount} \u2192 {m.optimization.optimizedGateCount}
                          </div>
                          <div className="lbl">Gates</div>
                        </div>
                        <div className="ql-aria-opt-box">
                          <div className="val">
                            {m.optimization.depthOriginal} \u2192 {m.optimization.depthOptimized}
                          </div>
                          <div className="lbl">Depth</div>
                        </div>
                        <div className="ql-aria-opt-box">
                          <div className="val">
                            {m.optimization.reductionPercent > 0
                              ? `-${m.optimization.reductionPercent}%`
                              : "0%"}
                          </div>
                          <div className="lbl">Reduction</div>
                        </div>
                      </div>

                      {m.optimization.cancellations?.length > 0 && (
                        <ul className="ql-aria-opt-cancellations">
                          {m.optimization.cancellations.map((c, n) => (
                            <li key={n}>{c}</li>
                          ))}
                        </ul>
                      )}

                      {m.circuit && (
                        <div className="ql-aria-circuit-actions">
                          <button
                            className="ql-aria-load-circuit-btn"
                            onClick={() => handleLoadCircuit(m.circuit!, `opt-${i}`)}
                          >
                            {loadedCircuitId === `opt-${i}` ? (
                              <>
                                <Check size={14} /> Applied to Visual Canvas!
                              </>
                            ) : (
                              <>
                                <Zap size={14} /> Apply Optimized Circuit to Canvas
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            className="ql-aria-copy-circuit-btn"
                            onClick={() => handleCopyQasm(m.circuit!, `opt-qasm-${i}`)}
                            title="Copy OpenQASM code"
                          >
                            {copiedQasmId === `opt-qasm-${i}` ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                            <span>{copiedQasmId === `opt-qasm-${i}` ? "Copied QASM" : "QASM"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Synthesized Circuit Card */}
                  {m.circuit && !m.optimization && (
                    <div className="ql-aria-circuit-card">
                      <div className="ql-aria-circuit-header">
                        <span className="ql-aria-circuit-title">
                          <Layers size={14} /> ARIA SYNTHESIZED CIRCUIT
                        </span>
                        <span className="ql-aria-circuit-badge">
                          {m.circuit.qubits} Qubits \u00B7 {m.circuit.operations.length} Gates
                        </span>
                      </div>

                      <div className="ql-aria-circuit-ops">
                        {m.circuit.operations.slice(0, 10).map((op, idx) => (
                          <span className={`ql-aria-circuit-op ${getGateTypeClass(op.gate)}`} key={idx}>
                            {op.gate || "GATE"}
                            {op.controls?.length ? ` (${op.controls}\u2192${op.targets})` : ` (q${op.targets[0]})`}
                          </span>
                        ))}
                        {m.circuit.operations.length > 10 && (
                          <span className="ql-aria-circuit-op gate-default">
                            +{m.circuit.operations.length - 10} more
                          </span>
                        )}
                      </div>

                      <div className="ql-aria-circuit-actions">
                        <button
                          className="ql-aria-load-circuit-btn"
                          onClick={() => handleLoadCircuit(m.circuit!, `circ-${i}`)}
                        >
                          {loadedCircuitId === `circ-${i}` ? (
                            <>
                              <Check size={14} /> Loaded onto Visual Canvas!
                            </>
                          ) : (
                            <>
                              <Layers size={14} /> Load onto Visual Canvas <ArrowRight size={13} />
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="ql-aria-copy-circuit-btn"
                          onClick={() => handleCopyQasm(m.circuit!, `circ-qasm-${i}`)}
                          title="Copy OpenQASM code"
                        >
                          {copiedQasmId === `circ-qasm-${i}` ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                          <span>{copiedQasmId === `circ-qasm-${i}` ? "Copied QASM" : "QASM"}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Debug Findings Diagnostics */}
                  {m.findings?.length ? (
                    <ul className="ql-aria-findings">
                      {m.findings.map((f, n) => {
                        const isClean = f.toLowerCase().includes("sanity analysis") || f.toLowerCase().includes("passes");
                        return (
                          <li
                            key={n}
                            className={`ql-aria-finding-item ${isClean ? "clean" : ""}`}
                          >
                            {isClean ? (
                              <CheckCircle2 size={16} style={{ flexShrink: 0, color: "#10b981", marginTop: "2px" }} />
                            ) : (
                              <AlertTriangle size={16} style={{ flexShrink: 0, color: "#f97316", marginTop: "2px" }} />
                            )}
                            <div>{f}</div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}

                  {/* Provenance & Verification */}
                  {m.source && (
                    <div className="ql-aria-provenance">
                      <strong>
                        {m.source === "gemini" ? "Gemini Neural Response" : "Deterministic ARIA Grounded Tutor"}
                      </strong>
                      <span>
                        {m.source === "gemini"
                          ? "Generated from supplied circuit and simulator state context."
                          : m.evidence?.length
                            ? "Rule-based guidance validated against local quantum state & simulator evidence."
                            : "Grounded guidance generated from verified quantum principles."}
                      </span>
                      {m.validationScope && <small style={{ color: "#64748b" }}>{m.validationScope}</small>}
                      {m.verification && (
                        <span className={`ql-aria-verification ${m.verification.status}`}>
                          {m.verification.status === "verified"
                            ? m.source === "gemini"
                              ? "\u2713 Numerical claims matched simulator evidence"
                              : "\u2713 Deterministic quantum rules verified"
                            : m.verification.status === "rejected"
                              ? "\u26A0 Generated claim rejected; grounded fallback shown"
                              : "\u2022 Limited verification scope"}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Interactive Course Material Citations */}
                  {m.citations?.length ? (
                    <div className="ql-aria-citations">
                      <span>Verified Modules:</span>
                      {m.citations.map((citation) => (
                        <button
                          key={citation.route}
                          title={citation.reason}
                          onClick={() => {
                            navigate(citation.route);
                            setOpen(false);
                          }}
                        >
                          <BookOpen size={12} /> {citation.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}

              {loading && (
                <div className="ql-aria-thinking" role="status" aria-label="Aria is thinking">
                  <div className="ql-aria-thinking-dots" aria-hidden="true">
                    <span /><span /><span />
                  </div>
                  <span>Aria is analyzing\u2026</span>
                </div>
              )}

              {error && (
                <p className="ql-notice error" role="alert">
                  {error}
                </p>
              )}
              <div ref={endRef} />
            </div>

            {/* Quick Action Prompt Chips */}
            <div className="ql-aria-chip-bar">
              {activeChips.map((chip, idx) => (
                <button
                  key={idx}
                  className={`ql-aria-chip ${chip.title.startsWith("\u26A1") || chip.title.startsWith("\uD83D\uDD0D") ? "chip-highlight" : ""}`}
                  onClick={() => send(chip.prompt)}
                  disabled={loading}
                >
                  {chip.title}
                </button>
              ))}
            </div>

            {/* Compose Input */}
            <form
              className="ql-aria-compose"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <label className="sr-only" htmlFor="aria-question">
                Ask your quantum question
              </label>
              <input
                id="aria-question"
                maxLength={4000}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  mode === "generate"
                    ? "E.g. Synthesize a 3-qubit GHZ state or Bell pair\u2026"
                    : mode === "optimize"
                      ? "E.g. Optimize my active canvas circuit\u2026"
                      : mode === "debug"
                        ? "E.g. Debug the circuit for collapse or M01\u2026"
                        : "Ask about superposition, phase kickback, entanglement\u2026"
                }
              />
              <button
                type="button"
                aria-label={listening ? "Stop voice input" : "Dictate question"}
                aria-pressed={listening}
                className={listening ? "listening" : ""}
                onClick={dictate}
                title="Voice input"
              >
                <Mic size={16} />
              </button>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn-send"
                aria-label="Send question"
                title="Send"
              >
                <Send size={15} />
              </button>
            </form>
            <p className="ql-aria-disclaimer">
              ARIA Quantum Intelligence \u00B7 Verified against local statevector and Clifford+T algebraic rewrite rules.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
