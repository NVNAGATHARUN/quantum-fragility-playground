import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, PageHeader, Badge } from '../../components/UI';
import { ArrowRight, Cpu, Zap } from 'lucide-react';

const ALGORITHM_LABS = [
  {
    to: '/explore/algorithms/bell-state',
    id: 'AL-01',
    title: 'Bell State',
    emoji: '🔔',
    tagColor: 'indigo',
    difficulty: 'Beginner',
    concepts: ['Entanglement', 'CNOT', 'Superposition'],
    desc: 'Create the maximally entangled Bell pair |Φ+⟩ = (|00⟩+|11⟩)/√2. Witness perfect correlations across any measurement basis.',
    keyFact: 'Entanglement entropy = 1 bit (maximum)',
  },
  {
    to: '/explore/algorithms/deutsch-jozsa',
    id: 'AL-02',
    title: 'Deutsch-Jozsa',
    emoji: '🔀',
    tagColor: 'purple',
    difficulty: 'Intermediate',
    concepts: ['Oracle', 'Interference', 'Quantum Advantage'],
    desc: 'Determine if a function is constant or balanced using ONE oracle query. Classical deterministic: 2^(n-1)+1 queries.',
    keyFact: 'Exponential speedup over deterministic classical',
  },
  {
    to: '/explore/algorithms/grover',
    id: 'AL-03',
    title: "Grover's Search",
    emoji: '🔍',
    tagColor: 'cyan',
    difficulty: 'Intermediate',
    concepts: ['Amplitude Amplification', 'Oracle', 'Diffusion'],
    desc: 'Search an unsorted database of N items in O(√N) oracle queries. Watch amplitude amplification in real time.',
    keyFact: 'Quadratic speedup — optimal for unstructured search',
  },
  {
    to: '/explore/algorithms/teleportation',
    id: 'AL-04',
    title: 'Quantum Teleportation',
    emoji: '📡',
    tagColor: 'emerald',
    difficulty: 'Intermediate',
    concepts: ['Entanglement', 'Classical Bits', 'No-Cloning'],
    desc: 'Transmit a qubit state using a Bell pair + 2 classical bits. No FTL communication — the no-cloning theorem enforced.',
    keyFact: 'Fidelity ≥ 0.99 verified by Qiskit Aer',
  },
  {
    to: '/explore/algorithms/qft',
    id: 'AL-05',
    title: 'Quantum Fourier Transform',
    emoji: '🌊',
    tagColor: 'amber',
    difficulty: 'Advanced',
    concepts: ['Phase', 'Fourier Basis', 'Period-Finding'],
    desc: 'Map computational basis states to the Fourier basis with structured phases. The core subroutine of Shor\'s algorithm.',
    keyFact: 'O(n²) gates vs O(N log N) for classical FFT',
  },
  {
    to: '/explore/algorithms/qaoa',
    id: 'AL-06',
    title: 'QAOA Max-Cut',
    emoji: '🕸️',
    tagColor: 'amber',
    difficulty: 'Advanced',
    concepts: ['Hamiltonian Simulation', 'Variational Ansatz', 'Max-Cut'],
    desc: 'Solve NP-hard combinatorial optimization on graphs with alternating Cost and Mixer Hamiltonians.',
    keyFact: 'Approximation ratio verified via Qiskit Aer',
  },
  {
    to: '/explore/algorithms/vqe',
    id: 'AL-07',
    title: 'VQE Molecular H₂',
    emoji: '🧪',
    tagColor: 'emerald',
    difficulty: 'Advanced',
    concepts: ['Quantum Chemistry', 'Rayleigh-Ritz', 'Electron Correlation'],
    desc: 'Compute the electronic potential energy surface and ground state of H2 with chemical accuracy (< 1.6 mHa).',
    keyFact: 'Captures dynamic electron correlation beyond Hartree-Fock',
  },
  {
    to: '/explore/algorithms/qkd',
    id: 'AL-08',
    title: 'Visual QKD (BB84)',
    emoji: '🔐',
    tagColor: 'emerald',
    difficulty: 'Intermediate',
    concepts: ['Quantum Cryptography', 'No-Cloning', 'QBER Threat Modeling'],
    desc: 'Distribute secure cryptographic keys using conjugate photon bases. Detect active eavesdropping (Eve) via state collapse.',
    keyFact: 'QBER threshold 11.0% (Shor-Preskill limit)',
  },
  {
    to: '/explore/algorithms/network',
    id: 'AL-09',
    title: 'Quantum Network Repeater',
    emoji: '🌐',
    tagColor: 'indigo',
    difficulty: 'Advanced',
    concepts: ['Entanglement Swapping', 'Bell State Measurement', 'NQM'],
    desc: 'Overcome exponential fiber loss using entanglement swapping at intermediate repeater nodes. Alice and Bob share |Φ+⟩ without direct photon exchange.',
    keyFact: 'World record: 605 km fiber entanglement (Jiuquan, 2022)',
  },
];

const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
  Intermediate: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
  Advanced: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
};

const TAG_COLOR: Record<string, string> = {
  indigo:  'text-indigo-400 bg-indigo-500/15 border-indigo-500/30',
  purple:  'text-purple-400 bg-purple-500/15 border-purple-500/30',
  cyan:    'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
  emerald: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
  amber:   'text-amber-400 bg-amber-500/15 border-amber-500/30',
  rose:    'text-rose-400 bg-rose-500/15 border-rose-500/30',
};

export default function AlgorithmsIndex() {
  return (
    <div className="flex flex-col gap-32">
      <PageHeader
        title="Algorithm Laboratories"
        subtitle="Structured algorithm labs following the standard flow: Problem → Classical Intuition → Quantum Idea → Circuit → State Evolution → Simulation → Visualization → Code → Challenge."
        icon="🔮"
      />

      <div className="flex items-center gap-12 p-16 rounded-xl bg-brand-primary/5 border border-brand-primary/20 text-sm text-text-secondary">
        <Cpu className="w-5 h-5 text-brand-primary flex-shrink-0" />
        <span>Core circuit results run on <strong className="text-text-primary">Qiskit Aer</strong>. Pages that add fitted or analytical teaching models label their provenance and limitations next to the result.</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-24">
        {ALGORITHM_LABS.map((lab, i) => (
          <motion.div
            key={lab.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.08 }}
          >
            <Link to={lab.to} className="group block h-full">
              <Card className="p-24 h-full flex flex-col gap-20 hover:border-brand-primary/40 transition-all duration-300 group-hover:bg-brand-primary/5 group-hover:-translate-y-1">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-12">
                    <span className="text-3xl">{lab.emoji}</span>
                    <span className={`px-8 py-3 rounded text-[10px] font-orbitron font-bold border ${TAG_COLOR[lab.tagColor]}`}>
                      {lab.id}
                    </span>
                  </div>
                  <span className={`px-8 py-3 rounded text-[10px] font-semibold border ${DIFFICULTY_COLOR[lab.difficulty]}`}>
                    {lab.difficulty}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-text-primary mb-8 group-hover:text-brand-primary transition-colors">{lab.title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{lab.desc}</p>
                </div>

                <div className="flex flex-wrap gap-6">
                  {lab.concepts.map(c => (
                    <span key={c} className="px-8 py-3 rounded bg-surface-raised border border-brand-border text-[10px] text-text-muted font-mono">
                      {c}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-16 border-t border-brand-border flex items-center justify-between">
                  <span className="text-[10px] font-mono text-brand-cyan">{lab.keyFact}</span>
                  <ArrowRight className="w-4 h-4 text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <Card className="p-24 flex flex-col gap-12 border-dashed">
        <div className="text-xs font-orbitron text-text-muted uppercase tracking-widest">Standard Lab Flow (SRS §58)</div>
        <div className="flex items-center gap-8 flex-wrap text-xs">
          {['Problem', 'Classical Intuition', 'Quantum Idea', 'Principle', 'Circuit', 'State Evolution', 'Simulation', 'Visualization', 'Code', 'Modification', 'Challenge'].map((step, i, arr) => (
            <React.Fragment key={step}>
              <span className="text-text-primary font-medium">{step}</span>
              {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-text-muted flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </Card>
    </div>
  );
}
