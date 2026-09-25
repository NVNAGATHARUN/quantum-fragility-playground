import type { LessonDef } from '../../types';

export const statevectorBloch: LessonDef = {
  id: 'statevector-bloch',
  moduleId: 'm02-qubits-measurement',
  contentVersion: '1.0.0',
  title: 'The Bloch Sphere Instrument',
  type: 'visualize',
  typeLabel: 'Visualize',
  duration: '12 min',
  summary: 'Geometric representation of statevectors with polar and azimuthal angles (θ, φ).',
  status: 'available',

  completionRequirements: [
    { type: 'visual_interaction', id: 'blochSphere-lesson', optional: false },
    { type: 'checkpoint', id: 'cp-bloch-01' },
  ],

  blocks: [
    {
      type: 'text',
      content: 'The Bloch sphere is not a visual metaphor — it is a precise geometric representation of a qubit\'s state. Every pure single-qubit state corresponds to exactly one point on the surface of a unit sphere. Mixed states (with decoherence) map to points **inside** the sphere.',
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'Parameterization' },
    {
      type: 'text',
      content: 'Two angles fully determine any pure qubit state:',
    },
    {
      type: 'math',
      expression: '|\\psi\\rangle = \\cos\\frac{\\theta}{2}\\,|0\\rangle + e^{i\\phi}\\sin\\frac{\\theta}{2}\\,|1\\rangle',
      display: true,
    },
    {
      type: 'text',
      content: '**θ (theta)** is the polar angle from the north pole (|0⟩). It controls the balance between |0⟩ and |1⟩ amplitudes. **φ (phi)** is the azimuthal angle around the Z axis. It is the relative phase between the two amplitudes.',
    },
    {
      type: 'math',
      expression: '\\theta = 0 \\Rightarrow |\\psi\\rangle = |0\\rangle \\quad (\\text{north pole})',
      display: true,
    },
    {
      type: 'math',
      expression: '\\theta = \\pi \\Rightarrow |\\psi\\rangle = |1\\rangle \\quad (\\text{south pole})',
      display: true,
    },
    {
      type: 'math',
      expression: '\\theta = \\frac{\\pi}{2}, \\phi = 0 \\Rightarrow |\\psi\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle) = |{+}\\rangle \\quad (\\text{equator})',
      display: true,
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'Bloch Vector' },
    {
      type: 'text',
      content: 'The Bloch vector is a 3D vector (x, y, z) derived from the statevector. For a pure state with polar angle θ and azimuthal angle φ:',
    },
    {
      type: 'math',
      expression: '\\vec{r} = \\begin{pmatrix} \\sin\\theta\\cos\\phi \\\\ \\sin\\theta\\sin\\phi \\\\ \\cos\\theta \\end{pmatrix}',
      display: true,
    },
    {
      type: 'text',
      content: 'For a **pure state**, |r| = 1 (surface of sphere). Decoherence causes the vector to shrink toward the center: |r| < 1 indicates a **mixed state**.',
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'Explore the Bloch Sphere' },
    {
      type: 'prediction',
      id: 'pred-bloch-01',
      prompt: 'Move the state vector toward the equator of the Bloch sphere. What do you expect to happen to the measurement probabilities P(|0⟩) and P(|1⟩)?',
      options: [
        { key: 'a', text: 'P(|0⟩) increases, P(|1⟩) decreases' },
        { key: 'b', text: 'They approach equality — both near 0.5' },
        { key: 'c', text: 'P(|0⟩) stays fixed, only P(|1⟩) changes' },
        { key: 'd', text: 'Both go to zero' },
      ],
      reflection: 'θ = π/2 on the equator means equal cos²(π/4) = sin²(π/4) = 1/2 — exactly balanced probability. φ changes the phase without affecting the balance.',
    },
    {
      type: 'interactive_visual',
      id: 'blochSphere-lesson',
      visualKey: 'blochSphere',
      caption: 'Bloch sphere. θ controls the north-south position; φ controls the rotation around the Z axis.',
      interactionPrompt: 'Drag the state vector. Notice how θ shifts the probability balance between |0⟩ and |1⟩, while φ changes the relative phase.',
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'What θ Controls' },
    {
      type: 'text',
      content: 'Measurement probability in the computational basis depends only on θ:',
    },
    {
      type: 'math',
      expression: 'P(|0\\rangle) = \\cos^2\\frac{\\theta}{2} \\qquad P(|1\\rangle) = \\sin^2\\frac{\\theta}{2}',
      display: true,
    },
    {
      type: 'callout',
      variant: 'insight',
      title: 'What φ controls',
      content: 'The azimuthal angle φ does not affect P(|0⟩) or P(|1⟩) in the computational basis. It controls the relative phase between the two amplitudes, which only becomes visible when a second gate is applied before measurement (interference).',
    },

    { type: 'divider' },

    {
      type: 'checkpoint',
      id: 'cp-bloch-01',
      question: 'A qubit is at the south pole of the Bloch sphere (θ = π, the |1⟩ state). What is the probability of measuring |0⟩?',
      options: [
        { key: 'a', text: '0' },
        { key: 'b', text: '1/2' },
        { key: 'c', text: '1' },
        { key: 'd', text: 'Depends on φ' },
      ],
      correctKey: 'a',
      incorrectExplanations: {
        b: 'P(|0⟩) = cos²(θ/2) = cos²(π/2) = 0. At the south pole, all amplitude is in |1⟩. The equal-split 1/2 probability is at the equator (θ = π/2).',
        c: 'P(|0⟩) = 1 only at the north pole (θ = 0). At the south pole θ = π, so P(|0⟩) = cos²(π/2) = 0 and P(|1⟩) = sin²(π/2) = 1.',
        d: 'φ (azimuthal angle) does not affect computational basis measurement probabilities. Only θ (polar angle) determines P(|0⟩) and P(|1⟩).',
      },
      correctExplanation: 'Correct. At the south pole θ = π: P(|0⟩) = cos²(π/2) = 0. The state is exactly |1⟩, so any measurement gives |1⟩ with certainty.',
    },

    { type: 'divider' },

    {
      type: 'experiment_link',
      label: 'Open in Circuit Studio',
      description: 'Apply different single-qubit gates to |0⟩ in the Circuit Studio and watch the Bloch vector move on the live state inspector.',
      href: '/labs/studio',
    },
  ],
};
