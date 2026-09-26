import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Play,
  RotateCcw,
  Zap,
  BarChart3,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Share2,
  Sparkles,
  Layers,
  Shield,
  Eye,
} from "lucide-react";
import { Card, Badge } from "../../components/UI";
import { runBellState, type BellStateResult } from "../../api/algorithms";
import {
  ExperimentStatus,
  ResultBanner,
  ResultBar,
} from "../../components/AlgorithmLabUI";

const BELL_STATES = [
  {
    id: "phi_plus",
    label: "|Φ+⟩",
    name: "Phi Plus",
    formula: "(|00⟩ + |11⟩) / √2",
    desc: "Even parity, symmetric superposition",
  },
  {
    id: "phi_minus",
    label: "|Φ−⟩",
    name: "Phi Minus",
    formula: "(|00⟩ − |11⟩) / √2",
    desc: "Even parity with π relative phase",
  },
  {
    id: "psi_plus",
    label: "|Ψ+⟩",
    name: "Psi Plus",
    formula: "(|01⟩ + |10⟩) / √2",
    desc: "Odd parity, symmetric superposition",
  },
  {
    id: "psi_minus",
    label: "|Ψ−⟩",
    name: "Psi Minus (Singlet)",
    formula: "(|01⟩ − |10⟩) / √2",
    desc: "Rotational invariant singlet state",
  },
] as const;

type BellStateType = (typeof BELL_STATES)[number]["id"];

export default function BellStateAlgorithm() {
  const [selectedState, setSelectedState] = useState<BellStateType>("phi_plus");
  const [shots, setShots] = useState<number>(1024);
  const [measurementBasis, setMeasurementBasis] = useState<"Z" | "X" | "Y">(
    "Z",
  );
  const [noisePercent, setNoisePercent] = useState(0);
  const [result, setResult] = useState<BellStateResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "simulation" | "theory" | "code" | "challenge"
  >("simulation");
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const requestSeq = React.useRef(0);

  const handleRun = useCallback(async () => {
    const seq = ++requestSeq.current;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await runBellState({
        bell_state: selectedState,
        shots,
        measurement_basis: measurementBasis,
        noise_percent: noisePercent,
      });
      if (seq === requestSeq.current) setResult(res);
    } catch (e: any) {
      if (seq === requestSeq.current)
        setError(e.message ?? "Simulation failed");
    } finally {
      if (seq === requestSeq.current) setIsLoading(false);
    }
  }, [selectedState, shots, measurementBasis, noisePercent]);

  // Run on first load and whenever an experiment control changes.
  React.useEffect(() => {
    requestSeq.current += 1;
    setResult(null);
    setIsLoading(false);
    const timer = window.setTimeout(handleRun, 250);
    return () => {
      requestSeq.current += 1;
      window.clearTimeout(timer);
    };
  }, [handleRun]);

  const currInfo = BELL_STATES.find((s) => s.id === selectedState)!;

  return (
    <div className="algorithm-lab al-bell min-h-screen text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* ── Breadcrumb & Header ── */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
          <Link
            to="/algorithms"
            className="hover:text-brand-primary transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Algorithm Labs
          </Link>
          <span>/</span>
          <span className="text-brand-primary">AL-01</span>
        </div>

        <div className="al-header-main flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-brand-border">
          <div>
            <div className="al-title-line flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-orbitron font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Bell State Laboratory (AL-01)
              </h1>
              <Badge color="purple">Maximal Entanglement</Badge>
              <Badge color="cyan">Qiskit Aer backend</Badge>
            </div>
            <p className="text-text-secondary text-sm max-w-3xl">
              Prepare one of four Bell pairs, choose a measurement basis, and
              see how noise changes the measured outcomes and correlations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRun}
              disabled={isLoading}
              className="btn btn-primary flex items-center gap-2 !px-6 !py-3 shadow-lg shadow-brand-primary/20"
            >
              <Play className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Running…" : result ? "Run again" : "Run simulation"}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="al-tabs flex gap-2 mt-6 border-b border-brand-border/50 pb-2">
          {(["simulation", "theory", "code", "challenge"] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-orbitron tracking-wider uppercase transition-all ${
                  activeTab === tab
                    ? "bg-brand-primary/15 text-brand-primary border border-brand-primary/30"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                }`}
              >
                {tab}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto">
        <ExperimentStatus
          loading={isLoading}
          error={error}
          complete={!!result}
          detail={
            result
              ? `${result.measurement_basis} basis · ${Object.values(result.counts).reduce((a, b) => a + b, 0)} Qiskit Aer shots · ${result.noise_percent}% gate noise`
              : undefined
          }
        />
        {activeTab === "simulation" && (
          <>
            {result && (
              <ResultBanner
                label="Bell state result"
                value={result.state_label}
                detail={`${result.measurement_basis}-basis measurement · ${Object.values(result.counts).reduce((a, b) => a + b, 0)} Qiskit Aer shots`}
              >
                <aside>
                  Fidelity
                  <br />
                  <strong>{result.fidelity.toFixed(3)}</strong>
                </aside>
              </ResultBanner>
            )}
            <div className="al-layout grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Configuration Controls */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="p-6">
                  <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-brand-primary" /> Target Bell
                    State
                  </h3>

                  <div className="grid grid-cols-1 gap-3">
                    {BELL_STATES.map((s) => {
                      const active = selectedState === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSelectedState(s.id)}
                          className={`text-left p-4 rounded-xl border transition-all ${
                            active
                              ? "bg-indigo-500/15 border-indigo-500/50 shadow-md shadow-indigo-500/10"
                              : "bg-surface/50 border-brand-border/40 hover:border-brand-border hover:bg-surface"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-orbitron font-bold text-base text-text-primary">
                              {s.label}
                            </span>
                            <span className="text-xs font-mono text-indigo-400">
                              {s.name}
                            </span>
                          </div>
                          <div className="text-xs font-mono text-text-muted mb-1">
                            {s.formula}
                          </div>
                          <div className="text-[11px] text-text-secondary">
                            {s.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-6 border-t border-brand-border/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-text-secondary">
                        Execution Shots
                      </span>
                      <span className="text-xs font-mono text-brand-primary font-bold">
                        {shots}
                      </span>
                    </div>
                    <input
                      aria-label="Execution shots"
                      type="range"
                      min={128}
                      max={4096}
                      step={128}
                      value={shots}
                      onChange={(e) => setShots(Number(e.target.value))}
                      className="w-full accent-brand-primary bg-surface cursor-pointer"
                    />
                  </div>
                  <div className="mt-5 pt-5 border-t border-brand-border/40">
                    <span className="al-kicker">Measurement basis</span>
                    <div
                      className="al-flow"
                      role="group"
                      aria-label="Measurement basis"
                    >
                      {(["Z", "X", "Y"] as const).map((basis) => (
                        <button
                          key={basis}
                          className={
                            basis === measurementBasis ? "is-active" : ""
                          }
                          aria-pressed={basis === measurementBasis}
                          onClick={() => setMeasurementBasis(basis)}
                        >
                          {basis} basis
                        </button>
                      ))}
                    </div>
                    <label className="al-kicker" htmlFor="bell-noise">
                      Depolarizing gate noise · {noisePercent}%
                    </label>
                    <input
                      id="bell-noise"
                      type="range"
                      min="0"
                      max="15"
                      step="1"
                      value={noisePercent}
                      onChange={(e) => setNoisePercent(Number(e.target.value))}
                      className="w-full accent-indigo-400 mt-3"
                    />
                    <small className="text-text-muted">
                      Backend: Qiskit Aer · ideal statevector shown below
                    </small>
                  </div>
                </Card>

                {/* Quantum Metrics */}
                {result && (
                  <Card className="p-6 bg-gradient-to-br from-surface to-surface/40 border-brand-border">
                    <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase mb-4 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-pink-400" /> State
                      measures
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-surface/80 border border-brand-border/40">
                        <div className="text-[10px] uppercase font-mono text-text-muted">
                          Ideal entanglement entropy
                        </div>
                        <div className="text-xl font-bold font-mono text-pink-400 mt-1">
                          {result.entanglement_entropy.toFixed(2)}{" "}
                          <span className="text-xs font-normal text-text-muted">
                            bit
                          </span>
                        </div>
                        <div className="text-[10px] text-emerald-400 mt-0.5">
                          Prepared Bell state
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-surface/80 border border-brand-border/40">
                        <div className="text-[10px] uppercase font-mono text-text-muted">
                          Subsystem Purity Tr(ρ²)
                        </div>
                        <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                          {result.purity.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-text-muted mt-0.5">
                          Maximally Mixed
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-surface/80 border border-brand-border/40">
                        <div className="text-[10px] uppercase font-mono text-text-muted">
                          State fidelity to ideal
                        </div>
                        <div className="text-xl font-bold font-mono text-indigo-400 mt-1">
                          {result.fidelity.toFixed(3)}
                        </div>
                        <div className="text-[10px] text-text-muted mt-0.5">
                          Density matrix calculation
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-surface/80 border border-brand-border/40">
                        <div className="text-[10px] uppercase font-mono text-text-muted">
                          Execution Latency
                        </div>
                        <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
                          {result.execution_time_ms}{" "}
                          <span className="text-xs font-normal text-text-muted">
                            ms
                          </span>
                        </div>
                        <div className="text-[10px] text-text-muted mt-0.5">
                          Aer Simulator
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 pt-4 border-t border-brand-border/40">
                      <span className="al-kicker">
                        Expected correlations · simulated state
                      </span>
                      {(
                        [
                          ["ZZ", result.correlation_zz],
                          ["XX", result.correlation_xx],
                          ["YY", result.correlation_yy],
                        ] as const
                      ).map(([axis, value]) => (
                        <div key={axis} className="al-result-bar">
                          <div className="al-result-bar-heading">
                            <span>⟨{axis}⟩</span>
                            <strong>
                              {value >= 0 ? "+" : ""}
                              {value.toFixed(2)}
                            </strong>
                          </div>
                          <div
                            className="al-result-track"
                            role="img"
                            aria-label={`${axis} correlation ${value.toFixed(2)}`}
                          >
                            <span
                              style={{ width: `${Math.abs(value) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>

              {/* Right Column: Measurement & Statevector Visualizations */}
              <div className="lg:col-span-8 space-y-6">
                {/* Circuit Architecture View */}
                <Card className="p-6">
                  <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase mb-4 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-brand-primary" /> Circuit
                    Topology
                  </h3>
                  <div className="p-6 rounded-xl bg-black/40 border border-brand-border/50 font-mono text-sm overflow-x-auto">
                    <div className="flex items-center gap-4 py-2">
                      <span className="text-indigo-400 font-bold w-12">
                        q₀ |0⟩
                      </span>
                      <span className="text-slate-600">──</span>
                      {selectedState.includes("minus") ||
                      selectedState === "psi_minus" ? (
                        <span className="px-3 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                          X
                        </span>
                      ) : null}
                      <span className="px-3 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-bold">
                        H
                      </span>
                      <span className="text-slate-600">──●──</span>
                      <span className="text-slate-600">──[ M ]──</span>
                      <span className="text-xs text-text-muted">c₀</span>
                    </div>
                    <div className="flex items-center gap-4 py-2">
                      <span className="text-indigo-400 font-bold w-12">
                        q₁ |0⟩
                      </span>
                      <span className="text-slate-600">──</span>
                      {selectedState.startsWith("psi") ? (
                        <span className="px-3 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                          X
                        </span>
                      ) : null}
                      <span className="text-slate-600">─────</span>
                      <span className="px-3 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold">
                        ⊕
                      </span>
                      <span className="text-slate-600">──[ M ]──</span>
                      <span className="text-xs text-text-muted">c₁</span>
                    </div>
                  </div>
                  <p className="text-xs text-text-muted mt-3">
                    Preparation circuit shown.{" "}
                    {measurementBasis !== "Z"
                      ? `${measurementBasis}-basis rotations are applied before readout in Qiskit Aer.`
                      : "Z-basis readout follows."}
                  </p>
                </Card>

                {result && (
                  <Card className="al-bell-joint p-6">
                    <h3 className="al-kicker">
                      Joint outcomes · {result.measurement_basis} basis
                    </h3>
                    {["00", "01", "10", "11"].map((basis) => {
                      const count = result.counts[basis] ?? 0;
                      const total = Object.values(result.counts).reduce(
                        (a, b) => a + b,
                        0,
                      );
                      return (
                        <ResultBar
                          key={basis}
                          label={`|${basis}⟩`}
                          value={total ? count / total : 0}
                          detail={`${count} of ${total} shots`}
                        />
                      );
                    })}
                  </Card>
                )}

                {/* Statevector Amplitudes & Measurement Histogram */}
                {result && (
                  <details className="al-advanced">
                    <summary>
                      Explore the ideal statevector and shot breakdown
                    </summary>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Exact Statevector */}
                      <Card className="p-6">
                        <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase mb-4 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-400" />{" "}
                          Statevector Amplitudes |ψ⟩
                        </h3>
                        <div className="space-y-4">
                          {result.statevector.map((state) => {
                            const pct = Math.round(state.probability * 100);
                            const isNonZero = state.probability > 0.01;
                            return (
                              <div key={state.basis} className="space-y-1">
                                <div className="flex justify-between text-xs font-mono">
                                  <span
                                    className={
                                      isNonZero
                                        ? "text-text-primary font-bold"
                                        : "text-text-muted"
                                    }
                                  >
                                    |{state.basis}⟩
                                  </span>
                                  <span className="text-text-secondary">
                                    {pct}%{" "}
                                    {state.phase_rad > 0
                                      ? `(phase: ${(state.phase_rad / Math.PI).toFixed(2)}π)`
                                      : ""}
                                  </span>
                                </div>
                                <div className="h-3 w-full bg-surface-raised rounded-full overflow-hidden border border-brand-border/40">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.5 }}
                                    className={`h-full ${
                                      state.phase_rad > 0
                                        ? "bg-gradient-to-r from-amber-500 to-rose-500"
                                        : "bg-gradient-to-r from-indigo-500 to-cyan-500"
                                    }`}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Card>

                      {/* Measurement Shots Histogram */}
                      <Card className="p-6">
                        <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase mb-4 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-cyan-400" /> Qiskit
                          Aer Shots ({result.measurement_basis} basis)
                        </h3>
                        <div className="space-y-4">
                          {["00", "01", "10", "11"].map((basis) => {
                            const count = result.counts[basis] || 0;
                            const pct = Math.round((count / shots) * 100);
                            return (
                              <div key={basis} className="space-y-1">
                                <div className="flex justify-between text-xs font-mono">
                                  <span
                                    className={
                                      count > 0
                                        ? "text-cyan-300 font-bold"
                                        : "text-text-muted"
                                    }
                                  >
                                    |{basis}⟩
                                  </span>
                                  <span className="text-text-secondary">
                                    {count} shots ({pct}%)
                                  </span>
                                </div>
                                <div className="h-3 w-full bg-surface-raised rounded-full overflow-hidden border border-brand-border/40">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.5 }}
                                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    </div>
                  </details>
                )}

                {/* Physical Insight Explainer */}
                {result && (
                  <Card className="p-6 bg-brand-primary/5 border-brand-primary/20">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary flex-shrink-0">
                        <Info className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-orbitron font-bold text-sm text-brand-primary mb-1">
                          Quantum Reality: The EPR Paradox Demystified
                        </h4>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          {result.explanation}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </>
        )}

        {/* Theory Tab */}
        {activeTab === "theory" && (
          <div className="space-y-6 max-w-4xl">
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-orbitron font-bold text-indigo-400">
                The 4 Bell States (EPR Pairs)
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                The Bell states form a complete orthonormal basis of the
                two-qubit Hilbert space ℂ⁴. Unlike product states such as |00⟩
                or |+0⟩, Bell states cannot be factored into single-qubit
                states: |ψ⟩ ≠ |ψ₁⟩ ⊗ |ψ₂⟩.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {BELL_STATES.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl bg-surface/60 border border-brand-border"
                  >
                    <div className="text-base font-orbitron font-bold text-brand-primary">
                      {s.label}
                    </div>
                    <div className="text-sm font-mono text-indigo-300 mt-1">
                      {s.formula}
                    </div>
                    <p className="text-xs text-text-muted mt-2">{s.desc}</p>
                  </div>
                ))}
              </div>

              <h4 className="text-sm font-orbitron font-bold text-pink-400 pt-4">
                No-Communication Theorem
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Even though measuring Alice's qubit collapses Bob's state
                instantaneously, Alice has zero control over whether she
                measures 0 or 1. Thus, the reduced density matrix of Bob's qubit
                remains exactly ρ_B = I/2 regardless of Alice's action. No
                faster-than-light signal can be sent.
              </p>
            </Card>
          </div>
        )}

        {/* Code Tab */}
        {activeTab === "code" && (
          <Card className="p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-orbitron font-bold text-cyan-400">
                Qiskit Python Implementation
              </h3>
              <Badge color="cyan">Qiskit 1.x</Badge>
            </div>
            <pre className="p-4 rounded-xl bg-black/60 border border-brand-border font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed">
              {`from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector, partial_trace, entropy
from qiskit_aer import AerSimulator

# 1. Initialize 2-qubit circuit
qc = QuantumCircuit(2, 2)

${selectedState === "phi_minus" ? "# Phase flip\nqc.x(0)\n" : ""}${selectedState.startsWith("psi") ? "# Bit flip on target\nqc.x(1)\n" : ""}# Create superposition on control
qc.h(0)

# Entangle with CNOT
qc.cx(0, 1)

# Inspect pure statevector
sv = Statevector(qc)
print("Bell Statevector:", sv)

# Check entanglement entropy
dm_q0 = partial_trace(sv, [1])
s_entropy = entropy(dm_q0, base=2)
print(f"Von Neumann Entropy S(q0): {s_entropy:.2f} bit")  # Outputs 1.00

# Measure both qubits
qc.measure([0, 1], [0, 1])

# Run on Aer simulator
sim = AerSimulator()
counts = sim.run(qc, shots=1024).result().get_counts()
print("Measurement counts:", counts)`}
            </pre>
          </Card>
        )}

        {/* Challenge Tab */}
        {activeTab === "challenge" && (
          <Card className="p-8 max-w-3xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                ?
              </div>
              <div>
                <h3 className="text-base font-orbitron font-bold text-text-primary">
                  Cognitive Challenge: Entanglement vs Mixed States
                </h3>
                <p className="text-xs text-text-muted">
                  Test your understanding of non-separable quantum systems
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface/60 border border-brand-border space-y-3">
              <p className="text-sm text-text-primary">
                Suppose Alice and Bob share a Bell pair |Φ+⟩. Alice measures her
                qubit in the computational basis and gets |1⟩. Before Bob
                measures, what is the state of Bob's qubit?
              </p>

              <div className="space-y-2 mt-4">
                {[
                  "Bob has a 50% chance of being in |0⟩ and 50% chance of |1⟩.",
                  "Bob is definitely in |1⟩ with 100% certainty.",
                  "Bob's qubit is in the superposition state |+⟩.",
                  "Bob's state is destroyed by Alice's measurement.",
                ].map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuizAnswer(idx);
                      setQuizSubmitted(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg text-xs font-medium border transition-all ${
                      quizAnswer === idx
                        ? "bg-brand-primary/20 border-brand-primary text-brand-primary"
                        : "bg-surface/40 border-brand-border/40 hover:bg-surface text-text-secondary"
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}) {opt}
                  </button>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  disabled={quizAnswer === null}
                  onClick={() => setQuizSubmitted(true)}
                  className="btn btn-primary text-xs !px-6"
                >
                  Check Answer
                </button>

                {quizSubmitted && (
                  <div className="text-xs font-bold">
                    {quizAnswer === 1 ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Correct! Measuring
                        Alice's qubit as |1⟩ projects Bob's qubit into |1⟩
                        immediately.
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> Incorrect. In |Φ+⟩
                        = (|00⟩+|11⟩)/√2, if Alice obtains |1⟩, the composite
                        state collapsed to |11⟩.
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
