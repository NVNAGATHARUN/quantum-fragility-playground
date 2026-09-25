import React, { useState, useEffect } from 'react';
import { GitCompare, Sparkles, RefreshCw, CheckCircle2, ArrowRight, Zap, Bookmark } from 'lucide-react';
import { compareCircuits, type WhatChangedResponse, type GateDiffItem } from '../api/quantum';
import type { CircuitIR } from '../types/quantum';

interface WhatChangedViewProps {
  baselineCircuit: CircuitIR;
  currentCircuit: CircuitIR;
  onSetAsBaseline?: () => void;
}

export default function WhatChangedView({
  baselineCircuit,
  currentCircuit,
  onSetAsBaseline,
}: WhatChangedViewProps) {
  const [diffData, setDiffData] = useState<WhatChangedResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDiff() {
      setLoading(true);
      setError(null);
      try {
        const res = await compareCircuits(baselineCircuit, currentCircuit);
        if (!cancelled) {
          setDiffData(res);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to compare circuit versions');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDiff();
    return () => {
      cancelled = true;
    };
  }, [baselineCircuit, currentCircuit]);

  const fidelityPct = diffData ? Math.round(diffData.stateFidelity * 1000) / 10 : 100;

  return (
    <div className="space-y-4">
      {/* Header & Baseline Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-semibold text-text-primary tracking-tight">
              Physical Shift & Statevector Delta
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-secondary text-text-muted border border-border">
              v_base ({baselineCircuit.operations.length} gates) ➔ v_cur ({currentCircuit.operations.length} gates)
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Automated pedagogical version comparison computing topological gate diffs, state fidelity, and physical phase shifts.
          </p>
        </div>

        {onSetAsBaseline && (
          <button
            onClick={onSetAsBaseline}
            className="btn btn-secondary btn-sm text-xs shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
            title="Freeze current circuit as the new baseline comparison snapshot"
          >
            <Bookmark className="w-3.5 h-3.5 text-brand" />
            <span>Set Current as Baseline</span>
          </button>
        )}
      </div>

      {loading && (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-text-muted text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-brand" />
          <span>Computing state overlap and unitary diffs...</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {!loading && diffData && (
        <div className="space-y-4">
          {/* Concept Shift Card */}
          <div className="p-3.5 rounded-xl border border-brand/30 bg-brand/5 dark:bg-brand/10 space-y-1.5">
            <div className="flex items-center gap-1.5 text-brand text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Physical Concept Shift</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              {diffData.conceptExplanation}
            </p>
          </div>

          {/* Top Row: Fidelity & Statevector Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Fidelity Gauge */}
            <div className="p-3.5 rounded-lg border border-border bg-surface-secondary/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted font-medium">State Fidelity F</span>
                <span className="font-mono font-bold text-text-primary">{fidelityPct.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface border border-border overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    fidelityPct > 95
                      ? 'bg-emerald-500'
                      : fidelityPct > 50
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${fidelityPct}%` }}
                />
              </div>
              <p className="text-[11px] text-text-muted leading-tight">
                {fidelityPct >= 99.9
                  ? 'Physical states are mathematically identical.'
                  : fidelityPct > 70
                  ? 'Partial quantum overlap; unitary transformation preserved substantial coherence.'
                  : 'Orthogonal or radically altered statevector manifold.'}
              </p>
            </div>

            {/* Baseline Statevector */}
            <div className="p-3.5 rounded-lg border border-border bg-surface-secondary/40 space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted block">
                Baseline State |ψ_base⟩
              </span>
              <div className="font-mono text-xs font-semibold text-text-primary break-all">
                {diffData.stateSummaryA}
              </div>
            </div>

            {/* Current Statevector */}
            <div className="p-3.5 rounded-lg border border-brand/30 bg-brand/5 space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-brand block">
                Current State |ψ_current⟩
              </span>
              <div className="font-mono text-xs font-semibold text-text-primary break-all">
                {diffData.stateSummaryB}
              </div>
            </div>
          </div>

          {/* Gate Topology Diffs */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-text-primary block">
              Topological Gate Diffs ({diffData.circuitDiff.length})
            </span>

            {diffData.circuitDiff.length === 0 ? (
              <div className="p-3 rounded-lg border border-border bg-surface text-center text-xs text-text-muted">
                No gate additions, deletions, or swaps detected between snapshots.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {diffData.circuitDiff.map((diff, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-border bg-surface flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          diff.changeType === 'ADDED'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : diff.changeType === 'REMOVED'
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}
                      >
                        {diff.changeType}
                      </span>
                      <span className="font-mono text-text-muted text-[11px]">
                        Step {diff.step + 1}
                      </span>
                    </div>

                    <div className="font-mono font-semibold text-text-primary flex items-center gap-1.5">
                      {diff.changeType === 'MODIFIED' ? (
                        <>
                          <span className="text-text-muted line-through">{diff.gateA}</span>
                          <ArrowRight className="w-3 h-3 text-text-muted" />
                          <span className="text-brand">{diff.gateB}</span>
                        </>
                      ) : diff.changeType === 'ADDED' ? (
                        <span className="text-emerald-500">+{diff.gateB}</span>
                      ) : (
                        <span className="text-rose-500">-{diff.gateA}</span>
                      )}
                      <span className="text-[10px] text-text-muted font-normal">
                        ({diff.targets.map(t => `q${t}`).join(', ')})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Basis Probability Delta Table */}
          {Object.keys(diffData.probabilityDiff).length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold text-text-primary block">
                Born Probability Distribution Shifts
              </span>
              <div className="border border-border rounded-lg overflow-hidden bg-surface">
                <div className="grid grid-cols-4 px-3 py-2 text-[11px] font-semibold text-text-muted bg-surface-secondary/50 border-b border-border">
                  <span>Basis |x⟩</span>
                  <span>Baseline P_A</span>
                  <span>Current P_B</span>
                  <span>Delta ΔP</span>
                </div>
                <div className="divide-y divide-border/60">
                  {Object.entries(diffData.probabilityDiff).map(([basis, stat]) => (
                    <div
                      key={basis}
                      className="grid grid-cols-4 px-3 py-1.5 text-xs font-mono items-center hover:bg-surface-secondary/30 transition-colors"
                    >
                      <span className="font-bold text-text-primary">|{basis}⟩</span>
                      <span className="text-text-secondary">{(stat.versionA * 100).toFixed(1)}%</span>
                      <span className="text-text-secondary">{(stat.versionB * 100).toFixed(1)}%</span>
                      <span
                        className={`font-semibold ${
                          stat.delta > 0
                            ? 'text-emerald-500'
                            : stat.delta < 0
                            ? 'text-rose-500'
                            : 'text-text-muted'
                        }`}
                      >
                        {stat.delta > 0 ? `+${(stat.delta * 100).toFixed(1)}%` : `${(stat.delta * 100).toFixed(1)}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
