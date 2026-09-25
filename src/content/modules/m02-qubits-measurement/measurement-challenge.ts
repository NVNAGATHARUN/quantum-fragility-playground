import type { LessonDef } from '../../types';

export const measurementChallenge: LessonDef = {
  id: 'measurement-challenge',
  moduleId: 'm02-qubits-measurement',
  contentVersion: '1.0.0',
  title: 'Predict Measurement Probability',
  type: 'challenge',
  typeLabel: 'Challenge',
  duration: '10 min',
  summary: 'Calculate and verify outcome probabilities using the Born rule P(x) = |⟨x|ψ⟩|².',
  status: 'available',

  completionRequirements: [
    { type: 'checkpoint', id: 'cp-meas-01' },
    { type: 'checkpoint', id: 'cp-meas-02' },
  ],

  blocks: [
    {
      type: 'callout',
      variant: 'tip',
      title: 'Challenge lesson',
      content: 'This lesson poses problems to solve before revealing explanations. Work through each question before checking.',
    },
    {
      type: 'text',
      content: 'You have learned the Born rule. Now apply it to states built from combinations of gates. Calculate the probabilities before checking.',
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'Problem 1 — The |−⟩ State' },
    {
      type: 'text',
      content: 'Consider the state:',
    },
    {
      type: 'math',
      expression: '|{-}\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle - |1\\rangle)',
      display: true,
    },
    {
      type: 'reflection',
      id: 'ref-minus-01',
      prompt: 'Before answering: what is P(|0⟩) for this state?',
      hint: 'Apply the Born rule to the |0⟩ amplitude.',
    },

    {
      type: 'checkpoint',
      id: 'cp-meas-01',
      question: 'For the state |−⟩ = (1/√2)(|0⟩ − |1⟩), what is P(|0⟩)?',
      options: [
        { key: 'a', text: '0' },
        { key: 'b', text: '1/2 = 0.5' },
        { key: 'c', text: '1/√2 ≈ 0.707' },
        { key: 'd', text: '1' },
      ],
      correctKey: 'b',
      incorrectExplanations: {
        a: 'The amplitude for |0⟩ is 1/√2, not 0. P(|0⟩) = |1/√2|² = 1/2.',
        c: '1/√2 is the amplitude — you need to square it. |1/√2|² = 1/2.',
        d: 'P = 1 would mean the state is exactly |0⟩, but this state has equal amplitude in |0⟩ and |1⟩.',
      },
      correctExplanation: 'Correct. P(|0⟩) = |1/√2|² = 1/2. The minus sign between the two terms is a relative phase, not a change in probability. |−⟩ has the same computational basis statistics as |+⟩.',
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'Problem 2 — A Phase State' },
    {
      type: 'text',
      content: 'Now consider a state with a relative phase of π/2 (an imaginary phase):',
    },
    {
      type: 'math',
      expression: '|\\psi\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + i|1\\rangle)',
      display: true,
    },
    {
      type: 'callout',
      variant: 'note',
      content: 'i = e^(iπ/2) is a complex unit-magnitude phase factor. Its modulus |i| = 1.',
    },

    {
      type: 'checkpoint',
      id: 'cp-meas-02',
      question: 'For state |ψ⟩ = (1/√2)(|0⟩ + i|1⟩), what is P(|1⟩)?',
      options: [
        { key: 'a', text: '0' },
        { key: 'b', text: 'i/√2 (complex number)' },
        { key: 'c', text: '1/2 = 0.5' },
        { key: 'd', text: '−1/2' },
      ],
      correctKey: 'c',
      incorrectExplanations: {
        a: 'The amplitude for |1⟩ is i/√2, which is nonzero. P(|1⟩) = |i/√2|² = |i|²/2 = 1/2.',
        b: 'Probabilities must be real non-negative numbers. The amplitude i/√2 is complex, but |i/√2|² = 1/2 is real.',
        d: 'Probabilities cannot be negative. P = |amplitude|² is always ≥ 0. The imaginary i disappears when you take the modulus squared.',
      },
      correctExplanation: 'Correct. P(|1⟩) = |i/√2|² = |i|² × (1/√2)² = 1 × 1/2 = 1/2. Phase factors of unit modulus vanish when squaring, so this state has identical measurement statistics to |+⟩.',
    },

    { type: 'divider' },

    {
      type: 'callout',
      variant: 'insight',
      title: 'Key insight from both problems',
      content: 'The states |+⟩, |−⟩, and (1/√2)(|0⟩ + i|1⟩) all give P(|0⟩) = P(|1⟩) = 1/2 in the computational basis. They differ only in relative phase — which is invisible to computational basis measurement but becomes visible under interference (when a gate is applied before measuring).',
    },

    {
      type: 'experiment_link',
      label: 'Verify in Circuit Studio',
      description: 'Apply H to |0⟩ (giving |+⟩) then H again (interference). Observe how the relative phase you put in the middle circuit controls the output.',
      href: '/labs/studio',
    },
  ],
};
