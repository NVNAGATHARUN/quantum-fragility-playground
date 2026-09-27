// ─── Core Bloch sphere types ────────────────────────────────────────────────

export type BlochVector = { x: number; y: number; z: number }

export type NoiseParams = {
  depolarizing: number
  phaseFlip: number
  bitFlip: number
  amplitudeDamping: number
  speed: number
}

export type PresetState = 'zero' | 'one' | 'plus' | 'minus'

// ─── Gate types ─────────────────────────────────────────────────────────────

export type GateId = 'H' | 'X' | 'Y' | 'Z' | 'CNOT'

export type Gate = {
  id: GateId
  angle?: number // radians, for Rx/Ry/Rz
}

// ─── Canonical Circuit IR v1.0 (SRS Section 22) ─────────────────────────────

export type SupportedGate =
  | 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'SDG' | 'TDG'
  | 'RX' | 'RY' | 'RZ' | 'CX' | 'CZ' | 'SWAP'
  | 'MEASURE' | 'RESET' | 'BARRIER'

export interface GateParams {
  theta?: number
  phi?: number
  lam?: number
}

export interface GateOperation {
  id: string
  gate: SupportedGate
  targets: number[]
  controls?: number[]
  params?: GateParams
  classicalTargets?: number[]
  step: number
}

export interface CircuitIR {
  version: '1.0'
  qubits: number
  classicalBits: number
  operations: GateOperation[]
}

// ─── Normalized Simulation Result (SRS Section 32) ──────────────────────────

export interface StateAmplitude {
  basis: string
  real: number
  imag: number
  magnitude: number
  phase: number
  probability: number
}

export interface ReducedSubsystemState {
  qubit: number
  blochVector: BlochVector
  purity: number
  isEntangled: boolean
  entropy: number
}

export interface TimelineStep {
  step: number
  gate: string
  targets: number[]
  controls?: number[]
  stateSummary: string
  probabilities: Record<string, number>
}

export interface SimulationMetrics {
  depth: number
  gateCount: number
  entanglementEntropy: number
  purity: number
  executionTimeMs: number
}

export interface NormalizedSimulationResult {
  circuitId?: string
  backend: string
  shots: number
  qubitCount: number
  statevector: StateAmplitude[]
  counts: Record<string, number>
  probabilities: Record<string, number>
  reducedStates: ReducedSubsystemState[]
  timeline: TimelineStep[]
  metrics: SimulationMetrics
}

export interface FragilityRequest {
  circuit: CircuitIR
  t1_us?: number
  t2_us?: number
  gate_time_ns?: number
  channel?: 'amplitude_damping' | 'phase_damping' | 'depolarizing' | 'combined'
}

// ─── Pedagogy & Cognitive Delta Types (SRS Section 35–39) ───────────────────

export interface UserPrediction {
  conceptKey: string
  predictionType: 'probability' | 'state' | 'chsh'
  predictedProbabilities: Record<string, number>
  confidence?: number
}

export interface CognitiveDeltaResult {
  cognitiveDelta: number
  matchesSimulation: boolean
  detectedMisconceptions: string[]
  interventionRecommended: boolean
  conflictLabId?: string | null
}

export interface WhatChangedDiff {
  modifiedGates: Array<{ step: number; target: number; from: string; to: string }>
  statevectorA: string
  statevectorB: string
  fidelity: number
  conceptualExplanation: string
}

// ─── Experiment result types ─────────────────────────────────────────────────

export type BellOutcomeCounts = {
  '00': number
  '01': number
  '10': number
  '11': number
}

export type GhzOutcomeCounts = {
  '000': number
  '001': number
  '010': number
  '011': number
  '100': number
  '101': number
  '110': number
  '111': number
}

export type Bb84RunConfig = {
  rounds: number
  withEve: boolean
}

export type Bb84TraceRow = {
  id: number
  aliceBit: 0 | 1
  aliceBasis: 'Z' | 'X'
  eveBasis: 'Z' | 'X' | '-'
  bobBasis: 'Z' | 'X'
  bobBit: 0 | 1
  keep: boolean
  error: boolean
}

export type Bb84RunSummary = {
  rounds: number
  siftedKeyLength: number
  errorRate: number // 0–1
  trace: Bb84TraceRow[]
}

export type SternGerlachConfig = {
  angleDegrees: number
}

export type SternGerlachResult = {
  outcome: 'up' | 'down'
  probUp: number
  probDown: number
}

// ─── Circuit / QASM types ────────────────────────────────────────────────────

export type CircuitGate = {
  gate: string
  qubit: number
  target?: number     // for CNOT
  angle?: number      // for rotation gates
}

// ─── Presets map ─────────────────────────────────────────────────────────────

export const PRESET_VECTORS: Record<PresetState, BlochVector> = {
  zero: { x: 0, y: 0, z: 1 },
  one: { x: 0, y: 0, z: -1 },
  plus: { x: 1, y: 0, z: 0 },
  minus: { x: -1, y: 0, z: 0 },
}
