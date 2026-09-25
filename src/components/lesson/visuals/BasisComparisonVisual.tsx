/**
 * BasisComparisonVisual — Interactive comparison between Computational (Z) basis and Hadamard (X) basis.
 */

import React, { useState, useCallback } from 'react';

interface Props {
  id: string;
  initialProps?: Record<string, unknown>;
  interactionPrompt?: string;
  onInteract?: () => void;
}

export default function BasisComparisonVisual({ id, interactionPrompt, onInteract }: Props) {
  const [activeBasis, setActiveBasis] = useState<'Z' | 'X'>('Z');
  const [selectedState, setSelectedState] = useState<'0' | '1' | '+' | '-'>('0');
  const [hasInteracted, setHasInteracted] = useState(false);

  const triggerInteract = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
      onInteract?.();
    }
  }, [hasInteracted, onInteract]);

  // Decomposition descriptions
  const decompositions = {
    '0': {
      zRep: '1.00 |0⟩ + 0.00 |1⟩',
      xRep: '0.707 |+⟩ + 0.707 |−⟩',
      zProbs: { first: '100%', second: '0%' },
      xProbs: { first: '50%', second: '50%' },
    },
    '1': {
      zRep: '0.00 |0⟩ + 1.00 |1⟩',
      xRep: '0.707 |+⟩ − 0.707 |−⟩',
      zProbs: { first: '0%', second: '100%' },
      xProbs: { first: '50%', second: '50%' },
    },
    '+': {
      zRep: '0.707 |0⟩ + 0.707 |1⟩',
      xRep: '1.00 |+⟩ + 0.00 |−⟩',
      zProbs: { first: '50%', second: '50%' },
      xProbs: { first: '100%', second: '0%' },
    },
    '-': {
      zRep: '0.707 |0⟩ − 0.707 |1⟩',
      xRep: '0.00 |+⟩ + 1.00 |−⟩',
      zProbs: { first: '50%', second: '50%' },
      xProbs: { first: '0%', second: '100%' },
    },
  };

  const curr = decompositions[selectedState];

  return (
    <div className="rounded-xl border border-border bg-surface-secondary/60 p-5 space-y-4" id={id}>
      {interactionPrompt && (
        <p className="text-xs text-text-secondary italic">{interactionPrompt}</p>
      )}

      {/* Select State */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-text-secondary">Input State:</span>
        <div className="flex gap-2">
          {(['0', '1', '+', '-'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSelectedState(s);
                triggerInteract();
              }}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                selectedState === s
                  ? 'bg-primary text-white'
                  : 'bg-surface-primary border border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              |{s}⟩
            </button>
          ))}
        </div>
      </div>

      {/* Basis representations side-by-side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Z Basis */}
        <div className={`p-4 rounded-lg border transition-all ${
          activeBasis === 'Z' ? 'bg-surface-primary border-primary shadow-sm' : 'bg-surface-primary/50 border-border'
        }`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-text-primary">Z Basis ({'{|0⟩, |1⟩}'})</span>
            <button
              type="button"
              onClick={() => {
                setActiveBasis('Z');
                triggerInteract();
              }}
              className="text-[11px] text-primary hover:underline"
            >
              Measure in Z
            </button>
          </div>
          <div className="font-mono text-sm text-text-primary mb-3">{curr.zRep}</div>
          <div className="space-y-1 text-xs text-text-secondary">
            <div className="flex justify-between">
              <span>P(Measure |0⟩):</span>
              <span className="font-mono font-medium text-text-primary">{curr.zProbs.first}</span>
            </div>
            <div className="flex justify-between">
              <span>P(Measure |1⟩):</span>
              <span className="font-mono font-medium text-text-primary">{curr.zProbs.second}</span>
            </div>
          </div>
        </div>

        {/* X Basis */}
        <div className={`p-4 rounded-lg border transition-all ${
          activeBasis === 'X' ? 'bg-surface-primary border-primary shadow-sm' : 'bg-surface-primary/50 border-border'
        }`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-text-primary">X Basis ({'{|+⟩, |−⟩}'})</span>
            <button
              type="button"
              onClick={() => {
                setActiveBasis('X');
                triggerInteract();
              }}
              className="text-[11px] text-primary hover:underline"
            >
              Measure in X
            </button>
          </div>
          <div className="font-mono text-sm text-text-primary mb-3">{curr.xRep}</div>
          <div className="space-y-1 text-xs text-text-secondary">
            <div className="flex justify-between">
              <span>P(Measure |+⟩):</span>
              <span className="font-mono font-medium text-text-primary">{curr.xProbs.first}</span>
            </div>
            <div className="flex justify-between">
              <span>P(Measure |−⟩):</span>
              <span className="font-mono font-medium text-text-primary">{curr.xProbs.second}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
