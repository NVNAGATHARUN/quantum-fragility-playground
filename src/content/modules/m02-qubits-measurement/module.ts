import type { ModuleDef } from '../../types';
import { qubitStates } from './qubit-states';
import { statevectorBloch } from './statevector-bloch';
import { bornRule } from './born-rule';
import { measurementChallenge } from './measurement-challenge';

export const m02QubitsMeasurement: ModuleDef = {
  id: 'm02-qubits-measurement',
  number: '02',
  title: 'Qubits & Measurement',
  subtitle: 'From classical bits to the geometry of the Bloch sphere',
  description:
    'Learn how a two-level quantum system represents information, how statevectors map onto the Bloch sphere, and how quantum measurement produces probabilistic outcomes governed by the Born rule.',
  status: 'available',
  lessons: [qubitStates, statevectorBloch, bornRule, measurementChallenge],
};
