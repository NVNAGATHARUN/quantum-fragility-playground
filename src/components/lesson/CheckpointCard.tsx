/**
 * CheckpointCard — Formative Checkpoint gate component.
 *
 * Implements interactive concept checking with non-revealing feedback for mistakes
 * and clear explanation upon correct answer.
 */

import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import type { CheckpointBlock } from '../../content/types';

interface Props {
  checkpoint: CheckpointBlock;
  onAttempt?: (selectedKey: string, correct: boolean) => void;
  onSolved?: () => void;
}

export default function CheckpointCard({ checkpoint, onAttempt, onSolved }: Props) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);

  const handleSelect = (key: string) => {
    setSelectedKey(key);
    setIsAnswered(true);

    const isCorrect = key === checkpoint.correctKey;
    onAttempt?.(key, isCorrect);

    if (isCorrect) {
      setFeedback({
        isCorrect: true,
        text: checkpoint.correctExplanation,
      });
      onSolved?.();
    } else {
      const explanation =
        checkpoint.incorrectExplanations?.[key] ||
        'Not quite. Review the principles above and try another choice.';
      setFeedback({
        isCorrect: false,
        text: explanation,
      });
    }
  };

  const handleReset = () => {
    setSelectedKey(null);
    setIsAnswered(false);
    setFeedback(null);
  };

  const isSolved = feedback?.isCorrect === true;

  return (
    <div className={`my-6 rounded-2xl border p-5 sm:p-6 transition-all ${
      isSolved
        ? 'border-emerald-500/40 bg-emerald-500/5'
        : feedback && !feedback.isCorrect
        ? 'border-amber-500/40 bg-amber-500/5'
        : 'border-border bg-surface-primary shadow-sm'
    }`}>
      {/* Checkpoint Header */}
      <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
        <HelpCircle className="w-4 h-4" />
        <span>Concept Checkpoint</span>
      </div>

      {/* Question */}
      <h4 className="text-base font-medium text-text-primary mb-4 leading-relaxed">
        {checkpoint.question}
      </h4>

      {/* Options List */}
      <div className="space-y-2.5 mb-4">
        {checkpoint.options.map((opt) => {
          const isSelected = selectedKey === opt.key;
          let btnStyle = 'border-border hover:bg-surface-secondary text-text-primary';

          if (isAnswered) {
            if (isSelected) {
              btnStyle = isSolved
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium'
                : 'border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300';
            } else if (isSolved && opt.key === checkpoint.correctKey) {
              btnStyle = 'border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300';
            }
          }

          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => handleSelect(opt.key)}
              disabled={isSolved}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 text-sm ${btnStyle}`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-semibold flex-shrink-0 mt-0.5 ${
                isSelected
                  ? isSolved ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                  : 'bg-surface-secondary text-text-muted border border-border'
              }`}>
                {opt.key.toUpperCase()}
              </span>
              <span className="flex-1 leading-snug">{opt.text}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback Panel */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 text-sm animate-fade-in ${
          feedback.isCorrect
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
            : 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200'
        }`}>
          {feedback.isCorrect ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 space-y-1">
            <p className="font-semibold text-xs uppercase tracking-wide">
              {feedback.isCorrect ? 'Correct!' : 'Keep Thinking'}
            </p>
            <p className="text-xs sm:text-sm leading-relaxed">{feedback.text}</p>
            {!feedback.isCorrect && (
              <button
                type="button"
                onClick={handleReset}
                className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300 underline hover:no-underline"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
