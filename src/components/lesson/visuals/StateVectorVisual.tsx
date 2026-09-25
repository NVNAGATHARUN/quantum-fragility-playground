/**
 * StateVectorVisual — visual representation of quantum state vector amplitudes and phases.
 */

import React, { useState, useCallback } from 'react';

interface Props {
  id: string;
  initialProps?: Record<string, unknown>;
  interactionPrompt?: string;
  onInteract?: () => void;
}

export default function StateVectorVisual({ id, interactionPrompt, onInteract }: Props) {
  // Preset quantum states: |0>, |1>, |+>, |->, |i>, |-i>
  const presets = [
    { label: '|0⟩', alpha: { r: 1, i: 0 }, beta: { r: 0, i: 0 }, desc: 'Ground state' },
    { label: '|1⟩', alpha: { r: 0, i: 0 }, beta: { r: 1, i: 0 }, desc: 'Excited state' },
    { label: '|+⟩', alpha: { r: 1 / Math.SQRT2, i: 0 }, beta: { r: 1 / Math.SQRT2, i: 0 }, desc: 'Superposition (Equal phase)' },
    { label: '|−⟩', alpha: { r: 1 / Math.SQRT2, i: 0 }, beta: { r: -1 / Math.SQRT2, i: 0 }, desc: 'Superposition (Opposite phase)' },
    { label: '|i⟩', alpha: { r: 1 / Math.SQRT2, i: 0 }, beta: { r: 0, i: 1 / Math.SQRT2 }, desc: 'Imaginary phase (+π/2)' },
  ];

  const [selectedIdx, setSelectedIdx] = useState(2);
  const [hasInteracted, setHasInteracted] = useState(false);

  const current = presets[selectedIdx];
  const p0 = current.alpha.r * current.alpha.r + current.alpha.i * current.alpha.i;
  const p1 = current.beta.r * current.beta.r + current.beta.i * current.beta.i;

  const triggerInteract = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
      onInteract?.();
    }
  }, [hasInteracted, onInteract]);

  return (
    <div className="rounded-xl border border-border bg-surface-secondary/60 p-5 space-y-4" id={id}>
      {interactionPrompt && (
        <p className="text-xs text-text-secondary italic">{interactionPrompt}</p>
      )}

      {/* Preset selector */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset, idx) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              setSelectedIdx(idx);
              triggerInteract();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              selectedIdx === idx
                ? 'bg-primary text-white font-semibold shadow-sm'
                : 'bg-surface-primary border border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="text-xs text-text-muted">{current.desc}</div>

      {/* Vector Amplitudes breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-surface-primary p-3.5 rounded-lg border border-border/80 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-text-primary">Component α (|0⟩)</span>
            <span className="font-mono text-text-secondary">
              {current.alpha.r.toFixed(3)} {current.alpha.i !== 0 ? `+ ${current.alpha.i.toFixed(3)}i` : ''}
            </span>
          </div>
          <div className="flex justify-between text-[11px] text-text-muted">
            <span>Probability |α|²:</span>
            <span className="font-mono font-medium text-primary">{(p0 * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-border/50 h-2.5 rounded-full overflow-hidden">
            <div className="bg-primary h-full transition-all duration-300" style={{ width: `${p0 * 100}%` }} />
          </div>
        </div>

        <div className="bg-surface-primary p-3.5 rounded-lg border border-border/80 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-text-primary">Component β (|1⟩)</span>
            <span className="font-mono text-text-secondary">
              {current.beta.r.toFixed(3)} {current.beta.i !== 0 ? `+ ${current.beta.i.toFixed(3)}i` : ''}
            </span>
          </div>
          <div className="flex justify-between text-[11px] text-text-muted">
            <span>Probability |β|²:</span>
            <span className="font-mono font-medium text-indigo-500">{(p1 * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-border/50 h-2.5 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${p1 * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
