import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BlochSphere3D from '../components/BlochSphere3D';
import { Card, PageHeader, SectionHeader, Badge, InfoBox } from '../components/UI';
import { useTimeEvolution } from '../hooks/useTimeEvolution';
import type { BlochVector, PresetState, NoiseParams } from '../types/quantum';
import { PRESET_VECTORS } from '../types/quantum';

const INITIAL_NOISE: NoiseParams = {
  depolarizing: 0.1,
  phaseFlip: 0.1,
  bitFlip: 0.05,
  amplitudeDamping: 0.05,
  speed: 1
};

function getVectorLength(v: BlochVector) {
  return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
}

function getStatus(health: number) {
  if (health > 95) return { label: 'QUANTUM', color: 'green' };
  if (health > 60) return { label: 'PARTIAL', color: 'yellow' };
  if (health > 15) return { label: 'DECOHERED', color: 'red' };
  return { label: 'CLASSICAL', color: 'gray' };
}

const QuantumVsClassical = () => {
  const [preset, setPreset] = useState<PresetState>('plus');
  const [noise, setNoise] = useState<NoiseParams>(INITIAL_NOISE);
  const [classicalVal, setClassicalVal] = useState<0 | 1>(0);

  const { state, running, setRunning, resetTo } = useTimeEvolution({
    initialState: PRESET_VECTORS[preset],
    noise
  });

  const healthPercent = getVectorLength(state) * 100;
  const status = getStatus(healthPercent);

  // Classical "integrity" calculation - much more robust than quantum
  const noiseSum = (noise.depolarizing + noise.phaseFlip + noise.bitFlip + noise.amplitudeDamping);
  const classicalIntegrity = running ? Math.max(0, 100 - (noiseSum * 5 * noise.speed)) : 100;

  const handlePreset = (p: PresetState) => {
    setPreset(p);
    resetTo(PRESET_VECTORS[p]);
    if (p === 'zero') setClassicalVal(0);
    if (p === 'one') setClassicalVal(1);
  };

  const handleReset = () => {
    setRunning(false);
    resetTo(PRESET_VECTORS[preset]);
    setNoise(INITIAL_NOISE);
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNoise(prev => ({ ...prev, speed: parseFloat(e.target.value) }));
  };

  return (
    <div className="flex flex-col gap-32">
      <PageHeader
        title="Quantum vs Classical"
        subtitle="Experience why qubits are notoriously fragile while classical bits are rock-solid."
      />

      {/* Shared Controls */}
      <Card className="p-16 flex flex-wrap items-center justify-between gap-24 border-brand-primary/20">
        <div className="flex items-center gap-16">
          <span className="text-xs font-orbitron uppercase text-text-muted">Initial State:</span>
          <div className="flex gap-4">
            {(['plus', 'zero', 'one', 'minus'] as const).map(p => (
              <button
                key={p}
                onClick={() => handlePreset(p)}
                className={`px-16 py-8 rounded-lg border font-mono text-sm transition-all ${preset === p ? 'bg-brand-primary border-brand-primary text-white scale-105' : 'bg-surface border-brand-border hover:border-brand-primary/40 text-text-secondary'}`}
              >
                {p === 'plus' ? '|+⟩' : p === 'zero' ? '|0⟩' : p === 'one' ? '|1⟩' : '|−⟩'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-24 flex-1 justify-center">
          <button
            onClick={() => setRunning(!running)}
            className={`btn ${running ? 'btn-outline border-brand-red text-brand-red' : 'btn-primary'} min-w-[140px] flex items-center justify-center gap-8`}
          >
            {running ? (
              <><span className="w-8 h-8 rounded-full bg-brand-red animate-pulse" /> PAUSE</>
            ) : (
              <><span className="w-12 h-12 border-l-8 border-l-white border-y-8 border-y-transparent ml-4" /> PLAY</>
            )}
          </button>
          <button onClick={handleReset} className="btn bg-surface border-brand-border text-text-secondary hover:text-text-primary">
            RESET
          </button>
        </div>

        <div className="flex items-center gap-16">
          <span className="text-xs font-orbitron uppercase text-text-muted min-w-[80px]">Speed: {noise.speed.toFixed(1)}x</span>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={noise.speed}
            onChange={handleSpeedChange}
            className="w-120 accent-brand-primary"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-32">
        {/* Left: Quantum Side */}
        <Card className="p-24 flex flex-col gap-24 relative border-brand-primary/20 shadow-lg shadow-brand-primary/5">
          <div className="flex justify-between items-start">
            <div>
              <Badge color="primary">Quantum Qubit</Badge>
              <h3 className="text-2xl font-orbitron mt-8 gradient-text">Dynamic Superposition</h3>
            </div>
            <motion.div
              initial={false}
              animate={{ backgroundColor: status.color === 'green' ? '#10b981' : status.color === 'yellow' ? '#f59e0b' : status.color === 'red' ? '#ef4444' : '#6b7280' }}
              className="px-12 py-4 rounded text-[10px] font-orbitron text-white tracking-widest"
            >
              {status.label} ({healthPercent.toFixed(0)}%)
            </motion.div>
          </div>

          <div className="h-[400px] bg-slate-900/40 rounded-3xl overflow-hidden relative border border-brand-border/50">
            <BlochSphere3D state={state} health={healthPercent} history={[]} />
          </div>

          <div className="flex flex-col gap-8">
            <div className="flex justify-between text-[10px] font-orbitron uppercase tracking-widest text-text-muted">
              <span>Coherence Health</span>
              <span>{healthPercent.toFixed(1)}%</span>
            </div>
            <div className="h-12 bg-slate-800 rounded-full overflow-hidden border border-brand-border/30">
              <motion.div
                className="h-full rounded-full"
                animate={{
                  width: `${healthPercent}%`,
                  backgroundColor: healthPercent > 60 ? '#10b981' : healthPercent > 15 ? '#f59e0b' : '#ef4444'
                }}
                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              />
            </div>
          </div>

          <p className="text-sm text-text-secondary leading-relaxed">
            Every passing millisecond, interactions with the environment "leak" quantum information away. The Bloch vector shrinks toward the center as it decoheres into a classical state.
          </p>
        </Card>

        {/* Right: Classical Side */}
        <Card className="p-24 flex flex-col gap-24 relative border-brand-green/20">
          <div className="flex justify-between items-start">
            <div>
              <Badge color="green">Classical Bit</Badge>
              <h3 className="text-2xl font-orbitron mt-8 text-brand-green">Stable Logic</h3>
            </div>
            <div className={`px-12 py-4 rounded text-[10px] font-orbitron text-white tracking-widest transition-colors ${classicalIntegrity > 98 ? 'bg-brand-green' : 'bg-brand-gold'}`}>
              {classicalIntegrity > 98 ? 'PERFECTLY STABLE' : `DISTURBED (${classicalIntegrity.toFixed(0)}%)`}
            </div>
          </div>

          <div
            className="h-[400px] bg-slate-900/20 rounded-3xl flex items-center justify-center cursor-pointer group border border-brand-green/10 overflow-hidden relative"
            onClick={() => setClassicalVal(v => v === 0 ? 1 : 0)}
          >
            {/* Visual Disturbance / Noise Overlay */}
            <AnimatePresence>
              {running && noiseSum > 0.1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: (100 - classicalIntegrity) / 200 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white pointer-events-none mix-blend-overlay"
                  style={{
                    backgroundImage: `repeating-linear-gradient(${Math.random() * 360}deg, #fff, #000 1px, #fff 2px)`
                  }}
                />
              )}
            </AnimatePresence>

            <div className="relative">
              <motion.div
                key={classicalVal}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: running ? (Math.random() - 0.5) * (100 - classicalIntegrity) / 10 : 0,
                  y: running ? (Math.random() - 0.5) * (100 - classicalIntegrity) / 10 : 0,
                }}
                transition={running ? { duration: 0.1, repeat: Infinity } : {}}
                className={`text-[180px] font-orbitron font-black select-none transition-colors ${classicalIntegrity > 98 ? 'text-brand-green' : 'text-brand-gold'}`}
              >
                {classicalVal}
              </motion.div>
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-orbitron text-brand-green opacity-40 group-hover:opacity-100 transition-opacity uppercase">
                {classicalIntegrity > 98 ? 'Click to toggle bit' : 'Signal noise detected'}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div className="flex justify-between text-[10px] font-orbitron uppercase tracking-widest text-text-muted">
              <span>Signal Integrity</span>
              <span className="text-brand-green">{classicalIntegrity.toFixed(1)}%</span>
            </div>
            <div className="h-12 bg-slate-800 rounded-full overflow-hidden border border-brand-green/10">
              <motion.div
                className="h-full bg-brand-green"
                animate={{ width: `${classicalIntegrity}%` }}
              />
            </div>
          </div>

          <p className="text-sm text-text-secondary leading-relaxed">
            A classical bit is macroscopic—built from billions of atoms. While it slightly feels environmental "noise" as signal jitter, its state remains binary and extremely stable compared to a qubit.
          </p>
        </Card>
      </div>

      {/* Comparison Sections */}
      <SectionHeader title="The Breakdown" subtitle="How they stack up side-by-side" />

      <div className="overflow-x-auto rounded-2xl border border-brand-border bg-surface/50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-brand-border bg-brand-primary/5">
              <th className="p-20 text-xs font-orbitron uppercase tracking-widest">Property</th>
              <th className="p-20 text-xs font-orbitron uppercase tracking-widest text-brand-primary">Quantum Qubit</th>
              <th className="p-20 text-xs font-orbitron uppercase tracking-widest text-brand-green">Classical Bit</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr className="border-b border-brand-border/50">
              <td className="p-20 font-bold">Information Carrier</td>
              <td className="p-20">Superposition of 0 and 1</td>
              <td className="p-20">Discrete 0 or 1</td>
            </tr>
            <tr className="border-b border-brand-border/50">
              <td className="p-20 font-bold">Affected by Environment</td>
              <td className="p-20 text-brand-red/80 font-medium">Yes - High Sensitivity</td>
              <td className="p-20 text-brand-green/80 font-medium">No - Macroscopic Stability</td>
            </tr>
            <tr className="border-b border-brand-border/50">
              <td className="p-20 font-bold">Copyable?</td>
              <td className="p-20">No (No-Cloning Theorem)</td>
              <td className="p-20">Yes (Trivial)</td>
            </tr>
            <tr className="border-b border-brand-border/50">
              <td className="p-20 font-bold">Measurement Effect</td>
              <td className="p-20">Collapses Superposition</td>
              <td className="p-20">No Effect</td>
            </tr>
            <tr>
              <td className="p-20 font-bold">Error Rate over Time</td>
              <td className="p-20">Increases quickly (Decoherence)</td>
              <td className="p-20">Effectively Zero</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Card className="p-32 border-brand-gold/30 bg-brand-gold/5 relative overflow-hidden">
        <div className="absolute -right-24 -bottom-24 text-9xl opacity-[0.03] rotate-12 select-none">⚠️</div>
        <div className="relative z-10">
          <h4 className="flex items-center gap-12 text-xl font-orbitron mb-16 text-brand-gold">
            <span>🛡️</span> Why does this matter?
          </h4>
          <p className="text-text-secondary leading-relaxed max-w-4xl">
            This "fragility" is the single greatest challenge in modern physics. To build a useful quantum computer, we need qubits that stay quantum for as long as possible. Because they are so easily disturbed, scientists must cool quantum processors to temperatures <strong>colder than deep space</strong> and use complex <strong>Quantum Error Correction</strong> codes to spot and fix errors as they happen.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default QuantumVsClassical;
