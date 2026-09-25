import React from 'react';
import { Link } from 'react-router-dom';
import {
  FlaskConical,
  Zap,
  Layers,
  ArrowRight,
  Code2,
  CheckCircle2,
  Activity,
  Award
} from 'lucide-react';

export default function LabsIndex() {
  const guidedExperiments = [
    {
      id: 'qubit-bloch',
      title: 'Qubit & Bloch Sphere',
      desc: 'Visualize quantum state coordinates and geometric rotations on the Bloch sphere.',
      to: '/labs/studio',
      badge: 'Interactive',
    },
    {
      id: 'superposition',
      title: 'Superposition',
      desc: 'Apply Hadamard transformations and understand non-deterministic amplitudes.',
      to: '/labs/guided/superposition',
      badge: 'Guided Lab',
    },
    {
      id: 'phase-interference',
      title: 'Phase & Interference',
      desc: 'Observe constructive and destructive cancellation in Mach-Zehnder sequences.',
      to: '/labs/guided/phase',
      badge: 'Guided Lab',
    },
    {
      id: 'measurement',
      title: 'Measurement & Collapse',
      desc: 'Explore Born rule probabilities and irreversible projection onto eigenbases.',
      to: '/labs/guided/measurement',
      badge: 'Guided Lab',
    },
    {
      id: 'bell-state',
      title: 'Bell State & Entanglement',
      desc: 'Synthesize EPR pairs and examine non-local bipartite quantum correlations.',
      to: '/labs/guided/bell-state',
      badge: 'Guided Lab',
    },
  ];

  const challengeCategories = [
    { name: 'Build', desc: 'Synthesize specified target unitary statevectors' },
    { name: 'Predict', desc: 'Forecast measurement distributions before simulation' },
    { name: 'Debug', desc: 'Identify and fix faulty gate sequences in quantum circuits' },
    { name: 'Code', desc: 'Implement algorithms directly in OpenQASM 3 / Qiskit' },
    { name: 'Optimize', desc: 'Reduce two-qubit gate count and circuit depth' },
  ];

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-10 space-y-12">
      {/* Editorial Header */}
      <div className="space-y-2 border-b border-border pb-6">
        <div className="text-[11px] font-mono uppercase tracking-wider text-brand font-semibold">
          Experimental Environments
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight">
          Virtual Quantum Laboratories
        </h1>
        <p className="text-sm text-text-secondary max-w-2xl font-normal leading-relaxed">
          Design circuits, observe exact quantum state evolution, simulate real environmental decoherence, and test your intuition with guided challenges.
        </p>
      </div>

      {/* 1. Flagship Workspace: Circuit Studio */}
      <section className="p-6 sm:p-8 rounded-xl bg-surface border border-border shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-soft text-brand text-[11px] font-medium">
            <FlaskConical className="w-3 h-3" />
            <span>Flagship Workspace</span>
          </div>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">
            Circuit Studio
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Drag-and-drop quantum circuit composer with real-time statevector, density matrix, and probability inspection backed by the Qiskit Aer simulation engine.
          </p>
        </div>
        <Link
          to="/labs/studio"
          className="btn btn-primary px-5 py-2.5 text-sm shrink-0"
        >
          <span>Open Circuit Studio</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </section>

      {/* 2. Guided Experiments */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary tracking-tight">
            Guided Experiments
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Step-by-step interactive explorations targeting key conceptual milestones.
          </p>
        </div>

        <div className="divide-y divide-border border border-border rounded-xl bg-surface overflow-hidden">
          {guidedExperiments.map(exp => (
            <div
              key={exp.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-secondary/50 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-text-primary">
                    {exp.title}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-secondary text-text-muted border border-border">
                    {exp.badge}
                  </span>
                </div>
                <p className="text-xs text-text-secondary max-w-2xl">
                  {exp.desc}
                </p>
              </div>

              <Link
                to={exp.to}
                className="btn btn-secondary btn-sm shrink-0 self-start sm:self-auto text-xs"
              >
                <span>Launch Lab</span>
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Quantum Fragility Lab */}
      <section className="p-6 rounded-xl bg-surface border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-medium">
            <Zap className="w-3 h-3" />
            <span>Decoherence & Noise</span>
          </div>
          <h2 className="text-lg font-semibold text-text-primary tracking-tight">
            Quantum Fragility Lab
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Model physical environmental noise channels using Kraus operators. Scrub through time to observe T1 thermal relaxation, T2 dephasing, and fidelity decay.
          </p>
        </div>
        <Link
          to="/labs/fragility"
          className="btn btn-secondary px-4 py-2 text-xs shrink-0"
        >
          <span>Open Fragility Lab</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </section>

      {/* 4. Challenges Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary tracking-tight">
              Circuit Challenges
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Test your quantum programming skills against automated verification testbenches.
            </p>
          </div>
          <Link
            to="/labs/challenges"
            className="btn btn-secondary btn-sm text-xs hidden sm:flex items-center gap-1.5"
          >
            <span>Open All Challenges</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {challengeCategories.map(cat => (
            <Link
              key={cat.name}
              to="/labs/challenges"
              className="group p-4 rounded-lg border border-border bg-surface hover:border-brand-primary/40 hover:bg-surface-secondary/40 transition-all space-y-1.5 block cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-text-primary group-hover:text-brand-primary transition-colors">
                  {cat.name}
                </span>
                <ArrowRight className="w-3 h-3 text-text-muted group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                {cat.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
