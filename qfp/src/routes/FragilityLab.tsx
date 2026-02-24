import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import BlochSphere3D from '../components/BlochSphere3D';
import type { BlochSphere3DHandle } from '../components/BlochSphere3D';
import DecoherenceGraph from '../components/DecoherenceGraph';
import TimeMachine from '../components/TimeMachine';
import { Card, PageHeader, SectionHeader, Badge, InfoBox, Divider } from '../components/UI';
import { useTimeEvolution } from '../hooks/useTimeEvolution';
import { useSound } from '../hooks/useSound';
import { PRESET_VECTORS } from '../types/quantum';
import type { BlochVector, NoiseParams, PresetState } from '../types/quantum';
import { useTour } from '../providers/GuidedTourProvider';

const NOISE_CHANNELS = [
  { id: 'depolarizing', label: 'Depolarizing', desc: 'Random Pauli errors in all directions.' },
  { id: 'phaseFlip', label: 'Phase Flip', desc: 'Random Z flips, destroys phase coherence.' },
  { id: 'bitFlip', label: 'Bit Flip', desc: 'Random X flips, bit-flip errors.' },
  { id: 'amplitudeDamping', label: 'Amp. Damping (T₁)', desc: 'Energy loss, decay toward ground state.' },
];

const PRESETS: Record<string, Partial<NoiseParams>> = {
  clean: { depolarizing: 0, phaseFlip: 0, bitFlip: 0, amplitudeDamping: 0 },
  noisy: { depolarizing: 0.3, phaseFlip: 0.2, bitFlip: 0.1, amplitudeDamping: 0.1 },
  t1_only: { amplitudeDamping: 0.6, depolarizing: 0, phaseFlip: 0, bitFlip: 0 },
  t2_like: { phaseFlip: 0.6, depolarizing: 0, amplitudeDamping: 0, bitFlip: 0 },
};

export default function FragilityLab() {
  const [noise, setNoise] = useState<NoiseParams>({
    depolarizing: 0,
    phaseFlip: 0,
    bitFlip: 0,
    amplitudeDamping: 0,
    speed: 1,
  });

  const [preset, setPreset] = useState<PresetState>('plus');
  const [history, setHistory] = useState<BlochVector[]>([]);
  const [graphData, setGraphData] = useState<any[]>([]);
  const [stepCount, setStepCount] = useState(0);
  const [visibleLines, setVisibleLines] = useState({ health: true, x: true, y: true, z: true });
  const [snapshots, setSnapshots] = useState<{ id: string; state: BlochVector; timestamp: number; imageUrl: string }[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const blochRef = useRef<BlochSphere3DHandle>(null);
  const { startTour } = useTour();

  const lastGraphUpdate = useRef(0);
  const { updateHealth, resumeAudio } = useSound(true);

  const { state, history: evoHistory, running, setRunning, resetTo, scrubToIndex } = useTimeEvolution({
    initialState: PRESET_VECTORS[preset],
    noise,
  });

  // Update graph from state
  useEffect(() => {
    if (running) {
      setStepCount(s => s + 1);

      const now = Date.now();
      if (now - lastGraphUpdate.current > 200) {
        const r = Math.sqrt(state.x ** 2 + state.y ** 2 + state.z ** 2);
        const coherence = Math.sqrt(state.x ** 2 + state.y ** 2);
        const purity = (1 + r ** 2) / 2;
        const p0 = (state.z + 1) / 2;
        setGraphData(prev => [...prev.slice(-100), {
          time: stepCount,
          r,
          coherence,
          purity,
          x: state.x,
          y: state.y,
          z: state.z,
          p0,
          p1: 1 - p0
        }]);
        lastGraphUpdate.current = now;
      }
    }
  }, [state, running, stepCount]);

  // Handle Sonification
  useEffect(() => {
    const health = Math.sqrt(state.x ** 2 + state.y ** 2 + state.z ** 2) * 100;
    updateHealth(health, audioEnabled && running);
    return () => updateHealth(0, false);
  }, [state, audioEnabled, running, updateHealth]);

  const r = Math.sqrt(state.x ** 2 + state.y ** 2 + state.z ** 2);
  const transverseCoherence = Math.sqrt(state.x ** 2 + state.y ** 2);
  const purity = (1 + r ** 2) / 2;
  const p0 = (state.z + 1) / 2;

  const takeSnapshot = () => {
    const imageUrl = blochRef.current?.capture() ?? '';
    setSnapshots(prev => [
      { id: Math.random().toString(36).substr(2, 9), state: { ...state }, timestamp: Date.now(), imageUrl },
      ...prev,
    ].slice(0, 5));
  };

  const applyPreset = (p: keyof typeof PRESETS) => {
    setNoise(prev => ({ ...prev, ...PRESETS[p] }));
  };

  const resetSimulation = () => {
    setRunning(false);
    resetTo(PRESET_VECTORS[preset]);
    setHistory([]);
    setGraphData([]);
    setStepCount(0);
    // Reset all noises to 0
    setNoise({
      depolarizing: 0,
      phaseFlip: 0,
      bitFlip: 0,
      amplitudeDamping: 0,
      speed: 1,
    });
  };

  const startResearchTour = () => {
    startTour("Decoherence Discovery", [
      {
        target: "state-init",
        content: "Welcome, researcher. Let's begin by initializing our qubit in the |+⟩ state (superposition).",
        action: () => {
          setPreset('plus');
          resetTo(PRESET_VECTORS['plus']);
          setNoise(prev => ({ ...prev, depolarizing: 0, phaseFlip: 0, bitFlip: 0, amplitudeDamping: 0 }));
        }
      },
      {
        target: "noise-phase",
        content: "Now, watch carefully as we introduce 'Phase Flip' noise. Notice how the Bloch vector shrinks towards the Z-axis, destroying phase coherence.",
        action: () => setNoise(prev => ({ ...prev, phaseFlip: 0.6 }))
      },
      {
        target: "sonification",
        content: "Listen to the 'Sonification'. The clean tone becomes distorted as entropy increases. This is the audible signal of information leakage.",
        action: () => setAudioEnabled(true)
      },
      {
        target: "time-machine",
        content: "We can use the 'Time Machine' to rewind and see exactly when the coherence was lost. Research complete.",
        action: () => setRunning(false)
      }
    ]);
  };

  return (
    <div className="flex flex-col gap-24">
      <div className="flex justify-between items-start">
        <PageHeader
          title="Fragility Lab"
          subtitle="Explore how environmental interactions destroy quantum coherence through real-time noise simulation."
          icon="🔬"
        />
        <button
          onClick={startResearchTour}
          className="mt-24 btn btn-primary !px-20 !py-10 bg-gradient-to-r from-brand-primary to-brand-cyan flex items-center gap-8 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all"
        >
          <span className="text-lg">🎬</span>
          <span className="font-orbitron text-[10px] font-black tracking-widest uppercase">Play Research Tour</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_360px] gap-24 items-start">
        {/* Left: Controls */}
        <div className="flex flex-col gap-24">
          <Card className="p-20 flex flex-col gap-24">
            <SectionHeader title="Noise Channels" />
            <div className="flex flex-col gap-16 overflow-y-auto max-h-[400px] pr-8 custom-scrollbar">
              {NOISE_CHANNELS.map(ch => (
                <div key={ch.id} className="flex flex-col gap-6">
                  <div className="flex justify-between items-center text-[10px] font-orbitron uppercase text-text-secondary">
                    <span title={ch.desc} className="cursor-help border-b border-dashed border-text-muted">{ch.label}</span>
                    <span className="text-brand-primary">{((noise[ch.id as keyof NoiseParams] as number) * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range" min={0} max={1} step={0.01}
                    value={noise[ch.id as keyof NoiseParams] as number}
                    onChange={e => setNoise(prev => ({ ...prev, [ch.id]: parseFloat(e.target.value) }))}
                    className="w-full h-4 bg-brand-border rounded-full appearance-none cursor-pointer accent-brand-primary"
                  />
                </div>
              ))}
            </div>

            <Divider />

            <div className="flex flex-col gap-12">
              <SectionHeader title="Presets" />
              <div className="grid grid-cols-2 gap-8">
                {Object.keys(PRESETS).map(p => (
                  <button key={p} onClick={() => applyPreset(p as any)} className="px-8 py-6 rounded-lg border border-brand-border text-[9px] font-orbitron hover:border-brand-primary transition-all uppercase">{p}</button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-8 mt-12">
              <button
                onClick={() => {
                  setAudioEnabled(!audioEnabled);
                  resumeAudio();
                }}
                className={`btn text-[10px] font-orbitron ${audioEnabled ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan' : 'border-brand-border text-text-muted'}`}
              >
                {audioEnabled ? '🔊 Sonification ON' : '🔇 Audio Disabled'}
              </button>
              <button
                onClick={() => setRunning(!running)}
                className={`btn btn-primary w-full ${running ? 'bg-brand-red' : ''}`}
              >
                {running ? '⏸ Pause' : '▶ Resume Evolution'}
              </button>
              <button onClick={resetSimulation} className="btn btn-secondary w-full">↺ Reset State</button>
            </div>
          </Card>

          <Card className="p-20 flex flex-col gap-16">
            <SectionHeader title="Initial State" />
            <div className="grid grid-cols-2 gap-8">
              {(['plus', 'zero', 'one', 'minus'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => { setPreset(p); resetTo(PRESET_VECTORS[p]); setHistory([]); setGraphData([]); setStepCount(0); }}
                  className={`px-12 py-8 rounded-lg border text-xs font-mono transition-all ${preset === p ? 'bg-brand-primary border-brand-primary text-white' : 'bg-surface border-brand-border hover:border-brand-primary'}`}
                >
                  {p === 'plus' ? '|+⟩' : p === 'zero' ? '|0⟩' : p === 'one' ? '|1⟩' : '|−⟩'}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Center: Bloch Sphere & Graph */}
        <div className="flex flex-col gap-24 w-full min-w-0">
          <Card className="h-[450px] relative overflow-hidden">
            <div className="absolute top-20 left-20 z-10">
              <Badge color={r > 0.95 ? 'green' : r > 0.3 ? 'gold' : 'red'}>
                {r > 0.95 ? 'Pure State' : r > 0.3 ? 'Mixed State' : 'Maximally Mixed'}
              </Badge>
            </div>
            <div className="absolute top-20 right-20 z-10 flex gap-8">
              <button onClick={takeSnapshot} className="px-12 py-6 rounded-lg bg-surface/50 border border-brand-border text-[10px] font-orbitron hover:bg-surface transition-all">📸 Photo</button>
            </div>
            <BlochSphere3D ref={blochRef} state={state} health={r * 100} history={evoHistory} />
          </Card>

          <TimeMachine
            history={evoHistory}
            onScrub={scrubToIndex}
            currentIndex={evoHistory.length - 1}
            isRunning={running}
            onTogglePlay={() => setRunning(!running)}
          />

          <div className="h-[300px] min-w-0">
            <DecoherenceGraph data={graphData} visibleLines={visibleLines} />
          </div>
        </div>

        {/* Right: Stats & Snapshots */}
        <div className="flex flex-col gap-24">
          <Card className="p-20 flex flex-col gap-24">
            <SectionHeader title="Live Statistics" />
            <div className="flex flex-col gap-12">
              <div className="flex justify-between items-center p-12 rounded-xl bg-background border border-brand-border">
                <div className="text-[10px] text-text-muted uppercase">Coherence (Transverse)</div>
                <div className="text-xl font-mono text-brand-cyan">{transverseCoherence.toFixed(3)}</div>
              </div>
              <div className="flex justify-between items-center p-12 rounded-xl bg-background border border-brand-border">
                <div className="text-[10px] text-text-muted uppercase">Purity Tr(ρ²)</div>
                <div className="text-xl font-mono text-brand-purple">{purity.toFixed(4)}</div>
              </div>
              <div className="flex justify-between items-center p-12 rounded-xl bg-background border border-brand-border">
                <div className="text-[10px] text-text-muted uppercase">Length |r|</div>
                <div className="text-xl font-mono text-brand-gold">{r.toFixed(3)}</div>
              </div>
            </div>

            <Divider />

            <div className="flex flex-col gap-12">
              <div className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Graph Filters</div>
              <div className="grid grid-cols-2 gap-8">
                {Object.keys(visibleLines).map(k => (
                  <button
                    key={k}
                    onClick={() => setVisibleLines(prev => ({ ...prev, [k]: !prev[k as keyof typeof visibleLines] }))}
                    className={`px-8 py-4 rounded-lg border text-[9px] font-orbitron transition-all ${visibleLines[k as keyof typeof visibleLines] ? 'bg-brand-primary/10 border-brand-primary text-brand-primary' : 'border-brand-border text-text-muted opacity-50'}`}
                  >
                    {k.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-20 flex flex-col gap-16">
            <SectionHeader title="Snapshots" />
            {snapshots.length === 0 ? (
              <div className="text-center py-32 opacity-20 italic text-xs">No snapshots yet — click 📸 Photo</div>
            ) : (
              <div className="flex flex-col gap-10">
                {snapshots.map(s => (
                  <div key={s.id} className="rounded-xl border border-brand-border overflow-hidden bg-background">
                    {/* Canvas thumbnail */}
                    {s.imageUrl && (
                      <div className="relative w-full h-[120px] bg-black overflow-hidden">
                        <img
                          src={s.imageUrl}
                          alt="Bloch sphere snapshot"
                          className="w-full h-full object-cover"
                          style={{ imageRendering: 'crisp-edges' }}
                        />
                        <div className="absolute top-6 right-6">
                          <span className="text-[8px] font-orbitron px-6 py-3 rounded-md bg-black/60 text-brand-cyan border border-brand-cyan/20">
                            |r|={Math.sqrt(s.state.x ** 2 + s.state.y ** 2 + s.state.z ** 2).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                    {/* Data row */}
                    <div className="flex justify-between items-center px-12 py-8">
                      <div className="flex flex-col gap-2">
                        <span className="text-[9px] text-text-muted">{new Date(s.timestamp).toLocaleTimeString()}</span>
                        <span className="text-[9px] font-mono text-white/50">
                          ({s.state.x.toFixed(2)}, {s.state.y.toFixed(2)}, {s.state.z.toFixed(2)})
                        </span>
                      </div>
                      <div className="flex gap-6">
                        {s.imageUrl && (
                          <a
                            href={s.imageUrl}
                            download={`bloch-${new Date(s.timestamp).toISOString().slice(0, 19).replace(/:/g, '-')}.png`}
                            className="px-8 py-4 rounded-md border border-brand-border text-[8px] hover:border-brand-cyan text-brand-cyan transition-all"
                          >💾 Save</a>
                        )}
                        <button
                          onClick={() => resetTo(s.state)}
                          className="px-8 py-4 rounded-md border border-brand-border text-[8px] hover:border-brand-primary transition-all"
                        >RESTORE</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
