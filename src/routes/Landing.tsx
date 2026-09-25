import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, BookOpen, FlaskConical, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Landing() {
  return (
    <div className="max-w-4xl mx-auto py-12 sm:py-16 px-4 space-y-20">
      {/* Editorial Hero */}
      <section className="space-y-6 pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-soft text-brand text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Quantum Computing</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-text-primary leading-[1.12]">
          Understand quantum by experimenting with it.
        </h1>

        <p className="text-lg sm:text-xl text-text-secondary max-w-2xl font-normal leading-relaxed">
          Predict what will happen. Build the circuit. See the state evolve in real time. Understand the physics behind every outcome.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            to="/app/home"
            className="btn btn-primary px-5 py-2.5 text-sm rounded-lg"
          >
            <span>Start Learning</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
          <Link
            to="/labs/studio"
            className="btn btn-secondary px-5 py-2.5 text-sm rounded-lg"
          >
            <FlaskConical className="w-4 h-4 mr-1 text-text-muted" />
            <span>Open Circuit Studio</span>
          </Link>
        </div>
      </section>

      {/* Editorial Principle Strip */}
      <section className="border-t border-border pt-12">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-8">
          How Quantum Lens Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2.5">
            <div className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-surface-secondary border border-border text-center text-xs leading-5 font-mono text-text-muted">
                1
              </span>
              <span>Predict Before Running</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Form an intuition before observing the result. Actively predicting outcomes isolates misconceptions before they take root.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-surface-secondary border border-border text-center text-xs leading-5 font-mono text-text-muted">
                2
              </span>
              <span>Verified Quantum Simulation</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Every circuit is evaluated against verified quantum statevectors and density matrices, powered by Qiskit Aer.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-surface-secondary border border-border text-center text-xs leading-5 font-mono text-text-muted">
                3
              </span>
              <span>Multi-Lens Visualization</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Observe state evolution across Statevector, Probability, Bloch Sphere, and Bipartite Correlation representations simultaneously.
            </p>
          </div>
        </div>
      </section>

      {/* Curriculum Snapshot */}
      <section className="border-t border-border pt-12 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary tracking-tight">
              Curriculum & Guided Labs
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              From individual qubit mechanics to multi-qubit algorithms and realistic quantum noise.
            </p>
          </div>
          <Link to="/learn" className="text-xs font-medium text-brand hover:underline flex items-center gap-1">
            <span>View Syllabus</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-border border border-border rounded-lg bg-surface">
          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-text-muted block">Module 01–02</span>
              <span className="text-sm font-medium text-text-primary block mt-0.5">
                Qubits, Superposition & Measurement
              </span>
            </div>
            <Link to="/learn" className="btn btn-ghost btn-sm text-xs">
              Explore →
            </Link>
          </div>
          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-text-muted block">Module 03–04</span>
              <span className="text-sm font-medium text-text-primary block mt-0.5">
                Quantum Logic Gates & Phase Interference
              </span>
            </div>
            <Link to="/learn" className="btn btn-ghost btn-sm text-xs">
              Explore →
            </Link>
          </div>
          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-text-muted block">Module 05</span>
              <span className="text-sm font-medium text-text-primary block mt-0.5">
                Entanglement & Bell States
              </span>
            </div>
            <Link to="/learn" className="btn btn-ghost btn-sm text-xs">
              Explore →
            </Link>
          </div>
          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-text-muted block">Module 06–08</span>
              <span className="text-sm font-medium text-text-primary block mt-0.5">
                Quantum Algorithms & Physical Cryostats
              </span>
            </div>
            <Link to="/learn" className="btn btn-ghost btn-sm text-xs">
              Explore →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
