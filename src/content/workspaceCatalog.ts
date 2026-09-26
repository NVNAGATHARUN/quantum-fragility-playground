export interface WorkspaceResource {
  title: string;
  description: string;
  question: string;
  takeaway: string;
  to: string;
  category: string;
  level: string;
  duration?: string;
  art: number;
}
export const LAB_RESOURCES: WorkspaceResource[] = [
  {
    title: "Superposition",
    description:
      "Apply a Hadamard gate, then compare your prediction with measured outcomes.",
    question: "Can one qubit give two possible results?",
    takeaway: "See how a single gate changes measurement probabilities.",
    to: "/labs/guided/superposition",
    category: "Guided labs",
    level: "Beginner",
    duration: "10 min",
    art: 1,
  },
  {
    title: "Phase & interference",
    description:
      "Change phase and observe how a later gate turns it into a measurable difference.",
    question: "Why can two paths cancel?",
    takeaway: "Connect hidden phase to visible interference.",
    to: "/labs/guided/phase",
    category: "Guided labs",
    level: "Beginner",
    duration: "10 min",
    art: 2,
  },
  {
    title: "Measurement & collapse",
    description:
      "Predict an outcome, measure a qubit, and compare before and after states.",
    question: "What changes when you measure?",
    takeaway: "Distinguish a probability from a single observed result.",
    to: "/labs/guided/measurement",
    category: "Guided labs",
    level: "Beginner",
    duration: "10 min",
    art: 0,
  },
  {
    title: "Bell states & entanglement",
    description:
      "Prepare two connected qubits and compare their measurement results.",
    question: "How can two outcomes be correlated?",
    takeaway: "Recognize a Bell pair and its joint outcomes.",
    to: "/labs/guided/bell-state",
    category: "Guided labs",
    level: "Intermediate",
    duration: "15 min",
    art: 2,
  },
  {
    title: "Quantum fragility",
    description:
      "Explore how relaxation, dephasing, and noise change a quantum state.",
    question: "What does noise do to a qubit?",
    takeaway: "Compare ideal and noisy state behavior.",
    to: "/labs/fragility",
    category: "Open experiments",
    level: "Intermediate",
    art: 1,
  },
  {
    title: "Challenge your intuition",
    description:
      "Predict an outcome, test it, and investigate the surprising difference.",
    question: "Does your intuition match the result?",
    takeaway: "Explain a prediction that did not hold up.",
    to: "/labs/conflict",
    category: "Open experiments",
    level: "Beginner",
    art: 3,
  },
  {
    title: "Stern–Gerlach experiment",
    description:
      "Explore spin measurements and the consequences of changing a basis.",
    question: "How does the measurement axis matter?",
    takeaway: "Observe spin results across different axes.",
    to: "/experiments/stern-gerlach",
    category: "Physics",
    level: "Intermediate",
    art: 0,
  },
  {
    title: "Cavity QED",
    description:
      "Investigate how light and matter interact inside a quantum cavity.",
    question: "How do light and matter exchange energy?",
    takeaway: "Inspect the dynamics of a cavity model.",
    to: "/experiments/cavity-qed",
    category: "Physics",
    level: "Advanced",
    art: 3,
  },
];
export const ALGORITHM_RESOURCES: WorkspaceResource[] = [
  {
    title: "Bell state preparation",
    description:
      "Follow Hadamard and CNOT, then test the Bell pair in different bases.",
    question: "Which outcomes move together?",
    takeaway: "Connect the circuit to entangled measurement results.",
    to: "/explore/algorithms/bell-state",
    category: "Foundations",
    level: "Beginner",
    art: 1,
  },
  {
    title: "Deutsch–Jozsa",
    description:
      "Compare a classical query strategy with one quantum oracle call.",
    question: "Is the hidden function constant or balanced?",
    takeaway: "Trace how interference reveals the answer.",
    to: "/explore/algorithms/deutsch-jozsa",
    category: "Foundations",
    level: "Beginner",
    art: 0,
  },
  {
    title: "Grover’s search",
    description:
      "Mark a target and watch its probability change across search rounds.",
    question: "How does a marked answer become likely?",
    takeaway: "See oracle and diffusion steps amplify the target.",
    to: "/explore/algorithms/grover",
    category: "Search & transforms",
    level: "Intermediate",
    art: 2,
  },
  {
    title: "Quantum Fourier transform",
    description: "Discover the connection between quantum phase and frequency.",
    question: "Where does the phase pattern go?",
    takeaway: "Inspect the transform's output phases and amplitudes.",
    to: "/explore/algorithms/qft",
    category: "Search & transforms",
    level: "Intermediate",
    art: 1,
  },
  {
    title: "Quantum teleportation",
    description:
      "Step through Bell measurement, two classical bits, and Bob's correction.",
    question: "How is a state reconstructed elsewhere?",
    takeaway: "Identify each required resource and correction.",
    to: "/explore/algorithms/teleportation",
    category: "Communication",
    level: "Intermediate",
    art: 3,
  },
  {
    title: "BB84 key distribution",
    description:
      "Choose bases, compare sifted bits, and observe an eavesdropping signal.",
    question: "How can Alice and Bob detect interference?",
    takeaway: "Relate basis choices to sifted key errors.",
    to: "/explore/algorithms/qkd",
    category: "Communication",
    level: "Intermediate",
    art: 0,
  },
  {
    title: "Quantum networks",
    description:
      "Explore entanglement swapping and the role of quantum repeaters.",
    question: "Can distant nodes share entanglement?",
    takeaway: "Follow swapping through intermediate nodes.",
    to: "/explore/algorithms/network",
    category: "Communication",
    level: "Advanced",
    art: 2,
  },
  {
    title: "Variational eigensolver",
    description:
      "Adjust a circuit and inspect how the estimated energy changes.",
    question: "How do we search for a low-energy state?",
    takeaway: "See the quantum-classical optimization loop.",
    to: "/explore/algorithms/vqe",
    category: "Hybrid algorithms",
    level: "Advanced",
    art: 3,
  },
  {
    title: "QAOA",
    description:
      "Tune a hybrid circuit and compare candidate Max-Cut outcomes.",
    question: "Which parameter choice improves a cut?",
    takeaway: "Relate cost and mixer steps to measured solutions.",
    to: "/explore/algorithms/qaoa",
    category: "Hybrid algorithms",
    level: "Advanced",
    art: 1,
  },
];
