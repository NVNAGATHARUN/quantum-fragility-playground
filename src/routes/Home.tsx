import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  FlaskConical,
  Terminal,
  Zap,
  Activity,
  Cpu,
  BookOpen,
  Layers,
  Award,
  ArrowRight,
  ChevronRight,
  Atom,
  Search,
  CheckCircle2,
  BarChart3,
  Users,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Card, Badge } from '../components/UI';
import BlochSphere3D from '../components/BlochSphere3D';
import { PRESET_VECTORS } from '../types/quantum';

// ─── Particle Canvas Background ───────────────────────────────────────────────

const HeroParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 640);

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

// ─── Auto-Decohering Mini Demo Component ──────────────────────────────────────

const MiniFragilityDemo = () => {
  const [state, setState] = useState(PRESET_VECTORS.plus);
  const [health, setHealth] = useState(100);
  const cycleRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      cycleRef.current += 1;
      if (cycleRef.current >= 80) {
        cycleRef.current = 0;
        setState(PRESET_VECTORS.plus);
        setHealth(100);
      } else {
        setState(prev => ({
          x: prev.x * 0.96,
          y: prev.y * 0.96,
          z: prev.z * 0.96 + (1 - 0.96) * 0.2,
        }));
        setHealth(prev => Math.max(0, prev - 1.25));
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#050818]/90 p-24 rounded-2xl border border-brand-border">
      <div className="flex justify-between items-center mb-16">
        <div className="flex items-center gap-8">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-orbitron font-semibold text-text-primary uppercase tracking-wider">
            Live Decoherence Cycle
          </span>
        </div>
        <Badge color={health > 70 ? 'green' : health > 30 ? 'gold' : 'red'}>
          Health: {health.toFixed(0)}%
        </Badge>
      </div>

      <div className="h-[260px] relative overflow-hidden rounded-xl border border-brand-border/40 bg-[#030612]">
        <BlochSphere3D state={state} health={health} history={[]} />
      </div>

      <div className="mt-16 flex justify-between items-center text-xs font-mono text-slate-300">
        <span>Vector: ({state.x.toFixed(2)}, {state.y.toFixed(2)}, {state.z.toFixed(2)})</span>
        <span className="text-brand-cyan">Phase Loss: {(100 - health).toFixed(0)}%</span>
      </div>
    </div>
  );
};

// ─── Data: Expected Deliverables Matrix (PS 26140) ─────────────────────────────

interface DeliverableItem {
  id: string;
  objective: string;
  requirement: string;
  solution: string;
  frameworks: string[];
  status: string;
  link: string;
  actionText: string;
  badgeColor: 'cyan' | 'purple' | 'green' | 'gold' | 'primary';
}

const DELIVERABLES_DATA: DeliverableItem[] = [
  {
    id: 'd1',
    objective: 'Interactive Quantum Education Platform',
    requirement: 'Structured pedagogical modules covering fundamentals, qubits, superposition, entanglement, and algorithm mathematics.',
    solution: '8-module curriculum, step-by-step visual lessons, and hands-on simulation walkthroughs with live formulas.',
    frameworks: ['React', 'Framer Motion', 'TeX MathJax', 'Three.js'],
    status: '100% Implemented',
    link: '/learning-by-simulation',
    actionText: 'Open Simulation Guides',
    badgeColor: 'cyan',
  },
  {
    id: 'd2',
    objective: 'Graphical & Code-Based Circuit Design',
    requirement: 'Drag-and-drop circuit synthesis alongside native code editors with OpenQASM and Qiskit import/export.',
    solution: '@dnd-kit drag-and-drop Gate Builder, real-time unitary state transforms, and syntax-highlighted QASM/Qiskit visualizers.',
    frameworks: ['@dnd-kit/core', 'OpenQASM 2.0 AST', 'Qiskit JSON Schema'],
    status: 'Verified Interactive',
    link: '/gate-builder',
    actionText: 'Launch Circuit Studio',
    badgeColor: 'purple',
  },
  {
    id: 'd3',
    objective: 'Multi-Backend Simulation Support',
    requirement: 'Real-time execution of quantum circuits across diverse simulation backends (Qiskit Aer, PennyLane, Cirq).',
    solution: 'FastAPI Qiskit Aer Kernel (Port 8001), PennyLane hybrid VQE/QAOA optimizers, and cross-framework compilation.',
    frameworks: ['Qiskit Aer 0.17.2', 'PennyLane 0.35', 'FastAPI', 'Python 3.11'],
    status: 'Active Backend',
    link: '/explore/algorithms',
    actionText: 'View Algorithm Suite',
    badgeColor: 'green',
  },
  {
    id: 'd4',
    objective: 'AI-Assisted Tutoring & Error Detection',
    requirement: 'Intelligent guidance, conceptual explanation, code generation, error detection, and personalized learning paths.',
    solution: 'Grounded Quantum AI Assistant, Predict-Observe-Explain (POE) Cognitive Conflict Lab tackling misconceptions M01–M08.',
    frameworks: ['POE Pedagogy', 'Cognitive Conflict Diagnostic', 'AI Mentor'],
    status: 'Integrated',
    link: '/labs/conflict',
    actionText: 'Test POE AI Lab',
    badgeColor: 'gold',
  },
  {
    id: 'd5',
    objective: 'Multi-Fidelity Quantum State Visualizations',
    requirement: 'Rich visualization of quantum states, Bloch spheres, measurement probabilities, and environmental noise decay.',
    solution: 'Interactive 3D WebGL Bloch spheres, 4 continuous Kraus noise channels, Lindblad bounds (T₂ ≤ 2T₁), and V-Labs experiments.',
    frameworks: ['Three.js WebGL', 'Web Audio Sonification', 'Recharts Canvas'],
    status: 'GPU Accelerated',
    link: '/fragility-lab',
    actionText: 'Open Fragility Lab',
    badgeColor: 'cyan',
  },
  {
    id: 'd6',
    objective: 'Assessments, Challenges & Instructor Dashboards',
    requirement: 'Interactive coding challenges, student progress tracking, assessment modules, and comprehensive instructor analytics.',
    solution: 'State synthesis challenges, skill radar progress tracking, cohort engagement heatmaps, and assignment grading.',
    frameworks: ['Cohort Analytics', 'Challenge Evaluator', 'Role-Based Auth'],
    status: 'Enterprise Ready',
    link: '/instructor',
    actionText: 'Instructor Portal',
    badgeColor: 'primary',
  },
];

// ─── Data: Core Virtual Labs ──────────────────────────────────────────────────

const LAB_WORKBENCHES = [
  {
    id: 'fragility',
    tag: 'CORE LAB',
    title: 'Fragility Lab',
    desc: 'Simulate open quantum system decoherence with 4 continuous Kraus noise channels, Lindblad enforcement, and evolution time machine.',
    to: '/fragility-lab',
    cta: 'Inject Noise',
    color: '#22D3EE',
    icon: <FlaskConical className="w-5 h-5 text-cyan-400" />,
    metric: 'T₂ ≤ 2T₁',
    metricLabel: 'Lindblad Compliant',
  },
  {
    id: 'studio',
    tag: 'WORKBENCH',
    title: 'Circuit Studio',
    desc: 'Drag-and-drop quantum gate composer with step-by-step statevector rotation, matrix unitary calculation, and QASM export.',
    to: '/gate-builder',
    cta: 'Launch Studio',
    color: '#A855F7',
    icon: <Terminal className="w-5 h-5 text-purple-400" />,
    metric: '32 Qubits',
    metricLabel: 'Aer Simulation',
  },
  {
    id: 'conflict',
    tag: 'POE AI',
    title: 'Cognitive Conflict Lab',
    desc: 'Predict-Observe-Explain interactive diagnostics resolving foundational quantum misconceptions (H²=I, No-Signaling, Mixture Trap).',
    to: '/labs/conflict',
    cta: 'Test Intuition',
    color: '#F59E0B',
    icon: <Zap className="w-5 h-5 text-amber-400" />,
    metric: 'M01–M08',
    metricLabel: 'Taxonomy Tested',
  },
  {
    id: 'q-vs-c',
    tag: 'BENCHMARK',
    title: 'Quantum vs Classical',
    desc: 'Side-by-side noise decay proving why classical macroscopic bits resist environmental interference while microscopic qubits collapse.',
    to: '/quantum-vs-classical',
    cta: 'Compare Bits',
    color: '#10B981',
    icon: <Activity className="w-5 h-5 text-emerald-400" />,
    metric: '0/1 vs |ψ⟩',
    metricLabel: 'Stability Delta',
  },
  {
    id: 'hardware',
    tag: 'HARDWARE',
    title: '3D Cryostat Explorer',
    desc: 'Interactive dilution refrigerator model with 300K → 15mK thermal stages and DRAG microwave pulse synthesizer.',
    to: '/explore/hardware',
    cta: 'Explore Cryostat',
    color: '#818CF8',
    icon: <Cpu className="w-5 h-5 text-indigo-400" />,
    metric: '15 mK',
    metricLabel: 'Base Temperature',
  },
  {
    id: 'sim-guide',
    tag: 'CURRICULUM',
    title: 'Simulation Guides',
    desc: 'Visual, step-by-step walkthroughs designed for students. Master the physics of spin, entanglement, and cavity resonators.',
    to: '/learning-by-simulation',
    cta: 'Read Guide',
    color: '#38BDF8',
    icon: <BookOpen className="w-5 h-5 text-sky-400" />,
    metric: '8 Modules',
    metricLabel: 'Foundations',
  },
];

// ─── Data: Milestone V-Labs Physics Experiments ──────────────────────────────

const PHYSICS_EXPERIMENTS = [
  {
    title: 'Stern–Gerlach Lab',
    desc: 'Fire silver atoms through an inhomogeneous magnetic gradient. Observe spatial spin quantization into two discrete paths.',
    to: '/experiments/stern-gerlach',
    icon: <Atom className="w-5 h-5 text-amber-400" />,
    tag: 'Particle Physics',
    accent: '#F59E0B',
  },
  {
    title: 'Bell State & CHSH Test',
    desc: 'Generate 2-qubit maximally entangled pairs and test Bell inequality violation S = 2.828 > 2 defying classical physics.',
    to: '/experiments/bell-state',
    icon: <Activity className="w-5 h-5 text-purple-400" />,
    tag: 'Non-locality',
    accent: '#A855F7',
  },
  {
    title: 'Cavity QED (Jaynes-Cummings)',
    desc: 'Trap a single atom between perfect mirrors with one photon. Control Rabi oscillations and light-matter energy swap.',
    to: '/experiments/cavity-qed',
    icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
    tag: 'Quantum Optics',
    accent: '#06B6D4',
  },
  {
    title: "Grover's Search Algorithm",
    desc: 'Quadratic speedup search simulating oracle phase inversion and diffusion operator amplitude amplification.',
    to: '/experiments/grover',
    icon: <Search className="w-5 h-5 text-emerald-400" />,
    tag: 'Algorithm Physics',
    accent: '#10B981',
  },
];

// ─── Main Home Component ──────────────────────────────────────────────────────

export default function Home() {
  const [theta, setTheta] = useState<number>(Math.PI / 2);
  const [phi, setPhi] = useState<number>(0);
  const [preset, setPreset] = useState<string>('|+⟩');

  const presets = [
    { label: '|0⟩', theta: 0, phi: 0, color: '#22D3EE' },
    { label: '|1⟩', theta: Math.PI, phi: 0, color: '#F43F5E' },
    { label: '|+⟩', theta: Math.PI / 2, phi: 0, color: '#8B5CF6' },
    { label: '|−⟩', theta: Math.PI / 2, phi: Math.PI, color: '#D946EF' },
  ];

  const pZero = Math.round(Math.cos(theta / 2) ** 2 * 100);
  const pOne = 100 - pZero;

  return (
    <div className="flex flex-col gap-64 pb-64">
      {/* ── HERO SECTION WITH PARTICLES & LIVE BLOCH INSTRUMENT ─────────────── */}
      <section
        className="relative rounded-3xl overflow-hidden border"
        style={{
          background: 'linear-gradient(135deg, rgba(8,14,32,0.95) 0%, rgba(3,7,20,0.98) 100%)',
          borderColor: 'rgba(99, 102, 241, 0.25)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.1)',
        }}
      >
        <HeroParticles />

        <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-32 p-24 sm:p-40 items-center">
          {/* Left: Copy & Actions */}
          <div className="xl:col-span-7 flex flex-col gap-24">
            <div className="flex flex-wrap items-center gap-10">
              <span className="inline-flex items-center gap-6 px-12 py-6 rounded-full text-xs font-mono font-bold tracking-wider bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                SIH 2026 • PS 26140 • SMART EDUCATION
              </span>
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
                Organization: Egreen Quanta
              </span>
            </div>

            <div className="flex flex-col gap-12">
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] text-white tracking-tight"
                style={{ fontFamily: "'Orbitron', 'Syne', sans-serif" }}
              >
                AI-Based Interactive{' '}
                <span className="gradient-text">Quantum Algorithm</span> Learning Platform
              </h1>
              <p className="text-base sm:text-lg leading-relaxed text-slate-300 max-w-2xl font-normal">
                An integrated, interactive, and intelligent platform combining graphical & code-based circuit
                design, multi-backend simulation (Qiskit Aer, PennyLane, Cirq), grounded AI-assisted tutoring,
                and multi-fidelity state visualization.
              </p>
            </div>

            <div className="flex flex-wrap gap-12 pt-8">
              <Link
                to="/fragility-lab"
                className="btn btn-primary !px-24 !py-12 text-xs font-bold"
              >
                <FlaskConical className="w-4 h-4 text-cyan-200" />
                <span>Start Fragility Lab</span>
              </Link>

              <Link
                to="/gate-builder"
                className="btn btn-secondary !px-24 !py-12 text-xs font-bold"
              >
                <Terminal className="w-4 h-4 text-purple-400" />
                <span>Circuit Studio</span>
              </Link>

              <a
                href="#deliverables-table"
                className="btn btn-ghost !px-20 !py-12 text-xs font-bold border border-brand-border/60 hover:border-brand-primary"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Deliverables Matrix</span>
              </a>
            </div>

            {/* Hardware & Multi-Backend Status Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 pt-16 border-t border-white/10">
              {[
                { label: 'Qiskit Aer', value: 'Port 8001 Online', color: '#22D3EE' },
                { label: 'PennyLane', value: 'VQE / QAOA Ready', color: '#A855F7' },
                { label: 'AI POE Mentor', value: 'Grounded Real-Time', color: '#F59E0B' },
                { label: 'Visualizers', value: 'QASM & Qiskit Synced', color: '#10B981' },
              ].map(s => (
                <div
                  key={s.label}
                  className="p-10 rounded-xl bg-surface/80 border border-brand-border flex flex-col gap-2"
                >
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    {s.label}
                  </div>
                  <div className="font-bold text-xs font-mono" style={{ color: s.color }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Live Interactive 3D Bloch Sphere */}
          <div className="xl:col-span-5 flex flex-col justify-center">
            <Card className="p-0 overflow-hidden border-brand-primary/30 shadow-2xl bg-[#040818]/90">
              <div className="flex items-center justify-between px-16 py-12 border-b border-brand-border bg-surface">
                <div className="flex items-center gap-8">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span className="font-orbitron text-xs font-bold uppercase tracking-wider text-white">
                    Live 3D Bloch Sphere
                  </span>
                </div>
                <span className="text-[9px] font-mono px-8 py-2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  GPU WebGL
                </span>
              </div>

              <div className="h-64 sm:h-72 w-full relative bg-[#020512]">
                <BlochSphere3D
                  state={{
                    x: Math.sin(theta) * Math.cos(phi),
                    y: Math.sin(theta) * Math.sin(phi),
                    z: Math.cos(theta),
                  }}
                />
              </div>

              <div className="p-16 flex flex-col gap-12">
                <div className="p-12 rounded-xl bg-[#020614] border border-brand-border flex flex-col sm:flex-row justify-between items-center gap-8 font-mono text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">State Vector</div>
                    <div className="font-bold text-cyan-300">
                      |ψ⟩ = {Math.cos(theta / 2).toFixed(2)}|0⟩ + {Math.sin(theta / 2).toFixed(2)}|1⟩
                    </div>
                  </div>
                  <div className="flex gap-12">
                    <span className="text-slate-300">P(|0⟩): <strong className="text-cyan-400">{pZero}%</strong></span>
                    <span className="text-slate-300">P(|1⟩): <strong className="text-rose-400">{pOne}%</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-8">
                  {presets.map(p => (
                    <button
                      key={p.label}
                      onClick={() => {
                        setTheta(p.theta);
                        setPhi(p.phi);
                        setPreset(p.label);
                      }}
                      className={`py-8 rounded-lg text-xs font-mono font-bold transition-all border text-center ${
                        preset === p.label
                          ? 'bg-brand-primary/30 border-brand-primary text-white scale-105'
                          : 'bg-surface border-brand-border text-slate-400 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ── DELIVERY TABLE (EXPECTED DELIVERABLES) SECTION ───────────────────── */}
      <section id="deliverables-table" className="flex flex-col gap-24 scroll-mt-24">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-8 text-xs font-mono font-bold uppercase tracking-widest text-brand-cyan">
            <ShieldCheck className="w-4 h-4" />
            <span>Problem Statement 26140 Compliance Matrix</span>
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold text-white tracking-tight"
            style={{ fontFamily: "'Orbitron', 'Syne', sans-serif" }}
          >
            Delivery Table <span className="gradient-text">(Expected Deliverables)</span>
          </h2>
          <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
            Directly addressing all deliverables set forth by <strong>Egreen Quanta (Category: Software, Theme: Smart Education)</strong>.
            Every objective is backed by active, verified, interactive engineering modules.
          </p>
        </div>

        {/* Deliverables Table Card */}
        <Card className="p-0 overflow-hidden border-brand-border shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-brand-border text-[11px] font-orbitron uppercase tracking-wider text-slate-300">
                  <th className="py-16 px-20">PS 26140 Objective</th>
                  <th className="py-16 px-20">Platform Implementation & Features</th>
                  <th className="py-16 px-20">Supported Backends / Stack</th>
                  <th className="py-16 px-20">Verification & Status</th>
                  <th className="py-16 px-20 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40 text-xs">
                {DELIVERABLES_DATA.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-16 px-20 font-semibold text-white max-w-[220px]">
                      <div className="flex items-center gap-8">
                        <span className="w-6 h-6 rounded-full bg-brand-primary/20 border border-brand-primary/40 text-[10px] font-mono text-brand-primary flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span>{item.objective}</span>
                      </div>
                    </td>
                    <td className="py-16 px-20 text-slate-300 max-w-[340px] leading-relaxed">
                      <p className="font-medium text-slate-200 mb-4">{item.solution}</p>
                      <p className="text-[11px] text-slate-400">{item.requirement}</p>
                    </td>
                    <td className="py-16 px-20">
                      <div className="flex flex-wrap gap-4 max-w-[180px]">
                        {item.frameworks.map(fw => (
                          <span key={fw} className="text-[10px] font-mono px-6 py-2 rounded bg-surface border border-brand-border text-slate-300">
                            {fw}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-16 px-20">
                      <Badge color={item.badgeColor}>{item.status}</Badge>
                    </td>
                    <td className="py-16 px-20 text-right">
                      <Link
                        to={item.link}
                        className="inline-flex items-center gap-6 px-12 py-6 rounded-lg bg-surface border border-brand-border hover:border-brand-primary text-xs font-semibold text-brand-cyan hover:text-white transition-all"
                      >
                        <span>{item.actionText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* ── MULTI-BACKEND SIMULATION ARCHITECTURE ────────────────────────────── */}
      <section className="flex flex-col gap-24">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-12">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-purple-400 mb-6">
              // Multi-Framework Simulation Infrastructure
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
              style={{ fontFamily: "'Orbitron', 'Syne', sans-serif" }}
            >
              Unified Multi-Backend Simulation Matrix
            </h2>
          </div>
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-6 px-10 py-4 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> All Simulators Online
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-24">
          <Card className="p-24 flex flex-col gap-16 border-cyan-500/30 bg-surface/90 hover:border-cyan-400 transition-all">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">Primary Backend</span>
              <Badge color="cyan">FastAPI 8001</Badge>
            </div>
            <h3 className="text-lg font-bold text-white">Qiskit Aer Kernel</h3>
            <p className="text-xs text-slate-300 leading-relaxed flex-1">
              High-performance C++ simulator performing exact statevector evolution, density matrix noise mapping,
              and projective shot sampling for up to 32 qubits with verified analytical fidelity.
            </p>
            <div className="pt-12 border-t border-brand-border text-[11px] font-mono text-cyan-300 flex items-center justify-between">
              <span>Status: Active & Verified</span>
              <span>1024 Shots Default</span>
            </div>
          </Card>

          <Card className="p-24 flex flex-col gap-16 border-purple-500/30 bg-surface/90 hover:border-purple-400 transition-all">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">Variational Backend</span>
              <Badge color="purple">PennyLane Hybrid</Badge>
            </div>
            <h3 className="text-lg font-bold text-white">PennyLane VQE & QAOA</h3>
            <p className="text-xs text-slate-300 leading-relaxed flex-1">
              Supports hybrid quantum-classical parameter optimization for molecular ground-state energy computation (VQE)
              and combinatorial graph Max-Cut solving (QAOA) with autograd gradients.
            </p>
            <div className="pt-12 border-t border-brand-border text-[11px] font-mono text-purple-300 flex items-center justify-between">
              <span>Status: Module Integrated</span>
              <span>Hamiltonian Solvers</span>
            </div>
          </Card>

          <Card className="p-24 flex flex-col gap-16 border-emerald-500/30 bg-surface/90 hover:border-emerald-400 transition-all">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">Open Standards</span>
              <Badge color="green">OpenQASM & Cirq</Badge>
            </div>
            <h3 className="text-lg font-bold text-white">Cirq & QASM AST Parser</h3>
            <p className="text-xs text-slate-300 leading-relaxed flex-1">
              Tokenizes OpenQASM 2.0 source code into syntax trees, mapping quantum circuits across Cirq, IBM Qiskit,
              and Google Quantum AI formats with live visual gate preview.
            </p>
            <div className="pt-12 border-t border-brand-border text-[11px] font-mono text-emerald-300 flex items-center justify-between">
              <span>Status: AST Synced</span>
              <span>Cross-SDK Compatible</span>
            </div>
          </Card>
        </div>
      </section>

      {/* ── CORE VIRTUAL WORKBENCHES ─────────────────────────────────────────── */}
      <section className="flex flex-col gap-24">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-12">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 mb-6">
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
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-4"
          >
            <span>View All Labs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-24">
          {LAB_WORKBENCHES.map(wb => (
            <Link key={wb.id} to={wb.to} className="group h-full">
              <Card className="p-24 h-full flex flex-col justify-between gap-20 border-brand-border hover:border-brand-primary/50 transition-all hover:-translate-y-1">
                <div className="flex flex-col gap-12">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-8 py-2 rounded bg-white/5 border border-white/10 text-slate-300">
                      {wb.tag}
                    </span>
                    <div className="p-8 rounded-lg bg-surface border border-brand-border">
                      {wb.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {wb.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{wb.desc}</p>
                </div>

                <div className="pt-16 border-t border-brand-border flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono font-bold text-cyan-400">{wb.metric}</div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase">{wb.metricLabel}</div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold text-brand-cyan group-hover:gap-8 transition-all">
                    <span>{wb.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ── THE SCIENCE OF QUANTUM FRAGILITY + MINI DEMO ─────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
        <div className="flex flex-col gap-20">
          <div className="flex items-center gap-8">
            <Badge color="purple">Pedagogical Core</Badge>
            <span className="text-xs font-mono text-slate-400 uppercase">Superposition & Decoherence</span>
          </div>

          <h2
            className="text-3xl sm:text-4xl font-bold text-white tracking-tight"
            style={{ fontFamily: "'Orbitron', 'Syne', sans-serif" }}
          >
            What is <span className="gradient-text">Quantum Fragility?</span>
          </h2>

          <div className="flex flex-col gap-16 text-slate-300 text-sm leading-relaxed">
            <p>
              Unlike classical bits that are robustly 0 or 1, qubits are exceptionally fragile.
              Any uncontrolled environmental interaction causes <strong className="text-white">decoherence</strong>—collapsing
              delicate quantum superposition and entanglement into classical statistical noise.
            </p>
            <p>
              In our platform, users can continuously tune real physical noise channels—such as
              <span className="text-cyan-300 font-semibold"> Amplitude Damping (T₁ relaxation)</span>,
              <span className="text-purple-300 font-semibold"> Phase Flip (T₂ dephasing)</span>, and
              <span className="text-rose-300 font-semibold"> Depolarizing noise</span>—to observe how the Bloch vector
              contracts toward the center, extinguishing quantum computational advantage.
            </p>
          </div>

          <div className="pt-8 flex gap-12">
            <Link to="/fragility-lab" className="btn btn-primary !px-24 !py-10 text-xs">
              Explore Fragility Lab →
            </Link>
            <Link to="/quantum-vs-classical" className="btn btn-secondary !px-20 !py-10 text-xs">
              Q vs C Comparison
            </Link>
          </div>
        </div>

        <div>
          <MiniFragilityDemo />
        </div>
      </section>

      {/* ── MILESTONE V-LABS PHYSICS EXPERIMENTS ─────────────────────────────── */}
      <section className="flex flex-col gap-24">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-12">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400 mb-6">
              // Foundational Quantum Physics
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
              style={{ fontFamily: "'Orbitron', 'Syne', sans-serif" }}
            >
              Verified Physics Experiments
            </h2>
          </div>
          <Link
            to="/experiments"
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-4"
          >
            <span>All Experiments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20">
          {PHYSICS_EXPERIMENTS.map(exp => (
            <Link key={exp.title} to={exp.to} className="group">
              <Card className="p-20 h-full flex flex-col justify-between gap-16 border-brand-border hover:border-amber-400/50 transition-all hover:-translate-y-1">
                <div className="flex flex-col gap-12">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      {exp.tag}
                    </span>
                    <div className="p-8 rounded-lg bg-surface border border-brand-border">
                      {exp.icon}
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {exp.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{exp.desc}</p>
                </div>
                <div
                  className="flex items-center gap-6 text-xs font-semibold pt-12 border-t border-brand-border"
                  style={{ color: exp.accent }}
                >
                  <span>Launch Lab</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ── ASSESSMENT, CODING CHALLENGES & INSTRUCTOR ANALYTICS ─────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-24">
        <Link to="/challenges" className="group">
          <Card className="p-24 h-full flex flex-col justify-between gap-16 border-brand-border hover:border-brand-primary transition-all">
            <div className="flex flex-col gap-12">
              <div className="p-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 w-fit text-brand-primary">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                Interactive Coding Challenges
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Test your quantum circuit synthesis skills. Solve state preparation, entanglement creation,
                and phase estimation puzzles with automated test harness evaluation.
              </p>
            </div>
            <div className="flex items-center gap-6 text-xs font-semibold text-brand-cyan">
              <span>Start Challenges</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Card>
        </Link>

        <Link to="/progress" className="group">
          <Card className="p-24 h-full flex flex-col justify-between gap-16 border-brand-border hover:border-brand-primary transition-all">
            <div className="flex flex-col gap-12">
              <div className="p-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 w-fit text-cyan-400">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                Student Progress Analytics
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Track personal mastery across mathematical foundations, circuit engineering, algorithm implementation,
                and noise mitigation with skill radar analytics.
              </p>
            </div>
            <div className="flex items-center gap-6 text-xs font-semibold text-brand-cyan">
              <span>View My Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Card>
        </Link>

        <Link to="/instructor" className="group">
          <Card className="p-24 h-full flex flex-col justify-between gap-16 border-brand-border hover:border-amber-400 transition-all">
            <div className="flex flex-col gap-12">
              <div className="p-10 rounded-xl bg-amber-500/10 border border-amber-500/20 w-fit text-amber-400">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                Instructor Dashboard
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Classroom management suite providing cohort completion statistics, cognitive misconception heatmaps,
                and assignment distribution tools for universities.
              </p>
            </div>
            <div className="flex items-center gap-6 text-xs font-semibold text-amber-400">
              <span>Access Instructor Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Card>
        </Link>
      </section>
    </div>
  );
}
