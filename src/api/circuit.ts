/**
 * Phase 4: Circuit IR API Client for Quantum Lens AI.
 *
 * Provides typed client functions for the bidirectional synchronization pipeline:
 *   Graphical Canvas ↔ OpenQASM 3 ↔ Python Qiskit / Cirq / PennyLane
 *
 * All endpoints validate the circuit before any code generation or export;
 * invalid circuits are rejected with structured Diagnostic objects.
 */

import type { CircuitIR } from '../types/quantum'
import { apiUrl } from './client'

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(apiUrl(path), {
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

// ─── Validation Types ────────────────────────────────────────────────────────

export interface Diagnostic {
  severity: 'error' | 'warning' | 'info'
  code: string
  message: string
  operationId?: string | null
  qubit?: number | null
  suggestion?: string | null
  line?: number | null
  column?: number | null
}

export interface CircuitMetrics {
  depth: number
  gateCount: number
  multiQubitGates: number
  measurementCount: number
}

export interface ValidationResult {
  valid: boolean
  diagnostics: Diagnostic[]
  circuitHash: string | null
  qubits: number
  classicalBits: number
  metrics: CircuitMetrics
}

// ─── QASM Parse Types ─────────────────────────────────────────────────────────

export interface ParseQASMResponse {
  circuit: CircuitIR
  qubit_count: number
  classical_bit_count: number
  operation_count: number
  diagnostics: Diagnostic[]
  warnings: Diagnostic[]
}

// ─── Export Types ─────────────────────────────────────────────────────────────

export type ExportFormat = 'openqasm3' | 'qiskit' | 'cirq' | 'pennylane'

export interface ExportResponse {
  format: string
  code: string
  qubit_count: number
  operation_count: number
}

// ─── Roundtrip Type ───────────────────────────────────────────────────────────

export interface RoundtripResponse {
  original_qasm: string
  parsed_circuit: CircuitIR
  regenerated_qasm: string
  validation: ValidationResult
  parse_warnings: Diagnostic[]
}

// ─── Parity Types ─────────────────────────────────────────────────────────────

export interface ParityFrameworkResult {
  status: 'success' | 'error'
  probabilities?: Record<string, number>
  backend?: string
  error?: string
}

export interface ParityCheck {
  framework_a: string
  framework_b: string
  tvd: number
  tolerance: number
  pass: boolean
}

export interface ParityResponse {
  circuits: Record<string, ParityFrameworkResult>
  parity_checks: ParityCheck[]
  all_pass: boolean
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Validate a CircuitIR against the Quantum Lens semantic validator.
 * Returns a full ValidationResult with structured Diagnostic objects.
 */
export function validateCircuit(circuit: CircuitIR): Promise<ValidationResult> {
  return postJson<ValidationResult>('/api/v1/circuit/validate', { circuit })
}

/**
 * Parse an OpenQASM 3 source string into a canonical CircuitIR.
 * Throws on parse errors with structured diagnostics.
 */
export function parseQASM(qasmSource: string): Promise<ParseQASMResponse> {
  return postJson<ParseQASMResponse>('/api/v1/circuit/parse-qasm', { qasm_source: qasmSource })
}

/**
 * Export a CircuitIR to a target framework code string.
 * Validates the circuit before generating code; invalid circuits throw.
 */
export function exportCircuit(circuit: CircuitIR, format: ExportFormat): Promise<ExportResponse> {
  return postJson<ExportResponse>('/api/v1/circuit/export', { circuit, format })
}

/**
 * Run a QASM → IR → QASM roundtrip and verify losslessness.
 * Useful for debugging the bidirectional sync pipeline.
 */
export function qasmRoundtrip(qasmSource: string): Promise<RoundtripResponse> {
  return postJson<RoundtripResponse>('/api/v1/circuit/roundtrip', { qasm_source: qasmSource })
}

/**
 * Phase 5: Run the circuit on all available frameworks and verify probability parity.
 * Qiskit is mandatory; PennyLane and Cirq are included if available on the server.
 */
export function runParityCheck(
  circuit: CircuitIR,
  shots: number = 1024,
  tolerance: number = 0.01
): Promise<ParityResponse> {
  return postJson<ParityResponse>('/api/v1/quantum/parity', { circuit, shots, tolerance })
}

// ─── Phase 16: Collaboration, Permalinks & Forking ──────────────────────────

export interface SharedCircuitData {
  id: string
  title: string
  description: string
  circuit_ir: CircuitIR
  is_public: boolean
  author_id: string
  author_name: string
  parent_id?: string | null
  parent_title?: string | null
  parent_author_name?: string | null
  fork_count: number
  created_at: string
  updated_at: string
  permalink_url: string
}

export interface ProvenanceData {
  circuit_id: string
  title: string
  author_name: string
  created_at: string
  fork_count: number
  is_fork: boolean
  parent?: {
    circuit_id: string
    title: string
    author_name: string
    created_at: string
    fork_count: number
  } | null
}

export async function fetchSharedCircuit(circuitId: string): Promise<SharedCircuitData> {
  const res = await fetch(apiUrl(`/api/v1/circuits/share/${circuitId}`))
  if (!res.ok) {
    throw new Error('Circuit permalink not found or is private')
  }
  return res.json()
}

export async function shareCircuit(
  token: string,
  circuitId: string,
  isPublic: boolean = true
): Promise<SharedCircuitData> {
  const res = await fetch(apiUrl(`/api/v1/circuits/${circuitId}/share`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ is_public: isPublic }),
  })
  if (!res.ok) {
    throw new Error('Failed to configure circuit sharing')
  }
  return res.json()
}

export async function forkCircuit(
  token: string,
  circuitId: string,
  title?: string
): Promise<{ id: string; title: string; parent_id: string }> {
  const res = await fetch(apiUrl(`/api/v1/circuits/${circuitId}/fork`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fork circuit' }))
    throw new Error(err.detail || 'Failed to fork circuit')
  }
  return res.json()
}

export async function fetchCircuitProvenance(circuitId: string): Promise<ProvenanceData> {
  const res = await fetch(apiUrl(`/api/v1/circuits/${circuitId}/provenance`))
  if (!res.ok) {
    throw new Error('Failed to load circuit provenance')
  }
  return res.json()
}

export async function saveUserCircuit(
  token: string,
  title: string,
  description: string,
  circuit_ir: CircuitIR,
  is_public: boolean = false
): Promise<{ id: string; title: string }> {
  const res = await fetch(apiUrl('/api/v1/circuits'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, description, circuit_ir, is_public }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to save circuit' }))
    throw new Error(err.detail || 'Failed to save circuit')
  }
  return res.json()
}

