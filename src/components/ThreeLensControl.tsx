import React from 'react';
import { Layers, Activity, Cpu, Sparkles } from 'lucide-react';

export type QuantumLensMode = 'algorithm' | 'state' | 'hardware';

interface ThreeLensControlProps {
  activeLens: QuantumLensMode;
  onChangeLens: (lens: QuantumLensMode) => void;
  className?: string;
  operationLabel?: string;
}

export default function ThreeLensControl({
  activeLens,
  onChangeLens,
  className = '',
  operationLabel
}: ThreeLensControlProps) {
  const lenses: Array<{
    id: QuantumLensMode;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'algorithm',
      label: 'Algorithm Lens',
      description: 'Why is this operation used computationally?',
      icon: Sparkles,
    },
    {
      id: 'state',
      label: 'State Lens',
      description: 'Mathematical transformation on the wavefunction',
      icon: Activity,
    },
    {
      id: 'hardware',
      label: 'Hardware Lens',
      description: 'Physical microwave pulses & cryogenic wiring control',
      icon: Cpu,
    },
  ];

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-brand" />
          Quantum Observation Lens
        </span>
        {operationLabel && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-raised border border-border-subtle text-text-secondary">
            Target: {operationLabel}
          </span>
        )}
      </div>

      <div className="flex items-center p-1 rounded-lg bg-surface-raised border border-border-subtle gap-1">
        {lenses.map(lens => {
          const Icon = lens.icon;
          const isActive = activeLens === lens.id;
          return (
            <button
              key={lens.id}
              onClick={() => onChangeLens(lens.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-surface text-brand font-semibold shadow-subtle border border-border-subtle'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
              }`}
              title={lens.description}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand' : 'text-text-muted'}`} />
              <span className="truncate">{lens.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
