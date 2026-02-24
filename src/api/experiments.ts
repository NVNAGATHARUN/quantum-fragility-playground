import type {
  BellOutcomeCounts,
  GhzOutcomeCounts,
  Bb84RunConfig,
  Bb84RunSummary,
} from '../types/quantum'

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? ''

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export function runBell(shots: number): Promise<BellOutcomeCounts> {
  return postJson('/api/experiments/bell', { shots })
}

export function runGhz(shots: number): Promise<GhzOutcomeCounts> {
  return postJson('/api/experiments/ghz', { shots })
}

export function runBb84(config: Bb84RunConfig): Promise<Bb84RunSummary> {
  return postJson('/api/experiments/bb84', config)
}

export function runSternGerlach(config: { angleDegrees: number }): Promise<{ outcome: 'up' | 'down'; probUp: number; probDown: number }> {
  return postJson('/api/experiments/stern-gerlach', config)
}
