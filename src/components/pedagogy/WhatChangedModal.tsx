import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitCompare,
  X,
  ArrowRight,
  Sparkles,
  Layers,
  Cpu,
  Percent,
  CheckCircle2,
  AlertTriangle,
  MinusCircle,
  PlusCircle,
  RefreshCw,
} from 'lucide-react';
import type { CircuitIR } from '../../types/quantum';
import { compareCircuits, type WhatChangedResponse, type GateDiffItem } from '../../api/quantum';

interface WhatChangedModalProps {
  isOpen: boolean;
  onClose: () => void;
  circuitA: CircuitIR;
  circuitB: CircuitIR;
  titleA?: string;
  titleB?: string;
}

type LayerTab = 'all' | 'circuit' | 'state' | 'probability' | 'concept';

export default function WhatChangedModal({
  isOpen,
  onClose,
  circuitA,
  circuitB,
  titleA = 'Version A (Last Run)',
  titleB = 'Version B (Active Circuit)',
}: WhatChangedModalProps) {
  const [diffResult, setDiffResult] = useState<WhatChangedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LayerTab>('all');

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchDiff = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await compareCircuits(circuitA, circuitB);
        if (isMounted) {
          setDiffResult(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to compute What Changed diff', err);
          setError(err instanceof Error ? err.message : 'Unable to compute circuit difference.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDiff();
    return () => {
      isMounted = false;
    };
  }, [isOpen, circuitA, circuitB]);

  if (!isOpen) return null;

  const fidelityPct = diffResult ? Math.min(100, Math.max(0, diffResult.stateFidelity * 100)) : 0;
  const numDiffs = diffResult?.circuitDiff?.length ?? 0;
  const numProbShifts = diffResult ? Object.keys(diffResult.probabilityDiff).length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-3xl p-6 bg-slate-900/95 border border-cyan-500/30 rounded-2xl shadow-2xl relative max-h-[90vh] flex flex-col text-slate-100 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-orbitron text-slate-100 tracking-wide flex items-center gap-2">
                Why Did My Result Change?
                <span className="text-[11px] font-mono font-normal px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  4-Layer Diff Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Comparing <span className="text-slate-300 font-semibold">{titleA}</span> against{' '}
                <span className="text-cyan-300 font-semibold">{titleB}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Layer Selection Tabs */}
        <div className="flex gap-1.5 pb-3 border-b border-slate-800/80 text-xs overflow-x-auto flex-shrink-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            All 4 Layers
          </button>
          <button
            onClick={() => setActiveTab('circuit')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'circuit'
                ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Layer 1: Circuit Diff
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-cyan-400">
              {numDiffs}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('state')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'state'
                ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            Layer 2: State Diff
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-cyan-400 font-mono">
              {fidelityPct.toFixed(0)}%
            </span>
          </button>
          <button
            onClick={() => setActiveTab('probability')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'probability'
                ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Layer 3: Probabilities
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-cyan-400">
              {numProbShifts}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('concept')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'concept'
                ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Layer 4: Conceptual Physics
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-6">
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin mx-auto" />
              <p className="text-sm text-slate-300 font-medium">Computing 4-layer quantum state diff...</p>
              <p className="text-xs text-slate-500">
                Evaluating gate topology, Dirac statevectors, unitary fidelity, and Socratic physics transitions.
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm text-red-300 mb-1">Diff Engine Error</strong>
                <p>{error}</p>
              </div>
            </div>
          ) : diffResult ? (
            <>
              {/* LAYER 4: CONCEPTUAL SOCRATIC EXPLANATION */}
              {(activeTab === 'all' || activeTab === 'concept') && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-purple-950/30 border border-cyan-500/40 text-cyan-100 text-xs shadow-inner">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs uppercase tracking-wider text-cyan-300">
                          Layer 4 · Physical Concept Shift
                        </span>
                        <span className="text-[10px] text-cyan-400/80 font-mono">Socratic Diagnostic</span>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-200 font-normal pt-1">
                        {diffResult.conceptExplanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* LAYER 1: CIRCUIT TOPOLOGY DIFF */}
              {(activeTab === 'all' || activeTab === 'circuit') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Layer 1 · Circuit Architecture Diff
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {numDiffs === 0
                        ? '0 gate differences (identical)'
                        : `${numDiffs} gate operation difference${numDiffs > 1 ? 's' : ''}`}
                    </span>
                  </div>

                  {numDiffs === 0 ? (
                    <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 text-center text-xs text-slate-400">
                      Both circuit versions have identical gate operations and step alignment.
                    </div>
                  ) : (
                    <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80 bg-slate-950/40">
                      {diffResult.circuitDiff.map((item: GateDiffItem, idx: number) => {
                        const isAdded = item.changeType === 'ADDED';
                        const isRemoved = item.changeType === 'REMOVED';
                        const isModified = item.changeType === 'MODIFIED';

                        return (
                          <div
                            key={idx}
                            className="p-3 flex items-center justify-between text-xs hover:bg-slate-800/20 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${
                                  isAdded
                                    ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60'
                                    : isRemoved
                                    ? 'bg-rose-950/70 text-rose-400 border border-rose-800/60'
                                    : 'bg-amber-950/70 text-amber-300 border border-amber-800/60'
                                }`}
                              >
                                {isAdded && <PlusCircle className="w-3 h-3" />}
                                {isRemoved && <MinusCircle className="w-3 h-3" />}
                                {isModified && <AlertTriangle className="w-3 h-3" />}
                                {item.changeType}
                              </span>

                              <div className="font-mono text-slate-300">
                                <span className="text-slate-400">Step {item.step + 1} ·</span> Qubit{' '}
                                <strong className="text-cyan-300">
                                  {item.targets.map((t) => `q[${t}]`).join(', ')}
                                </strong>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 font-mono text-xs">
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 block">Version A</span>
                                <span
                                  className={`font-bold ${
                                    item.gateA ? 'text-slate-200' : 'text-slate-400 italic'
                                  }`}
                                >
                                  {item.gateA
                                    ? `${item.gateA}${
                                        item.controlsA && item.controlsA.length > 0
                                          ? ` (ctrl: ${item.controlsA.map((c) => `q[${c}]`).join(',')})`
                                          : ''
                                      }`
                                    : 'None'}
                                </span>
                              </div>

                              <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />

                              <div>
                                <span className="text-[10px] text-slate-400 block">Version B</span>
                                <span
                                  className={`font-bold ${
                                    item.gateB ? 'text-cyan-400' : 'text-slate-400 italic'
                                  }`}
                                >
                                  {item.gateB
                                    ? `${item.gateB}${
                                        item.controlsB && item.controlsB.length > 0
                                          ? ` (ctrl: ${item.controlsB.map((c) => `q[${c}]`).join(',')})`
                                          : ''
                                      }`
                                    : 'None'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* LAYER 2: QUANTUM STATEVECTOR DIFF & FIDELITY */}
              {(activeTab === 'all' || activeTab === 'state') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Layer 2 · Quantum Statevector & Fidelity
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      F(ψ_A, ψ_B) = {fidelityPct.toFixed(1)}%
                    </span>
                  </div>

                  {/* Statevector Comparison Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          |ψ_A⟩ · {titleA}
                        </span>
                      </div>
                      <div className="font-mono text-sm font-bold text-slate-200 break-words">
                        |ψ_A⟩ = {diffResult.stateSummaryA}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-cyan-800/40">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                          |ψ_B⟩ · {titleB}
                        </span>
                      </div>
                      <div className="font-mono text-sm font-bold text-cyan-300 break-words">
                        |ψ_B⟩ = {diffResult.stateSummaryB}
                      </div>
                    </div>
                  </div>

                  {/* Fidelity Gauge Bar */}
                  <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        Quantum State Overlap Fidelity:
                      </span>
                      <span className="font-mono font-bold text-cyan-400">{fidelityPct.toFixed(2)}%</span>
                    </div>

                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${fidelityPct}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-400">
                      {fidelityPct >= 99.9
                        ? 'States are unitarily identical (up to global phase).'
                        : fidelityPct >= 50
                        ? 'States retain significant Hilbert space overlap but differ in amplitudes or phase kickback.'
                        : fidelityPct > 0
                        ? 'Substantial transformation: mostly distinct state trajectories.'
                        : 'States are completely orthogonal (zero quantum overlap).'}
                    </p>
                  </div>
                </div>
              )}

              {/* LAYER 3: BASIS PROBABILITY DELTA */}
              {(activeTab === 'all' || activeTab === 'probability') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Layer 3 · Basis Measurement Probability Delta (Δp)
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {Object.keys(diffResult.probabilityDiff).length} basis states compared
                    </span>
                  </div>

                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                    <div className="divide-y divide-slate-800/60 text-xs font-mono">
                      {Object.entries(diffResult.probabilityDiff).map(([basis, p]: [string, any]) => {
                        const deltaPct = p.delta * 100;
                        const isPos = p.delta > 0.001;
                        const isNeg = p.delta < -0.001;

                        return (
                          <div
                            key={basis}
                            className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-800/20"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-slate-200 font-bold px-2 py-0.5 rounded bg-slate-800 text-xs">
                                |{basis}⟩
                              </span>
                            </div>

                            <div className="flex items-center gap-4 flex-1 justify-end">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-xs">{(p.versionA * 100).toFixed(1)}%</span>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                                <span className="text-cyan-300 font-bold text-xs">
                                  {(p.versionB * 100).toFixed(1)}%
                                </span>
                              </div>

                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-bold min-w-[58px] text-center ${
                                  isPos
                                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                                    : isNeg
                                    ? 'bg-rose-950/80 text-rose-400 border border-rose-800/50'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {isPos ? `+${deltaPct.toFixed(1)}%` : `${deltaPct.toFixed(1)}%`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between flex-shrink-0 text-xs text-slate-400">
          <span>Smart India Hackathon · Quantum Lens AI Pedagogy Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </motion.div>
    </div>
  );
}
