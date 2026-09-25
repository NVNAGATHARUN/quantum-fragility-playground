import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Play, Radio, Info, CheckCircle2,
  AlertTriangle, ArrowLeft, Layers, Shield, Sparkles, Send
} from 'lucide-react';
import { Card, Badge } from '../../components/UI';
import { runTeleportation, type TeleportationResult } from '../../api/algorithms';

const INPUT_STATES = [
  { id: 'plus', label: '|+⟩', name: 'Plus State', desc: 'Equal superposition (|0⟩+|1⟩)/√2' },
  { id: 'minus', label: '|−⟩', name: 'Minus State', desc: 'Superposition with π phase (|0⟩−|1⟩)/√2' },
  { id: 'zero', label: '|0⟩', name: 'Ground State', desc: 'Computational basis ground state' },
  { id: 'one', label: '|1⟩', name: 'Excited State', desc: 'Computational basis inverted state' },
] as const;

type InputStateType = typeof INPUT_STATES[number]['id'];

export default function Teleportation() {
  const [inputState, setInputState] = useState<InputStateType>('plus');
  const [shots, setShots] = useState<number>(1024);
  const [result, setResult] = useState<TeleportationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(5);
  const [activeTab, setActiveTab] = useState<'simulation' | 'protocol' | 'code' | 'nocloning'>('simulation');

  const handleRun = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await runTeleportation({ input_state: inputState, shots });
      setResult(res);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [inputState, shots]);

  useEffect(() => {
    handleRun();
  }, [inputState]);

  return (
    <div className="min-h-screen text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb & Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
          <Link to="/algorithms" className="hover:text-brand-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Algorithm Labs
          </Link>
          <span>/</span>
          <span className="text-brand-primary">AL-04</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-brand-border">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-orbitron font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Quantum Teleportation (AL-04)
              </h1>
              <Badge color="green">State Transfer</Badge>
              <Badge color="cyan">No-Cloning Compliant</Badge>
            </div>
            <p className="text-text-secondary text-sm max-w-3xl">
              Transmit an unknown quantum state from Alice to Bob using one shared Bell pair and two classical bits.
              The original qubit is destroyed during measurement, strictly adhering to the fundamental No-Cloning Theorem.
            </p>
          </div>

          <button
            onClick={handleRun}
            disabled={isLoading}
            className="btn btn-primary flex items-center gap-2 !px-6 !py-3 shadow-lg shadow-emerald-500/20"
          >
            <Play className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Teleporting...' : 'Teleport Qubit'}
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mt-6 border-b border-brand-border/50 pb-2">
          {(['simulation', 'protocol', 'code', 'nocloning'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-orbitron tracking-wider uppercase transition-all ${
                activeTab === tab
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {activeTab === 'simulation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: State selection & Teleportation Metrics */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="p-6">
                <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> Alice's State to Teleport |ψ⟩
                </h3>

                <div className="space-y-3">
                  {INPUT_STATES.map(s => {
                    const active = inputState === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setInputState(s.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          active
                            ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                            : 'bg-surface/50 border-brand-border/40 hover:bg-surface'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-orbitron font-bold text-base text-text-primary">{s.label}</span>
                          <span className="text-xs font-mono text-emerald-400">{s.name}</span>
                        </div>
                        <div className="text-[11px] text-text-secondary">{s.desc}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-brand-border/40">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-text-secondary font-medium">Measurement Shots</span>
                    <span className="font-mono text-emerald-400 font-bold">{shots}</span>
                  </div>
                  <input
                    type="range"
                    min={256}
                    max={4096}
                    step={256}
                    value={shots}
                    onChange={e => setShots(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </Card>

              {/* Protocol Metrics */}
              {result && (
                <Card className="p-6 bg-gradient-to-br from-surface to-surface/40 border-brand-border">
                  <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" /> Transmission Verifications
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-surface/80 border border-brand-border/40">
                      <div className="text-[10px] uppercase font-mono text-text-muted">State Fidelity ⟨ψ|ρ_B|ψ⟩</div>
                      <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                        {(result.fidelity * 100).toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-emerald-400 mt-0.5">High Fidelity Transfer</div>
                    </div>
                    <div className="p-3 rounded-lg bg-surface/80 border border-brand-border/40">
                      <div className="text-[10px] uppercase font-mono text-text-muted">Classical Bits Sent</div>
                      <div className="text-xl font-bold font-mono text-indigo-400 mt-1">
                        2 <span className="text-xs font-normal text-text-muted">bits</span>
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5">Alice → Bob</div>
                    </div>
                    <div className="p-3 rounded-lg bg-surface/80 border border-brand-border/40">
                      <div className="text-[10px] uppercase font-mono text-text-muted">Original Alice Qubit</div>
                      <div className="text-xl font-bold font-mono text-rose-400 mt-1">
                        Destroyed
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5">No-Cloning Enforced</div>
                    </div>
                    <div className="p-3 rounded-lg bg-surface/80 border border-brand-border/40">
                      <div className="text-[10px] uppercase font-mono text-text-muted">Execution Latency</div>
                      <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
                        {result.execution_time_ms} <span className="text-xs font-normal text-text-muted">ms</span>
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5">Aer Simulator</div>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column: Interactive 3-Party Protocol Diagram & Output */}
            <div className="lg:col-span-8 space-y-6">
              {/* Protocol Diagram */}
              <Card className="p-6">
                <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" /> Teleportation Protocol Architecture
                </h3>

                <div className="p-6 rounded-xl bg-black/40 border border-brand-border/50 font-mono text-xs overflow-x-auto space-y-3">
                  {/* Alice's Input Qubit */}
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-bold w-24">Alice q₀ |ψ⟩</span>
                    <span className="text-slate-600">─────</span>
                    <span className="text-slate-600">──●──</span>
                    <span className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold">H</span>
                    <span className="text-slate-600">──[ M ]──</span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">c₀</span>
                    <span className="text-slate-600">─────────────────────────▶ (X gate control)</span>
                  </div>

                  {/* Alice's Entangled Ancilla */}
                  <div className="flex items-center gap-3">
                    <span className="text-indigo-400 font-bold w-24">Alice q₁ |0⟩</span>
                    <span className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold">H</span>
                    <span className="text-slate-600">──●──</span>
                    <span className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">⊕</span>
                    <span className="text-slate-600">──[ M ]──</span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">c₁</span>
                    <span className="text-slate-600">────────▶ (Z gate control)</span>
                  </div>

                  {/* Bob's Target Qubit */}
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
                    <span className="text-cyan-400 font-bold w-24">Bob   q₂ |0⟩</span>
                    <span className="text-slate-600">───────</span>
                    <span className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">⊕</span>
                    <span className="text-slate-600">────────────────</span>
                    <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">X^(c₀)</span>
                    <span className="text-slate-600">──</span>
                    <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">Z^(c₁)</span>
                    <span className="text-slate-600">──▶</span>
                    <span className="text-emerald-400 font-bold font-orbitron">Bob receives |ψ⟩</span>
                  </div>
                </div>
              </Card>

              {/* Bob's Output State Verification */}
              {result && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bob's Measurement Probabilities */}
                  <Card className="p-6">
                    <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase mb-4 flex items-center gap-2">
                      <Radio className="w-4 h-4 text-emerald-400" /> Bob's Measured Qubit Probabilities
                    </h3>
                    <div className="space-y-4">
                      {['0', '1'].map(bit => {
                        const prob = result.bob_probabilities[bit] ?? 0;
                        const count = result.bob_counts[bit] ?? 0;
                        const pct = Math.round(prob * 100);
                        return (
                          <div key={bit} className="space-y-1">
                            <div className="flex justify-between text-xs font-mono">
                              <span className="text-text-primary font-bold">Bob |{bit}⟩</span>
                              <span className="text-text-secondary">{count} shots ({pct}%)</span>
                            </div>
                            <div className="h-4 w-full bg-surface-raised rounded-full overflow-hidden border border-brand-border/40">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.5 }}
                                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Classical Corrections Table */}
                  <Card className="p-6">
                    <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase mb-4 flex items-center gap-2">
                      <Send className="w-4 h-4 text-indigo-400" /> Classical Correction Lookup
                    </h3>
                    <div className="text-xs space-y-2">
                      {[
                        { bits: '00', correction: 'Identity (No correction)', state: '|ψ⟩' },
                        { bits: '01', correction: 'Apply X gate', state: 'X|ψ⟩ → |ψ⟩' },
                        { bits: '10', correction: 'Apply Z gate', state: 'Z|ψ⟩ → |ψ⟩' },
                        { bits: '11', correction: 'Apply Z · X gates', state: 'ZX|ψ⟩ → |ψ⟩' },
                      ].map(r => (
                        <div key={r.bits} className="flex items-center justify-between p-2 rounded bg-surface/50 border border-brand-border/30">
                          <span className="font-mono text-purple-300 font-bold">Alice: {r.bits}</span>
                          <span className="text-text-secondary font-mono">{r.correction}</span>
                          <span className="text-emerald-400 font-mono font-bold">{r.state}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {/* Explainer */}
              {result && (
                <Card className="p-6 bg-brand-primary/5 border-brand-primary/20">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                      <Info className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-orbitron font-bold text-sm text-emerald-300 mb-1">
                        Quantum Reality: Teleportation Without Faster-Than-Light Signals
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

        {/* Protocol Tab */}
        {activeTab === 'protocol' && (
          <div className="max-w-4xl space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-orbitron font-bold text-emerald-400">Step-by-Step Mathematical Derivation</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Let Alice have an unknown state |ψ⟩ = α|0⟩ + β|1⟩. Alice and Bob share an EPR pair |Φ+⟩ = (|00⟩+|11⟩)/√2.
                The 3-qubit initial state is:
                <br />
                <code className="block my-2 p-3 rounded bg-black/40 border border-brand-border font-mono text-emerald-300">
                  |ψ₀⟩ = (α|0⟩ + β|1⟩) ⊗ (|00⟩ + |11⟩)/√2
                </code>
              </p>

              <p className="text-sm text-text-secondary leading-relaxed">
                Alice performs a CNOT between her qubit and her half of the Bell pair, followed by a Hadamard on her input qubit.
                Expanding the algebraic expression yields:
                <br />
                <code className="block my-2 p-3 rounded bg-black/40 border border-brand-border font-mono text-cyan-300">
                  |ψ₂⟩ = 1/2 [ |00⟩(α|0⟩ + β|1⟩) + |01⟩(α|1⟩ + β|0⟩) + |10⟩(α|0⟩ − β|1⟩) + |11⟩(α|1⟩ − β|0⟩) ]
                </code>
              </p>

              <p className="text-sm text-text-secondary leading-relaxed">
                Alice measures her two qubits. The 4 possible measurement outcomes each have probability 1/4. Depending on
                the result (c₁, c₀), Bob's qubit collapses into one of the four states: |ψ⟩, X|ψ⟩, Z|ψ⟩, or ZX|ψ⟩.
                Once Bob receives Alice's 2 classical bits, he applies the corresponding Pauli correction, recovering |ψ⟩ perfectly.
              </p>
            </Card>
          </div>
        )}

        {/* Code Tab */}
        {activeTab === 'code' && (
          <Card className="p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-orbitron font-bold text-emerald-400">Qiskit Teleportation Code</h3>
              <Badge color="green">Qiskit Aer</Badge>
            </div>
            <pre className="p-4 rounded-xl bg-black/60 border border-brand-border font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed">
{`from qiskit import QuantumCircuit, ClassicalRegister, QuantumRegister, transpile
from qiskit_aer import AerSimulator

# Registers: 3 qubits, 2 classical bits for Alice, 1 for Bob
q = QuantumRegister(3, 'q')
c_alice = ClassicalRegister(2, 'c_alice')
c_bob = ClassicalRegister(1, 'c_bob')
qc = QuantumCircuit(q, c_alice, c_bob)

# 1. State preparation on q[0]
${inputState === 'plus' ? 'qc.h(q[0])' : inputState === 'minus' ? 'qc.x(q[0])\nqc.h(q[0])' : inputState === 'one' ? 'qc.x(q[0])' : '# Ground state |0>'}

# 2. Bell pair between Alice q[1] and Bob q[2]
qc.h(q[1])
qc.cx(q[1], q[2])

# 3. Alice entangles her qubit with her EPR qubit
qc.cx(q[0], q[1])
qc.h(q[0])

# 4. Alice measures her qubits
qc.measure(q[0], c_alice[0])
qc.measure(q[1], c_alice[1])

# 5. Bob applies conditioned Pauli corrections
qc.x(q[2]).c_if(c_alice[0], 1)
qc.z(q[2]).c_if(c_alice[1], 1)

# 6. Bob measures his reconstructed qubit
qc.measure(q[2], c_bob[0])

sim = AerSimulator()
counts = sim.run(transpile(qc, sim), shots=1024).result().get_counts()
print("Bob received state counts:", counts)`}
            </pre>
          </Card>
        )}

        {/* No Cloning Tab */}
        {activeTab === 'nocloning' && (
          <Card className="p-6 max-w-4xl space-y-4">
            <h3 className="text-lg font-orbitron font-bold text-rose-400">Why Teleportation Does NOT Violate No-Cloning</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              The <strong>No-Cloning Theorem</strong> (Wootters & Zurek, 1982) states that an unknown quantum state cannot be duplicated:
              there is no unitary operator U such that U(|ψ⟩|0⟩) = |ψ⟩|ψ⟩ for all |ψ⟩.
            </p>
            <div className="p-4 rounded-xl bg-surface/60 border border-brand-border space-y-2 text-xs text-text-secondary">
              <p className="text-text-primary font-bold">How does Teleportation respect this?</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Alice's measurement collapses and destroys her original quantum state.</li>
                <li>At no point in time do two copies of |ψ⟩ exist simultaneously.</li>
                <li>The quantum information has been <em>transferred</em> (moved), not duplicated.</li>
                <li>Furthermore, Bob cannot recover |ψ⟩ until Alice sends her 2 classical bits, which travel at or below the speed of light.</li>
              </ul>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
