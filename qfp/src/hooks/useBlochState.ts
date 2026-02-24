import { useState, useCallback } from 'react'
import type { BlochVector, PresetState } from '../types/quantum'
import { PRESET_VECTORS } from '../types/quantum'

export type BlochStateHook = {
  state: BlochVector
  setPreset: (preset: PresetState) => void
  setState: (next: BlochVector) => void
  p0: number
  p1: number
  health: number
}

export function useBlochState(initial: PresetState = 'plus'): BlochStateHook {
  const [state, setStateRaw] = useState<BlochVector>({ ...PRESET_VECTORS[initial] })

  const setPreset = useCallback((preset: PresetState) => {
    setStateRaw({ ...PRESET_VECTORS[preset] })
  }, [])

  const setState = useCallback((next: BlochVector) => {
    setStateRaw({ ...next })
  }, [])

  const p0 = (state.z + 1) / 2
  const p1 = 1 - p0
  const health = Math.sqrt(state.x ** 2 + state.y ** 2 + state.z ** 2) * 100

  return { state, setPreset, setState, p0, p1, health }
}
