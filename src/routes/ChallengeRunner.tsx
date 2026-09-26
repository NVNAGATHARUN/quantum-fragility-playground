import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Award, ArrowLeft, Play, RotateCcw, CheckCircle2, AlertTriangle,
  Layers, Code, ShieldCheck, Sparkles, Bug, Eye, Zap, RefreshCw,
  Cpu, FileCheck
} from 'lucide-react';
import {
  getChallenge,
  evaluateChallenge,
  type ChallengeDefinition,
  type AssessmentResult,
} from '../api/challenges';
import type { CircuitIR, GateOperation, SupportedGate, NormalizedSimulationResult } from '../types/quantum';
import { simulateCircuit } from '../api/quantum';
import BlochSphere3D from '../components/BlochSphere3D';
import { useQuantumSession } from '../providers/QuantumSessionProvider';
import { useAuth } from '../providers/AuthProvider';

const CHALLENGE_GATES: Array<{ gate: SupportedGate; label: string }> = [
  { gate: 'H', label: 'H' },
  { gate: 'X', label: 'X' },
  { gate: 'Y', label: 'Y' },
  { gate: 'Z', label: 'Z' },
  { gate: 'S', label: 'S' },
  { gate: 'T', label: 'T' },
  { gate: 'CX', label: 'CX' },
  { gate: 'CZ', label: 'CZ' },
  { gate: 'SWAP', label: 'SWAP' },
  { gate: 'MEASURE', label: 'M' },
  { gate: 'RESET', label: '|0⟩' },
];

export default function ChallengeRunner() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const { recordCircuitRun } = useQuantumSession();
  const { token, isAuthenticated, openAuthModal } = useAuth();

  const [challenge, setChallenge] = useState<ChallengeDefinition | null>(null);
  const [circuit, setCircuit] = useState<CircuitIR>({
    version: '1.0',
    qubits: 2,
    classicalBits: 2,
    operations: [],
  });
  const [selectedGate, setSelectedGate] = useState<SupportedGate>('H');
  const [simResult, setSimResult] = useState<NormalizedSimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Prediction challenge inputs
  const [predP0, setPredP0] = useState<string>('0.50');
  const [predP1, setPredP1] = useState<string>('0.50');

  // Load challenge
  useEffect(() => {
    if (!challengeId) return;
    getChallenge(challengeId)
      .then((ch) => {
        setChallenge(ch);
        setCircuit(JSON.parse(JSON.stringify(ch.starter_circuit)));
        setAssessment(null);
      })
      .catch((err) => setErrorMsg(err.message || 'Challenge not found'));
  }, [challengeId]);

  // Run simulation preview
  const handleSimulate = async () => {
    if (!circuit) return;
    setIsSimulating(true);
    try {
      const res = await simulateCircuit(circuit, 1024);
      setSimResult(res);
      recordCircuitRun(circuit);
    } catch {
      // preview error handled
    } finally {
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    if (circuit.operations.length > 0) {
      handleSimulate();
    }
  }, [circuit.operations.length]);

  // Submit and evaluate against assessment engine
  const handleRunEvaluation = async () => {
    if (!challengeId) return;
    setIsEvaluating(true);
    setErrorMsg(null);
    try {
      const predDict = challenge?.type === 'predict'
        ? { '0': parseFloat(predP0) || 0, '1': parseFloat(predP1) || 0 }
        : undefined;

      const res = await evaluateChallenge(challengeId, circuit, predDict, token);
      setAssessment(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Evaluation failed');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Wire gate placement
  const handleCellClick = (qIdx: number, stepIdx: number) => {
    const existingIdx = circuit.operations.findIndex(
      (o) => o.step === stepIdx && (o.targets.includes(qIdx) || (o.controls && o.controls.includes(qIdx)))
    );

    if (existingIdx >= 0) {
      const newOps = circuit.operations.filter((_, i) => i !== existingIdx);
      setCircuit({ ...circuit, operations: newOps });
      return;
    }

    const isMulti = selectedGate === 'CX' || selectedGate === 'CZ' || selectedGate === 'SWAP';
    const targetQubit = isMulti ? (qIdx === circuit.qubits - 1 ? qIdx - 1 : qIdx + 1) : qIdx;
    const controlQubit = isMulti ? qIdx : undefined;

    const newOp: GateOperation = {
      id: `ch-op-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      gate: selectedGate,
      targets: isMulti ? [targetQubit] : [qIdx],
      controls: controlQubit !== undefined ? [controlQubit] : [],
      step: stepIdx,
      params: selectedGate.startsWith('R') ? { theta: 1.5708 } : undefined,
    };

    setCircuit({ ...circuit, operations: [...circuit.operations, newOp] });
  };

  const handleResetStarter = () => {
    if (challenge) {
      setCircuit(JSON.parse(JSON.stringify(challenge.starter_circuit)));
      setSimResult(null);
      setAssessment(null);
    }
  };

  if (!challenge) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-semibold text-text-primary">Challenge Not Found</h2>
        <Link to="/labs/challenges" className="btn btn-primary inline-flex items-center gap-2 text-xs">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Challenge Catalog</span>
        </Link>
      </div>
    );
  }

  const primaryBlochVector = simResult?.reducedStates?.[0]?.blochVector ?? { x: 0, y: 0, z: 1 };
  const totalSlots = Math.max(8, circuit.operations.reduce((m, o) => Math.max(m, o.step), 0) + 3);
  const currentGateCount = circuit.operations.length;
  const currentDepth = Math.max(0, ...circuit.operations.map((o) => o.step + 1));

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-8 space-y-6">
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/labs/challenges"
            className="p-1.5 rounded-lg border border-border bg-surface-secondary text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-brand font-semibold">
                Challenge Mode ({challenge.type.toUpperCase()})
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-secondary text-text-muted border border-border font-mono">
                {challenge.difficulty}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-semibold text-text-primary">{challenge.title}</h1>
          </div>
        </div>

        {/* Action Button: Run Evaluation */}
        <button
          onClick={handleRunEvaluation}
          disabled={isEvaluating}
          className="btn btn-primary text-xs px-4 py-2 flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          {isEvaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          <span>{isEvaluating ? 'Grading Unit Tests...' : 'Run Test Suite & Grade'}</span>
        </button>
      </div>

      {/* ── Main Two-Column Layout ────────────────────────────────────────── */}
      {!isAuthenticated && (
        <div className="p-3 rounded-xl border border-brand/30 bg-brand/10 text-xs text-text-secondary flex items-center justify-between gap-3">
          <span>Your circuit can be graded anonymously. Sign in to save the verified attempt to your progress.</span>
          <button className="btn btn-primary text-xs px-3 py-1.5" onClick={() => openAuthModal('login')}>Sign in</button>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left Column: Instructions, Constraints & Assessment Results (5 cols) ── */}
        <div className="lg:col-span-5 space-y-5">
          {/* Instructions Card */}
          <div className="p-5 rounded-xl bg-surface border border-border shadow-subtle space-y-3">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-brand" />
              <span>Challenge Objective</span>
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed font-normal">
              {challenge.instructions}
            </p>
            <div className="pt-2 border-t border-border flex justify-between text-[11px] font-mono">
              <span className="text-text-muted">Target Requirement:</span>
              <span className="text-brand font-semibold">{challenge.target_description}</span>
            </div>
          </div>

          {/* Constraints Tracker */}
          <div className="p-4 rounded-xl bg-surface-secondary border border-border space-y-2 text-xs">
            <span className="font-semibold text-text-primary block text-[11px] uppercase tracking-wider">
              Verification Constraints
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded bg-surface border border-border">
                <span className="text-text-muted block text-[10px]">Gate Count</span>
                <span className={`font-semibold ${challenge.max_gates && currentGateCount > challenge.max_gates ? 'text-rose-600' : 'text-text-primary'}`}>
                  {currentGateCount} {challenge.max_gates ? `/ max ${challenge.max_gates}` : ''}
                </span>
              </div>
              <div className="p-2 rounded bg-surface border border-border">
                <span className="text-text-muted block text-[10px]">Circuit Depth</span>
                <span className={`font-semibold ${challenge.max_depth && currentDepth > challenge.max_depth ? 'text-rose-600' : 'text-text-primary'}`}>
                  {currentDepth} {challenge.max_depth ? `/ max ${challenge.max_depth}` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Prediction Input Form (For Predict Challenges) */}
          {challenge.type === 'predict' && (
            <div className="p-4 rounded-xl bg-surface border border-border shadow-subtle space-y-3 text-xs">
              <span className="font-semibold text-text-primary block text-xs">
                Submit Measurement Prediction
              </span>
              <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
                <div className="space-y-1">
                  <span className="text-text-muted">P(|0⟩):</span>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={predP0}
                    onChange={(e) => setPredP0(e.target.value)}
                    className="w-full p-2 rounded bg-surface-secondary border border-border text-text-primary text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-text-muted">P(|1⟩):</span>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={predP1}
                    onChange={(e) => setPredP1(e.target.value)}
                    className="w-full p-2 rounded bg-surface-secondary border border-border text-text-primary text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Assessment Grading Results Card */}
          {assessment && (
            <div
              className={`p-5 rounded-xl border space-y-4 shadow-subtle ${
                assessment.passed
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {assessment.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  )}
                  <span className="font-bold text-sm">
                    {assessment.passed ? 'Challenge Passed!' : 'Unit Tests Incomplete'}
                  </span>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface border border-border text-text-primary">
                  Score: {assessment.score}%
                </span>
              </div>

              {assessment.fidelity !== null && assessment.fidelity !== undefined && (
                <div className="text-[11px] font-mono flex justify-between pt-1 border-t border-border/40">
                  <span>Unitary / State Fidelity:</span>
                  <span className="font-bold">{(assessment.fidelity * 100).toFixed(2)}%</span>
                </div>
              )}

              {/* Test Cases Table */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider block opacity-75">
                  Unit Test Suite ({assessment.test_cases.length} tests)
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {assessment.test_cases.map((tc, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded bg-surface border border-border text-text-primary text-[11px] space-y-1 font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{tc.name}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${tc.passed ? 'text-emerald-600 bg-emerald-500/10' : 'text-rose-600 bg-rose-500/10'}`}>
                          {tc.passed ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                      <div className="text-[10px] text-text-muted flex justify-between">
                        <span>Expected: {tc.expected}</span>
                        <span>Actual: {tc.actual}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback messages */}
              {assessment.feedback.length > 0 && (
                <div className="text-[11px] space-y-1 pt-2 border-t border-border/40 leading-relaxed">
                  {assessment.feedback.map((f, i) => (
                    <p key={i}>• {f}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right Column: Interactive Circuit Canvas & Preview (7 cols) ──── */}
        <div className="lg:col-span-7 space-y-5">
          {/* Circuit Canvas */}
          <div className="p-5 rounded-xl bg-surface border border-border shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand" />
                <span className="text-xs font-semibold text-text-primary">Challenge Circuit Canvas</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetStarter}
                  className="btn btn-ghost text-xs px-2.5 py-1 text-text-muted hover:text-text-primary"
                  title="Reset to starter circuit"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Starter</span>
                </button>
                <button
                  onClick={handleSimulate}
                  disabled={isSimulating}
                  className="btn btn-primary text-xs px-3 py-1 flex items-center gap-1 shadow-sm"
                >
                  <Play className={`w-3 h-3 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
                  <span>{isSimulating ? 'Running...' : 'Simulate'}</span>
                </button>
              </div>
            </div>

            {/* Gate Palette Bar */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold block">
                Palette
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CHALLENGE_GATES.map((g) => (
                  <button
                    key={g.gate}
                    onClick={() => setSelectedGate(g.gate)}
                    className={`h-7 px-2.5 rounded-md border font-mono text-xs font-medium transition-all ${
                      selectedGate === g.gate
                        ? 'border-brand bg-brand-soft text-brand font-semibold shadow-sm'
                        : 'border-border bg-surface hover:border-brand/40 text-text-primary'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Wire Board */}
            <div className="overflow-x-auto py-2">
              <div className="min-w-[380px] space-y-3">
                {Array.from({ length: circuit.qubits }).map((_, qIdx) => (
                  <div key={qIdx} className="flex items-center gap-3 relative group">
                    <div className="w-8 h-8 rounded-md bg-surface-secondary border border-border flex items-center justify-center text-xs font-mono font-semibold text-text-secondary shadow-sm shrink-0">
                      q{qIdx}
                    </div>

                    <div className="flex-1 flex items-center relative h-8">
                      <div className="absolute inset-x-0 h-[1.5px] bg-border group-hover:bg-brand/30 transition-colors" />

                      <div className="relative w-full flex items-center justify-between gap-1.5">
                        {Array.from({ length: totalSlots }).map((_, stepIdx) => {
                          const op = circuit.operations.find(
                            (o) => o.step === stepIdx && (o.targets.includes(qIdx) || (o.controls && o.controls.includes(qIdx)))
                          );
                          const isControl = op?.controls?.includes(qIdx);

                          return (
                            <button
                              key={stepIdx}
                              onClick={() => handleCellClick(qIdx, stepIdx)}
                              className={`w-7 h-7 rounded border flex items-center justify-center transition-all z-10 font-mono text-xs font-semibold ${
                                op
                                  ? isControl
                                    ? 'bg-brand text-white border-brand shadow-sm'
                                    : 'bg-surface border-brand text-brand shadow-sm hover:border-rose-500 hover:text-rose-600'
                                  : 'border-transparent hover:border-border hover:bg-surface-secondary'
                              }`}
                              title={op ? `Remove ${op.gate}` : `Place ${selectedGate}`}
                            >
                              {op ? (
                                isControl ? (
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                ) : (
                                  op.gate
                                )
                              ) : (
                                <span className="opacity-0 hover:opacity-40 text-text-muted text-[10px]">+</span>
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
          </div>

          {/* Real-time State Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Probability Bars */}
            <div className="p-4 rounded-xl bg-surface border border-border shadow-subtle space-y-3">
              <span className="text-xs font-semibold text-text-primary block">
                Born Rule Probabilities
              </span>
              {simResult?.probabilities ? (
                <div className="space-y-2">
                  {Object.entries(simResult.probabilities).map(([st, prob]) => {
                    const pct = (prob * 100).toFixed(1);
                    return (
                      <div key={st} className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="font-semibold text-text-primary">|{st}⟩</span>
                          <span className="text-brand font-semibold">{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-surface-secondary border border-border overflow-hidden">
                          <div className="h-full bg-brand rounded-full transition-all duration-200" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-text-muted">Simulate circuit to inspect probabilities.</div>
              )}
            </div>

            {/* 3D Bloch Sphere */}
            <div className="p-4 rounded-xl bg-surface border border-border shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-text-primary">Bloch Sphere State</span>
                <span className="font-mono text-[10px] text-text-muted">Qubit 0</span>
              </div>
              <div className="w-full h-36 bg-surface-secondary rounded-lg border border-border overflow-hidden relative flex items-center justify-center">
                <BlochSphere3D state={primaryBlochVector} health={100} history={[]} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
