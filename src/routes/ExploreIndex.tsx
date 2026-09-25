import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Cpu, GitBranch, ArrowRight, ShieldCheck, Radio } from 'lucide-react';

export default function ExploreIndex() {
  const algorithms = [
    {
      slug: 'deutsch-jozsa',
      name: 'Deutsch-Jozsa Algorithm',
      category: 'Oracle Advantage',
      desc: 'Single-query deterministic evaluation of constant vs balanced functions via phase kickback.',
      to: '/explore/algorithms/deutsch-jozsa',
    },
    {
      slug: 'grover',
      name: "Grover's Search Algorithm",
      category: 'Search & Amplification',
      desc: 'Quadratic speedup for unstructured search using geometric oracle and diffusion reflections.',
      to: '/explore/algorithms/grover',
    },
    {
      slug: 'teleportation',
      name: 'Quantum Teleportation',
      category: 'Protocols',
      desc: 'Disembodied state transfer using shared entanglement and classical feed-forward bits.',
      to: '/explore/algorithms/teleportation',
    },
    {
      slug: 'qft',
      name: 'Quantum Fourier Transform',
      category: 'Transforms',
      desc: 'Frequency domain phase preparation subroutine powering Shor’s factoring and phase estimation.',
      to: '/explore/algorithms/qft',
    },
    {
      slug: 'qaoa',
      name: 'QAOA (Approximate Optimization)',
      category: 'Variational / NP-Hard',
      desc: 'Max-Cut graph solver using alternating Cost and Transverse Mixer unitary Hamiltonians.',
      to: '/explore/algorithms/qaoa',
    },
    {
      slug: 'vqe',
      name: 'VQE (Variational Quantum Eigensolver)',
      category: 'Chemistry / Simulation',
      desc: 'Calculate molecular potential energy surfaces and ground state of H2 with chemical accuracy.',
      to: '/explore/algorithms/vqe',
    },
    {
      slug: 'qkd',
      name: 'BB84 Quantum Key Distribution',
      category: 'Cryptography',
      desc: 'Information-theoretically secure key exchange verified against eavesdroppers via state collapse.',
      to: '/explore/algorithms/qkd',
    },
    {
      slug: 'network',
      name: 'Quantum Network Repeater',
      category: 'Networks',
      desc: 'Long-haul entanglement swapping across intermediate Bell State Measurement repeaters.',
      to: '/explore/algorithms/network',
    },
    {
      slug: 'bell-state',
      name: 'Bell State Synthesis',
      category: 'Foundational',
      desc: 'Maximal entanglement verification, subsystem purity, and CHSH inequality tests.',
      to: '/explore/algorithms/bell-state',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-10 space-y-12">
      {/* Header */}
      <div className="space-y-2 border-b border-border pb-6">
        <div className="text-[11px] font-mono uppercase tracking-wider text-brand font-semibold">
          Scientific Exploration
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight">
          Algorithms & Physical Hardware
        </h1>
        <p className="text-sm text-text-secondary max-w-2xl font-normal leading-relaxed">
          Examine verified quantum algorithms step-by-step and inspect the physical architecture of superconducting quantum processors.
        </p>
      </div>

      {/* 1. Hardware Explorer Banner */}
      <section className="p-6 sm:p-8 rounded-xl bg-surface border border-border shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-soft text-brand text-[11px] font-medium">
            <Cpu className="w-3 h-3" />
            <span>3D Interactive Cryostat</span>
          </div>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">
            Inside a Quantum Computer
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Tour a dilution refrigerator across temperature stages from room temperature (300K) down to the 15 millikelvin mixing chamber where qubits reside.
          </p>
        </div>
        <Link
          to="/explore/hardware"
          className="btn btn-primary px-5 py-2.5 text-sm shrink-0"
        >
          <span>Explore Cryostat</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </section>

      {/* 2. Algorithms Grid */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary tracking-tight">
            Standard Quantum Algorithms
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Step through statevector transformations and interference patterns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {algorithms.map(algo => (
            <div
              key={algo.slug}
              className="p-5 rounded-xl border border-border bg-surface hover:border-brand-primary/40 transition-colors flex flex-col justify-between space-y-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-text-primary">
                    {algo.name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-secondary text-text-muted border border-border">
                    {algo.category}
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {algo.desc}
                </p>
              </div>

              <Link
                to={algo.to}
                className="btn btn-secondary btn-sm text-xs self-start"
              >
                <span>Launch Algorithm</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
