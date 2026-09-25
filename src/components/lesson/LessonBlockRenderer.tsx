/**
 * LessonBlockRenderer — Editorial Renderer for Curriculum Blocks.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, HelpCircle, Activity } from 'lucide-react';
import type { LessonBlock } from '../../content/types';
import MathBlockView from './MathBlockView';
import CheckpointCard from './CheckpointCard';
import PredictionCard from './PredictionCard';
import CalloutCard from './CalloutCard';
import CodeBlockView from './CodeBlockView';
import InteractiveVisualWrapper from './InteractiveVisualWrapper';

interface Props {
  blocks: LessonBlock[];
  onCheckpointAttempt?: (checkpointId: string, selectedKey: string, correct: boolean) => void;
  onCheckpointSolved?: (checkpointId: string) => void;
  onVisualInteracted?: (visualId: string) => void;
}

/** Formats simple inline markdown elements (bold, italic, code, math) */
function renderInlineContent(text: string): React.ReactNode {
  // Regex to split by math $...$, code `...`, bold **...**, italic *...*
  const parts = text.split(/(\$[^\$]+\$|`[^`]+`|\*\*[^\*]+\*\*|\*[^\*]+\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      const math = part.slice(1, -1);
      return <MathBlockView key={index} expression={math} display={false} />;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-surface-secondary text-primary font-mono text-[0.88em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className="font-semibold text-text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={index} className="italic text-text-secondary">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

export default function LessonBlockRenderer({
  blocks,
  onCheckpointAttempt,
  onCheckpointSolved,
  onVisualInteracted,
}: Props) {
  return (
    <div className="space-y-4">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'heading': {
            if (block.level === 2) {
              return (
                <h2
                  key={idx}
                  className="text-xl sm:text-2xl font-bold text-text-primary mt-8 mb-3 tracking-tight border-b border-border/40 pb-2"
                >
                  {block.content}
                </h2>
              );
            }
            return (
              <h3
                key={idx}
                className="text-lg font-semibold text-text-primary mt-6 mb-2 tracking-tight"
              >
                {block.content}
              </h3>
            );
          }

          case 'text':
            return (
              <p
                key={idx}
                className="text-sm sm:text-base leading-relaxed text-text-primary/90 my-3 font-normal"
              >
                {renderInlineContent(block.content)}
              </p>
            );

          case 'math':
            return (
              <MathBlockView
                key={idx}
                expression={block.expression}
                display={block.display ?? true}
                label={block.label}
              />
            );

          case 'code':
            return <CodeBlockView key={idx} block={block} />;

          case 'callout':
            return <CalloutCard key={idx} callout={block} />;

          case 'checkpoint':
            return (
              <CheckpointCard
                key={block.id || idx}
                checkpoint={block}
                onAttempt={(optKey, correct) =>
                  onCheckpointAttempt?.(block.id, optKey, correct)
                }
                onSolved={() => onCheckpointSolved?.(block.id)}
              />
            );

          case 'interactive_visual':
            return (
              <InteractiveVisualWrapper
                key={block.id || idx}
                block={block}
                onInteract={() => onVisualInteracted?.(block.id)}
              />
            );

          case 'prediction':
            return <PredictionCard key={block.id || idx} prediction={block} />;

          case 'circuit_example':
            return (
              <div
                key={block.id || idx}
                className="my-5 p-4 rounded-xl border border-border bg-surface-secondary/40 space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span className="font-semibold text-text-primary flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-primary" />
                    <span>Circuit Diagram</span>
                  </span>
                  {block.studioLink && (
                    <Link
                      to={block.studioLink}
                      className="text-primary hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <span>Open in Studio</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
                <div className="p-3 bg-surface-primary rounded-lg border border-border/80 font-mono text-xs text-text-secondary overflow-x-auto">
                  {JSON.stringify(block.circuitIR, null, 2)}
                </div>
                {block.caption && (
                  <p className="text-xs text-text-muted italic">{block.caption}</p>
                )}
              </div>
            );

          case 'experiment_link':
            return (
              <div
                key={idx}
                className="my-6 p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-4"
              >
                <div className="space-y-0.5">
                  <h4 className="text-sm font-semibold text-text-primary">{block.label}</h4>
                  <p className="text-xs text-text-secondary">{block.description}</p>
                </div>
                <Link
                  to={block.href}
                  className="px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors flex items-center gap-1 flex-shrink-0"
                >
                  <span>Launch Lab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            );

          case 'reflection':
            return (
              <div
                key={idx}
                className="my-5 p-4 rounded-xl border border-border bg-surface-secondary/50 space-y-2"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                  <HelpCircle className="w-3.5 h-3.5 text-primary" />
                  <span>Reflection Question</span>
                </div>
                <p className="text-sm text-text-primary italic leading-relaxed">
                  "{block.prompt}"
                </p>
                {block.hint && (
                  <p className="text-xs text-text-muted mt-1">Hint: {block.hint}</p>
                )}
              </div>
            );

          case 'divider':
            return <hr key={idx} className="my-8 border-border/60" />;

          default:
            return null;
        }
      })}
    </div>
  );
}
