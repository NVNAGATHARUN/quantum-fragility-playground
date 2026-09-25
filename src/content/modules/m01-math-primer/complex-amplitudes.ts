import type { LessonDef } from '../../types';

export const complexAmplitudes: LessonDef = {
  id: 'complex-amplitudes',
  moduleId: 'm01-math-primer',
  contentVersion: '1.0.0',
  title: 'Complex Numbers & Phase',
  type: 'visualize',
  typeLabel: 'Visualize',
  duration: '12 min',
  summary: 'Euler representation e^(iθ), modulus squared, and normalization on the complex plane.',
  status: 'available',

  completionRequirements: [
    { type: 'checkpoint', id: 'cp-complex-01' },
    { type: 'visual_interaction', id: 'complexPlane-01', optional: true },
  ],

  blocks: [
    {
      type: 'text',
      content: 'Quantum amplitudes are **complex numbers** — not because physicists enjoy abstraction, but because complex phases encode physically real interference. Two paths in an interferometer can cancel or reinforce each other depending on their phase relationship.',
    },
    { type: 'divider' },

    { type: 'heading', level: 2, content: 'A Complex Number' },
    {
      type: 'math',
      expression: 'z = a + ib \\qquad a, b \\in \\mathbb{R}',
      display: true,
    },
    {
      type: 'text',
      content: 'The **modulus** |z| is the distance from the origin on the complex plane, and the **argument** (phase) θ is the angle from the positive real axis.',
    },
    {
      type: 'math',
      expression: '|z| = \\sqrt{a^2 + b^2} \\qquad \\theta = \\arg(z)',
      display: true,
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: "Euler's Formula" },
    {
      type: 'text',
      content: 'Any complex number of unit modulus can be written in **polar form** using Euler\'s identity:',
    },
    {
      type: 'math',
      expression: 'e^{i\\theta} = \\cos\\theta + i\\sin\\theta',
      display: true,
      label: "Euler's identity",
    },
    {
      type: 'callout',
      variant: 'insight',
      title: 'Why unit modulus matters',
      content: 'Quantum states require |α|² + |β|² = 1. If we write β = |β|·e^(iφ), then e^(iφ) is a pure phase factor — it doesn\'t change the probability |β|², but it can cause interference when amplitudes are added.',
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'The Complex Plane' },
    {
      type: 'interactive_visual',
      id: 'complexPlane-01',
      visualKey: 'complexPlane',
      caption: 'A unit-circle view of quantum amplitudes. Each point on the unit circle is a valid phase e^(iθ).',
      interactionPrompt: 'Move a point around the unit circle. Watch how the real and imaginary components change.',
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'Global vs. Relative Phase' },
    {
      type: 'text',
      content: 'A **global phase** e^(iγ) applied to the entire state is **unobservable** — every measurement probability is unchanged.',
    },
    {
      type: 'math',
      expression: 'e^{i\\gamma}|\\psi\\rangle \\equiv |\\psi\\rangle \\quad (\\text{physically identical})',
      display: true,
    },
    {
      type: 'text',
      content: 'A **relative phase** between two amplitudes is physically meaningful. It affects interference.',
    },
    {
      type: 'math',
      expression: '|\\psi\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + e^{i\\phi}|1\\rangle)',
      display: true,
    },
    {
      type: 'callout',
      variant: 'definition',
      title: 'Relative Phase',
      content: 'The phase difference between two amplitudes in a superposition. It determines how those amplitudes interfere when a second gate is applied.',
    },

    { type: 'divider' },

    {
      type: 'checkpoint',
      id: 'cp-complex-01',
      question: 'A global phase e^(iγ) is applied to the entire quantum state |ψ⟩. What happens to measurement probabilities?',
      options: [
        { key: 'a', text: 'All probabilities rotate by the angle γ' },
        { key: 'b', text: 'All probabilities remain unchanged' },
        { key: 'c', text: 'The state becomes unnormalized' },
        { key: 'd', text: 'Only P(|0⟩) is affected, P(|1⟩) stays fixed' },
      ],
      correctKey: 'b',
      incorrectExplanations: {
        a: 'Probabilities are computed as |amplitude|². The modulus squares out the phase completely. Rotating by γ doesn\'t change |e^(iγ)α|² = |α|².',
        c: 'A global phase e^(iγ) has modulus 1. Multiplying a normalized state by a modulus-1 factor leaves it normalized.',
        d: 'The global phase multiplies both amplitudes equally, so both |α|² and |β|² are unchanged.',
      },
      correctExplanation: 'Correct. Measurement probabilities are |amplitude|², and |e^(iγ)·α|² = |α|² — the phase cancels exactly. Global phase is unobservable.',
    },
  ],
};
