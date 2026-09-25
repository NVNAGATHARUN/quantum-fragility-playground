/**
 * CalloutCard — Editorial alert and emphasis container for lesson content.
 */

import React from 'react';
import { Info, AlertTriangle, Lightbulb, Bookmark, Sparkles } from 'lucide-react';
import type { CalloutBlock } from '../../content/types';

interface Props {
  callout: CalloutBlock;
}

export default function CalloutCard({ callout }: Props) {
  const configs = {
    definition: {
      icon: Bookmark,
      border: 'border-blue-500/30 dark:border-blue-500/40',
      bg: 'bg-blue-500/5 dark:bg-blue-500/10',
      titleColor: 'text-blue-700 dark:text-blue-300',
      iconColor: 'text-blue-600 dark:text-blue-400',
      defaultTitle: 'Formal Definition',
    },
    note: {
      icon: Info,
      border: 'border-border',
      bg: 'bg-surface-secondary/60',
      titleColor: 'text-text-primary',
      iconColor: 'text-text-secondary',
      defaultTitle: 'Note',
    },
    tip: {
      icon: Sparkles,
      border: 'border-emerald-500/30 dark:border-emerald-500/40',
      bg: 'bg-emerald-500/5 dark:bg-emerald-500/10',
      titleColor: 'text-emerald-700 dark:text-emerald-300',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      defaultTitle: 'Pro-Tip',
    },
    warning: {
      icon: AlertTriangle,
      border: 'border-amber-500/30 dark:border-amber-500/40',
      bg: 'bg-amber-500/5 dark:bg-amber-500/10',
      titleColor: 'text-amber-800 dark:text-amber-300',
      iconColor: 'text-amber-600 dark:text-amber-400',
      defaultTitle: 'Common Trap / Misconception',
    },
    insight: {
      icon: Lightbulb,
      border: 'border-purple-500/30 dark:border-purple-500/40',
      bg: 'bg-purple-500/5 dark:bg-purple-500/10',
      titleColor: 'text-purple-700 dark:text-purple-300',
      iconColor: 'text-purple-600 dark:text-purple-400',
      defaultTitle: 'Key Physical Insight',
    },
  };

  const cfg = configs[callout.variant] || configs.note;
  const Icon = cfg.icon;

  return (
    <aside className={`my-5 rounded-2xl border p-4 sm:p-5 ${cfg.border} ${cfg.bg} flex items-start gap-3.5`}>
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${cfg.iconColor}`} />
      <div className="flex-1 space-y-1 text-sm">
        <h5 className={`font-semibold text-xs uppercase tracking-wide ${cfg.titleColor}`}>
          {callout.title || cfg.defaultTitle}
        </h5>
        <div className="text-text-primary/90 leading-relaxed text-xs sm:text-sm">
          {callout.content}
        </div>
      </div>
    </aside>
  );
}
