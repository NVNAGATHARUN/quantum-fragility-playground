import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, PageHeader, Badge } from '../../components/UI';

const experiments = [
  {
    id: 'stern-gerlach',
    title: 'Stern–Gerlach',
    icon: '🧲',
    tag: 'Particle Physics',
    desc: 'Fire silver atoms through a non-uniform magnetic field. Watch quantum spin quantization collapse superposition into two discrete, classically-impossible paths.',
    difficulty: 'Beginner',
    color: 'cyan',
    concepts: ['Spin Quantization', 'Measurement Collapse', 'Superposition']
  },
  {
    id: 'cavity-qed',
    title: 'Cavity QED',
    icon: '💎',
    tag: 'Light-Matter',
    desc: 'Trap a single atom between two perfect mirrors with one photon. Control Rabi oscillations and witness quantum information transferring between light and matter.',
    difficulty: 'Intermediate',
    color: 'primary',
    concepts: ['Rabi Oscillations', 'Jaynes-Cummings Model', 'Decoherence']
  },
  {
    id: 'bell-state',
    title: 'Bell State',
    icon: '🔔',
    tag: 'Entanglement',
    desc: 'Create and measure a maximally entangled Bell state. Choose Alice and Bob\'s measurement angles to see correlations that defy classical physics.',
    difficulty: 'Advanced',
    color: 'gold',
    concepts: ['Entanglement', "Bell's Inequality", 'Non-locality']
  },
  {
    id: 'grover',
    title: "Grover's Search",
    icon: '🔍',
    tag: 'Quantum Algorithm',
    desc: 'Watch amplitude amplification in action. Configure a 2–4 qubit search space, pick your target state, and see how the Oracle + Diffusion operator geometrically rotates the state toward the answer in √N steps — not brute force.',
    difficulty: 'Intermediate',
    color: 'purple',
    concepts: ['Amplitude Amplification', 'Quadratic Speedup', 'Misconception M06']
  },
];

const difficultyColor: Record<string, string> = {
  Beginner: 'cyan',
  Intermediate: 'primary',
  Advanced: 'gold',
  purple: 'purple',
};

const cardGradient: Record<string, string> = {
  cyan: 'rgba(34,211,238,0.08)',
  gold: 'rgba(251,191,36,0.08)',
  primary: 'rgba(99,102,241,0.08)',
  purple: 'rgba(167,139,250,0.08)',
};

export default function ExperimentsIndex() {
  return (
    <div className="flex flex-col gap-48">
      <PageHeader
        title="Virtual Quantum Labs"
        subtitle="Four foundational quantum experiments. Each lab features real-time Qiskit-verified physics simulation, interactive controls, and guided educational commentary."
        icon="⚗️"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-32">
        {experiments.map((ex, i) => (
          <motion.div
            key={ex.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12, ease: 'easeOut' }}
            className="h-full"
          >
            <Link to={`/experiments/${ex.id}`} className="h-full block">
              <Card className="p-0 h-full flex flex-col group overflow-hidden hover:border-brand-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-brand-primary/10">
                {/* Card Header */}
                <div className={`p-32 flex flex-col gap-16 relative overflow-hidden`}
                  style={{
                    background: `radial-gradient(ellipse at top left, ${cardGradient[ex.color] ?? 'rgba(99,102,241,0.08)'} 0%, transparent 70%)`
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="text-5xl group-hover:scale-110 transition-transform duration-300 origin-left">{ex.icon}</div>
                    <Badge color={difficultyColor[ex.difficulty] as any}>{ex.difficulty}</Badge>
                  </div>
                  <div>
                    <div className="text-[11px] font-mono text-brand-cyan uppercase tracking-widest mb-6 font-semibold">{ex.tag}</div>
                    <h3 className="text-2xl font-orbitron font-bold text-white group-hover:text-brand-cyan transition-colors">{ex.title}</h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-32 pb-32 flex flex-col gap-24 flex-1">
                  <p className="text-slate-300 text-sm leading-relaxed flex-1">{ex.desc}</p>

                  <div className="flex flex-wrap gap-8">
                    {ex.concepts.map(c => (
                      <span key={c} className="text-[10px] font-mono font-medium px-10 py-4 rounded-md bg-brand-primary/10 border border-brand-primary/20 text-slate-200">
                        {c}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-8 text-brand-cyan text-xs font-orbitron font-bold tracking-wider group-hover:text-brand-primary group-hover:gap-12 transition-all pt-12 border-t border-brand-border/50">
                    LAUNCH EXPERIMENT
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                    >→</motion.span>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Bottom Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-24">
        {[
          { label: 'Real-time Physics', desc: 'Every simulation uses physically accurate models with adjustable parameters.' },
          { label: 'Educational Overlays', desc: 'In-lab explanations guide you through the quantum principles at every step.' },
          { label: 'Interactive Controls', desc: 'Sliders, buttons and state selectors let you probe every aspect of each experiment.' },
        ].map(f => (
          <div key={f.label} className="flex flex-col gap-8 p-20 rounded-2xl border border-brand-border bg-surface hover:border-brand-border-hover transition-colors">
            <div className="text-xs font-orbitron font-bold text-brand-cyan uppercase tracking-widest">{f.label}</div>
            <p className="text-xs text-slate-300 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
