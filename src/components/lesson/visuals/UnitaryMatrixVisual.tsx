/**
 * UnitaryMatrixVisual — Interactive demonstration of 2x2 Unitary matrix transformations on quantum state vectors.
 */

import React, { useState, useCallback } from 'react';

interface Props {
  id: string;
  initialProps?: Record<string, unknown>;
  interactionPrompt?: string;
  onInteract?: () => void;
}

export default function UnitaryMatrixVisual({ id, interactionPrompt, onInteract }: Props) {
  const [selectedGate, setSelectedGate] = useState<'X' | 'Y' | 'Z' | 'H'>('H');
  const [inputState, setInputState] = useState<'0' | '1'>('0');
  const [hasInteracted, setHasInteracted] = useState(false);

  const triggerInteract = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
      onInteract?.();
    }
  }, [hasInteracted, onInteract]);

  // Gate definitions
  const gates = {
    X: {
      name: 'Pauli-X (Bit Flip)',
      matrix: [['0', '1'], ['1', '0']],
      output0: '|1⟩',
      output1: '|0⟩',
    },
    Y: {
      name: 'Pauli-Y (Bit + Phase Flip)',
      matrix: [['0', '-i'], ['i', '0']],
      output0: 'i|1⟩',
      output1: '-i|0⟩',
    },
    Z: {
      name: 'Pauli-Z (Phase Flip)',
      matrix: [['1', '0'], ['0', '-1']],
      output0: '|0⟩',
      output1: '-|1⟩',
    },
    H: {
      name: 'Hadamard (Superposition)',
      matrix: [['1/√2', '1/√2'], ['1/√2', '-1/√2']],
      output0: '1/√2 |0⟩ + 1/√2 |1⟩ = |+⟩',
      output1: '1/√2 |0⟩ - 1/√2 |1⟩ = |−⟩',
    },
  };

  const currentGate = gates[selectedGate];
  const outVector = inputState === '0' ? currentGate.output0 : currentGate.output1;

  return (
    <div className="rounded-xl border border-border bg-surface-secondary/60 p-5 space-y-4" id={id}>
      {interactionPrompt && (
        <p className="text-xs text-text-secondary italic">{interactionPrompt}</p>
      )}

      {/* Select Gate and Input State */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">Gate:</span>
          {(['H', 'X', 'Y', 'Z'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => {
                setSelectedGate(g);
                triggerInteract();
              }}
              className={`px-3 py-1 rounded text-xs font-mono font-bold transition-colors ${
                selectedGate === g
                  ? 'bg-primary text-white'
                  : 'bg-surface-primary border border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">Input:</span>
          {(['0', '1'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setInputState(st);
                triggerInteract();
              }}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                inputState === st
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-surface-primary border border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              |{st}⟩
            </button>
          ))}
        </div>
      </div>

      {/* Matrix Vector Multiplication Equation Display */}
      <div className="bg-surface-primary p-4 rounded-lg border border-border/80 flex flex-wrap items-center justify-center gap-4 text-xs font-mono">
        <div className="text-text-muted">{currentGate.name}</div>
        <div className="flex items-center gap-2">
          {/* Matrix brackets */}
          <div className="border-l-2 border-r-2 border-text-muted px-2 py-1 flex flex-col gap-1 text-center">
            <div className="flex gap-3 justify-around">
              <span className="w-10">{currentGate.matrix[0][0]}</span>
              <span className="w-10">{currentGate.matrix[0][1]}</span>
            </div>
            <div className="flex gap-3 justify-around">
              <span className="w-10">{currentGate.matrix[1][0]}</span>
              <span className="w-10">{currentGate.matrix[1][1]}</span>
            </div>
          </div>

          <span className="text-text-muted">×</span>

          {/* Vector input */}
          <div className="border-l-2 border-r-2 border-text-muted px-2 py-1 flex flex-col gap-1 text-center">
            <span>{inputState === '0' ? '1' : '0'}</span>
            <span>{inputState === '0' ? '0' : '1'}</span>
          </div>

          <span className="text-text-muted">=</span>

          {/* Result Output */}
          <div className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded text-primary font-bold">
            {outVector}
          </div>
        </div>
      </div>
    </div>
  );
}
