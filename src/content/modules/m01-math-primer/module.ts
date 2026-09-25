import type { ModuleDef } from '../../types';
import { diracNotation } from './dirac-notation';
import { complexAmplitudes } from './complex-amplitudes';
import { matrixOperations } from './matrix-operations';

export const m01MathPrimer: ModuleDef = {
  id: 'm01-math-primer',
  number: '01',
  title: 'Math for Quantum',
  subtitle: 'Complex numbers, vector spaces, and inner products',
  description:
    'Build the foundational mathematical tools necessary for quantum mechanics: Dirac notation (|ψ⟩, ⟨ψ|), vector spaces, unitary matrices, and tensor products.',
  status: 'available',
  badge: 'Optional foundation · Skip if comfortable',
  lessons: [diracNotation, complexAmplitudes, matrixOperations],
};
