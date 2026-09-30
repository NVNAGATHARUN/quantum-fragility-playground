/**
 * QuantumLensLanding.tsx
 * Intro / landing page for the QuantumLens 3D Interactive Cryostat Model.
 * Route: /quantum-lens  →  leads to /quantum-lens/model
 */

import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: "🧊",
    title: "Dilution Cryostat",
    sub: "10-stage Bluefors LDsl architecture",
    desc: "Explore the full cryogenic stack from 300 K Room Temperature Flange down to 10 mK Mixing Chamber — every stage modeled in photorealistic 3D.",
    color: "from-cyan-500/20 to-blue-600/10",
    border: "border-cyan-500/25",
    glow: "shadow-cyan-500/10",
  },
  {
    icon: "🔬",
    title: "Exploded View",
    sub: "Dissect every layer",
    desc: "Use the Exploded View slider to pull apart all 10 components simultaneously, revealing internal structure and heat exchanger coils hidden inside.",
    color: "from-indigo-500/20 to-purple-600/10",
    border: "border-indigo-500/25",
    glow: "shadow-indigo-500/10",
  },
  {
    icon: "⚡",
    title: "Signal Flow Tracing",
    sub: "Live microwave signal animation",
    desc: "Watch microwave control pulses travel from the room-temperature AWG down through attenuators to the QPU, then amplified upward through HEMT chain — live, step by step.",
    color: "from-amber-500/20 to-orange-600/10",
    border: "border-amber-500/25",
    glow: "shadow-amber-500/10",
  },
  {
    icon: "📡",
    title: "QPU Package",
    sub: "Superconducting qubit chip",
    desc: "The quantum processor at 10 mK — a gold SMA-mounted microwave package with sapphire substrate, aluminum wirebonds, and μ-metal magnetic shielding.",
    color: "from-violet-500/20 to-pink-600/10",
    border: "border-violet-500/25",
    glow: "shadow-violet-500/10",
  },
];

const stages = [
  { name: "Room Temp Flange", temp: "300 K", color: "#ef4444" },
  { name: "50 K Flange", temp: "50 K", color: "#f97316" },
  { name: "4 K Flange", temp: "4 K", color: "#eab308" },
  { name: "Still Flange", temp: "700 mK", color: "#22c55e" },
  { name: "Cold Plate", temp: "100 mK", color: "#06b6d4" },
  { name: "Mixing Chamber", temp: "10 mK", color: "#6366f1" },
];

/* ── Animated background particles ── */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.3,
      alpha: Math.random() * 0.5 + 0.15,
      hue: Math.random() > 0.5 ? 195 : 245, // cyan or indigo
    }));

    let raf: number;
    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, ${p.alpha})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
    />
  );
}

/* ── Animated temperature gradient bar ── */
function TempGradientBar() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((p) => (p + 1) % stages.length), 1200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-center gap-1.5 mt-8 flex-wrap justify-center">
      {stages.map((s, i) => (
        <div
          key={s.name}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold border transition-all duration-500 cursor-default ${
            active === i
              ? "scale-110 shadow-lg"
              : "opacity-50 scale-100"
          }`}
          style={{
            borderColor: s.color + "66",
            background: active === i ? s.color + "22" : "transparent",
            color: active === i ? s.color : "#64748b",
            boxShadow: active === i ? `0 0 16px ${s.color}44` : "none",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: s.color, opacity: active === i ? 1 : 0.4 }}
          />
          {s.temp}
        </div>
      ))}
    </div>
  );
}

export default function QuantumLensLanding() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #050810 0%, #0b0f1a 40%, #060b14 100%)" }}
    >
      <ParticleField />

      {/* ── Glowing orbs background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-[0.07] blur-[120px]"
          style={{
            background: "radial-gradient(circle, #06b6d4, transparent)",
            top: "-10%",
            left: "-5%",
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-[0.06] blur-[100px]"
          style={{
            background: "radial-gradient(circle, #6366f1, transparent)",
            bottom: "5%",
            right: "-5%",
          }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full opacity-[0.05] blur-[80px]"
          style={{
            background: "radial-gradient(circle, #f59e0b, transparent)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      {/* ── Hero ── */}
      <section className="relative z-10 pt-28 pb-16 px-6 text-center max-w-5xl mx-auto">
        {/* Badge */}
        <div
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase border mb-8 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
          style={{
            color: "#38bdf8",
            borderColor: "rgba(56,189,248,0.3)",
            background: "rgba(56,189,248,0.06)",
            backdropFilter: "blur(8px)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Interactive 3D Quantum Hardware
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        </div>

        {/* Headline */}
        <h1
          className={`text-5xl md:text-7xl font-black leading-[1.05] mb-6 transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          style={{
            background: "linear-gradient(135deg, #ffffff 0%, #e2e8f0 30%, #38bdf8 65%, #818cf8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.02em",
          }}
        >
          QuantumLens
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, #06b6d4, #6366f1)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontSize: "0.65em",
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            3D Computer Model
          </span>
        </h1>

        {/* Subheading */}
        <p
          className={`text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-4 leading-relaxed font-light transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          Explore a photorealistic, interactive 3D model of the{" "}
          <span className="text-cyan-300 font-medium">Bluefors LDsl Dilution Cryostat</span>{" "}
          — the quantum computer hardware that houses superconducting qubits near absolute zero.
        </p>

        <TempGradientBar />

        {/* CTA Buttons */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <Link
            to="/quantum-lens/model"
            className="relative group flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold text-base tracking-wide shadow-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/40"
            style={{
              background: "linear-gradient(135deg, #0891b2, #4f46e5)",
              boxShadow: "0 0 32px rgba(8,145,178,0.4), 0 4px 24px rgba(0,0,0,0.5)",
            }}
          >
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08), transparent)" }}
            />
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Launch 3D Viewer
            <svg className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            to="/explore/hardware"
            className="flex items-center gap-2.5 px-6 py-4 rounded-2xl text-slate-300 font-semibold text-sm border border-white/10 hover:border-white/20 hover:text-white transition-all duration-300 hover:bg-white/5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
            Hardware Overview
          </Link>
        </div>

        {/* Stats strip */}
        <div
          className={`flex items-center justify-center gap-8 mt-12 transition-all duration-700 delay-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          {[
            { val: "10", label: "Cryo Stages" },
            { val: "10 mK", label: "Min Temperature" },
            { val: "∞", label: "Exploration" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-black text-white" style={{ fontFamily: "monospace" }}>
                {s.val}
              </div>
              <div className="text-[11px] text-slate-500 uppercase tracking-widest font-medium mt-0.5">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature Cards ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`relative rounded-2xl border p-6 transition-all duration-700 hover:scale-[1.02] hover:shadow-xl ${f.border} ${f.glow}`}
              style={{
                background: `linear-gradient(135deg, ${f.color.replace("from-", "").replace(" to-", ", ")})`,
                backdropFilter: "blur(12px)",
                transitionDelay: `${i * 80}ms`,
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(24px)",
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border border-white/10"
                  style={{ background: "rgba(0,0,0,0.3)" }}
                >
                  {f.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white text-base">{f.title}</h3>
                    <span className="text-[10px] font-mono text-slate-400 border border-slate-600/50 px-1.5 py-0.5 rounded">
                      {f.sub}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Big CTA Banner ── */}
        <div
          className="relative mt-8 rounded-3xl overflow-hidden border border-white/10 text-center py-12 px-8"
          style={{
            background: "linear-gradient(135deg, rgba(8,145,178,0.15), rgba(79,70,229,0.15))",
            backdropFilter: "blur(20px)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 50%, rgba(6,182,212,0.08) 0%, transparent 60%), radial-gradient(circle at 70% 50%, rgba(99,102,241,0.08) 0%, transparent 60%)",
            }}
          />
          <h2 className="text-3xl font-black text-white mb-3 relative">
            Ready to explore the coldest machine on Earth?
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto text-sm relative">
            Rotate, zoom, click any component — and read exactly what it does, why it exists, and how cold it runs.
          </p>
          <Link
            to="/quantum-lens/model"
            className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-white text-base relative transition-all duration-300 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #0891b2, #4f46e5)",
              boxShadow: "0 0 40px rgba(8,145,178,0.35)",
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Open Interactive 3D Model
          </Link>
        </div>
      </section>
    </div>
  );
}
