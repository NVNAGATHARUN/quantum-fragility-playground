/**
 * Phase 8: Challenges & Automated Assessment API Client.
 *
 * Provides typed methods to retrieve quantum coding challenges across the 5 types
 * (Build, Predict, Debug, Code, Optimize) and evaluate learner circuits against
 * target unitaries, statevectors, and constraints.
 */

import type { CircuitIR } from '../types/quantum';

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? '';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function postJson<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export type ChallengeType = 'build' | 'predict' | 'debug' | 'code' | 'optimize';
export type ChallengeDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface TestCaseResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: string | null;
}

export interface ChallengeMetrics {
  depth: number;
  gate_count: number;
  two_qubit_count: number;
}

export interface AssessmentResult {
  challenge_id: string;
  passed: boolean;
  score: number;
  fidelity?: number | null;
  metrics: ChallengeMetrics;
  test_cases: TestCaseResult[];
  feedback: string[];
  runtime_ms: number;
}

export interface ChallengeDefinition {
  id: string;
  type: ChallengeType;
  title: string;
  subtitle: string;
  difficulty: ChallengeDifficulty;
  category: string;
  instructions: string;
  starter_circuit: CircuitIR;
  target_description: string;
  max_gates?: number | null;
  max_depth?: number | null;
  max_two_qubit_gates?: number | null;
}

export function listChallenges(): Promise<ChallengeDefinition[]> {
  return fetchJson<ChallengeDefinition[]>('/api/v1/challenges');
}

export function getChallenge(id: string): Promise<ChallengeDefinition> {
  return fetchJson<ChallengeDefinition>(`/api/v1/challenges/${id}`);
}

export function evaluateChallenge(
  id: string,
  circuit: CircuitIR,
  prediction?: Record<string, number>,
  token?: string | null,
): Promise<AssessmentResult> {
  return postJson<AssessmentResult>(`/api/v1/challenges/${id}/evaluate`, {
    circuit,
    prediction,
  }, token);
}
