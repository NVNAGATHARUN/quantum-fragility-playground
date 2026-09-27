import type { ModuleDef } from '../../types';
import { coreLesson } from '../coreLessonFactory';

const moduleId = 'm08-real-systems';

export const m08RealSystems: ModuleDef = {
  id: 'm08-real-systems',
  number: '08',
  title: 'Real Quantum Systems',
  subtitle: 'Decoherence, T1/T2 relaxation, and physical cryostats',
  description:
    'Bridge the gap between pure mathematics and physical superconducting QPUs. Explore dilution refrigerators, pulse control, Kraus noise channels, and readout error calibration.',
  status: 'available',
  lessons: [
    coreLesson({
      id: 'decoherence-relaxation', moduleId, title: 'Decoherence: T₁, T₂, and Mixed States',
      summary: 'Track energy relaxation and phase loss with density matrices and Bloch-vector contraction.',
      type: 'experiment',
      concept: 'T₁ describes energy relaxation toward the ground state, while T₂ describes loss of transverse phase coherence. Density matrices represent the resulting mixed states. For Markovian relaxation and pure dephasing, the physical bound T₂ ≤ 2T₁ must hold.',
      equation: '\\frac{1}{T_2}=\\frac{1}{2T_1}+\\frac{1}{T_\\phi}',
      equationLabel: 'Relaxation-dephasing relation',
      misconception: 'Dephasing can destroy interference without changing the computational-basis populations, so energy stability does not imply coherent quantum information.',
      prediction: 'Which observable can decay during pure dephasing while the |0⟩ and |1⟩ populations remain unchanged?',
      question: 'What distinguishes T₁ relaxation from pure dephasing?',
      options: [
        { key: 'a', text: 'Only T₁ changes energy populations' },
        { key: 'b', text: 'Only dephasing uses density matrices' },
        { key: 'c', text: 'T₁ never affects coherence' },
        { key: 'd', text: 'They are physically identical' },
      ],
      correctKey: 'a',
      correctExplanation: 'T₁ relaxation transfers population toward the ground state; pure dephasing primarily suppresses off-diagonal coherence.',
      labLink: '/labs/fragility', labLabel: 'Open the quantum fragility lab',
      reflection: 'Which plots distinguish amplitude damping from phase damping in the lab?',
    }),
    coreLesson({
      id: 'cryostat-hardware', moduleId, title: 'From Room Temperature to a Transmon',
      summary: 'Follow control pulses through a dilution refrigerator and identify each thermal stage.',
      type: 'experiment',
      concept: 'A superconducting processor operates near millikelvin temperatures so thermal excitations are suppressed relative to the qubit transition energy. Room-temperature electronics shape microwave pulses; attenuation, filtering, shielding, amplification, and staged cooling preserve control while limiting noise.',
      equation: 'p_{excited}/p_{ground}=e^{-\\hbar\\omega/(k_B T)}',
      equationLabel: 'Thermal excitation ratio',
      misconception: 'The cryostat does not make gates perfect. Wiring loss, pulse distortion, material defects, crosstalk, and readout errors remain.',
      prediction: 'Why is attenuation distributed across several temperature stages instead of placed only beside the qubit?',
      question: 'What is the main purpose of millikelvin operation?',
      options: [
        { key: 'a', text: 'Increase classical clock speed' },
        { key: 'b', text: 'Suppress thermal excitation of the qubit' },
        { key: 'c', text: 'Eliminate all microwave loss' },
        { key: 'd', text: 'Create entanglement automatically' },
      ],
      correctKey: 'b',
      correctExplanation: 'Cooling makes kBT small relative to the transition energy, reducing unwanted excited-state population.',
      labLink: '/explore/hardware', labLabel: 'Explore the dilution refrigerator',
      reflection: 'Trace one control pulse from the room-temperature generator to the qubit and back through readout.',
    }),
  ],
};
