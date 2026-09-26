import type { LessonDef, LessonType } from '../types';

type CoreLessonSpec = {
  id: string;
  moduleId: string;
  title: string;
  summary: string;
  duration?: string;
  type?: LessonType;
  concept: string;
  equation: string;
  equationLabel: string;
  misconception: string;
  prediction: string;
  question: string;
  options: Array<{ key: string; text: string }>;
  correctKey: string;
  correctExplanation: string;
  labLink: string;
  labLabel: string;
  reflection: string;
};

/** Consistent evidence-first lesson shell for the core quantum journey. */
export function coreLesson(spec: CoreLessonSpec): LessonDef {
  const checkpointId = `cp-${spec.id}-01`;
  return {
    id: spec.id,
    moduleId: spec.moduleId,
    contentVersion: '1.0.0',
    title: spec.title,
    type: spec.type ?? 'learn',
    typeLabel: spec.type === 'challenge' ? 'Challenge preparation' : spec.type === 'experiment' ? 'Experiment' : 'Concept',
    duration: spec.duration ?? '12 min',
    summary: spec.summary,
    status: 'available',
    labLink: spec.labLink,
    labLabel: spec.labLabel,
    completionRequirements: [{ type: 'checkpoint', id: checkpointId }],
    blocks: [
      { type: 'text', content: spec.concept },
      { type: 'math', expression: spec.equation, display: true, label: spec.equationLabel },
      { type: 'callout', variant: 'warning', title: 'Common misconception', content: spec.misconception },
      { type: 'prediction', id: `predict-${spec.id}`, prompt: spec.prediction, reflection: 'Commit to a prediction before opening the experiment. Compare the result with the amplitudes, not only the measurement bars.' },
      { type: 'experiment_link', label: spec.labLabel, description: 'Test this concept in a simulator-backed activity and return with evidence.', href: spec.labLink },
      {
        type: 'checkpoint', id: checkpointId, question: spec.question, options: spec.options,
        correctKey: spec.correctKey, correctExplanation: spec.correctExplanation,
        incorrectExplanations: Object.fromEntries(spec.options.filter(o => o.key !== spec.correctKey).map(o => [o.key, `Not quite. Revisit ${spec.equationLabel.toLowerCase()} and distinguish amplitudes, phase, and sampled outcomes.`])),
      },
      { type: 'reflection', id: `reflect-${spec.id}`, prompt: spec.reflection, hint: 'Use the circuit state, the mathematical rule, and the observed distribution in your explanation.' },
    ],
  };
}
