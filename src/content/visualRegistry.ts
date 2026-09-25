/**
 * content/visualRegistry.ts — Controlled Visual Component Registry
 *
 * Lesson content references visual keys, never dynamic component strings.
 * All visual components must be explicitly registered here.
 *
 * To add a new visual:
 * 1. Create the component in src/components/lesson/visuals/
 * 2. Add its key to VisualRegistryKey in types.ts
 * 3. Register it here
 */

import React, { lazy } from 'react';
import type { VisualRegistryKey } from './types';

const BlochSphereLessonVisual = lazy(() =>
  import('../components/lesson/visuals/BlochSphereLessonVisual')
);
const ComplexPlaneLessonVisual = lazy(() =>
  import('../components/lesson/visuals/ComplexPlaneLessonVisual')
);
const MeasurementProbabilityVisual = lazy(() =>
  import('../components/lesson/visuals/MeasurementProbabilityVisual')
);
const StateVectorVisual = lazy(() =>
  import('../components/lesson/visuals/StateVectorVisual')
);
const BasisComparisonVisual = lazy(() =>
  import('../components/lesson/visuals/BasisComparisonVisual')
);
const UnitaryMatrixVisual = lazy(() =>
  import('../components/lesson/visuals/UnitaryMatrixVisual')
);

export type VisualComponent = React.LazyExoticComponent<React.ComponentType<{
  id: string;
  initialProps?: Record<string, unknown>;
  interactionPrompt?: string;
  onInteract?: () => void;
}>>;

export const VISUAL_REGISTRY: Record<VisualRegistryKey, VisualComponent> = {
  blochSphere:             BlochSphereLessonVisual,
  complexPlane:            ComplexPlaneLessonVisual,
  measurementProbability:  MeasurementProbabilityVisual,
  stateVector:             StateVectorVisual,
  basisComparison:         BasisComparisonVisual,
  unitaryMatrix:           UnitaryMatrixVisual,
};
