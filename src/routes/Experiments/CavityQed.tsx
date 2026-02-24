import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, Badge } from '../../components/UI';
import LabShell, { TourStep } from '../../components/LabShell';
import { useSound, soundPhotonPop, soundRabiPeak, startCavityHum, updateCavityHum, stopCavityHum } from '../../hooks/useSound';

const W = 900, H = 320;

const TOUR_STEPS: TourStep[] = [
    { id: 'intro', title: 'Cavity QED Ecosystem', body: 'Step into the realm where light and matter are deeply entangled. A single atom meets a single photon in a perfectly reflective resonator.', duration: 6000 },
    { id: 'coupling', title: 'The g-Factor', body: 'The coupling "g" defines how fast the atom and photon swap energy. In the "Strong Coupling" regime, this swap is faster than any leakage.', duration: 5000 },
    { id: 'energy', title: 'Energy Levels', body: 'Notice the Energy Level diagram. The system oscillates between |e,0⟩ (atom excited) and |g,1⟩ (photon in cavity).', duration: 6000 },
    { id: 'leakage', title: 'Decoherence & Leakage', body: 'Real-world cavities aren\'t perfect. Increase κ (kappa) to see photons escape, or γ (gamma) to see the atom drop state without making a photon.', duration: 0 },
];

// Component for the Energy Level Diagram
const EnergyLevelDiagram = ({ Pe, Pg, g }: { Pe: number, Pg: number, g: number }) => {
    return (
        <div className="flex flex-col gap-4 h-full justify-center">
            <div className="text-[9px] font-orbitron text-text-muted uppercase mb-4 text-center">Energy Manifold</div>
            <div className="relative h-[180px] w-full bg-white/5 rounded-xl border border-white/10 p-12 flex flex-col justify-between overflow-hidden">
                {/* Visualizing the splitting */}
                <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/20 border-t border-dashed" />
                </div>

                {/* Upper state |e,0> */}
                <div className="flex flex-col gap-2 relative z-10 transition-all duration-300" style={{ transform: `translateY(${-g * 10}px)` }}>
                    <div className="flex justify-between items-end">
                        <span className="text-[8px] font-mono text-amber-400">|e, 0⟩</span>
                        <div className="w-16 h-2 bg-amber-400/20 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 transition-all duration-75" style={{ width: `${Pe * 100}%` }} />
                        </div>
                    </div>
                    <div className="h-[2px] w-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                </div>

                {/* Lower state |g,1> */}
                <div className="flex flex-col gap-2 relative z-10 transition-all duration-300" style={{ transform: `translateY(${g * 10}px)` }}>
                    <div className="h-[2px] w-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                    <div className="flex justify-between items-start">
                        <span className="text-[8px] font-mono text-cyan-400">|g, 1⟩</span>
                        <div className="w-16 h-2 bg-cyan-400/20 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-400 transition-all duration-75" style={{ width: `${Pg * 100}%` }} />
                        </div>
                    </div>
                </div>

                {/* Oscillating transition line */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line
                        x1="50%" y1={90 - g * 10}
                        x2="50%" y2={90 + g * 10}
                        stroke="rgba(167,139,250,0.4)"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                    />
                    <circle cx="50%" cy={90 + (Pg - Pe) * g * 10} r="3" fill="#a78bfa">
                        <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite" />
                    </circle>
                </svg>
            </div>
            <div className="text-[8px] text-text-muted text-center px-2">Jaynes-Cummings Splitting: 2g</div>
        </div>
    );
};

export default function CavityQed() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>();
    const stateRef = useRef({ Pe: 1.0, Pg: 0.0, t: 0.0 });
    const animRef = useRef({ paused: false });
    const lastRabiPeakRef = useRef(0);
    const particleRef = useRef<{ x: number, y: number, vx: number, vy: number, life: number, color: string }[]>([]);

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

    const createLeakageParticle = (x: number, y: number, color: string) => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 2;
        particleRef.current.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            color
        });
    };

    const draw = useCallback(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;

        // Physics step
        if (!animRef.current.paused) {
            const dt = 0.015 * params.speed;
            const { Pe, Pg, t } = stateRef.current;

            // Jaynes-Cummings dynamics (Simplified Master Eq)
            const gEff = params.g;
            const dPe = -gEff * 2 * Math.sqrt(Pe * Pg + 1e-6) * Math.sin(gEff * t * 2) - params.gamma * Pe;
            const dPg = gEff * 2 * Math.sqrt(Pe * Pg + 1e-6) * Math.sin(gEff * t * 2) - params.kappa * Pg;

            let newPe = Math.max(0, Math.min(1, Pe + dPe * dt));
            let newPg = Math.max(0, Math.min(1, Pg + dPg * dt));

            // Normalize slightly to prevent drift, but allow decay to reduce total population
            const total = newPe + newPg;
            if (total > 1.0) { newPe /= total; newPg /= total; }

            stateRef.current = { Pe: newPe, Pg: newPg, t: t + dt };

            // Emission of leakage particles
            if (Math.random() < params.gamma * 0.5) createLeakageParticle(W / 2, H / 2, '#fbbf24');
            if (Math.random() < params.kappa * 0.5) {
                const mirrorX = Math.random() > 0.5 ? W * 0.15 : W * 0.85;
                createLeakageParticle(mirrorX, H / 2 + (Math.random() - 0.5) * 100, '#22d3ee');
            }

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

        // Background with subtle vacuum noise
        ctx.fillStyle = '#05070a'; ctx.fillRect(0, 0, W, H);

        // Grid lines with depth
        ctx.strokeStyle = 'rgba(255,255,255,0.015)'; ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        const cavityX = W * 0.15, cavityW = W * 0.7, cy = H / 2;
        const endX = cavityX + cavityW;

        // ── Drawing Cavity Environment ────────────────────────────────────────

        // Mirror glow rings (Stronger with photon population)
        for (let side of [cavityX, endX]) {
            const gr = ctx.createRadialGradient(side, cy, 0, side, cy, 140);
            gr.addColorStop(0, `rgba(99,102,241,${0.02 + Pg * 0.08})`);
            gr.addColorStop(1, 'transparent');
            ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(side, cy, 140, 0, Math.PI * 2); ctx.fill();
        }

        // Mirrors — Pseudo 3D effect
        const drawMirror = (x: number, isRight: boolean) => {
            const width = 24;
            const curve = 15;

            // Mirror back
            ctx.fillStyle = '#111122';
            ctx.beginPath();
            if (!isRight) {
                ctx.moveTo(x, 30); ctx.quadraticCurveTo(x + curve, cy, x, H - 30);
                ctx.lineTo(x - 5, H - 30); ctx.lineTo(x - 5, 30);
            } else {
                ctx.moveTo(x, 30); ctx.quadraticCurveTo(x - curve, cy, x, H - 30);
                ctx.lineTo(x + 5, H - 30); ctx.lineTo(x + 5, 30);
            }
            ctx.fill();

            // Refractive surface
            const mg = ctx.createLinearGradient(x - (isRight ? 20 : 0), 0, x + (isRight ? 0 : 20), 0);
            mg.addColorStop(0, 'rgba(99,102,241,0.1)');
            mg.addColorStop(0.5, 'rgba(255,255,255,0.4)');
            mg.addColorStop(1, 'rgba(99,102,241,0.1)');
            ctx.strokeStyle = mg; ctx.lineWidth = 3;
            ctx.beginPath();
            if (!isRight) {
                ctx.moveTo(x, 30); ctx.quadraticCurveTo(x + curve, cy, x, H - 30);
            } else {
                ctx.moveTo(x, 30); ctx.quadraticCurveTo(x - curve, cy, x, H - 30);
            }
            ctx.stroke();

            // Mirror label
            ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '7px Orbitron'; ctx.textAlign = 'center';
            ctx.fillText(isRight ? 'OUTPUT COUPLER' : 'HIGH-Q MIRROR', x + (isRight ? 40 : -40), cy - 130);
        };
        drawMirror(cavityX, false);
        drawMirror(endX, true);

        // ── Standing Wave / Field Intensity ───────────────────────────────────
        const modes = 3;
        const waveIntensity = Pg;
        if (waveIntensity > 0.01) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < modes; i++) {
                const phase = t * params.g * 2 + i * (Math.PI / 2);
                const alpha = (0.1 + waveIntensity * 0.4) / modes;
                ctx.strokeStyle = `rgba(34,211,238,${alpha})`;
                ctx.lineWidth = 2 + Math.sin(phase) * 1;
                ctx.beginPath();
                for (let xi = 0; xi <= cavityW; xi += 5) {
                    const nx = cavityX + xi;
                    const envelope = Math.sin((xi / cavityW) * Math.PI);
                    const wave = Math.sin((xi / cavityW) * Math.PI * 6) * 40 * envelope * Math.sin(phase);
                    xi === 0 ? ctx.moveTo(nx, cy + wave) : ctx.lineTo(nx, cy + wave);
                }
                ctx.stroke();
            }
            ctx.restore();
        }

        // ── Atom ──────────────────────────────────────────────────────────────
        const atomX = W / 2, atomR = 20 + Pe * 10;

        // Nucleus / Potential well
        const nclGrd = ctx.createRadialGradient(atomX, cy, 0, atomX, cy, atomR);
        nclGrd.addColorStop(0, Pe > 0.5 ? '#fbbf24' : '#d97706');
        nclGrd.addColorStop(1, 'transparent');
        ctx.fillStyle = nclGrd;
        ctx.beginPath(); ctx.arc(atomX, cy, atomR, 0, Math.PI * 2); ctx.fill();

        // Excited state halo
        if (Pe > 0.1) {
            ctx.shadowBlur = 15 * Pe; ctx.shadowColor = '#fbbf24';
            ctx.strokeStyle = `rgba(251,191,36,${Pe * 0.5})`; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(atomX, cy, atomR + 5, 0, Math.PI * 2); ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Orbital electron (Smooth interpolation between ground and excited states)
        const orbRadius = 30 + Pe * 20;
        const eAngle = t * (4 + Pe * 6);
        const ex = atomX + Math.cos(eAngle) * orbRadius;
        const ey = cy + Math.sin(eAngle) * orbRadius * 0.5;

        ctx.strokeStyle = `rgba(251,191,36,${0.1 + Pe * 0.3})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(atomX, cy, orbRadius, orbRadius * 0.5, 0, 0, Math.PI * 2); ctx.stroke();

        const eGrd = ctx.createRadialGradient(ex, ey, 0, ex, ey, 6);
        eGrd.addColorStop(0, '#fff'); eGrd.addColorStop(1, 'transparent');
        ctx.fillStyle = eGrd; ctx.beginPath(); ctx.arc(ex, ey, 4, 0, Math.PI * 2); ctx.fill();

        // Atom labels
        ctx.fillStyle = Pe > 0.5 ? '#fbbf24' : '#94a3b8'; ctx.font = 'bold 10px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText(Pe > 0.8 ? 'EXCITED' : Pe < 0.2 ? 'GROUND' : 'SUPERPOSITION', atomX, cy - 80);

        // ── Leakage Particles ─────────────────────────────────────────────────
        particleRef.current.forEach((p, idx) => {
            p.x += p.vx; p.y += p.vy; p.life -= 0.02;
            ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
            ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1.0;
        });
        particleRef.current = particleRef.current.filter(p => p.life > 0);

        // UI Metadata
        ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = '8px Orbitron'; ctx.textAlign = 'left';
        ctx.fillText(`JAYNES-CUMMINGS SIMULATION | SPEED=${params.speed.toFixed(1)}x`, 20, H - 20);

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
        stateRef.current = { Pe: 1.0, Pg: 0.0, t: 0.0 }; setChartData([]); lastRabiPeakRef.current = 0; particleRef.current = [];
    };

    const { Pe, Pg } = stateRef.current;

    return (
        <LabShell tourSteps={TOUR_STEPS} labName="Cavity QED Lab" soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled}>
            <div className="min-h-screen bg-background-dark text-text-primary py-32 px-24">
                <div className="max-w-[1200px] mx-auto flex flex-col gap-24">

                    {/* Top Status Bar */}
                    <div className="flex flex-wrap items-start justify-between gap-16">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-10 mb-4">
                                <span className="p-8 rounded-lg bg-cyan-500/10 text-cyan-400 text-sm">⚛️</span>
                                <span className="text-[10px] font-orbitron text-text-muted tracking-[4px] uppercase">Quantum Electrodynamics</span>
                            </div>
                            <h1 className="text-4xl font-black font-orbitron tracking-tighter bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent italic">
                                CAVITY QED LAB
                            </h1>
                            <p className="text-text-secondary text-xs mt-4 max-w-sm uppercase tracking-widest font-bold opacity-60">
                                Real-time Jaynes-Cummings Dynamics
                            </p>
                        </div>

                        <div className="flex items-center gap-8">
                            {[
                                { label: 'Atom Excitation', val: Pe, color: '#fbbf24', icon: '⚡' },
                                { label: 'Cavity Photons', val: Pg, color: '#22d3ee', icon: '💎' },
                            ].map(({ label, val, color, icon }) => (
                                <div key={label} className="bg-white/5 border border-white/10 p-12 rounded-2xl flex items-center gap-12 min-w-[160px]">
                                    <span className="text-lg">{icon}</span>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-orbitron text-text-muted uppercase">{label}</span>
                                        <span className="text-xl font-mono font-black tabular-nums" style={{ color }}>{(val * 100).toFixed(1)}%</span>
                                    </div>
                                </div>
                            ))}
                            <div className={`p-16 rounded-2xl border transition-all duration-500 flex flex-col items-center justify-center min-w-[120px] ${regime === 'strong' ? 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.1)]' : 'bg-amber-500/10 border-amber-500/30'}`}>
                                <span className="text-[8px] font-orbitron font-bold text-text-muted uppercase mb-2">Coupling</span>
                                <span className="text-xs font-black font-orbitron tracking-widest text-white">{regime === 'strong' ? 'STRONG ⚡' : 'WEAK 〰'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Workspace */}
                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-20">
                        <div className="flex flex-col gap-20">
                            {/* Canvas Section */}
                            <div className="relative group rounded-3xl overflow-hidden border border-white/10 bg-[#05070a] shadow-2xl">
                                <div className="absolute top-16 left-16 z-10 flex gap-12 pointer-events-none">
                                    <Badge color="cyan">QUANTUM VACUUM</Badge>
                                    <Badge color="purple">Q = 10⁶</Badge>
                                </div>
                                <canvas ref={canvasRef} width={W} height={H} className="w-full h-auto block" />
                                <div className="absolute inset-0 border border-white/5 pointer-events-none rounded-3xl" />
                            </div>

                            {/* Chart Section */}
                            <Card className="p-20 bg-black/40 border-white/10">
                                <div className="flex items-center justify-between mb-16">
                                    <div className="text-[9px] font-orbitron text-text-muted font-bold tracking-widest uppercase flex items-center gap-8">
                                        <div className="w-8 h-8 rounded-full bg-cyan-500 animate-pulse" /> Rabi Flopping Signature
                                    </div>
                                    <div className="flex gap-12 text-[8px] font-orbitron uppercase">
                                        <span className="text-amber-400">● Prob(Excited)</span>
                                        <span className="text-cyan-400">● Prob(Photon)</span>
                                    </div>
                                </div>
                                <div className="h-[180px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                            <XAxis dataKey="t" hide />
                                            <YAxis domain={[0, 1]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 8, fontFamily: 'Orbitron' }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                contentStyle={{ background: '#0a0c10', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px' }}
                                                itemStyle={{ fontSize: '10px', fontFamily: 'monospace' }}
                                            />
                                            <Line type="step" dataKey="Pe" stroke="#fbbf24" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                                            <Line type="step" dataKey="Pg" stroke="#22d3ee" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </div>

                        {/* Sidebar: Diagnostics & Energy Levels */}
                        <div className="flex flex-col gap-20">
                            <Card className="p-20 bg-black/40 border-white/10 flex-1">
                                <EnergyLevelDiagram Pe={Pe} Pg={Pg} g={params.g} />

                                <div className="mt-24 space-y-12">
                                    <div className="p-12 rounded-xl bg-white/5 border border-white/10">
                                        <div className="text-[8px] font-orbitron text-cyan-400 uppercase mb-4">Strong Coupling Condition</div>
                                        <div className="text-[10px] font-mono text-text-secondary leading-tight">
                                            g ≫ (γ, κ)
                                            <br />
                                            <span className={regime === 'strong' ? 'text-green-400' : 'text-red-400'}>
                                                {regime === 'strong' ? '✓ MET' : '✗ NOT MET'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-12 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                                        <div className="text-[8px] font-orbitron text-indigo-400 uppercase mb-4">Hamiltonian</div>
                                        <div className="text-[9px] font-mono text-text-secondary italic">
                                            H = g(σ₊a + σ₋a†)
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <div className="grid grid-cols-2 gap-8">
                                <button onClick={() => setPaused(!paused)} className={`p-12 rounded-xl font-orbitron text-[10px] font-bold uppercase transition-all border ${paused ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'}`}>
                                    {paused ? '▶ Resume' : '⏸ Pause'}
                                </button>
                                <button onClick={reset} className="p-12 rounded-xl bg-white/5 border border-white/10 text-white font-orbitron text-[10px] font-bold uppercase hover:bg-white/10 transition-all">
                                    ↺ Reset
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Controls Footer */}
                    <Card className="p-24 bg-black/60 border-white/10">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-24">
                            {[
                                { label: 'Coupling Strength (g)', key: 'g', min: 0.1, max: 5.0, step: 0.1, color: '#a78bfa', desc: 'Swap speed' },
                                { label: 'Atomic Decay (γ)', key: 'gamma', min: 0, max: 1.0, step: 0.01, color: '#fbbf24', desc: 'Spontaneous loss' },
                                { label: 'Photon Leakage (κ)', key: 'kappa', min: 0, max: 1.0, step: 0.01, color: '#22d3ee', desc: 'Mirror loss' },
                                { label: 'Time Dilation', key: 'speed', min: 0.1, max: 4.0, step: 0.1, color: '#ef4444', desc: 'Sim speed' },
                            ].map(({ label, key, min, max, step, color, desc }) => (
                                <div key={key} className="flex flex-col gap-10">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-orbitron text-text-muted uppercase font-bold tracking-widest">{label}</span>
                                            <span className="text-[8px] text-text-muted italic opacity-50">{desc}</span>
                                        </div>
                                        <span className="text-sm font-mono font-bold" style={{ color }}>{params[key as keyof typeof params].toFixed(2)}</span>
                                    </div>
                                    <input
                                        type="range" min={min} max={max} step={step}
                                        value={params[key as keyof typeof params]}
                                        onChange={e => setParams(p => ({ ...p, [key]: +e.target.value }))}
                                        className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer border border-white/10"
                                        style={{ accentColor: color }}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="w-full h-[1px] bg-white/5 my-20" />

                        <div className="flex flex-wrap items-center gap-12">
                            <span className="text-[9px] font-orbitron text-text-muted uppercase mr-8">Presets:</span>
                            {[
                                { label: 'Coherent Swap', p: { g: 3.0, gamma: 0.01, kappa: 0.01, speed: 1.0 } },
                                { label: 'Purcell Regime', p: { g: 0.5, gamma: 0.02, kappa: 1.0, speed: 1.0 } },
                                { label: 'Decoherence Noise', p: { g: 1.5, gamma: 0.5, kappa: 0.5, speed: 1.0 } },
                                { label: 'Quantum Zeno', p: { g: 0.2, gamma: 0.9, kappa: 0.1, speed: 2.0 } },
                            ].map(preset => (
                                <button
                                    key={preset.label}
                                    onClick={() => { setParams(preset.p); reset(); }}
                                    className="px-16 py-8 rounded-lg text-[9px] font-orbitron text-text-muted border border-white/5 bg-white/2 hover:border-cyan-500/50 hover:text-cyan-400 transition-all uppercase tracking-widest"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </LabShell>
    );
}
