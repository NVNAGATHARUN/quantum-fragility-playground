/**
 * PredictionCard — Cognitive Prediction Gate component.
 *
 * Prompts the learner to commit to a physical prediction before the
 * outcome or simulation is revealed.
 */

import React, { useState } from 'react';
import { Compass, Lightbulb, Check } from 'lucide-react';
import type { PredictionBlock } from '../../content/types';

interface Props {
  prediction: PredictionBlock;
  onCommitted?: () => void;
}

export default function PredictionCard({ prediction, onCommitted }: Props) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [openText, setOpenText] = useState('');
  const [committed, setCommitted] = useState(false);

  const handleCommit = () => {
    if (!committed && (selectedOption !== null || openText.trim().length > 0)) {
      setCommitted(true);
      onCommitted?.();
    }
  };

  return (
    <div className={`my-6 rounded-2xl border p-5 sm:p-6 transition-all ${
      committed
        ? 'border-indigo-500/30 bg-indigo-500/5'
        : 'border-border bg-surface-primary shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-indigo-500">
        <Compass className="w-4 h-4" />
        <span>Predict Before Observing</span>
      </div>

      {/* Prompt */}
      <p className="text-base font-medium text-text-primary mb-4 leading-relaxed">
        {prediction.prompt}
      </p>

      {/* Options or open reflection input */}
      {!committed ? (
        <div className="space-y-3">
          {prediction.options && prediction.options.length > 0 ? (
            <div className="space-y-2">
              {prediction.options.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSelectedOption(opt.key)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 text-sm ${
                    selectedOption === opt.key
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-900 dark:text-indigo-200 font-medium'
                      : 'border-border hover:bg-surface-secondary text-text-primary'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono flex-shrink-0 mt-0.5 ${
                    selectedOption === opt.key
                      ? 'bg-indigo-600 text-white'
                      : 'border border-border text-text-muted'
                  }`}>
                    {opt.key.toUpperCase()}
                  </span>
                  <span className="flex-1">{opt.text}</span>
                </button>
              ))}
            </div>
          ) : (
            <textarea
              rows={3}
              value={openText}
              onChange={(e) => setOpenText(e.target.value)}
              placeholder="Formulate your hypothesis here before seeing the solution..."
              className="w-full p-3.5 rounded-xl border border-border bg-surface-secondary/40 text-sm text-text-primary focus:outline-none focus:border-indigo-500"
            />
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleCommit}
              disabled={selectedOption === null && openText.trim().length === 0}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>Commit Prediction</span>
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in">
          <div className="p-3.5 rounded-xl bg-surface-secondary/60 border border-border text-xs text-text-secondary flex items-center gap-2">
            <span className="font-semibold text-text-primary">Your Stance:</span>
            <span>
              {prediction.options?.find((o) => o.key === selectedOption)?.text || openText}
            </span>
          </div>

          {prediction.reflection && (
            <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-text-primary flex items-start gap-3">
              <Lightbulb className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm leading-relaxed space-y-1">
                <span className="font-semibold text-xs text-indigo-600 dark:text-indigo-400 block">
                  Physical Explanation
                </span>
                <p>{prediction.reflection}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
