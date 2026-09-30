/**
 * Representative Calibrated Pulse Visualization
 *
 * Renders educational approximations of the microwave control signals used to
 * drive superconducting transmon qubits. The waveforms are based on the
 * DRAG (Derivative Removal via Adiabatic Gate) technique used in
 * IBM/Google/Rigetti processors. Values are representative, NOT device-specific.
 *
 * References:
 *  - Motzoi et al., PRL 103, 110501 (2009)  — DRAG derivation
 *  - McKay et al., PRA 96, 022330 (2017)    — OpenPulse / gate decompositions
 */

export interface PulsePoint {
  t: number; // normalised time in [0, 1]
  I: number; // in-phase Gaussian envelope  (normalised amplitude)
  Q: number; // quadrature DRAG component   (normalised amplitude)
}

/** Gaussian + DRAG parameters, all unitless / representative */
export interface PulseParams {
  /** Gate duration (normalised), 1 = "full width" of the plot */
  duration: number;
  /** Gaussian sigma as fraction of gate duration */
  sigma: number;
  /** DRAG correction coefficient β (dimensionless, sign encodes axis) */
  beta: number;
  /** Peak amplitude of the I channel (0–1) */
  amplitude: number;
  /** Number of native hardware pulses composing this gate */
  nativeCount: number;
  /** Human-readable decomposition string, e.g. "Y_π/2 → X_π" */
  decomposition: string;
  /** Colour accent for the waveform */
  color: string;
}

/** Compute pulse points for the I(t) and Q(t) channels */
export function computePulse(params: PulseParams, steps = 200): PulsePoint[] {
  const { duration, sigma, beta, amplitude } = params;
  const center = duration / 2;
  const points: PulsePoint[] = [];
  for (let k = 0; k <= steps; k++) {
    const t = (k / steps) * duration;
    const x = t - center;
    const gauss = Math.exp(-(x * x) / (2 * sigma * sigma));
    // DRAG Q channel = −β · dI/dt / Δ, where Δ ≈ 1 (normalised)
    const dGauss = -(x / (sigma * sigma)) * gauss;
    points.push({
      t: t / duration,
      I: amplitude * gauss,
      Q: amplitude * beta * dGauss,
    });
  }
  return points;
}

// ── Gate → PulseParams table ─────────────────────────────────────────────────

const BASE: PulseParams = {
  duration: 1,
  sigma: 0.18,
  beta: 0.3,
  amplitude: 1,
  nativeCount: 1,
  decomposition: "",
  color: "#22d3ee",
};

export const GATE_PULSE: Record<string, PulseParams> = {
  // Single X-axis π-rotation
  X: {
    ...BASE,
    amplitude: 1.0,
    decomposition: "X_π (single resonant pulse)",
    color: "#f472b6",
  },
  // Half-rotation along Y, implemented as X_π/2
  Y: {
    ...BASE,
    amplitude: 1.0,
    sigma: 0.18,
    beta: -0.3,
    decomposition: "Y_π (single resonant pulse)",
    color: "#a78bfa",
  },
  // Z is virtual — just a software frame rotation, no microwave needed
  Z: {
    ...BASE,
    amplitude: 0,
    beta: 0,
    nativeCount: 0,
    decomposition: "Virtual Z (frame rotation, no microwave pulse emitted)",
    color: "#94a3b8",
  },
  // Hadamard = Y_π/2 → X_π  (two pulses)
  H: {
    ...BASE,
    amplitude: 0.85,
    sigma: 0.14,
    beta: 0.25,
    nativeCount: 2,
    decomposition: "Y_{π/2} → X_π (two native pulses)",
    color: "#34d399",
  },
  // S = Z_π/2 (virtual)
  S: {
    ...BASE,
    amplitude: 0,
    beta: 0,
    nativeCount: 0,
    decomposition: "Virtual Z_{π/2} (frame rotation)",
    color: "#94a3b8",
  },
  // T = Z_π/4 (virtual)
  T: {
    ...BASE,
    amplitude: 0,
    beta: 0,
    nativeCount: 0,
    decomposition: "Virtual Z_{π/4} (frame rotation)",
    color: "#94a3b8",
  },
  // RX — amplitude proportional to θ
  RX: {
    ...BASE,
    amplitude: 0.65,
    sigma: 0.18,
    beta: 0.3,
    decomposition: "RX(θ): Gaussian pulse, amplitude ∝ θ/π",
    color: "#fb923c",
  },
  RY: {
    ...BASE,
    amplitude: 0.65,
    sigma: 0.18,
    beta: -0.3,
    decomposition: "RY(θ): Gaussian pulse, amplitude ∝ θ/π, phase offset 90°",
    color: "#facc15",
  },
  // RZ is also virtual
  RZ: {
    ...BASE,
    amplitude: 0,
    beta: 0,
    nativeCount: 0,
    decomposition: "Virtual Z rotation (frame rotation, no microwave pulse emitted)",
    color: "#94a3b8",
  },
  // CX: echoed cross-resonance sequence (2 transmons, CR + echo)
  CX: {
    ...BASE,
    amplitude: 0.7,
    sigma: 0.22,
    beta: 0.15,
    nativeCount: 4,
    decomposition: "CR pulse → X_π(control) → CR† → X_π(control) (echoed CR scheme)",
    color: "#60a5fa",
  },
  // CZ: parametric modulation or adiabatic flux pulse
  CZ: {
    ...BASE,
    amplitude: 0.75,
    sigma: 0.20,
    beta: 0.0,
    nativeCount: 1,
    decomposition: "Parametric flux pulse (adiabatic CZ on tunable-coupler hardware)",
    color: "#818cf8",
  },
  // SWAP = 3× CX
  SWAP: {
    ...BASE,
    amplitude: 0.7,
    sigma: 0.22,
    beta: 0.15,
    nativeCount: 12,
    decomposition: "3× echoed CR sequence (SWAP = CX·CX·CX, each CX = 4 pulses)",
    color: "#e879f9",
  },
  MEASURE: {
    ...BASE,
    amplitude: 0.45,
    sigma: 0.30,
    beta: 0.0,
    nativeCount: 1,
    decomposition: "Dispersive readout tone (resonator, not qubit drive frequency)",
    color: "#4ade80",
  },
  RESET: {
    ...BASE,
    amplitude: 0.50,
    sigma: 0.25,
    beta: 0.0,
    nativeCount: 1,
    decomposition: "Active reset: measurement + conditional X_π",
    color: "#fb7185",
  },
};
