import React, { useState } from 'react';
import { Play, CheckCircle2, AlertTriangle, ShieldCheck, Activity, Cpu, RefreshCw, BarChart2 } from 'lucide-react';
import type { CircuitIR } from '../types/quantum';
import { runParityCheck, type ParityResponse } from '../api/circuit';

interface ParityCheckViewProps {
  circuit: CircuitIR;
  shots?: number;
}

export default function ParityCheckView({ circuit, shots = 1024 }: ParityCheckViewProps) {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [parityResult, setParityResult] = useState<ParityResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedShots, setSelectedShots] = useState<number>(shots);

  const handleRunParity = async () => {
    setIsRunning(true);
    setErrorMsg(null);
    try {
      const res = await runParityCheck(circuit, selectedShots, 0.01);
      setParityResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Parity check execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  // Collect all unique outcome states across all engines
  const allStates = React.useMemo(() => {
    if (!parityResult) return [];
    const stateSet = new Set<string>();
    Object.values(parityResult.circuits).forEach((c) => {
      if (c.probabilities) {
        Object.keys(c.probabilities).forEach((k) => stateSet.add(k));
      }
    });
    return Array.from(stateSet).sort();
  }, [parityResult]);

  return (
    <div className="space-y-4">
      {/* Top Banner & Control */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg bg-surface-secondary border border-border">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-brand" />
            <span className="font-semibold text-text-primary text-xs">
              Multi-Engine Cross-Framework Parity Engine (Phase 5)
            </span>
          </div>
          <p className="text-[11px] text-text-muted">
            Asserts identical physical outcomes across independent quantum simulator runtimes: Qiskit Aer, PennyLane, and Cirq.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-text-muted text-[11px]">Shots:</span>
            <select
              value={selectedShots}
              onChange={(e) => setSelectedShots(Number(e.target.value))}
              className="px-2 py-1 bg-surface border border-border rounded text-xs text-text-primary focus:outline-none focus:border-brand"
            >
              <option value={256}>256</option>
              <option value={1024}>1024</option>
              <option value={4096}>4096</option>
            </select>
          </div>

          <button
            onClick={handleRunParity}
            disabled={isRunning}
            className="px-3 py-1.5 rounded-md bg-brand text-white text-xs font-medium hover:bg-brand/90 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {isRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isRunning ? 'Verifying Parity...' : 'Run Parity Verification'}</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Parity Results */}
      {parityResult && (
        <div className="space-y-4">
          {/* Summary Badge */}
          <div
            className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
              parityResult.all_pass
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {parityResult.all_pass ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              )}
              <span className="font-semibold">
                {parityResult.all_pass
                  ? 'All Engine Parity Checks Passed (TVD ≤ 0.01 Tolerance)'
                  : 'Statistical Discrepancy Detected Between Engines'}
              </span>
            </div>
            <span className="text-[11px] font-mono opacity-80">
              {parityResult.parity_checks.length} pairwise checks evaluated
            </span>
          </div>

          {/* Engine Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(parityResult.circuits).map(([framework, info]) => (
              <div
                key={framework}
                className="p-3 rounded-lg bg-surface-secondary border border-border space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-primary capitalize">
                    {framework}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      info.status === 'success'
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-500/20 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {info.status === 'success' ? 'Verified' : 'Unavailable'}
                  </span>
                </div>
                <div className="text-[11px] text-text-muted font-mono">
                  Backend: {info.backend ?? 'Not installed'}
                </div>
                {info.probabilities && (
                  <div className="pt-1 border-t border-border/50 space-y-1">
                    <span className="text-[10px] text-text-muted block">Outcomes:</span>
                    <div className="space-y-0.5">
                      {Object.entries(info.probabilities)
                        .filter(([_, p]) => p > 0.001)
                        .map(([state, p]) => (
                          <div key={state} className="flex justify-between text-[11px] font-mono">
                            <span>|{state}⟩</span>
                            <span>{(p * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pairwise TVD Comparison Table */}
          {parityResult.parity_checks.length > 0 && (
            <div className="rounded-lg border border-border overflow-hidden bg-surface text-xs">
              <div className="px-3.5 py-2 bg-surface-secondary border-b border-border flex items-center justify-between font-semibold text-text-primary text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-brand" />
                  <span>Pairwise Total Variation Distance (TVD) Matrix</span>
                </div>
                <span className="text-[10px] text-text-muted">TVD = ½ ∑ |P_a(x) - P_b(x)|</span>
              </div>
              <div className="divide-y divide-border">
                {parityResult.parity_checks.map((chk, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium capitalize text-text-primary">
                        {chk.framework_a} ↔ {chk.framework_b}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span>TVD: <strong>{chk.tvd.toFixed(4)}</strong></span>
                      <span className="text-text-muted">Tol: {chk.tolerance}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          chk.pass
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {chk.pass ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Probabilities Multi-Engine Overlay */}
          {allStates.length > 0 && (
            <div className="rounded-lg border border-border p-3.5 bg-surface space-y-2 text-xs">
              <span className="font-semibold text-text-primary block text-[11px]">
                State Probability Matrix Across Engines
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-border text-text-muted">
                      <th className="py-1.5 px-2">State</th>
                      {Object.keys(parityResult.circuits).map((fw) => (
                        <th key={fw} className="py-1.5 px-2 capitalize">{fw}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {allStates.map((st) => (
                      <tr key={st} className="hover:bg-surface-secondary/40">
                        <td className="py-1.5 px-2 font-bold text-text-primary">|{st}⟩</td>
                        {Object.entries(parityResult.circuits).map(([fw, info]) => {
                          const prob = info.probabilities?.[st] ?? 0;
                          return (
                            <td key={fw} className="py-1.5 px-2">
                              {(prob * 100).toFixed(1)}%
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
