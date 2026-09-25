/**
 * hooks/useLessonProgress.ts — Progress Hook for Lesson Completion
 *
 * SCOPE BOUNDARIES (Phase 3):
 *   - Stores lesson COMPLETION (participated/finished a lesson)
 *   - Stores checkpoint attempt telemetry (formative only, NOT graded)
 *   - Does NOT generate mastery scores (Phase 10+)
 *   - Does NOT feed authoritative assessment (Phase 8)
 *
 * Progress record schema (sent to backend):
 *   { module_id, lesson_id, content_version, completion_status: "completed" }
 *
 * Checkpoint telemetry schema (stored locally, NOT sent to backend in Phase 3):
 *   { checkpoint_id, selected_option, correct, attempt_number }
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../providers/AuthProvider';

const TOKEN_KEY = 'ql_jwt_token';

export interface LessonProgressRecord {
  id: string;
  user_id: string;
  module_id: string;
  lesson_id: string;
  content_version: string;
  completion_status: 'completed';
  completed_at: string;
}

export interface CheckpointAttempt {
  checkpointId: string;
  selectedKey: string;
  correct: boolean;
  attemptNumber: number;
  lessonId: string;
  moduleId: string;
}

interface UseLessonProgressReturn {
  /** Set of "moduleId/lessonId" strings that the user has completed */
  completedSet: Set<string>;
  isCompleted: (moduleId: string, lessonId: string) => boolean;
  markComplete: (moduleId: string, lessonId: string, contentVersion: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  /** Checkpoint telemetry — Phase 3 stores locally, not sent to backend */
  recordCheckpointAttempt: (attempt: CheckpointAttempt) => void;
}

export function useLessonProgress(): UseLessonProgressReturn {
  const { isAuthenticated, token } = useAuth();
  const [completedSet, setCompletedSet] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Fetch all completed lessons from the backend on mount (if authenticated) */
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    setIsLoading(true);
    fetch('/api/v1/learn/progress', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load progress');
        return res.json() as Promise<LessonProgressRecord[]>;
      })
      .then(records => {
        const set = new Set(records.map(r => `${r.module_id}/${r.lesson_id}`));
        setCompletedSet(set);
      })
      .catch(err => {
        setError(err.message || 'Progress load error');
      })
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, token]);

  const isCompleted = useCallback(
    (moduleId: string, lessonId: string) =>
      completedSet.has(`${moduleId}/${lessonId}`),
    [completedSet]
  );

  /**
   * Mark a lesson as completed.
   *
   * Backend receives:
   *   { module_id, lesson_id, content_version, completion_status }
   *
   * No arbitrary client-generated score. Backend determines timestamp.
   * Unauthenticated callers receive no-op with a handled rejection.
   */
  const markComplete = useCallback(
    async (moduleId: string, lessonId: string, contentVersion: string) => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) return; // Unauthenticated — UI handles the soft prompt

      setError(null);
      try {
        const res = await fetch('/api/v1/learn/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${storedToken}`,
          },
          body: JSON.stringify({
            module_id: moduleId,
            lesson_id: lessonId,
            content_version: contentVersion,
            completion_status: 'completed',
          }),
        });

        if (!res.ok) throw new Error('Failed to record completion');

        setCompletedSet(prev => new Set(prev).add(`${moduleId}/${lessonId}`));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Completion error');
        throw err;
      }
    },
    []
  );

  /**
   * Record a checkpoint attempt as local telemetry.
   * Phase 3: stored in sessionStorage only — not sent to backend.
   * Phase 8 will introduce server-side checkpoint grading.
   */
  const recordCheckpointAttempt = useCallback((attempt: CheckpointAttempt) => {
    try {
      const key = 'ql_checkpoint_telemetry';
      const existing: CheckpointAttempt[] = JSON.parse(
        sessionStorage.getItem(key) || '[]'
      );
      existing.push(attempt);
      sessionStorage.setItem(key, JSON.stringify(existing));
    } catch {
      // sessionStorage unavailable — silently ignore
    }
  }, []);

  return {
    completedSet,
    isCompleted,
    markComplete,
    isLoading,
    error,
    recordCheckpointAttempt,
  };
}
