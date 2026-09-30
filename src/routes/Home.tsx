import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Code2,
  FlaskConical,
  Play,
  Sparkles,
  Cpu,
  Layers,
  ShieldCheck,
  Compass,
  Thermometer,
  Zap,
} from "lucide-react";
import {
  QuantumOrb,
  CircuitMotif,
  WaveMotif,
} from "../components/QuantumArtwork";
import { V3_CURRICULUM } from "../content/curriculum";
import { useAuth } from "../providers/AuthProvider";
import { useLessonProgress } from "../hooks/useLessonProgress";

export default function Home() {
  const { user } = useAuth();
  const { isCompleted } = useLessonProgress();
  const [theta, setTheta] = useState(90); // polar angle 0 - 180 deg
  const [phi, setPhi] = useState(0); // azimuthal phase 0 - 360 deg

  const modules = V3_CURRICULUM.filter(
    (m) => m.status === "available" && m.lessons.length,
  );
  const lessons = modules.flatMap((m) => m.lessons);
  const completed = lessons.filter((l) => isCompleted(l.moduleId, l.id)).length;
  const next =
    lessons.find((l) => !isCompleted(l.moduleId, l.id)) || lessons[0];

  // Mathematical state calculations
  const thetaRad = (theta * Math.PI) / 180;
  const phiRad = (phi * Math.PI) / 180;
  const prob0 = Math.round(Math.cos(thetaRad / 2) ** 2 * 100);
  const prob1 = 100 - prob0;

  // Bloch coordinates
  const bx = (Math.sin(thetaRad) * Math.cos(phiRad)).toFixed(2);
  const by = (Math.sin(thetaRad) * Math.sin(phiRad)).toFixed(2);
  const bz = Math.cos(thetaRad).toFixed(2);

  // Amplitudes
  const a0 = Math.cos(thetaRad / 2).toFixed(2);
  const a1 = Math.sin(thetaRad / 2).toFixed(2);

  return (
    <div className="ql-page ql-overview ql-human-home space-y-12">
      {/* ── HERO BANNER ────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden rounded-3xl border border-cyan-500/30 p-8 sm:p-12 lg:p-16 shadow-[0_25px_60px_rgba(0,0,0,0.85)]"
        style={{
          background:
            "radial-gradient(ellipse at 80% 20%, rgba(0, 240, 255, 0.16) 0%, transparent 50%), radial-gradient(ellipse at 15% 85%, rgba(139, 92, 246, 0.14) 0%, transparent 55%), linear-gradient(135deg, #0a0f1d 0%, #060911 100%)",
        }}
        aria-label="Begin your quantum journey"
      >
        {/* Background circuit grid accents */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(0, 240, 255, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 240, 255, 0.15) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Value Proposition & Launchpad */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-mono text-cyan-300 font-bold text-xs uppercase tracking-widest">
                SMART INDIA HACKATHON 2026 · PS26140
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-space tracking-tight text-white leading-[1.08]">
              Next-Gen Quantum Computing <br />
              <span className="gradient-text">&amp; Pedagogical Laboratory</span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg max-w-xl leading-relaxed">
              Explore physical dilution cryostats in interactive 3D, design
              multi-qubit circuits across Qiskit Aer, Cirq, &amp; PennyLane, and
              master complex algorithms with zero-hallucination grounded AI
              mentorship.
            </p>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/quantum-lens"
                className="px-6 py-3.5 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 hover:from-cyan-300 hover:to-blue-400 shadow-[0_0_30px_rgba(0,240,255,0.45)] flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:scale-95"
              >
                <span className="text-base">❄️</span>
                <span>3D Cryostat Hardware</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/labs/studio"
                className="px-5 py-3.5 rounded-xl font-bold text-sm tracking-wide bg-white/10 hover:bg-white/15 text-white border border-white/15 hover:border-cyan-400/60 shadow-lg flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
              >
                <Code2 size={16} className="text-cyan-400" />
                <span>Circuit Studio</span>
              </Link>

              <Link
                to="/judge"
                className="px-4 py-3.5 rounded-xl font-bold text-sm tracking-wide bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-500/40 hover:border-indigo-400/70 flex items-center gap-2 transition-all"
              >
                <Sparkles size={16} className="text-amber-400" />
                <span>SIH Judge Walkthrough</span>
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-2 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <Check size={14} /> 100% Deterministic Provenance
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Check size={14} /> Qiskit Aer Kernel Active
              </span>
            </div>
          </div>

          {/* Right Column: Live Interactive Superposition & Bloch Explorer */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-[#0d1424]/90 border border-cyan-500/30 p-6 shadow-2xl backdrop-blur-xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono">
                    LIVE QUBIT STATE SIMULATOR
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Bloch ({bx}, {by}, {bz})
                </span>
              </div>

              {/* State Vector Display */}
              <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 font-mono text-center text-sm sm:text-base text-cyan-300">
                |ψ⟩ = {a0}|0⟩ + ({a1}
                {phi !== 0 ? `·e^i${phi}°` : ""})|1⟩
              </div>

              {/* Live Measurement Probabilities */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">P(|0⟩ Ground):</span>
                  <span className="font-bold text-cyan-400">{prob0}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-150"
                    style={{ width: `${prob0}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <span className="text-slate-300">P(|1⟩ Excited):</span>
                  <span className="font-bold text-purple-400">{prob1}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-150"
                    style={{ width: `${prob1}%` }}
                  />
                </div>
              </div>

              {/* Sliders for Theta and Phi */}
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Polar Angle (θ):</span>
                    <span className="font-mono text-cyan-400">{theta}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="180"
                    value={theta}
                    onChange={(e) => setTheta(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Phase Angle (ϕ):</span>
                    <span className="font-mono text-purple-400">{phi}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={phi}
                    onChange={(e) => setPhi(Number(e.target.value))}
                    className="w-full accent-purple-400 cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <Link
                  to="/labs/studio"
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold transition-colors"
                >
                  <span>Build circuit with this state</span>
                  <ArrowRight size={13} />
                </Link>
                <button
                  onClick={() => {
                    setTheta(90);
                    setPhi(0);
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Reset |+⟩
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── REALTIME PLATFORM TELEMETRY RIBBON ──────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            icon: Cpu,
            val: "162 Circuits",
            lbl: "100% Deterministic Pass",
            color: "text-cyan-400",
            bg: "border-cyan-500/20 bg-cyan-950/20",
          },
          {
            icon: Thermometer,
            val: "15 mK Cryostat",
            lbl: "10-Stage Bluefors Digital Twin",
            color: "text-blue-400",
            bg: "border-blue-500/20 bg-blue-950/20",
          },
          {
            icon: Layers,
            val: "3 SDK Engines",
            lbl: "Qiskit • Cirq • PennyLane",
            color: "text-purple-400",
            bg: "border-purple-500/20 bg-purple-950/20",
          },
          {
            icon: ShieldCheck,
            val: "0% Hallucination",
            lbl: "Aria Grounded Pedagogy",
            color: "text-emerald-400",
            bg: "border-emerald-500/20 bg-emerald-950/20",
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl border ${item.bg} backdrop-blur-md flex items-center gap-4 transition-all hover:scale-[1.02] shadow-lg`}
            >
              <div className={`p-3 rounded-xl bg-black/40 border border-white/10 ${item.color}`}>
                <Icon size={22} />
              </div>
              <div>
                <div className="font-space font-bold text-white text-base">
                  {item.val}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  {item.lbl}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ── CORE PRODUCT SUITES (FOUR PILLARS) ─────────────────────────── */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-cyan-400 font-mono text-xs uppercase tracking-widest font-bold">
              PLATFORM SUITES
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-space text-white">
              The SIH 2026 Quantum Computing Laboratory
            </h2>
          </div>
          <Link
            to="/labs"
            className="text-cyan-400 hover:text-cyan-300 font-semibold text-sm flex items-center gap-1.5 transition-colors"
          >
            <span>Explore all 36 laboratories</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: 3D Cryostat */}
          <Link
            to="/quantum-lens"
            className="group relative p-6 rounded-2xl bg-[#0c1220]/80 border border-cyan-500/25 hover:border-cyan-400/60 shadow-xl backdrop-blur-md flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,240,255,0.15)]"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  ❄️
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-bold">
                  3D HARDWARE
                </span>
              </div>
              <h3 className="font-space font-bold text-lg text-white group-hover:text-cyan-300 transition-colors">
                Dilution Cryostat Atlas
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Full 10-stage Bluefors LDsl digital twin with microwave pulse chase cam, thermal attenuation HUD, and 300K to 15mK stage telemetry.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-cyan-400">
              <span>Launch 3D Explorer</span>
              <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Circuit Studio */}
          <Link
            to="/labs/studio"
            className="group relative p-6 rounded-2xl bg-[#0c1220]/80 border border-blue-500/25 hover:border-blue-400/60 shadow-xl backdrop-blur-md flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(59,130,246,0.15)]"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <Code2 size={20} />
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 font-bold">
                  STUDIO
                </span>
              </div>
              <h3 className="font-space font-bold text-lg text-white group-hover:text-blue-300 transition-colors">
                Visual Circuit Studio
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Multi-backend drag-and-drop circuit canvas with live OpenQASM 3.0 synchronization, complex statevector preview, and Aer noise models.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-blue-400">
              <span>Open Studio</span>
              <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Cognitive Conflict */}
          <Link
            to="/labs/cognitive-conflict"
            className="group relative p-6 rounded-2xl bg-[#0c1220]/80 border border-purple-500/25 hover:border-purple-400/60 shadow-xl backdrop-blur-md flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(168,85,247,0.15)]"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <Sparkles size={20} />
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60 font-bold">
                  PEDAGOGY
                </span>
              </div>
              <h3 className="font-space font-bold text-lg text-white group-hover:text-purple-300 transition-colors">
                Cognitive Conflict Labs
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Commit to predictions before running simulations to shatter common misconceptions like classical probability mixing and faster-than-light signaling.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-purple-400">
              <span>Start Conflict Lab</span>
              <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </Link>

          {/* Card 4: Quantum Fragility */}
          <Link
            to="/labs/fragility"
            className="group relative p-6 rounded-2xl bg-[#0c1220]/80 border border-pink-500/25 hover:border-pink-400/60 shadow-xl backdrop-blur-md flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(236,72,153,0.15)]"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                  <Zap size={20} />
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-800/60 font-bold">
                  NOISE MODEL
                </span>
              </div>
              <h3 className="font-space font-bold text-lg text-white group-hover:text-pink-300 transition-colors">
                Quantum Fragility
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Benchmark circuit survival against real physical noise channels: depolarizing, amplitude damping, phase damping, and thermal relaxation.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-pink-400">
              <span>Inspect Fragility</span>
              <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* ── GUIDED FOUNDATIONS CURRICULUM PREVIEW ─────────────────────── */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-cyan-400 font-mono text-xs uppercase tracking-widest font-bold">
              STRUCTURED LEARNING PATH
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-space text-white">
              Grounded Curriculum Modules
            </h2>
          </div>
          <Link
            to="/learn"
            className="text-cyan-400 hover:text-cyan-300 font-semibold text-sm flex items-center gap-1.5 transition-colors"
          >
            <span>View all 11 modules</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {modules.slice(0, 3).map((m, i) => {
            const done = m.lessons.filter((l) =>
              isCompleted(m.id, l.id),
            ).length;
            const lesson =
              m.lessons.find((l) => !isCompleted(m.id, l.id)) || m.lessons[0];

            return (
              <Link
                key={m.id}
                to={`/learn/${m.id}/${lesson.id}`}
                className="group p-6 rounded-2xl bg-[#0c1220]/80 border border-white/10 hover:border-cyan-400/50 shadow-xl backdrop-blur-md flex flex-col justify-between transition-all duration-300 hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-cyan-400 font-bold tracking-wider">
                      MODULE 0{m.number}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {m.lessons.length} Lessons
                    </span>
                  </div>
                  <div>
                    <h3 className="font-space font-bold text-lg text-white group-hover:text-cyan-300 transition-colors">
                      {m.title}
                    </h3>
                    <p className="text-slate-400 text-xs mt-1.5 line-clamp-2">
                      {m.subtitle}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-300 font-medium">
                  <span>
                    {done === m.lessons.length
                      ? "Completed"
                      : `${done}/${m.lessons.length} completed`}
                  </span>
                  <span className="w-7 h-7 rounded-full bg-white/5 group-hover:bg-cyan-500/20 flex items-center justify-center text-cyan-400 transition-colors">
                    {done === m.lessons.length ? (
                      <Check size={14} />
                    ) : (
                      <ArrowUpRight size={14} />
                    )}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
