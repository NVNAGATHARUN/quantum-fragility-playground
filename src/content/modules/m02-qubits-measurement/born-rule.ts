import type { LessonDef } from '../../types';

export const bornRule: LessonDef = {
  id: 'born-rule',
  moduleId: 'm02-qubits-measurement',
  contentVersion: '1.0.0',
  title: 'Measurement & the Born Rule',
  type: 'experiment',
  typeLabel: 'Experiment',
  duration: '15 min',
  summary: 'Execute projective measurements in the computational basis and observe probabilistic outcomes governed by the Born rule.',
  status: 'available',

  completionRequirements: [
    { type: 'checkpoint', id: 'cp-born-01' },
  ],

  blocks: [
    {
      type: 'text',
      content: 'Quantum measurement is not passive observation. When a qubit in superposition is measured in the computational basis, the measurement process produces one definite outcome — |0⟩ or |1⟩ — with probabilities determined by the Born rule. The post-measurement state is updated to match the outcome.',
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'The Born Rule' },
    {
      type: 'text',
      content: 'Given state |ψ⟩ = α|0⟩ + β|1⟩, the probability of each computational basis outcome is:',
    },
    {
      type: 'math',
      expression: 'P(|0\\rangle) = |\\langle 0|\\psi\\rangle|^2 = |\\alpha|^2',
      display: true,
      label: 'Born rule for |0⟩',
    },
    {
      type: 'math',
      expression: 'P(|1\\rangle) = |\\langle 1|\\psi\\rangle|^2 = |\\beta|^2',
      display: true,
      label: 'Born rule for |1⟩',
    },
    {
      type: 'callout',
      variant: 'definition',
      title: 'Born Rule',
      content: 'The probability of obtaining outcome m when measuring state |ψ⟩ in basis {|m⟩} is P(m) = |⟨m|ψ⟩|². This is a postulate of quantum mechanics — not derivable from more fundamental principles within standard quantum theory.',
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'Post-Measurement State' },
    {
      type: 'text',
      content: 'After a computational basis measurement with outcome m, the qubit state **updates** to the corresponding basis state:',
    },
    {
      type: 'math',
      expression: '|\\psi\\rangle \\xrightarrow{\\text{measure}} |m\\rangle \\quad \\text{with probability } P(m)',
      display: true,
    },
    {
      type: 'text',
      content: 'This is not a physical process happening instantaneously across space — it is a **state update rule**: given that outcome m was observed, the post-measurement state is |m⟩. The updated state correctly predicts the probability of all subsequent measurements.',
    },
    {
      type: 'callout',
      variant: 'note',
      title: 'Interpretation note',
      content: 'The state update after measurement is sometimes called "collapse." How to interpret this update — whether the state is a description of reality, information, or something else — is an open question in the foundations of physics. In this course we focus on the operational rules: how to compute probabilities and post-measurement states correctly.',
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'Repeating a Measurement' },
    {
      type: 'text',
      content: 'If you measure the same qubit again immediately after the first measurement, you always get the same result — because the state is now |m⟩:',
    },
    {
      type: 'math',
      expression: 'P(|0\\rangle) = |\\langle 0|0\\rangle|^2 = 1 \\quad (\\text{if first outcome was } |0\\rangle)',
      display: true,
    },
    {
      type: 'text',
      content: 'To see the original superposition statistics, you must **re-prepare** the state from scratch and measure again — many times. The Born-rule probabilities emerge from the **frequency distribution over many independent preparations**.',
    },

    { type: 'divider' },

    { type: 'heading', level: 2, content: 'Shot Noise & Statistical Fluctuation' },
    {
      type: 'text',
      content: 'In a real quantum device or simulator with N shots, the observed frequency of |0⟩ is:',
    },
    {
      type: 'math',
      expression: 'f(|0\\rangle) \\approx P(|0\\rangle) \\pm \\sqrt{\\frac{P(|0\\rangle)(1-P(|0\\rangle))}{N}}',
      display: true,
    },
    {
      type: 'text',
      content: 'With 1024 shots, the typical statistical uncertainty is about ±3%. With 100,000 shots, it drops to ~±0.3%. Simulators use exact statevectors internally but convert to shot counts to model realistic quantum hardware output.',
    },

    { type: 'divider' },

    {
      type: 'prediction',
      id: 'pred-born-01',
      prompt: 'You prepare |ψ⟩ = (√3/2)|0⟩ + (1/2)|1⟩ and run 1000 measurement shots. How many shots do you expect to produce |0⟩?',
      options: [
        { key: 'a', text: '~500' },
        { key: 'b', text: '~707' },
        { key: 'c', text: '~750' },
        { key: 'd', text: '~866' },
      ],
      reflection: 'P(|0⟩) = |√3/2|² = 3/4 = 0.75. So 0.75 × 1000 = 750 expected shots. The amplitude √3/2 ≈ 0.866, but probability requires squaring it.',
    },

    { type: 'divider' },

    {
      type: 'checkpoint',
      id: 'cp-born-01',
      question: 'A qubit is in state |ψ⟩ = (√3/2)|0⟩ + (1/2)|1⟩. What is P(|1⟩)?',
      options: [
        { key: 'a', text: '1/2' },
        { key: 'b', text: '√3/2 ≈ 0.866' },
        { key: 'c', text: '1/4 = 0.25' },
        { key: 'd', text: '3/4 = 0.75' },
      ],
      correctKey: 'c',
      incorrectExplanations: {
        a: '1/2 is the amplitude for |1⟩ but not the probability. Probability requires squaring the modulus: |1/2|² = 1/4.',
        b: '√3/2 is the amplitude for |0⟩, not |1⟩. And probability requires squaring: |√3/2|² = 3/4 is P(|0⟩).',
        d: '3/4 is P(|0⟩) = |√3/2|². For P(|1⟩) you need |1/2|² = 1/4. Note: 3/4 + 1/4 = 1 ✓',
      },
      correctExplanation: 'Correct. P(|1⟩) = |β|² = |1/2|² = 1/4. And P(|0⟩) = |√3/2|² = 3/4. They sum to 1, confirming normalization.',
    },

    { type: 'divider' },

    {
      type: 'experiment_link',
      label: 'Run in the Circuit Studio',
      description: 'Build an Ry(π/3) gate on |0⟩ in the Circuit Studio and run 1024 shots. Compare the histogram to the Born-rule prediction.',
      href: '/labs/studio',
    },
  ],
};
