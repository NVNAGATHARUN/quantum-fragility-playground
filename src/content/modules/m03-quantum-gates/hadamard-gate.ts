import type { LessonDef } from '../../types';

export const hadamardGate: LessonDef = {
  id: 'hadamard-gate',
  moduleId: 'm03-quantum-gates',
  contentVersion: '1.0.0',
  title: 'The Hadamard Gate & Superposition',
  type: 'learn',
  typeLabel: 'Concept',
  duration: '15 min',
  summary: 'The primary gateway to quantum superposition, basis changes, and quantum interference.',
  status: 'available',

  completionRequirements: [
    { type: 'checkpoint', id: 'cp-hadamard-01' },
    { type: 'visual_interaction', id: 'vis-hadamard-matrix' },
  ],

  blocks: [
    {
      type: 'text',
      content: 'If the Pauli-X gate is the quantum NOT, the **Hadamard gate (H)** is the engine of quantum advantage. The Hadamard gate creates an equal-amplitude, coherent superposition from a deterministic computational basis state. Almost every quantum algorithm—from Grover search to Shor algorithm—begins with a layer of Hadamard gates.',
    },
    { type: 'divider' },

    { type: 'heading', level: 2, content: 'Matrix Definition & Action' },
    {
      type: 'text',
      content: 'The Hadamard gate is represented by the 2×2 unitary matrix:',
    },
    {
      type: 'math',
      expression: 'H = \\frac{1}{\\sqrt{2}}\\begin{pmatrix} 1 & 1 \\\\ 1 & -1 \\end{pmatrix}',
      display: true,
      label: 'Hadamard matrix',
    },
    {
      type: 'text',
      content: 'When applied to the standard basis states |0⟩ and |1⟩:',
    },
    {
      type: 'math',
      expression: 'H|0\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}} = |{+}\\rangle, \\qquad H|1\\rangle = \\frac{|0\\rangle - |1\\rangle}{\\sqrt{2}} = |{-}\\rangle',
      display: true,
      label: 'Creation of superposition states',
    },
    {
      type: 'callout',
      variant: 'note',
      title: 'Sign matters for interference',
      content: 'Notice the critical negative sign in H|1⟩ = |−⟩. Both |+⟩ and |−⟩ have identical measurement probabilities (50% |0⟩, 50% |1⟩ in the computational basis), but their relative phases differ by 180° (π radians). This phase difference is what drives quantum interference.',
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'The Self-Inverse Property: H² = I' },
    {
      type: 'text',
      content: 'Like the Pauli matrices, the Hadamard matrix is both **Hermitian** (H† = H) and **Unitary** (H†H = I). This implies:',
    },
    {
      type: 'math',
      expression: 'H^2 = H \\cdot H = I',
      display: true,
    },
    {
      type: 'text',
      content: 'Applying H a second time does not double the randomness; instead, it completely reverses the superposition through constructive and destructive interference:',
    },
    {
      type: 'math',
      expression: 'H|{+}\\rangle = H\\left(\\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}\\right) = \\frac{|{+}\\rangle + |{-}\\rangle}{\\sqrt{2}} = |0\\rangle',
      display: true,
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'Interactive Basis Transformation' },
    {
      type: 'interactive_visual',
      id: 'vis-hadamard-matrix',
      visualKey: 'basisComparison',
      caption: 'Compare the Computational Z-Basis (|0⟩, |1⟩) with the Hadamard X-Basis (|+⟩, |−⟩).',
      interactionPrompt: 'Toggle between Z basis and X basis to view the change in projection and coordinates.',
    },

    { type: 'divider' },

    {
      type: 'checkpoint',
      id: 'cp-hadamard-01',
      question: 'What is the outcome of applying a Hadamard gate to the state |−⟩ = (|0⟩ - |1⟩)/√2?',
      options: [
        { key: 'a', text: '|0⟩' },
        { key: 'b', text: '|1⟩' },
        { key: 'c', text: '|+⟩' },
        { key: 'd', text: '50% |0⟩, 50% |1⟩ with zero interference' },
      ],
      correctKey: 'b',
      incorrectExplanations: {
        a: 'H|+⟩ = |0⟩, while H|−⟩ = |1⟩ due to constructive interference on the |1⟩ component.',
        c: 'Applying H to |−⟩ returns a computational basis state, not the |+⟩ superposition.',
        d: 'Quantum mechanics preserves unitarity: H is deterministic on statevectors. H|−⟩ results deterministically in |1⟩.',
      },
      correctExplanation: 'Correct! H|−⟩ = H(|0⟩ - |1⟩)/√2 = (|+⟩ - |−⟩)/√2 = |1⟩. The amplitudes for |0⟩ destructively cancel (1/2 - 1/2 = 0), while amplitudes for |1⟩ constructively add (1/2 + 1/2 = 1).',
    },
  ],
};
