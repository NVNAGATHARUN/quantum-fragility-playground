import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, SectionHeader, Badge, Card as UI_Card } from '../components/UI';
import BlochSphere3D from '../components/BlochSphere3D';
import { PRESET_VECTORS } from '../types/quantum';

const modules = [
  { to: '/fragility-lab', icon: '🧪', title: 'Fragility Lab', desc: 'Interact with 4 core noise channels and observe decoherence in real-time with 3D visuals and live graphs.', tags: ['Featured', 'Laboratory'] },
  { to: '/quantum-vs-classical', icon: '⚖️', title: 'Q vs C', desc: 'Compare the stability of classical bits against the fragility of quantum qubits under identical noise.', tags: ['Comparison'] },
  { to: '/gate-builder', icon: '🔧', title: 'Gate Builder', desc: 'Drag-and-drop gates to build circuits and watch the Bloch vector rotate through transformations.', tags: ['Builder'] },
  { to: '/experiments', icon: '🔬', title: 'Experiments', desc: 'Run Stern-Gerlach, Bell State, and Cavity QED on our virtual quantum backend.', tags: ['Academic'] },
  { to: '/qiskit-visualizer', icon: '📊', title: 'Visualizers', desc: 'Visualize Qiskit and QASM circuit outputs with step-by-step state evolution.', tags: ['Visualization'] },
  { to: '/learn', icon: '📚', title: 'Learn', desc: 'New to Quantum? Follow our course and test your knowledge with interactive quizzes.', tags: ['Education'] },
];

const stats = [
  { v: '4', label: 'Noise Channels' },
  { v: '5', label: 'Quantum Gates' },
  { v: '3', label: 'Experiments' },
];

const HeroParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = 600;

    const particles: { x: number; y: number; r: number; vx: number; vy: number; alpha: number }[] = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }

    let raf: number;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width; if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height; if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${p.alpha})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
    };
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1), transparent)' }} />;
};

const MiniFragilityDemo = () => {
  const [state, setState] = useState(PRESET_VECTORS.plus);
  const [health, setHealth] = useState(100);
  const [history, setHistory] = useState<any[]>([]);
  const cycleRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      cycleRef.current += 1;

      // Every 8 seconds (80 steps * 100ms)
      if (cycleRef.current >= 80) {
        cycleRef.current = 0;
        setState(PRESET_VECTORS.plus);
        setHealth(100);
        setHistory([]);
      } else {
        // Simple decoherence math
        setState(prev => ({
          x: prev.x * 0.96,
          y: prev.y * 0.96,
          z: prev.z * 0.96 + (1 - 0.96) * 0.2, // Drifts slightly toward Z
        }));
        setHealth(prev => prev * 0.97);
        setHistory(prev => [...prev, state].slice(-20));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [state]);

  return (
    <div className="w-full h-full relative p-8">
      <BlochSphere3D state={state} health={health} history={history} className="!min-h-[300px]" />
      <div className="absolute bottom-16 right-16 z-10 flex flex-col items-end">
        <div className="text-[10px] font-mono text-brand-primary">AUTO-DECOHERENCE</div>
        <div className="text-[8px] font-mono text-text-muted">RESETS EVERY 8s</div>
      </div>
    </div>
  );
};

const Home = () => {
  return (
    <div className="flex flex-col gap-64 pb-64">
      {/* Hero Section */}
      <section className="relative min-h-[500px] flex flex-col items-center justify-center text-center overflow-hidden -mt-32">
        <HeroParticles />
        <div className="relative z-10 pt-64 flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[clamp(32px,8vw,80px)] leading-[1.1] mb-24 max-w-4xl pt-64"
          >
            Quantum <span className="gradient-text">Fragility</span> Playground
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-text-secondary text-lg md:text-xl max-w-2xl mb-40 px-24"
          >
            A high-fidelity virtual lab for exploring the delicate nature of quantum bits.
            Observe decoherence, master quantum gates, and build the future.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-16 px-24"
          >
            <Link to="/fragility-lab" className="btn btn-primary !px-32 !py-12 text-sm">
              Start Fragility Lab
            </Link>
            <Link to="/experiments" className="btn btn-secondary !px-32 !py-12 text-sm">
              Run Experiments
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mt-64 flex gap-40"
          >
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-2xl font-orbitron font-bold text-text-primary">{s.v}</span>
                <span className="text-[10px] text-text-muted uppercase tracking-wider">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-48 items-center">
          <div>
            <Badge color="purple">The Science</Badge>
            <h2 className="text-3xl md:text-4xl mt-16 mb-24">What is quantum fragility?</h2>
            <div className="flex flex-col gap-16 text-text-secondary leading-relaxed">
              <p>
                Unlike classical bits that are robustly 0 or 1, qubits are extremely delicate.
                Interaction with the environment causes <strong>decoherence</strong>, where quantum
                superposition and entanglement are lost to thermal noise and background radiation.
              </p>
              <p>
                In this playground, you can simulate these exact noise channels—depolarizing,
                amplitude damping, and dephasing—to see how they shrink the Bloch vector
                and destroy quantum information.
              </p>
              <div className="pt-16">
                <Link to="/learn" className="text-brand-primary hover:text-brand-cyan text-sm font-semibold flex items-center gap-8">
                  Learn more about the physics <span className="text-lg">→</span>
                </Link>
              </div>
            </div>
          </div>
          <div className="glass-card overflow-hidden">
            <MiniFragilityDemo />
          </div>
        </div>
      </section>

      {/* Module Grid */}
      <section className="section-container -mt-40">
        <SectionHeader
          title="Explore the Playground"
          subtitle="Navigate through our specialized modules designed to take you from a curious student to a quantum pioneer."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-24">
          {modules.map((m, i) => (
            <motion.div
              key={m.to}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link to={m.to}>
                <Card className="p-24 h-full flex flex-col group glow-border">
                  <div className="text-4xl mb-16 transition-transform group-hover:scale-110 duration-300">{m.icon}</div>
                  <h3 className="text-lg mb-8 group-hover:text-brand-primary transition-colors">{m.title}</h3>
                  <p className="text-text-secondary text-sm mb-24 flex-1">{m.desc}</p>
                  <div className="flex flex-wrap gap-8 mt-auto">
                    {m.tags.map(t => (
                      <Badge key={t} color="primary">{t}</Badge>
                    ))}
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
