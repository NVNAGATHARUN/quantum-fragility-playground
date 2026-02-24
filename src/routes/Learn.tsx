import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, PageHeader, SectionHeader, Badge, InfoBox } from '../components/UI';
import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    id: 'bloch-sphere',
    title: 'The Bloch Sphere',
    icon: '🌐',
    content: 'The Bloch sphere is a geometric representation of the state space of a single-qubit quantum mechanical system. It is named after the physicist Felix Bloch.',
    details: [
      'North pole: |0⟩ ground state',
      'South pole: |1⟩ excited state',
      'Surface: Pure states (coherent superpositions)',
      'Interior: Mixed states (decohered states)'
    ],
    formula: '|ψ⟩ = cos(θ/2)|0⟩ + e^{iφ}sin(θ/2)|1⟩',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Bloch_sphere.svg/1024px-Bloch_sphere.svg.png' // For demonstration
  },
  {
    id: 'decoherence',
    title: 'Quantum Decoherence',
    icon: '📉',
    content: 'Decoherence is the process where a quantum system loses its quantum properties, such as superposition or entanglement, by interacting with its environment.',
    details: [
      'Amplitude Damping (T₁): Energy relaxation toward ground state.',
      'Phase Damping (T₂): Random phase shifts destroy interference.',
      'Depolarizing: Random errors in any direction.'
    ]
  },
  {
    id: 'entanglement',
    title: 'Entanglement',
    icon: '🔗',
    content: 'Entanglement is a phenomenon where two or more particles become connected in such a way that the state of one is instantly determined by the state of the other.',
    details: [
      'Bell States: Maximally entangled 2-qubit states.',
      'Quantum Teleportation: Using entanglement to transmit states.',
      'Correlation: Measuring one qubit collapses the entire system.'
    ]
  },
  {
    id: 'algorithms',
    title: 'Quantum Algorithms',
    icon: '🔮',
    content: 'Quantum computers use interference and entanglement to perform certain calculations exponentially faster than classical computers.',
    details: [
      'Grover: Searching unsorted databases in √N steps.',
      'Shor: Factoring large integers for cryptography.'
    ]
  }
];

const QUIZ = [
  { q: 'A qubit on the Bloch sphere surface (|r| = 1) has what purity?', opts: ['0.5 (maximally mixed)', '1.0 (pure state)', '0.0 (classical)', '0.75 (partial)'], ans: 1 },
  { q: 'Which noise channel leaves the z-component unchanged, shrinking only x and y?', opts: ['Depolarizing', 'Amplitude damping (T₁)', 'Dephasing (T₂)', 'Phase flip'], ans: 2 },
  { q: "In BB84, Eve's presence causes an error rate of approximately:", opts: ['0% (Eve is undetectable)', '~12.5%', '~25%', '~50%'], ans: 2 },
];

const Learn = () => {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.5 }
    );

    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 100,
        behavior: 'smooth'
      });
    }
  };

  const answer = (qi: number, oi: number) => {
    if (qi in answers) return;
    setAnswers(prev => ({ ...prev, [qi]: oi }));
  };

  const score = QUIZ.filter((q, i) => answers[i] === q.ans).length;

  return (
    <div className="flex flex-col gap-32">
      <PageHeader
        title="Quantum Education"
        subtitle="Master the fundamentals of quantum mechanics, decoherence, and algorithms through visual learning."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-48 items-start">
        {/* Sticky Sidebar */}
        <aside className="hidden lg:block sticky top-80">
          <div className="flex flex-col gap-8 pb-32 border-b border-brand-border mb-32">
            <SectionHeader title="Contents" />
            <nav className="flex flex-col gap-4">
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => scrollToSection(s.id)}
                  className={`text-left px-12 py-8 rounded-lg text-sm transition-all border ${activeSection === s.id ? 'bg-brand-primary/10 border-brand-primary text-brand-primary font-bold' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                >
                  {s.title}
                </button>
              ))}
              <button
                onClick={() => scrollToSection('quiz')}
                className={`text-left px-12 py-8 rounded-lg text-sm transition-all border ${activeSection === 'quiz' ? 'bg-brand-gold/10 border-brand-gold text-brand-gold font-bold' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
              >
                Quick Quiz
              </button>
            </nav>
          </div>

          <InfoBox label="Academy Tip" className="mt-8 opacity-60">
            Try the <strong>Fragility Lab</strong> alongside these sections to see the physics in action.
          </InfoBox>
        </aside>

        {/* Main Content */}
        <div className="flex flex-col gap-64">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-80">
              <Card className="p-32 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-32 text-6xl opacity-[0.03] select-none pointer-events-none">{s.icon}</div>

                <div className="flex items-center gap-16 mb-24">
                  <div className="w-48 h-48 rounded-xl bg-brand-primary/10 flex items-center justify-center text-2xl">{s.icon}</div>
                  <h2 className="text-2xl font-orbitron gradient-text">{s.title}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-32">
                  <div className="flex flex-col gap-24">
                    <p className="text-text-secondary leading-relaxed text-lg">
                      {s.content}
                    </p>

                    <div className="flex flex-col gap-12">
                      <h4 className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Key Principles</h4>
                      <ul className="flex flex-col gap-8">
                        {s.details.map((d, i) => (
                          <li key={i} className="flex items-start gap-12 text-sm text-text-secondary">
                            <span className="text-brand-primary mt-4">•</span>
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {s.formula && (
                      <div className="mt-16 p-16 rounded-xl bg-background border border-brand-border font-mono text-sm text-brand-cyan overflow-x-auto">
                        {s.formula}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-16">
                    <div className="aspect-square rounded-xl bg-brand-border/20 border border-brand-border flex items-center justify-center text-4xl opacity-50 relative pointer-events-none overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent" />
                      {s.icon}
                    </div>
                    <Link to="/fragility-lab" className="btn btn-secondary !py-8 text-[10px] w-full">Open Lab Demo →</Link>
                  </div>
                </div>
              </Card>
            </section>
          ))}

          {/* Quiz Section */}
          <section id="quiz" className="scroll-mt-80">
            <Card className="p-32 border-brand-gold/30">
              <div className="flex justify-between items-start mb-32">
                <div>
                  <Badge color="gold">Test Knowledge</Badge>
                  <h2 className="text-2xl font-orbitron mt-8">Quick Quiz</h2>
                </div>
                {Object.keys(answers).length === QUIZ.length && (
                  <div className="text-2xl font-orbitron text-brand-gold">{score} / {QUIZ.length}</div>
                )}
              </div>

              <div className="flex flex-col gap-24">
                {QUIZ.map((q, qi) => (
                  <div key={qi} className="flex flex-col gap-12">
                    <div className="text-sm font-semibold">{qi + 1}. {q.q}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {q.opts.map((opt, oi) => {
                        const picked = answers[qi] === oi;
                        const answered = qi in answers;
                        const isCorrect = oi === q.ans;

                        let stateClass = 'border-brand-border hover:border-brand-primary/40 text-text-secondary';
                        if (answered) {
                          if (isCorrect) stateClass = 'border-brand-green bg-brand-green/10 text-brand-green';
                          else if (picked) stateClass = 'border-brand-red bg-brand-red/10 text-brand-red';
                          else stateClass = 'border-brand-border text-text-muted opacity-50';
                        }

                        return (
                          <button
                            key={oi}
                            onClick={() => answer(qi, oi)}
                            className={`p-12 text-left text-xs rounded-xl border transition-all ${stateClass}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <AnimatePresence>
                {Object.keys(answers).length === QUIZ.length && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-32 p-24 rounded-2xl bg-brand-gold/5 border border-brand-gold/20 text-center"
                  >
                    <h3 className="text-xl mb-8 font-orbitron text-brand-gold">
                      {score === QUIZ.length ? 'Perfect Score! 🌟' : score >= 2 ? 'Great Job!' : 'Keep Learning!'}
                    </h3>
                    <p className="text-text-secondary text-sm mb-16">
                      {score === QUIZ.length
                        ? 'You have a solid grasp of quantum fragility fundamentals.'
                        : 'Review the sections above to master the concepts you missed.'}
                    </p>
                    <button onClick={() => setAnswers({})} className="btn btn-secondary !py-8 text-[10px]">Retry Quiz</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Learn;
