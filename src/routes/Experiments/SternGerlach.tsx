import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge } from '../../components/UI';
import BlochSphere3D from '../../components/BlochSphere3D';
import LabShell, { TourStep } from '../../components/LabShell';
import { useSound, soundAtomFire, soundSpinUp, soundSpinDown } from '../../hooks/useSound';
import type { BlochVector } from '../../types/quantum';

type Particle = {
  id: number; x: number; y: number; vx: number; vy: number;
  phase: 'source' | 'field' | 'deflecting' | 'done';
  spin?: 'up' | 'down'; color: string;
  trail: { x: number; y: number }[];
};

const W = 900, H = 400;
const SRC_X = 60, FIELD_X1 = W * 0.32, FIELD_X2 = W * 0.60, SCREEN_X = W * 0.86, CY = H / 2;

function hexToRgb(hex: string) {
  return `${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)}`;
}

const TOUR_STEPS: TourStep[] = [
  { id: 'intro', title: 'Quantum Spin', body: 'Silver atoms have an intrinsic property called spin — like a tiny magnet. But unlike classical magnets, it can only point in two directions: up or down.', duration: 6000 },
  { id: 'super', title: 'Superposition State', body: 'In the |+⟩ state, the atom simultaneously has spin-up AND spin-down — both, until measured. Notice the pulsing purple halo around atoms before they hit the field.', duration: 6000 },
  { id: 'field', title: 'The Magnetic Field', body: 'The non-uniform field acts as a "which way?" question. The atom must choose — and the probabilities come from Born\'s rule: P(↑) = |(1+z)/2|.', duration: 6000 },
  { id: 'collapse', title: 'Wavefunction Collapse', body: 'Hit "Fire Atom" to send a single atom. Watch it split at the field and arrive at only one of two spots on the detector — never anywhere else.', duration: 0 },
  { id: 'bloch', title: 'Bloch Sphere', body: 'The sphere on the right shows the quantum state vector. When you fire atoms and they\'re measured, the vector snaps to ±Z. That is collapse.', duration: 5000 },
];

export default function SternGerlach() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>();
  const autoFireRef = useRef<NodeJS.Timeout | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { play } = useSound(soundEnabled);

  const [fieldStrength, setFieldStrength] = useState(1.0);
  const [noise, setNoise] = useState(0.08);
  const [initState, setInitState] = useState<'super' | 'up' | 'down'>('super');
  const [stats, setStats] = useState({ up: 0, down: 0 });
  const [continuous, setContinuous] = useState(false);
  const [lastSpin, setLastSpin] = useState<'up' | 'down' | null>(null);
  const [explanation, setExplanation] = useState('Select a spin state and fire atoms into the magnetic field to observe quantization.');
  const [blochState, setBlochState] = useState<BlochVector>({ x: 1, y: 0, z: 0 });
  const [blochHealth, setBlochHealth] = useState(100);

  const pUp = initState === 'up' ? 1 - noise * 0.5 : initState === 'down' ? noise * 0.5 : 0.5;

  // Set bloch state from initState
  useEffect(() => {
    if (initState === 'super') setBlochState({ x: 1, y: 0, z: 0 });
    else if (initState === 'up') setBlochState({ x: 0, y: 0, z: 1 });
    else setBlochState({ x: 0, y: 0, z: -1 });
    setBlochHealth(100 - noise * 80);
  }, [initState, noise]);

  const fireParticle = useCallback(() => {
    play(soundAtomFire);
    const spin = Math.random() < pUp ? 'up' : 'down';
    const col = initState === 'super' ? '#a78bfa' : initState === 'up' ? '#22d3ee' : '#ef4444';
    particlesRef.current.push({
      id: Date.now() + Math.random(), x: SRC_X + 20, y: CY + (Math.random() - 0.5) * 14,
      vx: 3.6, vy: 0, phase: 'source', spin, color: col, trail: [],
    });
    setExplanation(initState === 'super'
      ? '⚛️ Atom in superposition |+⟩ — spin-up and spin-down simultaneously until the field measures it.'
      : initState === 'up' ? '⬆️ Atom prepared in definite |↑⟩ eigenstate.'
        : '⬇️ Atom prepared in definite |↓⟩ eigenstate.'
    );
  }, [initState, pUp, play]);

  useEffect(() => {
    if (continuous) { autoFireRef.current = setInterval(fireParticle, 300); }
    else { if (autoFireRef.current) clearInterval(autoFireRef.current); }
    return () => { if (autoFireRef.current) clearInterval(autoFireRef.current); };
  }, [continuous, fireParticle]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const deflectionAngle = fieldStrength * 1.4;

    ctx.fillStyle = '#080c14'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.025)'; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Source
    const srcGrad = ctx.createLinearGradient(0, CY - 40, 0, CY + 40);
    srcGrad.addColorStop(0, '#1e3a5f'); srcGrad.addColorStop(1, '#0f2137');
    ctx.fillStyle = srcGrad; ctx.beginPath(); ctx.roundRect(4, CY - 40, SRC_X + 8, 80, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(34,211,238,0.3)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#22d3ee'; ctx.fillRect(SRC_X + 8, CY - 6, 10, 12);
    ctx.fillStyle = 'rgba(100,180,255,0.6)'; ctx.font = 'bold 9px Orbitron, monospace';
    ctx.textAlign = 'center'; ctx.fillText('Ag', SRC_X / 2, CY - 14); ctx.fillText('SOURCE', SRC_X / 2, CY + 26);

    // Beam guide
    ctx.setLineDash([8, 10]); ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(SRC_X + 18, CY); ctx.lineTo(FIELD_X1, CY); ctx.stroke();
    ctx.setLineDash([]);

    // North pole
    const poleGrad = ctx.createLinearGradient(FIELD_X1, 0, FIELD_X2, 0);
    poleGrad.addColorStop(0, '#1a1a3e'); poleGrad.addColorStop(1, '#2a2a5e');
    ctx.fillStyle = poleGrad;
    ctx.beginPath(); ctx.roundRect(FIELD_X1, 10, FIELD_X2 - FIELD_X1, CY - 65, [6, 6, 0, 0]); ctx.fill();
    ctx.strokeStyle = 'rgba(99,102,241,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
    // South pole (wedge for gradient)
    ctx.fillStyle = poleGrad;
    ctx.beginPath(); ctx.moveTo(FIELD_X1, CY + 42); ctx.lineTo(FIELD_X2, CY + 42);
    ctx.lineTo(FIELD_X2, H - 10); ctx.lineTo(FIELD_X1, H - 10); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(239,68,68,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(99,102,241,0.8)'; ctx.font = 'bold 13px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText('N', (FIELD_X1 + FIELD_X2) / 2, 28);
    ctx.fillStyle = 'rgba(239,68,68,0.8)'; ctx.fillText('S', (FIELD_X1 + FIELD_X2) / 2, H - 18);

    // Field region
    const fieldGrad = ctx.createLinearGradient(FIELD_X1, CY - 65, FIELD_X1, CY + 42);
    fieldGrad.addColorStop(0, 'rgba(99,102,241,0.07)'); fieldGrad.addColorStop(1, 'rgba(239,68,68,0.07)');
    ctx.fillStyle = fieldGrad; ctx.fillRect(FIELD_X1, CY - 65, FIELD_X2 - FIELD_X1, 107);

    // B-field arrows
    for (let i = 0; i < 5; i++) {
      const ax = FIELD_X1 + 20 + i * ((FIELD_X2 - FIELD_X1 - 40) / 4);
      const alpha = 0.12 + 0.3 * fieldStrength;
      ctx.strokeStyle = `rgba(34,211,238,${alpha})`; ctx.lineWidth = 1;
      for (let sy = CY - 55; sy < CY + 30; sy += 20) {
        ctx.beginPath(); ctx.moveTo(ax, sy + 14); ctx.lineTo(ax, sy + 2);
        ctx.lineTo(ax - 3, sy + 7); ctx.moveTo(ax, sy + 2); ctx.lineTo(ax + 3, sy + 7); ctx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(34,211,238,0.5)'; ctx.font = '9px Orbitron'; ctx.textAlign = 'left';
    ctx.fillText(`B = ${(fieldStrength * 1.4).toFixed(1)} T`, FIELD_X1 + 6, CY - 68);

    // Screen
    ctx.fillStyle = 'rgba(20,30,50,0.9)'; ctx.fillRect(SCREEN_X, 20, 18, H - 40);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.strokeRect(SCREEN_X, 20, 18, H - 40);
    const upZoneY = CY - 108 - fieldStrength * 28, downZoneY = CY + 62 + fieldStrength * 14;
    ctx.fillStyle = 'rgba(34,211,238,0.12)'; ctx.fillRect(SCREEN_X + 1, upZoneY, 16, 38);
    ctx.fillStyle = 'rgba(239,68,68,0.12)'; ctx.fillRect(SCREEN_X + 1, downZoneY, 16, 38);
    ctx.fillStyle = 'rgba(34,211,238,0.5)'; ctx.font = '8px Orbitron'; ctx.textAlign = 'left';
    ctx.fillText('↑', SCREEN_X + 22, upZoneY + 22); ctx.fillStyle = 'rgba(239,68,68,0.5)'; ctx.fillText('↓', SCREEN_X + 22, downZoneY + 22);

    // Update + draw particles
    particlesRef.current = particlesRef.current.map(p => {
      let { x, y, vx, vy, phase, spin, color, trail } = p;
      trail.push({ x, y }); if (trail.length > 24) trail.shift();

      if (phase === 'source' && x >= FIELD_X1) {
        phase = 'field';
        setExplanation(spin === 'up'
          ? '🔵 Spin-↑: magnetic moment aligns with gradient → deflects UPWARD (F = μ∇B).'
          : '🔴 Spin-↓: opposes gradient → deflects DOWNWARD.');
        setLastSpin(spin!);
        vy = spin === 'up' ? -deflectionAngle : deflectionAngle;
        color = spin === 'up' ? '#22d3ee' : '#ef4444';
        const newBloch: BlochVector = spin === 'up' ? { x: 0, y: 0, z: 1 } : { x: 0, y: 0, z: -1 };
        setBlochState(newBloch);
        if (spin === 'up') play(soundSpinUp); else play(soundSpinDown);
      }
      if (phase === 'field' && x >= FIELD_X2) phase = 'deflecting';
      if (phase === 'deflecting' && x >= SCREEN_X) {
        phase = 'done';
        setStats(s => ({ up: s.up + (spin === 'up' ? 1 : 0), down: s.down + (spin === 'down' ? 1 : 0) }));
        setExplanation(`✅ Wavefunction collapsed → |${spin === 'up' ? '↑⟩ Spin-Up' : '↓⟩ Spin-Down'}. All quantum information about the perpendicular components is destroyed.`);
        setBlochHealth(h => Math.max(10, h - 3));
      }

      const jitter = (Math.random() - 0.5) * noise * (phase === 'source' ? 1.5 : 0.5);
      x += vx; y += vy + jitter;
      return { ...p, x, y, phase, color, trail, vy };
    }).filter(p => p.x < W + 30 && p.phase !== 'done');

    particlesRef.current.forEach(p => {
      // Trail
      for (let i = 1; i < p.trail.length; i++) {
        ctx.strokeStyle = `rgba(${hexToRgb(p.color)},${(i / p.trail.length) * 0.35})`;
        ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y); ctx.lineTo(p.trail[i].x, p.trail[i].y); ctx.stroke();
      }
      // Superposition halo
      if (p.phase === 'source') {
        const pulse = Math.sin(Date.now() / 130 + p.id) * 0.5 + 0.5;
        ctx.beginPath(); ctx.arc(p.x, p.y, 10 + pulse * 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(167,139,250,${0.12 + pulse * 0.2})`; ctx.lineWidth = 1.5; ctx.stroke();
      }
      // Core
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 7);
      grd.addColorStop(0, p.color); grd.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = grd; ctx.shadowBlur = 14; ctx.shadowColor = p.color; ctx.fill(); ctx.shadowBlur = 0;
    });

    rafRef.current = requestAnimationFrame(draw);
  }, [fieldStrength, noise, play]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [draw]);

  const total = stats.up + stats.down;

  return (
    <LabShell tourSteps={TOUR_STEPS} labName="Stern-Gerlach Lab" soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled}>
      <div style={{ background: 'linear-gradient(135deg,#080c14 0%,#0d1220 100%)', minHeight: '100vh', padding: '32px 0' }}>
        <div className="flex flex-col gap-32 max-w-[1100px] mx-auto px-24">

          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-16">
            <div>
              <div className="flex items-center gap-12 mb-8"><span className="text-3xl">🧲</span>
                <div className="text-[10px] font-orbitron text-text-muted uppercase tracking-[3px]">Experiment I</div></div>
              <h1 className="text-4xl font-orbitron font-black tracking-tight"
                style={{ background: 'linear-gradient(90deg,#22d3ee,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Stern–Gerlach Lab
              </h1>
              <p className="text-text-secondary text-sm mt-6 max-w-lg">
                Fire silver atoms through a non-uniform magnetic field. Quantum spin is quantized — only <strong>two outcomes</strong> are ever possible.
              </p>
            </div>
            <div className="flex gap-12">
              <div className="px-20 py-12 rounded-2xl border border-[#22d3ee]/20 bg-[#22d3ee]/5 flex flex-col items-center min-w-[90px]">
                <span className="text-[9px] font-orbitron text-[#22d3ee]/60 uppercase tracking-widest">Spin ↑</span>
                <span className="text-3xl font-mono font-black text-[#22d3ee]">{stats.up}</span>
                <span className="text-[9px] text-text-muted">{total > 0 ? ((stats.up / total) * 100).toFixed(0) : 0}%</span>
              </div>
              <div className="px-20 py-12 rounded-2xl border border-[#ef4444]/20 bg-[#ef4444]/5 flex flex-col items-center min-w-[90px]">
                <span className="text-[9px] font-orbitron text-[#ef4444]/60 uppercase tracking-widest">Spin ↓</span>
                <span className="text-3xl font-mono font-black text-[#ef4444]">{stats.down}</span>
                <span className="text-[9px] text-text-muted">{total > 0 ? ((stats.down / total) * 100).toFixed(0) : 0}%</span>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="rounded-3xl overflow-hidden border border-white/8 relative" style={{ background: '#080c14' }}>
            <canvas ref={canvasRef} width={W} height={H} className="w-full" style={{ display: 'block' }} />
            <div className="absolute top-16 left-20 text-[9px] font-orbitron text-white/25 uppercase tracking-widest">Particle Chamber</div>
            <div className="absolute top-16 right-20 text-[9px] font-orbitron text-white/25 uppercase tracking-widest">Detector Screen</div>
            <AnimatePresence>
              {lastSpin && (
                <motion.div key={lastSpin + total} initial={{ opacity: 0, scale: 0.5, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute bottom-20 left-1/2 -translate-x-1/2 px-16 py-6 rounded-full text-[11px] font-orbitron font-bold uppercase tracking-wider"
                  style={{ background: lastSpin === 'up' ? 'rgba(34,211,238,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${lastSpin === 'up' ? 'rgba(34,211,238,0.4)' : 'rgba(239,68,68,0.4)'}`, color: lastSpin === 'up' ? '#22d3ee' : '#ef4444' }}>
                  Collapsed → |{lastSpin === 'up' ? '↑⟩' : '↓⟩'}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_320px] gap-24">
            {/* Controls */}
            <Card className="p-24 flex flex-col gap-20" style={{ background: 'rgba(20,30,50,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="text-[10px] font-orbitron uppercase tracking-widest text-text-muted">System Configuration</div>
              <div className="grid grid-cols-3 gap-8">
                {(['super', 'up', 'down'] as const).map(s => (
                  <button key={s} onClick={() => setInitState(s)}
                    className={`py-12 rounded-xl border text-xs font-orbitron font-bold transition-all ${initState === s
                      ? s === 'up' ? 'bg-[#22d3ee]/20 border-[#22d3ee] text-[#22d3ee]' : s === 'down' ? 'bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444]' : 'bg-purple-500/20 border-purple-400 text-purple-300'
                      : 'bg-white/5 border-white/10 text-text-muted hover:border-white/20'}`}>
                    {s === 'super' ? '|+⟩' : s === 'up' ? '|↑⟩' : '|↓⟩'}
                  </button>
                ))}
              </div>
              {[
                { label: 'Field Strength (B)', key: 'B', val: fieldStrength, set: setFieldStrength, min: 0.2, max: 2, step: 0.05, color: '#22d3ee', display: `${(fieldStrength * 1.4).toFixed(1)} T` },
                { label: 'Thermal Noise (σ)', key: 'n', val: noise, set: setNoise, min: 0, max: 0.6, step: 0.01, color: '#f59e0b', display: `${(noise * 100).toFixed(0)}%` },
              ].map(({ label, key, val, set, min, max, step, color, display }) => (
                <div className="flex flex-col gap-6" key={key}>
                  <div className="flex justify-between text-[10px] font-orbitron text-text-muted uppercase">
                    <span>{label}</span><span style={{ color }}>{display}</span>
                  </div>
                  <input type="range" min={min} max={max} step={step} value={val}
                    onChange={e => set(+e.target.value)}
                    className="w-full h-4 rounded-full appearance-none cursor-pointer" style={{ accentColor: color }} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-10 mt-2">
                <button onClick={fireParticle} className="py-14 rounded-xl font-orbitron text-xs font-bold uppercase tracking-wider transition-all"
                  style={{ background: 'linear-gradient(135deg,#22d3ee20,#6366f120)', border: '1px solid rgba(34,211,238,0.35)', color: '#22d3ee' }}>
                  ⚛ Fire Atom
                </button>
                <button onClick={() => setContinuous(c => !c)} className="py-14 rounded-xl font-orbitron text-xs font-bold uppercase tracking-wider transition-all"
                  style={{ background: continuous ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)', border: `1px solid ${continuous ? 'rgba(239,68,68,0.4)' : 'rgba(99,102,241,0.3)'}`, color: continuous ? '#ef4444' : '#6366f1' }}>
                  {continuous ? '⏹ Stop' : '▶ Stream'}
                </button>
              </div>
              <button onClick={() => { setStats({ up: 0, down: 0 }); setLastSpin(null); setBlochHealth(100); }}
                className="py-8 rounded-xl text-[10px] font-orbitron text-text-muted uppercase border border-white/5 hover:border-white/20 transition-all">
                ↺ Clear Stats
              </button>
            </Card>

            {/* Probability Panel */}
            <Card className="p-24 flex flex-col gap-16" style={{ background: 'rgba(20,30,50,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="text-[10px] font-orbitron uppercase tracking-widest text-text-muted">Probability & State</div>
              <div className="flex flex-col gap-10">
                {[['P(↑)', pUp, '#22d3ee'], ['P(↓)', 1 - pUp, '#ef4444']].map(([label, val, color]) => (
                  <div key={label as string} className="flex flex-col gap-5">
                    <div className="flex justify-between text-[10px] font-orbitron" style={{ color: color as string }}><span>{label as string}</span><span>{((val as number) * 100).toFixed(0)}%</span></div>
                    <div className="h-10 bg-white/5 rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full" animate={{ width: `${(val as number) * 100}%` }} style={{ background: label === 'P(↑)' ? 'linear-gradient(90deg,#22d3ee,#6366f1)' : '#ef4444' }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-16 rounded-2xl border border-white/5 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <div className="text-[9px] font-orbitron text-text-muted uppercase mb-6">Dirac Notation</div>
                <div className="text-sm font-mono text-purple-300">|ψ⟩ = {Math.sqrt(pUp).toFixed(2)}|↑⟩ + {Math.sqrt(1 - pUp).toFixed(2)}|↓⟩</div>
              </div>
              {total > 0 && (
                <div className="p-14 rounded-2xl border border-white/5" style={{ background: 'rgba(34,211,238,0.04)' }}>
                  <div className="text-[9px] font-orbitron text-text-muted uppercase mb-8 text-center">Empirical ({total} shots)</div>
                  <div className="flex justify-around">
                    <div className="text-center"><div className="text-lg font-mono font-black text-[#22d3ee]">{((stats.up / total) * 100).toFixed(1)}%</div><div className="text-[8px] text-text-muted">Meas. ↑</div></div>
                    <div className="text-center"><div className="text-lg font-mono font-black text-[#ef4444]">{((stats.down / total) * 100).toFixed(1)}%</div><div className="text-[8px] text-text-muted">Meas. ↓</div></div>
                  </div>
                </div>
              )}

              {/* Lab Assistant */}
              <AnimatePresence mode="wait">
                <motion.div key={explanation} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-[11px] text-text-secondary leading-relaxed p-14 rounded-2xl border border-white/5 flex items-center gap-10 mt-2"
                  style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <div className="w-6 h-6 rounded-full bg-[#22d3ee] flex-shrink-0 animate-pulse" />
                  <span>{explanation}</span>
                </motion.div>
              </AnimatePresence>
            </Card>

            {/* Bloch Sphere */}
            <div className="flex flex-col gap-16">
              <Card className="p-0 h-[280px] overflow-hidden relative flex-shrink-0" style={{ background: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="absolute top-12 left-12 z-10"><Badge color="primary">Bloch Sphere</Badge></div>
                <BlochSphere3D state={blochState} health={blochHealth} history={[]} />
                <div className="absolute bottom-10 right-12 z-10 text-[9px] font-mono text-white/25 text-right">
                  <div>[{blochState.x.toFixed(2)}, {blochState.y.toFixed(2)}, {blochState.z.toFixed(2)}]</div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </LabShell>
  );
}
