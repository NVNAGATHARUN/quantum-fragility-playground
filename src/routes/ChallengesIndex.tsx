import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Award, ArrowRight, Code, ShieldCheck, Zap, Bug, Eye, Sparkles, Filter,
  Layers, CheckCircle2, ChevronRight, Activity, Cpu
} from 'lucide-react';
import { listChallenges, type ChallengeDefinition, type ChallengeType } from '../api/challenges';

const TYPE_CONFIG: Record<
  ChallengeType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  build: { label: 'Build', icon: Sparkles, color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' },
  predict: { label: 'Predict', icon: Eye, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30' },
  debug: { label: 'Debug', icon: Bug, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
  code: { label: 'Code', icon: Code, color: 'text-purple-500 bg-purple-500/10 border-purple-500/30' },
  optimize: { label: 'Optimize', icon: Zap, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
};

export default function ChallengesIndex() {
  const [challenges, setChallenges] = useState<ChallengeDefinition[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    listChallenges()
      .then((data) => {
        setChallenges(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Failed to load challenges');
        setIsLoading(false);
      });
  }, []);

  const filtered = selectedType === 'all'
    ? challenges
    : challenges.filter((c) => c.type === selectedType);

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-10 space-y-8">
      {/* Editorial Header */}
      <div className="space-y-4 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">
            <Award className="w-3.5 h-3.5 text-indigo-400" />
            <span>PS 26140 • Smart Education Assessment Suite</span>
          </div>
          <span className="text-xs text-text-muted font-mono hidden sm:inline">Qiskit Aer Unit Testing • Unitary Assertions</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight font-orbitron">
          Quantum Coding Challenges & Assessments
        </h1>
        <p className="text-sm text-text-secondary max-w-2xl font-normal leading-relaxed">
          Test your circuit synthesis, debugging, prediction accuracy, and quantum optimization skills against mathematical unit tests, Qiskit Aer statevector comparisons, and physical unitary assertions.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-surface-secondary border border-border rounded-lg text-xs">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              selectedType === 'all'
                ? 'bg-surface text-brand font-semibold shadow-sm border border-border/80'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            All Challenges ({challenges.length})
          </button>
          {(['build', 'predict', 'debug', 'code', 'optimize'] as ChallengeType[]).map((type) => {
            const cfg = TYPE_CONFIG[type];
            const Icon = cfg.icon;
            const count = challenges.filter((c) => c.type === type).length;
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  selectedType === type
                    ? 'bg-surface text-brand font-semibold shadow-sm border border-border/80'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cfg.label} ({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Challenge Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-text-muted">Loading challenge suite...</div>
      ) : errorMsg ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 text-xs">
          {errorMsg}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c) => {
            const cfg = TYPE_CONFIG[c.type];
            const Icon = cfg.icon;

            return (
              <div
                key={c.id}
                className="p-5 rounded-xl bg-surface border border-border hover:border-brand/40 shadow-subtle flex flex-col justify-between transition-all group"
              >
                <div className="space-y-3">
                  {/* Badges */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border flex items-center gap-1 ${cfg.color}`}>
                      <Icon className="w-3 h-3" />
                      <span>{cfg.label}</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-secondary text-text-muted border border-border font-mono">
                      {c.difficulty}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h2 className="text-base font-semibold text-text-primary group-hover:text-brand transition-colors">
                      {c.title}
                    </h2>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      {c.subtitle}
                    </p>
                  </div>

                  {/* Constraints pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-mono text-text-secondary">
                    <span className="px-2 py-0.5 rounded bg-surface-secondary border border-border">
                      {c.starter_circuit.qubits} Qubit{c.starter_circuit.qubits === 1 ? '' : 's'}
                    </span>
                    {c.max_gates && (
                      <span className="px-2 py-0.5 rounded bg-surface-secondary border border-border">
                        Max: {c.max_gates} Gates
                      </span>
                    )}
                    {c.max_depth && (
                      <span className="px-2 py-0.5 rounded bg-surface-secondary border border-border">
                        Depth ≤ {c.max_depth}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom link */}
                <div className="pt-4 mt-4 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] text-text-muted font-mono truncate max-w-[180px]">
                    {c.category}
                  </span>
                  <Link
                    to={`/labs/challenges/${c.id}`}
                    className="btn btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                  >
                    <span>Launch</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
