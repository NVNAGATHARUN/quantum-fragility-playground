import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitCompare, X, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import type { CircuitIR, WhatChangedDiff } from '../../types/quantum';
import { apiUrl } from '../../api/client';

interface WhatChangedModalProps {
  isOpen: boolean;
  onClose: () => void;
  circuitA: CircuitIR;
  circuitB: CircuitIR;
}

export default function WhatChangedModal({
  isOpen,
  onClose,
  circuitA,
  circuitB,
}: WhatChangedModalProps) {
  const [diffResult, setDiffResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchDiff = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(apiUrl('/api/v1/pedagogy/what-changed'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ circuitA, circuitB }),
        });
        const data = await res.json();
        setDiffResult(data);
      } catch (err) {
        console.error('Failed to compute What Changed diff', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiff();
  }, [isOpen, circuitA, circuitB]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <GitCompare className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold font-orbitron text-slate-100">
              What Changed? Circuit Comparison
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Comparing quantum states and calculating fidelity...
          </div>
        ) : diffResult ? (
          <div className="space-y-5">
            {/* Conceptual Diff Explanation */}
            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 text-xs leading-relaxed flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm text-cyan-300 mb-1">Physical Concept Shift</span>
                <p>{diffResult.conceptExplanation}</p>
              </div>
            </div>

            {/* Statevector Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Version A Statevector
                </span>
                <div className="font-mono text-sm font-bold text-slate-200">
                  {diffResult.stateSummaryA}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Version B Statevector
                </span>
                <div className="font-mono text-sm font-bold text-cyan-400">
                  {diffResult.stateSummaryB}
                </div>
              </div>
            </div>

            {/* Quantum State Fidelity */}
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-300 font-semibold">
                Quantum State Fidelity F(ψ_A, ψ_B):
              </span>
              <span className="text-sm font-mono font-bold text-cyan-400">
                {(diffResult.stateFidelity * 100).toFixed(1)}%
              </span>
            </div>

            {/* Probability Shift Table */}
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <div className="px-3.5 py-2 bg-slate-950 text-xs font-semibold text-slate-300 border-b border-slate-800">
                Basis Probability Shift
              </div>
              <div className="divide-y divide-slate-800/60 text-xs">
                {Object.entries(diffResult.probabilityDiff).map(([basis, p]: [string, any]) => (
                  <div key={basis} className="px-3.5 py-2 flex items-center justify-between font-mono">
                    <span className="text-slate-300 font-bold">|{basis}⟩</span>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400">
                        {(p.versionA * 100).toFixed(1)}%
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                      <span className="text-cyan-300 font-bold">
                        {(p.versionB * 100).toFixed(1)}%
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        p.delta > 0 ? 'bg-emerald-950/60 text-emerald-400' : p.delta < 0 ? 'bg-red-950/60 text-red-400' : 'text-slate-500'
                      }`}>
                        {p.delta > 0 ? `+${(p.delta * 100).toFixed(0)}%` : `${(p.delta * 100).toFixed(0)}%`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
              >
                Close Comparison
              </button>
            </div>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
