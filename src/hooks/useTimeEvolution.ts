import { useState, useRef, useEffect, useCallback } from 'react'
import type { BlochVector, NoiseParams } from '../types/quantum'

const BASE_DT = 0.01

function applyNoiseStep(v: BlochVector, noise: NoiseParams, dt: number): BlochVector {
  let { x, y, z } = v
  const rateMultiplier = noise.speed || 1

  // 0. Larmor precession around Z axis (natural qubit rotation)
  // Physically: H = (omega/2) * Z
  const omega = 5.0 * rateMultiplier // rad/s
  const theta = omega * dt
  const cosT = Math.cos(theta)
  const sinT = Math.sin(theta)
  const xPre = x * cosT - y * sinT
  const yPre = x * sinT + y * cosT
  x = xPre; y = yPre

  // 1. Depolarizing: rho -> (1-p)rho + p*I/2
  // Vector shrinks by exp(-gamma * dt) in all directions
  // We map noise slider (0-1) to a decay rate gamma
  if (noise.depolarizing > 0) {
    const gammaDep = noise.depolarizing * 2.0 * rateMultiplier
    const factor = Math.exp(-gammaDep * dt)
    x *= factor; y *= factor; z *= factor
  }

  // 2. Amplitude Damping (T1): relaxation toward |0> (z=1)
  // x, y shrink by factor exp(-dt/(2T1)), z moves toward 1 as 1 - (1-z)exp(-dt/T1)
  if (noise.amplitudeDamping > 0) {
    const gamma1 = noise.amplitudeDamping * 1.5 * rateMultiplier
    const factorXY = Math.exp(-gamma1 * dt / 2)
    const factorZ = Math.exp(-gamma1 * dt)
    x *= factorXY
    y *= factorXY
    z = 1 - (1 - z) * factorZ
  }

  // 3. Phase Flip (Dephasing / T2*): shrinks X and Y components
  // x, y shrink by exp(-gamma_phi * dt)
  if (noise.phaseFlip > 0) {
    const gammaPhi = noise.phaseFlip * 3.0 * rateMultiplier
    const factor = Math.exp(-gammaPhi * dt)
    x *= factor; y *= factor
  }

  // 4. Bit Flip: shrinks Y and Z components
  if (noise.bitFlip > 0) {
    const gammaX = noise.bitFlip * 2.0 * rateMultiplier
    const factor = Math.exp(-gammaX * dt)
    y *= factor; z *= factor
  }

  // Safety clamp: Bloch vector length must not exceed 1 (purity <= 1)
  const r2 = x * x + y * y + z * z
  if (r2 > 1.000001) {
    const r = Math.sqrt(r2)
    x /= r; y /= r; z /= r
  }

  return { x: x || 0, y: y || 0, z: z || 0 }
}

export type TimeEvolutionHook = {
  state: BlochVector
  history: BlochVector[]
  running: boolean
  setRunning: (b: boolean) => void
  resetTo: (next: BlochVector) => void
  scrubToIndex: (index: number) => void
  getShot: () => number
}

export function useTimeEvolution({
  initialState,
  noise,
}: {
  initialState: BlochVector
  noise: NoiseParams
}): TimeEvolutionHook {
  const [state, setStateRaw] = useState<BlochVector>({ ...initialState })
  const [history, setHistory] = useState<BlochVector[]>([{ ...initialState }])
  const [running, setRunning] = useState(true)

  const stateRef = useRef<BlochVector>({ ...initialState })
  const historyRef = useRef<BlochVector[]>([{ ...initialState }])
  const noiseRef = useRef(noise)
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef<number>(0)
  const MAX_HISTORY = 600

  // Keep noiseRef fresh without re-subscribing
  useEffect(() => { noiseRef.current = noise }, [noise])

  // When initialState changes externally (preset change), reset
  useEffect(() => {
    stateRef.current = { ...initialState }
    historyRef.current = [{ ...initialState }]
    setStateRaw({ ...initialState })
    setHistory([{ ...initialState }])
  }, [initialState])

  const loop = useCallback((ts: number) => {
    if (!lastTsRef.current) lastTsRef.current = ts
    const elapsed = Math.min((ts - lastTsRef.current) / 1000, 0.05)
    lastTsRef.current = ts

    const steps = Math.max(1, Math.round(elapsed / BASE_DT))
    let v = stateRef.current
    for (let i = 0; i < steps; i++) {
      v = applyNoiseStep(v, noiseRef.current, BASE_DT)
    }

    stateRef.current = v
    historyRef.current = [...historyRef.current, { ...v }].slice(-MAX_HISTORY)

    setStateRaw({ ...v })
    setHistory([...historyRef.current])

    rafRef.current = requestAnimationFrame(loop)
  }, [])

  useEffect(() => {
    if (running) {
      lastTsRef.current = 0
      rafRef.current = requestAnimationFrame(loop)
    } else {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [running, loop])

  const resetTo = useCallback((next: BlochVector) => {
    stateRef.current = { ...next }
    historyRef.current = [{ ...next }]
    setStateRaw({ ...next })
    setHistory([{ ...next }])
  }, [])

  const scrubToIndex = useCallback((index: number) => {
    const target = historyRef.current[index]
    if (!target) return
    setRunning(false)
    stateRef.current = { ...target }
    setStateRaw({ ...target })
  }, [])

  const setRunningWrapped = useCallback((b: boolean) => {
    lastTsRef.current = 0
    setRunning(b)
  }, [])

  const getShot = useCallback(() => {
    const p0 = (stateRef.current.z + 1) / 2
    return Math.random() < p0 ? 0 : 1
  }, [])

  return { state, history, running, setRunning: setRunningWrapped, resetTo, scrubToIndex, getShot }
}
