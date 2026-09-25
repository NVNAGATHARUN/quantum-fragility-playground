import React, { useState } from 'react';
import {
  Palette,
  Type,
  CheckCircle2,
  AlertCircle,
  Info,
  XCircle,
  FlaskConical,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Layers,
  Activity
} from 'lucide-react';
import { useTheme } from '../providers/ThemeProvider';

export default function DesignSystem() {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  const gates = [
    { name: 'H', desc: 'Hadamard', cat: 'Quick Access', accent: 'text-brand' },
    { name: 'X', desc: 'Pauli-X', cat: 'Quick Access', accent: 'text-rose-600 dark:text-rose-400' },
    { name: 'CX', desc: 'CNOT', cat: 'Quick Access', accent: 'text-indigo-600 dark:text-indigo-400' },
    { name: 'M', desc: 'Measure', cat: 'Quick Access', accent: 'text-slate-600 dark:text-slate-400' },
    { name: 'Y', desc: 'Pauli-Y', cat: 'Single Qubit', accent: 'text-emerald-600 dark:text-emerald-400' },
    { name: 'Z', desc: 'Pauli-Z', cat: 'Single Qubit', accent: 'text-amber-600 dark:text-amber-400' },
    { name: 'S', desc: 'Phase (π/2)', cat: 'Single Qubit', accent: 'text-purple-600 dark:text-purple-400' },
    { name: 'T', desc: 'π/8 (π/4)', cat: 'Single Qubit', accent: 'text-pink-600 dark:text-pink-400' },
    { name: 'Rx', desc: 'X-Rotation', cat: 'Rotations', accent: 'text-sky-600 dark:text-sky-400' },
    { name: 'CZ', desc: 'Ctrl-Phase', cat: 'Multi-Qubit', accent: 'text-blue-600 dark:text-blue-400' },
    { name: 'SWAP', desc: 'Swap', cat: 'Multi-Qubit', accent: 'text-amber-600 dark:text-amber-400' },
  ];

  return (
    <div className="space-y-12 max-w-5xl mx-auto py-6 sm:py-10 pb-20">
      {/* Header */}
      <div className="border-b border-border pb-6 space-y-2">
        <div className="text-[11px] font-mono text-brand uppercase tracking-wider font-semibold">
          Design System & Component Reference
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight">
          Scientific Editorial System
        </h1>
        <p className="text-sm text-text-secondary max-w-2xl font-normal leading-relaxed">
          Living specification of design tokens, restrained typography, quiet surfaces, and high-fidelity quantum notation standards.
        </p>
      </div>

      {/* 1. Color Foundations */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-brand" />
          <h2 className="text-base font-semibold text-text-primary">Color Foundations & Surfaces</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-canvas border border-border space-y-1">
            <span className="font-semibold text-text-primary block">Canvas</span>
            <span className="font-mono text-[10px] text-text-muted block">#F7F8FA / #0D1117</span>
            <span className="text-[11px] text-text-secondary">Root background</span>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-border space-y-1 shadow-subtle">
            <span className="font-semibold text-text-primary block">Surface</span>
            <span className="font-mono text-[10px] text-text-muted block">#FFFFFF / #131923</span>
            <span className="text-[11px] text-text-secondary">Primary cards & panels</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-secondary border border-border space-y-1">
            <span className="font-semibold text-text-primary block">Surface Secondary</span>
            <span className="font-mono text-[10px] text-text-muted block">#F9FAFB / #181F2B</span>
            <span className="text-[11px] text-text-secondary">Form controls & strips</span>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-border space-y-1 shadow-elevated">
            <span className="font-semibold text-text-primary block">Surface Elevated</span>
            <span className="font-mono text-[10px] text-text-muted block">#FFFFFF / #1E293B</span>
            <span className="text-[11px] text-text-secondary">Dialogs & popovers</span>
          </div>
        </div>

        {/* Brand & Semantic Swatches */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs pt-1">
          <div className="p-3.5 rounded-lg bg-brand text-white space-y-0.5">
            <span className="font-semibold block">Brand Primary</span>
            <span className="font-mono text-[10px] opacity-80">#3157D5 (Cobalt)</span>
          </div>
          <div className="p-3.5 rounded-lg bg-quantum-accent text-white space-y-0.5">
            <span className="font-semibold block">Quantum Accent</span>
            <span className="font-mono text-[10px] opacity-80">#6558D3 (Iris)</span>
          </div>
          <div className="p-3.5 rounded-lg bg-emerald-700 text-white space-y-0.5">
            <span className="font-semibold block">Success</span>
            <span className="font-mono text-[10px] opacity-80">#16805C</span>
          </div>
          <div className="p-3.5 rounded-lg bg-amber-600 text-white space-y-0.5">
            <span className="font-semibold block">Warning</span>
            <span className="font-mono text-[10px] opacity-80">#B86E00</span>
          </div>
          <div className="p-3.5 rounded-lg bg-rose-700 text-white space-y-0.5">
            <span className="font-semibold block">Danger</span>
            <span className="font-mono text-[10px] opacity-80">#C43D4B</span>
          </div>
        </div>
      </section>

      {/* 2. Typography Scale */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-brand" />
          <h2 className="text-base font-semibold text-text-primary">Typography & Notation Standards</h2>
        </div>

        <div className="p-6 rounded-xl bg-surface border border-border space-y-6">
          <div className="space-y-1 border-b border-border pb-4">
            <span className="text-[10px] font-mono text-text-muted uppercase">UI Heading (Inter)</span>
            <div className="text-2xl font-semibold text-text-primary tracking-tight">
              Entanglement & Quantum Correlation
            </div>
          </div>

          <div className="space-y-1 border-b border-border pb-4">
            <span className="text-[10px] font-mono text-text-muted uppercase">Body Copy (Inter 14px)</span>
            <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
              When two qubits become entangled, the state of the composite system cannot be expressed as a product of individual qubit states. Measuring one qubit instantaneously determines the outcome of the other.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono text-text-muted uppercase">Scientific Notation & Statevector (Geist Mono)</span>
            <div className="p-3 rounded-lg bg-surface-secondary border border-border font-mono text-xs space-y-1">
              <div className="text-brand font-semibold">
                |Φ⁺⟩ = (|00⟩ + |11⟩) / √2
              </div>
              <div className="text-text-muted text-[11px]">
                α = 0.707107 + 0.000000i &bull; β = 0.707107 + 0.000000i &bull; Norm: 1.000
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Component Primitives */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-text-primary">Interactive Component Primitives</h2>

        <div className="p-6 rounded-xl bg-surface border border-border space-y-6">
          {/* Buttons */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-text-muted">Buttons</span>
            <div className="flex flex-wrap items-center gap-3">
              <button className="btn btn-primary text-xs">Primary Action</button>
              <button className="btn btn-secondary text-xs">Secondary Button</button>
              <button className="btn btn-ghost text-xs">Ghost Button</button>
              <button className="btn btn-primary btn-sm text-xs">Small</button>
              <button disabled className="btn btn-primary text-xs">Disabled</button>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="space-y-2 pt-2 border-t border-border">
            <span className="text-xs font-medium text-text-muted">Status Indicators</span>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Systems ready
              </span>
              <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Degraded
              </span>
              <span className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Offline
              </span>
            </div>
          </div>

          {/* Motivating Empty State */}
          <div className="space-y-2 pt-2 border-t border-border">
            <span className="text-xs font-medium text-text-muted">Authentic Empty State</span>
            <div className="p-6 rounded-lg border border-dashed border-border bg-surface-secondary/40 text-center space-y-2 max-w-md mx-auto">
              <div className="w-8 h-8 rounded-full bg-brand-soft text-brand flex items-center justify-center mx-auto text-xs">
                Ψ
              </div>
              <span className="font-semibold text-xs text-text-primary block">
                No learning activity recorded yet
              </span>
              <p className="text-[11px] text-text-muted">
                Complete your first experiment or lesson to begin establishing verified competency evidence.
              </p>
              <button className="btn btn-secondary btn-xs text-xs mt-1">
                Explore Lessons →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Restrained Quantum Gate Palette */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">Restrained Quantum Gate Tiles</h2>
          <span className="text-xs text-text-muted">Unified taxonomy with category accents</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {gates.map(g => (
            <div
              key={g.name}
              className="p-3 rounded-lg border border-border bg-surface hover:border-brand-primary/40 transition-colors flex flex-col items-center justify-center gap-1 shadow-subtle"
            >
              <span className={`font-mono text-base font-bold ${g.accent}`}>
                {g.name}
              </span>
              <span className="text-[11px] text-text-primary font-medium">
                {g.desc}
              </span>
              <span className="text-[10px] text-text-muted font-mono">
                {g.cat}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
