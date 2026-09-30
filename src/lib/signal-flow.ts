/**
 * signal-flow.ts
 * Educational metadata and physics parameters for microwave control and readout
 * signal tracing in a superconducting quantum computer dilution refrigerator.
 */

export type SignalPhase = "downlink" | "interaction" | "uplink";

export interface SignalFlowStep {
  id: string;
  stepNumber: number;
  totalSteps: number;
  phase: SignalPhase;
  phaseLabel: string;
  stageName: string;
  temperature: string;
  componentId: string;
  title: string;
  summary: string;
  whyItMatters: string;
  frequency: string;
  powerLevel: string;
  attenuationOrGain: string;
  noiseFigure: string;
  activePath: "control" | "readout" | "qpu";
  cameraFocus: {
    y: number;
    distance: number;
  };
}

export const SIGNAL_FLOW_STEPS: SignalFlowStep[] = [
  {
    id: "step-1-awg",
    stepNumber: 1,
    totalSteps: 8,
    phase: "downlink",
    phaseLabel: "Downlink: Control Pulse",
    stageName: "Room-Temperature Electronics",
    temperature: "300 K",
    componentId: "room-temp-flange",
    title: "1. Control Pulse Generation (AWG at 300 K)",
    summary:
      "Classical Arbitrary Waveform Generators (AWGs) and microwave sources synthesize a nanosecond-scale Gaussian pulse envelope at ~5.0 GHz. This microwave pulse enters the cryostat through vacuum-tight coaxial feedthroughs.",
    whyItMatters:
      "Superconducting qubits operate via microwave photons. The duration, amplitude, and phase of this classical pulse determine the rotation angle on the Bloch sphere (such as an X or Hadamard quantum gate).",
    frequency: "5.02 GHz (Qubit ω₀₁)",
    powerLevel: "+10 dBm (~10 mW)",
    attenuationOrGain: "0 dB (Source Output)",
    noiseFigure: "Thermal noise: -174 dBm/Hz (300 K)",
    activePath: "control",
    cameraFocus: { y: 2.65, distance: 3.2 },
  },
  {
    id: "step-2-pre-cool",
    stepNumber: 2,
    totalSteps: 8,
    phase: "downlink",
    phaseLabel: "Downlink: Control Pulse",
    stageName: "Thermal Anchoring & 4 K Attenuation",
    temperature: "50 K down to 4 K",
    componentId: "stage-4k",
    title: "2. Thermal Anchoring & 4 K Noise Attenuation",
    summary:
      "The microwave cable passes through the 50 K and 4 K plates. At 4 K, a 20 dB cryogenic attenuator absorbs room-temperature blackbody radiation traveling down the line, re-emitting thermal noise anchored to 4 K.",
    whyItMatters:
      "Without thermal interception, room-temperature heat and 300 K thermal photons would rush down the coaxial copper conductor and boil away the delicate millikelvin stages below.",
    frequency: "5.02 GHz",
    powerLevel: "-10 dBm (~0.1 mW)",
    attenuationOrGain: "-20 dB Attenuation",
    noiseFigure: "Thermal noise anchored to 4 K",
    activePath: "control",
    cameraFocus: { y: 1.6, distance: 3.0 },
  },
  {
    id: "step-3-milli-kelvin-attenuation",
    stepNumber: 3,
    totalSteps: 8,
    phase: "downlink",
    phaseLabel: "Downlink: Control Pulse",
    stageName: "Sub-Kelvin Stages (Still & Cold Plate)",
    temperature: "~800 mK to ~100 mK",
    componentId: "attenuators-filters",
    title: "3. Cold Plate Attenuation & Low-Pass Filtering",
    summary:
      "The pulse descends past the Still to the Cold Plate (~100 mK), where an additional 10 dB attenuator and low-pass reflective filters suppress high-frequency infrared and optical stray photons.",
    whyItMatters:
      "High-energy photons can break Cooper pairs in the superconductor into unpaired quasiparticles, leading to sudden qubit dephasing and irreversible quantum information loss.",
    frequency: "5.02 GHz",
    powerLevel: "-40 dBm",
    attenuationOrGain: "-10 dB Attenuation + IR Filter",
    noiseFigure: "Thermal noise anchored to 100 mK",
    activePath: "control",
    cameraFocus: { y: 0.1, distance: 2.6 },
  },
  {
    id: "step-4-mxc-attenuation",
    stepNumber: 4,
    totalSteps: 8,
    phase: "downlink",
    phaseLabel: "Downlink: Control Pulse",
    stageName: "Mixing Chamber Stage",
    temperature: "~15 mK",
    componentId: "mixing-chamber",
    title: "4. Mixing Chamber Attenuation (Single-Photon Regime)",
    summary:
      "At the 15 mK base plate, a final 20 dB attenuator thermalizes the line to the lowest temperature. The total cumulative line attenuation reaches ~60 dB, reducing the thermal photon occupancy to nth ≪ 0.01.",
    whyItMatters:
      "At 15 mK, the thermal energy kB·T is 15 times smaller than the qubit transition energy ℏω₀₁. This guarantees the qubit rests in its pure ground state |0⟩ before computational pulses arrive.",
    frequency: "5.02 GHz",
    powerLevel: "-60 dBm to -75 dBm",
    attenuationOrGain: "-20 dB Attenuation (Total -60 dB)",
    noiseFigure: "nth < 0.001 thermal photons",
    activePath: "control",
    cameraFocus: { y: -0.7, distance: 2.4 },
  },
  {
    id: "step-5-qubit-gate",
    stepNumber: 5,
    totalSteps: 8,
    phase: "interaction",
    phaseLabel: "QPU: Quantum Interaction",
    stageName: "Quantum Processor Enclosure",
    temperature: "~15 mK",
    componentId: "qpu-package",
    title: "5. Qubit State Manipulation (Rabi Oscillations)",
    summary:
      "The conditioned pulse enters the gold-plated QPU cavity and couples capacitively to a superconducting transmon qubit. The resonant electric field drives Rabi oscillations, rotating the qubit into superposition: (|0⟩ + |1⟩)/√2.",
    whyItMatters:
      "This is where quantum computation physically occurs! Josephson junctions provide the non-linear inductance that isolates the computational subspace {|0⟩, |1⟩} from higher excited energy levels.",
    frequency: "5.02 GHz (Qubit resonance)",
    powerLevel: "-80 dBm (Few-photon gate level)",
    attenuationOrGain: "Coupling C_g ≈ 1–2 fF",
    noiseFigure: "Pure quantum coherent state",
    activePath: "qpu",
    cameraFocus: { y: -1.25, distance: 1.8 },
  },
  {
    id: "step-6-readout-dispersive",
    stepNumber: 6,
    totalSteps: 8,
    phase: "interaction",
    phaseLabel: "QPU: Quantum Interaction",
    stageName: "Readout Resonator & Cavity",
    temperature: "~15 mK",
    componentId: "qpu-package",
    title: "6. Dispersive State Readout & Phase Shift",
    summary:
      "To measure the qubit without collapsing its superposition prematurely, an off-resonant readout tone (~6.8 GHz) probes the coplanar waveguide resonator. The resonator frequency shifts by ±χ depending on whether the qubit is in |0⟩ or |1⟩.",
    whyItMatters:
      "Dispersive circuit QED allows quantum non-demolition (QND) measurement: the qubit state is mapped onto the phase of the reflected microwave pulse without absorbing the qubit's energy.",
    frequency: "6.80 GHz (Readout cavity ω_r)",
    powerLevel: "-125 dBm (~1 photon / 100 ns)",
    attenuationOrGain: "Dispersive shift 2χ ≈ 2–5 MHz",
    noiseFigure: "Quantum-limited information carrier",
    activePath: "readout",
    cameraFocus: { y: -1.25, distance: 1.8 },
  },
  {
    id: "step-7-cryo-isolation",
    stepNumber: 7,
    totalSteps: 8,
    phase: "uplink",
    phaseLabel: "Uplink: Readout Signal",
    stageName: "Cryogenic Isolation Chain",
    temperature: "~15 mK to ~100 mK",
    componentId: "mixing-chamber",
    title: "7. Non-Reciprocal Microwave Isolation (Circulators)",
    summary:
      "The faint reflected pulse passes through magnetic ferrite microwave circulators and isolators. These components allow the forward-traveling readout tone to pass with ~0.3 dB loss while providing >40 dB isolation against reverse noise.",
    whyItMatters:
      "Upstream cryogenic amplifiers emit significant thermal and quantum back-action noise. Without directional circulators, amplifier noise traveling backward would instantly destroy qubit coherence.",
    frequency: "6.80 GHz",
    powerLevel: "-125 dBm",
    attenuationOrGain: ">40 dB Reverse Isolation (Forward -0.3 dB)",
    noiseFigure: "Zero back-action noise to QPU",
    activePath: "readout",
    cameraFocus: { y: -0.85, distance: 2.3 },
  },
  {
    id: "step-8-hemt-amplification",
    stepNumber: 8,
    totalSteps: 8,
    phase: "uplink",
    phaseLabel: "Uplink: Readout Signal",
    stageName: "4 K Stage & Room-Temperature Output",
    temperature: "4 K to 300 K",
    componentId: "hemt-amplifier",
    title: "8. Cryogenic HEMT Amplification & Digitization",
    summary:
      "At 4 K, a High Electron Mobility Transistor (HEMT) amplifier boosts the single-photon microwave signal by +38 dB. The amplified signal travels out of the cryostat into room-temperature mixers and high-speed ADCs that digitize the IQ quadratures into a classical bit (0 or 1).",
    whyItMatters:
      "A single microwave photon is too weak to be detected by room-temperature electronics. The 4 K HEMT provides massive low-noise gain right before thermal noise can obscure the quantum measurement result.",
    frequency: "6.80 GHz → Down-converted to 50 MHz IF",
    powerLevel: "-87 dBm (at 4 K) → 0 dBm (at 300 K ADC)",
    attenuationOrGain: "+38 dB HEMT Gain + 300 K LNA",
    noiseFigure: "Noise Temp T_N ≈ 2.0 K (~3 photons added)",
    activePath: "readout",
    cameraFocus: { y: 1.25, distance: 2.8 },
  },
];
