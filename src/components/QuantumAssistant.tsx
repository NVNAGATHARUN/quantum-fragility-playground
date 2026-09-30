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
} from "lucide-react";
import {
  askMentor,
  type MentorMode,
  type MentorResponsePayload,
} from "../api/quantum";
import type { CircuitIR, NormalizedSimulationResult } from "../types/quantum";
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

function replyContent(text: string) {
  return text.split(/(```[\s\S]*?```)/g).map((part, index) =>
    part.startsWith("```") ? (
      <pre className="ql-aria-code" key={index}>
        <code>{part.replace(/^```[^\n]*\n?/, "").replace(/```$/, "")}</code>
      </pre>
    ) : (
      <React.Fragment key={index}>
        {part
          .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
          .map((piece, n) =>
            piece.startsWith("**") ? (
              <strong key={n}>{piece.slice(2, -2)}</strong>
            ) : piece.startsWith("`") ? (
              <code key={n}>{piece.slice(1, -1)}</code>
            ) : (
              piece
            ),
          )}
      </React.Fragment>
    ),
  );
}

const welcome: Message = {
  role: "model",
  text: "Hi, I’m Aria. I’m your quantum co-pilot. I can synthesize circuits, optimize gate schedules, debug subtle misconceptions, and explain principles with verified simulator grounding.",
};

const MODES: { id: MentorMode; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "explain", label: "Explain", icon: <Lightbulb size={13} />, desc: "Physical principles & mathematics" },
  { id: "generate", label: "Synthesize", icon: <Layers size={13} />, desc: "Build & load circuits to canvas" },
  { id: "debug", label: "Debug", icon: <Search size={13} />, desc: "Find flaws, collapse & identity errors" },
  { id: "optimize", label: "Optimize", icon: <Zap size={13} />, desc: "Cancel inverses & reduce depth" },
  { id: "socratic", label: "Socratic", icon: <Sparkles size={13} />, desc: "Guided inquiry & conceptual tests" },
  { id: "hint", label: "Hint", icon: <HelpCircle size={13} />, desc: "Progressive hints (Nudge → Math)" },
];

const MODE_CHIPS: Record<MentorMode, { title: string; prompt: string }[]> = {
  explain: [
    { title: "Superposition", prompt: "Why does a Hadamard gate create quantum superposition?" },
    { title: "Bell States", prompt: "Explain the physics of the Bell state (|00⟩ + |11⟩)/√2." },
    { title: "Phase Kickback", prompt: "Explain how phase kickback transfers phase from target to control." },
    { title: "Born Rule", prompt: "What physical changes occur during quantum measurement?" },
  ],
  generate: [
    { title: "🚀 3-Qubit GHZ State", prompt: "Synthesize a 3-qubit GHZ entangled state circuit." },
    { title: "🔔 Bell State |Φ⁺⟩", prompt: "Build a maximally entangled Bell state circuit." },
    { title: "🌌 Quantum Teleportation", prompt: "Build the quantum teleportation protocol circuit." },
    { title: "⚡ Phase Kickback", prompt: "Generate a phase kickback demonstration circuit." },
    { title: "🔮 Deutsch-Jozsa", prompt: "Generate a Deutsch-Jozsa algorithm circuit." },
    { title: "🌊 3-Qubit QFT", prompt: "Synthesize a 3-qubit Quantum Fourier Transform circuit." },
  ],
  debug: [
    { title: "🔍 Debug Active Canvas", prompt: "Analyze my active canvas circuit for any quantum bugs or misconceptions." },
    { title: "⚠️ Check Collapse", prompt: "Check if my circuit executes operations after measurement collapse." },
    { title: "🔁 Hadamard Redundancy", prompt: "Check if consecutive Hadamards (H -> H) cancel to identity." },
    { title: "🔗 CNOT Entanglement", prompt: "Check if my CNOT gates actually generate entanglement or act on classical basis states." },
  ],
  optimize: [
    { title: "⚡ Optimize Active Canvas", prompt: "Optimize my active canvas circuit to reduce gate count and depth." },
    { title: "✂️ Cancel Self-Inverses", prompt: "Identify and eliminate redundant self-inverse gate pairs (H-H, X-X, CX-CX)." },
    { title: "📐 Combine Continuous Rotations", prompt: "Combine adjacent continuous phase rotations into single operations." },
  ],
  socratic: [
    { title: "💭 Superposition Probe", prompt: "Probe my understanding of superposition vs a classical mixture." },
    { title: "🎯 Bell Pair Test", prompt: "Ask me a conceptual question about Bell state correlations." },
    { title: "📊 No-Signalling", prompt: "Test whether I understand why entanglement cannot send faster-than-light signals." },
  ],
  hint: [
    { title: "🎯 Hadamard Hint", prompt: "Give me a hint on why two Hadamards return deterministically to |0⟩." },
    { title: "🌊 Phase Hint", prompt: "Give me a hint on how relative phase differs from global phase." },
    { title: "🔗 Entanglement Hint", prompt: "Give me a hint on why measuring qubit 0 affects qubit 1 in an EPR pair." },
  ],
};

export default function QuantumAssistant() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<MentorMode>("explain");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hintTier, setHintTier] = useState(1);
  const [readAloud, setReadAloud] = useState(false);
  const [listening, setListening] = useState(false);
  const [loadedCircuitId, setLoadedCircuitId] = useState<string | null>(null);
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
    // Request context on mount
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
        "Aria couldn’t connect. Your question is still here. Check the backend connection and try again.",
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
  const activeChips = MODE_CHIPS[mode] || [];

  return (
    <>
      {!open && (
        <button
          className="ql-aria-launcher"
          onClick={() => setOpen(true)}
          aria-label="Open Aria AI tutor"
        >
          <Sparkles size={18} />
          <span>Ask Aria</span>
        </button>
      )}
      {open && (
        <div className="ql-mentor-backdrop" onClick={() => setOpen(false)}>
          <div
            ref={ref}
            className="ql-aria-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="aria-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header>
              <span className="ql-aria-avatar">
                <Sparkles size={20} />
              </span>
              <div>
                <h2 id="aria-title">
                  Aria
                  {canvasOpsCount > 0 && (
                    <span
                      className="ql-aria-canvas-badge"
                      title="Studio visual canvas is linked"
                    >
                      <Cpu size={10} /> {canvasOpsCount} ops · {canvasQubitsCount}q
                    </span>
                  )}
                </h2>
                <p>Adaptive Reasoning Intelligence for Algorithms</p>
              </div>
              <button
                className="ql-icon-button"
                aria-label={
                  readAloud ? "Disable read aloud" : "Enable read aloud"
                }
                aria-pressed={readAloud}
                onClick={() => {
                  setReadAloud((v) => !v);
                  window.speechSynthesis?.cancel();
                }}
              >
                {readAloud ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button
                disabled={loading}
                className="ql-icon-button"
                aria-label="Clear conversation"
                onClick={() => {
                  setMessages([welcome]);
                  setError("");
                  window.speechSynthesis?.cancel();
                }}
              >
                <Trash2 size={16} />
              </button>
              <button
                className="ql-icon-button"
                aria-label="Close AI tutor"
                onClick={() => setOpen(false)}
              >
                <X size={18} />
              </button>
            </header>

            {/* Segmented Top Mode Switcher */}
            <div className="ql-aria-mode-tabs" role="tablist">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  role="tab"
                  aria-selected={mode === m.id}
                  className={`ql-aria-mode-tab ${mode === m.id ? "active" : ""}`}
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
                <span>Hint Depth:</span>
                {[
                  { tier: 1, label: "1: Nudge" },
                  { tier: 2, label: "2: Concept" },
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
                  <span>{m.role === "model" ? "ARIA" : "YOU"}</span>
                  <div>{replyContent(m.text)}</div>

                  {/* Optimization Metrics Dashboard */}
                  {m.optimization && (
                    <div className="ql-aria-opt-dashboard">
                      <div className="ql-aria-opt-grid">
                        <div className="ql-aria-opt-box">
                          <div className="val">
                            {m.optimization.originalGateCount} → {m.optimization.optimizedGateCount}
                          </div>
                          <div className="lbl">Gates</div>
                        </div>
                        <div className="ql-aria-opt-box">
                          <div className="val">
                            {m.optimization.depthOriginal} → {m.optimization.depthOptimized}
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
                      )}
                    </div>
                  )}

                  {/* Synthesized Circuit Card */}
                  {m.circuit && !m.optimization && (
                    <div className="ql-aria-circuit-card">
                      <div className="ql-aria-circuit-header">
                        <span>
                          <Layers size={13} /> ARIA SYNTHESIZED CIRCUIT
                        </span>
                        <span className="ql-aria-circuit-badge">
                          {m.circuit.qubits} Qubits · {m.circuit.operations.length} Gates
                        </span>
                      </div>

                      <div className="ql-aria-circuit-ops">
                        {m.circuit.operations.slice(0, 8).map((op, idx) => (
                          <span className="ql-aria-circuit-op" key={idx}>
                            {op.gate || "GATE"}
                            {op.controls?.length ? `(${op.controls}→${op.targets})` : `(q${op.targets[0]})`}
                          </span>
                        ))}
                        {m.circuit.operations.length > 8 && (
                          <span className="ql-aria-circuit-op">
                            +{m.circuit.operations.length - 8} more
                          </span>
                        )}
                      </div>

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
                            <Layers size={14} /> ✦ Load onto Visual Canvas <ArrowRight size={13} />
                          </>
                        )}
                      </button>
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
                              <CheckCircle2 size={16} style={{ flexShrink: 0, color: "#10b981" }} />
                            ) : (
                              <AlertTriangle size={16} style={{ flexShrink: 0, color: "#f97316" }} />
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
                          ? "Generated from the supplied circuit and simulator context."
                          : m.evidence?.length
                            ? "Rule-based guidance validated against local quantum state & simulator evidence."
                            : "Grounded guidance generated from verified quantum principles."}
                      </span>
                      {m.validationScope && <small>{m.validationScope}</small>}
                      {m.verification && (
                        <small className={`ql-aria-verification ${m.verification.status}`}>
                          {m.verification.status === "verified"
                            ? m.source === "gemini"
                              ? "Numerical claims matched simulator evidence"
                              : "Deterministic quantum rules verified"
                            : m.verification.status === "rejected"
                              ? "Generated claim rejected; grounded fallback shown"
                              : "Limited verification scope"}
                        </small>
                      )}
                    </div>
                  )}

                  {/* Interactive Course Material Citations */}
                  {m.citations?.length ? (
                    <div className="ql-aria-citations">
                      <span>Verified Course Modules</span>
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
                <div className="ql-aria-thinking" role="status">
                  <Sparkles size={14} className="animate-spin" />
                  <span>Aria is analyzing quantum state & compiling…</span>
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
                  className="ql-aria-chip"
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
                    ? "E.g. Synthesize a 3-qubit GHZ state or Bell pair…"
                    : mode === "optimize"
                      ? "E.g. Optimize my active canvas circuit…"
                      : mode === "debug"
                        ? "E.g. Debug the circuit for collapse or M01…"
                        : "Ask about superposition, phase kickback, entanglement…"
                }
              />
              <button
                type="button"
                aria-label={listening ? "Stop voice input" : "Dictate question"}
                aria-pressed={listening}
                className={listening ? "listening" : ""}
                onClick={dictate}
              >
                <Mic size={16} />
              </button>
              <button
                disabled={loading || !input.trim()}
                aria-label="Send question"
              >
                <Send size={16} />
              </button>
            </form>
            <p className="ql-aria-disclaimer">
              ARIA Quantum Intelligence · Verified against local statevector and Clifford+T algebraic rewrite rules.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
