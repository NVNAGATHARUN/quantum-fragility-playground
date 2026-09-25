/**
 * MeasurementProbabilityVisual — Interactive demonstration of the Born Rule and Shot Noise.
 * Compares theoretical probability vs empirical counts across simulated measurement shots.
 */

import React, { useState, useCallback } from 'react';

interface Props {
  id: string;
  initialProps?: Record<string, unknown>;
  interactionPrompt?: string;
  onInteract?: () => void;
}

export default function MeasurementProbabilityVisual({ id, interactionPrompt, onInteract }: Props) {
  const [thetaDeg, setThetaDeg] = useState(60); // Angle determining superposition
  const [shots, setShots] = useState(100);
  const [simResults, setSimResults] = useState<{ counts0: number; counts1: number; total: number } | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const thetaRad = (thetaDeg * Math.PI) / 180;
  // State: cos(theta/2)|0> + sin(theta/2)|1>
  const prob0 = Math.pow(Math.cos(thetaRad / 2), 2);
  const prob1 = Math.pow(Math.sin(thetaRad / 2), 2);

  const triggerInteract = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
      onInteract?.();
    }
  }, [hasInteracted, onInteract]);

  const runSimulation = useCallback((shotCount: number) => {
    triggerInteract();
    let c0 = 0;
    for (let i = 0; i < shotCount; i++) {
      if (Math.random() < prob0) {
        c0++;
      }
    }
    setSimResults({
      counts0: c0,
      counts1: shotCount - c0,
      total: shotCount,
    });
  }, [prob0, triggerInteract]);

  const empProb0 = simResults ? simResults.counts0 / simResults.total : null;
  const empProb1 = simResults ? simResults.counts1 / simResults.total : null;

  return (
    <div className="rounded-xl border border-border bg-surface-secondary/60 p-5 space-y-5" id={id}>
      {interactionPrompt && (
        <p className="text-xs text-text-secondary italic">{interactionPrompt}</p>
      )}

      {/* State Slider */}
      <div>
        <div className="flex justify-between text-xs text-text-secondary mb-1">
          <span>State Vector Superposition: <code className="font-mono text-text-primary">cos(θ/2)|0⟩ + sin(θ/2)|1⟩</code></span>
          <span className="font-mono font-medium text-text-primary">θ = {thetaDeg}°</span>
        </div>
        <input
          type="range"
          min="0"
          max="180"
          value={thetaDeg}
          onChange={(e) => {
            setThetaDeg(Number(e.target.value));
            setSimResults(null); // Reset simulation on state change
            triggerInteract();
          }}
          className="w-full accent-primary h-1.5 bg-border rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Probability Bars Comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* State 0 */}
        <div className="bg-surface-primary p-3 rounded-lg border border-border/80 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-text-primary">Outcome |0⟩</span>
            <span className="font-mono text-primary font-medium">Theory: {(prob0 * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-border/50 h-3 rounded-full overflow-hidden flex">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${prob0 * 100}%` }}
              title={`Theoretical P(0): ${(prob0 * 100).toFixed(1)}%`}
            />
          </div>

          {empProb0 !== null && (
            <div className="space-y-1 pt-1 border-t border-border/40">
              <div className="flex justify-between text-[11px] text-text-secondary">
                <span>Empirical ({simResults?.counts0} / {simResults?.total}):</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  {(empProb0 * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-border/50 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${empProb0 * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* State 1 */}
        <div className="bg-surface-primary p-3 rounded-lg border border-border/80 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-text-primary">Outcome |1⟩</span>
            <span className="font-mono text-indigo-500 font-medium">Theory: {(prob1 * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-border/50 h-3 rounded-full overflow-hidden flex">
            <div
              className="bg-indigo-500 h-full transition-all duration-300"
              style={{ width: `${prob1 * 100}%` }}
              title={`Theoretical P(1): ${(prob1 * 100).toFixed(1)}%`}
            />
          </div>

          {empProb1 !== null && (
            <div className="space-y-1 pt-1 border-t border-border/40">
              <div className="flex justify-between text-[11px] text-text-secondary">
                <span>Empirical ({simResults?.counts1} / {simResults?.total}):</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  {(empProb1 * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-border/50 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${empProb1 * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Measurement Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border/60">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span>Detector Shots:</span>
          {[10, 100, 1000].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setShots(s);
                runSimulation(s);
              }}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                shots === s
                  ? 'bg-primary text-white font-medium'
                  : 'bg-surface-primary border border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {s} shots
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => runSimulation(shots)}
          className="px-3.5 py-1.5 rounded-lg bg-surface-primary hover:bg-border/40 border border-border text-xs font-medium text-text-primary transition-colors flex items-center gap-1.5"
        >
          <span>Measure Now ⚡</span>
        </button>
      </div>
    </div>
  );
}
