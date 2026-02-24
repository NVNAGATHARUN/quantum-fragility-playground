import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, Badge } from '../../components/UI';
import LabShell, { TourStep } from '../../components/LabShell';
import { useSound, soundPhotonPop, soundRabiPeak, startCavityHum, updateCavityHum, stopCavityHum } from '../../hooks/useSound';

const W = 900, H = 320;

const TOUR_STEPS: TourStep[] = [
    { id: 'intro', title: 'Atom in a Box of Light', body: 'Cavity QED studies a single atom trapped between two perfect mirrors. The atom and the photons it traps can exchange energy back and forth — quantum mechanically.', duration: 6000 },
    { id: 'strong', title: 'Strong Coupling Regime', body: 'When g (coupling) >> γ, κ (decay rates), the atom-photon system oscillates coherently. You\'ll see Rabi oscillations — perfect quantum swaps — on the chart.', duration: 5000, action: undefined },
    { id: 'rabi', title: 'Rabi Oscillations', body: 'The graph shows Rabi flopping: excitation passes from atom → photon → atom → photon… endlessly in ideal conditions. This is quantum coherence.', duration: 6000 },
    { id: 'decay', title: 'Decoherence', body: 'Try increasing γ or κ. The oscillations die — the quantum state leaks into the environment. This is decoherence, the enemy of quantum computing.', duration: 0 },
];

export default function CavityQed() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>();
    const stateRef = useRef({ Pe: 1.0, Pg: 0.0, t: 0.0 });
    const animRef = useRef({ paused: false });
    const lastRabiPeakRef = useRef(0);

    const [soundEnabled, setSoundEnabled] = useState(true);
    const { play } = useSound(soundEnabled);
    const [params, setParams] = useState({ g: 1.0, gamma: 0.05, kappa: 0.05, speed: 1.0 });
    const [paused, setPaused] = useState(false);
    const [chartData, setChartData] = useState<{ t: number; Pe: number; Pg: number }[]>([]);
    const [regime, setRegime] = useState<'strong' | 'weak'>('strong');

    useEffect(() => {
        setRegime(params.g > (params.gamma + params.kappa) * 1.5 ? 'strong' : 'weak');
    }, [params]);

    // Sound: cavity hum driven by Rabi freq
    useEffect(() => {
        if (!soundEnabled) { stopCavityHum(); return; }
        startCavityHum(110 * params.g);
        return () => stopCavityHum();
    }, [soundEnabled, params.g]);

    useEffect(() => {
        if (soundEnabled) updateCavityHum(110 * params.g, stateRef.current.Pe);
    }, [params.g, soundEnabled]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;

        // Physics step
        if (!animRef.current.paused) {
            const dt = 0.015 * params.speed;
            const { Pe, Pg, t } = stateRef.current;
            const dPe = -params.g * 2 * Math.sqrt(Pe * Pg) * Math.sin(params.g * t * 2) - params.gamma * Pe;
            const dPg = params.g * 2 * Math.sqrt(Pe * Pg) * Math.sin(params.g * t * 2) - params.kappa * Pg;
            let newPe = Math.max(0, Math.min(1, Pe + dPe * dt));
            let newPg = Math.max(0, Math.min(1, Pg + dPg * dt));
            const sum = newPe + newPg;
            if (sum > 0) { newPe /= sum; newPg /= sum; }
            stateRef.current = { Pe: newPe, Pg: newPg, t: t + dt };

            // Rabi peak sound + photon pop
            if (newPg > 0.92 && lastRabiPeakRef.current < t - 2) {
                play(() => soundRabiPeak(220 * params.g));
                lastRabiPeakRef.current = stateRef.current.t;
            }
            if (newPe > 0.92 && lastRabiPeakRef.current < t - 2) {
                play(soundPhotonPop);
                lastRabiPeakRef.current = stateRef.current.t;
            }

            setChartData(prev => {
                const next = [...prev.slice(-120), { t: parseFloat(t.toFixed(2)), Pe: parseFloat(newPe.toFixed(3)), Pg: parseFloat(newPg.toFixed(3)) }];
                return next;
            });
            if (soundEnabled) updateCavityHum(110 * params.g, newPe);
        }

        const { Pe, Pg, t } = stateRef.current;

        // Background
        ctx.fillStyle = '#080c14'; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(255,255,255,0.025)'; ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        const cavityX = W * 0.15, cavityW = W * 0.7, cy = H / 2;
        const endX = cavityX + cavityW;

        // Mirror glow rings
        for (let side of [cavityX - 4, endX + 4]) {
            const gr = ctx.createRadialGradient(side, cy, 0, side, cy, 80);
            gr.addColorStop(0, 'rgba(99,102,241,0.06)'); gr.addColorStop(1, 'transparent');
            ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(side, cy, 80, 0, Math.PI * 2); ctx.fill();
        }

        // Mirrors — 3D layered effect
        const drawMirror = (x: number) => {
            // Shadow depth layer
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath();
            ctx.roundRect(x + 3, 30, 18, H - 60, 5); ctx.fill();
            // Back face
            const mg1 = ctx.createLinearGradient(x, 0, x + 18, 0);
            mg1.addColorStop(0, '#1a1a40'); mg1.addColorStop(1, '#0d0d28');
            ctx.fillStyle = mg1; ctx.beginPath(); ctx.roundRect(x, 30, 18, H - 60, 5); ctx.fill();
            // Reflective surface stripe
            const mg2 = ctx.createLinearGradient(x, 30, x + 18, 30);
            mg2.addColorStop(0, 'rgba(255,255,255,0.0)');
            mg2.addColorStop(0.3, 'rgba(255,255,255,0.25)');
            mg2.addColorStop(0.6, 'rgba(99,102,241,0.2)');
            mg2.addColorStop(1, 'rgba(255,255,255,0.0)');
            ctx.fillStyle = mg2; ctx.beginPath(); ctx.roundRect(x, 30, 18, H - 60, 5); ctx.fill();
            // Edge highlight
            ctx.strokeStyle = 'rgba(99,102,241,0.55)'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.roundRect(x, 30, 18, H - 60, 5); ctx.stroke();
            // Scan lines on mirror
            ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
            for (let sy = 40; sy < H - 50; sy += 12) {
                ctx.beginPath(); ctx.moveTo(x + 2, sy); ctx.lineTo(x + 16, sy); ctx.stroke();
            }
        };
        drawMirror(cavityX - 18);
        drawMirror(endX);

        // ── Standing Wave Field ───────────────────────────────────────────────
        const waveAmplitude = Pg * 42;
        if (waveAmplitude > 1) {
            for (let yi = 0; yi <= 4; yi++) {
                const lineY = cy - 50 + yi * 25;
                ctx.beginPath();
                for (let xi = 0; xi <= cavityW; xi += 2) {
                    const nx = cavityX + xi;
                    const wave = Math.sin((xi / cavityW) * Math.PI * 6) * waveAmplitude
                        * Math.sin(t * params.g * 2.5)
                        * ((cy - Math.abs(lineY - cy) / (H / 2)) / cy);
                    const yp = lineY + wave * 0.3;
                    xi === 0 ? ctx.moveTo(nx, yp) : ctx.lineTo(nx, yp);
                }
                const alpha = 0.08 + Pg * 0.25;
                ctx.strokeStyle = `rgba(99,102,241,${alpha})`; ctx.lineWidth = 1; ctx.stroke();
            }
        }

        // ── Atom ──────────────────────────────────────────────────────────────
        const atomX = W / 2, atomR = 22 + Pe * 8;
        // Core glow
        const atomGrd = ctx.createRadialGradient(atomX, cy, 0, atomX, cy, atomR + 12);
        atomGrd.addColorStop(0, `rgba(251,191,36,${0.4 + Pe * 0.5})`);
        atomGrd.addColorStop(0.5, `rgba(234,88,12,${0.25 * Pe})`);
        atomGrd.addColorStop(1, 'transparent');
        ctx.fillStyle = atomGrd; ctx.beginPath(); ctx.arc(atomX, cy, atomR + 12, 0, Math.PI * 2); ctx.fill();
        // Nucleus
        const nuclGrd = ctx.createRadialGradient(atomX, cy, 0, atomX, cy, atomR);
        nuclGrd.addColorStop(0, `rgba(251,191,36,${0.7 + Pe * 0.3})`);
        nuclGrd.addColorStop(1, `rgba(234,88,12,${0.3 + Pe * 0.4})`);
        ctx.fillStyle = nuclGrd;
        ctx.shadowBlur = 20 + Pe * 18; ctx.shadowColor = '#fbbf24';
        ctx.beginPath(); ctx.arc(atomX, cy, atomR * 0.55, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;

        // Orbiting electron
        const eAngle = t * 3.5;
        const eR = atomR + 5;
        const eX = atomX + Math.cos(eAngle) * eR;
        const eY = cy + Math.sin(eAngle) * eR * 0.45;
        ctx.beginPath(); ctx.ellipse(atomX, cy, eR, eR * 0.45, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(251,191,36,${0.12 + Pe * 0.2})`; ctx.lineWidth = 1; ctx.stroke();
        const eGrd = ctx.createRadialGradient(eX, eY, 0, eX, eY, 5);
        eGrd.addColorStop(0, '#ffffff'); eGrd.addColorStop(1, 'transparent');
        ctx.fillStyle = eGrd; ctx.shadowBlur = 8; ctx.shadowColor = '#fff';
        ctx.beginPath(); ctx.arc(eX, eY, 4, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;

        // Atom state label
        ctx.fillStyle = `rgba(251,191,36,${0.7 + Pe * 0.3})`; ctx.font = 'bold 11px Orbitron, monospace';
        ctx.textAlign = 'center'; ctx.fillText(Pe > 0.5 ? '|e⟩' : '|g⟩', atomX, cy - atomR - 14);

        // ── Photon packet ─────────────────────────────────────────────────────
        if (Pg > 0.06) {
            const photonX = cavityX + 15 + ((Math.sin(t * params.g * 1.4 + 1.5) + 1) / 2) * (cavityW - 30);
            const photonR = 9 + Pg * 8;
            const photGrd = ctx.createRadialGradient(photonX, cy, 0, photonX, cy, photonR + 12);
            photGrd.addColorStop(0, `rgba(34,211,238,${0.8 * Pg})`);
            photGrd.addColorStop(0.5, `rgba(99,102,241,${0.4 * Pg})`);
            photGrd.addColorStop(1, 'transparent');
            ctx.fillStyle = photGrd;
            ctx.shadowBlur = 20 * Pg; ctx.shadowColor = '#22d3ee';
            ctx.beginPath(); ctx.arc(photonX, cy, photonR, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
            // Photon crossing lines
            for (let a = 0; a < Math.PI; a += Math.PI / 4) {
                const s = Math.sin(a), c2 = Math.cos(a);
                ctx.strokeStyle = `rgba(34,211,238,${0.3 * Pg})`; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(photonX + c2 * (photonR - 2), cy + s * (photonR - 2));
                ctx.lineTo(photonX - c2 * (photonR - 2), cy - s * (photonR - 2)); ctx.stroke();
            }
            ctx.fillStyle = `rgba(34,211,238,${0.7 * Pg})`; ctx.font = '9px Orbitron'; ctx.textAlign = 'center';
            ctx.fillText('γ', photonX, cy + photonR + 14);
        }

        // Regime label
        ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.font = '8px Orbitron'; ctx.textAlign = 'left';
        ctx.fillText(`Cavity QED  |  g=${params.g.toFixed(2)}  γ=${params.gamma.toFixed(2)}  κ=${params.kappa.toFixed(2)}`, 14, 16);
        ctx.textAlign = 'right';
        ctx.fillText(`t = ${stateRef.current.t.toFixed(1)} ħ/g`, W - 14, 16);

        rafRef.current = requestAnimationFrame(draw);
    }, [params, play, soundEnabled]);

    useEffect(() => {
        animRef.current.paused = paused;
    }, [paused]);

    useEffect(() => {
        rafRef.current = requestAnimationFrame(draw);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); stopCavityHum(); };
    }, [draw]);

    const reset = () => {
        stateRef.current = { Pe: 1.0, Pg: 0.0, t: 0.0 }; setChartData([]); lastRabiPeakRef.current = 0;
    };

    const { Pe, Pg } = stateRef.current;

    return (
        <LabShell tourSteps={TOUR_STEPS} labName="Cavity QED Lab" soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled}>
            <div style={{ background: 'linear-gradient(135deg,#080c14 0%,#0d1220 100%)', minHeight: '100vh', padding: '32px 0' }}>
                <div className="flex flex-col gap-32 max-w-[1100px] mx-auto px-24">

                    {/* Header */}
                    <div className="flex flex-wrap items-end justify-between gap-16">
                        <div>
                            <div className="flex items-center gap-12 mb-8"><span className="text-3xl">💎</span>
                                <div className="text-[10px] font-orbitron text-text-muted uppercase tracking-[3px]">Experiment II</div></div>
                            <h1 className="text-4xl font-orbitron font-black tracking-tight"
                                style={{ background: 'linear-gradient(90deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Cavity QED Lab
                            </h1>
                            <p className="text-text-secondary text-sm mt-6 max-w-lg">
                                A single atom trapped between perfect mirrors, exchanging energy with confined photons — governed by the <strong>Jaynes–Cummings model</strong>.
                            </p>
                        </div>
                        <div className="flex gap-12">
                            {[
                                { label: 'Atom Excited (Pe)', val: Pe, color: '#fbbf24' },
                                { label: 'Photon Pop (Pg)', val: Pg, color: '#22d3ee' },
                            ].map(({ label, val, color }) => (
                                <div key={label} className="px-20 py-12 rounded-2xl flex flex-col items-center min-w-[120px] border border-white/10 bg-white/5">
                                    <span className="text-[9px] font-orbitron uppercase tracking-widest mb-1" style={{ color }}>{label}</span>
                                    <span className="text-3xl font-mono font-black" style={{ color }}>{(val * 100).toFixed(0)}%</span>
                                </div>
                            ))}
                            <div className="px-16 py-12 rounded-2xl flex flex-col items-center justify-center min-w-[100px] border border-white/10 bg-white/5">
                                <Badge color={regime === 'strong' ? 'cyan' : 'purple'}>{regime.toUpperCase()}</Badge>
                                <span className="text-[8px] text-text-muted mt-4">Coupling</span>
                            </div>
                        </div>
                    </div>

                    {/* Canvas */}
                    <div className="rounded-3xl overflow-hidden border border-white/8" style={{ background: '#080c14' }}>
                        <canvas ref={canvasRef} width={W} height={H} className="w-full" style={{ display: 'block' }} />
                    </div>

                    {/* Controls + Chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-24">
                        <Card className="p-24 flex flex-col gap-20" style={{ background: 'rgba(20,30,50,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
                            <div className="text-[10px] font-orbitron uppercase tracking-widest text-text-muted">System Parameters</div>
                            {([
                                { label: 'Coupling Strength (g)', key: 'g', min: 0.1, max: 3, step: 0.05, color: '#22d3ee' },
                                { label: 'Atomic Decay (γ)', key: 'gamma', min: 0, max: 1, step: 0.01, color: '#f59e0b' },
                                { label: 'Photon Leakage (κ)', key: 'kappa', min: 0, max: 1, step: 0.01, color: '#ef4444' },
                                { label: 'Simulation Speed', key: 'speed', min: 0.2, max: 4, step: 0.1, color: '#a78bfa' },
                            ] as const).map(({ label, key, min, max, step, color }) => (
                                <div key={key} className="flex flex-col gap-6">
                                    <div className="flex justify-between text-[10px] font-orbitron text-text-muted uppercase">
                                        <span>{label}</span>
                                        <span style={{ color }}>{params[key].toFixed(2)}</span>
                                    </div>
                                    <input type="range" min={min} max={max} step={step} value={params[key]}
                                        onChange={e => setParams(p => ({ ...p, [key]: +e.target.value }))}
                                        className="w-full h-4 rounded-full appearance-none cursor-pointer" style={{ accentColor: color }} />
                                </div>
                            ))}
                            <div className="grid grid-cols-2 gap-10">
                                <button onClick={() => setPaused(p => !p)} className="py-14 rounded-xl font-orbitron text-xs font-bold uppercase tracking-wider transition-all"
                                    style={{ background: paused ? 'rgba(34,211,238,0.15)' : 'rgba(239,68,68,0.12)', border: `1px solid ${paused ? 'rgba(34,211,238,0.4)' : 'rgba(239,68,68,0.3)'}`, color: paused ? '#22d3ee' : '#ef4444' }}>
                                    {paused ? '▶ Resume' : '⏸ Pause'}
                                </button>
                                <button onClick={reset} className="py-14 rounded-xl font-orbitron text-xs font-bold uppercase tracking-wider transition-all"
                                    style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#6366f1' }}>
                                    ↺ Reset
                                </button>
                            </div>
                            <div className="flex flex-col gap-8 mt-2">
                                <div className="text-[9px] font-orbitron text-text-muted uppercase">Quick Presets</div>
                                <div className="grid grid-cols-2 gap-8">
                                    {[
                                        { label: 'Strong ⚡', p: { g: 1.5, gamma: 0.02, kappa: 0.02, speed: 1.0 } },
                                        { label: 'Weak 〰', p: { g: 0.5, gamma: 0.4, kappa: 0.4, speed: 1.0 } },
                                        { label: 'Overdamped', p: { g: 0.3, gamma: 0.8, kappa: 0.6, speed: 1.0 } },
                                        { label: 'Ultra Fast', p: { g: 2.5, gamma: 0.05, kappa: 0.05, speed: 3 } },
                                    ].map(preset => (
                                        <button key={preset.label} onClick={() => { setParams(preset.p); reset(); }}
                                            className="py-8 rounded-lg text-[9px] font-orbitron text-text-muted uppercase border border-white/5 hover:border-white/20 transition-all hover:text-white">
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* Rabi Chart */}
                        <Card className="p-24 flex flex-col gap-12" style={{ background: 'rgba(20,30,50,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
                            <div className="flex items-center justify-between">
                                <div className="text-[10px] font-orbitron uppercase tracking-widest text-text-muted">Rabi Oscillations</div>
                                <div className="flex items-center gap-16 text-[9px] font-orbitron">
                                    <span className="text-[#fbbf24]">─── Pe (Atom)</span>
                                    <span className="text-[#22d3ee]">─── Pg (Photon)</span>
                                </div>
                            </div>
                            <div className="flex-1 min-h-0" style={{ height: 240 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                        <XAxis dataKey="t" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: 'Orbitron' }} tickLine={false} axisLine={false} />
                                        <YAxis domain={[0, 1]} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: 'Orbitron' }} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ background: 'rgba(8,12,20,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontFamily: 'monospace', fontSize: '11px' }} />
                                        <Line type="monotone" dataKey="Pe" stroke="#fbbf24" strokeWidth={2} dot={false} isAnimationActive={false} />
                                        <Line type="monotone" dataKey="Pg" stroke="#22d3ee" strokeWidth={2} dot={false} isAnimationActive={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-12 pt-4 border-t border-white/5">
                                {[
                                    { title: 'Jaynes–Cummings', body: 'H = ℏωₐσ⁺σ⁻ + ℏωᶜa†a + ℏg(σ⁺a + σ⁻a†) — the exact Hamiltonian governing this cavity.' },
                                    { title: 'Rabi Frequency', body: 'Ω = 2g√(n+1) — the speed of quantum state transfer. Crank g up to see faster oscillations.' },
                                ].map(k => (
                                    <div key={k.title} className="p-12 rounded-xl border border-white/5" style={{ background: 'rgba(0,0,0,0.3)' }}>
                                        <div className="text-[9px] font-orbitron text-[#a78bfa] uppercase tracking-wider mb-4">{k.title}</div>
                                        <p className="text-[10px] text-text-muted leading-relaxed">{k.body}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </LabShell>
    );
}
