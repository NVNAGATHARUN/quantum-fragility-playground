import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Play, Zap, BarChart3, Info, CheckCircle2,
  AlertTriangle, ArrowLeft, Layers, Shield, Sparkles, Scale
} from 'lucide-react';
import { Card, Badge } from '../../components/UI';
import { runDeutschJozsa, type DeutschJozsaResult } from '../../api/algorithms';

export default function DeutschJozsa() {
  const [oracleType, setOracleType] = useState<'constant_0' | 'constant_1' | 'balanced'>('balanced');
  const [nQubits, setNQubits] = useState<number>(3);
  const [shots, setShots] = useState<number>(1024);
  const [result, setResult] = useState<DeutschJozsaResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(2);
  const [activeTab, setActiveTab] = useState<'simulation' | 'evolution' | 'oracle' | 'theory' | 'code' | 'advantage'>('simulation');

  const handleRun = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await runDeutschJozsa({ oracle_type: oracleType, n_qubits: nQubits, shots });
      setResult(res);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [oracleType, nQubits, shots]);

  useEffect(() => {
    handleRun();
  }, [oracleType, nQubits]);

  const classicalWorstCase = Math.pow(2, nQubits - 1) + 1;
  const allZeros = '0'.repeat(nQubits);

  return (
    <div className="min-h-screen text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb & Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
          <Link to="/explore/algorithms" className="hover:text-brand-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Algorithm Labs
          </Link>
          <span>/</span>
          <span className="text-brand-primary">AL-02</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-brand-border">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-orbitron font-bold bg-gradient-to-r from-purple-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Deutsch-Jozsa Algorithm (AL-02)
              </h1>
              <Badge color="purple">Exponential Speedup</Badge>
              <Badge color="cyan">Phase Kickback</Badge>
            </div>
            <p className="text-text-secondary text-sm max-w-3xl">
              The first algorithm proving deterministic quantum superiority. Distinguishes whether a black-box oracle
              is constant or balanced with a <strong className="text-purple-300 font-semibold">single query</strong>,
              whereas any classical deterministic algorithm requires up to 2^(n-1) + 1 evaluations.
            </p>
          </div>

          <button
            onClick={handleRun}
            disabled={isLoading}
            className="btn btn-primary flex items-center gap-2 !px-6 !py-3 shadow-lg shadow-brand-primary/20"
          >
            <Play className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Querying Oracle...' : 'Run Single Query'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6 border-b border-brand-border/50 pb-2">
          {(['simulation', 'evolution', 'oracle', 'theory', 'code', 'advantage'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-orbitron tracking-wider uppercase transition-all ${
                activeTab === tab
                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              {tab === 'simulation' ? 'Simulation' : tab === 'evolution' ? 'State Evolution' : tab === 'oracle' ? 'Oracle Visualizer' : tab === 'theory' ? 'Theory' : tab === 'code' ? 'Code' : 'Advantage'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {activeTab === 'simulation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Configuration */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="p-6">
                <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" /> Black-Box Oracle Type
                </h3>

                <div className="space-y-3">
                  {[
                    { id: 'balanced', label: 'Balanced Oracle', desc: 'Returns 0 for half of inputs, 1 for the other half' },
                    { id: 'constant_0', label: 'Constant 0 (f(x) = 0)', desc: 'Returns 0 for all possible inputs' },
                    { id: 'constant_1', label: 'Constant 1 (f(x) = 1)', desc: 'Returns 1 for all possible inputs' },
                  ].map(o => {
                    const active = oracleType === o.id;
                    return (
                      <button
                        key={o.id}
                        onClick={() => setOracleType(o.id as any)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          active
                            ? 'bg-purple-500/15 border-purple-500/50 shadow-md shadow-purple-500/10'
                            : 'bg-surface/50 border-brand-border/40 hover:bg-surface'
                        }`}
                      >
                        <div className="font-orbitron font-bold text-sm text-text-primary mb-1">{o.label}</div>
                        <div className="text-[11px] text-text-secondary">{o.desc}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-brand-border/40 space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-text-secondary font-medium">Input Register Qubits (n)</span>
                      <span className="font-mono text-purple-400 font-bold">{nQubits} Qubits ({Math.pow(2, nQubits)} states)</span>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map(n => (
                        <button
                          key={n}
                          onClick={() => setNQubits(n)}
                          className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                            nQubits === n
                              ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                              : 'bg-surface/60 border-brand-border/40 text-text-muted hover:text-text-primary'
                          }`}
                        >
                          n={n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-text-secondary font-medium">Shots</span>
                      <span className="font-mono text-brand-primary font-bold">{shots}</span>
                    </div>
                    <input
                      type="range"
                      min={256}
                      max={4096}
                      step={256}
                      value={shots}
                      onChange={e => setShots(Number(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>
                </div>
              </Card>

              {/* Speedup Metric Card */}
              <Card className="p-6 bg-gradient-to-br from-surface to-surface/40 border-brand-border">
                <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase mb-4 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-cyan-400" /> Query Complexity Comparison
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-surface/80 border border-brand-border/40">
                    <div className="text-[10px] uppercase font-mono text-text-muted">Classical Queries</div>
                    <div className="text-xl font-bold font-mono text-rose-400 mt-1">
                      {classicalWorstCase} <span className="text-xs font-normal text-text-muted">evals</span>
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">2^(n-1) + 1</div>
                  </div>
                  <div className="p-3 rounded-lg bg-surface/80 border border-brand-border/40">
                    <div className="text-[10px] uppercase font-mono text-text-muted">Quantum Queries</div>
                    <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                      1 <span className="text-xs font-normal text-text-muted">eval</span>
                    </div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">Exponentially faster</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column: Results & Phase Interference */}
            <div className="lg:col-span-8 space-y-6">
              {result && (
                <Card className="p-6 border-purple-500/30 bg-purple-500/5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-orbitron tracking-widest uppercase text-text-muted mb-1">
                        Algorithm Decision
                      </div>
                      <div className="text-2xl font-orbitron font-bold flex items-center gap-3">
                        <span className={result.result === 'constant' ? 'text-cyan-400' : 'text-purple-400'}>
                          {result.result.toUpperCase()} ORACLE
                        </span>
                        <Badge color={result.result === 'constant' ? 'cyan' : 'purple'}>
                          100% Deterministic
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-text-muted">Circuit Depth: {result.circuit_depth}</div>
                      <div className="text-xs font-mono text-text-muted">Time: {result.execution_time_ms} ms</div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Statevector Register Distribution */}
              {result && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-purple-400" /> Input Register Measurement Probabilities
                    </h3>
                    <span className="text-xs font-mono text-text-muted">
                      Constant = 100% |{allZeros}⟩ | Balanced = 0% |{allZeros}⟩
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
                    {result.statevector.map(state => {
                      const pct = Math.round(state.probability * 100);
                      const isZeroState = state.basis === allZeros;
                      return (
                        <div key={state.basis} className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span className={`flex items-center gap-2 ${isZeroState ? 'text-amber-300 font-bold' : 'text-text-secondary'}`}>
                              |{state.basis}⟩ {isZeroState && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">|0...0⟩</span>}
                            </span>
                            <span className="text-text-muted">{pct}% ({state.probability.toFixed(3)})</span>
                          </div>
                          <div className="h-3 w-full bg-surface-raised rounded-full overflow-hidden border border-brand-border/40">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.5 }}
                              className={`h-full ${
                                isZeroState
                                  ? 'bg-gradient-to-r from-amber-500 to-cyan-400'
                                  : 'bg-gradient-to-r from-purple-500 to-violet-400'
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Interference Explainer */}
              {result && (
                <Card className="p-6 bg-brand-primary/5 border-brand-primary/20">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                      <Info className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-orbitron font-bold text-sm text-purple-300 mb-1">
                        Quantum Interference Mechanism
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
        )}

        {/* State Evolution Tab */}
        {activeTab === 'evolution' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" /> Algorithmic State Evolution Across Circuit Stages
              </h3>

              {/* 5-Step Stage Stepper */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {[
                  { step: 1, name: 'Initialization', desc: 'Input in |0...0⟩, ancilla in |1⟩' },
                  { step: 2, name: 'Superposition', desc: 'Hadamards create uniform |+...+) and |−⟩' },
                  { step: 3, name: 'Phase Kickback', desc: 'Oracle kicks (-1)^f(x) into amplitudes' },
                  { step: 4, name: 'Interference', desc: 'Final Hadamards compute inner product' },
                  { step: 5, name: 'Measurement', desc: 'Deterministically read Constant or Balanced' },
                ].map((st, i) => (
                  <button
                    key={st.step}
                    onClick={() => setActiveStep(i)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      activeStep === i
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-surface/60 border-brand-border/40 text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <div className="text-[10px] font-mono uppercase text-text-muted">Step {st.step}</div>
                    <div className="font-orbitron font-bold text-xs mt-0.5">{st.name}</div>
                  </button>
                ))}
              </div>

              {/* Selected Step Detail */}
              <div className="p-5 rounded-xl bg-black/40 border border-brand-border space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-orbitron font-bold text-sm text-purple-300">
                    Step {activeStep + 1}: {[
                      'Input Register Initialization (|0...0⟩ ⊗ |1⟩)',
                      'Equal Superposition & Ancilla Preparation (|ψ₁⟩ = H^⊗n |0⟩ ⊗ H|1⟩)',
                      'Black-Box Oracle Query & Phase Kickback (U_f |x⟩|−⟩ = (-1)^f(x) |x⟩|−⟩)',
                      'Final Hadamard Transform & Quantum Interference (H^⊗n |x⟩)',
                      'Input Register Measurement & Deterministic Verdict',
                    ][activeStep]}
                  </h4>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {[
                    'The algorithm begins by setting all n input qubits into |0⟩ and the ancilla qubit into |1⟩ using an X gate.',
                    'Hadamard gates applied to all qubits transform the input register into an equal superposition of all 2^n states and the ancilla into |−⟩ = (|0⟩ - |1⟩)/√2.',
                    `The black-box oracle applies U_f. Because the ancilla is in state |−⟩, evaluating f(x) flips the relative phase by (-1)^f(x) for each basis state |x⟩ without modifying the ancilla. (Oracle is currently: ${oracleType}).`,
                    'A second set of Hadamard gates is applied to the input register. For the all-zeros state |0...0⟩, constructive interference occurs if all phases are identical (constant oracle), while complete destructive interference cancels it out if half the phases are inverted (balanced oracle).',
                    `Measurement of the n input qubits yields |0...0⟩ with probability ${oracleType.startsWith('constant') ? '100%' : '0%'}. A single measurement reveals with 100% certainty whether f is constant or balanced!`,
                  ][activeStep]}
                </p>

                {/* State Vector Preview for Selected Step */}
                <div className="pt-2">
                  <div className="text-[10px] font-mono text-text-muted mb-2 uppercase">Input Register Amplitude Breakdown:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                    {Array.from({ length: 1 << nQubits }).map((_, idx) => {
                      const basis = idx.toString(2).padStart(nQubits, '0');
                      const isZero = basis === allZeros;
                      // Phase kickback value
                      let phaseVal = 0;
                      if (oracleType === 'constant_1') phaseVal = Math.PI;
                      else if (oracleType === 'balanced') phaseVal = idx % 2 === 1 ? Math.PI : 0;

                      // Probability depending on step
                      let prob = 0;
                      if (activeStep === 0) prob = isZero ? 1 : 0;
                      else if (activeStep === 1 || activeStep === 2) prob = 1 / (1 << nQubits);
                      else if (activeStep >= 3) {
                        prob = oracleType.startsWith('constant') ? (isZero ? 1 : 0) : (isZero ? 0 : 1 / ((1 << nQubits) - 1));
                      }

                      return (
                        <div key={basis} className={`p-2 rounded-lg border text-center ${isZero ? 'bg-amber-500/10 border-amber-500/30' : 'bg-surface border-brand-border/30'}`}>
                          <div className={`font-mono text-xs font-bold ${isZero ? 'text-amber-300' : 'text-text-primary'}`}>
                            |{basis}⟩
                          </div>
                          <div className="text-[10px] font-mono text-purple-400 mt-1">
                            {Math.round(prob * 100)}%
                          </div>
                          {activeStep === 2 && (
                            <div className="text-[9px] font-mono text-cyan-300 mt-0.5">
                              {phaseVal === 0 ? '+1' : '-1'}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Oracle Visualizer Tab */}
        {activeTab === 'oracle' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-orbitron font-bold text-purple-400">
                    Phase Kickback Oracle Inspector
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">
                    Inspect the truth table of f(x) and see how evaluating the oracle kicks the output into the relative phase dial of each basis state.
                  </p>
                </div>
                <Badge color="purple">Type: {oracleType}</Badge>
              </div>

              {/* Truth Table & Phase Dials */}
              <div className="overflow-x-auto p-4 rounded-xl bg-black/40 border border-brand-border">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-brand-border text-text-muted uppercase">
                      <th className="p-2.5">Input |x⟩</th>
                      <th className="p-2.5">Integer x</th>
                      <th className="p-2.5 text-purple-300">Function Output f(x)</th>
                      <th className="p-2.5 text-cyan-300">Phase Factor (-1)^f(x)</th>
                      <th className="p-2.5 text-amber-300">Phase Vector Angle</th>
                      <th className="p-2.5">Visual Dial</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/30">
                    {Array.from({ length: 1 << nQubits }).map((_, idx) => {
                      const basis = idx.toString(2).padStart(nQubits, '0');
                      let fx = 0;
                      if (oracleType === 'constant_1') fx = 1;
                      else if (oracleType === 'balanced') fx = idx % 2 === 1 ? 1 : 0;
                      const phaseFactor = fx === 0 ? '+1' : '-1';
                      const angle = fx === 0 ? '0 rad (0°)' : 'π rad (180°)';

                      return (
                        <tr key={basis} className="hover:bg-surface/40">
                          <td className="p-2.5 font-bold text-text-primary">|{basis}⟩</td>
                          <td className="p-2.5 text-text-secondary">{idx}</td>
                          <td className="p-2.5 font-bold text-purple-300">{fx}</td>
                          <td className="p-2.5 font-bold text-cyan-300">{phaseFactor}</td>
                          <td className="p-2.5 text-amber-300">{angle}</td>
                          <td className="p-2.5">
                            {/* Circular Compass Dial */}
                            <div className="w-6 h-6 rounded-full border border-purple-400/40 relative flex items-center justify-center bg-black/60">
                              <div
                                className="w-2.5 h-0.5 bg-cyan-400 absolute origin-left transition-transform duration-300"
                                style={{ transform: `rotate(${fx === 0 ? 0 : 180}deg)` }}
                              />
                              <div className="w-1 h-1 rounded-full bg-white z-10" />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Theory Tab */}
        {activeTab === 'theory' && (
          <div className="max-w-4xl space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-orbitron font-bold text-purple-400">The Mathematics of Phase Kickback</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                By setting the ancilla qubit to |−⟩ = (|0⟩ − |1⟩)/√2, the oracle evaluation |x⟩|−⟩ maps to:
                <br />
                <code className="block my-2 p-3 rounded bg-black/40 border border-brand-border font-mono text-purple-300">
                  U_f |x⟩|−⟩ = (-1)^f(x) |x⟩|−⟩
                </code>
                The value f(x) is kicked into the relative phase of state |x⟩!
              </p>

              <h4 className="text-base font-orbitron font-bold text-cyan-400 pt-2">The Final Hadamard Transform</h4>
              <p className="text-sm text-text-secondary leading-relaxed">
                Applying Hadamard gates H^⊗n to the input register computes the inner product:
                <br />
                <code className="block my-2 p-3 rounded bg-black/40 border border-brand-border font-mono text-cyan-300">
                  |ψ_final⟩ = (1/2^n) Σ_y ( Σ_x (-1)^(f(x) ⊕ x·y) ) |y⟩
                </code>
                For the state |0...0⟩ where y = 0, the amplitude is:
                <br />
                <code className="block my-2 p-3 rounded bg-black/40 border border-brand-border font-mono text-amber-300">
                  Amplitude(|0...0⟩) = (1/2^n) Σ_x (-1)^f(x)
                </code>
                - If f is <strong>constant</strong>, all terms have the same sign → constructive interference = ±1 (prob = 100%).
                <br />
                - If f is <strong>balanced</strong>, exactly half are +1 and half are -1 → complete destructive interference = 0 (prob = 0%).
              </p>
            </Card>
          </div>
        )}

        {/* Code Tab */}
        {activeTab === 'code' && (
          <Card className="p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-orbitron font-bold text-purple-400">Qiskit Implementation</h3>
              <Badge color="purple">Qiskit Aer</Badge>
            </div>
            <pre className="p-4 rounded-xl bg-black/60 border border-brand-border font-mono text-xs text-purple-300 overflow-x-auto leading-relaxed">
{`from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

n = ${nQubits}  # input qubits
total_qubits = n + 1
ancilla = n

qc = QuantumCircuit(total_qubits, n)

# 1. Ancilla in |−⟩
qc.x(ancilla)
qc.h(ancilla)

# 2. Input register in uniform superposition
qc.h(range(n))
qc.barrier()

# 3. Oracle implementation: ${oracleType}
${oracleType === 'constant_0' ? '# Constant 0: Identity (no gates)' : ''}
${oracleType === 'constant_1' ? 'qc.x(ancilla)  # Constant 1: Inverts ancilla' : ''}
${oracleType === 'balanced' ? '# Balanced: CNOT from each input to ancilla\nfor i in range(n):\n    qc.cx(i, ancilla)' : ''}

qc.barrier()

# 4. Final Hadamards on input register
qc.h(range(n))

# 5. Measure input qubits only
qc.measure(range(n), range(n))

# Execute simulation
sim = AerSimulator()
counts = sim.run(transpile(qc, sim), shots=1024).result().get_counts()
print("Measured counts:", counts)
# If {'${'0'.repeat(nQubits)}': 1024} -> Constant, otherwise -> Balanced!`}
            </pre>
          </Card>
        )}

        {/* Advantage Tab */}
        {activeTab === 'advantage' && (
          <Card className="p-6 max-w-4xl space-y-6">
            <h3 className="text-lg font-orbitron font-bold text-cyan-400">Quantum Advantage Analysis</h3>
            <p className="text-sm text-text-secondary">
              Deutsch-Jozsa was historically the earliest algorithm to demonstrate that quantum computers
              could solve a problem with exponentially fewer steps than any classical deterministic algorithm.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-brand-border text-text-muted uppercase">
                    <th className="p-3">Input Bits (n)</th>
                    <th className="p-3">Search Space (2^n)</th>
                    <th className="p-3">Classical Deterministic</th>
                    <th className="p-3 text-purple-400">Quantum (DJ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40">
                  {[2, 4, 8, 16, 32, 64].map(n => (
                    <tr key={n} className="hover:bg-surface/40">
                      <td className="p-3 text-text-primary font-bold">n = {n}</td>
                      <td className="p-3 text-text-secondary">{n <= 16 ? Math.pow(2, n).toLocaleString() : `2^${n}`}</td>
                      <td className="p-3 text-rose-400 font-bold">{n <= 16 ? (Math.pow(2, n - 1) + 1).toLocaleString() : `2^${n-1} + 1`}</td>
                      <td className="p-3 text-emerald-400 font-bold">1 query</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
