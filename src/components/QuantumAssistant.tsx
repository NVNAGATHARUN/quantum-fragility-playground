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
  text: "Hi, I’m Aria. Let’s make quantum computing a little less mysterious. Tell me what you’re working on, or pick a question below.",
};
export default function QuantumAssistant() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<MentorMode>("socratic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hintTier, setHintTier] = useState(1);
  const [readAloud, setReadAloud] = useState(false);
  const [listening, setListening] = useState(false);
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
    const show = () => setOpen(true);
    window.addEventListener("quantum-lens:open-mentor", show);
    return () => window.removeEventListener("quantum-lens:open-mentor", show);
  }, []);
  useEffect(() => {
    const receive = (event: Event) =>
      setStudioContext((event as CustomEvent).detail);
    window.addEventListener("quantum-lens:studio-context", receive);
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
  async function send(text = input) {
    const value = text.trim();
    if (!value || loading) return;
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
        mode,
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
  return (
    <>
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
                <Sparkles size={21} />
              </span>
              <div>
                <h2 id="aria-title">Aria</h2>
                <p>Your quantum thinking partner</p>
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
                {readAloud ? <Volume2 size={17} /> : <VolumeX size={17} />}
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
                <Trash2 size={17} />
              </button>
              <button
                className="ql-icon-button"
                aria-label="Close AI tutor"
                onClick={() => setOpen(false)}
              >
                <X size={20} />
              </button>
            </header>
            <div className="ql-aria-mode">
              <span>LET’S</span>
              <select
                aria-label="Tutor mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as MentorMode)}
              >
                <option value="socratic">Think it through</option>
                <option value="hint">Get a hint</option>
                <option value="explain">Explain a concept</option>
                <option value="generate">Build a circuit</option>
                <option value="debug">Debug a circuit</option>
                <option value="optimize">Optimize a circuit</option>
              </select>
              {mode === "hint" && (
                <select
                  aria-label="Hint depth"
                  value={hintTier}
                  onChange={(e) => setHintTier(Number(e.target.value))}
                >
                  <option value={1}>Gentle nudge</option>
                  <option value={2}>Conceptual hint</option>
                  <option value={3}>Mathematical hint</option>
                </select>
              )}
            </div>
            <div className="ql-aria-messages" aria-live="polite">
              {messages.map((m, i) => (
                <div className={`ql-message ${m.role}`} key={i}>
                  <span>{m.role === "model" ? "ARIA" : "YOU"}</span>
                  <div>{replyContent(m.text)}</div>
                  {m.source && (
                    <div className="ql-aria-provenance">
                      <strong>{m.source === "gemini" ? "Gemini response" : "Deterministic tutor"}</strong>
                      <span>
                        {m.source === "gemini"
                          ? "Generated from the supplied circuit and simulator context."
                          : m.evidence?.length
                            ? "Rule-based guidance generated locally from the evidence listed below."
                            : "Rule-based guidance generated locally; no circuit or learner evidence was supplied."}
                      </span>
                      {m.validationScope && <small>{m.validationScope}</small>}
                      {m.verification && (
                        <small className={`ql-aria-verification ${m.verification.status}`}>
                          {m.verification.status === "verified"
                            ? m.source === "gemini"
                              ? "Numerical claims matched simulator evidence"
                              : "Deterministic rule checks passed"
                            : m.verification.status === "rejected"
                              ? "Generated claim rejected; grounded fallback shown"
                              : "Limited verification scope"}
                        </small>
                      )}
                    </div>
                  )}
                  {m.evidence?.length ? (
                    <details className="ql-aria-evidence">
                      <summary>Evidence used ({m.evidence.length})</summary>
                      {m.evidence.map((item, n) => (
                        <div key={`${item.kind}-${n}`}>
                          <strong>{item.label}</strong>
                          <span>{item.detail}</span>
                        </div>
                      ))}
                    </details>
                  ) : null}
                  {m.citations?.length ? (
                    <div className="ql-aria-citations">
                      <span>Continue with verified course material</span>
                      {m.citations.map((citation) => (
                        <button
                          key={citation.route}
                          title={citation.reason}
                          onClick={() => {
                            navigate(citation.route);
                            setOpen(false);
                          }}
                        >
                          <BookOpen size={13} /> {citation.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {m.findings?.length ? (
                    <ul className="ql-aria-findings">
                      {m.findings.map((f, n) => (
                        <li key={n}>{f}</li>
                      ))}
                    </ul>
                  ) : null}
                  {m.optimization && (
                    <p className="ql-aria-optimization">
                      Gate count: {m.optimization.originalGateCount} →{" "}
                      {m.optimization.optimizedGateCount} · depth:{" "}
                      {m.optimization.depthOriginal} →{" "}
                      {m.optimization.depthOptimized}
                    </p>
                  )}
                  {m.circuit && (
                    <button
                      className="ql-button ql-button-white"
                      onClick={() => {
                        if (location.pathname.startsWith("/labs/studio"))
                          window.dispatchEvent(
                            new CustomEvent("quantum-lens:load-circuit", {
                              detail: { circuit: m.circuit },
                            }),
                          );
                        else {
                          sessionStorage.setItem(
                            "ql_mentor_circuit",
                            JSON.stringify(m.circuit),
                          );
                          navigate("/labs/studio");
                        }
                        setOpen(false);
                      }}
                    >
                      Explore this circuit <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              ))}
              {messages.length === 1 && (
                <div className="ql-aria-prompts">
                  {[
                    "Why does a Hadamard gate create superposition?",
                    "Help me understand a Bell state.",
                    "What changes when I measure a qubit?",
                  ].map((q) => (
                    <button key={q} onClick={() => send(q)}>
                      {q}
                      <ArrowRight size={14} />
                    </button>
                  ))}
                </div>
              )}
              {loading && (
                <p className="ql-aria-thinking" role="status">
                  Aria is thinking…
                </p>
              )}
              {error && (
                <p className="ql-notice error" role="alert">
                  {error}
                </p>
              )}
              <div ref={endRef} />
            </div>
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
                placeholder="A question is a good place to start…"
              />
              <button
                type="button"
                aria-label={listening ? "Stop voice input" : "Dictate question"}
                aria-pressed={listening}
                onClick={dictate}
              >
                <Mic size={17} />
              </button>
              <button
                disabled={loading || !input.trim()}
                aria-label="Send question"
              >
                <Send size={18} />
              </button>
            </form>
            <p className="ql-aria-disclaimer">
              AI can make mistakes. Verify ideas through experiments.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
