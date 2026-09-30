import {
  ClassroomItem,
  EnrolledStudent,
  ClassroomMisconceptionsResponse,
  ClassroomLearningGains,
  ClassroomAssignment,
} from '../api/classrooms';

export const DEMO_CLASSROOM: ClassroomItem = {
  id: 'demo-iitb-qc101',
  name: 'IIT Bombay · QC101: Quantum Algorithms & Hardware Systems',
  code: 'SIH261',
  instructor_id: 'inst-dr-sharma',
  created_at: new Date(Date.now() - 21 * 86400000).toISOString(),
  student_count: 28,
};

const STUDENT_NAMES = [
  'Aarav Sharma',
  'Diya Patel',
  'Rohan Iyer',
  'Ananya Verma',
  'Vikram Malhotra',
  'Priya Nair',
  'Kabir Sen',
  'Neha Gupta',
  'Siddharth Rao',
  'Ishita Mukherjee',
  'Arjun Reddy',
  'Kavya Menon',
  'Aditya Deshmukh',
  'Meera Joshi',
  'Tanmay Kulkarni',
  'Rhea Kapoor',
  'Harsh Vardhan',
  'Sneha Bhattacharya',
  'Nikhil Pillai',
  'Pooja Choudhury',
  'Devendra Meena',
  'Shruti Saxena',
  'Manish Tiwari',
  'Alisha Farooqui',
  'Gautam Nambiar',
  'Bhavna Singhal',
  'Kunal Chawla',
  'Divya Hegde',
];

export const DEMO_ROSTER: EnrolledStudent[] = STUDENT_NAMES.map((name, idx) => {
  const emailName = name.toLowerCase().replace(/\s+/g, '.');
  const mastery = Math.min(100, Math.round(55 + (idx * 1.6) + ((idx % 5) * 4)));
  const circuits = 12 + ((idx * 3) % 25);
  const attempts = 15 + ((idx * 2) % 20);
  const passed = Math.round(attempts * (mastery / 100));
  return {
    student_id: `stu-2026-${String(idx + 1).padStart(3, '0')}`,
    full_name: name,
    email: `${emailName}@iitb.ac.in`,
    enrolled_at: new Date(Date.now() - (20 - (idx % 10)) * 86400000).toISOString(),
    overall_mastery: mastery,
    circuits_count: circuits,
    verified_attempts: attempts,
    passed_attempts: passed,
    average_verified_score: Math.round(mastery * 0.95),
    latest_verified_at: new Date(Date.now() - ((idx % 4) + 1) * 3600000 * 6).toISOString(),
  };
});

export const DEMO_MISCONCEPTIONS: ClassroomMisconceptionsResponse = {
  classroom_id: 'demo-iitb-qc101',
  classroom_name: 'IIT Bombay · QC101: Quantum Algorithms & Hardware Systems',
  classroom_code: 'SIH261',
  total_students: 28,
  active_misconceptions_count: 14,
  resolved_misconceptions_count: 22,
  misconceptions: [
    {
      id: 'phase-kickback-inversion',
      title: 'Phase Kickback Target vs Control Inversion',
      description: 'Learner assumes the phase shift accumulates on the target qubit rather than kicking back to the control qubit.',
      category: 'Phase & Interference',
      conflict_lab_id: 'conflict-phase-kickback',
      recommended_route: '/labs/conflict/phase-kickback',
      detected_count: 11,
      resolved_count: 8,
      prevalence_rate: 0.39,
    },
    {
      id: 'measurement-collapse-superposition',
      title: 'Post-Measurement Coherence Preservation Fallacy',
      description: 'Learner models subsequent gates after a Z-measurement as if the superposition statevector survived projection.',
      category: 'Measurement & Wavefunction',
      conflict_lab_id: 'conflict-measurement-collapse',
      recommended_route: '/labs/conflict/measurement-collapse',
      detected_count: 9,
      resolved_count: 7,
      prevalence_rate: 0.32,
    },
    {
      id: 'no-cloning-fanout',
      title: 'CNOT Fanout Violates No-Cloning Theorem',
      description: 'Learner interprets a CNOT operation with |0⟩ target as an arbitrary unknown state cloning operator.',
      category: 'Quantum Entanglement',
      conflict_lab_id: 'conflict-no-cloning',
      recommended_route: '/labs/conflict/no-cloning',
      detected_count: 6,
      resolved_count: 5,
      prevalence_rate: 0.21,
    },
    {
      id: 'global-vs-relative-phase',
      title: 'Global Phase Measurability Misconception',
      description: 'Learner believes global phase e^(iθ)|ψ⟩ alters projective measurement probability distributions in standard Z basis.',
      category: 'Phase & Interference',
      conflict_lab_id: 'conflict-global-phase',
      recommended_route: '/labs/conflict/global-phase',
      detected_count: 4,
      resolved_count: 2,
      prevalence_rate: 0.14,
    },
  ],
  student_matrix: DEMO_ROSTER.map((stu, idx) => ({
    student_id: stu.student_id,
    full_name: stu.full_name,
    email: stu.email,
    overall_mastery: stu.overall_mastery,
    circuits_count: stu.circuits_count,
    misconceptions: {
      'phase-kickback-inversion': {
        misconception_id: 'phase-kickback-inversion',
        status: idx % 3 === 0 ? 'detected' : idx % 3 === 1 ? 'resolved' : 'unencountered',
        detected_at: idx % 3 !== 2 ? new Date(Date.now() - 5 * 86400000).toISOString() : null,
        resolved_at: idx % 3 === 1 ? new Date(Date.now() - 1 * 86400000).toISOString() : null,
        evidence: idx % 3 === 0 ? 'Predicted target qubit phase rotation during Deutsch-Jozsa evaluation' : null,
      },
      'measurement-collapse-superposition': {
        misconception_id: 'measurement-collapse-superposition',
        status: idx % 4 === 0 ? 'detected' : idx % 4 === 2 ? 'resolved' : 'unencountered',
        detected_at: idx % 4 === 0 ? new Date(Date.now() - 7 * 86400000).toISOString() : null,
        resolved_at: idx % 4 === 2 ? new Date(Date.now() - 2 * 86400000).toISOString() : null,
        evidence: idx % 4 === 0 ? 'Placed Hadamard after measurement expecting superposition to be restored' : null,
      },
      'no-cloning-fanout': {
        misconception_id: 'no-cloning-fanout',
        status: idx % 5 === 0 ? 'detected' : idx % 5 === 1 ? 'resolved' : 'unencountered',
        detected_at: idx % 5 === 0 ? new Date(Date.now() - 4 * 86400000).toISOString() : null,
        resolved_at: idx % 5 === 1 ? new Date(Date.now() - 2 * 86400000).toISOString() : null,
        evidence: idx % 5 === 0 ? 'Claimed CNOT duplicates unknown qubit |ψ⟩ without entanglement' : null,
      },
      'global-vs-relative-phase': {
        misconception_id: 'global-vs-relative-phase',
        status: idx % 7 === 0 ? 'detected' : 'unencountered',
        detected_at: idx % 7 === 0 ? new Date(Date.now() - 3 * 86400000).toISOString() : null,
        resolved_at: null,
        evidence: idx % 7 === 0 ? 'Expected measurement histogram differences between |+⟩ and -|+⟩' : null,
      },
    },
  })),
};

export const DEMO_LEARNING_GAINS: ClassroomLearningGains = {
  classroom_id: 'demo-iitb-qc101',
  student_count: 28,
  paired_learners: 28,
  average_baseline: 41.8,
  average_post: 87.4,
  average_improvement: 45.6,
  students: DEMO_ROSTER.map((stu, idx) => {
    const base = Math.round(30 + ((idx * 2) % 30));
    const post = Math.min(100, Math.round(base + 35 + ((idx * 3) % 25)));
    return {
      student_id: stu.student_id,
      full_name: stu.full_name,
      baseline_score: base,
      post_score: post,
      improvement: post - base,
    };
  }),
};

export const DEMO_ASSIGNMENTS: ClassroomAssignment[] = [
  {
    id: 'asg-01-bell-phase',
    title: "Verify the Bell Pair's Hidden Phase Kickback",
    activity_type: 'challenge',
    activity_id: 'bell-phase-verification',
    route: '/challenges/bell-phase-verification',
    due_at: new Date(Date.now() + 5 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    completed_count: 24,
    student_count: 28,
    current_user_completed: true,
  },
  {
    id: 'asg-02-grover-diffusion',
    title: 'Construct 3-Qubit Grover Diffusion Operator',
    activity_type: 'guided',
    activity_id: 'grover:3',
    route: '/algorithms/grover',
    due_at: new Date(Date.now() + 10 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    completed_count: 18,
    student_count: 28,
    current_user_completed: true,
  },
  {
    id: 'asg-03-vqe-h2',
    title: 'Variational Quantum Eigensolver for H2 Ground State',
    activity_type: 'lesson',
    activity_id: 'm06-vqe-qaoa/vqe-h2-bond-dissociation',
    route: '/algorithms/vqe',
    due_at: new Date(Date.now() + 14 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    completed_count: 11,
    student_count: 28,
    current_user_completed: false,
  },
];
