/**
 * MathBlockView — KaTeX renderer with robust error fallback.
 */

import React from 'react';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

interface Props {
  expression: string;
  display?: boolean;
  label?: string;
}

export default function MathBlockView({ expression, display = true, label }: Props) {
  try {
    if (display) {
      return (
        <div className="my-4 py-3 px-4 rounded-xl bg-surface-secondary/40 border border-border/60 overflow-x-auto text-center relative group">
          {label && (
            <span className="absolute right-3 top-2 text-[10px] font-mono text-text-muted">
              ({label})
            </span>
          )}
          <div className="inline-block py-1">
            <BlockMath math={expression} errorColor="#ef4444" />
          </div>
        </div>
      );
    }
    return <InlineMath math={expression} errorColor="#ef4444" />;
  } catch {
    return (
      <code className="font-mono text-xs px-2 py-1 bg-surface-secondary text-primary rounded">
        {expression}
      </code>
    );
  }
}
