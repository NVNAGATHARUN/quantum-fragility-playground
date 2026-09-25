/**
 * CodeBlockView — Code snippet viewer with syntax formatting and copy button.
 */

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import type { CodeBlock } from '../../content/types';

interface Props {
  block: CodeBlock;
}

export default function CodeBlockView({ block }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(block.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-5 rounded-xl border border-border/80 bg-surface-secondary overflow-hidden text-xs">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/60 bg-surface-secondary/80 text-[11px] text-text-muted font-mono">
        <span>{block.language.toUpperCase()}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-border/60 text-text-secondary hover:text-text-primary transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <pre className="p-4 font-mono text-text-primary overflow-x-auto leading-relaxed">
        <code>{block.content}</code>
      </pre>

      {block.caption && (
        <div className="px-4 py-2 bg-surface-primary/40 border-t border-border/40 text-[11px] text-text-secondary italic">
          {block.caption}
        </div>
      )}
    </div>
  );
}
