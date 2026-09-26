/**
 * Grounded Student & Instructor Progress API Client for Quantum Lens AI.
 *
 * Retrieves database-backed progress summaries and empirical records.
 * Zero synthetic student data.
 */

export interface MisconceptionSummaryItem {
  id: string;
  misconception_id: string;
  status: string;
  evidence: string;
  detected_at: string;
  resolved_at?: string;
}

export interface StudentProgressSummary {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  overall_mastery: number;
  circuits_count: number;
  attempts_count: number;
  total_time_minutes: number;
  recent_attempts: Array<{
    id: string;
    timestamp: string;
    cognitive_delta?: number;
    was_correct?: boolean;
  }>;
  detected_misconceptions: MisconceptionSummaryItem[];
  enrolled_classrooms_count: number;
  verified_attempts: number;
  passed_attempts: number;
  competency_evidence: Array<{ domain: string; score: number; attempts: number; passed: number; evidence: string }>;
  recommendation: { title: string; reason: string; route: string; evidence: string };
}

export async function fetchProgressSummary(token?: string | null): Promise<StudentProgressSummary | null> {
  const authToken = token || localStorage.getItem('ql_jwt_token');
  if (!authToken) return null;

  try {
    const res = await fetch('/api/v1/progress/summary', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('[ProgressAPI] Failed to fetch progress summary', e);
    return null;
  }
}
