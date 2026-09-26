import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Play,
  Zap,
  BarChart3,
  Info,
  ArrowLeft,
  Layers,
  Shield,
  Sparkles,
  Compass,
} from "lucide-react";
import { Card, Badge } from "../../components/UI";
import { runQFT, type QFTResult } from "../../api/algorithms";
import {
  ExperimentStatus,
  ResultBanner,
} from "../../components/AlgorithmLabUI";

export default function QFTLab() {
  const [nQubits, setNQubits] = useState<number>(3);
  const [basisState, setBasisState] = useState<number>(1);
  const [shots, setShots] = useState<number>(1024);
  const [result, setResult] = useState<QFTResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spectrumMode, setSpectrumMode] = useState<"phase" | "amplitude">(
    "phase",
  );
  const [activeTab, setActiveTab] = useState<
    "simulation" | "theory" | "code" | "shor"
  >("simulation");
  const requestSeq = useRef(0);

  const maxStates = 1 << nQubits;

  const handleRun = useCallback(async () => {
    const seq = ++requestSeq.current;
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await runQFT({
        n_qubits: nQubits,
        input_basis_state: basisState,
        shots,
      });
      if (seq === requestSeq.current) setResult(res);
    } catch (e: any) {
      if (seq === requestSeq.current)
        setError(e.message ?? "Simulation failed");
    } finally {
      if (seq === requestSeq.current) setIsLoading(false);
    }
  }, [nQubits, basisState, shots]);

  useEffect(() => {
    // If nQubits changes and basisState exceeds range, adjust
    if (basisState >= maxStates) {
      setBasisState(0);
    }
  }, [nQubits, maxStates]);

  useEffect(() => {
    requestSeq.current += 1;
    setResult(null);
    setIsLoading(false);
    if (basisState >= maxStates) return;
    const timer = window.setTimeout(handleRun, 250);
    return () => {
      requestSeq.current += 1;
      window.clearTimeout(timer);
    };
  }, [handleRun, basisState, maxStates]);

  return (
    <div className="algorithm-lab al-qft min-h-screen text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb & Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
          <Link
            to="/algorithms"
            className="hover:text-brand-primary transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Algorithm Labs
          </Link>
          <span>/</span>
          <span className="text-brand-primary">AL-05</span>
        </div>

        <div className="al-header-main flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-brand-border">
          <div>
            <div className="al-title-line flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-orbitron font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">
                Quantum Fourier Transform (AL-05)
              </h1>
              <Badge color="gold">Fourier Basis</Badge>
              <Badge color="cyan">Phase Encoding</Badge>
            </div>
            <p className="text-text-secondary text-sm max-w-3xl">
              Maps computational basis states to the Fourier phase basis.
              Transforms position into frequency space with gate complexity
              O(n²), powering Shor's algorithm and Quantum Phase Estimation.
            </p>
          </div>

          <button
            onClick={handleRun}
            disabled={isLoading}
            className="btn btn-primary flex items-center gap-2 !px-6 !py-3 shadow-lg shadow-amber-500/20"
          >
            <Play className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Running…" : result ? "Run again" : "Transform state"}
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="al-tabs flex gap-2 mt-6 border-b border-brand-border/50 pb-2">
          {(["simulation", "theory", "code", "shor"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-orbitron tracking-wider uppercase transition-all ${
                activeTab === tab
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/5"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <ExperimentStatus
          loading={isLoading}
          error={error}
          complete={!!result}
          detail={
            result
              ? `${Object.values(result.counts).reduce((a, b) => a + b, 0)} Qiskit Aer shots · n=${nQubits} · |${basisState.toString(2).padStart(nQubits, "0")}⟩ input`
              : undefined
          }
        />
        {activeTab === "simulation" && (
          <>
            {result && (
              <ResultBanner
                label="Fourier transformation"
                value={`|${basisState.toString(2).padStart(nQubits, "0")}⟩ → ${maxStates} phase-coded states`}
                detail={`Every output has ${(result.output_amplitudes[0].probability * 100).toFixed(2)}% ideal probability. The input changes phase, not the measurement distribution.`}
              >
                <aside>
                  Phase step
                  <br />
                  2π × {basisState} / {maxStates}
                </aside>
              </ResultBanner>
            )}
            <div className="al-layout grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Configuration Controls */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="p-6">
                  <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase mb-4 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-amber-400" /> Input Basis
                    State |j⟩
                  </h3>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-text-secondary font-medium">
                        Input Register Size (n)
                      </span>
                      <span className="font-mono text-amber-400 font-bold">
                        {nQubits} Qubits ({maxStates} states)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {[2, 3, 4].map((n) => (
                        <button
                          key={n}
                          onClick={() => setNQubits(n)}
                          className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                            nQubits === n
                              ? "bg-amber-500/20 border-amber-500 text-amber-300"
                              : "bg-surface/60 border-brand-border/40 text-text-muted hover:text-text-primary"
                          }`}
                        >
                          n={n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-text-secondary font-medium">
                        Select State |j⟩
                      </span>
                      <span className="font-mono text-amber-400 font-bold">
                        j = {basisState} (|
                        {basisState.toString(2).padStart(nQubits, "0")}⟩)
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                      {Array.from({ length: maxStates }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setBasisState(i)}
                          className={`py-2 px-1 rounded-lg text-xs font-mono border transition-all ${
                            basisState === i
                              ? "bg-amber-500/25 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-500/10"
                              : "bg-surface/50 border-brand-border/40 text-text-muted hover:bg-surface"
                          }`}
                        >
                          |{i}⟩
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Quantum Metrics */}
                {result && (
                  <Card className="p-6 bg-gradient-to-br from-surface to-surface/40 border-brand-border">
                    <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase mb-4 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-orange-400" /> Fourier
                      Invariants
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-surface/80 border border-brand-border/40">
                        <div className="text-[10px] uppercase font-mono text-text-muted">
                          Magnitude Per State
                        </div>
                        <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                          1/√{maxStates}
                        </div>
                        <div className="text-[10px] text-emerald-400 mt-0.5">
                          Uniform Superposition
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-surface/80 border border-brand-border/40">
                        <div className="text-[10px] uppercase font-mono text-text-muted">
                          Phase Step Δθ
                        </div>
                        <div className="text-xl font-bold font-mono text-orange-400 mt-1">
                          {((basisState * 2) / maxStates).toFixed(2)}π
                        </div>
                        <div className="text-[10px] text-text-muted mt-0.5">
                          2πj/N radians
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-surface/80 border border-brand-border/40">
                        <div className="text-[10px] uppercase font-mono text-text-muted">
                          Gate Complexity
                        </div>
                        <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
                          O(n²)
                        </div>
                        <div className="text-[10px] text-emerald-400 mt-0.5">
                          vs O(N log N) classical
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-surface/80 border border-brand-border/40">
                        <div className="text-[10px] uppercase font-mono text-text-muted">
                          Circuit Depth
                        </div>
                        <div className="text-xl font-bold font-mono text-purple-400 mt-1">
                          {result.circuit_depth}
                        </div>
                        <div className="text-[10px] text-text-muted mt-0.5">
                          {result.execution_time_ms} ms
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>

              {/* Right Column: Phasor Clocks & Amplitudes */}
              <div className="lg:col-span-8 space-y-6">
                {result && (
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase flex items-center gap-2">
                          <Compass className="w-4 h-4 text-amber-400" /> Quantum
                          Phase Circles (Fourier Basis Spectrum)
                        </h3>
                        <p className="text-xs text-text-secondary mt-1">
                          Each state |k⟩ has equal amplitude magnitude 1/√
                          {maxStates}, but its relative phase angle is θ_k =
                          2π·j·k / {maxStates}.
                        </p>
                      </div>
                      <Badge color="gold">j = {basisState}</Badge>
                    </div>
                    <div
                      className="al-flow"
                      role="group"
                      aria-label="Spectrum display"
                    >
                      <button
                        className={spectrumMode === "phase" ? "is-active" : ""}
                        aria-pressed={spectrumMode === "phase"}
                        onClick={() => setSpectrumMode("phase")}
                      >
                        Phase vectors
                      </button>
                      <button
                        className={
                          spectrumMode === "amplitude" ? "is-active" : ""
                        }
                        aria-pressed={spectrumMode === "amplitude"}
                        onClick={() => setSpectrumMode("amplitude")}
                      >
                        Amplitude
                      </button>
                    </div>

                    {/* Phasor Clocks Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {result.output_amplitudes.map((amp) => {
                        const normalizedTurns = ((amp.phase_turns % 1) + 1) % 1;
                        const phaseDeg = normalizedTurns * 360;
                        return (
                          <div
                            key={amp.basis}
                            className="p-4 rounded-xl bg-surface/50 border border-brand-border/40 flex flex-col items-center text-center group hover:border-amber-500/50 transition-all"
                          >
                            <span className="font-mono text-xs font-bold text-amber-300 mb-2">
                              |{amp.basis}⟩
                            </span>

                            {spectrumMode === "phase" ? (
                              <>
                                <div className="relative w-16 h-16 rounded-full border-2 border-amber-500/30 flex items-center justify-center bg-black/40 my-2">
                                  <motion.div
                                    key={`${basisState}-${amp.basis}`}
                                    initial={{ rotate: 0 }}
                                    animate={{ rotate: phaseDeg }}
                                    transition={{ duration: 0.55 }}
                                    className="absolute w-1 h-7 bg-gradient-to-t from-transparent to-amber-400 rounded-full origin-bottom"
                                    style={{ bottom: "50%" }}
                                  />
                                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                                </div>
                                <span className="text-[11px] font-mono text-text-secondary mt-1">
                                  {normalizedTurns.toFixed(3)} turns
                                </span>
                                <span className="text-[10px] font-mono text-text-muted">
                                  {(normalizedTurns * 2).toFixed(3)}π rad
                                </span>
                              </>
                            ) : (
                              <>
                                <strong className="text-2xl text-amber-300 my-3">
                                  {(amp.probability * 100).toFixed(2)}%
                                </strong>
                                <div
                                  className="al-result-track w-full"
                                  role="img"
                                  aria-label={`|${amp.basis}⟩: ${(amp.probability * 100).toFixed(2)} percent`}
                                >
                                  <span
                                    style={{
                                      width: `${amp.probability * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-[11px] font-mono text-text-secondary mt-1">
                                  |amplitude| ={" "}
                                  {Math.sqrt(amp.probability).toFixed(3)}
                                </span>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {/* Statevector Uniform Probability Bar */}
                {result && (
                  <Card className="p-6">
                    <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-cyan-400" />{" "}
                      Computational Basis Measurement Probabilities
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono text-text-secondary mb-1">
                        <span>All {maxStates} States Equal</span>
                        <span className="text-cyan-400 font-bold">
                          {(
                            result.output_amplitudes[0].probability * 100
                          ).toFixed(2)}
                          % each · ideal
                        </span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {result.output_amplitudes.map((amp) => (
                          <div
                            key={amp.basis}
                            className="p-2 rounded bg-surface/60 border border-brand-border/30 text-center"
                          >
                            <div className="text-[10px] font-mono text-text-muted">
                              |{amp.basis}⟩
                            </div>
                            <div className="text-xs font-mono font-bold text-cyan-300 mt-1">
                              {(amp.probability * 100).toFixed(2)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                )}

                {/* Explainer */}
                {result && (
                  <Card className="p-6 bg-brand-primary/5 border-brand-primary/20">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                        <Info className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-orbitron font-bold text-sm text-amber-300 mb-1">
                          Quantum Phase Transform Explained
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
          <div className="max-w-4xl space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-orbitron font-bold text-amber-400">
                The Quantum Fourier Transform Definition
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                The discrete Fourier transform acts on vector (x₀, …,
                x&#x2081;&#x208B;&#x2081;) mapping it to (y₀, …,
                y&#x2081;&#x208B;&#x2081;) where:
                <br />
                <code className="block my-2 p-3 rounded bg-black/40 border border-brand-border font-mono text-amber-300">
                  y_k = (1/√N) Σ_j=0^(N-1) x_j e^(2π i j k / N)
                </code>
                In quantum mechanics, the QFT maps computational basis states
                $|j\rangle$ to superpositions:
                <br />
                <code className="block my-2 p-3 rounded bg-black/40 border border-brand-border font-mono text-cyan-300">
                  |j⟩ → (1/√N) Σ_k=0^(N-1) e^(2π i j k / N) |k⟩
                </code>
              </p>

              <h4 className="text-base font-orbitron font-bold text-orange-400 pt-2">
                Product Representation
              </h4>
              <p className="text-sm text-text-secondary leading-relaxed">
                Remarkably, the output state can be factored into a tensor
                product of single qubits:
                <br />
                <code className="block my-2 p-3 rounded bg-black/40 border border-brand-border font-mono text-emerald-300">
                  |j⟩ → (|0⟩ + e^(2π i 0.j_n)|1⟩) ⊗ (|0⟩ + e^(2π i
                  0.j_(n-1)j_n)|1⟩) ⊗ ... ⊗ (|0⟩ + e^(2π i 0.j_1...j_n)|1⟩) /
                  2^(n/2)
                </code>
                This product structure enables the circuit to be constructed
                using only Hadamard and controlled phase gates with O(n²)
                complexity!
              </p>
            </Card>
          </div>
        )}

        {/* Code Tab */}
        {activeTab === "code" && (
          <Card className="p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-orbitron font-bold text-amber-400">
                Qiskit QFT Circuit Construction
              </h3>
              <Badge color="gold">Qiskit Aer</Badge>
            </div>
            <pre className="p-4 rounded-xl bg-black/60 border border-brand-border font-mono text-xs text-amber-300 overflow-x-auto leading-relaxed">
              {`import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector

def build_qft(n: int) -> QuantumCircuit:
    qc = QuantumCircuit(n)
    for j in range(n):
        qc.h(j)
        for k in range(j + 1, n):
            # Controlled phase gate R_k
            qc.cp(np.pi / (2 ** (k - j)), k, j)
    # Reverse qubit order with SWAP gates
    for i in range(n // 2):
        qc.swap(i, n - i - 1)
    return qc

n = ${nQubits}
qc = QuantumCircuit(n)

# Initialize basis state |${basisState}⟩
${basisState
  .toString(2)
  .padStart(nQubits, "0")
  .split("")
  .reverse()
  .map((b, idx) => (b === "1" ? `qc.x(${idx})` : null))
  .filter(Boolean)
  .join("\n")}

# Apply QFT
qft = build_qft(n)
qc.compose(qft, inplace=True)

# Inspect Fourier statevector
sv = Statevector(qc)
print("Fourier Amplitudes:", sv.data)`}
            </pre>
          </Card>
        )}

        {/* Shor Tab */}
        {activeTab === "shor" && (
          <Card className="p-6 max-w-4xl space-y-4">
            <h3 className="text-lg font-orbitron font-bold text-cyan-400">
              How QFT Powers Shor's Factoring Algorithm
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Factoring a large integer $N$ classically reduces to{" "}
              <strong>period finding</strong>: finding the smallest $r$ such
              that $a^r \equiv 1 \pmod N$.
            </p>
            <div className="p-4 rounded-xl bg-surface/60 border border-brand-border space-y-2 text-xs text-text-secondary">
              <p className="text-text-primary font-bold">
                The Quantum Acceleration:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  A quantum computer evaluates $f(x) = a^x \pmod N$ in
                  superposition for all $x$.
                </li>
                <li>This creates a periodic state with period $r$.</li>
                <li>
                  Applying the <strong>Inverse QFT</strong> causes constructive
                  interference at frequencies that are integer multiples of
                  $1/r$.
                </li>
                <li>
                  Measuring the register yields $r$ with high probability in
                  polynomial time Õ((log N)³), breaking RSA encryption!
                </li>
              </ul>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
