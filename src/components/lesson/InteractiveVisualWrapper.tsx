/**
 * InteractiveVisualWrapper — Secure host for interactive visual registry components.
 */

import React, { Suspense } from 'react';
import { VISUAL_REGISTRY } from '../../content/visualRegistry';
import type { InteractiveVisualBlock } from '../../content/types';

interface Props {
  block: InteractiveVisualBlock;
  onInteract?: () => void;
}

export default function InteractiveVisualWrapper({ block, onInteract }: Props) {
  const VisualComponent = VISUAL_REGISTRY[block.visualKey];

  if (!VisualComponent) {
    return (
      <div className="my-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-700">
        Component <code>{block.visualKey}</code> is not registered in <code>VISUAL_REGISTRY</code>.
      </div>
    );
  }

  return (
    <div className="my-6 space-y-2">
      <Suspense
        fallback={
          <div className="h-64 rounded-xl border border-border bg-surface-secondary/40 animate-pulse flex items-center justify-center text-xs text-text-muted">
            Loading interactive instrument...
          </div>
        }
      >
        <VisualComponent
          id={block.id}
          initialProps={block.initialProps}
          interactionPrompt={block.interactionPrompt}
          onInteract={onInteract}
        />
      </Suspense>

      {block.caption && (
        <p className="text-xs text-text-muted text-center italic">
          {block.caption}
        </p>
      )}
    </div>
  );
}
