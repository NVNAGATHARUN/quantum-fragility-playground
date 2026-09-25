import type { LessonDef } from '../../types';

export const reversibility: LessonDef = {
  id: 'reversibility',
  moduleId: 'm03-quantum-gates',
  contentVersion: '1.0.0',
  title: 'Unitarity & Reversibility',
  type: 'learn',
  typeLabel: 'Concept',
  duration: '12 min',
  summary: 'Why all quantum operations are unitary, preserve probability, and can be inverted without information loss.',
  status: 'available',

  completionRequirements: [
    { type: 'checkpoint', id: 'cp-reversibility-01' },
    { type: 'visual_interaction', id: 'vis-reversibility-statevector' },
  ],

  blocks: [
    {
      type: 'text',
      content: 'In classical computing, gates like AND and OR are fundamentally irreversible: given an output of 0 from an AND gate, you cannot reconstruct whether the inputs were (0,0), (0,1), or (1,0). Information is erased, dissipating heat according to **Landauer’s Principle** (kT ln 2 per bit erased). In contrast, all quantum gates (prior to measurement) are strictly **reversible**.',
    },
    { type: 'divider' },

    { type: 'heading', level: 2, content: 'The Unitarity Condition' },
    {
      type: 'text',
      content: 'Mathematically, a linear operator U acting on a Hilbert space is **unitary** if its adjoint (conjugate transpose) equals its inverse:',
    },
    {
      type: 'math',
      expression: 'U^\\dagger U = U U^\\dagger = I',
      display: true,
      label: 'Definition of Unitary operator',
    },
    {
      type: 'text',
      content: 'Unitarity guarantees two foundational physical principles:',
    },
    {
      type: 'callout',
      variant: 'definition',
      title: '1. Preservation of Total Probability',
      content: 'For any state |ψ⟩ with norm ⟨ψ|ψ⟩ = 1, the transformed state U|ψ⟩ has norm ⟨ψ|U†U|ψ⟩ = ⟨ψ|I|ψ⟩ = 1. Total probability is always conserved at exactly 100%.',
    },
    {
      type: 'callout',
      variant: 'definition',
      title: '2. Preservation of Quantum Information',
      content: 'For any two states |ψ⟩ and |φ⟩, their overlap is invariant: ⟨Uφ|Uψ⟩ = ⟨φ|ψ⟩. Distinguishable states remain distinguishable. No quantum information can ever be destroyed by unitary evolution.',
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'Inverting Quantum Circuits' },
    {
      type: 'text',
      content: 'To undo any sequence of quantum gates, you reverse the order of the gates and take the adjoint of each:',
    },
    {
      type: 'math',
      expression: '(U_n U_{n-1} \\cdots U_1)^\\dagger = U_1^\\dagger \\cdots U_{n-1}^\\dagger U_n^\\dagger',
      display: true,
      label: 'Circuit adjoint reversal',
    },
    {
      type: 'text',
      content: 'Because many standard quantum gates are self-inverse (X† = X, Z† = Z, H† = H), inverting a circuit often simply requires applying the exact same gates in reverse order.',
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'Interactive State Vector Transformation' },
    {
      type: 'interactive_visual',
      id: 'vis-reversibility-statevector',
      visualKey: 'stateVector',
      caption: 'The complex statevector amplitudes evolving under unitary transformations.',
      interactionPrompt: 'Observe the magnitude of amplitudes before and after transformations, verifying that the sum of squared magnitudes remains strictly 1.',
    },

    { type: 'divider' },

    {
      type: 'checkpoint',
      id: 'cp-reversibility-01',
      question: 'Suppose a circuit applies gate sequence U = H X. What is the inverse sequence U⁻¹ needed to return the qubit to its initial state?',
      options: [
        { key: 'a', text: 'H X' },
        { key: 'b', text: 'X H' },
        { key: 'c', text: 'H Z' },
        { key: 'd', text: 'Z H' },
      ],
      correctKey: 'b',
      incorrectExplanations: {
        a: 'The order must be reversed! (AB)⁻¹ = B⁻¹ A⁻¹, not A⁻¹ B⁻¹.',
        c: 'X is its own inverse (X† = X), so you need X, not Z.',
        d: 'The inverse of X is X itself, not Z.',
      },
      correctExplanation: 'Correct! According to matrix algebra, (AB)⁻¹ = B⁻¹ A⁻¹. For U = HX, the inverse is U⁻¹ = (HX)⁻¹ = X⁻¹ H⁻¹. Since X and H are self-inverse (X⁻¹ = X and H⁻¹ = H), the inverse circuit is simply X followed by H.',
    },
  ],
};
