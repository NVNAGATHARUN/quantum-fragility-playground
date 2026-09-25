import type { LessonDef } from '../../types';

export const diracNotation: LessonDef = {
  id: 'dirac-notation',
  moduleId: 'm01-math-primer',
  contentVersion: '1.0.0',
  title: 'Dirac Bra-Ket Notation',
  type: 'learn',
  typeLabel: 'Concept',
  duration: '10 min',
  summary: 'State vectors, dual vectors, and probability amplitudes in Dirac notation.',
  status: 'available',

  completionRequirements: [
    { type: 'checkpoint', id: 'cp-dirac-01' },
  ],

  blocks: [
    {
      type: 'text',
      content: 'When Paul Dirac formalized quantum mechanics in the 1930s, he invented a notation that cleanly separates two objects that always appear together: a **state vector** and its **dual**. Before this, physicists wrote the same idea in inconsistent ways across different representations.',
    },
    { type: 'divider' },

    { type: 'heading', level: 2, content: 'The Ket |ψ⟩' },
    {
      type: 'text',
      content: 'A quantum state is written as a **ket**, denoted |ψ⟩. It lives in a complex vector space called a Hilbert space. For a single qubit, this space is ℂ², meaning a two-dimensional complex vector space.',
    },
    {
      type: 'math',
      expression: '|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle',
      display: true,
      label: 'General single-qubit state',
    },
    {
      type: 'text',
      content: 'Here α and β are **complex numbers** called probability amplitudes. The basis states |0⟩ and |1⟩ are orthonormal vectors — the quantum analog of "off" and "on."',
    },
    {
      type: 'callout',
      variant: 'definition',
      title: 'Ket',
      content: 'A ket |ψ⟩ is a column vector in a complex Hilbert space. It fully specifies the quantum state of a system.',
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'The Bra ⟨ψ|' },
    {
      type: 'text',
      content: 'The **bra** ⟨ψ| is the conjugate transpose (†) of the ket. If |ψ⟩ is a column vector, ⟨ψ| is the corresponding row vector with all complex entries conjugated.',
    },
    {
      type: 'math',
      expression: '\\langle\\psi| = (|\\psi\\rangle)^\\dagger = \\alpha^*\\langle 0| + \\beta^*\\langle 1|',
      display: true,
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'Inner Products & Orthogonality' },
    {
      type: 'text',
      content: 'The **inner product** ⟨φ|ψ⟩ (bra-ket) is a complex number. For the two basis states, it is zero — they are orthogonal:',
    },
    {
      type: 'math',
      expression: '\\langle 0|1\\rangle = 0 \\qquad \\langle 0|0\\rangle = 1 \\qquad \\langle 1|1\\rangle = 1',
      display: true,
    },
    {
      type: 'callout',
      variant: 'insight',
      title: 'Why this matters',
      content: 'Orthogonality means |0⟩ and |1⟩ carry no shared information. A measurement that finds |0⟩ gives zero probability to |1⟩ — they are mutually exclusive outcomes.',
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'The Normalization Condition' },
    {
      type: 'text',
      content: 'Quantum states must be **normalized** — probabilities must sum to exactly 1. Algebraically:',
    },
    {
      type: 'math',
      expression: '\\langle\\psi|\\psi\\rangle = |\\alpha|^2 + |\\beta|^2 = 1',
      display: true,
    },
    {
      type: 'text',
      content: 'This constraint limits which vectors are physically meaningful quantum states. The state (1, 1) is not valid. The state (1/√2, 1/√2) is.',
    },

    { type: 'divider' },

    {
      type: 'checkpoint',
      id: 'cp-dirac-01',
      question: 'Which expression correctly represents the normalization condition for a single-qubit state |ψ⟩ = α|0⟩ + β|1⟩?',
      options: [
        { key: 'a', text: 'α + β = 1' },
        { key: 'b', text: '|α|² + |β|² = 1' },
        { key: 'c', text: 'α² + β² = 0' },
        { key: 'd', text: '⟨ψ|ψ⟩ = 0' },
      ],
      correctKey: 'b',
      incorrectExplanations: {
        a: 'α and β are complex numbers. Adding them directly mixes real and imaginary parts and doesn\'t correspond to a probability. You need the modulus squared of each amplitude.',
        c: 'α² + β² = 0 would mean both amplitudes are imaginary and cancel — this would describe no meaningful state.',
        d: '⟨ψ|ψ⟩ = 0 means the state has zero length, which is physically meaningless. Normalization requires ⟨ψ|ψ⟩ = 1.',
      },
      correctExplanation: 'Correct. |α|² is the probability of measuring |0⟩ and |β|² is the probability of measuring |1⟩. These must sum to 1 for probabilities to make sense.',
    },

    { type: 'divider' },

    {
      type: 'experiment_link',
      label: 'Try it in the Qubit Lab',
      description: 'See how different amplitude values for α and β translate into measurement probabilities in a real simulation.',
      href: '/labs/studio',
    },
  ],
};
