import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Play, Zap, BarChart3, Info, CheckCircle2,
  ArrowLeft, Layers, Shield, Sparkles, Sliders,
  RefreshCw, Atom, Activity, Target, ChevronRight
} from 'lucide-react';
import { Card, Badge } from '../../components/UI';
import { runVQE, type VQEResult } from '../../api/algorithms';

export default function VQELab() {
  const [bondDistance, setBondDistance] = useState<number>(0.74);
  const [theta, setTheta] = useState<number>(0.15);
  const [shots, setShots] = useState<number>(1024);
  const [result, setResult] = useState<VQEResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(2); // 0 to 3
  const [activeTab, setActiveTab] = useState<'simulation' | 'dissociation' | 'evolution' | 'theory' | 'code'>('simulation');

  const handleRun = useCallback(async (optimize = false) => {
    setIsLoading(true);
    try {
      const res = await runVQE({
        molecule: 'H2',
        bond_distance: bondDistance,
        theta,
        optimize,
        shots,
      });
      setResult(res);
      if (optimize) {
        setTheta(res.optimal_theta);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [bondDistance, theta, shots]);

  useEffect(() => {
    handleRun(false);
  }, [bondDistance]);

  return (
    <div className="algorithm-lab premium-variational-lab al-vqe min-h-screen text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb & Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
          <Link to="/explore/algorithms" className="hover:text-brand-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Algorithm Labs
          </Link>
          <span>/</span>
          <span className="text-brand-primary">AL-07</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-brand-border">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-orbitron font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                VQE: Variational Quantum Eigensolver (AL-07)
              </h1>
              <Badge color="green">Quantum Chemistry</Badge>
              <Badge color="cyan">Molecular H₂ Ground State</Badge>
            </div>
            <p className="text-text-secondary text-sm max-w-3xl">
              Determine the electronic ground state energy of Molecular Hydrogen across the bond dissociation curve.
              Demonstrates hybrid quantum-classical optimization and captures dynamical electron correlation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleRun(true)}
              disabled={isLoading}
              className="btn btn-secondary flex items-center gap-2 !px-4 !py-3 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
              title="Find optimal variational parameter θ via classical minimization"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Run Optimizer (COBYLA)
            </button>
            <button
              onClick={() => handleRun(false)}
              disabled={isLoading}
              className="btn btn-primary flex items-center gap-2 !px-6 !py-3 shadow-lg shadow-emerald-500/20 bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-semibold"
            >
              <Play className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Measuring Paulis...' : 'Evaluate VQE Energy'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6 border-b border-brand-border/50 pb-2">
          {(['simulation', 'dissociation', 'evolution', 'theory', 'code'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-orbitron tracking-wider uppercase transition-all ${
                activeTab === tab
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              {tab === 'simulation' ? 'Ansatz & Energy' : tab === 'dissociation' ? 'Dissociation Curve' : tab === 'evolution' ? 'State Evolution' : tab === 'theory' ? 'Fermion Mapping' : 'Qiskit Nature Code'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {activeTab === 'simulation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Molecular Controls */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="p-6">
                <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase mb-4 flex items-center gap-2">
                  <Atom className="w-4 h-4 text-emerald-400" /> Molecular Hydrogen Parameters
                </h3>

                {/* Bond Distance Scrubber */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-text-secondary font-medium">Interatomic Bond Distance R</span>
                      <span className="font-mono text-emerald-400 font-bold">{bondDistance.toFixed(2)} Å</span>
                    </div>
                    <input
                      type="range"
                      min={0.3}
                      max={2.5}
                      step={0.05}
                      value={bondDistance}
                      onChange={e => setBondDistance(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-text-muted mt-1">
                      <span>Compressed (0.3 Å)</span>
                      <span className="text-emerald-400 font-bold">Equilibrium (0.74 Å)</span>
                      <span>Dissociated (2.5 Å)</span>
                    </div>
                  </div>

                  {/* Variational Parameter Theta */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-text-secondary font-medium">Ansatz Parameter θ (Double Excitation)</span>
                      <span className="font-mono text-cyan-400 font-bold">{theta.toFixed(3)} rad</span>
                    </div>
                    <input
                      type="range"
                      min={0.0}
                      max={1.57}
                      step={0.02}
                      value={theta}
                      onChange={e => setTheta(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-text-muted mt-1">
                      <span>0.0 (Hartree-Fock)</span>
                      <span>Optimal: {result?.optimal_theta.toFixed(2) ?? '0.22'} rad</span>
                      <span>π/2 ≈ 1.57</span>
                    </div>
                  </div>
                </div>

                {/* 2D Molecular Bond Visualizer */}
                <div className="mt-6 pt-6 border-t border-brand-border/40">
                  <div className="text-xs text-text-muted font-mono mb-2 uppercase">Molecular Geometry</div>
                  <div className="h-28 bg-black/40 rounded-xl border border-brand-border flex items-center justify-center relative overflow-hidden">
                    {/* Two Hydrogen Atoms */}
                    <div className="flex items-center" style={{ gap: `${Math.max(16, bondDistance * 45)}px` }}>
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 2.5 }}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 border border-white flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.5)] font-bold text-xs"
                      >
                        H₁
                      </motion.div>
                      <div className="h-0.5 bg-gradient-to-r from-emerald-400 via-white to-emerald-400 flex-1 relative min-w-[20px]">
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-mono text-emerald-300">
                          {bondDistance.toFixed(2)} Å
                        </span>
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 2.5, delay: 0.2 }}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 border border-white flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.5)] font-bold text-xs"
                      >
                        H₂
                      </motion.div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Energy Comparison Card */}
              {result && (
                <Card className="p-6 bg-surface/80 border-brand-border">
                  <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" /> Quantum Chemical Accuracy
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-surface border border-brand-border/40">
                      <div className="text-[10px] font-mono text-text-muted uppercase">VQE Energy</div>
                      <div className="text-lg font-bold font-mono text-emerald-300 mt-1">
                        {result.vqe_energy.toFixed(4)} <span className="text-xs text-text-muted">Ha</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-surface border border-brand-border/40">
                      <div className="text-[10px] font-mono text-text-muted uppercase">Fitted reference energy</div>
                      <div className="text-lg font-bold font-mono text-cyan-400 mt-1">
                        {result.exact_fci_energy.toFixed(4)} <span className="text-xs text-text-muted">Ha fitted reference</span>
                      </div>
                    </div>
                  </div>
                  {result.model_provenance && <p className="mt-3 text-[10px] leading-relaxed text-text-muted">Model scope: {result.model_provenance}</p>}

                  <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                    <span className="text-text-secondary">Error vs FCI:</span>
                    <span className={`font-mono font-bold ${result.error_mhartree < 1.6 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {result.error_mhartree.toFixed(2)} mHa {result.error_mhartree < 1.6 && ' (Chemical Accuracy < 1.6 mHa)'}
                    </span>
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column: Pauli Term Decomposition & State Breakdown */}
            <div className="lg:col-span-8 space-y-6">
              {/* Pauli Expectation Values */}
              {result && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" /> Measured Pauli Expectation Values (Aer Simulation)
                    </h3>
                    <span className="text-xs font-mono text-text-muted">
                      {shots} shots per basis
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {Object.entries(result.pauli_expectations).map(([pauli, expVal]) => (
                      <div key={pauli} className="p-3 rounded-xl bg-black/40 border border-brand-border/40 text-center">
                        <div className="font-mono text-xs text-text-muted uppercase">⟨{pauli}⟩</div>
                        <div className="font-mono text-base font-bold text-emerald-400 mt-1">
                          {expVal.toFixed(3)}
                        </div>
                        <div className="text-[10px] font-mono text-text-secondary mt-0.5">
                          coeff: {result.hamiltonian_coeffs[`g${pauli === 'Z0' ? 1 : pauli === 'Z1' ? 2 : pauli === 'Z0Z1' ? 3 : pauli === 'X0X1' ? 4 : 5}`]?.toFixed(3) ?? '0.00'}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Energy Convergence History */}
              {result && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-400" /> Variational Energy vs Ansatz Parameter θ
                    </h3>
                    <span className="text-xs font-mono text-emerald-400">
                      Hartree-Fock: {result.hartree_fock_energy.toFixed(4)} Ha
                    </span>
                  </div>

                  <div className="space-y-3">
                    {result.optimization_history.map(pt => (
                      <div key={pt.iteration} className="flex items-center justify-between text-xs font-mono p-2.5 rounded-lg bg-surface/50 border border-brand-border/30">
                        <span className="text-text-muted">Iter {pt.iteration}: θ = {pt.theta.toFixed(3)} rad</span>
                        <div className="flex items-center gap-3">
                          <span className="text-emerald-300 font-bold">{pt.energy.toFixed(4)} Ha</span>
                          <span className="text-[10px] text-text-muted">
                            ΔE(model) = {(pt.energy - result.exact_fci_energy).toFixed(4)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Dissociation Curve Tab */}
        {activeTab === 'dissociation' && result && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-orbitron font-bold text-emerald-400">
                  Potential Energy Surface: E(R) Dissociation Profile
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Comparison between the fitted teaching reference (green), independently optimized VQE model points (teal), and model Hartree-Fock baseline (red dashed).
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/50 border border-brand-border overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-brand-border text-text-muted uppercase">
                    <th className="p-2.5">Bond R (Å)</th>
                    <th className="p-2.5 text-emerald-400">Fitted reference (Ha)</th>
                    <th className="p-2.5 text-teal-300">VQE Simulation (Ha)</th>
                    <th className="p-2.5 text-rose-400">Hartree-Fock (Ha)</th>
                    <th className="p-2.5 text-amber-300">Correlation Energy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40">
                  {result.dissociation_curve.map(pt => {
                    const isCurrent = Math.abs(pt.r - bondDistance) < 0.08;
                    const corr = Math.abs(pt.hartree_fock - pt.fci);
                    return (
                      <tr
                        key={pt.r}
                        className={`hover:bg-surface/50 cursor-pointer ${isCurrent ? 'bg-emerald-500/15 font-bold' : ''}`}
                        onClick={() => {
                          setBondDistance(pt.r);
                          handleRun(false);
                        }}
                      >
                        <td className="p-2.5 flex items-center gap-1.5">
                          {pt.r.toFixed(2)} {isCurrent && <span className="text-[10px] px-1 rounded bg-emerald-500/30 text-emerald-300">ACTIVE</span>}
                        </td>
                        <td className="p-2.5 text-emerald-400">{pt.fci.toFixed(4)}</td>
                        <td className="p-2.5 text-teal-300">{pt.vqe.toFixed(4)}</td>
                        <td className="p-2.5 text-rose-400">{pt.hartree_fock.toFixed(4)}</td>
                        <td className="p-2.5 text-amber-300">{(corr * 1000).toFixed(1)} mHa</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* State Evolution Tab */}
        {activeTab === 'evolution' && result && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" /> Algorithmic State Evolution Across VQE Stages
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {result.state_evolution_steps.map((st, i) => (
                  <button
                    key={st.step}
                    onClick={() => setActiveStep(i)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      activeStep === i
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-surface/60 border-brand-border/40 text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <div className="text-[10px] font-mono uppercase text-text-muted">Step {st.step}</div>
                    <div className="font-orbitron font-bold text-xs mt-0.5">{st.name}</div>
                  </button>
                ))}
              </div>

              {result.state_evolution_steps[activeStep] && (
                <div className="p-5 rounded-xl bg-black/40 border border-brand-border space-y-4">
                  <h4 className="font-orbitron font-bold text-sm text-emerald-300">
                    Step {result.state_evolution_steps[activeStep].step}: {result.state_evolution_steps[activeStep].name}
                  </h4>
                  <p className="text-xs text-text-secondary">
                    {result.state_evolution_steps[activeStep].desc}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                    {result.state_evolution_steps[activeStep].amplitudes.map(amp => (
                      <div key={amp.basis} className="p-3 rounded-xl bg-surface border border-brand-border/40 text-center">
                        <div className="font-mono text-sm font-bold text-text-primary">|{amp.basis}⟩</div>
                        <div className="text-xs font-mono text-emerald-400 mt-1">
                          {(amp.probability * 100).toFixed(1)}% prob
                        </div>
                        <div className="text-[10px] font-mono text-text-muted mt-0.5">
                          phase = {amp.phase_rad.toFixed(2)} rad
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Theory Tab */}
        {activeTab === 'theory' && (
          <div className="max-w-4xl space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-orbitron font-bold text-emerald-400">The Variational Quantum Eigensolver (VQE)</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                By the Rayleigh-Ritz variational theorem, the expectation value of any Hamiltonian H evaluated on a parameterized state |ψ(θ)⟩
                provides a strict upper bound to the true ground state energy E₀:
                <code className="block my-2 p-3 rounded bg-black/40 border border-brand-border font-mono text-emerald-300">
                  ⟨ψ(θ)| H |ψ(θ)⟩ ≥ E₀
                </code>
              </p>

              <h4 className="text-base font-orbitron font-bold text-cyan-400 pt-2">Fermionic to Qubit Mapping</h4>
              <p className="text-sm text-text-secondary leading-relaxed">
                This lab uses a compact two-qubit Hamiltonian whose coefficients are fitted to an educational H₂ reference curve.
                It preserves the VQE optimization structure without claiming an ab-initio parity mapping:
                <code className="block my-2 p-3 rounded bg-black/40 border border-brand-border font-mono text-cyan-300">
                  H(R) = g₀ I + g₁ Z₀ + g₂ Z₁ + g₃ Z₀Z₁ + g₄ X₀X₁ + g₅ Y₀Y₁
                </code>
              </p>

              <h4 className="text-base font-orbitron font-bold text-amber-400 pt-2">Why Classical Hartree-Fock Fails at Dissociation</h4>
              <p className="text-sm text-text-secondary leading-relaxed">
                A single Slater determinant (|01⟩) forces both electrons into the same bonding spatial orbital σ_g².
                At large bond distance R, this erroneously predicts a 50% probability of finding H⁺ + H⁻ ions rather than two neutral H· radicals!
                The two-state ansatz adds the |10⟩ component and illustrates why a variational correlated model can improve on a single-determinant baseline. The plotted limit belongs to this fitted teaching model.
              </p>
            </Card>
          </div>
        )}

        {/* Code Tab */}
        {activeTab === 'code' && (
          <Card className="p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-orbitron font-bold text-emerald-400">Qiskit VQE Implementation</h3>
              <Badge color="green">Qiskit Aer</Badge>
            </div>
            <pre className="p-4 rounded-xl bg-black/60 border border-brand-border font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed">
{`from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
import numpy as np

# Bond distance: ${bondDistance} Å
theta = ${theta.toFixed(3)}  # Variational parameter

qc = QuantumCircuit(2)
# 1. Prepare Hartree-Fock state |01⟩
qc.x(0)

# 2. Givens rotation double excitation ansatz:
qc.rx(np.pi / 2, 0)
qc.h(1)
qc.cx(0, 1)
qc.rz(theta, 1)
qc.cx(0, 1)
qc.rx(-np.pi / 2, 0)
qc.h(1)

# 3. Measure in Pauli bases (Z, X, Y)
# ... evaluate <Z0>, <Z1>, <Z0Z1>, <X0X1>, <Y0Y1> with AerSimulator
# 4. Energy = sum_i g_i * <P_i>
# 5. Classical optimizer updates theta until dE < 1e-4`}
            </pre>
          </Card>
        )}
      </div>
    </div>
  );
}
