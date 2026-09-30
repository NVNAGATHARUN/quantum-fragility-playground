import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Atom, Gem, Link2, Magnet, Search } from 'lucide-react';
import { Badge } from '../../components/UI';

const experiments = [
  {
    id: 'stern-gerlach',
    title: 'Stern–Gerlach',
    Icon: Magnet,
    tag: 'Particle Physics',
    desc: 'Fire silver atoms through a non-uniform magnetic field. Watch quantum spin quantization collapse superposition into two discrete, classically-impossible paths.',
    difficulty: 'Beginner',
    color: 'cyan',
    concepts: ['Spin Quantization', 'Measurement Collapse', 'Superposition']
  },
  {
    id: 'cavity-qed',
    title: 'Cavity QED',
    Icon: Gem,
    tag: 'Light-Matter',
    desc: 'Trap a single atom between two perfect mirrors with one photon. Control Rabi oscillations and witness quantum information transferring between light and matter.',
    difficulty: 'Intermediate',
    color: 'primary',
    concepts: ['Rabi Oscillations', 'Jaynes-Cummings Model', 'Decoherence']
  },
  {
    id: 'bell-state',
    title: 'Bell State',
    Icon: Link2,
    tag: 'Entanglement',
    desc: 'Create and measure a maximally entangled Bell state. Choose Alice and Bob\'s measurement angles to see correlations that defy classical physics.',
    difficulty: 'Advanced',
    color: 'gold',
    concepts: ['Entanglement', "Bell's Inequality", 'Non-locality']
  },
  {
    id: 'grover',
    title: "Grover's Search",
    Icon: Search,
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

export default function ExperimentsIndex() {
  return (
    <div className="ql-page ql-experiments-index">
      <header className="ql-experiments-hero">
        <div>
          <p className="ql-eyebrow"><Atom size={15} /> Virtual experiments</p>
          <h1>See quantum ideas<br /><em>behave.</em></h1>
          <p>Change one variable, run the model, and read the evidence. Each lab connects an abstract idea to an observable result.</p>
        </div>
        <div className="ql-experiments-hero-note">
          <strong>Four focused labs</strong>
          <span>From spin measurement to amplitude amplification.</span>
        </div>
      </header>

      <div className="ql-experiments-grid">
        {experiments.map((ex, i) => (
          <motion.div
            key={ex.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12, ease: 'easeOut' }}
            className="h-full"
          >
            <Link to={`/experiments/${ex.id}`} className="ql-experiment-entry">
              <div className="ql-experiment-entry-head">
                <span className="ql-experiment-entry-icon"><ex.Icon size={24} strokeWidth={1.6} /></span>
                <Badge color={difficultyColor[ex.difficulty] as any}>{ex.difficulty}</Badge>
              </div>
              <div>
                <span className="ql-card-kicker">{ex.tag}</span>
                <h2>{ex.title}</h2>
                <p>{ex.desc}</p>
              </div>
              <div className="ql-experiment-entry-footer">
                  <div className="ql-experiment-concepts">
                    {ex.concepts.map(c => (
                      <span key={c}>{c}</span>
                    ))}
                  </div>
                  <span className="ql-experiment-open">Open lab <ArrowRight size={16} /></span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="ql-experiment-principles">
        {[
          { label: 'Real-time Physics', desc: 'Every simulation uses physically accurate models with adjustable parameters.' },
          { label: 'Educational Overlays', desc: 'In-lab explanations guide you through the quantum principles at every step.' },
          { label: 'Interactive Controls', desc: 'Sliders, buttons and state selectors let you probe every aspect of each experiment.' },
        ].map(f => (
          <div key={f.label}>
            <strong>{f.label}</strong>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
