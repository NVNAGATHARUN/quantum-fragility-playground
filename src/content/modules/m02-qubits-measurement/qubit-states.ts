import type { LessonDef } from '../../types';

export const qubitStates: LessonDef = {
  id: 'qubit-states',
  moduleId: 'm02-qubits-measurement',
  contentVersion: '1.0.0',
  title: 'Quantum States vs Classical Bits',
  type: 'learn',
  typeLabel: 'Concept',
  duration: '10 min',
  summary: 'Statevectors, superposition of basis states, and the continuity of quantum state space.',
  status: 'available',

  completionRequirements: [
    { type: 'checkpoint', id: 'cp-qubit-01' },
  ],

  blocks: [
    {
      type: 'text',
      content: 'A classical bit has exactly two states: 0 or 1. A **qubit** lives in a continuous space of states — any point on a unit sphere (the Bloch sphere) is a valid quantum state. This is not just "being both 0 and 1 simultaneously." It is something structurally different.',
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'The Statevector' },
    {
      type: 'text',
      content: 'A qubit state is represented as a **statevector** — a normalized vector in the two-dimensional complex Hilbert space ℂ²:',
    },
    {
      type: 'math',
      expression: '|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle, \\quad \\alpha, \\beta \\in \\mathbb{C}, \\quad |\\alpha|^2 + |\\beta|^2 = 1',
      display: true,
    },
    {
      type: 'text',
      content: 'The computational basis states in matrix form are:',
    },
    {
      type: 'math',
      expression: '|0\\rangle = \\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix} \\qquad |1\\rangle = \\begin{pmatrix} 0 \\\\ 1 \\end{pmatrix}',
      display: true,
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'Superposition' },
    {
      type: 'text',
      content: 'When α ≠ 0 and β ≠ 0, the state is in **superposition** — it has nonzero amplitude for both basis outcomes. The equal-weight superposition has a specific name:',
    },
    {
      type: 'math',
      expression: '|{+}\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle) \\qquad |{-}\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle - |1\\rangle)',
      display: true,
    },
    {
      type: 'callout',
      variant: 'note',
      title: 'Superposition is not ambiguity',
      content: 'A qubit in |+⟩ is not "secretly" 0 or 1 but unknown. Its state genuinely lacks a definite value in the computational basis. Measurement forces a definite outcome, but the state before measurement is genuinely indeterminate — not merely uncertain.',
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'State Space is Continuous' },
    {
      type: 'text',
      content: 'The full state space of a single qubit is parameterized by two real angles:',
    },
    {
      type: 'math',
      expression: '|\\psi\\rangle = \\cos\\frac{\\theta}{2}|0\\rangle + e^{i\\phi}\\sin\\frac{\\theta}{2}|1\\rangle, \\quad \\theta \\in [0, \\pi], \\; \\phi \\in [0, 2\\pi)',
      display: true,
    },
    {
      type: 'text',
      content: 'Every point on the surface of a unit sphere — the **Bloch sphere** — corresponds to exactly one pure qubit state. A classical bit has only two points; a qubit has infinitely many.',
    },
    {
      type: 'interactive_visual',
      id: 'blochSphere-01',
      visualKey: 'blochSphere',
      caption: 'The Bloch sphere. The north pole is |0⟩, the south pole is |1⟩, the equator holds all equal-weight superpositions.',
      interactionPrompt: 'Click any point on the sphere to see the statevector and measurement probabilities update.',
    },

    { type: 'divider' },

    {
      type: 'checkpoint',
      id: 'cp-qubit-01',
      question: 'The state |ψ⟩ = (1/√2)|0⟩ + (1/√2)|1⟩ is measured in the computational basis. What is the probability of measuring |1⟩?',
      options: [
        { key: 'a', text: '0' },
        { key: 'b', text: '1/√2 ≈ 0.707' },
        { key: 'c', text: '1/2 = 0.5' },
        { key: 'd', text: '1' },
      ],
      correctKey: 'c',
      incorrectExplanations: {
        a: 'P(|1⟩) = |β|² = |1/√2|² = 1/2 ≠ 0. The amplitude for |1⟩ is nonzero, so the probability is nonzero.',
        b: '1/√2 is the amplitude, not the probability. Probability is the amplitude squared: |1/√2|² = 1/2.',
        d: 'If P(|1⟩) = 1, the state would be |1⟩ exactly. But this state also has amplitude for |0⟩, so P(|0⟩) + P(|1⟩) = 1 requires P(|1⟩) = 1/2.',
      },
      correctExplanation: 'Correct. P(|1⟩) = |β|² = |1/√2|² = 1/2. The Born rule gives probabilities from squared moduli of amplitudes.',
    },
  ],
};
