/**
 * Algorithm Labs API Client for Quantum Lens AI.
 *
 * Connects frontend labs to FastAPI backend endpoints:
 *   - /api/v1/algorithms/bell-state
 *   - /api/v1/algorithms/deutsch-jozsa
 *   - /api/v1/algorithms/teleportation
 *   - /api/v1/algorithms/qft
 *
 * AL-01 through AL-05 require a successful simulator response. Other legacy
 * algorithm clients below still have analytical fallback paths.
 */

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

// ─── Bell State (AL-01) ───────────────────────────────────────────────────────

export interface BellStateRequest {
  bell_state: "phi_plus" | "phi_minus" | "psi_plus" | "psi_minus";
  shots?: number;
  measurement_basis?: "Z" | "X" | "Y";
  noise_percent?: number;
}

export interface BellStateResult {
  bell_state: string;
  state_label: string;
  counts: Record<string, number>;
  probabilities: Record<string, number>;
  statevector: Array<{
    basis: string;
    probability: number;
    phase_rad: number;
    real: number;
    imag: number;
  }>;
  entanglement_entropy: number;
  purity: number;
  correlation_zz: number;
  correlation_xx: number;
  correlation_yy: number;
  fidelity: number;
  measurement_basis: "Z" | "X" | "Y";
  noise_percent: number;
  circuit_depth: number;
  execution_time_ms: number;
  explanation: string;
}

export async function runBellState(
  req: BellStateRequest,
): Promise<BellStateResult> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/algorithms/bell-state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bell_state: req.bell_state,
        shots: req.shots ?? 1024,
        measurement_basis: req.measurement_basis ?? "Z",
        noise_percent: req.noise_percent ?? 0,
      }),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return await res.json();
  } catch (err) {
    throw new Error(
      "Qiskit Aer could not run this experiment. Check the backend connection and try again.",
    );
  }
}

// ─── Deutsch-Jozsa (AL-02) ───────────────────────────────────────────────────

export interface DeutschJozsaRequest {
  oracle_type: "constant_0" | "constant_1" | "balanced";
  n_qubits: number;
  shots?: number;
}

export interface DeutschJozsaResult {
  oracle_type: string;
  n_qubits: number;
  result: "constant" | "balanced";
  counts: Record<string, number>;
  probabilities: Record<string, number>;
  statevector: Array<{ basis: string; probability: number }>;
  circuit_depth: number;
  execution_time_ms: number;
  explanation: string;
}

export async function runDeutschJozsa(
  req: DeutschJozsaRequest,
): Promise<DeutschJozsaResult> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/algorithms/deutsch-jozsa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        oracle_type: req.oracle_type,
        n_qubits: req.n_qubits,
        shots: req.shots ?? 1024,
      }),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return await res.json();
  } catch (err) {
    throw new Error(
      "Qiskit Aer could not run this experiment. Check the backend connection and try again.",
    );
  }
}

// ─── Quantum Teleportation (AL-04) ───────────────────────────────────────────

export interface TeleportationRequest {
  input_state: "plus" | "minus" | "zero" | "one";
  shots?: number;
}

export interface TeleportationResult {
  input_state: string;
  fidelity: number;
  bob_counts: Record<string, number>;
  bob_probabilities: Record<string, number>;
  statevector_before_correction: Array<{ basis: string; probability: number }>;
  statevector_after_correction: Array<{ basis: string; probability: number }>;
  classical_bits: Record<string, number>;
  circuit_depth: number;
  execution_time_ms: number;
  explanation: string;
}

export async function runTeleportation(
  req: TeleportationRequest,
): Promise<TeleportationResult> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/algorithms/teleportation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input_state: req.input_state,
        shots: req.shots ?? 1024,
      }),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return await res.json();
  } catch (err) {
    throw new Error(
      "Qiskit Aer could not run this experiment. Check the backend connection and try again.",
    );
  }
}

// ─── Quantum Fourier Transform (AL-05) ───────────────────────────────────────

export interface QFTRequest {
  n_qubits: number;
  input_basis_state: number;
  shots?: number;
}

export interface QFTResult {
  n_qubits: number;
  input_state_desc: string;
  output_amplitudes: Array<{
    basis: string;
    probability: number;
    phase_rad: number;
    phase_turns: number;
  }>;
  counts: Record<string, number>;
  probabilities: Record<string, number>;
  circuit_depth: number;
  execution_time_ms: number;
  explanation: string;
}

export async function runQFT(req: QFTRequest): Promise<QFTResult> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/algorithms/qft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        n_qubits: req.n_qubits,
        input_basis_state: req.input_basis_state,
        shots: req.shots ?? 1024,
      }),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return await res.json();
  } catch (err) {
    throw new Error(
      "Qiskit Aer could not run this experiment. Check the backend connection and try again.",
    );
  }
}

// ─── Quantum Key Distribution: BB84 Protocol (AL-07) ─────────────────────────

export interface BB84Request {
  n_bits: number;
  eve_present: boolean;
  seed?: number;
}

export interface BB84Result {
  n_bits: number;
  eve_present: boolean;
  alice_bits: number[];
  alice_bases: string[];
  bob_bases: string[];
  eve_bases: string[];
  eve_measured_bits: number[];
  bob_measured_bits: number[];
  sifted_indices: number[];
  alice_sifted_key: number[];
  bob_sifted_key: number[];
  qber: number;
  is_secure: boolean;
  security_verdict: string;
  final_key_hex: string;
  circuit_depth: number;
  execution_time_ms: number;
  explanation: string;
}

export async function runBB84(req: BB84Request): Promise<BB84Result> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/algorithms/qkd-bb84`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        n_bits: req.n_bits,
        eve_present: req.eve_present,
        seed: req.seed,
      }),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return await res.json();
  } catch {
    throw new Error("The verified BB84 backend is unavailable. No synthetic result was substituted.");
  }
}

function analyticalBB84(req: BB84Request): BB84Result {
  const n = req.n_bits;
  const alice_bits: number[] = [];
  const alice_bases: string[] = [];
  const bob_bases: string[] = [];
  const eve_bases: string[] = [];
  const eve_measured_bits: number[] = [];
  const bob_measured_bits: number[] = [];

  for (let i = 0; i < n; i++) {
    const aBit = Math.random() < 0.5 ? 0 : 1;
    const aBase = Math.random() < 0.5 ? "+" : "x";
    const bBase = Math.random() < 0.5 ? "+" : "x";
    const eBase = Math.random() < 0.5 ? "+" : "x";

    alice_bits.push(aBit);
    alice_bases.push(aBase);
    bob_bases.push(bBase);
    eve_bases.push(eBase);

    let state = aBit;
    let currBase = aBase;

    if (req.eve_present) {
      if (eBase === currBase) {
        // Eve matches Alice basis
        eve_measured_bits.push(aBit);
      } else {
        // Measurement collapse
        const eBit = Math.random() < 0.5 ? 0 : 1;
        eve_measured_bits.push(eBit);
        state = eBit;
        currBase = eBase;
      }
    } else {
      eve_measured_bits.push(0);
    }

    if (bBase === currBase) {
      bob_measured_bits.push(state);
    } else {
      bob_measured_bits.push(Math.random() < 0.5 ? 0 : 1);
    }
  }

  const sifted_indices: number[] = [];
  for (let i = 0; i < n; i++) {
    if (alice_bases[i] === bob_bases[i]) {
      sifted_indices.push(i);
    }
  }

  const alice_sifted = sifted_indices.map((i) => alice_bits[i]);
  const bob_sifted = sifted_indices.map((i) => bob_measured_bits[i]);

  let errors = 0;
  for (let k = 0; k < sifted_indices.length; k++) {
    if (alice_sifted[k] !== bob_sifted[k]) errors++;
  }

  const qber = sifted_indices.length > 0 ? errors / sifted_indices.length : 0;
  const is_secure = qber <= 0.11 && sifted_indices.length >= 2;
  const verdict = is_secure
    ? "SECURE_KEY_ESTABLISHED"
    : "EAVESDROPPER_DETECTED_ABORT";

  let final_key_hex = "KEY_COMPROMISED";
  if (is_secure && alice_sifted.length > 0) {
    const bitStr = alice_sifted.join("");
    const padded = bitStr + "0".repeat((4 - (bitStr.length % 4)) % 4);
    final_key_hex = parseInt(padded, 2).toString(16).toUpperCase();
  }

  const explanation = req.eve_present
    ? `SECURITY BREACH DETECTED! Eve executed an Intercept-Resend attack. Measuring photons in conjugate bases collapsed the states, raising QBER to ${(qber * 100).toFixed(1)}%. Since QBER > 11.0% (Shor-Preskill limit), Alice and Bob safely aborted key exchange. Quantum physics prevented undetected espionage!`
    : `BB84 completed securely. Alice and Bob matched bases on ${sifted_indices.length} of ${n} qubits (${((sifted_indices.length / n) * 100).toFixed(1)}% sifted efficiency) with QBER = ${(qber * 100).toFixed(1)}% (≤ 11.0% threshold). Quantum key established.`;

  return {
    n_bits: n,
    eve_present: req.eve_present,
    alice_bits,
    alice_bases,
    bob_bases,
    eve_bases: req.eve_present ? eve_bases : [],
    eve_measured_bits: req.eve_present ? eve_measured_bits : [],
    bob_measured_bits,
    sifted_indices,
    alice_sifted_key: alice_sifted,
    bob_sifted_key: bob_sifted,
    qber: Math.round(qber * 1000) / 1000,
    is_secure,
    security_verdict: verdict,
    final_key_hex,
    circuit_depth: 3,
    execution_time_ms: 11.2,
    explanation,
  };
}

// --- Quantum Network Lab: Entanglement Swapping / Repeater (AL-08) ----------

export interface EntanglementSwappingRequest {
  distance_km: number;
  shots?: number;
}

export interface EntanglementSwappingResult {
  distance_km: number;
  use_repeater: boolean;
  bsm_outcome: string;
  alice_bob_state_label: string;
  direct_transmission_prob: number;
  repeater_transmission_prob: number;
  fidelity: number;
  entanglement_entropy: number;
  subsystem_purity: number;
  counts: Record<string, number>;
  probabilities: Record<string, number>;
  circuit_depth: number;
  execution_time_ms: number;
  explanation: string;
  model_provenance?: string;
}

export async function runEntanglementSwapping(
  req: EntanglementSwappingRequest,
): Promise<EntanglementSwappingResult> {
  try {
    const res = await fetch(
      `${BASE_URL}/api/v1/algorithms/entanglement-swapping`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          distance_km: req.distance_km,
          shots: req.shots ?? 1024,
        }),
      },
    );
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return await res.json();
  } catch {
    throw new Error("The verified entanglement-swapping backend is unavailable. No synthetic result was substituted.");
  }
}

function analyticalEntanglementSwapping(
  req: EntanglementSwappingRequest,
): EntanglementSwappingResult {
  const d = req.distance_km;
  const ALPHA_DB_PER_KM = 0.2;
  const directLossDb = ALPHA_DB_PER_KM * d;
  const repeaterLossDb = ALPHA_DB_PER_KM * (d / 2);
  const directProb = Math.pow(10, -directLossDb / 10);
  const repeaterProb = Math.pow(10, -repeaterLossDb / 10);
  const bsmOutcomes = ["00", "01", "10", "11"];
  const bsmOutcome = bsmOutcomes[Math.floor(Math.random() * 4)];
  const counts: Record<string, number> = {
    "00": 256,
    "01": 256,
    "10": 256,
    "11": 256,
  };
  const probs: Record<string, number> = {
    "00": 0.25,
    "01": 0.25,
    "10": 0.25,
    "11": 0.25,
  };
  return {
    distance_km: d,
    use_repeater: true,
    bsm_outcome: bsmOutcome,
    alice_bob_state_label: "|F+?_AB = (|00?+|11?)/v2",
    direct_transmission_prob: Math.round(directProb * 1e6) / 1e6,
    repeater_transmission_prob: Math.round(repeaterProb * 1e6) / 1e6,
    fidelity: 0.9995,
    entanglement_entropy: 1.0,
    subsystem_purity: 0.5,
    counts,
    probabilities: probs,
    circuit_depth: 8,
    execution_time_ms: 22.4,
    explanation: `Quantum Repeater SUCCESS at ${(d / 2).toFixed(0)} km intermediate node. Direct loss = ${directLossDb.toFixed(1)} dB vs ${repeaterLossDb.toFixed(1)} dB per segment. Alice and Bob share |Φ+⟩_AB (F=0.9995) without direct photon exchange!`,
  };
}

// ─── QAOA: Quantum Approximate Optimization Algorithm (AL-06) ────────────────

export interface QAOARequest {
  graph_type: "triangle_3" | "line_3" | "ring_4" | "star_4";
  gamma?: number;
  beta?: number;
  p_steps?: number;
  shots?: number;
  optimize?: boolean;
}

export interface StateEvolutionStep {
  step: number;
  name: string;
  desc: string;
  amplitudes: Array<{
    basis: string;
    probability: number;
    phase_rad: number;
  }>;
}

export interface LandscapePoint {
  gamma: number;
  beta: number;
  expected_cut: number;
  ratio: number;
}

export interface QAOAResult {
  graph_type: string;
  graph_name: string;
  n_nodes: number;
  edges: Array<[number, number]>;
  gamma: number;
  beta: number;
  p_steps: number;
  expected_cut: number;
  max_possible_cut: number;
  approximation_ratio: number;
  optimal_gamma: number;
  optimal_beta: number;
  optimal_expected_cut: number;
  probabilities: Record<string, number>;
  bitstring_cuts: Record<string, number>;
  best_bitstring: string;
  state_evolution_steps: StateEvolutionStep[];
  landscape: LandscapePoint[];
  circuit_depth: number;
  execution_time_ms: number;
  explanation: string;
}

export async function runQAOA(req: QAOARequest): Promise<QAOAResult> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/algorithms/qaoa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        graph_type: req.graph_type,
        gamma: req.gamma ?? 0.6,
        beta: req.beta ?? 0.4,
        p_steps: req.p_steps ?? 1,
        shots: req.shots ?? 1024,
        optimize: req.optimize ?? false,
      }),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return await res.json();
  } catch {
    throw new Error("The verified QAOA backend is unavailable. No synthetic result was substituted.");
  }
}

function analyticalQAOA(req: QAOARequest): QAOAResult {
  const g = req.gamma ?? 0.6;
  const b = req.beta ?? 0.4;
  const graphConfigs: Record<
    string,
    {
      name: string;
      n: number;
      edges: [number, number][];
      maxCut: number;
      best: string;
    }
  > = {
    triangle_3: {
      name: "Triangle Graph (K3)",
      n: 3,
      edges: [
        [0, 1],
        [1, 2],
        [0, 2],
      ],
      maxCut: 2,
      best: "010",
    },
    line_3: {
      name: "3-Node Path Graph",
      n: 3,
      edges: [
        [0, 1],
        [1, 2],
      ],
      maxCut: 2,
      best: "010",
    },
    ring_4: {
      name: "4-Node Cycle Graph (C4)",
      n: 4,
      edges: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
      ],
      maxCut: 4,
      best: "0101",
    },
    star_4: {
      name: "4-Node Star Graph (S4)",
      n: 4,
      edges: [
        [0, 1],
        [0, 2],
        [0, 3],
      ],
      maxCut: 3,
      best: "0111",
    },
  };

  const cfg = graphConfigs[req.graph_type] ?? graphConfigs.triangle_3;
  const expectedCut = Math.min(
    cfg.maxCut,
    0.75 * cfg.maxCut + 0.25 * Math.sin(2 * g) * Math.sin(2 * b),
  );
  const ratio = expectedCut / cfg.maxCut;

  const probs: Record<string, number> = {};
  const bitCuts: Record<string, number> = {};
  const totalStates = 1 << cfg.n;

  for (let i = 0; i < totalStates; i++) {
    const bitstr = i.toString(2).padStart(cfg.n, "0");
    let cut = 0;
    for (const [u, v] of cfg.edges) {
      if (bitstr[u] !== bitstr[v]) cut++;
    }
    bitCuts[bitstr] = cut;
    probs[bitstr] = cut === cfg.maxCut ? 0.35 : 0.65 / (totalStates - 2);
  }

  const landscape: LandscapePoint[] = [];
  for (let gi = 0; gi <= 7; gi++) {
    for (let bi = 0; bi <= 7; bi++) {
      const gv = (gi / 7) * Math.PI;
      const bv = (bi / 7) * (Math.PI / 2);
      const ec = Math.min(
        cfg.maxCut,
        0.7 * cfg.maxCut + 0.3 * Math.sin(2 * gv) * Math.sin(2 * bv),
      );
      landscape.push({
        gamma: Math.round(gv * 100) / 100,
        beta: Math.round(bv * 100) / 100,
        expected_cut: Math.round(ec * 100) / 100,
        ratio: Math.round((ec / cfg.maxCut) * 100) / 100,
      });
    }
  }

  return {
    graph_type: req.graph_type,
    graph_name: cfg.name,
    n_nodes: cfg.n,
    edges: cfg.edges,
    gamma: g,
    beta: b,
    p_steps: req.p_steps ?? 1,
    expected_cut: Math.round(expectedCut * 100) / 100,
    max_possible_cut: cfg.maxCut,
    approximation_ratio: Math.round(ratio * 100) / 100,
    optimal_gamma: 0.62,
    optimal_beta: 0.39,
    optimal_expected_cut: Math.round(0.88 * cfg.maxCut * 100) / 100,
    probabilities: probs,
    bitstring_cuts: bitCuts,
    best_bitstring: cfg.best,
    state_evolution_steps: [
      {
        step: 1,
        name: "Ground State Initialization",
        desc: "All qubits in |0⟩^⊗n with zero entanglement.",
        amplitudes: [],
      },
      {
        step: 2,
        name: "Uniform Superposition (Hadamard)",
        desc: "H^⊗n prepares equal superposition.",
        amplitudes: [],
      },
      {
        step: 3,
        name: "Phase Separation (Cost Hamiltonian)",
        desc: `e^(-iγ H_C) imprints cut-dependent phases with γ=${g.toFixed(2)}.`,
        amplitudes: [],
      },
      {
        step: 4,
        name: "Quantum Interference (Mixer Hamiltonian)",
        desc: `e^(-iβ H_M) drives interference towards max cuts with β=${b.toFixed(2)}.`,
        amplitudes: [],
      },
    ],
    landscape,
    circuit_depth: 3 + cfg.edges.length * 3,
    execution_time_ms: 18.5,
    explanation: `QAOA evaluated for ${cfg.name}. Imprints phases via cost Hamiltonian e^(-iγ H_C) and drives quantum interference with mixer e^(-iβ H_M), concentrating probability at cut states.`,
  };
}

// ─── VQE: Variational Quantum Eigensolver (AL-07) ───────────────────────────

export interface VQERequest {
  molecule?: string;
  bond_distance?: number;
  theta?: number;
  optimize?: boolean;
  shots?: number;
}

export interface DissociationPoint {
  r: number;
  fci: number;
  hartree_fock: number;
  vqe: number;
}

export interface OptimizationStep {
  iteration: number;
  theta: number;
  energy: number;
}

export interface VQEResult {
  molecule: string;
  bond_distance: number;
  theta: number;
  optimal_theta: number;
  vqe_energy: number;
  optimal_vqe_energy: number;
  hartree_fock_energy: number;
  exact_fci_energy: number;
  correlation_energy: number;
  error_mhartree: number;
  pauli_expectations: Record<string, number>;
  hamiltonian_coeffs: Record<string, number>;
  state_evolution_steps: StateEvolutionStep[];
  dissociation_curve: DissociationPoint[];
  optimization_history: OptimizationStep[];
  circuit_depth: number;
  execution_time_ms: number;
  explanation: string;
  model_provenance?: string;
}

export async function runVQE(req: VQERequest): Promise<VQEResult> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/algorithms/vqe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        molecule: req.molecule ?? "H2",
        bond_distance: req.bond_distance ?? 0.74,
        theta: req.theta ?? 0.15,
        optimize: req.optimize ?? false,
        shots: req.shots ?? 1024,
      }),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return await res.json();
  } catch {
    throw new Error("The verified VQE backend is unavailable. No synthetic result was substituted.");
  }
}

function analyticalVQE(req: VQERequest): VQEResult {
  const r = req.bond_distance ?? 0.74;
  const th = req.theta ?? 0.15;
  const re = 0.7414;
  const fci =
    -1.0 + 0.137 * (Math.pow(1.0 - Math.exp(-1.1 * (r - re)), 2) - 1.0);
  const hf =
    fci + 0.02 + 0.12 * Math.pow(1.0 - Math.exp(-0.9 * Math.max(0, r - re)), 2);
  const vqe = req.optimize ? fci : fci + 0.03 * Math.pow(th - 0.2, 2);

  const diss: DissociationPoint[] = [
    0.3, 0.5, 0.74, 0.9, 1.1, 1.3, 1.6, 2.0, 2.5,
  ].map((rp) => {
    const efci =
      -1.0 + 0.137 * (Math.pow(1.0 - Math.exp(-1.1 * (rp - re)), 2) - 1.0);
    const ehf =
      efci +
      0.02 +
      0.12 * Math.pow(1.0 - Math.exp(-0.9 * Math.max(0, rp - re)), 2);
    return {
      r: rp,
      fci: Math.round(efci * 1000) / 1000,
      hartree_fock: Math.round(ehf * 1000) / 1000,
      vqe: Math.round(efci * 1000) / 1000,
    };
  });

  return {
    molecule: "H2",
    bond_distance: r,
    theta: th,
    optimal_theta: 0.22,
    vqe_energy: Math.round(vqe * 10000) / 10000,
    optimal_vqe_energy: Math.round(fci * 10000) / 10000,
    hartree_fock_energy: Math.round(hf * 10000) / 10000,
    exact_fci_energy: Math.round(fci * 10000) / 10000,
    correlation_energy: Math.round((hf - fci) * 10000) / 10000,
    error_mhartree: Math.round(Math.abs(vqe - fci) * 100000) / 100,
    pauli_expectations: {
      Z0: -Math.round(Math.cos(th) * 1000) / 1000,
      Z1: Math.round(Math.cos(th) * 1000) / 1000,
      Z0Z1: -1.0,
      X0X1: -Math.round(Math.sin(th) * 1000) / 1000,
      Y0Y1: -Math.round(Math.sin(th) * 1000) / 1000,
    },
    hamiltonian_coeffs: {
      g0: -0.327,
      g1: 0.171,
      g2: -0.222,
      g3: 0.168,
      g4: 0.045,
      g5: 0.045,
    },
    state_evolution_steps: [
      {
        step: 1,
        name: "Vacuum Reference State |00⟩",
        desc: "Computational basis ground state with zero occupations.",
        amplitudes: [],
      },
      {
        step: 2,
        name: "Hartree-Fock Mean-Field State |01⟩",
        desc: "Single Slater determinant occupying the bonding molecular orbital.",
        amplitudes: [],
      },
      {
        step: 3,
        name: "Entangled Molecular Ansatz |ψ(θ)⟩",
        desc: `Parameterized Givens excitation with θ=${th.toFixed(3)} mixing in |10⟩.`,
        amplitudes: [],
      },
      {
        step: 4,
        name: "Pauli Basis Measurement",
        desc: "Simultaneous measurements in Z, X, and Y bases via AerSimulator.",
        amplitudes: [],
      },
    ],
    dissociation_curve: diss,
    optimization_history: [
      { iteration: 0, theta: 0.0, energy: Math.round(hf * 1000) / 1000 },
      {
        iteration: 1,
        theta: th * 0.5,
        energy: Math.round(((hf + vqe) / 2) * 1000) / 1000,
      },
      { iteration: 2, theta: th, energy: Math.round(vqe * 1000) / 1000 },
    ],
    circuit_depth: 7,
    execution_time_ms: 19.2,
    explanation: `VQE simulated ground state of H2 at bond distance R=${r.toFixed(2)} Å. Ground energy ${vqe.toFixed(4)} Ha matches exact Full Configuration Interaction (FCI).`,
  };
}
