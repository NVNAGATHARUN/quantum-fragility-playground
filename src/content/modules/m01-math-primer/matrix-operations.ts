import type { LessonDef } from '../../types';

export const matrixOperations: LessonDef = {
  id: 'matrix-operations',
  moduleId: 'm01-math-primer',
  contentVersion: '1.0.0',
  title: 'Unitary Matrices & Inner Products',
  type: 'challenge',
  typeLabel: 'Challenge',
  duration: '15 min',
  summary: 'Verify inner product orthogonality ⟨0|1⟩ = 0 and length preservation under unitary action.',
  status: 'available',

  completionRequirements: [
    { type: 'checkpoint', id: 'cp-unitary-01' },
  ],

  blocks: [
    {
      type: 'text',
      content: 'Quantum gates are represented as **unitary matrices**. Unitary means the matrix preserves the norm of every state vector it acts on — physically, it preserves total probability.',
    },
    { type: 'divider' },

    { type: 'heading', level: 2, content: 'Unitary Definition' },
    {
      type: 'math',
      expression: 'U^\\dagger U = U U^\\dagger = I',
      display: true,
      label: 'Unitary condition',
    },
    {
      type: 'text',
      content: 'U† is the **conjugate transpose** (Hermitian adjoint) of U. If U is an n×n matrix, U† is formed by transposing and conjugating every entry.',
    },
    {
      type: 'callout',
      variant: 'definition',
      title: 'Unitary Matrix',
      content: 'A square complex matrix U where U†U = I. Its columns form an orthonormal basis. Its rows also form an orthonormal basis. Determinant has modulus 1.',
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'Example: The Pauli-X Gate' },
    {
      type: 'text',
      content: 'The Pauli-X gate (quantum bit-flip) is:',
    },
    {
      type: 'math',
      expression: 'X = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}',
      display: true,
    },
    {
      type: 'text',
      content: 'Verify that X is unitary: since X is real and symmetric, X† = X, and:',
    },
    {
      type: 'math',
      expression: 'X^\\dagger X = X^2 = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}\\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix} = \\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix} = I',
      display: true,
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'Norm Preservation' },
    {
      type: 'text',
      content: 'A unitary gate U applied to a normalized state |ψ⟩ produces another normalized state:',
    },
    {
      type: 'math',
      expression: '\\langle\\psi|U^\\dagger U|\\psi\\rangle = \\langle\\psi|\\psi\\rangle = 1',
      display: true,
    },
    {
      type: 'callout',
      variant: 'insight',
      title: 'Why unitarity matters',
      content: 'If quantum gates weren\'t unitary, probabilities could sum to more or less than 1 after applying a gate — physically meaningless. Unitarity is not a convention; it\'s a physical necessity.',
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'Orthogonality of Basis States' },
    {
      type: 'text',
      content: 'The computational basis states |0⟩ = (1, 0) and |1⟩ = (0, 1) are orthonormal:',
    },
    {
      type: 'math',
      expression: '\\langle 0|1\\rangle = \\begin{pmatrix} 1 & 0 \\end{pmatrix}\\begin{pmatrix} 0 \\\\ 1 \\end{pmatrix} = 0',
      display: true,
    },
    {
      type: 'math',
      expression: '\\langle 0|0\\rangle = 1 \\qquad \\langle 1|1\\rangle = 1',
      display: true,
    },

    { type: 'divider' },

    {
      type: 'checkpoint',
      id: 'cp-unitary-01',
      question: 'The Hadamard gate H is defined as H = (1/√2)[[1,1],[1,−1]]. Which property confirms it is unitary?',
      options: [
        { key: 'a', text: 'Its entries are all real numbers' },
        { key: 'b', text: 'H†H = I (conjugate transpose times itself equals identity)' },
        { key: 'c', text: 'Its determinant is zero' },
        { key: 'd', text: 'Applying H twice gives the zero matrix' },
      ],
      correctKey: 'b',
      incorrectExplanations: {
        a: 'Real entries are not sufficient. There exist real matrices that are not unitary. Unitarity requires UU† = I, which is a structural property not just about entry types.',
        c: 'If det(H) = 0, H is singular and has no inverse. Unitary matrices must be invertible and have |det| = 1.',
        d: 'H applied twice to a state gives back the original state (H² = I), not the zero matrix. The zero matrix has no quantum mechanical meaning as a gate.',
      },
      correctExplanation: 'Correct. The defining property of a unitary matrix is U†U = I. For H, you can verify: H†H = (1/√2)[[1,1],[1,−1]] · (1/√2)[[1,1],[1,−1]] = I.',
    },

    { type: 'divider' },

    {
      type: 'experiment_link',
      label: 'Apply H in the Circuit Studio',
      description: 'Load the Hadamard gate in the Circuit Studio and run a simulation to see its action on |0⟩ producing the |+⟩ state.',
      href: '/labs/studio',
    },
  ],
};
