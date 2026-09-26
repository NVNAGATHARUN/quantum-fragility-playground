/**
 * Grover's Algorithm API Client for Quantum Lens AI.
 *
 * Calls the FastAPI /api/v1/algorithms/grover endpoint for verified Qiskit Aer
 * amplitude snapshots and measured shot counts.
 *
 * SRS Reference: Sections 58-61 (AL-03), M06 correction.
 */

import type { CircuitIR, StateAmplitude } from "../types/quantum";

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GroverRunRequest {
  n_qubits: number; // 2, 3, or 4
  target_state: string; // binary string e.g. '11'
  shots?: number;
}

export interface GroverResult {
  n_qubits: number;
  target_state: string;
  optimal_iterations: number;
  /** amplitude_snapshots[k] = statevector after k Grover iterations (0 = after H⊗n init) */
  amplitude_snapshots: StateAmplitude[][];
  final_probabilities: Record<string, number>;
  counts: Record<string, number>;
  circuit_ir: CircuitIR;
  execution_time_ms: number;
}

// ─── Backend API Call ─────────────────────────────────────────────────────────

export async function runGrover(req: GroverRunRequest): Promise<GroverResult> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/algorithms/grover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        n_qubits: req.n_qubits,
        target_state: req.target_state,
        shots: req.shots ?? 1024,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API ${res.status}: ${text}`);
    }
    return (await res.json()) as GroverResult;
  } catch (err) {
    throw new Error(
      "Qiskit Aer could not run this experiment. Check the backend connection and try again.",
    );
  }
}
