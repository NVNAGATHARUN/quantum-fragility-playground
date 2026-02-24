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
