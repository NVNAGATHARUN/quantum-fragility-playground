import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge } from '../../components/UI';
import { runBell } from '../../api/experiments';
import LabShell, { TourStep } from '../../components/LabShell';
import { useSound, soundEntanglementFire, soundCorrelated, soundAntiCorrelated } from '../../hooks/useSound';
import type { BellOutcomeCounts } from '../../types/quantum';

const CW = 900, CH = 320;

function bellCorrelation(tA: number, tB: number, quality: number) {
  const ideal = Math.pow(Math.cos((tA - tB) * Math.PI / 180 / 2), 2);
  return ideal * quality + 0.5 * (1 - quality);
}

type EntangledPair = {
  id: number; progress: number; measured: boolean;
  aliceResult?: 'up' | 'down'; bobResult?: 'up' | 'down'; correlated: boolean;
};

// ─── Fringe pattern data (built once) ────────────────────────────────────────
const FRINGE_CACHE: Array<{ x: number; alpha: number }> = Array.from({ length: 120 }, (_, i) => ({
  x: i / 119,
  alpha: Math.pow(Math.cos((i / 119) * Math.PI * 5), 2) * 0.35,
}));

const TOUR_STEPS: TourStep[] = [
  { id: 'intro', title: 'Quantum Entanglement', body: 'The source emits pairs of photons in the Bell state |Φ⁺⟩ = (|00⟩+|11⟩)/√2. No matter how far apart, their fates are linked.', duration: 6000 },
  { id: 'angles', title: 'Detector Angles', body: 'Alice and Bob each choose a measurement angle (θA, θB). The correlation depends only on the difference Δθ — not on any shared hidden variables.', duration: 6000 },
  { id: 'violation', title: "Bell's Theorem", body: 'Set θA=0°, θB=45°. Quantum mechanics predicts P(same) = cos²(22.5°) ≈ 85%. Classical hidden variable theories cap out at 75%. Nature breaks the classical bound!', duration: 0 },
  { id: 'fringes', title: 'Interference Fringes', body: 'Notice the glowing wave pattern behind the particles? That represents the quantum wave function — both paths exist until measurement. The fringe visibility drops with entanglement quality.', duration: 6000 },
  { id: 'fire', title: 'Try It', body: 'Hit "Stream" and watch the correlations build in real time. Then drag θB to 90° — correlations drop exactly to 50%, just as QM predicts.', duration: 0 },
];

export default function BellState() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const pairsRef = useRef<EntangledPair[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { play } = useSound(soundEnabled);

  const [angleA, setAngleA] = useState(0);
  const [angleB, setAngleB] = useState(45);
  const [quality, setQuality] = useState(1.0);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({ same: 0, diff: 0 });
  const [apiShots, setApiShots] = useState(512);
  const [apiResults, setApiResults] = useState<BellOutcomeCounts | null>(null);
  const [loadingApi, setLoadingApi] = useState(false);
  const [lastResult, setLastResult] = useState<{ a: 'up' | 'down'; b: 'up' | 'down'; corr: boolean } | null>(null);

  const pSame = bellCorrelation(angleA, angleB, quality);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const cx = CW / 2, cy = CH / 2;
    const aliceX = 80, bobX = CW - 80;

    ctx.fillStyle = '#080c14'; ctx.fillRect(0, 0, CW, CH);
    ctx.strokeStyle = 'rgba(255,255,255,0.022)'; ctx.lineWidth = 1;
    for (let x = 0; x < CW; x += 70) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CH); ctx.stroke(); }
    for (let y = 0; y < CH; y += 70) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke(); }

    // ── Interference fringes (wave-particle duality) ──────────────────────
    const fringeAlpha = quality * 0.7;
    if (fringeAlpha > 0.04) {
      FRINGE_CACHE.forEach(({ x, alpha }) => {
        const fx = aliceX + x * (bobX - aliceX);
        const g = ctx.createLinearGradient(fx, cy - 50, fx, cy + 50);
        g.addColorStop(0, `rgba(99,102,241,0)`);
        g.addColorStop(0.5, `rgba(99,102,241,${alpha * fringeAlpha})`);
        g.addColorStop(1, `rgba(99,102,241,0)`);
        ctx.fillStyle = g; ctx.fillRect(fx - 2, cy - 50, 4, 100);
      });
    }

    // ── Source ────────────────────────────────────────────────────────────
    const pulse = Math.sin(Date.now() / 380) * 0.5 + 0.5;
    ctx.beginPath(); ctx.arc(cx, cy, 32 + pulse * 8, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(251,191,36,${0.07 + pulse * 0.12})`; ctx.lineWidth = 1; ctx.stroke();
    const sGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
    sGrd.addColorStop(0, 'rgba(251,191,36,0.9)'); sGrd.addColorStop(0.5, 'rgba(251,100,36,0.5)'); sGrd.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fillStyle = sGrd;
    ctx.shadowBlur = 18 + pulse * 10; ctx.shadowColor = '#fbbf24'; ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(251,191,36,0.8)'; ctx.font = 'bold 9px Orbitron,monospace'; ctx.textAlign = 'center';
    ctx.fillText('|Φ⁺⟩', cx, cy + 38); ctx.fillText('SOURCE', cx, cy + 50);

    // Beam lines
    ctx.setLineDash([10, 8]); ctx.strokeStyle = 'rgba(251,191,36,0.07)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(aliceX, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(bobX, cy); ctx.stroke();
    ctx.setLineDash([]);

    // ── Detectors ─────────────────────────────────────────────────────────
    drawDetector(ctx, aliceX, cy, angleA, 'ALICE', '#22d3ee', lastResult?.a);
    drawDetector(ctx, bobX, cy, angleB, 'BOB', '#a78bfa', lastResult?.b);

    // ── Particles ─────────────────────────────────────────────────────────
    pairsRef.current = pairsRef.current.map(pair => {
      if (pair.measured) return pair;
      pair.progress = Math.min(1, pair.progress + 0.018);
      if (pair.progress >= 1 && !pair.measured) {
        pair.measured = true;
        pair.aliceResult = Math.random() < 0.5 ? 'up' : 'down';
        pair.bobResult = Math.random() < pSame ? pair.aliceResult : (pair.aliceResult === 'up' ? 'down' : 'up');
        pair.correlated = pair.aliceResult === pair.bobResult;
        setLastResult({ a: pair.aliceResult, b: pair.bobResult, corr: pair.correlated });
        setStats(s => ({ same: s.same + (pair.correlated ? 1 : 0), diff: s.diff + (!pair.correlated ? 1 : 0) }));
        if (pair.correlated) play(soundCorrelated); else play(soundAntiCorrelated);
      }
      return pair;
    }).filter(p => !(p.measured));

    pairsRef.current.forEach(pair => {
      if (pair.measured) return;
      const leftX = cx + (aliceX - cx) * pair.progress;
      const rightX = cx + (bobX - cx) * pair.progress;

      // Entanglement cord
      const ent = (1 - pair.progress) * 0.32;
      const crd = ctx.createLinearGradient(leftX, cy, rightX, cy);
      crd.addColorStop(0, `rgba(34,211,238,${ent})`);
      crd.addColorStop(0.5, `rgba(251,191,36,${ent * 1.4})`);
      crd.addColorStop(1, `rgba(167,139,250,${ent})`);
      ctx.beginPath(); ctx.moveTo(leftX, cy); ctx.lineTo(rightX, cy);
      ctx.strokeStyle = crd; ctx.lineWidth = 1.5 + (1 - pair.progress); ctx.stroke();

      drawParticle(ctx, leftX, cy, '#22d3ee');
      drawParticle(ctx, rightX, cy, '#a78bfa');
    });

    // Overlay text
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.font = '8px Orbitron,monospace'; ctx.textAlign = 'left';
    ctx.fillText(`|Φ⁺⟩  θA=${angleA}°  θB=${angleB}°  Q=${(quality * 100).toFixed(0)}%`, 14, 14);

    rafRef.current = requestAnimationFrame(drawFrame);
  }, [angleA, angleB, quality, pSame, lastResult, play]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(drawFrame);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [drawFrame]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      pairsRef.current.push({ id: Date.now() + Math.random(), progress: 0, measured: false, correlated: false });
    }, 420);
    return () => clearInterval(id);
  }, [running]);

  const firePair = () => {
    play(soundEntanglementFire);
    pairsRef.current.push({ id: Date.now() + Math.random(), progress: 0, measured: false, correlated: false });
  };

  const handleApiRun = async () => {
    setLoadingApi(true);
    try { setApiResults(await runBell(apiShots)); } catch (e) { console.error(e); }
    setLoadingApi(false);
  };

  const total = stats.same + stats.diff;
  const measuredPSame = total > 0 ? stats.same / total : null;
  const bellViolation = measuredPSame !== null && measuredPSame > 0.75 && Math.abs(angleA - angleB) > 10;

  return (
    <LabShell tourSteps={TOUR_STEPS} labName="Bell State Lab" soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled}>
      <div style={{ background: 'linear-gradient(135deg,#080c14 0%,#0d1220 100%)', minHeight: '100vh', padding: '32px 0' }}>
        <div className="flex flex-col gap-32 max-w-[1100px] mx-auto px-24">

          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-16">
            <div>
              <div className="flex items-center gap-12 mb-8"><span className="text-3xl">🔔</span>
                <div className="text-[10px] font-orbitron text-text-muted uppercase tracking-[3px]">Experiment III</div></div>
              <h1 className="text-4xl font-orbitron font-black tracking-tight"
                style={{ background: 'linear-gradient(90deg,#fbbf24,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Bell State Lab
              </h1>
              <p className="text-text-secondary text-sm mt-6 max-w-lg">
                Entangled photon pairs prove no local hidden variable can explain their correlations. <strong>Bell's inequality is violated by nature itself.</strong>
              </p>
            </div>
            <div className="flex gap-12">
              <div className="px-20 py-12 rounded-2xl border border-[#fbbf24]/20 bg-[#fbbf24]/5 flex flex-col items-center min-w-[120px]">
                <span className="text-[9px] font-orbitron text-[#fbbf24]/60 uppercase tracking-widest mb-1">Predicted P(same)</span>
                <span className="text-3xl font-mono font-black text-[#fbbf24]">{(pSame * 100).toFixed(0)}%</span>
              </div>
              {measuredPSame !== null && (
                <div className={`px-20 py-12 rounded-2xl flex flex-col items-center min-w-[120px] border ${bellViolation ? 'border-[#22d3ee]/40 bg-[#22d3ee]/8' : 'border-white/10 bg-white/5'}`}>
                  <span className="text-[9px] font-orbitron text-text-muted uppercase tracking-widest mb-1">Measured P(same)</span>
                  <span className="text-3xl font-mono font-black text-white">{(measuredPSame * 100).toFixed(0)}%</span>
                  {bellViolation && <span className="text-[8px] text-[#22d3ee] font-orbitron mt-2">✓ Bell Violated!</span>}
                </div>
              )}
            </div>
          </div>

          {/* Canvas */}
          <div className="rounded-3xl overflow-hidden border border-white/8 relative" style={{ background: '#080c14' }}>
            <canvas ref={canvasRef} width={CW} height={CH} className="w-full" style={{ display: 'block' }} />
            <AnimatePresence>
              {lastResult && (
                <motion.div key={`${lastResult.a}-${lastResult.b}-${total}`}
                  initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
                  className="absolute bottom-16 left-1/2 -translate-x-1/2 px-20 py-8 rounded-full font-orbitron text-[11px] font-bold uppercase tracking-wider flex items-center gap-10"
                  style={{ background: lastResult.corr ? 'rgba(34,211,238,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${lastResult.corr ? 'rgba(34,211,238,0.4)' : 'rgba(239,68,68,0.3)'}`, color: lastResult.corr ? '#22d3ee' : '#ef4444' }}>
                  <span style={{ color: '#22d3ee' }}>Alice: {lastResult.a === 'up' ? '↑' : '↓'}</span>
                  <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
                  <span style={{ color: '#a78bfa' }}>Bob: {lastResult.b === 'up' ? '↑' : '↓'}</span>
                  <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
                  <span>{lastResult.corr ? '✓ CORRELATED' : '✗ ANTI-CORR'}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-24">
            {/* Angle Controls */}
            <Card className="p-24 flex flex-col gap-20" style={{ background: 'rgba(20,30,50,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="text-[10px] font-orbitron uppercase tracking-widest text-text-muted">Detector Configuration</div>
              {[
                { label: 'Alice Angle (θA)', val: angleA, set: setAngleA, color: '#22d3ee' },
                { label: 'Bob Angle (θB)', val: angleB, set: setAngleB, color: '#a78bfa' },
                { label: 'Entanglement Quality', val: quality, set: setQuality, color: '#fbbf24', min: 0, max: 1, step: 0.01, display: `${(quality * 100).toFixed(0)}%` },
              ].map(({ label, val, set, color, min = 0, max = label.includes('Angle') ? 180 : 1, step = label.includes('Angle') ? 5 : 0.01, display = `${val}°` }) => (
                <div key={label} className="flex flex-col gap-6">
                  <div className="flex justify-between text-[10px] font-orbitron"><span style={{ color }}>{label}</span><span style={{ color }}>{display}</span></div>
                  <input type="range" min={min} max={max} step={step} value={val}
                    onChange={e => set(+e.target.value as any)}
                    className="w-full h-4 rounded-full appearance-none cursor-pointer" style={{ accentColor: color }} />
                </div>
              ))}
              <div className="p-12 rounded-xl border border-white/5 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <div className="text-[9px] font-orbitron text-text-muted uppercase mb-4">P(same) = cos²(Δθ/2)</div>
                <div className="text-lg font-mono text-[#fbbf24]">{(pSame * 100).toFixed(1)}%</div>
                <div className="text-[8px] text-text-muted mt-3">Δθ = {Math.abs(angleA - angleB)}°</div>
              </div>
              <div className="grid grid-cols-2 gap-10">
                <button onClick={firePair} className="py-12 rounded-xl font-orbitron text-xs font-bold uppercase transition-all" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.35)', color: '#fbbf24' }}>✦ Fire Pair</button>
                <button onClick={() => setRunning(r => !r)} className="py-12 rounded-xl font-orbitron text-xs font-bold uppercase transition-all" style={{ background: running ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)', color: running ? '#ef4444' : '#6366f1', border: `1px solid ${running ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)'}` }}>{running ? '⏹ Stop' : '▶ Stream'}</button>
              </div>
              <button onClick={() => setStats({ same: 0, diff: 0 })} className="py-8 rounded-xl text-[10px] font-orbitron text-text-muted uppercase border border-white/5 hover:border-white/20 transition-all">↺ Clear Stats</button>
            </Card>

            {/* Statistics */}
            <Card className="p-24 flex flex-col gap-16" style={{ background: 'rgba(20,30,50,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="text-[10px] font-orbitron uppercase tracking-widest text-text-muted">Correlation Statistics</div>
              {[
                { label: 'Same Outcome', val: total > 0 ? stats.same / total : 0, color: '#22d3ee', count: stats.same },
                { label: 'Different Outcome', val: total > 0 ? stats.diff / total : 0, color: '#ef4444', count: stats.diff },
              ].map(({ label, val, color, count }) => (
                <div key={label} className="flex flex-col gap-6">
                  <div className="flex justify-between text-[10px] font-orbitron" style={{ color }}><span>{label}</span><span>{(val * 100).toFixed(1)}%</span></div>
                  <div className="h-10 bg-white/5 rounded-full overflow-hidden"><motion.div className="h-full rounded-full" animate={{ width: `${val * 100}%` }} style={{ background: color }} /></div>
                  <div className="text-[9px] text-text-muted">{count} pairs</div>
                </div>
              ))}
              <div className="p-14 rounded-xl border border-white/5 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <div className="text-[9px] font-orbitron text-text-muted uppercase mb-4">Classical Max (CHSH)</div>
                <div className="text-sm font-mono text-[#fbbf24]">P(same) ≤ 75%</div>
                {bellViolation && <div className="text-[9px] text-[#22d3ee] font-orbitron mt-6">⚡ Bell's Theorem Violated!</div>}
              </div>
              <div>
                <div className="text-[9px] font-orbitron text-text-muted uppercase mb-8">Quick Angle Presets</div>
                <div className="grid grid-cols-2 gap-8">
                  {[{ label: 'Perfect (100%)', a: 0, b: 0 }, { label: 'Optimal (85%)', a: 0, b: 22 }, { label: 'Classic (75%)', a: 0, b: 45 }, { label: 'Noise (50%)', a: 0, b: 90 }].map(p => (
                    <button key={p.label} onClick={() => { setAngleA(p.a); setAngleB(p.b); }}
                      className="py-8 rounded-lg text-[9px] font-orbitron border border-white/5 hover:border-white/20 transition-all text-text-muted hover:text-white">{p.label}</button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Backend + Physics */}
            <div className="flex flex-col gap-16">
              <Card className="p-24 flex flex-col gap-16" style={{ background: 'rgba(20,30,50,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="text-[10px] font-orbitron uppercase tracking-widest text-text-muted">Backend Simulation (API)</div>
                <div className="flex flex-col gap-8">
                  <div className="flex justify-between text-[10px] font-orbitron text-text-muted uppercase"><span>Shots</span><span className="text-[#fbbf24]">{apiShots}</span></div>
                  <input type="range" min={100} max={4096} step={100} value={apiShots} onChange={e => setApiShots(+e.target.value)} className="w-full h-4 rounded-full appearance-none cursor-pointer" style={{ accentColor: '#fbbf24' }} />
                </div>
                <button onClick={handleApiRun} disabled={loadingApi} className="py-12 rounded-xl font-orbitron text-xs font-bold uppercase border transition-all"
                  style={{ background: 'rgba(251,191,36,0.1)', borderColor: 'rgba(251,191,36,0.3)', color: '#fbbf24', opacity: loadingApi ? 0.6 : 1 }}>
                  {loadingApi ? '⏳ Computing...' : '⚡ Run Full Experiment'}
                </button>
                {apiResults && (
                  <div className="flex flex-col gap-6">
                    {(['00', '01', '10', '11'] as const).map(key => {
                      const val = apiResults[key] || 0, pct = (val / apiShots) * 100, isCorr = key === '00' || key === '11';
                      return <div key={key} className="flex flex-col gap-3">
                        <div className="flex justify-between text-[9px] font-mono" style={{ color: isCorr ? '#22d3ee' : 'rgba(255,255,255,0.25)' }}>
                          <span>|{key}⟩</span><span>{pct.toFixed(1)}%</span>
                        </div>
                        <div className="h-5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full rounded-full" style={{ background: isCorr ? 'linear-gradient(90deg,#6366f1,#22d3ee)' : 'rgba(239,68,68,0.3)' }} />
                        </div>
                      </div>;
                    })}
                  </div>
                )}
              </Card>
              <Card className="p-20 flex flex-col gap-12" style={{ background: 'rgba(20,30,50,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="text-[9px] font-orbitron text-[#fbbf24] uppercase tracking-widest">Bell's Theorem (1964)</div>
                <p className="text-[10px] text-text-muted leading-relaxed">If particles had <em>pre-determined local hidden variables</em>, measurements could never correlate beyond <strong>75%</strong> at the optimal angle.</p>
                <p className="text-[10px] text-text-muted leading-relaxed">QM predicts and experiments confirm <strong>cos²(22.5°) ≈ 85%</strong>. Einstein's "local realism" is ruled out.</p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </LabShell>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function drawDetector(ctx: CanvasRenderingContext2D, x: number, cy: number, angle: number, label: string, color: string, result?: 'up' | 'down') {
  const rad = angle * Math.PI / 180;
  const len = 52;
  ctx.fillStyle = 'rgba(25,35,65,0.85)'; ctx.strokeStyle = `${color}40`; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(x - 28, cy - 50, 56, 100, 10); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = color;
  ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x + Math.cos(rad - Math.PI / 2) * len, cy + Math.sin(rad - Math.PI / 2) * len); ctx.stroke(); ctx.shadowBlur = 0;
  ctx.strokeStyle = `${color}30`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, cy, 24, -Math.PI / 2, rad - Math.PI / 2, false); ctx.stroke();
  ctx.fillStyle = result ? result === 'up' ? '#22d3ee' : '#ef4444' : 'rgba(255,255,255,0.1)';
  ctx.font = result ? 'bold 16px monospace' : '12px monospace'; ctx.textAlign = 'center'; ctx.fillText(result ? (result === 'up' ? '↑' : '↓') : '?', x, cy + 8);
  ctx.fillStyle = `${color}90`; ctx.font = 'bold 9px Orbitron,monospace'; ctx.textAlign = 'center'; ctx.fillText(label, x, cy + 68);
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.font = '8px monospace'; ctx.fillText(`θ=${angle}°`, x, cy + 80);
}

function drawParticle(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, 10);
  g.addColorStop(0, color); g.addColorStop(1, 'transparent');
  ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fillStyle = g;
  ctx.shadowBlur = 14; ctx.shadowColor = color; ctx.fill(); ctx.shadowBlur = 0;
}
