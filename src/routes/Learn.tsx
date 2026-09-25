import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
  FlaskConical,
  ArrowRight,
  Brain,
  Activity,
  CheckCircle2,
  Lock,
} from 'lucide-react';

import { V3_CURRICULUM } from '../content/curriculum';
import type { LessonType } from '../content/types';
import { useLessonProgress } from '../hooks/useLessonProgress';

const TYPE_ICONS: Record<LessonType, React.ComponentType<{ className?: string }>> = {
  learn: BookOpen,
  visualize: Activity,
  experiment: FlaskConical,
  challenge: Brain,
};

const TYPE_STYLES: Record<LessonType, { bg: string; text: string; border: string }> = {
  learn: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-900' },
  visualize: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-900' },
  experiment: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-900' },
  challenge: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-900' },
};

export default function Learn() {
  const [expandedModule, setExpandedModule] = useState<string>('m02-qubits-measurement');
  const { isCompleted } = useLessonProgress();

  const toggleModule = (id: string) => {
    setExpandedModule((prev) => (prev === id ? '' : id));
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1.5 border-b border-border pb-5">
        <div className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
          Curriculum Syllabus
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight">
          Learn Quantum Computing
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary max-w-2xl font-normal leading-relaxed">
          An interactive, experiment-driven curriculum covering mathematical foundations, multi-qubit entanglement, standard algorithms, and real physical hardware.
        </p>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {V3_CURRICULUM.map((mod) => {
          const isExpanded = expandedModule === mod.id;
          const isAvailable = mod.status === 'available' && mod.lessons.length > 0;
          const firstLesson = mod.lessons[0];

          const lessonCounts = mod.lessons.reduce((acc, l) => {
            acc[l.type] = (acc[l.type] || 0) + 1;
            return acc;
          }, {} as Record<LessonType, number>);

          const countString = isAvailable
            ? [
                lessonCounts.learn ? `${lessonCounts.learn} concept${lessonCounts.learn > 1 ? 's' : ''}` : null,
                lessonCounts.visualize ? `${lessonCounts.visualize} visual` : null,
                lessonCounts.experiment ? `${lessonCounts.experiment} lab${lessonCounts.experiment > 1 ? 's' : ''}` : null,
                lessonCounts.challenge ? `${lessonCounts.challenge} challenge` : null,
              ]
                .filter(Boolean)
                .join(' • ')
            : 'Curriculum in development';

          const completedCount = mod.lessons.filter((l) => isCompleted(mod.id, l.id)).length;
          const isAllCompleted = isAvailable && completedCount === mod.lessons.length;

          return (
            <div
              key={mod.id}
              className="rounded-xl border border-border bg-surface-primary shadow-sm overflow-hidden transition-all duration-150"
            >
              {/* Module Header Bar */}
              <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <span className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono text-xs font-semibold shrink-0 mt-0.5 sm:mt-0 ${
                    isAllCompleted
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-surface-secondary border-border text-text-muted'
                  }`}>
                    {isAllCompleted ? <CheckCircle2 className="w-4 h-4" /> : mod.number}
                  </span>
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-text-primary tracking-tight">
                        {mod.title}
                      </h2>
                      {mod.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-secondary border border-border text-text-muted">
                          {mod.badge}
                        </span>
                      )}
                      {!isAvailable && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Planned</span>
                        </span>
                      )}
                      {completedCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                          {completedCount}/{mod.lessons.length} completed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary">
                      {mod.subtitle}
                    </p>
                    <div className="text-[11px] font-mono text-text-muted pt-0.5">
                      {countString}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                  {isAvailable && (
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className="px-3 py-1.5 rounded-lg border border-border hover:bg-surface-secondary text-xs text-text-secondary flex items-center gap-1.5 transition-colors"
                      aria-expanded={isExpanded}
                    >
                      <span>{isExpanded ? 'Hide Lessons' : 'View Lessons'}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-150 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  )}

                  {isAvailable && firstLesson ? (
                    <Link
                      to={`/learn/${mod.id}/${firstLesson.id}`}
                      className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <span>{completedCount > 0 ? 'Continue' : 'Start Module'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="px-3.5 py-1.5 rounded-lg bg-border/60 text-text-muted text-xs cursor-not-allowed flex items-center gap-1"
                    >
                      <span>Coming Soon</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Module Expanded Details & Lesson Types */}
              {isExpanded && isAvailable && (
                <div className="px-5 sm:px-6 pb-6 pt-1 border-t border-border/60 space-y-4">
                  <p className="text-xs text-text-secondary leading-relaxed pt-2">
                    {mod.description}
                  </p>

                  {/* Visualized Lesson Journey List */}
                  <div className="divide-y divide-border/60 rounded-xl border border-border bg-surface-secondary/40 overflow-hidden">
                    {mod.lessons.map((lesson) => {
                      const Icon = TYPE_ICONS[lesson.type];
                      const style = TYPE_STYLES[lesson.type];
                      const completed = isCompleted(mod.id, lesson.id);

                      return (
                        <Link
                          key={lesson.id}
                          to={`/learn/${mod.id}/${lesson.id}`}
                          className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-surface-secondary transition-colors group block"
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 shrink-0 mt-0.5 ${style.bg} ${style.text} ${style.border}`}
                            >
                              <Icon className="w-2.5 h-2.5" />
                              <span>{lesson.typeLabel}</span>
                            </span>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-text-primary group-hover:text-primary transition-colors">
                                  {lesson.title}
                                </span>
                                <span className="text-[10px] font-mono text-text-muted">
                                  &bull; {lesson.duration}
                                </span>
                                {completed && (
                                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Done</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-text-secondary">
                                {lesson.summary}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              <span>Open Lesson</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
