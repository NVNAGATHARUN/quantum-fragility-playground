import type { ConflictLabScenario } from './quantum'

export const CANONICAL_CONFLICT_LABS: Record<string, ConflictLabScenario> = {
  'lab-m01-interference': {
    labId: 'lab-m01-interference',
    misconceptionId: 'M01',
    title: 'The Phase Interference Lab',
    subtitle: 'Testing whether superposition is merely classical 50/50 randomness',
    commonAssumption: 'Students believe applying two Hadamards (H → H) is like flipping a coin twice, expecting 50% |0⟩ and 50% |1⟩.',
    steps: [
      {
        stepIndex: 1,
        title: 'Test A: Two Hadamards (H → H)',
        instruction: 'Run circuit |0⟩ → H → H → Measure.',
        circuit: {
          version: '1.0',
          qubits: 1,
          classicalBits: 1,
          operations: [
            { id: 'g-1', gate: 'H', targets: [0], controls: [], step: 0 },
            { id: 'g-2', gate: 'H', targets: [0], controls: [], step: 1 },
            { id: 'g-3', gate: 'MEASURE', targets: [0], controls: [], step: 2 },
          ],
        },
        expectedOutcome: '100% |0⟩ (0% |1⟩)',
        pedagogicalTakeaway: 'Hadamard is its own inverse (H² = I). Constructive interference restores |0⟩ with 100% certainty, disproving the coin-flip model.',
      },
      {
        stepIndex: 2,
        title: 'Test B: The Phase Inverter (H → Z → H)',
        instruction: 'Insert a Pauli-Z phase gate between Hadamards: |0⟩ → H → Z → H → Measure.',
        circuit: {
          version: '1.0',
          qubits: 1,
          classicalBits: 1,
          operations: [
            { id: 'g-1', gate: 'H', targets: [0], controls: [], step: 0 },
            { id: 'g-2', gate: 'Z', targets: [0], controls: [], step: 1 },
            { id: 'g-3', gate: 'H', targets: [0], controls: [], step: 2 },
            { id: 'g-4', gate: 'MEASURE', targets: [0], controls: [], step: 3 },
          ],
        },
        expectedOutcome: '100% |1⟩ (0% |0⟩)',
        pedagogicalTakeaway: 'Pauli-Z only flips the relative phase of |1⟩. If it were a classical coin toss, changing phase would do nothing. Here, phase shift turns constructive interference into destructive interference!',
      },
    ],
    verificationChallenge: 'Predict the outcome of |0⟩ → X → H → Z → H. Relative phase dictates the final interference direction.',
    challengeCircuit: {
      version: '1.0',
      qubits: 1,
      classicalBits: 1,
      operations: [
        { id: 'c-1', gate: 'X', targets: [0], controls: [], step: 0 },
        { id: 'c-2', gate: 'H', targets: [0], controls: [], step: 1 },
        { id: 'c-3', gate: 'Z', targets: [0], controls: [], step: 2 },
        { id: 'c-4', gate: 'H', targets: [0], controls: [], step: 3 },
        { id: 'c-5', gate: 'MEASURE', targets: [0], controls: [], step: 4 },
      ],
    },
    challengeExpectedProbabilities: { '0': 1.0, '1': 0.0 },
  },
  'lab-m02-no-signaling': {
    labId: 'lab-m02-no-signaling',
    misconceptionId: 'M02',
    title: 'The No-Signaling Proof Lab',
    subtitle: 'Testing whether Alice’s measurement transmits an instant message to Bob',
    commonAssumption: 'Students believe Alice measuring her half of a Bell pair instantly communicates a readable bit to Bob faster than light.',
    steps: [
      {
        stepIndex: 1,
        title: 'Scenario 1: Alice Measures Before Bob',
        instruction: 'Generate Bell pair (|00⟩+|11⟩)/√2. Alice measures q0 first, then Bob measures q1.',
        circuit: {
          version: '1.0',
          qubits: 2,
          classicalBits: 2,
          operations: [
            { id: 'g-1', gate: 'H', targets: [0], controls: [], step: 0 },
            { id: 'g-2', gate: 'CX', targets: [1], controls: [0], step: 1 },
            { id: 'g-3', gate: 'MEASURE', targets: [0], controls: [], step: 2 },
            { id: 'g-4', gate: 'MEASURE', targets: [1], controls: [], step: 3 },
          ],
        },
        expectedOutcome: 'Bob observes: 50% 0, 50% 1',
        pedagogicalTakeaway: "Bob's local measurement distribution is completely random. He sees 50/50 noise.",
      },
      {
        stepIndex: 2,
        title: 'Scenario 2: Alice Does NOT Measure',
        instruction: 'Generate Bell pair. Bob measures q1, but Alice does NOT measure q0.',
        circuit: {
          version: '1.0',
          qubits: 2,
          classicalBits: 2,
          operations: [
            { id: 'g-1', gate: 'H', targets: [0], controls: [], step: 0 },
            { id: 'g-2', gate: 'CX', targets: [1], controls: [0], step: 1 },
            { id: 'g-3', gate: 'MEASURE', targets: [1], controls: [], step: 2 },
          ],
        },
        expectedOutcome: 'Bob observes: 50% 0, 50% 1',
        pedagogicalTakeaway: "Bob's statistics are identical in both cases. Bob cannot determine whether Alice measured or not. Information cannot travel faster than light!",
      },
    ],
    verificationChallenge: 'If Alice applies a Z gate to her qubit before measuring, does Bob’s local probability change without classical communication?',
    challengeCircuit: {
      version: '1.0',
      qubits: 2,
      classicalBits: 2,
      operations: [
        { id: 'c-1', gate: 'H', targets: [0], controls: [], step: 0 },
        { id: 'c-2', gate: 'CX', targets: [1], controls: [0], step: 1 },
        { id: 'c-3', gate: 'Z', targets: [0], controls: [], step: 2 },
        { id: 'c-4', gate: 'MEASURE', targets: [1], controls: [], step: 3 },
      ],
    },
    challengeExpectedProbabilities: { '0': 0.5, '1': 0.5 },
  },
  'lab-m03-mixture': {
    labId: 'lab-m03-mixture',
    misconceptionId: 'M03',
    title: 'Coherent Superposition vs Classical Mixture',
    subtitle: 'Can any physical measurement distinguish |+⟩ from an unpolarized 50/50 mixture?',
    commonAssumption: 'Students believe that since measuring in Z-basis gives 50/50 for both, they are physically identical.',
    steps: [
      {
        stepIndex: 1,
        title: 'Measurement in Z-Basis (Standard)',
        instruction: 'Measure pure state |+⟩ = H|0⟩ in standard Z-basis.',
        circuit: {
          version: '1.0',
          qubits: 1,
          classicalBits: 1,
          operations: [
            { id: 'g-1', gate: 'H', targets: [0], controls: [], step: 0 },
            { id: 'g-2', gate: 'MEASURE', targets: [0], controls: [], step: 1 },
          ],
        },
        expectedOutcome: '50% |0⟩, 50% |1⟩',
        pedagogicalTakeaway: 'In the Z-basis, both pure |+⟩ and an unpolarized statistical mixture yield 50% 0 and 50% 1.',
      },
      {
        stepIndex: 2,
        title: 'Measurement in X-Basis (Rotated Basis)',
        instruction: 'Apply Hadamard before measurement to rotate basis into X: |0⟩ → H → H → Measure.',
        circuit: {
          version: '1.0',
          qubits: 1,
          classicalBits: 1,
          operations: [
            { id: 'g-1', gate: 'H', targets: [0], controls: [], step: 0 },
            { id: 'g-2', gate: 'H', targets: [0], controls: [], step: 1 },
            { id: 'g-3', gate: 'MEASURE', targets: [0], controls: [], step: 2 },
          ],
        },
        expectedOutcome: 'Pure |+⟩ → 100% |0⟩; Mixture → 50% |0⟩, 50% |1⟩',
        pedagogicalTakeaway: 'Pure superposition carries phase coherence (off-diagonal density matrix elements ρ_01 = 0.5), allowing interference when rotated. A statistical mixture carries zero coherence.',
      },
    ],
    verificationChallenge: 'Predict outcome of rotating |−⟩ = X·H|0⟩ into the X-basis using another H gate: |0⟩ → X → H → H → Measure.',
    challengeCircuit: {
      version: '1.0',
      qubits: 1,
      classicalBits: 1,
      operations: [
        { id: 'c-1', gate: 'X', targets: [0], controls: [], step: 0 },
        { id: 'c-2', gate: 'H', targets: [0], controls: [], step: 1 },
        { id: 'c-3', gate: 'H', targets: [0], controls: [], step: 2 },
        { id: 'c-4', gate: 'MEASURE', targets: [0], controls: [], step: 3 },
      ],
    },
    challengeExpectedProbabilities: { '0': 0.0, '1': 1.0 },
  },
  'lab-m04-chsh': {
    labId: 'lab-m04-chsh',
    misconceptionId: 'M04',
    title: 'Bell Inequality: Measurement is Not Passive',
    subtitle: 'Testing whether quantum measurement merely reveals hidden pre-existing values',
    commonAssumption:
      'Students believe quantum randomness is just classical ignorance — that particles "already knew" their values before measurement (local hidden variable theory).',
    steps: [
      {
        stepIndex: 1,
        title: 'Step 1: Generate a Bell State',
        instruction: 'Produce the maximally entangled Bell state |Φ+⟩ = (|00⟩+|11⟩)/√2 using H + CX.',
        circuit: {
          version: '1.0',
          qubits: 2,
          classicalBits: 2,
          operations: [
            { id: 'g-1', gate: 'H', targets: [0], controls: [], step: 0 },
            { id: 'g-2', gate: 'CX', targets: [1], controls: [0], step: 1 },
            { id: 'g-3', gate: 'MEASURE', targets: [0], controls: [], step: 2 },
            { id: 'g-4', gate: 'MEASURE', targets: [1], controls: [], step: 3 },
          ],
        },
        expectedOutcome: '50% |00⟩, 50% |11⟩ — perfectly correlated',
        pedagogicalTakeaway:
          'Perfect correlation |00⟩/|11⟩ is consistent with local hidden variables. The critical test is whether correlations at multiple measurement angles exceed the CHSH bound S > 2.',
      },
      {
        stepIndex: 2,
        title: 'Step 2: Rotate Alice\'s Basis (Apply H Before Measure)',
        instruction:
          'Apply H on q0 before measuring both — this rotates Alice\'s measurement to the X-basis.',
        circuit: {
          version: '1.0',
          qubits: 2,
          classicalBits: 2,
          operations: [
            { id: 'g-1', gate: 'H', targets: [0], controls: [], step: 0 },
            { id: 'g-2', gate: 'CX', targets: [1], controls: [0], step: 1 },
            { id: 'g-3', gate: 'H', targets: [0], controls: [], step: 2 },
            { id: 'g-4', gate: 'MEASURE', targets: [0], controls: [], step: 3 },
            { id: 'g-5', gate: 'MEASURE', targets: [1], controls: [], step: 4 },
          ],
        },
        expectedOutcome: '50% |00⟩, 50% |01⟩, 50% |10⟩, 50% |11⟩ — uncorrelated in mixed basis',
        pedagogicalTakeaway:
          'When Alice rotates her basis, the joint correlations shift. The CHSH quantity S = |E(a,b) − E(a,b\') + E(a\',b) + E(a\',b\')| ≈ 2.828 > 2, which is impossible for any local hidden variable theory — proving that measurement is not merely revealing pre-existing values.',
      },
    ],
    verificationChallenge:
      'A local hidden variable model can produce max CHSH S = 2. Quantum mechanics achieves S ≈ 2√2 ≈ 2.828. Predict: what happens if you rotate BOTH qubits by 45° (apply H to both) before measuring the Bell state?',
    challengeCircuit: {
      version: '1.0',
      qubits: 2,
      classicalBits: 2,
      operations: [
        { id: 'c-1', gate: 'H', targets: [0], controls: [], step: 0 },
        { id: 'c-2', gate: 'CX', targets: [1], controls: [0], step: 1 },
        { id: 'c-3', gate: 'H', targets: [0], controls: [], step: 2 },
        { id: 'c-4', gate: 'H', targets: [1], controls: [], step: 3 },
        { id: 'c-5', gate: 'MEASURE', targets: [0], controls: [], step: 4 },
        { id: 'c-6', gate: 'MEASURE', targets: [1], controls: [], step: 5 },
      ],
    },
    challengeExpectedProbabilities: { '00': 0.5, '11': 0.5 },
  },
  'lab-m05-cnot': {
    labId: 'lab-m05-cnot',
    misconceptionId: 'M05',
    title: 'CNOT Does Not Always Entangle',
    subtitle: 'Testing whether CNOT automatically creates entanglement on any input',
    commonAssumption:
      'Students believe that applying a CNOT gate always produces an entangled (non-separable) quantum state from any input.',
    steps: [
      {
        stepIndex: 1,
        title: 'CNOT on Computational Basis State |10⟩',
        instruction: 'Apply X to q0 (prepare |1⟩), then apply CX. Both qubits are in computational basis — no superposition.',
        circuit: {
          version: '1.0',
          qubits: 2,
          classicalBits: 2,
          operations: [
            { id: 'g-1', gate: 'X', targets: [0], controls: [], step: 0 },
            { id: 'g-2', gate: 'CX', targets: [1], controls: [0], step: 1 },
            { id: 'g-3', gate: 'MEASURE', targets: [0], controls: [], step: 2 },
            { id: 'g-4', gate: 'MEASURE', targets: [1], controls: [], step: 3 },
          ],
        },
        expectedOutcome: '100% |11⟩ — deterministic, separable product state',
        pedagogicalTakeaway:
          'CX on |10⟩ yields |11⟩ with 100% certainty — this is a separable product state |1⟩⊗|1⟩. No entanglement is created. CNOT merely classically correlates the bits. Entanglement requires superposition in the control qubit.',
      },
      {
        stepIndex: 2,
        title: 'CNOT on Superposed Control: The Bell State',
        instruction: 'Apply H first to create superposition on q0, then apply CX. The control qubit is now in superposition.',
        circuit: {
          version: '1.0',
          qubits: 2,
          classicalBits: 2,
          operations: [
            { id: 'g-1', gate: 'H', targets: [0], controls: [], step: 0 },
            { id: 'g-2', gate: 'CX', targets: [1], controls: [0], step: 1 },
            { id: 'g-3', gate: 'MEASURE', targets: [0], controls: [], step: 2 },
            { id: 'g-4', gate: 'MEASURE', targets: [1], controls: [], step: 3 },
          ],
        },
        expectedOutcome: '50% |00⟩, 50% |11⟩ — maximally entangled Bell state',
        pedagogicalTakeaway:
          'When the control is in superposition H|0⟩ = (|0⟩+|1⟩)/√2, CNOT creates the Bell state (|00⟩+|11⟩)/√2 — a maximally entangled state that cannot be written as a product state. The key ingredient is superposition, not the CNOT gate alone.',
      },
    ],
    verificationChallenge:
      'Predict the entanglement outcome of: |0⟩ → X → H → CX(control) ⊗ |0⟩. Hint: what is the control qubit state before CX?',
    challengeCircuit: {
      version: '1.0',
      qubits: 2,
      classicalBits: 2,
      operations: [
        { id: 'c-1', gate: 'X', targets: [0], controls: [], step: 0 },
        { id: 'c-2', gate: 'H', targets: [0], controls: [], step: 1 },
        { id: 'c-3', gate: 'CX', targets: [1], controls: [0], step: 2 },
        { id: 'c-4', gate: 'MEASURE', targets: [0], controls: [], step: 3 },
        { id: 'c-5', gate: 'MEASURE', targets: [1], controls: [], step: 4 },
      ],
    },
    challengeExpectedProbabilities: { '00': 0.5, '11': 0.5 },
  },
}
