/**
 * AL-08: Quantum Network & Entanglement Repeater Laboratory
 *
 * Demonstrates quantum entanglement swapping over long-haul optical fiber.
 * Pedagogical flow: Problem → Classical Limit → Quantum Idea → Physics →
 *   Circuit → Simulation → Visualization → Insight → Challenge
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Play, Wifi, WifiOff, AlertTriangle, CheckCircle2,
  Zap, Network, Cpu, Activity, TrendingDown, TrendingUp, Info,
} from 'lucide-react';
import { Card, PageHeader } from '../../components/UI';
import {
  runEntanglementSwapping,
  type EntanglementSwappingResult,
} from '../../api/algorithms';

// ─── Constants ───────────────────────────────────────────────────────────────

const ALPHA_DB = 0.2; // dB/km, standard SMF-28 fiber at 1550 nm

function fiberLoss(km: number) {
  const db = ALPHA_DB * km;
  const prob = Math.pow(10, -db / 10);
  return { db, prob };
}

const BSM_LABELS: Record<string, string> = {
  '00': '|Φ+⟩',
  '01': '|Φ−⟩',
  '10': '|Ψ+⟩',
  '11': '|Ψ−⟩',
};

// ─── Animated Network Topology ───────────────────────────────────────────────

interface NodeProps {
  x: number;
  y: number;
  label: string;
  sublabel?: string;
  color: string;
  isRepeater?: boolean;
  pulse?: boolean;
}

function NetworkNode({ x, y, label, sublabel, color, isRepeater, pulse }: NodeProps) {
  return (
    <g>
      {pulse && (
        <>
          <circle cx={x} cy={y} r={28} fill={color} opacity={0.12}>
            <animate attributeName="r" values="28;44;28" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.12;0;0.12" dur="2s" repeatCount="indefinite" />
          </circle>
        </>
      )}
      <circle cx={x} cy={y} r={isRepeater ? 22 : 26} fill="#0d1117" stroke={color} strokeWidth={2.5} />
      {isRepeater ? (
        <text x={x} y={y + 5} textAnchor="middle" fill={color} fontSize={12} fontWeight="bold" fontFamily="monospace">R</text>
      ) : (
        <text x={x} y={y + 5} textAnchor="middle" fill={color} fontSize={11} fontWeight="bold" fontFamily="monospace">{label[0]}</text>
      )}
      <text x={x} y={y + 38} textAnchor="middle" fill={color} fontSize={12} fontWeight={700} fontFamily="monospace">{label}</text>
      {sublabel && (
        <text x={x} y={y + 53} textAnchor="middle" fill="#94a3b8" fontSize={10} fontWeight={500} fontFamily="monospace">{sublabel}</text>
      )}
    </g>
  );
}

interface PhotonProps {
  x1: number;
  x2: number;
  y: number;
  color: string;
  delay: number;
  active: boolean;
}

function TravellingPhoton({ x1, x2, y, color, delay, active }: PhotonProps) {
  if (!active) return null;
  return (
    <circle r={5} fill={color} opacity={0.9}>
      <animateMotion
        dur="2.2s"
        begin={`${delay}s`}
        repeatCount="indefinite"
        path={`M ${x1} ${y} L ${x2} ${y}`}
      />
      <animate attributeName="opacity" values="0;1;1;0" dur="2.2s" begin={`${delay}s`} repeatCount="indefinite" />
    </circle>
  );
}

interface NetworkTopologyProps {
  distanceKm: number;
  running: boolean;
  result: EntanglementSwappingResult | null;
}

function NetworkTopology({ distanceKm, running, result }: NetworkTopologyProps) {
  const W = 560;
  const H = 180;
  const aliceX = 60, repeaterX = W / 2, bobX = W - 60;
  const nodeY = 90;
  const entangleY = 130;

  const success = !!result;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {/* Fiber segments */}
      <line x1={aliceX + 26} y1={nodeY} x2={repeaterX - 22} y2={nodeY}
        stroke="#1e3a5f" strokeWidth={3} strokeDasharray="8 4" />
      <line x1={repeaterX + 22} y1={nodeY} x2={bobX - 26} y2={nodeY}
        stroke="#1e3a5f" strokeWidth={3} strokeDasharray="8 4" />

      {/* Entanglement arc (shown on success) */}
      {success && (
        <path
          d={`M ${aliceX} ${nodeY - 10} Q ${W / 2} ${-10} ${bobX} ${nodeY - 10}`}
          fill="none"
          stroke="url(#entGrad)"
          strokeWidth={2}
          strokeDasharray="6 3"
          opacity={0.8}
        />
      )}

      <defs>
        <linearGradient id="entGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#e879f9" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>

      {/* Fibre distance labels */}
      <text x={(aliceX + repeaterX) / 2} y={nodeY - 12} textAnchor="middle"
        fill="#cbd5e1" fontSize={11} fontWeight={600} fontFamily="monospace">{(distanceKm / 2).toFixed(0)} km</text>
      <text x={(repeaterX + bobX) / 2} y={nodeY - 12} textAnchor="middle"
        fill="#cbd5e1" fontSize={11} fontWeight={600} fontFamily="monospace">{(distanceKm / 2).toFixed(0)} km</text>

      {/* Travelling photons */}
      <TravellingPhoton x1={aliceX + 26} x2={repeaterX - 22} y={nodeY} color="#818cf8" delay={0} active={running} />
      <TravellingPhoton x1={repeaterX + 22} x2={bobX - 26} y={nodeY} color="#22d3ee" delay={1.1} active={running} />

      {/* Nodes */}
      <NetworkNode x={aliceX} y={nodeY} label="Alice" sublabel="Node A" color="#818cf8" pulse={running} />
      <NetworkNode x={repeaterX} y={nodeY} label="Repeater" sublabel="BSM" color="#f59e0b" isRepeater pulse={running} />
      <NetworkNode x={bobX} y={nodeY} label="Bob" sublabel="Node B" color="#22d3ee" pulse={running} />

      {/* Success entanglement label */}
      {success && (
        <text x={W / 2} y={22} textAnchor="middle" fill="#a78bfa" fontSize={10} fontWeight={700} fontFamily="monospace">
          ⊗ {result.alice_bob_state_label}
        </text>
      )}
    </svg>
  );
}

// ─── Fiber Attenuation Chart ──────────────────────────────────────────────────

interface AttenuationChartProps {
  result: EntanglementSwappingResult | null;
  distanceKm: number;
}

function AttenuationChart({ result, distanceKm }: AttenuationChartProps) {
  const direct = fiberLoss(distanceKm);
  const repeater = fiberLoss(distanceKm / 2);

  const maxDb = Math.max(direct.db, 20);
  const directPct = Math.min((direct.db / maxDb) * 100, 100);
  const repeaterPct = Math.min((repeater.db / maxDb) * 100, 100);

  return (
    <div className="flex flex-col gap-16">
      <div className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Fiber Attenuation (α = 0.2 dB/km)</div>

      <div className="flex flex-col gap-12">
        {/* Direct */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between text-xs">
            <span className="text-rose-400 font-semibold flex items-center gap-6">
              <TrendingDown className="w-3 h-3" /> Direct ({distanceKm} km)
            </span>
            <span className="font-mono text-rose-400">{direct.db.toFixed(1)} dB → P = {(direct.prob * 100).toExponential(2)}%</span>
          </div>
          <div className="h-8 rounded-full bg-surface-raised overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-rose-600 to-rose-400"
              initial={{ width: 0 }}
              animate={{ width: `${directPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Repeater per segment */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-semibold flex items-center gap-6">
              <TrendingUp className="w-3 h-3" /> Repeater segment ({(distanceKm / 2).toFixed(0)} km)
            </span>
            <span className="font-mono text-emerald-400">{repeater.db.toFixed(1)} dB → P = {(repeater.prob * 100).toFixed(2)}%</span>
          </div>
          <div className="h-8 rounded-full bg-surface-raised overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${repeaterPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      <div className="p-12 rounded-lg bg-emerald-500/8 border border-emerald-500/20 text-[11px] text-emerald-300 leading-relaxed">
        <strong>Gain:</strong> Repeater reduces effective loss by{' '}
        <span className="font-mono font-bold">{(direct.db - repeater.db).toFixed(1)} dB</span> per segment.
        Probability improves{' '}
        <span className="font-mono font-bold text-emerald-200">
          {(repeater.prob / direct.prob).toFixed(0)}×
        </span>{' '}
        over direct transmission.
      </div>
    </div>
  );
}

// ─── Circuit Diagram ──────────────────────────────────────────────────────────

function CircuitDiagram() {
  const gates = [
    { qubit: 0, x: 80, label: 'H', color: '#818cf8' },
    { qubit: 0, x: 150, label: 'CX', color: '#a78bfa', isControl: true, targetQ: 1 },
    { qubit: 2, x: 80, label: 'H', color: '#22d3ee' },
    { qubit: 2, x: 150, label: 'CX', color: '#06b6d4', isControl: true, targetQ: 3 },
    { qubit: 1, x: 240, label: 'CX', color: '#f59e0b', isControl: false, controlX: 240, controlQ: 2 },
    { qubit: 1, x: 310, label: 'H', color: '#f59e0b' },
    { qubit: 1, x: 380, label: 'M', color: '#ef4444' },
    { qubit: 2, x: 380, label: 'M', color: '#ef4444' },
  ];

  const qubits = [
    { label: 'q₀ (Alice)', color: '#818cf8' },
    { label: 'q₁ (R-L)', color: '#f59e0b' },
    { label: 'q₂ (R-R)', color: '#f59e0b' },
    { label: 'q₃ (Bob)', color: '#22d3ee' },
  ];

  const W = 460;
  const H = 160;
  const rowH = 36;
  const startY = 20;
  const wireStart = 110;
  const wireEnd = 430;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ fontFamily: 'monospace' }}>
      {qubits.map((q, i) => {
        const y = startY + i * rowH;
        return (
          <g key={i}>
            <text x={wireStart - 8} y={y + 5} textAnchor="end" fill={q.color} fontSize={9} fontWeight={600}>{q.label}</text>
            <line x1={wireStart} y1={y} x2={wireEnd} y2={y} stroke="#1e293b" strokeWidth={1.5} />
          </g>
        );
      })}

      {/* H on q0 */}
      {[
        { q: 0, x: 125, lbl: 'H', col: '#818cf8' },
        { q: 3, x: 125, lbl: 'H', col: '#22d3ee' },
        { q: 1, x: 270, lbl: 'H', col: '#f59e0b' },
      ].map((g, i) => {
        const y = startY + g.q * rowH;
        return (
          <g key={`h${i}`}>
            <rect x={g.x - 10} y={y - 10} width={20} height={20} rx={3} fill="#0d1117" stroke={g.col} strokeWidth={1.5} />
            <text x={g.x} y={y + 5} textAnchor="middle" fill={g.col} fontSize={10} fontWeight={700}>H</text>
          </g>
        );
      })}

      {/* CNOT Alice→R-L (q0 controls q1) */}
      {[
        { ctrl: 0, tgt: 1, x: 185 },
        { ctrl: 3, tgt: 2, x: 185 },
        { ctrl: 2, tgt: 1, x: 235 },
      ].map((cx, i) => {
        const cy = startY + cx.ctrl * rowH;
        const ty = startY + cx.tgt * rowH;
        return (
          <g key={`cx${i}`}>
            <line x1={cx.x} y1={cy} x2={cx.x} y2={ty} stroke="#f59e0b" strokeWidth={1.2} />
            <circle cx={cx.x} cy={cy} r={4} fill="#f59e0b" />
            <circle cx={cx.x} cy={ty} r={9} fill="#0d1117" stroke="#f59e0b" strokeWidth={1.5} />
            <line x1={cx.x - 6} y1={ty} x2={cx.x + 6} y2={ty} stroke="#f59e0b" strokeWidth={1.2} />
            <line x1={cx.x} y1={ty - 6} x2={cx.x} y2={ty + 6} stroke="#f59e0b" strokeWidth={1.2} />
          </g>
        );
      })}

      {/* Measurement on q1, q2 */}
      {[1, 2].map(q => {
        const y = startY + q * rowH;
        return (
          <g key={`m${q}`}>
            <rect x={315} y={y - 10} width={22} height={20} rx={3} fill="#0d1117" stroke="#ef4444" strokeWidth={1.5} />
            <text x={326} y={y + 5} textAnchor="middle" fill="#ef4444" fontSize={9} fontWeight={700}>M</text>
          </g>
        );
      })}

      {/* BSM box */}
      <rect x={355} y={startY + rowH - 14} width={56} height={rowH * 2 + 8} rx={4}
        fill="#f59e0b15" stroke="#f59e0b" strokeWidth={1} strokeDasharray="4 2" />
      <text x={383} y={startY + rowH * 2 + 16} textAnchor="middle" fill="#f59e0b" fontSize={8} fontWeight={700}>BSM</text>

      {/* Legend */}
      <text x={wireStart} y={H - 4} fill="#94a3b8" fontSize={9} fontWeight={500}>Depth = 8 | 4-qubit ESW circuit | Bell-State Measurement at node</text>
    </svg>
  );
}

// ─── Metric Tile ─────────────────────────────────────────────────────────────

function MetricTile({
  label, value, unit, color, icon: Icon,
}: {
  label: string; value: string | number; unit?: string; color: string; icon?: React.ElementType;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-6 p-16 rounded-xl bg-surface-raised border border-brand-border"
    >
      <div className="flex items-center gap-8 text-[10px] font-orbitron tracking-widest text-text-muted uppercase">
        {Icon && <Icon className="w-3 h-3" style={{ color }} />}
        {label}
      </div>
      <div className="font-mono text-xl font-bold" style={{ color }}>
        {value}
        {unit && <span className="text-sm font-normal text-text-muted ml-4">{unit}</span>}
      </div>
    </motion.div>
  );
}

// ─── Counts Bar ───────────────────────────────────────────────────────────────

function CountsBars({ counts, bsmOutcome }: { counts: Record<string, number>; bsmOutcome: string }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = entries[0]?.[1] ?? 1;

  return (
    <div className="flex flex-col gap-10">
      {entries.map(([k, v]) => {
        const pct = (v / max) * 100;
        const isActive = k === bsmOutcome;
        return (
          <div key={k} className="flex items-center gap-12">
            <div className={`w-24 text-right font-mono text-[11px] font-bold ${isActive ? 'text-amber-400' : 'text-text-muted'}`}>
              {BSM_LABELS[k] ?? `|${k}⟩`}
            </div>
            <div className="flex-1 h-8 rounded-full bg-surface-raised overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: isActive ? 'linear-gradient(90deg,#f59e0b,#fcd34d)' : 'rgba(100,116,139,0.3)' }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <div className="w-40 text-right font-mono text-[10px] text-text-muted">
              {((v / total) * 100).toFixed(1)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuantumNetworkLab() {
  const [distanceKm, setDistanceKm] = useState(100);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<EntanglementSwappingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'problem' | 'circuit' | 'results' | 'challenge'>('problem');

  const handleRun = useCallback(async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await runEntanglementSwapping({ distance_km: distanceKm, shots: 1024 });
      setResult(res);
      setTab('results');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }, [distanceKm]);

  const direct = fiberLoss(distanceKm);
  const repeater = fiberLoss(distanceKm / 2);
  const gainX = direct.prob > 0 ? (repeater.prob / direct.prob) : 0;

  return (
    <div className="flex flex-col gap-32">
      {/* Header */}
      <div className="flex items-start gap-16">
        <Link
          to="/algorithms"
          className="mt-4 p-8 rounded-lg hover:bg-surface-raised border border-transparent hover:border-brand-border transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-text-muted" />
        </Link>
        <PageHeader
          title="Quantum Network & Repeater Lab"
          subtitle="AL-08 — Entanglement Swapping over long-haul fiber. Witness how quantum repeaters overcome the exponential photon loss that makes direct quantum communication impossible at scale."
          icon="🌐"
        />
      </div>

      {/* NQM Alignment Badge */}
      <div className="flex items-center gap-10 p-12 rounded-lg bg-amber-500/8 border border-amber-500/20 text-xs text-amber-300">
        <Zap className="w-4 h-4 flex-shrink-0" />
        <span>
          <strong>NQM Aligned</strong> — Quantum Communication pillar. This lab simulates the core technology
          required for India's Quantum Internet under the National Quantum Mission (NQM 2023-2031).
        </span>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-4 border-b border-brand-border">
        {(['problem', 'circuit', 'results', 'challenge'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-16 py-10 text-xs font-semibold capitalize transition-colors border-b-2 -mb-[1px] ${
              tab === t
                ? 'text-brand-primary border-brand-primary'
                : 'text-text-muted border-transparent hover:text-text-secondary'
            }`}
          >
            {t === 'problem' ? '📖 Problem' : t === 'circuit' ? '⚛ Circuit' : t === 'results' ? '📊 Results' : '🏆 Challenge'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── PROBLEM TAB ─────────────────────────────────────────────────── */}
        {tab === 'problem' && (
          <motion.div key="problem" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
              <Card className="p-24 flex flex-col gap-16">
                <div className="flex items-center gap-10">
                  <WifiOff className="w-5 h-5 text-rose-400" />
                  <h3 className="font-bold text-rose-400">The Classical Problem</h3>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Sending a quantum state (qubit) through optical fiber suffers{' '}
                  <strong className="text-rose-300">exponential photon loss</strong>: every 15 km halves the signal.
                  At 100 km the probability of a single photon arriving drops to{' '}
                  <span className="font-mono text-rose-300">
                    {(fiberLoss(100).prob * 100).toExponential(2)}%
                  </span>
                  .
                  Classical optical amplifiers destroy quantum information — they measure before re-emitting,
                  collapsing superposition. You cannot simply copy a quantum state (No-Cloning Theorem).
                </p>
                <div className="p-12 rounded-lg bg-rose-500/10 border border-rose-500/20 font-mono text-xs text-rose-300">
                  P_direct = 10^(−α·L / 10) = 10^(−0.2×100/10) ≈ {fiberLoss(100).prob.toExponential(2)}
                </div>
              </Card>

              <Card className="p-24 flex flex-col gap-16">
                <div className="flex items-center gap-10">
                  <Wifi className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-emerald-400">The Quantum Solution</h3>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">
                  A <strong className="text-emerald-300">Quantum Repeater</strong> at the midpoint creates two
                  entangled pairs (Alice↔Repeater and Repeater↔Bob) over shorter, lower-loss segments.
                  The repeater then performs a <strong className="text-emerald-300">Bell State Measurement (BSM)</strong>{' '}
                  on its two local qubits — this "swaps" entanglement so Alice and Bob share a Bell pair
                  without ever exchanging photons directly.
                </p>
                <div className="p-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 font-mono text-xs text-emerald-300">
                  P_segment = 10^(−0.2×50/10) ≈ {fiberLoss(50).prob.toFixed(4)} (gain {(fiberLoss(50).prob / fiberLoss(100).prob).toFixed(0)}×)
                </div>
              </Card>
            </div>

            <Card className="p-24 flex flex-col gap-16">
              <h3 className="font-bold text-text-primary flex items-center gap-10">
                <Network className="w-4 h-4 text-brand-primary" />
                Entanglement Swapping — Step by Step
              </h3>
              <ol className="flex flex-col gap-12 text-sm text-text-secondary">
                {[
                  { n: 1, step: 'Alice & Repeater create Bell pair |Φ+⟩_AR (qubits q₀, q₁).' },
                  { n: 2, step: 'Repeater & Bob create Bell pair |Φ+⟩_RB (qubits q₂, q₃).' },
                  { n: 3, step: 'Repeater applies BSM (CNOT + H) on its local qubits q₁ & q₂.' },
                  { n: 4, step: 'BSM collapses q₁,q₂ → one of four Bell outcomes {|Φ+⟩,|Φ−⟩,|Ψ+⟩,|Ψ−⟩}.' },
                  { n: 5, step: 'Outcome determines which Pauli correction Bob must apply to restore |Φ+⟩_AB.' },
                  { n: 6, step: 'Alice & Bob now share maximally entangled state — without direct photon exchange!' },
                ].map(({ n, step }) => (
                  <li key={n} className="flex items-start gap-12">
                    <span className="flex-shrink-0 w-20 h-20 rounded-full bg-brand-primary/20 border border-brand-primary/40 flex items-center justify-center text-[10px] font-bold font-mono text-brand-primary">{n}</span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </Card>

            <button
              onClick={() => setTab('circuit')}
              className="self-start px-24 py-10 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/80 transition-colors"
            >
              View Circuit →
            </button>
          </motion.div>
        )}

        {/* ── CIRCUIT TAB ─────────────────────────────────────────────────── */}
        {tab === 'circuit' && (
          <motion.div key="circuit" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-24">
            <Card className="p-24 flex flex-col gap-20">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-text-primary flex items-center gap-10">
                  <Cpu className="w-4 h-4 text-brand-primary" /> 4-Qubit Entanglement Swapping Circuit
                </h3>
                <span className="text-[10px] font-mono text-text-muted bg-surface-raised px-8 py-3 rounded border border-brand-border">
                  Depth = 8 | Qiskit Aer
                </span>
              </div>
              <div className="p-16 rounded-xl bg-[#060d18] border border-brand-border overflow-x-auto">
                <CircuitDiagram />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-xs">
                {[
                  { q: 'q₀', label: 'Alice', role: 'Entangled with Repeater-Left', color: '#818cf8' },
                  { q: 'q₁', label: 'Repeater-Left', role: 'Local BSM qubit', color: '#f59e0b' },
                  { q: 'q₂', label: 'Repeater-Right', role: 'Local BSM qubit', color: '#f59e0b' },
                  { q: 'q₃', label: 'Bob', role: 'Entangled with Repeater-Right', color: '#22d3ee' },
                ].map(r => (
                  <div key={r.q} className="p-12 rounded-lg bg-surface-raised border border-brand-border flex flex-col gap-4">
                    <span className="font-mono font-bold" style={{ color: r.color }}>{r.q} — {r.label}</span>
                    <span className="text-text-muted leading-relaxed">{r.role}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Distance Slider + Run */}
            <Card className="p-24 flex flex-col gap-20">
              <h3 className="font-bold text-text-primary flex items-center gap-10">
                <Activity className="w-4 h-4 text-brand-primary" /> Configure & Run
              </h3>
              <div className="flex flex-col gap-12">
                <div className="flex items-center justify-between text-sm">
                  <label className="text-text-secondary font-medium">Link Distance</label>
                  <span className="font-mono font-bold text-brand-primary">{distanceKm} km</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={500}
                  step={10}
                  value={distanceKm}
                  onChange={e => setDistanceKm(Number(e.target.value))}
                  className="w-full accent-brand-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-text-muted">
                  <span>20 km</span>
                  <span>250 km (approx China-India QKD)</span>
                  <span>500 km</span>
                </div>
              </div>

              {/* Live attenuation chart */}
              <div className="p-16 rounded-xl bg-surface-raised border border-brand-border">
                <AttenuationChart result={result} distanceKm={distanceKm} />
              </div>

              <div className="flex items-center gap-12 p-12 rounded-lg bg-brand-primary/8 border border-brand-primary/20 text-xs text-brand-primary">
                <Info className="w-3 h-3 flex-shrink-0" />
                Repeater improves photon transmission probability by{' '}
                <strong className="ml-4">{gainX.toFixed(0)}× at {distanceKm} km</strong>
              </div>

              <button
                id="run-repeater-btn"
                onClick={handleRun}
                disabled={running}
                className="flex items-center justify-center gap-10 px-24 py-14 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: running
                    ? 'rgba(99,102,241,0.2)'
                    : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  color: '#fff',
                }}
              >
                {running ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Running Qiskit Aer Simulation…
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Entanglement Swapping
                  </>
                )}
              </button>

              {error && (
                <div className="flex items-center gap-8 p-12 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* ── RESULTS TAB ─────────────────────────────────────────────────── */}
        {tab === 'results' && (
          <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-24">
            {!result ? (
              <Card className="p-48 flex flex-col items-center gap-16 text-center">
                <Network className="w-12 h-12 text-text-muted opacity-30" />
                <p className="text-text-muted text-sm">Run the simulation to see results.</p>
                <button
                  onClick={() => setTab('circuit')}
                  className="px-20 py-10 rounded-lg bg-brand-primary/20 text-brand-primary text-sm hover:bg-brand-primary/30 transition-colors"
                >
                  Go to Circuit Tab →
                </button>
              </Card>
            ) : (
              <>
                {/* Network topology */}
                <Card className="p-24 flex flex-col gap-16">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-text-primary flex items-center gap-10">
                      <Network className="w-4 h-4 text-brand-primary" /> Live Network Topology
                    </h3>
                    <span className="flex items-center gap-6 text-xs text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Entanglement Established
                    </span>
                  </div>
                  <div className="p-16 rounded-xl bg-[#060d18] border border-brand-border overflow-x-auto">
                    <NetworkTopology distanceKm={result.distance_km} running={false} result={result} />
                  </div>
                  <div className="p-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 leading-relaxed">
                    <strong>Alice ↔ Repeater ↔ Bob.</strong> The purple arc shows the final |Φ+⟩_AB Bell pair
                    shared between Alice and Bob — established by BSM at the repeater node, not direct photon transmission.
                  </div>
                </Card>

                {/* Metric tiles */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-16">
                  <MetricTile label="Fidelity" value={(result.fidelity * 100).toFixed(2)} unit="%" color="#22c55e" icon={CheckCircle2} />
                  <MetricTile label="BSM Outcome" value={BSM_LABELS[result.bsm_outcome] ?? `|${result.bsm_outcome}⟩`} color="#f59e0b" icon={Zap} />
                  <MetricTile label="Entanglement Entropy" value={result.entanglement_entropy.toFixed(3)} unit="bit" color="#818cf8" icon={Activity} />
                  <MetricTile label="Circuit Depth" value={result.circuit_depth} unit="gates" color="#22d3ee" icon={Cpu} />
                </div>

                {/* Loss comparison + BSM counts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
                  <Card className="p-24 flex flex-col gap-16">
                    <h3 className="font-bold text-text-primary text-sm">Fiber Attenuation Analysis</h3>
                    <AttenuationChart result={result} distanceKm={result.distance_km} />
                    <div className="grid grid-cols-2 gap-12 text-xs font-mono">
                      <div className="p-10 rounded-lg bg-surface-raised border border-brand-border">
                        <div className="text-rose-400 mb-4">Direct P</div>
                        <div className="text-rose-300 font-bold">{result.direct_transmission_prob.toExponential(3)}</div>
                      </div>
                      <div className="p-10 rounded-lg bg-surface-raised border border-brand-border">
                        <div className="text-emerald-400 mb-4">Repeater P</div>
                        <div className="text-emerald-300 font-bold">{result.repeater_transmission_prob.toFixed(4)}</div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-24 flex flex-col gap-16">
                    <h3 className="font-bold text-text-primary text-sm">BSM Outcome Distribution</h3>
                    <CountsBars counts={result.counts} bsmOutcome={result.bsm_outcome} />
                    <div className="p-10 rounded-lg bg-surface-raised border border-brand-border text-xs text-text-muted leading-relaxed">
                      Each BSM outcome occurs with P = 25% — this is the quantum randomness of projective measurement.
                      The highlighted outcome <strong className="text-amber-400">{BSM_LABELS[result.bsm_outcome]}</strong> was the
                      actual result this run. Bob applies the corresponding Pauli correction to restore |Φ+⟩_AB.
                    </div>
                  </Card>
                </div>

                {/* Explanation box */}
                <Card className="p-24 border-brand-primary/30 flex flex-col gap-12">
                  <h3 className="font-bold text-brand-primary text-sm flex items-center gap-8">
                    <Info className="w-4 h-4" /> Physics Insight
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{result.explanation}</p>
                  {result.model_provenance && <p className="text-[10px] text-text-muted leading-relaxed">Model scope: {result.model_provenance}</p>}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-12 text-xs font-mono mt-8">
                    <div className="p-10 rounded-lg bg-surface-raised border border-brand-border">
                      <div className="text-text-muted mb-4">Subsystem Purity</div>
                      <div className="text-brand-primary font-bold">{result.subsystem_purity.toFixed(3)}</div>
                    </div>
                    <div className="p-10 rounded-lg bg-surface-raised border border-brand-border">
                      <div className="text-text-muted mb-4">Alice-Bob State</div>
                      <div className="text-indigo-400 font-bold text-[10px]">{result.alice_bob_state_label}</div>
                    </div>
                    <div className="p-10 rounded-lg bg-surface-raised border border-brand-border">
                      <div className="text-text-muted mb-4">Sim Time</div>
                      <div className="text-cyan-400 font-bold">{result.execution_time_ms.toFixed(1)} ms</div>
                    </div>
                  </div>
                </Card>

                <button
                  onClick={() => setTab('challenge')}
                  className="self-start px-24 py-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-semibold hover:bg-amber-500/30 transition-colors"
                >
                  Take the Challenge →
                </button>
              </>
            )}
          </motion.div>
        )}

        {/* ── CHALLENGE TAB ───────────────────────────────────────────────── */}
        {tab === 'challenge' && (
          <motion.div key="challenge" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-24">
            <Card className="p-24 flex flex-col gap-20">
              <h3 className="font-bold text-text-primary flex items-center gap-10">
                🏆 Mastery Challenges
              </h3>
              <ol className="flex flex-col gap-16">
                {[
                  {
                    q: 'At what distance does direct fiber transmission probability drop below 1%? Calculate using α = 0.2 dB/km.',
                    hint: 'P = 10^(−αL/10) < 0.01 → L > 100 km',
                    color: 'emerald',
                  },
                  {
                    q: 'Why does the BSM at the repeater destroy entanglement in the AR and RB segments but CREATE it in the AB pair? Name the phenomenon.',
                    hint: 'Entanglement swapping via quantum teleportation of the entangled state.',
                    color: 'indigo',
                  },
                  {
                    q: 'If BSM gives outcome |Ψ+⟩, what single Pauli operation must Bob apply to restore |Φ+⟩_AB?',
                    hint: 'σ_x (bit-flip). See the Pauli correction table for all 4 BSM outcomes.',
                    color: 'amber',
                  },
                  {
                    q: 'How many repeater nodes would you need to achieve P > 50% over 1000 km? Design the chain.',
                    hint: 'With N segments each of L/N km: P_seg = 10^(−0.2×(1000/N)/10). Solve for N such that P_seg > 0.5.',
                    color: 'purple',
                  },
                  {
                    q: 'Why is quantum memory (for storing entangled qubits while waiting for BSM results) the hardest hardware challenge for a real repeater?',
                    hint: 'Classical communication of BSM results takes ~L/(2c) time. Qubit coherence time must exceed this.',
                    color: 'cyan',
                  },
                ].map((ch, i) => (
                  <ChallengeItem key={i} n={i + 1} question={ch.q} hint={ch.hint} color={ch.color} />
                ))}
              </ol>
            </Card>

            <Card className="p-24 flex flex-col gap-12 border-dashed">
              <div className="text-xs font-orbitron text-text-muted uppercase tracking-widest">Real-World Context</div>
              <p className="text-sm text-text-secondary leading-relaxed">
                Real repeaters must coordinate heralding, quantum memories, detector efficiency, gate noise and classical
                feed-forward. This educational model isolates the ideal entanglement-swapping circuit and fiber attenuation
                so you can reason about those ingredients separately; it does not reproduce a field-deployed network.
              </p>
            </Card>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Running animation overlay for network */}
      {running && tab !== 'results' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-16 rounded-xl bg-[#060d18] border border-brand-border overflow-hidden"
        >
          <div className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest mb-12">
            Live Simulation — {distanceKm} km link
          </div>
          <NetworkTopology distanceKm={distanceKm} running={true} result={null} />
        </motion.div>
      )}
    </div>
  );
}

// ─── Challenge Item ───────────────────────────────────────────────────────────

function ChallengeItem({
  n, question, hint, color,
}: { n: number; question: string; hint: string; color: string }) {
  const [showHint, setShowHint] = useState(false);

  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/8',
    indigo: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/8',
    amber: 'text-amber-400 border-amber-500/30 bg-amber-500/8',
    purple: 'text-purple-400 border-purple-500/30 bg-purple-500/8',
    cyan: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/8',
  };

  return (
    <li className="flex flex-col gap-10">
      <div className="flex items-start gap-12">
        <span className={`flex-shrink-0 w-24 h-24 rounded-full border flex items-center justify-center text-[10px] font-bold font-mono ${colorMap[color]}`}>
          {n}
        </span>
        <p className="text-sm text-text-secondary leading-relaxed">{question}</p>
      </div>
      <div className="ml-36">
        <button
          onClick={() => setShowHint(h => !h)}
          className="text-[10px] font-mono text-text-muted hover:text-text-secondary transition-colors underline underline-offset-2"
        >
          {showHint ? 'Hide hint' : 'Show hint'}
        </button>
        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mt-8 p-10 rounded-lg border text-xs leading-relaxed font-mono ${colorMap[color]}`}
            >
              💡 {hint}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </li>
  );
}
