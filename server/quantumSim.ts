import type {
  BellOutcomeCounts,
  GhzOutcomeCounts,
  Bb84RunConfig,
  Bb84RunSummary,
  Bb84TraceRow,
  SternGerlachConfig,
  SternGerlachResult,
} from '../src/types/quantum'

// ─── Bell State ───────────────────────────────────────────────────────────────

/**
 * Simulate measuring the Bell state |Φ⁺⟩ = (|00⟩+|11⟩)/√2 in Z basis.
 * Each shot is 50% |00⟩, 50% |11⟩ (perfect correlation).
 */
export function simulateBell(shots: number): BellOutcomeCounts {
  const counts: BellOutcomeCounts = { '00': 0, '01': 0, '10': 0, '11': 0 }
  for (let i = 0; i < shots; i++) {
    Math.random() < 0.5 ? counts['00']++ : counts['11']++
  }
  return counts
}

// ─── GHZ State ────────────────────────────────────────────────────────────────

/**
 * Simulate measuring the 3-qubit GHZ state (|000⟩+|111⟩)/√2 in Z basis.
 * Each shot is 50% |000⟩, 50% |111⟩.
 */
export function simulateGhz(shots: number): GhzOutcomeCounts {
  const counts: GhzOutcomeCounts = {
    '000': 0, '001': 0, '010': 0, '011': 0,
    '100': 0, '101': 0, '110': 0, '111': 0,
  }
  for (let i = 0; i < shots; i++) {
    Math.random() < 0.5 ? counts['000']++ : counts['111']++
  }
  return counts
}


// ─── BB84 QKD ────────────────────────────────────────────────────────────────

type Basis = 'Z' | 'X'

function randomBit(): 0 | 1 {
  return Math.random() < 0.5 ? 0 : 1
}

function randomBasis(): Basis {
  return Math.random() < 0.5 ? 'Z' : 'X'
}

/**
 * Simulate BB84 protocol for `rounds` qubits.
 *
 * Protocol:
 * 1. Alice prepares random bit in random basis.
 * 2. (Optional) Eve intercepts with random basis and resends — introduces errors.
 * 3. Bob measures in random basis.
 * 4. Sifted key: positions where Alice and Bob chose same basis.
 * 5. Error rate: fraction of sifted key where Bob got wrong bit.
 *
 * Without Eve: error rate ≈ 0%
 * With Eve:    error rate ≈ 25% (Eve guesses wrong basis 50% of the time,
 *              and wrong-basis measurements give 50% random results)
 */
export function runBb84(config: Bb84RunConfig): Bb84RunSummary {
  const { rounds, withEve } = config
  const trace: Bb84TraceRow[] = []
  let sifted = 0
  let errors = 0

  for (let i = 0; i < rounds; i++) {
    const aliceBit = randomBit()
    const aliceBasis = randomBasis()

    // Qubit in transit (may be disturbed by Eve)
    let transmittedBit = aliceBit
    let transmittedBasis = aliceBasis
    let eveBasisUsed: 'Z' | 'X' | '-' = '-'

    if (withEve) {
      const eveBasis = randomBasis()
      eveBasisUsed = eveBasis
      if (eveBasis !== aliceBasis) {
        // Eve measured in wrong basis → random collapse
        transmittedBit = randomBit()
        transmittedBasis = eveBasis
      }
    }

    const bobBasis = randomBasis()
    let bobResult: 0 | 1

    if (bobBasis === transmittedBasis) {
      bobResult = transmittedBit
    } else {
      // Bob measured in wrong basis → random result
      bobResult = randomBit()
    }

    const isMatch = aliceBasis === bobBasis
    const isError = isMatch && bobResult !== aliceBit

    if (isMatch) {
      sifted++
      if (isError) {
        errors++
      }
    }

    // Keep trace for last 50 rounds maximum to avoid bloating response
    if (i < 50) {
      trace.push({
        id: i + 1,
        aliceBit,
        aliceBasis,
        eveBasis: eveBasisUsed,
        bobBasis,
        bobBit: bobResult,
        keep: isMatch,
        error: isError,
      })
    }
  }

  return {
    rounds,
    siftedKeyLength: sifted,
    errorRate: sifted > 0 ? errors / sifted : 0,
    trace,
  }
}

// ─── Stern-Gerlach ────────────────────────────────────────────────────────────

/**
 * Simulate the Stern-Gerlach experiment at a given apparatus angle.
 * Initial state is spin-up |0⟩ (Z-axis).
 * Measured at angle θ yields "up" with probability cos²(θ/2).
 */
export function simulateSternGerlach(config: SternGerlachConfig): SternGerlachResult {
  const thetaRad = (config.angleDegrees * Math.PI) / 180
  const probUp = Math.pow(Math.cos(thetaRad / 2), 2)
  const probDown = 1 - probUp

  const outcome = Math.random() < probUp ? 'up' : 'down'

  return {
    outcome,
    probUp,
    probDown,
  }
}
