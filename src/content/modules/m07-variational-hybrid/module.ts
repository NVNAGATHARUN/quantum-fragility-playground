import type { ModuleDef } from '../../types';
import { coreLesson } from '../coreLessonFactory';

const moduleId = 'm07-variational-hybrid';

export const m07VariationalHybrid: ModuleDef = {
  id: 'm07-variational-hybrid',
  number: '07',
  title: 'Variational & Hybrid Algorithms',
  subtitle: 'NISQ-era quantum computing: VQE and QAOA',
  description:
    'Understand modern hybrid classical-quantum algorithms designed for noisy, intermediate-scale hardware. Explore parameterized ansatz circuits, classical optimization loops, and combinatorial graph problems.',
  status: 'available',
  lessons: [
    coreLesson({
      id: 'vqe', moduleId, title: 'VQE: Energy as an Optimization Objective',
      summary: 'Connect a parameterized quantum state, Pauli measurements, and a classical optimizer.',
      type: 'experiment',
      concept: 'The Variational Quantum Eigensolver prepares a parameterized trial state and minimizes its measured Hamiltonian expectation value. The variational principle makes the measured energy an upper bound on the ground-state energy for a normalized ansatz. This platform uses a labelled two-qubit educational H₂ model rather than claiming ab-initio chemistry.',
      equation: 'E(\\theta)=\\langle\\psi(\\theta)|H|\\psi(\\theta)\\rangle \\ge E_0',
      equationLabel: 'Variational energy bound',
      misconception: 'VQE does not obtain an exact molecular energy merely because the optimizer converges; the ansatz, Hamiltonian model, sampling, and optimizer can all limit accuracy.',
      prediction: 'If the ansatz cannot represent the ground state, can additional optimizer steps push the energy below the exact ground-state energy?',
      question: 'What does the quantum processor contribute to the VQE loop?',
      options: [
        { key: 'a', text: 'It chooses the optimizer step' },
        { key: 'b', text: 'It estimates Hamiltonian expectation values' },
        { key: 'c', text: 'It proves global convergence' },
        { key: 'd', text: 'It computes nuclear geometry classically' },
      ],
      correctKey: 'b',
      correctExplanation: 'The quantum circuit prepares the trial state and supplies measured expectation values; the classical optimizer updates the parameters.',
      labLink: '/explore/algorithms/vqe', labLabel: 'Open the VQE energy lab',
      reflection: 'Which limitation in the lab comes from the ansatz, and which comes from finite-shot estimation?',
    }),
    coreLesson({
      id: 'qaoa', moduleId, title: 'QAOA: Cost, Mixer, and Approximation',
      summary: 'Interpret the alternating cost and mixer operators used for a Max-Cut instance.',
      type: 'experiment',
      concept: 'QAOA alternates a problem Hamiltonian that writes objective-dependent phase with a mixer that redistributes amplitude. A classical loop searches angles that increase the expected cut value. At shallow depth it is an approximation method, not a guarantee of the optimal bit string.',
      equation: '|\\gamma,\\beta\\rangle=\\prod_{k=1}^{p}e^{-i\\beta_k H_M}e^{-i\\gamma_k H_C}|+\\rangle^{\\otimes n}',
      equationLabel: 'QAOA alternating-operator state',
      misconception: 'The most frequent sampled string is not automatically a proof of optimality, especially with shallow depth or finite shots.',
      prediction: 'What happens if the cost operator adds phases but no mixer follows it?',
      question: 'Why is the mixer operator needed?',
      options: [
        { key: 'a', text: 'To measure every edge directly' },
        { key: 'b', text: 'To convert cost-dependent phase into changed amplitudes' },
        { key: 'c', text: 'To remove all entanglement' },
        { key: 'd', text: 'To guarantee the maximum cut' },
      ],
      correctKey: 'b',
      correctExplanation: 'Interference created by the mixer turns phase differences from the cost unitary into a biased sampling distribution.',
      labLink: '/explore/algorithms/qaoa', labLabel: 'Explore the QAOA landscape',
      reflection: 'How would increasing circuit depth change expressivity, noise exposure, and optimization difficulty?',
    }),
  ],
};
