import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FlaskConical, ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle,
  Play, RotateCcw, Lightbulb, Award, Sparkles, Layers, ChevronRight,
  Info, Cpu, Plus, Trash2, Zap, HelpCircle, Activity, Gauge, Check
} from 'lucide-react';
import { GUIDED_LABS, type GuidedLabDefinition, type LabStep } from '../content/guidedLabs';
import type { CircuitIR, GateOperation, SupportedGate, NormalizedSimulationResult, StateAmplitude } from '../types/quantum';
import { simulateCircuit } from '../api/quantum';
import BlochSphere3D from '../components/BlochSphere3D';
import { useQuantumSession } from '../providers/QuantumSessionProvider';

interface GateVisualMeta {
  gate: SupportedGate;
  label: string;
  name: string;
  desc: string;
  textColor: string;
  borderClass: string;
  bgClass: string;
  glowClass: string;
}

const LAB_GATES_CONFIG: GateVisualMeta[] = [
  { gate: 'H', label: 'H', name: 'Hadamard', desc: 'Creates equal superposition: (|0⟩ + |1⟩)/√2', textColor: 'text-cyan-400', borderClass: 'border-cyan-500/60', bgClass: 'bg-cyan-500/15', glowClass: 'shadow-[0_0_12px_rgba(6,182,212,0.35)]' },
  { gate: 'X', label: 'X', name: 'Pauli-X', desc: 'Quantum NOT bit-flip: flips |0⟩ ↔ |1⟩', textColor: 'text-rose-400', borderClass: 'border-rose-500/60', bgClass: 'bg-rose-500/15', glowClass: 'shadow-[0_0_12px_rgba(244,63,94,0.35)]' },
  { gate: 'Y', label: 'Y', name: 'Pauli-Y', desc: 'Bit & phase flip: |0⟩ → i|1⟩, |1⟩ → -i|0⟩', textColor: 'text-emerald-400', borderClass: 'border-emerald-500/60', bgClass: 'bg-emerald-500/15', glowClass: 'shadow-[0_0_12px_rgba(16,185,129,0.35)]' },
  { gate: 'Z', label: 'Z', name: 'Pauli-Z', desc: 'Phase-flip: leaves |0⟩ unchanged, inverts |1⟩ to -|1⟩', textColor: 'text-amber-400', borderClass: 'border-amber-500/60', bgClass: 'bg-amber-500/15', glowClass: 'shadow-[0_0_12px_rgba(245,158,11,0.35)]' },
  { gate: 'S', label: 'S', name: 'Phase (S)', desc: 'π/2 quarter-turn relative phase gate', textColor: 'text-violet-400', borderClass: 'border-violet-500/60', bgClass: 'bg-violet-500/15', glowClass: 'shadow-[0_0_12px_rgba(139,92,246,0.35)]' },
  { gate: 'T', label: 'T', name: 'T Gate', desc: 'π/4 eighth-turn relative phase gate', textColor: 'text-fuchsia-400', borderClass: 'border-fuchsia-500/60', bgClass: 'bg-fuchsia-500/15', glowClass: 'shadow-[0_0_12px_rgba(217,70,239,0.35)]' },
  { gate: 'CX', label: 'CX', name: 'CNOT', desc: 'Flips target qubit when control qubit is |1⟩', textColor: 'text-purple-400', borderClass: 'border-purple-500/60', bgClass: 'bg-purple-500/15', glowClass: 'shadow-[0_0_12px_rgba(168,85,247,0.35)]' },
  { gate: 'CZ', label: 'CZ', name: 'Controlled-Z', desc: 'Conditional phase-flip across two entangled qubits', textColor: 'text-indigo-400', borderClass: 'border-indigo-500/60', bgClass: 'bg-indigo-500/15', glowClass: 'shadow-[0_0_12px_rgba(99,102,241,0.35)]' },
  { gate: 'SWAP', label: 'SWAP', name: 'SWAP', desc: 'Exchanges quantum states of two qubits', textColor: 'text-sky-400', borderClass: 'border-sky-500/60', bgClass: 'bg-sky-500/15', glowClass: 'shadow-[0_0_12px_rgba(56,189,248,0.35)]' },
  { gate: 'MEASURE', label: 'M', name: 'Measure', desc: 'Collapses qubit state to classical bit {0, 1}', textColor: 'text-teal-400', borderClass: 'border-teal-500/60', bgClass: 'bg-teal-500/15', glowClass: 'shadow-[0_0_12px_rgba(20,184,166,0.35)]' },
  { gate: 'RESET', label: '|0⟩', name: 'Reset', desc: 'Purges entropy and initializes back to ground |0⟩', textColor: 'text-slate-300', borderClass: 'border-slate-500/60', bgClass: 'bg-slate-700/30', glowClass: 'shadow-sm' },
];

const GATE_MAP = new Map<SupportedGate, GateVisualMeta>(
  LAB_GATES_CONFIG.map((g) => [g.gate, g])
);

function formatDiracState(amplitudes?: StateAmplitude[]): string {
  if (!amplitudes || amplitudes.length === 0) return '|0⟩';
  const significant = amplitudes.filter((a) => a.magnitude > 0.01);
  if (significant.length === 0) return '|0⟩';
  return significant
    .map((a) => {
      const real = a.real;
      const imag = a.imag;
      const mag = a.magnitude;
      
      let coeffStr = '';
      if (Math.abs(mag - 1.0) < 0.02) {
        coeffStr = real < -0.9 ? '-' : '';
      } else if (Math.abs(mag - 0.7071) < 0.03) {
        if (Math.abs(imag) > 0.05) {
          coeffStr = `(${real < 0 ? '-' : ''}0.71 ${imag < 0 ? '-' : '+'} ${Math.abs(imag).toFixed(2)}i)`;
        } else {
          coeffStr = real < 0 ? '-1/√2' : '1/√2';
        }
      } else if (Math.abs(mag - 0.5) < 0.03) {
        coeffStr = real < 0 ? '-1/2' : '1/2';
      } else {
        coeffStr = (real < 0 ? '-' : '') + mag.toFixed(2);
      }
      
      return `${coeffStr}|${a.basis}⟩`;
    })
    .join(' + ')
    .replace(/\+ -/g, '- ');
}

export default function GuidedLabRunner() {
  const { labId } = useParams<{ labId: string }>();
  const navigate = useNavigate();
  const { recordCircuitRun } = useQuantumSession();

  const lab: GuidedLabDefinition | undefined = labId ? GUIDED_LABS[labId] : undefined;

  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [circuit, setCircuit] = useState<CircuitIR>(
    lab ? JSON.parse(JSON.stringify(lab.initialCircuit)) : { version: '1.0', qubits: 1, classicalBits: 1, operations: [] }
  );
  const [selectedGate, setSelectedGate] = useState<SupportedGate>('H');
  const [simResult, setSimResult] = useState<NormalizedSimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [labCompleted, setLabCompleted] = useState<boolean>(false);

  // Reset state when lab changes
  useEffect(() => {
    if (lab) {
      setCurrentStepIdx(0);
      setCompletedSteps(new Set());
      setCircuit(JSON.parse(JSON.stringify(lab.initialCircuit)));
      setSimResult(null);
      setShowHint(false);
      setLabCompleted(false);
    }
  }, [labId]);

  const currentStep: LabStep | undefined = lab?.steps[currentStepIdx];

  // Run simulation handler
  const handleRunSimulation = useCallback(async () => {
    if (!circuit) return;
    setIsSimulating(true);
    try {
      const res = await simulateCircuit(circuit, 1024);
      setSimResult(res);
      recordCircuitRun(circuit);
    } catch {
      // simulation fallback handled
    } finally {
      setIsSimulating(false);
    }
  }, [circuit, recordCircuitRun]);

  // Initial simulation
  useEffect(() => {
    handleRunSimulation();
  }, [circuit.operations.length]);

  // Validation evaluation for current step
  const validation = useMemo(() => {
    if (!currentStep) return { pass: false, reason: 'No active step.' };
    return currentStep.validate(circuit, simResult);
  }, [currentStep, circuit, simResult]);

  // Mark step completed when validation passes
  useEffect(() => {
    if (validation.pass && !completedSteps.has(currentStepIdx)) {
      setCompletedSteps((prev) => new Set([...prev, currentStepIdx]));
    }
  }, [validation.pass, currentStepIdx, completedSteps]);

  // Derive recommended action for the active checkpoint
  const recommendedAction = useMemo(() => {
    if (!currentStep) return null;
    const titleLower = currentStep.title.toLowerCase();
    const instrLower = currentStep.instruction.toLowerCase();

    let gate: SupportedGate = 'H';
    let qubit = 0;

    if (instrLower.includes('second hadamard') || instrLower.includes('second h') || (titleLower.includes('interference') && instrLower.includes('hadamard'))) {
      gate = 'H';
      qubit = 0;
    } else if (instrLower.includes('cnot') || instrLower.includes('cx')) {
      gate = 'CX';
      qubit = 0;
    } else if (instrLower.includes('measurement') || instrLower.includes('measure') || instrLower.includes('(m) gate')) {
      gate = 'MEASURE';
      // In bell state, check if q0 already has measure
      const q0HasMeasure = circuit.operations.some((o) => o.gate === 'MEASURE' && o.targets.includes(0));
      qubit = (instrLower.includes('both') && q0HasMeasure) ? 1 : 0;
    } else if (instrLower.includes('z gate') || instrLower.includes('pauli-z')) {
      gate = 'Z';
      qubit = 0;
    } else if (instrLower.includes('reset')) {
      gate = 'RESET';
      qubit = 0;
    } else if (instrLower.includes('x gate') || instrLower.includes('pauli-x')) {
      gate = 'X';
      qubit = 0;
    } else if (instrLower.includes('hadamard') || instrLower.includes('h gate')) {
      gate = 'H';
      qubit = 0;
    }

    // Determine target slot (first unoccupied step along that qubit wire)
    const occupiedSteps = new Set(
      circuit.operations
        .filter((o) => o.targets.includes(qubit) || (o.controls && o.controls.includes(qubit)))
        .map((o) => o.step)
    );
    let targetStep = 0;
    while (occupiedSteps.has(targetStep)) {
      targetStep++;
    }

    return {
      gate,
      qubit,
      targetStep,
      label: `Place ${gate} on Wire q${qubit} (Slot ${targetStep})`,
    };
  }, [currentStep, circuit]);

  // Synchronize palette gate with step recommendation
  useEffect(() => {
    if (recommendedAction) {
      setSelectedGate(recommendedAction.gate);
    }
  }, [currentStepIdx, recommendedAction?.gate]);

  // Advance to next step
  const handleNextStep = () => {
    if (!lab) return;
    if (currentStepIdx < lab.steps.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
      setShowHint(false);
    } else {
      setLabCompleted(true);
    }
  };

  // Direct helper to place recommended gate or next gate
  const handlePlaceRecommendedGate = (forcedGate?: SupportedGate, forcedQubit?: number, forcedStep?: number) => {
    const gate = forcedGate ?? recommendedAction?.gate ?? selectedGate;
    const qubit = forcedQubit ?? recommendedAction?.qubit ?? 0;

    let targetStep = forcedStep;
    if (targetStep === undefined) {
      const occupiedSteps = new Set(
        circuit.operations
          .filter((o) => o.targets.includes(qubit) || (o.controls && o.controls.includes(qubit)))
          .map((o) => o.step)
      );
      targetStep = 0;
      while (occupiedSteps.has(targetStep)) {
        targetStep++;
      }
    }

    const isMulti = (gate === 'CX' || gate === 'CZ' || gate === 'SWAP') && circuit.qubits > 1;
    const targetQubit = isMulti ? (qubit === circuit.qubits - 1 ? qubit - 1 : qubit + 1) : qubit;
    const controlQubit = isMulti ? qubit : undefined;

    const newOp: GateOperation = {
      id: `lab-op-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      gate,
      targets: isMulti ? [targetQubit] : [qubit],
      controls: controlQubit !== undefined ? [controlQubit] : [],
      step: targetStep,
      params: gate.startsWith('R') ? { theta: 1.5708 } : undefined,
    };

    setCircuit((prev) => ({
      ...prev,
      operations: [...prev.operations, newOp],
    }));
  };

  // Cell placement / removal on wire
  const handleCellClick = (qIdx: number, stepIdx: number) => {
    const existingIdx = circuit.operations.findIndex(
      (o) => o.step === stepIdx && (o.targets.includes(qIdx) || (o.controls && o.controls.includes(qIdx)))
    );

    // If gate already exists on this cell, remove it cleanly
    if (existingIdx >= 0) {
      const newOps = circuit.operations.filter((_, i) => i !== existingIdx);
      setCircuit({ ...circuit, operations: newOps });
      return;
    }

    // Otherwise place selected gate
    const isMulti = (selectedGate === 'CX' || selectedGate === 'CZ' || selectedGate === 'SWAP') && circuit.qubits > 1;
    const targetQubit = isMulti ? (qIdx === circuit.qubits - 1 ? qIdx - 1 : qIdx + 1) : qIdx;
    const controlQubit = isMulti ? qIdx : undefined;

    const newOp: GateOperation = {
      id: `lab-op-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      gate: selectedGate,
      targets: isMulti ? [targetQubit] : [qIdx],
      controls: controlQubit !== undefined ? [controlQubit] : [],
      step: stepIdx,
      params: selectedGate.startsWith('R') ? { theta: 1.5708 } : undefined,
    };

    setCircuit({ ...circuit, operations: [...circuit.operations, newOp] });
  };

  const handleResetCircuit = () => {
    if (!lab) return;
    setCircuit(JSON.parse(JSON.stringify(lab.initialCircuit)));
    setSimResult(null);
  };

  const handleClearCircuit = () => {
    setCircuit({ ...circuit, operations: [] });
    setSimResult(null);
  };

  if (!lab) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-semibold text-text-primary">Virtual Lab Not Found</h2>
        <p className="text-sm text-text-muted">The requested guided experiment does not exist.</p>
        <Link to="/labs" className="btn btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Virtual Labs</span>
        </Link>
      </div>
    );
  }

  const primaryBlochVector = simResult?.reducedStates?.[0]?.blochVector ?? { x: 0, y: 0, z: 1 };
  const totalSlots = Math.max(8, circuit.operations.reduce((m, o) => Math.max(m, o.step), 0) + 4);
  const activeGateMeta = GATE_MAP.get(selectedGate) ?? LAB_GATES_CONFIG[0];
  const diracFormula = formatDiracState(simResult?.statevector);
  const depth = circuit.operations.length > 0 ? Math.max(...circuit.operations.map((o) => o.step)) + 1 : 0;

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-8 space-y-6">
      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/labs"
            className="p-2 rounded-lg border border-border bg-surface-secondary text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-brand font-semibold flex items-center gap-1">
                <FlaskConical className="w-3 h-3 text-brand" />
                Guided Virtual Lab (Phase 7)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-secondary text-text-muted border border-border">
                {lab.difficulty}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-soft text-brand font-mono">
                {lab.estimatedTime}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-semibold text-text-primary tracking-tight">{lab.title}</h1>
          </div>
        </div>

        {/* Step Navigation Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-secondary border border-border rounded-xl text-xs shadow-inner">
          {lab.steps.map((st, idx) => {
            const isDone = completedSteps.has(idx);
            const isCurrent = currentStepIdx === idx;
            return (
              <button
                key={st.id}
                onClick={() => setCurrentStepIdx(idx)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-brand text-white font-semibold shadow-md shadow-brand/25'
                    : isDone
                    ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <span className="font-mono">{idx + 1}</span>}
                <span className="hidden sm:inline">Checkpoint {idx + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Two-Column Layout ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left Column: Guided Instructions & Active Validation (5 cols) ─── */}
        <div className="lg:col-span-5 space-y-5">
          {/* Step Guide Card */}
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center shadow-sm">
                  {currentStepIdx + 1}
                </span>
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Checkpoint {currentStepIdx + 1} of {lab.steps.length}
                </span>
              </div>
              <span className="text-[11px] text-text-muted font-mono">{lab.conceptCovered}</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-bold text-text-primary tracking-tight">{currentStep?.title}</h2>
              <p className="text-xs text-text-secondary leading-relaxed font-normal">
                {currentStep?.instruction}
              </p>
            </div>

            {/* Quick Action Button for learners to immediately place required gate */}
            {!validation.pass && recommendedAction && (
              <div className="p-3 rounded-xl bg-brand-soft/40 border border-brand/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-brand flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    Recommended Action:
                  </span>
                  <span className="text-[10px] font-mono text-text-muted">Slot {recommendedAction.targetStep}</span>
                </div>
                <button
                  onClick={() => handlePlaceRecommendedGate()}
                  className="w-full py-2 px-3 rounded-lg bg-brand hover:bg-brand/90 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-brand/20 transition-all hover:scale-[1.01]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{recommendedAction.label}</span>
                </button>
              </div>
            )}

            {/* Hint Accordion */}
            <div className="space-y-1.5 pt-1">
              <button
                onClick={() => setShowHint((prev) => !prev)}
                className="text-xs text-brand hover:underline flex items-center gap-1.5 font-medium transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>{showHint ? 'Hide Hint' : 'Need a hint?'}</span>
              </button>
              {showHint && (
                <div className="p-3.5 rounded-xl bg-surface-secondary border border-border text-xs text-text-secondary leading-relaxed animate-in fade-in duration-200">
                  <span className="font-semibold text-text-primary block mb-1">💡 Hint:</span>
                  {currentStep?.hint}
                </div>
              )}
            </div>

            {/* Active Circuit Validation Status */}
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 transition-all ${
                validation.pass
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
              }`}
            >
              {validation.pass ? (
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
              )}
              <div className="space-y-1">
                <span className="font-bold block tracking-wide">
                  {validation.pass ? 'Objective Verified' : 'Checkpoint Requirement Pending'}
                </span>
                <p className="text-[11px] leading-relaxed opacity-90">{validation.reason}</p>
              </div>
            </div>

            {/* Target Explanation Unlocked */}
            {validation.pass && currentStep && (
              <div className="p-3.5 rounded-xl bg-surface-secondary border border-brand/20 text-xs space-y-1.5 animate-in fade-in duration-200">
                <span className="font-semibold text-text-primary flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-brand" />
                  <span>Physical Insight Unlocked</span>
                </span>
                <p className="text-[11px] text-text-secondary leading-relaxed font-normal">
                  {currentStep.targetExplanation}
                </p>
              </div>
            )}

            {/* Next Action Button */}
            <div className="pt-2 flex items-center justify-between border-t border-border">
              <span className="text-[11px] text-text-muted">
                {validation.pass ? 'Objective complete! Ready to advance.' : 'Place required gate & simulate.'}
              </span>

              <button
                onClick={handleNextStep}
                disabled={!validation.pass}
                className="btn btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-md shadow-brand/20 disabled:opacity-40 transition-all"
              >
                <span>{currentStepIdx < lab.steps.length - 1 ? 'Next Checkpoint' : 'Complete Lab'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Completion Celebration Card */}
          {labCompleted && (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 space-y-3 shadow-lg shadow-emerald-950/20 animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm">Virtual Lab Completed!</span>
              </div>
              <p className="text-xs text-emerald-300/90 leading-relaxed font-normal">
                You have verified all physical objectives for <strong>{lab.title}</strong> with full mathematical rigor and simulation telemetry.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <Link to="/labs" className="btn btn-primary text-xs px-3.5 py-1.5">
                  Back to Labs Index
                </Link>
                <Link to="/labs/studio" className="btn btn-ghost text-xs px-3.5 py-1.5 border border-border">
                  Open in Circuit Studio
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column: Interactive Circuit Canvas & State Inspector (7 cols) ── */}
        <div className="lg:col-span-7 space-y-5">
          {/* Circuit Canvas Container */}
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand" />
                <span className="text-xs font-bold text-text-primary">Lab Circuit Workspace</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-secondary text-text-muted border border-border">
                  {circuit.operations.length} gate{circuit.operations.length === 1 ? '' : 's'} · Depth {depth}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearCircuit}
                  className="btn btn-ghost text-xs px-2.5 py-1 text-text-muted hover:text-rose-400 transition-colors"
                  title="Clear all gates"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
                <button
                  onClick={handleResetCircuit}
                  className="btn btn-ghost text-xs px-2.5 py-1 text-text-muted hover:text-text-primary transition-colors"
                  title="Reset to lab initial state"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
                <button
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  className="btn btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5 shadow-md shadow-brand/20"
                >
                  <Play className={`w-3 h-3 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
                  <span>{isSimulating ? 'Simulating...' : 'Run Circuit'}</span>
                </button>
              </div>
            </div>

            {/* Gate Palette Bar with rich styling */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold block">
                  Select Gate to Place
                </span>
                <span className="text-[11px] font-mono text-brand font-medium">
                  {activeGateMeta.name}: <span className="text-text-muted font-normal">{activeGateMeta.desc}</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {LAB_GATES_CONFIG.map((g) => {
                  const isSelected = selectedGate === g.gate;
                  return (
                    <button
                      key={g.gate}
                      onClick={() => setSelectedGate(g.gate)}
                      className={`h-8 px-3 rounded-lg border font-mono text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? `${g.borderClass} ${g.bgClass} ${g.textColor} ${g.glowClass} scale-105 ring-1 ring-brand/40`
                          : 'border-border bg-surface-secondary/70 hover:border-brand/40 text-text-secondary hover:text-text-primary'
                      }`}
                      title={`${g.name}: ${g.desc}`}
                    >
                      <span>{g.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Wire Board with Authentic Step Columns and Visual Drop Targets */}
            <div className="overflow-x-auto py-3 bg-surface-secondary/40 rounded-xl border border-border/80 p-3">
              <div className="min-w-[520px] space-y-4">
                {/* Step Column Labels */}
                <div className="flex items-center gap-3 pl-12 text-[10px] font-mono text-text-muted font-semibold">
                  <div className="flex-1 flex items-center justify-between px-1">
                    {Array.from({ length: totalSlots }).map((_, stepIdx) => {
                      const isTarget = recommendedAction?.targetStep === stepIdx;
                      return (
                        <div
                          key={stepIdx}
                          className={`w-9 text-center tracking-wider transition-colors ${
                            isTarget ? 'text-brand font-bold' : 'text-text-muted'
                          }`}
                        >
                          S{stepIdx}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Qubit Wires */}
                {Array.from({ length: circuit.qubits }).map((_, qIdx) => (
                  <div key={qIdx} className="flex items-center gap-3 relative group">
                    {/* Qubit Label Badge */}
                    <div className="w-10 h-10 rounded-xl bg-surface border border-border flex flex-col items-center justify-center font-mono font-bold text-text-primary shadow-sm shrink-0">
                      <span className="text-[11px]">q{qIdx}</span>
                      <span className="text-[8px] text-text-muted font-normal">|0⟩</span>
                    </div>

                    {/* Wire Rail Container */}
                    <div className="flex-1 flex items-center relative h-12">
                      {/* Horizontal Circuit Wire Line */}
                      <div className="absolute inset-x-0 h-[2px] bg-slate-700/60 dark:bg-slate-700 group-hover:bg-brand/40 transition-colors pointer-events-none" />

                      {/* Interactive Step Slots */}
                      <div className="relative w-full flex items-center justify-between px-1">
                        {Array.from({ length: totalSlots }).map((_, stepIdx) => {
                          const op = circuit.operations.find(
                            (o) => o.step === stepIdx && (o.targets.includes(qIdx) || (o.controls && o.controls.includes(qIdx)))
                          );
                          const isControl = op?.controls?.includes(qIdx);
                          const opGate = op ? (GATE_MAP.get(op.gate) ?? {
                            label: op.gate,
                            textColor: 'text-brand',
                            borderClass: 'border-brand',
                            bgClass: 'bg-surface',
                            glowClass: '',
                          }) : null;

                          const isRecommendedSlot = !op && recommendedAction?.qubit === qIdx && recommendedAction?.targetStep === stepIdx;

                          return (
                            <button
                              key={stepIdx}
                              onClick={() => handleCellClick(qIdx, stepIdx)}
                              className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all z-10 font-mono text-xs font-bold relative group/slot cursor-pointer ${
                                op
                                  ? isControl
                                    ? 'bg-brand text-white border-brand shadow-md shadow-brand/30'
                                    : `${opGate?.bgClass} ${opGate?.borderClass} ${opGate?.textColor} ${opGate?.glowClass} shadow-sm hover:border-rose-500 hover:text-rose-400`
                                  : isRecommendedSlot
                                  ? 'border-dashed border-cyan-400/80 bg-cyan-500/10 text-cyan-400 ring-2 ring-cyan-500/20 animate-pulse'
                                  : 'border-dashed border-slate-700/60 dark:border-white/10 bg-surface/50 hover:border-brand/70 hover:bg-brand/10 hover:shadow-sm text-text-muted'
                              }`}
                              title={
                                op
                                  ? `Remove ${op.gate} (Slot ${stepIdx})`
                                  : isRecommendedSlot
                                  ? `Target: Click to place ${selectedGate} here`
                                  : `Click to place ${selectedGate} at Slot ${stepIdx}`
                              }
                            >
                              {op ? (
                                isControl ? (
                                  <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                                ) : (
                                  <>
                                    <span>{op.gate === 'MEASURE' ? 'M' : op.gate}</span>
                                    {/* Hover Remove Indicator */}
                                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[8px] opacity-0 group-hover/slot:opacity-100 transition-opacity shadow-sm">
                                      ✕
                                    </div>
                                  </>
                                )
                              ) : isRecommendedSlot ? (
                                <span className="text-[10px] font-bold text-cyan-400 flex items-center">
                                  +{selectedGate}
                                </span>
                              ) : (
                                <span className="opacity-30 group-hover/slot:opacity-100 text-[10px] text-text-muted group-hover/slot:text-brand font-semibold transition-opacity">
                                  +
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Helper Subtext */}
            <div className="flex items-center justify-between text-[11px] text-text-muted px-1">
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-brand" />
                <span>Click any dashed slot to place <strong>{selectedGate}</strong>. Click an existing gate to remove it.</span>
              </span>
              <span className="font-mono text-[10px]">Qubits: {circuit.qubits} · Bits: {circuit.classicalBits}</span>
            </div>
          </div>

          {/* State Output & Bloch Sphere Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Probability Bars & Dirac State */}
            <div className="p-4 rounded-2xl bg-surface border border-border shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-brand" />
                  Born Rule Probabilities
                </span>
                <span className="text-[10px] font-mono text-text-muted">1024 shots</span>
              </div>

              {simResult?.probabilities ? (
                <div className="space-y-2.5">
                  {Object.entries(simResult.probabilities).map(([st, prob]) => {
                    const pct = (prob * 100).toFixed(1);
                    return (
                      <div key={st} className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="font-bold text-text-primary">|{st}⟩</span>
                          <span className="text-brand font-bold">{pct}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-surface-secondary border border-border overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand to-cyan-400 rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-text-muted">Simulate circuit to inspect probabilities.</div>
              )}

              {/* Statevector Dirac Representation */}
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-[10px] font-mono text-text-muted uppercase">Statevector |ψ⟩:</span>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  |ψ⟩ = {diracFormula}
                </span>
              </div>
            </div>

            {/* 3D Bloch Sphere */}
            <div className="p-4 rounded-2xl bg-surface border border-border shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-text-primary flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-brand" />
                  Bloch Sphere State
                </span>
                <span className="font-mono text-[10px] text-text-muted">
                  x: {primaryBlochVector.x.toFixed(2)}, y: {primaryBlochVector.y.toFixed(2)}, z: {primaryBlochVector.z.toFixed(2)}
                </span>
              </div>
              <div className="w-full h-36 bg-surface-secondary rounded-xl border border-border overflow-hidden relative flex items-center justify-center">
                <BlochSphere3D state={primaryBlochVector} health={100} history={[]} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

