import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const Divider = () => <div className="h-px bg-brand-border/40 w-full my-12" />;

export const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] font-orbitron text-text-muted uppercase tracking-[2px] mb-12">
    {children}
  </div>
);

export const Card = ({ children, className = '', raised = false, style }: { children: React.ReactNode; className?: string; raised?: boolean; style?: React.CSSProperties }) => (
  <div className={`${raised ? 'glass-card-raised' : 'glass-card'} ${className}`} style={style}>
    {children}
  </div>
);

export const Badge = ({ children, color = 'primary' }: { children: React.ReactNode; color?: 'primary' | 'cyan' | 'purple' | 'green' | 'gold' | 'red' }) => {
  const colorMap = {
    primary: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
    cyan: 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20',
    purple: 'bg-brand-purple/10 text-brand-purple border-brand-purple/20',
    green: 'bg-brand-green/10 text-brand-green border-brand-green/20',
    gold: 'bg-brand-gold/10 text-brand-gold border-brand-gold/20',
    red: 'bg-brand-red/10 text-brand-red border-brand-red/20',
  };

  return (
    <span className={`px-8 py-2 rounded-full border text-[10px] font-bold uppercase tracking-wider ${colorMap[color]}`}>
      {children}
    </span>
  );
};

export const SectionHeader = ({ title, subtitle, gradient = true }: { title: string; subtitle?: string; gradient?: boolean }) => (
  <div className="mb-32">
    <h2 className={`text-2xl md:text-3xl mb-8 ${gradient ? 'gradient-text' : 'text-text-primary'}`}>
      {title}
    </h2>
    {subtitle && <p className="text-text-secondary text-sm max-w-2xl">{subtitle}</p>}
  </div>
);

export const PageHeader = ({ title, subtitle, icon, backLink }: { title: string; subtitle?: string; icon?: string; backLink?: string }) => (
  <div className="mb-40 pt-24 flex justify-between items-start">
    <div className="flex flex-col">
      <div className="flex items-center gap-16 mb-8">
        {icon && <span className="text-3xl">{icon}</span>}
        <h1 className="text-4xl gradient-text">{title}</h1>
      </div>
      {subtitle && <p className="text-text-secondary text-lg max-w-3xl">{subtitle}</p>}
    </div>
    {backLink && (
      <Link to={backLink} className="btn btn-secondary !px-16 !py-6 text-[10px]">
        ← Back
      </Link>
    )}
  </div>
);

export const InfoBox = ({ children, label, className = '' }: { children: React.ReactNode; label?: string; className?: string }) => (
  <div className={`p-12 rounded-xl bg-brand-primary/5 border border-brand-primary/10 ${className}`}>
    {label && <div className="text-[9px] font-orbitron text-brand-primary uppercase mb-4 tracking-widest">{label}</div>}
    <div className="text-text-secondary text-[12px] leading-relaxed italic">
      {children}
    </div>
  </div>
);

export const ExperimentLayout = ({
  title,
  subtitle,
  icon,
  howTo,
  controls,
  results
}: {
  title: string;
  subtitle: string;
  icon: string;
  howTo: string;
  controls: React.ReactNode;
  results: React.ReactNode;
}) => {
  const [showHowTo, setShowHowTo] = React.useState(true);

  return (
    <div className="flex flex-col gap-24">
      <PageHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        backLink="/experiments"
      />

      <div className="flex flex-col gap-8">
        <button
          onClick={() => setShowHowTo(!showHowTo)}
          className="flex items-center gap-8 text-[11px] font-orbitron text-text-muted hover:text-text-secondary transition-all w-fit"
        >
          <span>{showHowTo ? '▼' : '▶'}</span>
          HOW TO USE
        </button>
        <AnimatePresence>
          {showHowTo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-16 rounded-xl bg-brand-primary/5 border border-brand-primary/20 text-sm text-text-secondary leading-relaxed">
                <span className="text-brand-cyan mr-8 self-start">🔬</span>
                {howTo}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-24 mt-8">
        <div className="flex flex-col gap-24">
          {controls}
        </div>
        <div className="flex flex-col gap-24">
          {results}
        </div>
      </div>
    </div>
  );
};

