import type { LessonDef } from '../../types';

export const pauliGates: LessonDef = {
  id: 'pauli-gates',
  moduleId: 'm03-quantum-gates',
  contentVersion: '1.0.0',
  title: 'The Pauli Gates (X, Y, Z)',
  type: 'learn',
  typeLabel: 'Concept',
  duration: '12 min',
  summary: 'Single-qubit bit flip, phase flip, and combined operations represented as Hermitian unitaries.',
  status: 'available',

  completionRequirements: [
    { type: 'checkpoint', id: 'cp-pauli-01' },
    { type: 'visual_interaction', id: 'vis-pauli-matrix' },
  ],

  blocks: [
    {
      type: 'text',
      content: 'In classical computing, the only non-trivial single-bit gate is the **NOT** gate. In quantum computing, there are infinitely many single-qubit gates, but the three most foundational are the **Pauli matrices**: **X**, **Y**, and **Z**. Named after Wolfgang Pauli, these matrices form an algebraic basis for all 2×2 Hermitian operators.',
    },
    { type: 'divider' },

    { type: 'heading', level: 2, content: 'Pauli-X: The Quantum NOT Gate' },
    {
      type: 'text',
      content: 'The **Pauli-X** gate performs a bit-flip operation, exchanging the computational basis states |0⟩ and |1⟩:',
    },
    {
      type: 'math',
      expression: 'X = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}, \\quad X|0\\rangle = |1\\rangle, \\quad X|1\\rangle = |0\\rangle',
      display: true,
      label: 'Pauli-X matrix and action',
    },
    {
      type: 'text',
      content: 'Geometrically on the Bloch sphere, the X gate represents a **180° (π radians) rotation around the X-axis**. It swaps the north pole (|0⟩) and the south pole (|1⟩).',
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'Pauli-Z: The Phase Flip Gate' },
    {
      type: 'text',
      content: 'The **Pauli-Z** gate leaves |0⟩ unchanged but applies a -1 phase factor to |1⟩. While it produces no observable change on pure basis states measured in the Z basis, it profoundly transforms superpositions:',
    },
    {
      type: 'math',
      expression: 'Z = \\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}, \\quad Z|0\\rangle = |0\\rangle, \\quad Z|1\\rangle = -|1\\rangle',
      display: true,
      label: 'Pauli-Z matrix and action',
    },
    {
      type: 'text',
      content: 'For example, acting on the equal superposition |+⟩ = (|0⟩ + |1⟩)/√2 yields |−⟩ = (|0⟩ - |1⟩)/√2. On the Bloch sphere, Z is a **180° rotation around the Z-axis**.',
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'Pauli-Y: Bit + Phase Flip' },
    {
      type: 'text',
      content: 'The **Pauli-Y** gate combines both a bit-flip and a relative phase shift, incorporating the imaginary unit *i*:',
    },
    {
      type: 'math',
      expression: 'Y = \\begin{pmatrix} 0 & -i \\\\ i & 0 \\end{pmatrix}, \\quad Y|0\\rangle = i|1\\rangle, \\quad Y|1\\rangle = -i|0\\rangle',
      display: true,
      label: 'Pauli-Y matrix and action',
    },
    {
      type: 'callout',
      variant: 'insight',
      title: 'Hermitian and Unitary',
      content: 'All three Pauli matrices are both **Hermitian** (X† = X) and **Unitary** (X†X = I). Consequently, each Pauli gate is its own inverse: X² = Y² = Z² = I. Applying any Pauli gate twice returns the qubit to its exact original state.',
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'Interactive Matrix & State Transformation' },
    {
      type: 'interactive_visual',
      id: 'vis-pauli-matrix',
      visualKey: 'unitaryMatrix',
      caption: 'Switch between Pauli-X, Y, Z, and Hadamard to inspect their matrix representations and output vectors.',
      interactionPrompt: 'Click on gate buttons (X, Y, Z) and toggle the input state (|0⟩ or |1⟩) to see the state transformation.',
    },

    { type: 'divider' },

    {
      type: 'checkpoint',
      id: 'cp-pauli-01',
      question: 'What is the state of a qubit initialized to |0⟩ after applying the sequence of gates Z then X (i.e. X Z |0⟩)?',
      options: [
        { key: 'a', text: '|0⟩' },
        { key: 'b', text: '|1⟩' },
        { key: 'c', text: '-|1⟩' },
        { key: 'd', text: '-|0⟩' },
      ],
      correctKey: 'b',
      incorrectExplanations: {
        a: 'Remember: Z acts first. Z|0⟩ = |0⟩. Then X acts on |0⟩: X|0⟩ = |1⟩, not |0⟩.',
        c: 'Z|0⟩ = +|0⟩ (no phase change for |0⟩). Then X|0⟩ = +|1⟩, not -|1⟩.',
        d: 'Z|0⟩ = |0⟩ and X flips it to |1⟩, not -|0⟩.',
      },
      correctExplanation: 'Correct! First, Z|0⟩ = |0⟩ because the Pauli-Z gate leaves |0⟩ unchanged. Next, X acts on |0⟩ to produce |1⟩. Therefore, X Z |0⟩ = |1⟩.',
    },
  ],
};
