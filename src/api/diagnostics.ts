import { apiUrl } from './client';

export type DiagnosticPhase = 'baseline' | 'post';
export interface DiagnosticItem { id: string; misconception_id: string; concept: string; prompt: string; options: string[] }
export interface DiagnosticForm { phase: DiagnosticPhase; form_version: string; items: DiagnosticItem[] }
export interface DiagnosticSummary {
  baseline: null | { id: string; score: number; concept_scores: Record<string, number>; completed_at: string };
  post: null | { id: string; score: number; concept_scores: Record<string, number>; completed_at: string };
  improvement: number | null; attempts_count: number; recommended_phase: DiagnosticPhase;
}
export interface DiagnosticResult {
  attempt_id: string; phase: DiagnosticPhase; score: number; correct_count: number; item_count: number;
  concept_scores: Record<string, number>;
  items: Array<{ item_id: string; misconception_id: string; concept: string; passed: boolean; selected: number }>;
}
async function checked<T>(response: Response): Promise<T> {
  if (!response.ok) { const body = await response.json().catch(() => ({ detail: 'Diagnostic service is unavailable' })); throw new Error(body.detail || 'Diagnostic service is unavailable'); }
  return response.json();
}
export const fetchDiagnosticForm = (token: string, phase: DiagnosticPhase) => fetch(apiUrl(`/api/v1/diagnostics/form/${phase}`), { headers: { Authorization: `Bearer ${token}` } }).then(checked<DiagnosticForm>);
export const fetchDiagnosticSummary = (token: string) => fetch(apiUrl('/api/v1/diagnostics/summary'), { headers: { Authorization: `Bearer ${token}` } }).then(checked<DiagnosticSummary>);
export const submitDiagnostic = (token: string, phase: DiagnosticPhase, responses: Record<string, number>, confidence: Record<string, number>) => fetch(apiUrl('/api/v1/diagnostics/submit'), {
  method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ phase, responses, confidence }),
}).then(checked<DiagnosticResult>);
