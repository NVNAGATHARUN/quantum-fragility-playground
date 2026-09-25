/**
 * content/curriculum.ts — V3 Curriculum Registry
 *
 * This file is the INDEX of all curriculum modules. It does NOT contain
 * lesson content — each lesson lives in its own file under modules/.
 *
 * Source of truth for the 8-module canonical curriculum:
 *   01 Math for Quantum / Orientation
 *   02 Qubits & Measurement
 *   03 Quantum Gates & Operations
 *   04 Superposition, Phase & Interference
 *   05 Entanglement & Correlation
 *   06 Standard Quantum Algorithms
 *   07 Variational & Hybrid Algorithms
 *   08 Real Quantum Systems
 *
 * Module IDs are the authoritative source for frontend routing and
 * backend progress record validation. They must match curriculum/manifest.json.
 */

import type { ModuleDef } from './types';

import { m01MathPrimer }              from './modules/m01-math-primer/module';
import { m02QubitsMeasurement }       from './modules/m02-qubits-measurement/module';
import { m03QuantumGates }            from './modules/m03-quantum-gates/module';
import { m04SuperpositionInterference } from './modules/m04-superposition-interference/module';
import { m05EntanglementCorrelation } from './modules/m05-entanglement-correlation/module';
import { m06StandardAlgorithms }      from './modules/m06-standard-algorithms/module';
import { m07VariationalHybrid }       from './modules/m07-variational-hybrid/module';
import { m08RealSystems }             from './modules/m08-real-systems/module';

export const V3_CURRICULUM: ModuleDef[] = [
  m01MathPrimer,
  m02QubitsMeasurement,
  m03QuantumGates,
  m04SuperpositionInterference,
  m05EntanglementCorrelation,
  m06StandardAlgorithms,
  m07VariationalHybrid,
  m08RealSystems,
];

/** Canonical curriculum version — must match manifest.json */
export const CURRICULUM_VERSION = '3.0';

/** Lookup helpers */
export function findModule(moduleId: string): ModuleDef | undefined {
  return V3_CURRICULUM.find(m => m.id === moduleId);
}

export function findLesson(moduleId: string, lessonId: string) {
  const mod = findModule(moduleId);
  return mod?.lessons.find(l => l.id === lessonId);
}

/** Returns [prevLesson, nextLesson] relative to a given lesson */
export function getAdjacentLessons(moduleId: string, lessonId: string) {
  const mod = findModule(moduleId);
  if (!mod) return { prev: null, next: null };
  const idx = mod.lessons.findIndex(l => l.id === lessonId);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? mod.lessons[idx - 1] : null,
    next: idx < mod.lessons.length - 1 ? mod.lessons[idx + 1] : null,
  };
}

/** Returns the first available lesson in a module */
export function getFirstLesson(moduleId: string) {
  const mod = findModule(moduleId);
  return mod?.lessons.find(l => l.status === 'available') ?? null;
}
