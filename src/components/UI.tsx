import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const Divider = () => <div className="h-px bg-brand-border/40 w-full my-12" />;

export const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="ql-section-label">
    {children}
  </div>
);

export const Card = ({ children, className = '', raised = false, style, id, ...props }: { children: React.ReactNode; className?: string; raised?: boolean; style?: React.CSSProperties; id?: string; [key: string]: any }) => (
  <div id={id} className={`ql-legacy-card ${raised ? 'is-raised' : ''} ${className}`} style={style} {...props}>
    {children}
  </div>
);

export const Badge = ({ children, color = 'primary', className = '' }: { children: React.ReactNode; color?: 'primary' | 'cyan' | 'purple' | 'green' | 'gold' | 'red'; className?: string }) => {
  const colorMap = {
    primary: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
    cyan: 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20',
    purple: 'bg-brand-purple/10 text-brand-purple border-brand-purple/20',
    green: 'bg-brand-green/10 text-brand-green border-brand-green/20',
    gold: 'bg-brand-gold/10 text-brand-gold border-brand-gold/20',
    red: 'bg-brand-red/10 text-brand-red border-brand-red/20',
  };

  return (
    <span className={`ql-badge ${colorMap[color]} ${className}`}>
      {children}
    </span>
  );
};

export const SectionHeader = ({ title, subtitle, gradient = true }: { title: string; subtitle?: string; gradient?: boolean }) => (
  <div className="ql-section-header">
    <h2>
      {title}
    </h2>
    {subtitle && <p>{subtitle}</p>}
  </div>
);

export const PageHeader = ({ title, subtitle, icon, backLink }: { title: string; subtitle?: string; icon?: string; backLink?: string }) => (
  <div className="ql-legacy-page-header">
    <div>
      <div>
        <h1>{title}</h1>
      </div>
      {subtitle && <p>{subtitle}</p>}
    </div>
    {backLink && (
      <Link to={backLink} className="ql-button ql-button-white">
        Back
      </Link>
    )}
  </div>
);

export const InfoBox = ({ children, label, className = '' }: { children: React.ReactNode; label?: string; className?: string }) => (
  <div className={`ql-info-box ${className}`}>
    {label && <div className="ql-info-label">{label}</div>}
    <div>
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

      <div className="ql-how-to">
        <button
          onClick={() => setShowHowTo(!showHowTo)}
          className="ql-how-to-trigger"
        >
          <span aria-hidden="true">{showHowTo ? '−' : '+'}</span>
          How to use
        </button>
        <AnimatePresence>
          {showHowTo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="ql-how-to-content">
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

