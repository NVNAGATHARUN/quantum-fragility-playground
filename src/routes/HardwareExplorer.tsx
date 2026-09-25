import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Cryostat3D, { CRYOSTAT_STAGES } from '../components/Cryostat3D';
import type { Cryostat3DHandle } from '../components/Cryostat3D';
import BlochSphere3D from '../components/BlochSphere3D';
import MicrowavePulseCanvas from '../components/MicrowavePulseCanvas';
import { Card, PageHeader, SectionHeader, Badge, InfoBox, Divider } from '../components/UI';
import { Cpu, Zap, Activity, Waves, Thermometer, ShieldAlert, Sparkles, Play, Layers } from 'lucide-react';
import { simulateCircuit } from '../api/quantum';
import type { CircuitIR, GateOperation, NormalizedSimulationResult, BlochVector } from '../types/quantum';

interface PulseConfig {
  id: string;
  name: string;
  gate: string;
  frequencyGhz: number;
  durationNs: number;
  angle: string;
  envelope: string;
  targetState: BlochVector;
  description: string;
}

const MICROWAVE_PULSES: PulseConfig[] = [
  {
    id: 'x-pi',
    name: 'Pauli-X Gate (π-Pulse)',
    gate: 'X',
    frequencyGhz: 5.20,
    durationNs: 20.0,
    angle: 'θ = π radians',
    envelope: 'Cosine DRAG (Derivative Removal by Adiabatic Gate)',
    targetState: { x: 0, y: 0, z: -1 }, // |1> state
    description: 'Resonant microwave pulse driving transition |0⟩ → |1⟩ by flipping the spin vector 180° around the X-axis.',
  },
  {
    id: 'h-pi2',
    name: 'Hadamard Gate (π/2-Pulse)',
    gate: 'H',
    frequencyGhz: 5.20,
    durationNs: 10.0,
    angle: 'θ = π/2 radians',
    envelope: 'Gaussian DRAG',
    targetState: { x: 1, y: 0, z: 0 }, // |+> state
    description: 'Quarter-period rotation creating equal superposition (|0⟩+|1⟩)/√2 with zero relative phase.',
  },
  {
    id: 'z-phase',
    name: 'Pauli-Z Gate (Virtual Frame Rotation)',
    gate: 'Z',
    frequencyGhz: 5.20,
    durationNs: 0.0,
    angle: 'ϕ = π radians',
    envelope: 'Instantaneous Numerical Phase Shift',
    targetState: { x: 0, y: 0, z: 1 }, // Back to |0>
    description: 'Executed in 0 ns with zero microwave noise by shifting the reference phase of subsequent pulses in room-temperature software.',
  },
  {
    id: 'readout',
    name: 'Dispersive Readout Pulse',
    gate: 'MEASURE',
    frequencyGhz: 7.15,
    durationNs: 1000.0,
    angle: 'Dispersive Cavity Shift',
    envelope: 'Square Flat-Top with Ring-Up',
    targetState: { x: 0, y: 0, z: 1 },
    description: 'Off-resonant tone sent to the readout resonator. The transmitted phase shifts by ±χ depending on qubit state.',
  },
];

export default function HardwareExplorer() {
  const [selectedPulse, setSelectedPulse] = useState<PulseConfig>(MICROWAVE_PULSES[0]);
  const [activeStage, setActiveStage] = useState<number>(0);
  const [isPulsing, setIsPulsing] = useState<boolean>(false);
  const [pulseProgress, setPulseProgress] = useState<number>(0);
  const [currentState, setCurrentState] = useState<BlochVector>({ x: 0, y: 0, z: 1 });
  const [simResult, setSimResult] = useState<NormalizedSimulationResult | null>(null);

  const cryostatRef = useRef<Cryostat3DHandle>(null);

  // Trigger microwave pulse transmission journey
  const transmitPulse = () => {
    if (isPulsing) return;
    setIsPulsing(true);
    setPulseProgress(0);

    const startTime = performance.now();
    const journeyDurationMs = 2400; // 2.4s travel time down the cryostat

    const stepJourney = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / journeyDurationMs);
      setPulseProgress(progress);

      // Auto-focus the corresponding stage plate as the pulse passes
      const stageIdx = Math.min(4, Math.floor(progress * 5));
      setActiveStage(stageIdx);

      if (progress < 1) {
        requestAnimationFrame(stepJourney);
      } else {
        // Pulse arrived at the 15 mK chip!
        setIsPulsing(false);
        applyPulseToQpu(selectedPulse);
      }
    };

    requestAnimationFrame(stepJourney);
  };

  // When pulse arrives at the 15 mK chip, execute circuit through Qiskit Aer
  const applyPulseToQpu = async (pulse: PulseConfig) => {
    try {
      const ops: GateOperation[] = [];
      if (pulse.gate === 'X') {
        ops.push({ id: 'g1', gate: 'X', targets: [0], controls: [], step: 0 });
      } else if (pulse.gate === 'H') {
        ops.push({ id: 'g1', gate: 'H', targets: [0], controls: [], step: 0 });
      } else if (pulse.gate === 'Z') {
        ops.push({ id: 'g1', gate: 'Z', targets: [0], controls: [], step: 0 });
      } else if (pulse.gate === 'MEASURE') {
        ops.push({ id: 'g1', gate: 'MEASURE', targets: [0], controls: [], step: 0 });
      }

      const circuit: CircuitIR = {
        version: '1.0',
        qubits: 1,
        classicalBits: 1,
        operations: ops,
      };

      const res = await simulateCircuit(circuit);
      setSimResult(res);
      setCurrentState(pulse.targetState);
    } catch (err) {
      console.error('Failed to simulate QPU pulse execution:', err);
      setCurrentState(pulse.targetState);
    }
  };

  const currentStageInfo = CRYOSTAT_STAGES[activeStage];

  return (
    <div className="flex flex-col gap-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-16">
        <PageHeader
          title="Three-Lens Hardware Explorer"
          subtitle="Synchronizing Quantum Algorithms ↔ Physical Statevectors ↔ 3D Dilution Refrigerator."
          icon="❄️"
        />

        <div className="flex items-center gap-8 self-end">
          <Badge color="cyan">Cryo-Telemetry: 15 mK Active</Badge>
          <Badge color="green">Transmon QPU: 5.20 GHz</Badge>
        </div>
      </div>

      {/* Main Grid: Three Lenses */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_360px] gap-24 items-start">
        {/* LENS 1: Algorithm & Microwave Pulse Synthesizer */}
        <div className="flex flex-col gap-24">
          <Card className="p-20 flex flex-col gap-20">
            <div className="flex items-center gap-8">
              <span className="p-6 rounded-lg bg-brand-primary/20 text-brand-primary font-bold text-xs font-orbitron">
                LENS 1
              </span>
              <SectionHeader title="Microwave Pulse Synthesizer" />
            </div>

            <div className="flex flex-col gap-10">
              {MICROWAVE_PULSES.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPulse(p)}
                  className={`p-12 rounded-xl border text-left transition-all ${
                    selectedPulse.id === p.id
                      ? 'bg-brand-primary/10 border-brand-primary shadow-glow-primary'
                      : 'bg-surface border-brand-border hover:border-brand-border-focus text-text-secondary'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-orbitron font-bold text-xs text-text-primary">{p.name}</span>
                    <span className="text-[10px] font-mono px-6 py-2 rounded bg-brand-primary/20 text-brand-primary">
                      {p.frequencyGhz} GHz
                    </span>
                  </div>
                  <div className="text-[10px] text-text-muted mt-4">{p.description}</div>
                  <div className="flex items-center gap-8 mt-6 text-[9px] font-mono text-brand-cyan">
                    <span>Duration: {p.durationNs} ns</span>
                    <span>•</span>
                    <span>Angle: {p.angle}</span>
                  </div>
                </button>
              ))}
            </div>

            <Divider />

            {/* Pulse Waveform Visualizer */}
            <div className="p-14 rounded-xl bg-background border border-brand-border flex flex-col gap-8">
              <div className="flex justify-between items-center text-[10px] font-orbitron uppercase text-text-muted">
                <span>DRAG Waveform Envelope</span>
                <span className="text-brand-primary">{selectedPulse.frequencyGhz} GHz</span>
              </div>
              <div className="h-48 w-full flex items-center justify-center relative overflow-hidden bg-black/40 rounded-lg">
                <svg className="w-full h-full text-brand-cyan" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <path
                    d="M 0 20 Q 25 0, 50 20 T 100 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={isPulsing ? 'animate-pulse' : ''}
                  />
                  <path
                    d="M 0 20 Q 25 40, 50 20 T 100 20"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                </svg>
                <div className="absolute bottom-2 right-4 text-[8px] font-mono text-text-muted">
                  I(t) Real & Q(t) Quadrature
                </div>
              </div>
            </div>

            {/* Transmit Button */}
            <button
              onClick={transmitPulse}
              disabled={isPulsing}
              className={`btn btn-primary w-full py-12 flex items-center justify-center gap-10 font-orbitron font-bold text-xs tracking-wider uppercase ${
                isPulsing ? 'opacity-50 cursor-not-allowed' : 'shadow-glow-primary'
              }`}
            >
              {isPulsing ? (
                <>
                  <div className="w-14 h-14 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Transmitting Pulse ({Math.round(pulseProgress * 100)}%)...</span>
                </>
              ) : (
                <>
                  <Zap className="w-16 h-16 text-yellow-300" />
                  <span>Transmit Microwave Pulse</span>
                </>
              )}
            </button>
          </Card>
        </div>

        {/* LENS 3: 3D Cryogenic Dilution Refrigerator (Center Hero) */}
        <div className="flex flex-col gap-24 w-full min-w-0">
          <Card className="h-[480px] relative overflow-hidden">
            <div className="absolute top-20 left-20 z-10 flex items-center gap-8">
              <span className="p-6 rounded-lg bg-brand-cyan/20 text-brand-cyan font-bold text-xs font-orbitron">
                LENS 3
              </span>
              <SectionHeader title="Dilution Refrigerator & Microwave Journey" />
            </div>

            <div className="absolute top-20 right-20 z-10">
              <Badge color={activeStage === 4 ? 'green' : activeStage === 0 ? 'red' : 'gold'}>
                {currentStageInfo.temp}
              </Badge>
            </div>

            <Cryostat3D
              ref={cryostatRef}
              activeStage={activeStage}
              onSelectStage={idx => setActiveStage(idx)}
              isPulsing={isPulsing}
              pulseProgress={pulseProgress}
              pulseGate={selectedPulse.gate}
            />

            {/* Signal Journey Progress Indicator */}
            {isPulsing && (
              <div className="absolute bottom-20 inset-x-20 z-20 p-12 rounded-xl bg-background/90 backdrop-blur-md border border-brand-primary flex items-center justify-between">
                <div className="flex items-center gap-10">
                  <div className="w-10 h-10 rounded-full bg-brand-cyan animate-ping" />
                  <span className="text-xs font-orbitron text-brand-cyan font-bold">
                    Travelling: {CRYOSTAT_STAGES[Math.min(4, Math.floor(pulseProgress * 5))].name}
                  </span>
                </div>
                <span className="font-mono text-xs text-text-muted">
                  Thermal noise attenuation: {CRYOSTAT_STAGES[Math.min(4, Math.floor(pulseProgress * 5))].attenuation}
                </span>
              </div>
            )}
          </Card>

          {/* Interactive Stage Selector Bar */}
          <div className="grid grid-cols-5 gap-8">
            {CRYOSTAT_STAGES.map((st, idx) => (
              <button
                key={st.temp}
                onClick={() => {
                  setActiveStage(idx);
                  cryostatRef.current?.focusStage(idx);
                }}
                className={`p-10 rounded-xl border text-center transition-all ${
                  activeStage === idx
                    ? 'bg-brand-primary/20 border-brand-primary shadow-glow-primary'
                    : 'bg-surface border-brand-border hover:border-brand-border-focus opacity-75'
                }`}
              >
                <div className="text-[10px] font-orbitron font-bold text-text-primary truncate">{st.temp}</div>
                <div className="text-[9px] font-mono text-text-muted truncate mt-2">{st.attenuation}</div>
              </button>
            ))}
          </div>

          {/* Active Stage Physics Telemetry Card */}
          <Card className="p-16 flex flex-col gap-10 bg-surface/50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-8">
                <Thermometer className="w-16 h-16 text-brand-cyan" />
                <span className="font-orbitron font-bold text-sm text-text-primary">{currentStageInfo.name}</span>
              </div>
              <span className="text-xs font-mono font-bold text-brand-primary">
                Thermal Photons: {currentStageInfo.thermalPhotons}
              </span>
            </div>
            <div className="text-xs text-text-secondary leading-relaxed">{currentStageInfo.desc}</div>
          </Card>
        </div>

        {/* LENS 2: Quantum State Layer (Bloch Sphere & Amplitudes) */}
        <div className="flex flex-col gap-24">
          <Card className="p-20 flex flex-col gap-20">
            <div className="flex items-center gap-8">
              <span className="p-6 rounded-lg bg-brand-purple/20 text-brand-purple font-bold text-xs font-orbitron">
                LENS 2
              </span>
              <SectionHeader title="Physical Quantum State" />
            </div>

            {/* Embedded 3D Bloch Sphere */}
            <div className="h-[260px] relative rounded-xl overflow-hidden bg-black/60 border border-brand-border">
              <BlochSphere3D state={currentState} health={100} history={[]} />
              <div className="absolute bottom-10 left-10 z-10 text-[9px] font-mono text-brand-cyan bg-black/60 px-6 py-2 rounded">
                Bloch: ({currentState.x.toFixed(2)}, {currentState.y.toFixed(2)}, {currentState.z.toFixed(2)})
              </div>
            </div>

            {/* Statevector & Populations */}
            <div className="flex flex-col gap-10">
              <div className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">
                Normalized Amplitudes
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="p-10 rounded-xl bg-background border border-brand-border flex flex-col items-center">
                  <span className="text-[10px] font-mono text-brand-cyan">|0⟩ (Ground)</span>
                  <span className="text-lg font-mono font-bold text-text-primary">
                    {currentState.z > 0.5 ? '100%' : currentState.z < -0.5 ? '0%' : '50%'}
                  </span>
                </div>
                <div className="p-10 rounded-xl bg-background border border-brand-border flex flex-col items-center">
                  <span className="text-[10px] font-mono text-brand-purple">|1⟩ (Excited)</span>
                  <span className="text-lg font-mono font-bold text-text-primary">
                    {currentState.z < -0.5 ? '100%' : currentState.z > 0.5 ? '0%' : '50%'}
                  </span>
                </div>
              </div>
            </div>

            <Divider />

            {/* Scientific Explanation of Why 15 mK is Required */}
            <div className="p-14 rounded-xl bg-brand-primary/5 border border-brand-primary/20 flex flex-col gap-8">
              <div className="flex items-center gap-6 text-xs font-orbitron font-bold text-brand-primary">
                <Sparkles className="w-14 h-14" />
                <span>The Cryogenic Advantage</span>
              </div>
              <div className="text-[11px] text-text-secondary leading-relaxed">
                At room temperature (300 K), thermal energy <code className="font-mono text-brand-cyan">k_B T ≈ 25 meV</code>{' '}
                is 1,200× larger than the qubit transition energy <code className="font-mono text-brand-primary">hf₀₁ ≈ 20 µeV</code>.
                Without cooling to 15 mK, thermal photons would instantly randomize the qubit!
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── HIGH-LEVEL INSTRUMENT: MICROWAVE PULSE & SPECTRUM SYNTHESIZER ── */}
      <div className="space-y-4 pt-6 border-t border-brand-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-brand-primary/20 text-brand-primary font-bold text-[11px] font-orbitron">
              60 FPS REALTIME CANVAS
            </span>
            <h2 className="text-lg font-bold font-orbitron text-text-primary">
              Arbitrary Waveform Synthesizer • IQ Constellation • Sideband FFT
            </h2>
          </div>
          <span className="text-xs font-mono text-text-muted hidden sm:inline">
            Carrier: 4.5 – 7.5 GHz | DRAG β Tuning
          </span>
        </div>
        <MicrowavePulseCanvas />
      </div>
    </div>
  );
}
