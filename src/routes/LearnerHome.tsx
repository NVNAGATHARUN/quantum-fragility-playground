import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Terminal,
  FlaskConical,
  Cpu,
  Atom,
  Shield,
  Network,
  ChevronRight,
  Sparkles,
  Activity,
  BookOpen,
  CheckCircle2,
  Layers,
  Play,
  Zap,
  Search,
  Sliders,
} from 'lucide-react';
import BlochSphere3D from '../components/BlochSphere3D';

const HeroParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const particles: {
      x: number;
      y: number;
      r: number;
      vx: number;
      vy: number;
      alpha: number;
      color: string;
    }[] = [];
    const colors = ['#6366F1', '#22D3EE', '#A855F7', '#38BDF8'];
    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2 + 0.6,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        alpha: Math.random() * 0.45 + 0.15,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let raf: number;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;
      raf = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.7, zIndex: 1 }}
    />
  );
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.23, 1, 0.32, 1] },
  }),
};
const stagger = { visible: { transition: { staggerChildren: 0.07 } } };

const LAB_CARDS = [
  {
    id: 'fragility',
    tag: 'LAB_01',
    title: 'Fragility Lab',
    desc: 'Real-time 3D Bloch decoherence with 4 physical Kraus noise channels, Lindblad bounds, and time machine scrubbing.',
    to: '/labs/fragility',
    cta: 'Inject Noise',
    accent: '#F43F5E',
    glow: 'rgba(244,63,94,0.22)',
    icon: <FlaskConical className="w-5 h-5" />,
    metric: 'T₂ ≤ 2T₁',
    metricLabel: 'Lindblad Enforced',
  },
  {
    id: 'studio',
    tag: 'LAB_02',
    title: 'Circuit Studio',
    desc: 'Interactive quantum circuit composer with step-by-step statevector transformations, matrix math, and code export.',
    to: '/labs/studio',
    cta: 'Launch Studio',
    accent: '#22D3EE',
    glow: 'rgba(34,211,238,0.22)',
    icon: <Terminal className="w-5 h-5" />,
    metric: '32 Qubits',
    metricLabel: 'Aer Kernel',
  },
  {
    id: 'conflict',
    tag: 'LAB_03',
    title: 'Cognitive Conflict Lab',
    desc: 'Predict-Observe-Explain pedagogy actively shattering quantum misconceptions (H²=I, No-Signaling, Mixture Trap).',
    to: '/labs/conflict',
    cta: 'Test Intuition',
    accent: '#F59E0B',
    glow: 'rgba(245,158,11,0.22)',
    icon: <Zap className="w-5 h-5" />,
    metric: 'M01–M08',
    metricLabel: 'Misconceptions',
  },
  {
    id: 'q-vs-c',
    tag: 'LAB_04',
    title: 'Quantum vs Classical',
    desc: 'Side-by-side decay experiment proving why classical bits resist environmental noise while qubits decay.',
    to: '/quantum-vs-classical',
    cta: 'Compare Bits',
    accent: '#10B981',
    glow: 'rgba(16,185,129,0.22)',
    icon: <Activity className="w-5 h-5" />,
    metric: '0/1 vs |ψ⟩',
    metricLabel: 'Noise Resistance',
  },
  {
    id: 'hardware',
    tag: 'LAB_05',
    title: '3D Cryostat Explorer',
    desc: 'Interactive dilution refrigerator with 300K → 15mK thermal stages and DRAG microwave pulse synthesizer.',
    to: '/explore/hardware',
    cta: 'Explore Cryostat',
    accent: '#8B5CF6',
    glow: 'rgba(139,92,246,0.22)',
    icon: <Cpu className="w-5 h-5" />,
    metric: '15 mK',
    metricLabel: 'QPU Base Temp',
  },
  {
    id: 'sim-guide',
    tag: 'LAB_06',
    title: 'Simulation Guide',
    desc: 'Comprehensive visual curriculum on quantum mechanics, Hilbert spaces, and open quantum systems.',
    to: '/learning-by-simulation',
    cta: 'Read Guide',
    accent: '#3B82F6',
    glow: 'rgba(59,130,246,0.22)',
    icon: <BookOpen className="w-5 h-5" />,
    metric: '8 Modules',
    metricLabel: 'Foundations',
  },
];

const EXPERIMENT_CARDS = [
  {
    title: 'Stern–Gerlach Experiment',
    desc: 'Spatial spin quantization of silver atoms through an inhomogeneous magnetic gradient field.',
    to: '/explore/experiments/stern-gerlach',
    icon: <Atom className="w-5 h-5 text-amber-400" />,
    tag: 'Fundamental Physics',
    accent: '#F59E0B',
  },
  {
    title: 'Bell State & CHSH Test',
    desc: 'Generate 2-qubit maximally entangled pairs and test Bell inequality violation S = 2.828 > 2.',
    to: '/explore/experiments/bell-state',
    icon: <Activity className="w-5 h-5 text-purple-400" />,
    tag: 'Quantum Nonlocality',
    accent: '#A855F7',
  },
  {
    title: 'Cavity QED (Jaynes-Cummings)',
    desc: 'Simulate strong atom-photon dipole coupling inside an optical Fabry-Pérot cavity resonator.',
    to: '/explore/experiments/cavity-qed',
    icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
    tag: 'Quantum Optics',
    accent: '#06B6D4',
  },
  {
    title: "Grover's Search Algorithm",
    desc: 'Quadratic speedup search simulating oracle inversion and diffusion operator amplification.',
    to: '/explore/experiments/grover',
    icon: <Search className="w-5 h-5 text-emerald-400" />,
    tag: 'Algorithm Experiment',
    accent: '#10B981',
  },
];

const VISUALIZER_CARDS = [
  {
    title: 'OpenQASM 2.0 Visualizer',
    desc: 'Directly parse Quantum Assembly code, tokenize grammar AST, and render gate layouts in real time.',
    to: '/qasm-visualizer',
    icon: <Terminal className="w-5 h-5 text-cyan-400" />,
    accent: '#06B6D4',
  },
  {
    title: 'Qiskit Circuit Visualizer',
    desc: 'Render IBM Qiskit JSON export schemas and step-by-step statevector evolution.',
    to: '/qiskit-visualizer',
    icon: <Cpu className="w-5 h-5 text-indigo-400" />,
    accent: '#6366F1',
  },
];

const ALGO_PILLS = [
  { label: 'Bell State (AL-01)', to: '/explore/algorithms/bell-state', color: '#8B5CF6' },
  { label: 'Deutsch-Jozsa (AL-02)', to: '/explore/algorithms/deutsch-jozsa', color: '#22D3EE' },
  { label: "Grover's Search (AL-03)", to: '/explore/experiments/grover', color: '#10B981' },
  { label: 'Teleportation (AL-04)', to: '/explore/algorithms/teleportation', color: '#D946EF' },
  { label: 'QFT (AL-05)', to: '/explore/algorithms/qft', color: '#3B82F6' },
  { label: 'BB84 QKD (AL-07)', to: '/explore/algorithms/qkd', color: '#F59E0B' },
  { label: 'Network Repeater (AL-08)', to: '/explore/algorithms/network', color: '#F43F5E' },
];

type StatePreset = '|+⟩ Superposition' | '|-⟩ Superposition' | '|0⟩ Ground' | '|1⟩ Excited';

export default function LearnerHome() {
  const [theta, setTheta] = useState<number>(Math.PI / 2);
  const [phi, setPhi] = useState<number>(0);
  const [preset, setPreset] = useState<StatePreset>('|+⟩ Superposition');

  const presets: { label: StatePreset; theta: number; phi: number; color: string }[] = [
    { label: '|0⟩ Ground', theta: 0, phi: 0, color: '#22D3EE' },
    { label: '|1⟩ Excited', theta: Math.PI, phi: 0, color: '#F43F5E' },
    { label: '|+⟩ Superposition', theta: Math.PI / 2, phi: 0, color: '#8B5CF6' },
    { label: '|-⟩ Superposition', theta: Math.PI / 2, phi: Math.PI, color: '#D946EF' },
  ];

  const pZero = Math.round(Math.cos(theta / 2) ** 2 * 100);
  const pOne = 100 - pZero;

  return (
    <div className="space-y-16 pb-20">
      {/* ── HERO SECTION WITH PARTICLES & LIVE BLOCH SPHERE ───────────────── */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="relative rounded-3xl overflow-hidden border"
        style={{
          background: 'linear-gradient(135deg, rgba(8,14,32,0.95) 0%, rgba(3,7,20,0.98) 100%)',
          borderColor: 'rgba(99, 102, 241, 0.25)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.1)',
        }}
      >
        {/* Dynamic Canvas Particles */}
        <HeroParticles />

        {/* Ambient background glows */}
        <div
          className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            filter: 'blur(50px)',
            zIndex: 0,
          }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-[400px] h-[300px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)',
            filter: 'blur(50px)',
            zIndex: 0,
          }}
        />

        <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12 p-6 sm:p-10 lg:p-12">
          {/* Left: Copy & Actions */}
          <div className="xl:col-span-6 space-y-6 flex flex-col justify-center">
            <motion.div variants={fadeUp}>
              <span
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold tracking-wider border shadow-sm"
                style={{
                  background: 'rgba(34,211,238,0.08)',
                  borderColor: 'rgba(34,211,238,0.3)',
                  color: '#67E8F9',
                }}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                SIH 2026 • PS26140 • QUANTUM LENS AI STUDIO
              </span>
            </motion.div>

            <motion.div variants={fadeUp} className="space-y-3">
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] text-white"
                style={{ fontFamily: "'Orbitron', 'Syne', sans-serif", letterSpacing: '-0.02em' }}
              >
                Quantum Fragility
                <br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, #A78BFA 0%, #22D3EE 50%, #60A5FA 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Playground & Lab
                </span>
              </h1>
              <p className="text-base sm:text-lg leading-relaxed text-slate-300 max-w-xl">
                Experience real-time quantum decoherence, 3D Bloch sphere vector dynamics, open quantum
                system noise models, and simulator-backed Qiskit Aer experiments.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/labs/fragility"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-white shadow-xl transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED 0%, #0891B2 100%)',
                  boxShadow: '0 0 28px rgba(124, 58, 237, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                <FlaskConical className="w-4 h-4 text-cyan-200" />
                <span>Open Fragility Lab</span>
                <ChevronRight className="w-4 h-4 opacity-80" />
              </Link>

              <Link
                to="/labs/studio"
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm text-slate-200 hover:text-white transition-all duration-200 border"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                }}
              >
                <Terminal className="w-4 h-4 text-purple-400" />
                <span>Circuit Studio</span>
              </Link>

              <Link
                to="/learn"
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm text-slate-200 hover:text-white transition-all duration-200 border"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                }}
              >
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>Start Learning</span>
              </Link>
            </motion.div>

            {/* Hardware & Verification Metrics */}
            <motion.div
              variants={fadeUp}
              className="grid grid-cols-3 gap-3 pt-4 border-t border-white/[0.08]"
            >
              {[
                { label: 'Verified Engine', value: 'Qiskit Aer 0.17.2', color: '#22D3EE' },
                { label: 'Noise Channels', value: '4 Core (T₁, T₂, etc.)', color: '#F43F5E' },
                { label: 'Math Precision', value: '100% Analytical', color: '#10B981' },
              ].map(s => (
                <div
                  key={s.label}
                  className="p-3 rounded-xl border"
                  style={{
                    background: 'rgba(8, 14, 28, 0.65)',
                    borderColor: 'rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div className="text-[10px] font-mono mb-1 uppercase tracking-wider text-slate-400">
                    {s.label}
                  </div>
                  <div className="font-bold text-xs sm:text-sm font-mono" style={{ color: s.color }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Live Interactive Bloch Sphere */}
          <motion.div variants={fadeUp} custom={4} className="xl:col-span-6 flex flex-col justify-center">
            <div
              className="rounded-2xl overflow-hidden border shadow-2xl"
              style={{
                background: 'rgba(4, 8, 24, 0.92)',
                borderColor: 'rgba(99, 102, 241, 0.28)',
                boxShadow: '0 0 50px rgba(99, 102, 241, 0.15)',
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{
                  borderColor: 'rgba(255, 255, 255, 0.06)',
                  background: 'rgba(8, 14, 28, 0.75)',
                }}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                    Live 3D Bloch Sphere
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  REAL-TIME WEBGL
                </span>
              </div>

              {/* 3D Bloch Canvas */}
              <div className="h-64 sm:h-72 w-full relative">
                <BlochSphere3D
                  state={{
                    x: Math.sin(theta) * Math.cos(phi),
                    y: Math.sin(theta) * Math.sin(phi),
                    z: Math.cos(theta),
                  }}
                />
              </div>

              {/* State readout & buttons */}
              <div className="p-4 space-y-3">
                <div
                  className="p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  style={{
                    background: 'rgba(2, 5, 16, 0.85)',
                    borderColor: 'rgba(99, 102, 241, 0.2)',
                  }}
                >
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      Current Vector State
                    </div>
                    <div className="font-mono font-bold text-sm text-cyan-300">
                      |ψ⟩ = {Math.cos(theta / 2).toFixed(3)}|0⟩ + {Math.sin(theta / 2).toFixed(3)}
                      {phi !== 0 ? `e^(i·${phi.toFixed(2)})` : ''}|1⟩
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs font-mono">
                    <span className="text-slate-300">
                      P(|0⟩): <strong className="text-cyan-400">{pZero}%</strong>
                    </span>
                    <span className="text-slate-300">
                      P(|1⟩): <strong className="text-rose-400">{pOne}%</strong>
                    </span>
                  </div>
                </div>

                {/* State preset buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {presets.map(p => (
                    <button
                      key={p.label}
                      onClick={() => {
                        setTheta(p.theta);
                        setPhi(p.phi);
                        setPreset(p.label);
                      }}
                      className="px-2 py-2 rounded-lg text-xs font-mono font-semibold transition-all border text-center truncate"
                      style={{
                        background:
                          preset === p.label ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        borderColor: preset === p.label ? p.color : 'rgba(255, 255, 255, 0.08)',
                        color: preset === p.label ? p.color : '#94A3B8',
                      }}
                    >
                      {p.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ── FAST ALGORITHM QUICK JUMP PILLS ─────────────────────────────────── */}
      <motion.section variants={fadeUp} className="flex flex-col gap-3">
        <div className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span>Interactive Algorithms Quick Launch</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {ALGO_PILLS.map(algo => (
            <Link
              key={algo.label}
              to={algo.to}
              className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-200 border hover:scale-105"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderColor: `${algo.color}40`,
                color: '#E2E8F0',
              }}
            >
              <span className="mr-1.5" style={{ color: algo.color }}>
                ●
              </span>
              {algo.label}
            </Link>
          ))}
        </div>
      </motion.section>

      {/* ── VIRTUAL LABS MODULES GRID ────────────────────────────────────────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 mb-1">
              // Core Virtual Labs Suite
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
              style={{ fontFamily: "'Orbitron', 'Syne', sans-serif" }}
            >
              Interactive Quantum Workbenches
            </h2>
          </div>
          <Link
            to="/labs"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>View All Labs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {LAB_CARDS.map((card, i) => (
            <motion.div key={card.id} variants={fadeUp} custom={i}>
              <Link to={card.to} className="block h-full group">
                <div
                  className="h-full p-6 rounded-2xl flex flex-col justify-between gap-5 transition-all duration-300 border relative overflow-hidden"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(12, 20, 42, 0.95) 0%, rgba(8, 14, 30, 0.90) 100%)',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = `${card.accent}60`;
                    el.style.boxShadow = `0 12px 40px rgba(0,0,0,0.5), 0 0 30px ${card.glow}`;
                    el.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    el.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.35)';
                    el.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Glowing top line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ background: `linear-gradient(90deg, ${card.accent}, transparent)` }}
                  />

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
                        style={{
                          background: `${card.accent}15`,
                          borderColor: `${card.accent}40`,
                          color: card.accent,
                        }}
                      >
                        {card.tag}
                      </span>
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: `${card.accent}20`, color: card.accent }}
                      >
                        {card.icon}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{card.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
                  </div>

                  <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono font-bold" style={{ color: card.accent }}>
                        {card.metric}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase">
                        {card.metricLabel}
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all"
                      style={{ color: card.accent }}
                    >
                      {card.cta} <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── PHYSICS EXPERIMENTS SHOWCASE (BELOVED V-LABS) ────────────────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400 mb-1">
              // Milestone Physics Experiments
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
              style={{ fontFamily: "'Orbitron', 'Syne', sans-serif" }}
            >
              Verified Quantum Physics Labs
            </h2>
          </div>
          <Link
            to="/explore/experiments"
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <span>Explore All Experiments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {EXPERIMENT_CARDS.map(exp => (
            <Link key={exp.title} to={exp.to} className="group">
              <div
                className="h-full p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-3"
                style={{
                  background: 'rgba(8, 14, 28, 0.7)',
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = `${exp.accent}50`;
                  el.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  el.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      {exp.tag}
                    </span>
                    <div className="p-1.5 rounded-lg bg-white/5">{exp.icon}</div>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1.5 group-hover:text-cyan-300 transition-colors">
                    {exp.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{exp.desc}</p>
                </div>
                <div
                  className="flex items-center gap-1 text-xs font-semibold pt-2 border-t border-white/5"
                  style={{ color: exp.accent }}
                >
                  Run Experiment <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* ── CODE VISUALIZERS (QASM & QISKIT) ─────────────────────────────────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
        className="space-y-4"
      >
        <div className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 mb-1">
          // Circuit Visualizers & Import
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {VISUALIZER_CARDS.map(vis => (
            <Link key={vis.title} to={vis.to} className="group">
              <div
                className="p-6 rounded-2xl border transition-all duration-300 flex items-start gap-4"
                style={{
                  background: 'rgba(8, 14, 30, 0.8)',
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = `${vis.accent}50`;
                  el.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  el.style.transform = 'translateY(0)';
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${vis.accent}15`, border: `1px solid ${vis.accent}30` }}
                >
                  {vis.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {vis.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{vis.desc}</p>
                  <div
                    className="flex items-center gap-1.5 text-xs font-semibold mt-3"
                    style={{ color: vis.accent }}
                  >
                    Open Visualizer <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* ── BOTTOM BANNER ───────────────────────────────────────────────────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="rounded-3xl p-8 sm:p-10 border relative overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(6,182,212,0.15) 50%, rgba(139,92,246,0.12) 100%)',
          borderColor: 'rgba(99, 102, 241, 0.3)',
          boxShadow: '0 0 50px rgba(99, 102, 241, 0.15)',
        }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-cyan-400">
              // READY TO EXPLORE
            </span>
            <h2
              className="text-2xl sm:text-3xl font-bold text-white mt-1"
              style={{ fontFamily: "'Orbitron', 'Syne', sans-serif" }}
            >
              Take Your Quantum Leap
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Zero TypeScript errors. Verified Qiskit Aer backend. Fully responsive across desktop, tablet,
              and mobile devices.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/labs/fragility"
              className="px-6 py-3 rounded-xl font-semibold text-sm text-white shadow-xl transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #0891B2)',
                boxShadow: '0 0 25px rgba(124, 58, 237, 0.4)',
              }}
            >
              Start Fragility Lab
            </Link>
            <Link
              to="/labs/studio"
              className="px-5 py-3 rounded-xl font-semibold text-sm text-slate-200 hover:text-white border border-white/10 bg-white/5"
            >
              Circuit Studio
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
