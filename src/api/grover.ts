/**
 * Grover's Algorithm API Client for Quantum Lens AI.
 *
 * Calls the FastAPI /api/v1/algorithms/grover endpoint for verified Qiskit Aer
 * amplitude snapshots. Includes an analytical fallback so the lab works
 * even when the Python server is offline.
 *
 * SRS Reference: Sections 58-61 (AL-03), M06 correction.
 */

import type { CircuitIR, StateAmplitude } from '../types/quantum'

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? ''

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GroverRunRequest {
  n_qubits: number        // 2, 3, or 4
  target_state: string    // binary string e.g. '11'
  shots?: number
}

export interface GroverResult {
  n_qubits: number
  target_state: string
  optimal_iterations: number
  /** amplitude_snapshots[k] = statevector after k Grover iterations (0 = after H⊗n init) */
  amplitude_snapshots: StateAmplitude[][]
  final_probabilities: Record<string, number>
  counts: Record<string, number>
  circuit_ir: CircuitIR
  execution_time_ms: number
}

// ─── Backend API Call ─────────────────────────────────────────────────────────

export async function runGrover(req: GroverRunRequest): Promise<GroverResult> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/algorithms/grover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        n_qubits: req.n_qubits,
        target_state: req.target_state,
        shots: req.shots ?? 1024,
      }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`API ${res.status}: ${text}`)
    }
    return (await res.json()) as GroverResult
  } catch (err) {
    // Analytical fallback: compute Grover exactly using linear algebra
    console.warn('[GroverAPI] FastAPI unreachable, using analytical fallback:', err)
    return analyticalGrover(req)
  }
}

// ─── Analytical Fallback (exact linear algebra) ────────────────────────────────

function optimalIterations(nQubits: number): number {
  const N = 1 << nQubits
  return Math.max(1, Math.floor((Math.PI / 4) * Math.sqrt(N)))
}

/**
 * Exact analytical Grover implementation using complex statevectors.
 * The algorithm: after k oracle+diffusion cycles, the amplitude of the target
 * state becomes sin((2k+1)θ) where sin(θ) = 1/√N.
 */
function analyticalGrover(req: GroverRunRequest): GroverResult {
  const { n_qubits, target_state } = req
  const shots = req.shots ?? 1024
  const N = 1 << n_qubits
  const k = optimalIterations(n_qubits)

  // θ where sin(θ) = 1/√N
  const theta = Math.asin(1 / Math.sqrt(N))

  const snapshots: StateAmplitude[][] = []

  for (let iter = 0; iter <= k; iter++) {
    // After iter Grover iterations:
    // target amplitude = sin((2*iter+1)*θ)
    // non-target amplitude = cos((2*iter+1)*θ) / √(N-1)
    const angle = (2 * iter + 1) * theta
    const targetAmp = Math.sin(angle)
    const otherAmp = Math.cos(angle) / Math.sqrt(N - 1)

    const snapshot: StateAmplitude[] = []
    for (let i = 0; i < N; i++) {
      const basis = i.toString(2).padStart(n_qubits, '0')
      const isTarget = basis === target_state
      const amp = isTarget ? targetAmp : otherAmp
      snapshot.push({
        basis,
        real: parseFloat(amp.toFixed(6)),
        imag: 0,
        magnitude: parseFloat(Math.abs(amp).toFixed(6)),
        phase: amp >= 0 ? 0 : parseFloat(Math.PI.toFixed(6)),
        probability: parseFloat((amp * amp).toFixed(6)),
      })
    }
    snapshots.push(snapshot)
  }

  // Final probabilities from last snapshot
  const finalProbs: Record<string, number> = {}
  snapshots[k].forEach(a => { finalProbs[a.basis] = a.probability })

  // Shot simulation
  const bases = Object.keys(finalProbs)
  const probs = bases.map(b => finalProbs[b])
  const counts: Record<string, number> = {}
  bases.forEach(b => { counts[b] = 0 })

  for (let s = 0; s < shots; s++) {
    let r = Math.random()
    for (let i = 0; i < bases.length; i++) {
      r -= probs[i]
      if (r <= 0) { counts[bases[i]]++; break }
    }
  }

  // Minimal circuit IR for display
  const circuitOps: any[] = []
  let step = 0
  for (let q = 0; q < n_qubits; q++) {
    circuitOps.push({ id: `init-${q}`, gate: 'H', targets: [q], controls: [], step })
  }
  step++
  for (let q = 0; q < n_qubits; q++) {
    circuitOps.push({ id: `meas-${q}`, gate: 'MEASURE', targets: [q], controls: [], step })
  }

  return {
    n_qubits,
    target_state,
    optimal_iterations: k,
    amplitude_snapshots: snapshots,
    final_probabilities: finalProbs,
    counts,
    circuit_ir: {
      version: '1.0',
      qubits: n_qubits,
      classicalBits: n_qubits,
      operations: circuitOps,
    },
    execution_time_ms: 0,
  }
}
