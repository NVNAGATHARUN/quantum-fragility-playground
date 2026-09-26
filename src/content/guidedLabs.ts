import type { CircuitIR, NormalizedSimulationResult } from "../types/quantum";

export interface LabStep {
  id: string;
  stepNumber: number;
  title: string;
  instruction: string;
  hint: string;
  targetExplanation: string;
  validate: (
    circuit: CircuitIR,
    simResult: NormalizedSimulationResult | null,
  ) => {
    pass: boolean;
    reason: string;
  };
}

export interface GuidedLabDefinition {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedTime: string;
  conceptCovered: string;
  initialCircuit: CircuitIR;
  steps: LabStep[];
}

export const GUIDED_LABS: Record<string, GuidedLabDefinition> = {
  superposition: {
    id: "superposition",
    title: "Superposition & interference",
    subtitle:
      "Create a 50/50 state, then discover why a second Hadamard gate brings the qubit back to zero.",
    category: "Quantum Fundamentals",
    difficulty: "Beginner",
    estimatedTime: "10 min",
    conceptCovered:
      "Hadamard Transform, Born Rule, Amplitudes vs Probabilities",
    initialCircuit: {
      version: "1.0",
      qubits: 1,
      classicalBits: 1,
      operations: [],
    },
    steps: [
      {
        id: "step-1",
        stepNumber: 1,
        title: "Create a 50/50 state",
        instruction:
          "Place a single Hadamard (H) gate on qubit q0 to prepare the |+⟩ state: (|0⟩ + |1⟩)/√2.",
        hint: "Select the H gate from the palette and click on Step 0 of wire q0.",
        targetExplanation:
          "Applying H creates equal amplitudes 1/√2 on both |0⟩ and |1⟩, resulting in 50% probability each.",
        validate: (circuit, simResult) => {
          const hasH = circuit.operations.some(
            (op) => op.gate === "H" && op.targets.includes(0),
          );
          if (!hasH) {
            return {
              pass: false,
              reason: "Qubit q0 needs a Hadamard (H) gate.",
            };
          }
          if (!simResult) {
            return {
              pass: false,
              reason: "Run the circuit to verify physical simulation output.",
            };
          }
          const p0 = simResult.probabilities["0"] ?? 0;
          const p1 = simResult.probabilities["1"] ?? 0;
          if (Math.abs(p0 - 0.5) < 0.08 && Math.abs(p1 - 0.5) < 0.08) {
            return {
              pass: true,
              reason:
                "Equal superposition state |+⟩ successfully verified (50% |0⟩, 50% |1⟩).",
            };
          }
          return {
            pass: false,
            reason: "Probabilities do not match 50/50 equal superposition.",
          };
        },
      },
      {
        id: "step-2",
        stepNumber: 2,
        title: "Bring the qubit back to zero",
        instruction:
          "Add a second Hadamard (H) gate immediately after the first on wire q0. Observe constructive and destructive interference returning the qubit to |0⟩.",
        hint: "Place another H gate at Step 1 on wire q0. Because H is self-inverse (H = H†), H·H = I.",
        targetExplanation:
          "The second Hadamard gate causes quantum interference: amplitudes for |1⟩ cancel destructively, while amplitudes for |0⟩ interfere constructively to 100%.",
        validate: (circuit, simResult) => {
          const hOps = circuit.operations.filter(
            (op) => op.gate === "H" && op.targets.includes(0),
          );
          if (hOps.length < 2) {
            return {
              pass: false,
              reason: "Place a second Hadamard (H) gate on wire q0.",
            };
          }
          if (!simResult) {
            return {
              pass: false,
              reason: "Run the circuit to verify interference.",
            };
          }
          const p0 = simResult.probabilities["0"] ?? 0;
          if (p0 > 0.95) {
            return {
              pass: true,
              reason:
                "Destructive interference confirmed: 100% deterministic outcome |0⟩.",
            };
          }
          return {
            pass: false,
            reason: "State did not return to |0⟩ with 100% certainty.",
          };
        },
      },
      {
        id: "step-3",
        stepNumber: 3,
        title: "Read the measurement",
        instruction:
          "Place a Measurement (M) gate at the end of the wire. Run the simulation with 1024 shots to observe classical register readout.",
        hint: "Select the M gate from the palette and place it on wire q0 after your operations.",
        targetExplanation:
          "Projective measurement collapses the quantum state vector into a definite classical eigenvalue in accordance with the Born rule.",
        validate: (circuit, simResult) => {
          const hasMeasure = circuit.operations.some(
            (op) => op.gate === "MEASURE" && op.targets.includes(0),
          );
          if (!hasMeasure) {
            return {
              pass: false,
              reason: "Place a Measurement (M) gate on wire q0.",
            };
          }
          if (!simResult || simResult.shots < 100) {
            return {
              pass: false,
              reason:
                "Execute simulation shots to record measurement outcomes.",
            };
          }
          return {
            pass: true,
            reason:
              "Projective measurement pipeline verified with shot statistics.",
          };
        },
      },
    ],
  },

  phase: {
    id: "phase",
    title: "Phase & Quantum Interference",
    subtitle:
      "Explore relative phase rotations (Z, S, T) on the Bloch equator and their interference effects.",
    category: "Quantum Dynamics",
    difficulty: "Intermediate",
    estimatedTime: "12 min",
    conceptCovered:
      "Relative Phase, Pauli-Z, S Gate, Phase Inversion, Mach-Zehnder Interferometry",
    initialCircuit: {
      version: "1.0",
      qubits: 1,
      classicalBits: 1,
      operations: [],
    },
    steps: [
      {
        id: "step-1",
        stepNumber: 1,
        title: "Prepare the |+⟩ state",
        instruction:
          "Apply an H gate on q0 to place the qubit on the Bloch sphere equator (+X axis).",
        hint: "Add an H gate at step 0 on qubit 0.",
        targetExplanation:
          "Hadamard rotates the ground state |0⟩ from +Z to the +X equator axis.",
        validate: (circuit, simResult) => {
          const hasH = circuit.operations.some(
            (op) => op.gate === "H" && op.targets.includes(0),
          );
          if (!hasH) return { pass: false, reason: "Place an H gate on q0." };
          if (!simResult)
            return { pass: false, reason: "Run circuit to verify |+⟩ state." };
          const p0 = simResult.probabilities["0"] ?? 0;
          return Math.abs(p0 - 0.5) < 0.1
            ? { pass: true, reason: "Statevector is on the Bloch equator |+⟩." }
            : {
                pass: false,
                reason: "Superposition probability not centered at 50%.",
              };
        },
      },
      {
        id: "step-2",
        stepNumber: 2,
        title: "Change phase, keep probabilities",
        instruction:
          "Add a Pauli-Z gate after the Hadamard gate. Notice that measurement probabilities do not change (still 50/50), but the statevector rotates by 180° to |-⟩ = (|0⟩ - |1⟩)/√2 on the -X axis.",
        hint: "Place a Z gate at step 1 on wire q0.",
        targetExplanation:
          "Phase shifts change the complex phase of |1⟩ without altering single-basis measurement probabilities until an interfering basis rotation is applied.",
        validate: (circuit, simResult) => {
          const ops = circuit.operations.filter((op) => op.targets.includes(0));
          const hasH = ops.some((op) => op.gate === "H");
          const hasZ = ops.some((op) => op.gate === "Z");
          if (!hasH || !hasZ) {
            return {
              pass: false,
              reason: "Place an H gate followed by a Z gate on q0.",
            };
          }
          if (!simResult)
            return {
              pass: false,
              reason: "Run circuit to verify phase rotation.",
            };
          const bloch = simResult.reducedStates?.[0]?.blochVector;
          if (bloch && bloch.x < -0.8) {
            return {
              pass: true,
              reason: "Bloch vector rotated to -X axis (|-⟩ state verified).",
            };
          }
          return {
            pass: false,
            reason: "Verify gate sequence H then Z on q0.",
          };
        },
      },
      {
        id: "step-3",
        stepNumber: 3,
        title: "Turn phase into an outcome",
        instruction:
          "Add a second Hadamard (H) gate after the Z gate. Observe that because of the negative relative phase, constructive interference now leads to 100% |1⟩ instead of |0⟩!",
        hint: "Sequence: H -> Z -> H. This is the simplest quantum phase discriminator.",
        targetExplanation:
          "H·Z·H = X! The π relative phase introduced by Z is mapped into a bit flip by the final Hadamard basis change.",
        validate: (circuit, simResult) => {
          const gates = circuit.operations
            .filter((op) => op.targets.includes(0))
            .sort((a, b) => a.step - b.step)
            .map((op) => op.gate);
          const isHZH =
            gates.length >= 3 &&
            gates[0] === "H" &&
            gates[1] === "Z" &&
            gates[2] === "H";
          if (!isHZH) {
            return {
              pass: false,
              reason: "Configure the sequence: H -> Z -> H on wire q0.",
            };
          }
          if (!simResult)
            return {
              pass: false,
              reason: "Run simulation to measure interference.",
            };
          const p1 = simResult.probabilities["1"] ?? 0;
          if (p1 > 0.95) {
            return {
              pass: true,
              reason:
                "Phase interference successfully mapped to state |1⟩ (100% certainty).",
            };
          }
          return { pass: false, reason: "Expected 100% outcome |1⟩." };
        },
      },
    ],
  },

  measurement: {
    id: "measurement",
    title: "Measurement & Wavefunction Collapse",
    subtitle:
      "Investigate projective measurement, quantum state collapse, and repeated non-destructive measurements.",
    category: "Quantum Foundations",
    difficulty: "Beginner",
    estimatedTime: "10 min",
    conceptCovered:
      "Born Rule, Projective Operators, Wavefunction Collapse, Density Matrix Diagonalization",
    initialCircuit: {
      version: "1.0",
      qubits: 1,
      classicalBits: 1,
      operations: [],
    },
    steps: [
      {
        id: "step-1",
        stepNumber: 1,
        title: "Prepare a superposition",
        instruction:
          "Place a Hadamard gate on q0 so the state before measurement is (|0⟩ + |1⟩)/√2.",
        hint: "Add an H gate at step 0.",
        targetExplanation:
          "Before measurement, the qubit exists in a coherent superposition with zero entropy.",
        validate: (circuit, simResult) => {
          const hasH = circuit.operations.some(
            (op) => op.gate === "H" && op.targets.includes(0),
          );
          if (!hasH) return { pass: false, reason: "Place an H gate on q0." };
          if (!simResult)
            return {
              pass: false,
              reason: "Simulate to confirm superposition.",
            };
          return {
            pass: true,
            reason: "Superposition prepared for measurement experiment.",
          };
        },
      },
      {
        id: "step-2",
        stepNumber: 2,
        title: "Measure in the Z basis",
        instruction:
          "Add a Measurement (M) gate right after the H gate. In quantum mechanics, measurement projects the continuous amplitude into a discrete eigenstate.",
        hint: "Select M from palette and place it at step 1.",
        targetExplanation:
          "Upon measurement, the off-diagonal coherence terms in the density matrix vanish (decoherence into a classical statistical mixture).",
        validate: (circuit, simResult) => {
          const hasM = circuit.operations.some(
            (op) => op.gate === "MEASURE" && op.targets.includes(0),
          );
          if (!hasM)
            return { pass: false, reason: "Add a Measurement (M) gate on q0." };
          if (!simResult)
            return {
              pass: false,
              reason: "Run simulation to inspect measurement projection.",
            };
          return { pass: true, reason: "Measurement projection verified." };
        },
      },
      {
        id: "step-3",
        stepNumber: 3,
        title: "Reset and flip the qubit",
        instruction:
          "Add a Reset (|0⟩) operation after measurement, followed by an X gate. Confirm that reset purges all entropy and returns the qubit deterministically to ground state |0⟩ before flipping to |1⟩.",
        hint: "Sequence: H -> M -> RESET -> X.",
        targetExplanation:
          "Active reset reinitializes any quantum state back to |0⟩ regardless of previous projective measurement outcomes.",
        validate: (circuit, simResult) => {
          const gates = circuit.operations
            .filter((op) => op.targets.includes(0))
            .sort((a, b) => a.step - b.step)
            .map((op) => op.gate);
          const hasReset = gates.includes("RESET");
          const hasX = gates.includes("X");
          if (!hasReset || !hasX) {
            return {
              pass: false,
              reason: "Place a RESET gate followed by an X gate.",
            };
          }
          if (!simResult)
            return {
              pass: false,
              reason:
                "Run simulation to verify deterministic post-reset state.",
            };
          const p1 = simResult.probabilities["1"] ?? 0;
          if (p1 > 0.95) {
            return {
              pass: true,
              reason:
                "Reset and deterministic inversion to |1⟩ verified (100% probability).",
            };
          }
          return {
            pass: false,
            reason: "Ensure RESET is applied before X gate.",
          };
        },
      },
    ],
  },

  "bell-state": {
    id: "bell-state",
    title: "Bell State & Quantum Entanglement",
    subtitle:
      "Synthesize the maximally entangled Einstein-Podolsky-Rosen (EPR) Bell state |Φ⁺⟩.",
    category: "Entanglement & Correlations",
    difficulty: "Intermediate",
    estimatedTime: "15 min",
    conceptCovered:
      "CNOT Gate, Maximally Entangled Pairs, Non-Separability, Bell Inequalities",
    initialCircuit: {
      version: "1.0",
      qubits: 2,
      classicalBits: 2,
      operations: [],
    },
    steps: [
      {
        id: "step-1",
        stepNumber: 1,
        title: "Prepare the control qubit",
        instruction:
          "Place a Hadamard (H) gate on qubit q0. Leave q1 in |0⟩. Reading the bit labels as q1q0, the state is (|00⟩ + |01⟩)/√2.",
        hint: "Place H on q0 at step 0. Notice this is still a separable product state.",
        targetExplanation:
          "The qubits are still independent: q0 is in |+⟩ and q1 is in |0⟩. In q1q0 order, the state is |0⟩ ⊗ |+⟩.",
        validate: (circuit, simResult) => {
          const hasH = circuit.operations.some(
            (op) => op.gate === "H" && op.targets.includes(0),
          );
          const hasCX = circuit.operations.some((op) => op.gate === "CX");
          if (!hasH)
            return { pass: false, reason: "Place an H gate on wire q0." };
          if (hasCX)
            return {
              pass: false,
              reason: "Do not add the CX gate yet for step 1.",
            };
          if (!simResult)
            return {
              pass: false,
              reason: "Run simulation to inspect the separable state.",
            };
          const p00 = simResult.probabilities["00"] ?? 0;
          const p01 = simResult.probabilities["01"] ?? 0;
          if (Math.abs(p00 - 0.5) < 0.1 && Math.abs(p01 - 0.5) < 0.1) {
            return {
              pass: true,
              reason:
                "Independent qubits: equal probability of |00⟩ and |01⟩ in q1q0 order.",
            };
          }
          return {
            pass: false,
            reason:
              "Expected equal probability of |00⟩ and |01⟩. Check that H acts on q0.",
          };
        },
      },
      {
        id: "step-2",
        stepNumber: 2,
        title: "Entangle the two qubits",
        instruction:
          "Add CX in the next column, with q0 as control and q1 as target. This prepares the Bell state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2.",
        hint: "Select CX from palette and click on wire q0 to control q1.",
        targetExplanation:
          "The CNOT conditionally flips q1 only when q0 is |1⟩. This creates non-separable entanglement: |01⟩ and |10⟩ amplitudes become strictly 0.",
        validate: (circuit, simResult) => {
          const hasCX = circuit.operations.some((op) => op.gate === "CX");
          if (!hasCX)
            return {
              pass: false,
              reason: "Add a CX gate connecting q0 and q1.",
            };
          if (!simResult)
            return {
              pass: false,
              reason: "Run simulation to verify entanglement.",
            };
          const p00 = simResult.probabilities["00"] ?? 0;
          const p11 = simResult.probabilities["11"] ?? 0;
          const p01 = simResult.probabilities["01"] ?? 0;
          const p10 = simResult.probabilities["10"] ?? 0;
          if (p00 > 0.4 && p11 > 0.4 && p01 < 0.05 && p10 < 0.05) {
            return {
              pass: true,
              reason:
                "Maximally entangled Bell state |Φ⁺⟩ synthesized (50% |00⟩, 50% |11⟩, 0% cross-terms).",
            };
          }
          return {
            pass: false,
            reason: "Circuit does not produce Bell state |Φ⁺⟩.",
          };
        },
      },
      {
        id: "step-3",
        stepNumber: 3,
        title: "Measure their correlations",
        instruction:
          "Add Measurement (M) gates on both q0 and q1. Verify that random 50/50 outcomes on q0 are 100% correlated with q1.",
        hint: "Place an M gate on wire q0 and another on wire q1.",
        targetExplanation:
          "Although individual measurement outcomes are fundamentally random, the joint correlation E(Z₀, Z₁) is +1: whenever q0 is measured 0, q1 is always 0; whenever q0 is 1, q1 is always 1.",
        validate: (circuit, simResult) => {
          const mQ0 = circuit.operations.some(
            (op) => op.gate === "MEASURE" && op.targets.includes(0),
          );
          const mQ1 = circuit.operations.some(
            (op) => op.gate === "MEASURE" && op.targets.includes(1),
          );
          if (!mQ0 || !mQ1) {
            return {
              pass: false,
              reason: "Place measurement gates on both q0 and q1.",
            };
          }
          if (!simResult)
            return {
              pass: false,
              reason: "Execute simulation shots to verify correlation.",
            };
          const p00 = simResult.probabilities["00"] ?? 0;
          const p11 = simResult.probabilities["11"] ?? 0;
          if (p00 > 0.4 && p11 > 0.4) {
            return {
              pass: true,
              reason:
                "Perfect EPR quantum correlation verified via projective measurement!",
            };
          }
          return {
            pass: false,
            reason: "Measurements did not confirm Bell correlation.",
          };
        },
      },
    ],
  },
};
