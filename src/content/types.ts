/**
 * content/types.ts — Canonical Type Definitions for Lesson Content System
 *
 * All lesson block types, completion requirements, and module/lesson
 * interfaces for the Quantum Lens AI curriculum framework.
 *
 * IMPORTANT DISTINCTION:
 *   - Lesson completion = participation record stored in DB (Phase 3)
 *   - Formative checkpoints = local UX gates only (Phase 3)
 *   - Authoritative assessment = Phase 8 (server-side graded)
 *   - Mastery = Phase 10+ (evidence-aggregated)
 */

// ─── Completion & Status ──────────────────────────────────────────────────────

export type LessonStatus = 'available' | 'planned' | 'draft';
export type ModuleStatus = 'available' | 'planned' | 'draft';

export type CompletionRequirementType =
  | 'checkpoint'
  | 'visual_interaction'
  | 'experiment_visit';

export interface CompletionRequirement {
  type: CompletionRequirementType;
  id: string;
  optional?: boolean;
}

// ─── Lesson Block Types ───────────────────────────────────────────────────────

export interface TextBlock {
  type: 'text';
  content: string; // Supports **bold** *italic* via inline renderer
}

export interface HeadingBlock {
  type: 'heading';
  level: 2 | 3;
  content: string;
}

export interface MathBlock {
  type: 'math';
  expression: string; // LaTeX expression — rendered via KaTeX
  display?: boolean;  // true = display (centered block), false = inline
  label?: string;     // Optional equation label
}

export interface CodeBlock {
  type: 'code';
  language: 'python' | 'qasm' | 'text';
  content: string;
  caption?: string;
}

export interface CalloutBlock {
  type: 'callout';
  variant: 'definition' | 'note' | 'tip' | 'warning' | 'insight';
  title?: string;
  content: string;
}

/**
 * CheckpointBlock — formative learning gate.
 *
 * SCOPE: UX-only checkpoint to encourage active recall and provide
 * immediate feedback. NOT a graded assessment.
 *
 * Answer key lives client-side intentionally — these are NOT secure
 * assessments. Phase 8 will move graded questions server-side.
 *
 * Checkpoint interactions are stored as telemetry only. They do NOT
 * feed authoritative mastery scores.
 */
export interface CheckpointOption {
  key: string; // e.g. 'a', 'b', 'c', 'd'
  text: string;
}

export interface CheckpointBlock {
  type: 'checkpoint';
  id: string; // unique within lesson, e.g. 'cp-dirac-01'
  question: string;
  options: CheckpointOption[];
  correctKey: string;
  incorrectExplanations?: Record<string, string>; // keyed by option.key
  correctExplanation: string;
}

/**
 * InteractiveVisualBlock — controlled registry reference.
 *
 * Lesson content references only approved keys from VISUAL_REGISTRY
 * in visualRegistry.ts. Never dynamic component name strings.
 */
export interface InteractiveVisualBlock {
  type: 'interactive_visual';
  id: string;                  // unique within lesson
  visualKey: VisualRegistryKey; // must exist in VISUAL_REGISTRY
  caption: string;
  initialProps?: Record<string, unknown>;
  interactionPrompt?: string; // e.g. "Drag the state vector toward the equator."
}

export interface CircuitExampleBlock {
  type: 'circuit_example';
  id: string;
  caption: string;
  circuitIR: Record<string, unknown>; // CircuitIR schema
  studioLink?: string;
}

export interface PredictionBlock {
  type: 'prediction';
  id: string;
  prompt: string;          // "What do you think will happen when…?"
  options?: CheckpointOption[]; // optional MCQ, else open reflection
  reflection?: string;     // shown after interaction
}

export interface ExperimentLinkBlock {
  type: 'experiment_link';
  label: string;
  description: string;
  href: string;
}

export interface ReflectionBlock {
  type: 'reflection';
  id?: string;
  prompt: string;
  hint?: string;
}

export interface DividerBlock {
  type: 'divider';
}

// ─── Union ────────────────────────────────────────────────────────────────────

export type LessonBlock =
  | TextBlock
  | HeadingBlock
  | MathBlock
  | CodeBlock
  | CalloutBlock
  | CheckpointBlock
  | InteractiveVisualBlock
  | CircuitExampleBlock
  | PredictionBlock
  | ExperimentLinkBlock
  | ReflectionBlock
  | DividerBlock;

// ─── Visual Registry Keys ─────────────────────────────────────────────────────

export type VisualRegistryKey =
  | 'blochSphere'
  | 'stateVector'
  | 'measurementProbability'
  | 'basisComparison'
  | 'complexPlane'
  | 'unitaryMatrix';

// ─── Lesson & Module ─────────────────────────────────────────────────────────

export type LessonType = 'learn' | 'visualize' | 'experiment' | 'challenge';

export interface LessonDef {
  id: string;
  moduleId: string;
  /**
   * Semantic version of the lesson content.
   * Stored alongside completion records so historical data is traceable
   * to the specific content version a learner completed.
   */
  contentVersion: string;
  title: string;
  type: LessonType;
  typeLabel: string;
  duration: string;
  summary: string;
  status: LessonStatus;
  /** Ordered content blocks rendered by LessonRunner */
  blocks: LessonBlock[];
  /** What a learner must do to unlock "Mark Complete" */
  completionRequirements: CompletionRequirement[];
  /** Optional link to a related lab / algorithm / experiment */
  labLink?: string;
  labLabel?: string;
}

export interface ModuleDef {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  status: ModuleStatus;
  badge?: string;
  lessons: LessonDef[];
}
