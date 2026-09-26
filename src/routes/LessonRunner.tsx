/**
 * LessonRunner.tsx — Full Interactive Lesson Runner for Quantum Lens AI.
 *
 * Dedicated runner route at `/learn/:moduleId/:lessonId`.
 *
 * Layout:
 * - Left rail: Module navigation with completion checkmarks
 * - Center editorial column: Structured lesson blocks (Math, Visuals, Checkpoints)
 * - Optional right rail: Lesson outline & lab connections
 * - Action footer: Previous/Next lesson + DB-backed completion gate
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Eye,
  Sliders,
  Award,
  Layers,
  Sparkles,
  ExternalLink,
  Lock,
  ArrowLeft,
} from 'lucide-react';

import {
  findModule,
  findLesson,
  getAdjacentLessons,
  V3_CURRICULUM,
} from '../content/curriculum';
import type { LessonDef, ModuleDef, CheckpointBlock, HeadingBlock } from '../content/types';
import LessonBlockRenderer from '../components/lesson/LessonBlockRenderer';
import { useLessonProgress } from '../hooks/useLessonProgress';
import { useAuth } from '../providers/AuthProvider';

export default function LessonRunner() {
  const { moduleId, lessonId } = useParams<{ moduleId: string; lessonId: string }>();
  const navigate = useNavigate();

  const { isAuthenticated } = useAuth();
  const { isCompleted, markComplete, recordCheckpointAttempt } = useLessonProgress();

  const moduleDef = useMemo(() => (moduleId ? findModule(moduleId) : undefined), [moduleId]);
  const lessonDef = useMemo(
    () => (moduleId && lessonId ? findLesson(moduleId, lessonId) : undefined),
    [moduleId, lessonId]
  );
  const adjacent = useMemo(
    () => (moduleId && lessonId ? getAdjacentLessons(moduleId, lessonId) : { prev: null, next: null }),
    [moduleId, lessonId]
  );

  // Track completed checkpoints in current lesson session
  const [solvedCheckpoints, setSolvedCheckpoints] = useState<Set<string>>(new Set());
  const [interactedVisuals, setInteractedVisuals] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  // Reset local interactive state when navigating between lessons
  useEffect(() => {
    setSolvedCheckpoints(new Set());
    setInteractedVisuals(new Set());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [moduleId, lessonId]);

  if (!moduleDef || !lessonDef) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-text-primary">
            {!moduleDef ? 'Module Not Found' : 'Lesson Content Planned'}
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            {!moduleDef
              ? `The module identifier "${moduleId}" does not match our curriculum manifest.`
              : `This lesson in "${moduleDef.title}" is currently in development and will be released in an upcoming build pass.`}
          </p>
          <div className="pt-2">
            <Link
              to="/learn"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Curriculum</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const lessonCompleted = moduleId && lessonId ? isCompleted(moduleId, lessonId) : false;

  // Determine if completion requirements are fulfilled
  const canComplete = useMemo(() => {
    if (lessonCompleted) return true;
    for (const req of lessonDef.completionRequirements) {
      if (req.optional) continue;
      if (req.type === 'checkpoint' && !solvedCheckpoints.has(req.id)) {
        return false;
      }
      if (req.type === 'visual_interaction' && !interactedVisuals.has(req.id)) {
        return false;
      }
    }
    return true;
  }, [lessonCompleted, lessonDef.completionRequirements, solvedCheckpoints, interactedVisuals]);

  const handleMarkComplete = async () => {
    if (!isAuthenticated) {
      setAuthPromptOpen(true);
      return;
    }
    if (!moduleId || !lessonId || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await markComplete(moduleId, lessonId, lessonDef.contentVersion);
    } catch (err) {
      console.error('Failed to record completion', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckpointAttempt = (
    checkpointId: string,
    selectedKey: string,
    correct: boolean
  ) => {
    if (moduleId && lessonId) {
      recordCheckpointAttempt({
        checkpointId,
        selectedKey,
        correct,
        attemptNumber: 1,
        lessonId,
        moduleId,
      });
    }
  };

  const handleCheckpointSolved = (checkpointId: string) => {
    setSolvedCheckpoints((prev) => new Set(prev).add(checkpointId));
  };

  const handleVisualInteracted = (visualId: string) => {
    setInteractedVisuals((prev) => new Set(prev).add(visualId));
  };

  // Extract headings for the right-hand table of contents
  const headings = lessonDef.blocks.filter(
    (b): b is HeadingBlock => b.type === 'heading'
  );

  const getLessonTypeIcon = (type: LessonDef['type']) => {
    switch (type) {
      case 'learn':
        return BookOpen;
      case 'visualize':
        return Eye;
      case 'experiment':
        return Sliders;
      case 'challenge':
        return Award;
      default:
        return BookOpen;
    }
  };

  const TypeIcon = getLessonTypeIcon(lessonDef.type);

  return (
    <div className="ql-lesson-reader min-h-screen bg-surface-primary text-text-primary flex flex-col">
      {/* Top Header / Breadcrumb */}
      <header className="sticky top-0 z-30 bg-surface-primary/90 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/learn"
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary px-2.5 py-1.5 rounded-lg border border-border/80 hover:bg-surface-secondary transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Modules</span>
          </Link>

          <div className="h-4 w-px bg-border hidden sm:block" />

          <div className="flex items-center gap-2 truncate text-xs">
            <span className="text-text-muted hidden md:inline">Module {moduleDef.number}:</span>
            <span className="font-semibold text-text-primary truncate">{moduleDef.title}</span>
            <span className="text-text-muted">/</span>
            <span className="text-text-secondary truncate">{lessonDef.title}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lessonCompleted && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed</span>
            </span>
          )}
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Left Rail: Module Lessons Index */}
        <aside className="w-64 flex-shrink-0 border-r border-border p-4 hidden md:block space-y-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1">
              Module {moduleDef.number}
            </div>
            <h3 className="text-sm font-bold text-text-primary leading-tight">
              {moduleDef.title}
            </h3>
            <p className="text-xs text-text-secondary mt-1 line-clamp-2">
              {moduleDef.subtitle}
            </p>
          </div>

          <div className="pt-2 border-t border-border/60 space-y-1">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted px-2 mb-1">
              Lessons ({moduleDef.lessons.length})
            </div>
            {moduleDef.lessons.map((item, idx) => {
              const active = item.id === lessonDef.id;
              const completed = moduleId ? isCompleted(moduleId, item.id) : false;
              const ItemIcon = getLessonTypeIcon(item.type);

              return (
                <Link
                  key={item.id}
                  to={`/learn/${moduleDef.id}/${item.id}`}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2.5 transition-colors ${
                    active
                      ? 'bg-primary/10 border border-primary/20 text-primary font-medium'
                      : 'hover:bg-surface-secondary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <ItemIcon className="w-4 h-4 opacity-70" />
                    )}
                  </div>
                  <div className="flex-1 truncate">
                    <div className="truncate">{item.title}</div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Curriculum Switcher */}
          <div className="pt-4 border-t border-border/60">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted px-2 mb-2">
              All Modules
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {V3_CURRICULUM.map((mod) => (
                <Link
                  key={mod.id}
                  to={
                    mod.lessons[0]
                      ? `/learn/${mod.id}/${mod.lessons[0].id}`
                      : `/learn`
                  }
                  className={`block px-2.5 py-1.5 rounded-lg text-[11px] truncate transition-colors ${
                    mod.id === moduleDef.id
                      ? 'font-semibold text-primary bg-primary/5'
                      : 'text-text-muted hover:text-text-primary hover:bg-surface-secondary/60'
                  }`}
                >
                  <span className="font-mono mr-1.5">{mod.number}</span>
                  <span>{mod.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Center Editorial Column */}
        <main className="flex-1 min-w-0 px-4 sm:px-8 py-8 max-w-3xl mx-auto flex flex-col justify-between">
          <div>
            {/* Lesson Title & Header Metadata */}
            <div className="mb-8 space-y-3 pb-6 border-b border-border/60">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold uppercase tracking-wider text-[10px]">
                  {lessonDef.typeLabel}
                </span>
                <span className="flex items-center gap-1 text-text-muted">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{lessonDef.duration}</span>
                </span>
                <span className="text-text-muted">•</span>
                <span className="text-text-muted font-mono text-[11px]">
                  v{lessonDef.contentVersion}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                {lessonDef.title}
              </h1>

              <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                {lessonDef.summary}
              </p>
            </div>

            {/* Structured Lesson Blocks */}
            <LessonBlockRenderer
              blocks={lessonDef.blocks}
              onCheckpointAttempt={handleCheckpointAttempt}
              onCheckpointSolved={handleCheckpointSolved}
              onVisualInteracted={handleVisualInteracted}
            />

            {/* Related Lab Link if defined */}
            {lessonDef.labLink && (
              <div className="my-8 p-5 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-indigo-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs uppercase font-semibold text-primary flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Hands-On Laboratory</span>
                  </div>
                  <h4 className="text-sm font-bold text-text-primary">
                    {lessonDef.labLabel || 'Explore in Guided Lab'}
                  </h4>
                  <p className="text-xs text-text-secondary">
                    Apply the principles learned in this lesson inside the interactive simulation workspace.
                  </p>
                </div>
                <Link
                  to={lessonDef.labLink}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5 flex-shrink-0"
                >
                  <span>Launch Lab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Lesson Completion and Navigation Footer */}
          <footer className="mt-12 pt-6 border-t border-border space-y-4">
            {/* Completion Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-surface-secondary/70 border border-border">
              <div className="text-xs text-text-secondary text-center sm:text-left">
                {lessonCompleted ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 justify-center sm:justify-start">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Lesson marked complete in your learning profile</span>
                  </span>
                ) : canComplete ? (
                  <span>Ready to record your completion for this lesson.</span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">
                    Solve the checkpoints above to unlock completion.
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleMarkComplete}
                disabled={!canComplete || isSubmitting || lessonCompleted}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 ${
                  lessonCompleted
                    ? 'bg-emerald-600/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 cursor-default'
                    : canComplete
                    ? 'bg-primary text-white hover:bg-primary/90 cursor-pointer'
                    : 'bg-border/60 text-text-muted cursor-not-allowed'
                }`}
              >
                {lessonCompleted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Completed</span>
                  </>
                ) : isSubmitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <span>Mark Complete</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Prev / Next Lesson Navigation */}
            <div className="flex items-center justify-between pt-2">
              {adjacent.prev ? (
                <Link
                  to={`/learn/${moduleDef.id}/${adjacent.prev.id}`}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border text-xs text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <div className="text-left">
                    <div className="text-[10px] text-text-muted">Previous</div>
                    <div className="font-semibold text-text-primary truncate max-w-[140px] sm:max-w-[200px]">
                      {adjacent.prev.title}
                    </div>
                  </div>
                </Link>
              ) : (
                <div />
              )}

              {adjacent.next ? (
                <Link
                  to={`/learn/${moduleDef.id}/${adjacent.next.id}`}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-secondary border border-border text-xs text-text-primary hover:bg-border/40 transition-colors"
                >
                  <div className="text-right">
                    <div className="text-[10px] text-text-muted">Next</div>
                    <div className="font-semibold text-text-primary truncate max-w-[140px] sm:max-w-[200px]">
                      {adjacent.next.title}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  to="/learn"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
                >
                  <span>Finish Module</span>
                  <CheckCircle2 className="w-4 h-4" />
                </Link>
              )}
            </div>
          </footer>
        </main>

        {/* Right Rail: Table of Contents & Info (XL screens only) */}
        {headings.length > 0 && (
          <aside className="w-56 flex-shrink-0 border-l border-border p-4 hidden xl:block space-y-4 text-xs">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-text-muted">
              On This Page
            </div>
            <nav className="space-y-2">
              {headings.map((h, i) => (
                <div
                  key={i}
                  className={`text-text-secondary hover:text-text-primary transition-colors cursor-pointer ${
                    h.level === 3 ? 'pl-2 text-[11px]' : ''
                  }`}
                >
                  {h.content}
                </div>
              ))}
            </nav>
          </aside>
        )}
      </div>

      {/* Unauthenticated soft prompt modal */}
      {authPromptOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-primary border border-border rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl text-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-text-primary">
              Track Your Progress
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Sign in to permanently save your completed lessons, checkpoints, and module achievements to your learner profile.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setAuthPromptOpen(false)}
                className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                Sign In or Register
              </button>
              <button
                type="button"
                onClick={() => setAuthPromptOpen(false)}
                className="w-full py-2 text-xs text-text-muted hover:text-text-secondary"
              >
                Continue Without Saving
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
