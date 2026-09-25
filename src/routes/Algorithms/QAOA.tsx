import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Play, Zap, BarChart3, Info, CheckCircle2,
  ArrowLeft, Layers, Shield, Sparkles, Sliders,
  RefreshCw, Network, Target, ChevronRight, Activity
} from 'lucide-react';
import { Card, Badge } from '../../components/UI';
import { runQAOA, type QAOAResult } from '../../api/algorithms';

const GRAPH_OPTIONS = [
  { id: 'triangle_3', name: 'Triangle (K3)', nodes: 3, maxCut: 2, desc: '3-node complete graph. Frustrated system with max cut 2.' },
  { id: 'line_3', name: '3-Node Path', nodes: 3, maxCut: 2, desc: 'Chain topology. Bipartition cuts all 2 edges.' },
  { id: 'ring_4', name: '4-Node Cycle (C4)', nodes: 4, maxCut: 4, desc: 'Square ring. Alternating partition cuts all 4 edges.' },
  { id: 'star_4', name: '4-Node Star (S4)', nodes: 4, maxCut: 3, desc: 'Central hub connected to 3 leaves. Isolating center cuts 3 edges.' },
] as const;

type GraphTypeId = typeof GRAPH_OPTIONS[number]['id'];

export default function QAOALab() {
  const [graphType, setGraphType] = useState<GraphTypeId>('triangle_3');
  const [gamma, setGamma] = useState<number>(0.6);
  const [beta, setBeta] = useState<number>(0.4);
  const [pSteps, setPSteps] = useState<number>(1);
  const [shots, setShots] = useState<number>(1024);
  const [result, setResult] = useState<QAOAResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(3); // 0 to 3
  const [activeTab, setActiveTab] = useState<'simulation' | 'landscape' | 'evolution' | 'theory' | 'code'>('simulation');

  const handleRun = useCallback(async (optimize = false) => {
    setIsLoading(true);
    try {
      const res = await runQAOA({
        graph_type: graphType,
        gamma,
        beta,
        p_steps: pSteps,
        shots,
        optimize,
      });
      setResult(res);
      if (optimize) {
        setGamma(res.optimal_gamma);
        setBeta(res.optimal_beta);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [graphType, gamma, beta, pSteps, shots]);

  useEffect(() => {
    handleRun(false);
  }, [graphType]);

  // Graph Layout coordinates (SVG normalized 200x200)
  const getNodePos = (nodeIdx: number, nTotal: number) => {
    if (graphType === 'star_4') {
      if (nodeIdx === 0) return { x: 100, y: 100 }; // Center
      const leafAngles = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6];
      const a = leafAngles[nodeIdx - 1];
      return { x: 100 + 65 * Math.cos(a), y: 100 + 65 * Math.sin(a) };
    }
    const angle = (2 * Math.PI * nodeIdx) / nTotal - Math.PI / 2;
    return {
      x: 100 + 65 * Math.cos(angle),
      y: 100 + 65 * Math.sin(angle),
    };
  };

  const bestPartition = result?.best_bitstring ?? '000';

  return (
    <div className="min-h-screen text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb & Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
          <Link to="/explore/algorithms" className="hover:text-brand-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Algorithm Labs
          </Link>
          <span>/</span>
          <span className="text-brand-primary">AL-06</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-brand-border">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-orbitron font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">
                QAOA: Quantum Approximate Optimization (AL-06)
              </h1>
              <Badge color="gold">Max-Cut Solver</Badge>
              <Badge color="purple">Variational Quantum-Classical</Badge>
            </div>
            <p className="text-text-secondary text-sm max-w-3xl">
              Solve NP-hard combinatorial optimization on graphs via alternating applications of Cost unitary
              <code className="text-amber-300 font-mono ml-1">e^(-iγ H_C)</code> and Transverse Mixer
              <code className="text-cyan-300 font-mono ml-1">e^(-iβ H_M)</code>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleRun(true)}
              disabled={isLoading}
              className="btn btn-secondary flex items-center gap-2 !px-4 !py-3 border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
              title="Automatically optimize (γ, β) via classical Nelder-Mead loop"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Auto-Optimize (γ, β)
            </button>
            <button
              onClick={() => handleRun(false)}
              disabled={isLoading}
              className="btn btn-primary flex items-center gap-2 !px-6 !py-3 shadow-lg shadow-amber-500/20 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold"
            >
              <Play className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Simulating Aer...' : 'Run QAOA Circuit'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6 border-b border-brand-border/50 pb-2">
          {(['simulation', 'evolution', 'landscape', 'theory', 'code'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-orbitron tracking-wider uppercase transition-all ${
                activeTab === tab
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              {tab === 'simulation' ? 'Circuit & Partition' : tab === 'evolution' ? 'State Evolution' : tab === 'landscape' ? 'Energy Landscape' : tab === 'theory' ? 'Hamiltonian Theory' : 'Qiskit Code'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {activeTab === 'simulation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Graph Configuration & Parameters */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="p-6">
                <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase mb-4 flex items-center gap-2">
                  <Network className="w-4 h-4 text-amber-400" /> Benchmark Graph Topology
                </h3>

                <div className="space-y-3">
                  {GRAPH_OPTIONS.map(g => {
                    const active = graphType === g.id;
                    return (
                      <button
                        key={g.id}
                        onClick={() => setGraphType(g.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                          active
                            ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                            : 'bg-surface/50 border-brand-border/40 hover:bg-surface'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-orbitron font-bold text-sm text-text-primary">{g.name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                            Max Cut: {g.maxCut}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-secondary leading-snug">{g.desc}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-brand-border/40 space-y-5">
                  {/* Gamma Slider */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-text-secondary font-medium">Cost Angle γ (Phase Separation)</span>
                      <span className="font-mono text-amber-400 font-bold">{gamma.toFixed(2)} rad</span>
                    </div>
                    <input
                      type="range"
                      min={0.0}
                      max={3.14}
                      step={0.05}
                      value={gamma}
                      onChange={e => setGamma(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-text-muted mt-1">
                      <span>0.0</span>
                      <span>π/2 ≈ 1.57</span>
                      <span>π ≈ 3.14</span>
                    </div>
                  </div>

                  {/* Beta Slider */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-text-secondary font-medium">Mixer Angle β (Transverse Field)</span>
                      <span className="font-mono text-cyan-400 font-bold">{beta.toFixed(2)} rad</span>
                    </div>
                    <input
                      type="range"
                      min={0.0}
                      max={1.57}
                      step={0.02}
                      value={beta}
                      onChange={e => setBeta(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-text-muted mt-1">
                      <span>0.0</span>
                      <span>π/4 ≈ 0.79</span>
                      <span>π/2 ≈ 1.57</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Performance Metrics */}
              {result && (
                <Card className="p-6 bg-surface/80 border-brand-border">
                  <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" /> Max-Cut Efficiency
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-surface border border-brand-border/40">
                      <div className="text-[10px] font-mono text-text-muted uppercase">Expected Cut ⟨C⟩</div>
                      <div className="text-xl font-bold font-mono text-amber-300 mt-1">
                        {result.expected_cut.toFixed(2)} <span className="text-xs text-text-muted">/ {result.max_possible_cut}</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-surface border border-brand-border/40">
                      <div className="text-[10px] font-mono text-text-muted uppercase">Approx Ratio α</div>
                      <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                        {(result.approximation_ratio * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column: Interactive Graph Partition & Sampling */}
            <div className="lg:col-span-8 space-y-6">
              {/* Graph Partition Visualizer */}
              {result && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase flex items-center gap-2">
                      <Network className="w-4 h-4 text-amber-400" /> Graph Bipartition Solution (Most Probable: |{bestPartition}⟩)
                    </h3>
                    <Badge color="gold">Cut = {result.bitstring_cuts[bestPartition] ?? 0} edges</Badge>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-4">
                    {/* SVG Graph Visualizer */}
                    <div className="relative w-56 h-56 bg-black/40 rounded-2xl border border-brand-border flex items-center justify-center p-4">
                      <svg className="w-full h-full" viewBox="0 0 200 200">
                        {/* Edges */}
                        {result.edges.map(([u, v], i) => {
                          const pU = getNodePos(u, result.n_nodes);
                          const pV = getNodePos(v, result.n_nodes);
                          const isCut = bestPartition[u] !== bestPartition[v];
                          return (
                            <line
                              key={i}
                              x1={pU.x}
                              y1={pU.y}
                              x2={pV.x}
                              y2={pV.y}
                              stroke={isCut ? '#f59e0b' : '#334155'}
                              strokeWidth={isCut ? 3 : 1.5}
                              strokeDasharray={isCut ? 'none' : '4 3'}
                              className={isCut ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]' : ''}
                            />
                          );
                        })}

                        {/* Nodes */}
                        {Array.from({ length: result.n_nodes }).map((_, idx) => {
                          const pos = getNodePos(idx, result.n_nodes);
                          const bit = bestPartition[idx];
                          const isGroup1 = bit === '1';
                          return (
                            <g key={idx}>
                              <circle
                                cx={pos.x}
                                cy={pos.y}
                                r={18}
                                fill={isGroup1 ? '#f59e0b' : '#06b6d4'}
                                stroke="#ffffff"
                                strokeWidth={2}
                                className="drop-shadow-md"
                              />
                              <text
                                x={pos.x}
                                y={pos.y + 4}
                                textAnchor="middle"
                                fill="#000000"
                                fontSize="12"
                                fontFamily="monospace"
                                fontWeight="bold"
                              >
                                v{idx}:{bit}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    {/* Partition Legend */}
                    <div className="space-y-4 max-w-xs text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-cyan-400 border border-white" />
                        <div>
                          <div className="font-bold text-text-primary">Partition Set S (Bit = 0)</div>
                          <div className="text-text-muted">Nodes assigned to first cluster</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-amber-500 border border-white" />
                        <div>
                          <div className="font-bold text-text-primary">Partition Set S̄ (Bit = 1)</div>
                          <div className="text-text-muted">Nodes assigned to conjugate cluster</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-1 bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                        <div>
                          <span className="font-bold text-amber-300">Solid Amber Edge:</span> Cut edge (adds +1 to profit)
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Bitstring Probability Distribution */}
              {result && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-amber-400" /> Bitstring Sampling Distribution (Qiskit Aer)
                    </h3>
                    <span className="text-xs font-mono text-text-muted">
                      {shots} shots | Amber = Optimal Cut
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[260px] overflow-y-auto pr-2">
                    {Object.entries(result.probabilities)
                      .sort((a, b) => b[1] - a[1])
                      .map(([bitstr, prob]) => {
                        const cutVal = result.bitstring_cuts[bitstr] ?? 0;
                        const isMax = cutVal === result.max_possible_cut;
                        const pct = Math.round(prob * 100);
                        return (
                          <div key={bitstr} className="space-y-1">
                            <div className="flex justify-between text-xs font-mono">
                              <span className={`flex items-center gap-2 ${isMax ? 'text-amber-300 font-bold' : 'text-text-secondary'}`}>
                                |{bitstr}⟩
                                <span className={`text-[10px] px-1.5 py-0.2 rounded border ${isMax ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-surface border-brand-border text-text-muted'}`}>
                                  Cut: {cutVal}
                                </span>
                              </span>
                              <span className="text-text-muted">{pct}% ({prob.toFixed(3)})</span>
                            </div>
                            <div className="h-2.5 w-full bg-surface-raised rounded-full overflow-hidden border border-brand-border/40">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.4 }}
                                className={`h-full ${
                                  isMax
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                                    : 'bg-gradient-to-r from-slate-600 to-slate-400'
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* State Evolution Tab */}
        {activeTab === 'evolution' && result && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" /> Algorithmic State Evolution Across QAOA Stages
              </h3>

              {/* Stepper Navigation */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {result.state_evolution_steps.map((st, i) => (
                  <button
                    key={st.step}
                    onClick={() => setActiveStep(i)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      activeStep === i
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-surface/60 border-brand-border/40 text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <div className="text-[10px] font-mono uppercase text-text-muted">Step {st.step}</div>
                    <div className="font-orbitron font-bold text-xs mt-0.5">{st.name}</div>
                  </button>
                ))}
              </div>

              {/* Selected Step Detail */}
              {result.state_evolution_steps[activeStep] && (
                <div className="p-5 rounded-xl bg-black/40 border border-brand-border space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-orbitron font-bold text-sm text-amber-300">
                      Step {result.state_evolution_steps[activeStep].step}: {result.state_evolution_steps[activeStep].name}
                    </h4>
                  </div>
                  <p className="text-xs text-text-secondary">
                    {result.state_evolution_steps[activeStep].desc}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 pt-2">
                    {result.state_evolution_steps[activeStep].amplitudes.map(amp => {
                      const pPct = Math.round(amp.probability * 100);
                      const isMaxCut = (result.bitstring_cuts[amp.basis] ?? 0) === result.max_possible_cut;
                      return (
                        <div
                          key={amp.basis}
                          className={`p-2.5 rounded-lg border text-center ${
                            isMaxCut
                              ? 'bg-amber-500/10 border-amber-500/40'
                              : 'bg-surface border-brand-border/30'
                          }`}
                        >
                          <div className={`font-mono text-xs font-bold ${isMaxCut ? 'text-amber-300' : 'text-text-primary'}`}>
                            |{amp.basis}⟩
                          </div>
                          <div className="text-[11px] font-mono text-text-muted mt-1">
                            {pPct}%
                          </div>
                          <div className="text-[9px] font-mono text-cyan-400 mt-0.5">
                            φ = {amp.phase_rad.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Energy Landscape Tab */}
        {activeTab === 'landscape' && result && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-orbitron font-bold text-amber-400">
                  2D Parameter Energy Landscape: ⟨C⟩(γ, β)
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Grid sweep over cost angle γ ∈ [0, π] and mixer angle β ∈ [0, π/2]. Bright amber spots indicate maximum cuts.
                </p>
              </div>
              <div className="text-right font-mono text-xs">
                <span className="text-text-muted">Current: </span>
                <span className="text-amber-300 font-bold">γ={gamma.toFixed(2)}, β={beta.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-8 gap-1.5 p-4 rounded-xl bg-black/50 border border-brand-border max-w-xl mx-auto">
              {result.landscape.map((pt, idx) => {
                const ratioPct = Math.round(pt.ratio * 100);
                const isSelected = Math.abs(pt.gamma - gamma) < 0.25 && Math.abs(pt.beta - beta) < 0.15;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setGamma(pt.gamma);
                      setBeta(pt.beta);
                      handleRun(false);
                    }}
                    className={`h-12 rounded cursor-pointer transition-all flex flex-col items-center justify-center border ${
                      isSelected
                        ? 'border-white scale-110 shadow-lg shadow-amber-500/50 z-10'
                        : 'border-brand-border/20 hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: `rgba(245, 158, 11, ${Math.max(0.1, pt.ratio)})`,
                    }}
                    title={`γ=${pt.gamma}, β=${pt.beta} -> Cut: ${pt.expected_cut}`}
                  >
                    <span className="text-[10px] font-mono font-bold text-white drop-shadow">
                      {pt.expected_cut.toFixed(1)}
                    </span>
                    <span className="text-[8px] font-mono text-amber-200">
                      {ratioPct}%
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between max-w-xl mx-auto text-[10px] font-mono text-text-muted mt-2">
              <span>β = 0.0</span>
              <span>Mixer Parameter Axis β →</span>
              <span>β = π/2</span>
            </div>
          </Card>
        )}

        {/* Theory Tab */}
        {activeTab === 'theory' && (
          <div className="max-w-4xl space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-orbitron font-bold text-amber-400">The QAOA Ansatz & Adiabatic Connection</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                QAOA was introduced by Farhi, Goldstone, and Gutmann (2014) as a polynomial-time quantum heuristic
                for combinatorial optimization. It is a Trotterized, finite-depth discretization of the Adiabatic Quantum Computing paradigm.
              </p>

              <h4 className="text-base font-orbitron font-bold text-cyan-400 pt-2">Cost Hamiltonian H_C</h4>
              <p className="text-sm text-text-secondary leading-relaxed">
                For a graph G = (V, E), the Max-Cut cost operator is diagonal in the computational basis:
                <code className="block my-2 p-3 rounded bg-black/40 border border-brand-border font-mono text-amber-300">
                  H_C = (1/2) Σ_((u,v) ∈ E) (I - Z_u Z_v)
                </code>
                Applying the unitary <code className="text-amber-300 font-mono">e^(-i γ H_C)</code> imprints a relative phase
                <code className="text-amber-300 font-mono">e^(-i γ C(z))</code> onto each configuration |z⟩.
              </p>

              <h4 className="text-base font-orbitron font-bold text-purple-400 pt-2">Mixer Hamiltonian H_M</h4>
              <p className="text-sm text-text-secondary leading-relaxed">
                The transverse-field mixer drives quantum transitions between computational basis states:
                <code className="block my-2 p-3 rounded bg-black/40 border border-brand-border font-mono text-purple-300">
                  H_M = Σ_(v ∈ V) X_v
                </code>
                The unitary <code className="text-purple-300 font-mono">e^(-i β H_M)</code> applies single-qubit X-rotations
                <code className="text-purple-300 font-mono">R_X(2β)</code>, producing destructive interference against low-cut states.
              </p>
            </Card>
          </div>
        )}

        {/* Code Tab */}
        {activeTab === 'code' && (
          <Card className="p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-orbitron font-bold text-amber-400">Qiskit QAOA Implementation</h3>
              <Badge color="gold">Qiskit Aer</Badge>
            </div>
            <pre className="p-4 rounded-xl bg-black/60 border border-brand-border font-mono text-xs text-amber-300 overflow-x-auto leading-relaxed">
{`from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

# Graph edges for ${result?.graph_name ?? 'Triangle'}
edges = ${JSON.stringify(result?.edges ?? [[0, 1], [1, 2], [0, 2]])}
n_nodes = ${result?.n_nodes ?? 3}
gamma = ${gamma.toFixed(2)}
beta = ${beta.toFixed(2)}

qc = QuantumCircuit(n_nodes)

# 1. Prepare uniform superposition
for i in range(n_nodes):
    qc.h(i)

# 2. Cost unitary e^(-i*gamma*H_C)
for u, v in edges:
    qc.cx(u, v)
    qc.rz(2 * gamma, v)
    qc.cx(u, v)

# 3. Mixer unitary e^(-i*beta*H_M)
for i in range(n_nodes):
    qc.rx(2 * beta, i)

# 4. Measure
qc.measure_all()

# Simulate
sim = AerSimulator()
counts = sim.run(transpile(qc, sim), shots=1024).result().get_counts()
print("Sampled partitions:", counts)`}
            </pre>
          </Card>
        )}
      </div>
    </div>
  );
}
