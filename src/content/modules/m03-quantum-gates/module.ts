import type { ModuleDef } from '../../types';
import { pauliGates } from './pauli-gates';
import { hadamardGate } from './hadamard-gate';
import { rotationsAxes } from './rotations-axes';
import { reversibility } from './reversibility';

/**
 * M03: Quantum Gates & Operations — AVAILABLE
 *
 * Full interactive lesson module covering single-qubit unitaries,
 * geometric Bloch sphere rotations, phase operations, and reversible circuit algebra.
 */
export const m03QuantumGates: ModuleDef = {
  id: 'm03-quantum-gates',
  number: '03',
  title: 'Quantum Gates & Operations',
  subtitle: 'Single-qubit unitaries, geometric rotations, and reversibility',
  description:
    'Explore the fundamental quantum logic gates: Pauli X, Y, Z, Hadamard (H), Phase (S, T), and continuous rotations Rx, Ry, Rz. Understand how each gate corresponds to a rotation on the Bloch sphere and why quantum computation is strictly reversible.',
  status: 'available',
  lessons: [
    pauliGates,
    hadamardGate,
    rotationsAxes,
    reversibility,
  ],
};
