import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  CircuitBoard,
  FlaskConical,
  Server,
  ShieldCheck,
} from "lucide-react";
import { apiUrl } from "../api/client";

type Readiness = {
  status: string;
  database: string;
  simulation_backend: string;
  version: string;
};

const journey = [
  {
    number: "01",
    title: "Diagnose the mental model",
    time: "1 minute",
    description:
      "Take the baseline diagnostic. The server grades a fixed form and records concept-level evidence instead of accepting a self-reported score.",
    to: "/diagnostic?phase=baseline",
    action: "Open baseline diagnostic",
    icon: Brain,
  },
  {
    number: "02",
    title: "Predict before observing",
    time: "1 minute",
    description:
      "Use the measurement guided lab. Commit to an outcome, run the circuit, and inspect the cognitive conflict created by verified simulation.",
    to: "/labs/guided/measurement",
    action: "Open guided experiment",
    icon: FlaskConical,
  },
  {
    number: "03",
    title: "Prove framework independence",
    time: "2 minutes",
    description:
      "Load the Bell starter in Circuit Studio. Run it separately on Qiskit Aer, Cirq, and PennyLane, then use Compare engines to inspect parity.",
    to: "/labs/studio",
    action: "Open Circuit Studio",
    icon: CircuitBoard,
  },
  {
    number: "04",
    title: "Interrogate the evidence",
    time: "1 minute",
    description:
      "Open ARIA and ask: ‘Why do Bell counts not prove the relative phase?’ The tutor must cite circuit or simulator evidence and disclose its response source.",
    to: "/labs/studio",
    action: "Ask ARIA in Studio",
    icon: ShieldCheck,
  },
  {
    number: "05",
    title: "Grade the physics, not the picture",
    time: "1 minute",
    description:
      "Attempt the Bell phase challenge. The grader distinguishes |Φ+⟩ from |Φ−⟩ even when their computational-basis histograms are identical.",
    to: "/challenges/bell-phase-verification",
    action: "Open graded challenge",
    icon: CheckCircle2,
  },
  {
    number: "06",
    title: "Close the learning loop",
    time: "1 minute",
    description:
      "Inspect learner progress and the instructor view. Scores, misconceptions, remediation and assignments come from persisted server evidence.",
    to: "/progress",
    action: "Open progress evidence",
    icon: BarChart3,
  },
];

const alignment = [
  ["Structured curriculum", "8 modules, guided lessons and algorithm walkthroughs"],
  ["Circuit design", "Visual multi-qubit editor plus validated OpenQASM and code export"],
  ["Multi-framework execution", "Selectable Qiskit Aer, Cirq and PennyLane native execution"],
  ["State visualization", "Statevector, Bloch vectors, probabilities, counts and circuit diagrams"],
  ["AI assistance", "Evidence-grounded ARIA with disclosed deterministic or Gemini provenance"],
  ["Assessment and analytics", "Server grading, diagnostics, progress and instructor evidence"],
];

export default function JudgeDemo() {
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [readinessError, setReadinessError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl("/health/ready"), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Readiness check failed");
        return response.json() as Promise<Readiness>;
      })
      .then(setReadiness)
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setReadinessError(true);
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="ql-page ql-judge-page">
      <section className="ql-judge-hero">
        <div>
          <p className="ql-eyebrow">SIH 26140 · EVIDENCE WALKTHROUGH</p>
          <h1>One misconception. One verified learning loop.</h1>
          <p>
            This seven-minute path demonstrates the problem statement without
            touring disconnected features: diagnose, predict, simulate,
            explain, grade and measure.
          </p>
          <div className="ql-hero-actions">
            <Link to="/diagnostic?phase=baseline" className="ql-button ql-button-primary">
              Start the walkthrough <ArrowRight size={16} />
            </Link>
            <a
              href={apiUrl("/docs")}
              className="ql-button ql-button-white"
              target="_blank"
              rel="noreferrer"
            >
              Inspect API evidence
            </a>
          </div>
        </div>
        <div className={`ql-judge-readiness ${readinessError ? "error" : ""}`}>
          <Server size={22} />
          <span>LIVE SYSTEM EVIDENCE</span>
          {readiness ? (
            <>
              <strong>Ready for demonstration</strong>
              <small>Database: {readiness.database}</small>
              <small>Simulator: {readiness.simulation_backend}</small>
              <small>API version: {readiness.version}</small>
            </>
          ) : readinessError ? (
            <strong>Readiness endpoint unavailable</strong>
          ) : (
            <strong>Checking deployed services…</strong>
          )}
        </div>
      </section>

      <section className="ql-judge-section">
        <div className="ql-section-heading">
          <div>
            <span className="ql-eyebrow">THE DEMONSTRATION SCRIPT</span>
            <h2>Six steps, seven minutes.</h2>
          </div>
        </div>
        <div className="ql-judge-steps">
          {journey.map((step) => {
            const Icon = step.icon;
            return (
              <article key={step.number} className="ql-judge-step">
                <div className="ql-judge-step-number">{step.number}</div>
                <Icon size={21} />
                <span>{step.time}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <Link to={step.to}>
                  {step.action} <ArrowRight size={14} />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="ql-panel ql-judge-alignment">
        <div className="ql-panel-title">
          <div>
            <p className="ql-eyebrow">PROBLEM-STATEMENT TRACEABILITY</p>
            <h2>Requirement → inspectable evidence</h2>
          </div>
        </div>
        <div>
          {alignment.map(([requirement, evidence]) => (
            <div key={requirement} className="ql-judge-alignment-row">
              <CheckCircle2 size={17} />
              <strong>{requirement}</strong>
              <span>{evidence}</span>
            </div>
          ))}
        </div>
        <p className="ql-judge-boundary">
          <strong>Declared boundaries:</strong> Qiskit supports measurement and
          reset. Cirq and PennyLane currently cover the unitary editor subset.
          qBraid and real-hardware execution are optional integrations and are
          not represented as active when unavailable.
        </p>
      </section>
    </div>
  );
}
