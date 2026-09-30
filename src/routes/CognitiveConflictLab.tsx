import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  AlertTriangle,
  CheckCircle2,
  Play,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Layers,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  TrendingDown,
  Compass,
} from 'lucide-react';

import { Card, Badge, SectionHeader } from '../components/UI';
import { simulateCircuit, evaluatePrediction, type CognitiveDeltaResponse } from '../api/quantum';
import { CANONICAL_CONFLICT_LABS } from '../api/conflictLabsData';
import { useQuantumSession } from '../providers/QuantumSessionProvider';
import type { CircuitIR, NormalizedSimulationResult } from '../types/quantum';

export default function CognitiveConflictLab() {
  const { recordLabCompletion, recordCircuitRun } = useQuantumSession();
  const [selectedLabId, setSelectedLabId] = useState<string>('lab-m01-interference');
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);

  // Hypothesis & Prediction state
  const [predictionP0, setPredictionP0] = useState<number>(0.5); // student's predicted P(|0>)
  const [selectedHypothesisKey, setSelectedHypothesisKey] = useState<'naive' | 'quantum' | 'custom'>('naive');

  // Simulation & Delta state
  const [simResults, setSimResults] = useState<Record<number, NormalizedSimulationResult>>({});
  const [deltaEvaluations, setDeltaEvaluations] = useState<Record<number, CognitiveDeltaResponse>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasEvaluated, setHasEvaluated] = useState<boolean>(false);

  // Verification Challenge state
  const [challengePredictedP0, setChallengePredictedP0] = useState<number>(0.5);
  const [challengeResult, setChallengeResult] = useState<NormalizedSimulationResult | null>(null);
  const [challengeDelta, setChallengeDelta] = useState<CognitiveDeltaResponse | null>(null);
  const [challengeVerified, setChallengeVerified] = useState<boolean>(false);
  const [challengeLoading, setChallengeLoading] = useState<boolean>(false);

  const lab = CANONICAL_CONFLICT_LABS[selectedLabId];

  // Set default naive prediction when switching lab
  useEffect(() => {
    setActiveStepIdx(0);
    setSimResults({});
    setDeltaEvaluations({});
    setHasEvaluated(false);
    setChallengeResult(null);
    setChallengeDelta(null);
    setChallengeVerified(false);

    // Initial hypothesis default
    if (selectedLabId === 'lab-m01-interference') {
      setSelectedHypothesisKey('naive');
      setPredictionP0(0.5);
    } else if (selectedLabId === 'lab-m02-no-signaling') {
      setSelectedHypothesisKey('naive');
      setPredictionP0(0.0); // Naive belief Bob sees deterministic signal
    } else {
      setSelectedHypothesisKey('naive');
      setPredictionP0(0.5);
    }
  }, [selectedLabId]);

  // Run simulation and evaluate Cognitive Delta
  const handleTestHypothesis = async () => {
    setIsLoading(true);
    try {
      const stepData = lab.steps[activeStepIdx];
      const res = await simulateCircuit(stepData.circuit, 1024);
      setSimResults(prev => ({ ...prev, [activeStepIdx]: res }));
      recordCircuitRun(stepData.circuit);

      // Extract actual probabilities
      const actualP0 = res.probabilities['0'] ?? (res.probabilities['00'] ?? 0.5);
      const actualP1 = res.probabilities['1'] ?? (res.probabilities['11'] ?? 0.5);

      const predProbs: Record<string, number> = {
        '0': predictionP0,
        '1': Math.round((1.0 - predictionP0) * 100) / 100,
      };
      const actualProbs: Record<string, number> = {
        '0': actualP0,
        '1': actualP1,
      };

      const conceptKey =
        lab.misconceptionId === 'M01'
          ? 'superposition'
          : lab.misconceptionId === 'M02'
          ? 'no-signaling'
          : 'coherence';

      const evalRes = await evaluatePrediction({
        conceptKey,
        predictedProbabilities: predProbs,
        actualProbabilities: actualProbs,
      });

      setDeltaEvaluations(prev => ({ ...prev, [activeStepIdx]: evalRes }));
      setHasEvaluated(true);
    } catch (err) {
      console.error('Failed to run conflict step simulation', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Run Verification Challenge
  const handleVerifyChallenge = async () => {
    if (!lab.challengeCircuit) return;
    setChallengeLoading(true);
    try {
      const res = await simulateCircuit(lab.challengeCircuit, 1024);
      setChallengeResult(res);
      recordCircuitRun(lab.challengeCircuit);

      const actualP0 = res.probabilities['0'] ?? 0.0;
      const actualP1 = res.probabilities['1'] ?? 0.0;

      const evalRes = await evaluatePrediction({
        conceptKey: 'challenge',
        predictedProbabilities: {
          '0': challengePredictedP0,
          '1': Math.round((1 - challengePredictedP0) * 100) / 100,
        },
        actualProbabilities: { '0': actualP0, '1': actualP1 },
      });

      setChallengeDelta(evalRes);
      if (evalRes.cognitiveDelta <= 0.10) {
        setChallengeVerified(true);
        // Record completion to student profile
        recordLabCompletion({
          labId: lab.labId,
          misconceptionId: lab.misconceptionId,
          title: lab.title,
          prediction: { '0': challengePredictedP0, '1': 1 - challengePredictedP0 },
          actual: { '0': actualP0, '1': actualP1 },
          tvd: evalRes.cognitiveDelta,
          resolved: true,
          evidence: `Verified via challenge circuit with Cognitive Delta TVD = ${evalRes.cognitiveDelta.toFixed(3)}. ${lab.verificationChallenge}`,
        });
      }
    } catch (err) {
      console.error('Failed to verify challenge circuit', err);
    } finally {
      setChallengeLoading(false);
    }
  };

  const currentStep = lab.steps[activeStepIdx];
  const currentSim = simResults[activeStepIdx];
  const currentEval = deltaEvaluations[activeStepIdx];

  return (
    <div className="flex flex-col gap-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-16 pb-16 border-b border-brand-border">
        <div>
          <div className="flex items-center gap-8">
            <h1 className="text-2xl sm:text-3xl font-orbitron font-bold tracking-wide bg-gradient-to-r from-amber-400 to-cyan-400 bg-clip-text text-transparent">
              Cognitive Conflict Laboratory
            </h1>
            <Badge color="gold">Interactive Inquiry</Badge>
            <Badge color="cyan">Qiskit Aer Ground Truth</Badge>
          </div>
          <p className="text-text-secondary text-sm mt-4">
            Scientifically curated 90-second experiments that falsify flawed classical mental models through empirical measurement.
          </p>
        </div>

        {/* Lab Selector Tabs */}
        <div className="flex items-center gap-8 overflow-x-auto pb-4">
          {Object.entries(CANONICAL_CONFLICT_LABS).map(([id, item]) => (
            <button
              key={id}
              onClick={() => setSelectedLabId(id)}
              className={`px-14 py-10 rounded-xl text-xs font-orbitron font-bold whitespace-nowrap transition-all border ${
                selectedLabId === id
                  ? 'bg-brand-primary/20 border-brand-primary text-brand-primary shadow-glow-primary'
                  : 'bg-surface border-brand-border text-text-muted hover:text-text-primary'
              }`}
            >
              {item.misconceptionId}: {item.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Scientific Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-start">
        {/* Left Column: Hypothesis Diagnostic & Stepper (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-20">
          {/* Diagnostic Card */}
          <Card className="p-20 bg-surface/60 border-brand-border">
            <div className="flex items-center gap-8 text-amber-400 font-bold text-xs uppercase tracking-wider mb-8">
              <AlertTriangle className="w-16 h-16" />
              <span>Target Misconception ({lab.misconceptionId})</span>
            </div>
            <h2 className="text-sm font-bold text-text-primary mb-8 font-orbitron">{lab.title}</h2>
            <div className="text-xs text-amber-200 leading-relaxed bg-amber-950/20 p-12 rounded-xl border border-amber-500/30 mb-12">
              <strong>The Flawed Mental Model:</strong> "{lab.commonAssumption}"
            </div>

            <div className="pt-12 border-t border-brand-border/60">
              <div className="flex items-center gap-6 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-4">
                <Sparkles className="w-14 h-14" />
                <span>Scientific Objective</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">{lab.subtitle}</p>
            </div>
          </Card>

          {/* Stepper Navigation */}
          <Card className="p-16 bg-surface/60 border-brand-border">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-12 font-orbitron">
              Laboratory Sequence
            </h3>
            <div className="flex flex-col gap-8">
              {lab.steps.map((step, sIdx) => {
                const isCurrent = activeStepIdx === sIdx;
                const hasResult = simResults[sIdx] !== undefined;
                return (
                  <button
                    key={sIdx}
                    onClick={() => {
                      setActiveStepIdx(sIdx);
                      setHasEvaluated(simResults[sIdx] !== undefined);
                    }}
                    className={`w-full text-left p-12 rounded-xl border transition-all flex items-center justify-between ${
                      isCurrent
                        ? 'bg-brand-primary/15 border-brand-primary text-brand-cyan shadow-glow-primary'
                        : 'bg-surface border-brand-border text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold font-orbitron">{step.title}</div>
                      <div className="text-[11px] text-text-muted mt-2 font-mono">
                        {step.instruction}
                      </div>
                    </div>
                    {hasResult && <CheckCircle2 className="w-16 h-16 text-emerald-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Challenge Card */}
          <Card className="p-20 bg-gradient-to-br from-purple-950/30 to-surface border-purple-500/30">
            <div className="flex items-center gap-8 text-purple-400 font-bold text-xs uppercase tracking-wider mb-8 font-orbitron">
              <ShieldCheck className="w-16 h-16" />
              <span>Mastery Verification Challenge</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed mb-12">
              {lab.verificationChallenge}
            </p>

            {/* Challenge Prediction Input */}
            <div className="flex flex-col gap-10 bg-black/40 p-12 rounded-xl border border-purple-500/20 mb-12">
              <span className="text-[10px] font-mono text-purple-300 uppercase">
                Predict Challenge P(|0⟩): {(challengePredictedP0 * 100).toFixed(0)}%
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={challengePredictedP0}
                onChange={e => setChallengePredictedP0(parseFloat(e.target.value))}
                className="w-full h-4 bg-brand-border rounded-full appearance-none cursor-pointer accent-purple-400"
              />
              <div className="flex justify-between text-[9px] font-mono text-text-muted">
                <span>0% |0⟩</span>
                <span>50% |0⟩</span>
                <span>100% |0⟩</span>
              </div>
            </div>

            <button
              onClick={handleVerifyChallenge}
              disabled={challengeLoading}
              className={`w-full py-10 rounded-xl text-xs font-orbitron font-bold shadow transition-all active:scale-95 flex items-center justify-center gap-8 ${
                challengeVerified
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-purple-600 to-brand-primary text-white hover:opacity-90'
              }`}
            >
              {challengeLoading ? (
                <div className="w-14 h-14 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : challengeVerified ? (
                <>
                  <CheckCircle2 className="w-14 h-14" />
                  <span>Misconception Mastered & Resolved ✓</span>
                </>
              ) : (
                <span>Test Prediction & Verify Mastery</span>
              )}
            </button>

            {challengeDelta && (
              <div className="mt-8 text-center text-[11px] font-mono">
                Cognitive Delta TVD: <strong>{challengeDelta.cognitiveDelta.toFixed(3)}</strong>{' '}
                {challengeVerified ? '(Target ≤ 0.10 Passed)' : '(Deviated from simulation)'}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Interactive Prediction & Qiskit Aer Execution (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-24">
          {/* Active Step Panel */}
          <Card className="p-24 bg-surface/80 border-brand-border shadow-xl">
            {/* Step Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-12 pb-16 mb-20 border-b border-brand-border">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
                  Step {activeStepIdx + 1} of {lab.steps.length}
                </span>
                <h3 className="text-lg font-bold text-text-primary mt-2 font-orbitron">
                  {currentStep.title}
                </h3>
                <p className="text-xs text-text-muted mt-2 font-mono">
                  {currentStep.instruction}
                </p>
              </div>

              <Badge color="purple">Qiskit Aer 1024 Shots</Badge>
            </div>

            {/* STAGE 1: HYPOTHESIS & PREDICTION SELECTION */}
            <div className="p-16 rounded-xl bg-surface border border-brand-border mb-20 flex flex-col gap-14">
              <div className="flex items-center gap-8 text-xs font-orbitron font-bold text-brand-primary">
                <HelpCircle className="w-16 h-16 text-brand-primary" />
                <span>Stage 1: State Your Hypothesis (Before Simulation)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <button
                  onClick={() => {
                    setSelectedHypothesisKey('naive');
                    setPredictionP0(activeStepIdx === 0 ? 0.5 : 0.5);
                  }}
                  className={`p-12 rounded-xl text-left border transition-all ${
                    selectedHypothesisKey === 'naive'
                      ? 'bg-amber-500/15 border-amber-500/60 text-amber-300'
                      : 'bg-surface-raised border-brand-border text-text-muted hover:text-text-primary'
                  }`}
                >
                  <div className="text-xs font-bold font-orbitron">Hypothesis A (Classical Model)</div>
                  <div className="text-[11px] text-text-secondary mt-4">
                    {activeStepIdx === 0
                      ? '50% |0⟩, 50% |1⟩ (Flipping coin twice creates 50/50 noise)'
                      : '50% |0⟩ (Phase shift has no effect on measurement)'}
                  </div>
                </button>

                <button
                  onClick={() => {
                    setSelectedHypothesisKey('quantum');
                    setPredictionP0(activeStepIdx === 0 ? 1.0 : 0.0);
                  }}
                  className={`p-12 rounded-xl text-left border transition-all ${
                    selectedHypothesisKey === 'quantum'
                      ? 'bg-brand-primary/15 border-brand-primary text-brand-cyan'
                      : 'bg-surface-raised border-brand-border text-text-muted hover:text-text-primary'
                  }`}
                >
                  <div className="text-xs font-bold font-orbitron">Hypothesis B (Interference Model)</div>
                  <div className="text-[11px] text-text-secondary mt-4">
                    {activeStepIdx === 0
                      ? '100% |0⟩ (Constructive amplitude interference restores ground state)'
                      : '100% |1⟩ (Phase flip turns constructive into destructive interference)'}
                  </div>
                </button>
              </div>

              {/* Slider for custom prediction */}
              <div className="flex flex-col gap-6 pt-8 border-t border-brand-border/40">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-text-muted">Your Prediction for P(|0⟩):</span>
                  <span className="text-brand-cyan font-bold font-mono">{(predictionP0 * 100).toFixed(0)}% |0⟩ / {((1 - predictionP0) * 100).toFixed(0)}% |1⟩</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={predictionP0}
                  onChange={e => {
                    setPredictionP0(parseFloat(e.target.value));
                    setSelectedHypothesisKey('custom');
                  }}
                  className="w-full h-4 bg-brand-border rounded-full appearance-none cursor-pointer accent-brand-cyan"
                />
              </div>

              <button
                onClick={handleTestHypothesis}
                disabled={isLoading}
                className="btn btn-primary flex items-center justify-center gap-8 py-10 font-orbitron text-xs font-bold"
              >
                <Play className="w-14 h-14 fill-white" />
                <span>{isLoading ? 'Simulating on Qiskit Aer...' : 'Run Experiment & Measure Cognitive Delta'}</span>
              </button>
            </div>

            {/* STAGE 2 & 3: SIMULATION OUTCOME & COGNITIVE DELTA TVD */}
            {currentSim && currentEval && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-16"
              >
                {/* Side-by-Side Comparison: Prediction vs Qiskit Aer Ground Truth */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  {/* Student Prediction */}
                  <div className="p-16 rounded-xl bg-surface border border-brand-border flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-orbitron font-bold text-text-muted uppercase tracking-wider block mb-8">
                        Your Prediction
                      </span>
                      <div className="space-y-8 font-mono text-xs">
                        <div>
                          <div className="flex justify-between text-text-secondary">
                            <span>|0⟩</span>
                            <span>{(predictionP0 * 100).toFixed(1)}%</span>
                          </div>
                          <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-brand-border mt-2">
                            <div
                              style={{ width: `${predictionP0 * 100}%` }}
                              className="h-full bg-amber-400"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-text-secondary">
                            <span>|1⟩</span>
                            <span>{((1 - predictionP0) * 100).toFixed(1)}%</span>
                          </div>
                          <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-brand-border mt-2">
                            <div
                              style={{ width: `${(1 - predictionP0) * 100}%` }}
                              className="h-full bg-purple-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Qiskit Aer Simulation Output */}
                  <div className="p-16 rounded-xl bg-surface border border-brand-border flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-orbitron font-bold text-cyan-400 uppercase tracking-wider block mb-8">
                        Qiskit Aer Ground Truth (1024 Shots)
                      </span>
                      <div className="space-y-8 font-mono text-xs">
                        {currentSim.statevector.map(sv => (
                          <div key={sv.basis}>
                            <div className="flex justify-between text-text-secondary">
                              <span>|{sv.basis}⟩</span>
                              <span className="text-brand-cyan font-bold">
                                {(sv.probability * 100).toFixed(1)}% ({currentSim.counts[sv.basis] ?? 0} shots)
                              </span>
                            </div>
                            <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-brand-border mt-2">
                              <div
                                style={{ width: `${sv.probability * 100}%` }}
                                className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cognitive Delta TVD Alert Box */}
                <div
                  className={`p-16 rounded-xl border flex flex-col gap-8 ${
                    currentEval.cognitiveDelta > 0.15
                      ? 'bg-red-500/10 border-red-500/40 text-red-200'
                      : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-8 font-orbitron font-bold text-xs">
                      {currentEval.cognitiveDelta > 0.15 ? (
                        <>
                          <AlertTriangle className="w-16 h-16 text-red-400" />
                          <span className="text-red-300">Cognitive Conflict Detected! Intuition Falsified.</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-16 h-16 text-emerald-400" />
                          <span className="text-emerald-300">Hypothesis Verified! Intuition Matches Physics.</span>
                        </>
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold px-8 py-3 rounded bg-black/40 border border-brand-border">
                      Cognitive Delta TVD: {currentEval.cognitiveDelta.toFixed(3)}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed opacity-95">
                    {currentEval.deltaSummary}
                  </p>

                  <div className="text-[11px] font-mono pt-6 border-t border-white/10 flex justify-between">
                    <span>Mathematical Reality: {currentStep.expectedOutcome}</span>
                    <span>Hadamard Transformation Law</span>
                  </div>
                </div>

                {/* Pedagogical Takeaway */}
                <div className="p-16 rounded-xl bg-surface border border-brand-border text-xs text-text-secondary leading-relaxed">
                  <strong className="text-text-primary font-orbitron block mb-4">Scientific Takeaway:</strong>
                  {currentStep.pedagogicalTakeaway}
                </div>

                {/* Step Progression */}
                {activeStepIdx < lab.steps.length - 1 && (
                  <div className="flex justify-end pt-8">
                    <button
                      onClick={() => {
                        const nextIdx = activeStepIdx + 1;
                        setActiveStepIdx(nextIdx);
                        setHasEvaluated(false);
                      }}
                      className="btn btn-primary flex items-center gap-8 py-10 px-18 font-orbitron text-xs font-bold"
                    >
                      <span>Proceed to Step {activeStepIdx + 2}</span>
                      <ArrowRight className="w-14 h-14" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
