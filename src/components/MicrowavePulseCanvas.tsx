import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Activity, Waves, Cpu, Zap, Sliders } from 'lucide-react';

interface PulsePreset {
  id: string;
  name: string;
  gate: string;
  durationNs: number;
  freqGhz: number;
  dragBeta: number;
  envelope: 'Gaussian' | 'Cosine' | 'FlatTop';
  desc: string;
}

const PULSE_PRESETS: PulsePreset[] = [
  {
    id: 'x-pi',
    name: 'Pauli-X Gate (π-Pulse)',
    gate: 'X',
    durationNs: 20.0,
    freqGhz: 5.20,
    dragBeta: 0.28,
    envelope: 'Cosine',
    desc: 'Resonant π-pulse driving |0⟩ → |1⟩ by 180° rotation around the X-axis with DRAG leakage suppression.',
  },
  {
    id: 'h-pi2',
    name: 'Hadamard (π/2-Pulse)',
    gate: 'H',
    durationNs: 10.0,
    freqGhz: 5.20,
    dragBeta: 0.14,
    envelope: 'Gaussian',
    desc: 'π/2 rotation creating equal superposition (|0⟩ + |1⟩)/√2 on the Bloch equator.',
  },
  {
    id: 'z-virtual',
    name: 'Virtual-Z (Frame Shift)',
    gate: 'Z',
    durationNs: 0.0,
    freqGhz: 5.20,
    dragBeta: 0.0,
    envelope: 'Cosine',
    desc: 'Instantaneous 0 ns software phase shift of subsequent microwave drive frame references.',
  },
  {
    id: 'readout',
    name: 'Cavity Readout Tone',
    gate: 'M',
    durationNs: 40.0,
    freqGhz: 7.15,
    dragBeta: 0.0,
    envelope: 'FlatTop',
    desc: 'Dispersive microwave tone coupling to readout resonator; reflected phase indicates qubit state.',
  },
];

export default function MicrowavePulseCanvas() {
  const oscCanvasRef = useRef<HTMLCanvasElement>(null);
  const iqCanvasRef = useRef<HTMLCanvasElement>(null);
  const fftCanvasRef = useRef<HTMLCanvasElement>(null);

  const [preset, setPreset] = useState<PulsePreset>(PULSE_PRESETS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [carrierFreq, setCarrierFreq] = useState<number>(preset.freqGhz);
  const [dragCoeff, setDragCoeff] = useState<number>(preset.dragBeta);
  const [timeCursor, setTimeCursor] = useState<number>(0);

  // Sync controls with preset
  useEffect(() => {
    setCarrierFreq(preset.freqGhz);
    setDragCoeff(preset.dragBeta);
  }, [preset]);

  // Main 60 FPS Canvas rendering loop
  useEffect(() => {
    let animId: number;
    let t = 0;

    const render = () => {
      if (isPlaying) {
        t += 0.025;
        setTimeCursor((t % 1.0));
      }

      // ── 1. Oscilloscope Canvas (Time Domain I(t), Q(t), RF Carrier) ──
      const osc = oscCanvasRef.current;
      if (osc) {
        const ctx = osc.getContext('2d');
        if (ctx) {
          const w = osc.width;
          const h = osc.height;

          // Background
          ctx.fillStyle = '#0a0f1d';
          ctx.fillRect(0, 0, w, h);

          // Grid lines
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          for (let x = 0; x < w; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
          }
          for (let y = 0; y < h; y += 30) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
          }

          // Center zero line
          const midY = h / 2;
          ctx.strokeStyle = '#334155';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(0, midY);
          ctx.lineTo(w, midY);
          ctx.stroke();
          ctx.setLineDash([]);

          const totalPoints = 300;
          const margin = 20;
          const plotW = w - margin * 2;
          const ampScale = 50;

          if (preset.durationNs === 0) {
            // Virtual-Z: Dirac impulse delta
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(w / 2, midY + ampScale);
            ctx.lineTo(w / 2, midY - ampScale);
            ctx.stroke();

            ctx.fillStyle = '#f59e0b';
            ctx.font = '11px JetBrains Mono, monospace';
            ctx.fillText('0 ns Virtual Frame Shift: Δϕ = π', w / 2 + 10, midY - 20);
          } else {
            // Draw In-Phase I(t) Envelope (Cobalt Blue)
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let i = 0; i <= totalPoints; i++) {
              const u = i / totalPoints; // 0 to 1
              const px = margin + u * plotW;

              let env = 0;
              if (preset.envelope === 'Cosine') {
                env = 0.5 * (1 - Math.cos(2 * Math.PI * u));
              } else if (preset.envelope === 'Gaussian') {
                const center = 0.5;
                const sigma = 0.18;
                env = Math.exp(-Math.pow((u - center) / sigma, 2));
              } else {
                env = u > 0.1 && u < 0.9 ? 1.0 : (u <= 0.1 ? u / 0.1 : (1 - u) / 0.1);
              }

              const py = midY - env * ampScale;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.stroke();

            // Draw Quadrature Q(t) DRAG Envelope (Emerald Green)
            if (dragCoeff > 0) {
              ctx.strokeStyle = '#10b981';
              ctx.lineWidth = 2.0;
              ctx.beginPath();
              for (let i = 0; i <= totalPoints; i++) {
                const u = i / totalPoints;
                const px = margin + u * plotW;
                // Derivative of cosine envelope
                const deriv = Math.sin(2 * Math.PI * u) * Math.PI;
                const qEnv = deriv * dragCoeff * 0.4;
                const py = midY - qEnv * ampScale;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
              }
              ctx.stroke();
            }

            // Draw Modulated RF Carrier Waveform (Violet Wave)
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            for (let i = 0; i <= totalPoints; i++) {
              const u = i / totalPoints;
              const px = margin + u * plotW;
              const env = 0.5 * (1 - Math.cos(2 * Math.PI * u));
              const rfCarrier = Math.sin(u * 28.0 * (carrierFreq / 5.0) + t * 4.0);
              const py = midY - (env * rfCarrier) * (ampScale * 0.85);
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.stroke();

            // Active time sweep cursor
            const sweepX = margin + (timeCursor) * plotW;
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(sweepX, 0);
            ctx.lineTo(sweepX, h);
            ctx.stroke();

            // Legend labels
            ctx.font = '10px JetBrains Mono, monospace';
            ctx.fillStyle = '#38bdf8';
            ctx.fillText('● I(t) In-Phase', margin + 10, 20);
            ctx.fillStyle = '#10b981';
            ctx.fillText('● Q(t) DRAG Quad', margin + 120, 20);
            ctx.fillStyle = '#a855f7';
            ctx.fillText(`● RF Carrier (${carrierFreq.toFixed(2)} GHz)`, margin + 240, 20);
          }
        }
      }

      // ── 2. IQ Constellation Plane (Phase Trajectory) ──
      const iq = iqCanvasRef.current;
      if (iq) {
        const ctx = iq.getContext('2d');
        if (ctx) {
          const w = iq.width;
          const h = iq.height;
          ctx.fillStyle = '#0a0f1d';
          ctx.fillRect(0, 0, w, h);

          const cx = w / 2;
          const cy = h / 2;
          const r = Math.min(cx, cy) - 20;

          // Polar circle guides
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();

          // Axes
          ctx.beginPath();
          ctx.moveTo(cx, 10);
          ctx.lineTo(cx, h - 10);
          ctx.moveTo(10, cy);
          ctx.lineTo(w - 10, cy);
          ctx.stroke();

          // Labels
          ctx.font = '9px JetBrains Mono, monospace';
          ctx.fillStyle = '#64748b';
          ctx.fillText('+Q (Imag)', cx + 4, 15);
          ctx.fillText('+I (Real)', w - 45, cy - 4);

          // Draw Phase Trajectory Loop
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          const steps = 120;
          for (let i = 0; i <= steps; i++) {
            const u = i / steps;
            const env = 0.5 * (1 - Math.cos(2 * Math.PI * u));
            const iVal = env * 0.85;
            const qVal = Math.sin(2 * Math.PI * u) * dragCoeff * 0.5;

            const px = cx + iVal * r;
            const py = cy - qVal * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();

          // Current rotating instantaneous vector point
          const curEnv = 0.5 * (1 - Math.cos(2 * Math.PI * timeCursor));
          const curI = curEnv * 0.85;
          const curQ = Math.sin(2 * Math.PI * timeCursor) * dragCoeff * 0.5;
          const curX = cx + curI * r;
          const curY = cy - curQ * r;

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(curX, curY, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(curX, curY);
          ctx.stroke();
        }
      }

      // ── 3. FFT Power Spectrum (Frequency Domain Anharmonicity) ──
      const fft = fftCanvasRef.current;
      if (fft) {
        const ctx = fft.getContext('2d');
        if (ctx) {
          const w = fft.width;
          const h = fft.height;
          ctx.fillStyle = '#0a0f1d';
          ctx.fillRect(0, 0, w, h);

          // Grid
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          for (let y = 0; y < h; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
          }

          const cx = w / 2;
          const baseBandwidth = 25;

          // Power spectrum profile (Gaussian with DRAG sideband suppression notch)
          ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, h);

          for (let x = 0; x < w; x++) {
            const deltaF = (x - cx) / 10; // offset in MHz
            // Primary lobe
            const primary = Math.exp(-Math.pow(deltaF / 4.0, 2)) * (h - 25);
            // Anharmonicity sideband at deltaF = -30 (-300 MHz transmon shift)
            const sidebandLeakage = Math.exp(-Math.pow((deltaF + 25) / 5.0, 2)) * (20 / (1 + dragCoeff * 25));

            const yVal = h - (primary + sidebandLeakage);
            ctx.lineTo(x, yVal);
          }
          ctx.lineTo(w, h);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Anharmonicity notch marker
          const notchX = cx - 25 * 10;
          if (notchX > 10) {
            ctx.strokeStyle = '#10b981';
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(notchX, 10);
            ctx.lineTo(notchX, h);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.font = '9px JetBrains Mono, monospace';
            ctx.fillStyle = '#10b981';
            ctx.fillText('ω₀₁ - α (Leakage suppressed)', notchX + 4, 25);
          }

          ctx.font = '10px JetBrains Mono, monospace';
          ctx.fillStyle = '#64748b';
          ctx.fillText(`Drive Carrier: ${carrierFreq.toFixed(2)} GHz`, cx - 55, h - 8);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, preset, carrierFreq, dragCoeff, timeCursor]);

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-surface border border-border shadow-subtle">
        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-secondary border border-border rounded-lg text-xs">
          {PULSE_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p)}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                preset.id === p.id
                  ? 'bg-surface text-brand font-semibold shadow-sm border border-border/80'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Play / Pause / Reset Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying((prev) => !prev)}
            className="p-1.5 rounded-md bg-surface-secondary border border-border hover:border-brand/40 text-text-primary transition-colors"
            title={isPlaying ? 'Pause Oscilloscope' : 'Resume Oscilloscope'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          </button>
          <button
            onClick={() => {
              setTimeCursor(0);
              setCarrierFreq(preset.freqGhz);
              setDragCoeff(preset.dragBeta);
            }}
            className="p-1.5 rounded-md bg-surface-secondary border border-border hover:border-brand/40 text-text-primary transition-colors"
            title="Reset Pulse Parameters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Multi-Instrument Canvas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 1. Oscilloscope View (Time Domain I/Q/Carrier) - 8 cols */}
        <div className="lg:col-span-8 rounded-xl bg-slate-950 border border-border p-4 shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand" />
              <span className="font-semibold text-slate-100">Microwave Arbitrary Waveform Generator (AWG)</span>
            </div>
            <span className="text-[11px] text-slate-400">Duration: {preset.durationNs} ns</span>
          </div>

          <div className="relative w-full overflow-hidden rounded-lg border border-slate-800">
            <canvas ref={oscCanvasRef} width={640} height={200} className="w-full h-48 block" />
          </div>

          <p className="text-[11px] text-slate-400 font-mono leading-relaxed pt-1">
            {preset.desc}
          </p>
        </div>

        {/* 2. IQ Complex Plane Constellation - 4 cols */}
        <div className="lg:col-span-4 rounded-xl bg-slate-950 border border-border p-4 shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Waves className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-100">IQ Complex Plane</span>
            </div>
            <span className="text-[11px] text-slate-400">DRAG Trajectory</span>
          </div>

          <div className="relative w-full overflow-hidden rounded-lg border border-slate-800 flex items-center justify-center">
            <canvas ref={iqCanvasRef} width={240} height={200} className="w-full h-48 block" />
          </div>

          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-1">
            <span>In-Phase: cos(ωt)</span>
            <span>Quad: sin(ωt)</span>
          </div>
        </div>
      </div>

      {/* FFT Power Spectrum & Parameter Tuning Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* FFT Power Spectrum - 7 cols */}
        <div className="lg:col-span-7 rounded-xl bg-slate-950 border border-border p-4 shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-slate-100">FFT Power Spectrum (Sideband Suppression)</span>
            </div>
            <span className="text-[11px] text-slate-400">Span: ±1 GHz</span>
          </div>

          <div className="relative w-full overflow-hidden rounded-lg border border-slate-800">
            <canvas ref={fftCanvasRef} width={500} height={120} className="w-full h-28 block" />
          </div>
        </div>

        {/* Dynamic Parameter Sliders - 5 cols */}
        <div className="lg:col-span-5 rounded-xl bg-surface border border-border p-4 shadow-subtle space-y-3 text-xs">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Sliders className="w-4 h-4 text-brand" />
            <span className="font-semibold text-text-primary">RF Microwave Synthesis Tuning</span>
          </div>

          {/* Carrier Frequency Slider */}
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-text-muted">Drive Frequency (ω_d):</span>
              <span className="text-brand font-bold">{carrierFreq.toFixed(2)} GHz</span>
            </div>
            <input
              type="range"
              min="4.5"
              max="7.5"
              step="0.05"
              value={carrierFreq}
              onChange={(e) => setCarrierFreq(parseFloat(e.target.value))}
              className="w-full accent-brand cursor-pointer"
            />
          </div>

          {/* DRAG Beta Parameter Slider */}
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-text-muted">DRAG Coefficient (β):</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{dragCoeff.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.8"
              step="0.02"
              value={dragCoeff}
              onChange={(e) => setDragCoeff(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-surface-secondary border border-border text-[11px] text-text-muted leading-relaxed">
            Increasing <strong>DRAG β</strong> injects a quadrature derivative envelope to suppress spectral leakage into the non-computational |2⟩ transmon state.
          </div>
        </div>
      </div>
    </div>
  );
}
