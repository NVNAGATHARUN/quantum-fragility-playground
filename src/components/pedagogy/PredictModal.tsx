import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, AlertTriangle, CheckCircle2, ArrowRight, X } from 'lucide-react';
import type { CircuitIR, CognitiveDeltaResult } from '../../types/quantum';
import { apiUrl } from '../../api/client';

interface PredictModalProps {
  isOpen: boolean;
  onClose: () => void;
  circuit: CircuitIR;
  simulatedProbabilities: Record<string, number>;
  onConfirmRun: () => void;
  onLaunchConflictLab?: (labId: string) => void;
}

export default function PredictModal({
  isOpen,
  onClose,
  circuit,
  simulatedProbabilities,
  onConfirmRun,
  onLaunchConflictLab,
}: PredictModalProps) {
  const [selectedOption, setSelectedOption] = useState<string>('independent');
  const [evalResult, setEvalResult] = useState<CognitiveDeltaResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleEvaluate = async () => {
    setIsSubmitting(true);
    let predictedProbs: Record<string, number> = {};

    if (circuit.qubits === 2) {
      if (selectedOption === 'independent') {
        predictedProbs = { '00': 0.25, '01': 0.25, '10': 0.25, '11': 0.25 };
      } else if (selectedOption === 'correlated') {
        predictedProbs = { '00': 0.5, '01': 0.0, '10': 0.0, '11': 0.5 };
      } else if (selectedOption === 'deterministic') {
        predictedProbs = { '00': 1.0, '01': 0.0, '10': 0.0, '11': 0.0 };
      } else {
        predictedProbs = { '00': 0.0, '01': 0.5, '10': 0.5, '11': 0.0 };
      }
    } else {
      if (selectedOption === 'coin') {
        predictedProbs = { '0': 0.5, '1': 0.5 };
      } else {
        predictedProbs = { '0': 1.0, '1': 0.0 };
      }
    }

    try {
      const res = await fetch(apiUrl('/api/v1/pedagogy/predict'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          circuitId: 'c-active',
          conceptKey: circuit.qubits === 2 ? 'bell' : 'superposition',
          predictedProbabilities: predictedProbs,
          actualProbabilities: simulatedProbabilities,
        }),
      });
      const data: CognitiveDeltaResult = await res.json();
      setEvalResult(data);
    } catch (err) {
      console.error('Failed to evaluate prediction', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden"
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Brain className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold font-orbitron text-slate-100">
              Predict Before Simulating
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!evalResult ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              Before executing on the quantum simulator, test your mental model.
              <span className="block font-semibold text-cyan-400 mt-1">
                What measurement probability distribution do you expect from this circuit?
              </span>
            </p>

            <div className="space-y-2.5">
              {circuit.qubits === 2 ? (
                <>
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/40 cursor-pointer">
                    <input
                      type="radio"
                      name="prediction"
                      value="independent"
                      checked={selectedOption === 'independent'}
                      onChange={() => setSelectedOption('independent')}
                      className="mt-1 accent-cyan-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-200">
                        Equal 25% across all 4 basis states (00, 01, 10, 11)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Treats qubits as independent 50/50 random variables.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/40 cursor-pointer">
                    <input
                      type="radio"
                      name="prediction"
                      value="correlated"
                      checked={selectedOption === 'correlated'}
                      onChange={() => setSelectedOption('correlated')}
                      className="mt-1 accent-cyan-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-200">
                        Entangled correlation: 50% |00⟩, 50% |11⟩ (0% |01⟩, 0% |10⟩)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Maximally entangled Bell pair with correlated measurement outcomes.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/40 cursor-pointer">
                    <input
                      type="radio"
                      name="prediction"
                      value="deterministic"
                      checked={selectedOption === 'deterministic'}
                      onChange={() => setSelectedOption('deterministic')}
                      className="mt-1 accent-cyan-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-200">
                        100% |00⟩ (Deterministic output)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        State remains in the ground computational state.
                      </div>
                    </div>
                  </label>
                </>
              ) : (
                <>
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/40 cursor-pointer">
                    <input
                      type="radio"
                      name="prediction"
                      value="coin"
                      checked={selectedOption === 'coin'}
                      onChange={() => setSelectedOption('coin')}
                      className="mt-1 accent-cyan-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-200">
                        50% |0⟩, 50% |1⟩ (Random outcome)
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/40 cursor-pointer">
                    <input
                      type="radio"
                      name="prediction"
                      value="pure"
                      checked={selectedOption === 'pure'}
                      onChange={() => setSelectedOption('pure')}
                      className="mt-1 accent-cyan-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-200">
                        100% |0⟩ (Deterministic interference)
                      </div>
                    </div>
                  </label>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Skip Prediction
              </button>
              <button
                onClick={handleEvaluate}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold rounded-lg text-xs shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Comparing...' : 'Submit Prediction'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Prediction Result & Cognitive Delta */
          <div className="space-y-4">
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                evalResult.matchesSimulation
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
              }`}
            >
              {evalResult.matchesSimulation ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="text-xs space-y-1">
                <div className="font-bold text-sm">
                  {evalResult.matchesSimulation
                    ? 'Prediction Confirmed!'
                    : `Cognitive Delta: ${(evalResult.cognitiveDelta * 100).toFixed(1)}%`}
                </div>
                <p className="leading-relaxed opacity-90">
                  {evalResult.detectedMisconceptions.length > 0
                    ? 'Your prediction indicates an interesting conceptual model. Notice how the simulator produced a different outcome.'
                    : evalResult.matchesSimulation
                    ? 'Your mental model is aligned with verified quantum state evolution.'
                    : 'The actual simulation probabilities diverged from your expectation.'}
                </p>
              </div>
            </div>

            {evalResult.interventionRecommended && evalResult.conflictLabId && (
              <div className="p-3.5 rounded-lg border border-indigo-500/40 bg-indigo-950/30 flex items-center justify-between">
                <div className="text-xs text-indigo-300">
                  <span className="font-semibold block text-indigo-200">
                    Recommended 60-Second Experiment
                  </span>
                  Test relative phase interference to prove why this happens.
                </div>
                {onLaunchConflictLab && (
                  <button
                    onClick={() => {
                      onClose();
                      onLaunchConflictLab(evalResult.conflictLabId!);
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow transition-all active:scale-95"
                  >
                    Test It Now
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  onClose();
                  onConfirmRun();
                }}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs shadow transition-all active:scale-95"
              >
                Inspect Full Simulation Results
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
