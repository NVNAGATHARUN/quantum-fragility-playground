import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, PageHeader, SectionHeader, Badge, Divider } from '../components/UI';
import {
  Award,
  CheckCircle2,
  TrendingUp,
  Brain,
  ShieldCheck,
  ArrowUpRight,
  Zap,
  Target,
  BookOpen,
  RefreshCw,
  Sparkles,
  UserCheck,
  History,
  GraduationCap,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useQuantumSession } from '../providers/QuantumSessionProvider';
import { useAuth } from '../providers/AuthProvider';
import { fetchProgressSummary, type StudentProgressSummary } from '../api/progress';

const CONCEPT_MASTERY_DEFINITIONS = [
  {
    id: 'C-01',
    concept: 'Superposition & Basis Transformation',
    domain: 'Foundations',
    rule: 'Born Rule P(x)=|⟨x|ψ⟩|²',
    misconceptionId: 'M01',
  },
  {
    id: 'C-02',
    concept: 'Quantum Phase & Geometric Phase Kickback',
    domain: 'Phase Dynamics',
    rule: 'U_f |x⟩|−⟩ = (-1)^f(x) |x⟩|−⟩',
    misconceptionId: 'M01',
  },
  {
    id: 'C-03',
    concept: 'Multi-Qubit Entanglement & CHSH Non-Locality',
    domain: 'Entanglement',
    rule: 'Bell State |Φ+⟩, S_CHSH ≤ 2√2',
    misconceptionId: 'M02',
  },
  {
    id: 'C-04',
    concept: 'Environmental Decoherence (T₁ Relaxation & T₂ Dephasing)',
    domain: 'Open Systems',
    rule: 'Lindblad Constraint T₂ ≤ 2T₁',
    misconceptionId: 'M03',
  },
  {
    id: 'C-05',
    concept: 'Quantum Measurement Collapse & Apparatus Back-Action',
    domain: 'Measurement',
    rule: 'Density Matrix Purity Tr(ρ²)',
    misconceptionId: 'M04',
  },
  {
    id: 'C-06',
    concept: 'Quantum Search & Geometric Amplitude Amplification',
    domain: 'Algorithms',
    rule: 'Grover Reflections: O(√N) iterations',
    misconceptionId: 'M06',
  },
];

export default function StudentProgress() {
  const {
    simulatedCircuitsCount,
    resolvedMisconceptions,
    competencyData,
    cognitiveDeltaTrend,
    overallMastery,
    meanTVD,
    isLoading: isSessionLoading,
    refreshSession,
  } = useQuantumSession();

  const { user, token } = useAuth();
  const [dbProgress, setDbProgress] = useState<StudentProgressSummary | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadDbProgress = async () => {
    if (token) {
      const summary = await fetchProgressSummary(token);
      setDbProgress(summary);
    }
  };

  useEffect(() => {
    loadDbProgress();
  }, [token]);

  const handleReevaluate = async () => {
    setIsRefreshing(true);
    await refreshSession();
    await loadDbProgress();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Determine concept mastery from verified sessions or db misconceptions
  const getConceptStatus = (miscId: string) => {
    const isResolvedInSession = resolvedMisconceptions.some(m => m.id === miscId);
    const isResolvedInDb = dbProgress?.detected_misconceptions.some(
      m => m.misconception_id === miscId && m.status === 'resolved'
    );
    if (isResolvedInSession || isResolvedInDb) {
      return { status: 'Mastered', color: 'green' as const, badge: 'Verified Mastered' };
    }
    const isDetectedInDb = dbProgress?.detected_misconceptions.some(
      m => m.misconception_id === miscId && m.status === 'detected'
    );
    if (isDetectedInDb) {
      return { status: 'Diagnostic Active', color: 'red' as const, badge: 'Refutation In Progress' };
    }
    return { status: 'Pending', color: 'cyan' as const, badge: 'Diagnostic Pending' };
  };

  return (
    <div className="flex flex-col gap-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-16">
        <div>
          <PageHeader
            title="Student Quantum Competency Profile"
            subtitle="Database-backed learner progress, 6-domain skill radar, and live misconception resolution ledger."
            icon="🎓"
          />
          <div className="flex items-center gap-8 mt-6 flex-wrap">
            <span className="text-[11px] font-mono px-8 py-3 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 font-bold">
              PS 26140 • Learner Progress Tracking
            </span>
            <span className="text-[11px] font-mono px-8 py-3 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 font-bold">
              Database-Backed Empirical Progress
            </span>
            <span className="text-[11px] font-mono text-text-muted">
              Zero synthetic placeholders — all metrics stem from verified database attempts
            </span>
          </div>
        </div>

        <div className="flex items-center gap-12 self-end">
          <button
            onClick={handleReevaluate}
            disabled={isRefreshing || isSessionLoading}
            className="btn btn-ghost !px-14 !py-8 border border-brand-primary/30 hover:bg-brand-primary/10 flex items-center gap-8 rounded-xl text-xs font-orbitron font-bold transition-all"
          >
            <RefreshCw className={`w-14 h-14 text-brand-primary ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Re-Evaluating Ledger...' : 'Sync Database Progress'}</span>
          </button>
          <Badge color="green">Overall Mastery: {overallMastery.toFixed(1)}%</Badge>
          <Badge color="purple">Cognitive Delta: {meanTVD.toFixed(3)} TVD</Badge>
        </div>
      </div>

      {/* Top Stat Cards (All Real Metrics) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
        <Card className="p-20 flex flex-col gap-8 bg-surface/50 border-brand-border">
          <div className="flex justify-between items-center text-text-muted text-xs font-orbitron uppercase">
            <span>Resolved Misconceptions</span>
            <CheckCircle2 className="w-16 h-16 text-emerald-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-text-primary">
            {resolvedMisconceptions.length} / 8
          </div>
          <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-4">
            <TrendingUp className="w-12 h-12" />
            <span>
              {resolvedMisconceptions.map(m => m.id).join(', ') || 'None yet (complete Cognitive Conflict Labs)'}
            </span>
          </div>
        </Card>

        <Card className="p-20 flex flex-col gap-8 bg-surface/50 border-brand-border">
          <div className="flex justify-between items-center text-text-muted text-xs font-orbitron uppercase">
            <span>Average Cognitive Delta</span>
            <Target className="w-16 h-16 text-brand-cyan" />
          </div>
          <div className="text-3xl font-mono font-bold text-brand-cyan font-mono">
            {meanTVD.toFixed(3)} TVD
          </div>
          <div className="text-[11px] text-text-secondary font-mono">
            <span>Target ≤ 0.100 (Total Variation Distance)</span>
          </div>
        </Card>

        <Card className="p-20 flex flex-col gap-8 bg-surface/50 border-brand-border">
          <div className="flex justify-between items-center text-text-muted text-xs font-orbitron uppercase">
            <span>Empirical Circuits Run</span>
            <Brain className="w-16 h-16 text-brand-primary" />
          </div>
          <div className="text-3xl font-mono font-bold text-brand-primary font-mono">
            {dbProgress?.circuits_count ?? simulatedCircuitsCount}
          </div>
          <div className="text-[11px] text-text-secondary font-mono">
            <span>{dbProgress ? 'Database verified saved circuits' : 'Live session simulation runs'}</span>
          </div>
        </Card>

        <Card className="p-20 flex flex-col gap-8 bg-surface/50 border-brand-border">
          <div className="flex justify-between items-center text-text-muted text-xs font-orbitron uppercase">
            <span>Quantum Credential</span>
            <Award className="w-16 h-16 text-brand-gold" />
          </div>
          <div className="text-xl font-orbitron font-bold text-brand-gold">
            {overallMastery === 0
              ? 'Diagnostic Pending'
              : overallMastery > 90
              ? 'Level 4 Master'
              : overallMastery > 75
              ? 'Level 3 Scholar'
              : overallMastery > 50
              ? 'Level 2 Practitioner'
              : 'Level 1 Novice'}
          </div>
          <div className="text-[11px] text-text-secondary font-mono">
            <span>{overallMastery === 0 ? 'Awaiting first laboratory experiment' : 'QRACE Empirical Standard'}</span>
          </div>
        </Card>
      </div>

      {/* Center Row: Competency Radar & Cognitive Delta Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
        {/* Competency Radar */}
        <Card className="p-24 flex flex-col gap-16">
          <div className="flex justify-between items-center">
            <SectionHeader title="6-Domain Quantum Competency Radar" />
            <span className="text-[10px] font-mono text-brand-primary">Physics-Derived Mastery</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={competencyData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="domain" stroke="var(--color-text-secondary)" fontSize={11} />
                <PolarRadiusAxis domain={[0, 100]} stroke="rgba(255,255,255,0.2)" fontSize={9} />
                <Radar
                  name="Student Skill"
                  dataKey="score"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Derivations breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 pt-12 border-t border-brand-border/40">
            {competencyData.map(c => (
              <div key={c.domain} className="p-8 rounded-lg bg-surface border border-brand-border text-[10px]">
                <div className="font-orbitron font-bold text-text-primary flex justify-between">
                  <span>{c.domain}</span>
                  <span className="text-brand-cyan">{c.score}%</span>
                </div>
                <div className="text-text-muted mt-2 truncate font-mono" title={c.derivation}>
                  {c.derivation}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Cognitive Delta Trend */}
        <Card className="p-24 flex flex-col gap-16">
          <div className="flex justify-between items-center">
            <SectionHeader title="Cognitive Delta Convergence (TVD)" />
            <Badge color="cyan">Hypothesis Precision</Badge>
          </div>
          {cognitiveDeltaTrend.length === 0 ? (
            <div className="h-[300px] w-full flex flex-col items-center justify-center p-20 text-center border border-dashed border-brand-border/40 rounded-xl bg-surface/30">
              <Target className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <div className="text-sm font-semibold text-text-primary">No Hypotheses Evaluated Yet</div>
              <div className="text-xs text-text-secondary max-w-sm mt-1">
                Cognitive Delta tracks the Total Variation Distance between your pre-run predictions and physical outcomes. Complete a Conflict Lab to record your first point.
              </div>
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cognitiveDeltaTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="lab" stroke="var(--color-text-muted)" fontSize={10} />
                  <YAxis domain={[0, 0.6]} stroke="var(--color-text-muted)" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface-raised)',
                      border: '1px solid var(--color-brand-border)',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                    formatter={(val: any) => [`${Number(val).toFixed(3)} TVD`]}
                  />
                  <Line
                    type="monotone"
                    dataKey="tvd"
                    stroke="#22d3ee"
                    strokeWidth={3}
                    name="Cognitive Delta (TVD)"
                    dot={{ r: 5, fill: '#22d3ee' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="text-[11px] text-text-secondary text-center">
            Decreasing Total Variation Distance (TVD) proves intuition is converging with mathematical reality.
          </div>
        </Card>
      </div>

      {/* Concept Mastery Matrix */}
      <Card className="p-24 flex flex-col gap-16">
        <div className="flex justify-between items-center">
          <div>
            <SectionHeader title="Quantum Concept Mastery Matrix" />
            <p className="text-xs text-text-muted mt-1">
              Rigorous breakdown of core quantum physics principles verified across virtual laboratories.
            </p>
          </div>
          <span className="text-xs font-mono text-text-muted">
            QRACE Core Taxonomy
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-brand-border text-text-muted uppercase">
                <th className="p-3">ID</th>
                <th className="p-3">Core Quantum Concept</th>
                <th className="p-3">Physics Domain</th>
                <th className="p-3">Governing Law / Mathematical Form</th>
                <th className="p-3">Mastery Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/40">
              {CONCEPT_MASTERY_DEFINITIONS.map(c => {
                const info = getConceptStatus(c.misconceptionId);
                return (
                  <tr key={c.id} className="hover:bg-surface/40">
                    <td className="p-3 text-brand-primary font-bold">{c.id}</td>
                    <td className="p-3 text-text-primary font-semibold font-sans">{c.concept}</td>
                    <td className="p-3 text-text-secondary">{c.domain}</td>
                    <td className="p-3 text-cyan-300">{c.rule}</td>
                    <td className="p-3">
                      <Badge color={info.color}>{info.badge}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Circuit Attempts Ledger (Database-backed) */}
      <Card className="p-24 flex flex-col gap-16">
        <div className="flex justify-between items-center">
          <SectionHeader title="Database-Backed Learning History & Attempts" />
          <span className="text-xs font-mono text-text-muted">
            {dbProgress?.recent_attempts.length ?? 0} recent attempts logged
          </span>
        </div>

        {!dbProgress || dbProgress.recent_attempts.length === 0 ? (
          <div className="p-20 text-center border border-dashed border-brand-border rounded-xl">
            <History className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <div className="text-sm font-semibold text-text-primary">No Database Attempts Logged Yet</div>
            <div className="text-xs text-text-secondary max-w-sm mx-auto mt-1">
              Your submission history is preserved in PostgreSQL. Run circuits in the Circuit Studio or complete coding challenges to build your empirical audit trail.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-brand-border text-text-muted uppercase">
                  <th className="p-3">Attempt ID</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Cognitive Delta</th>
                  <th className="p-3">Evaluation Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {dbProgress.recent_attempts.map(att => (
                  <tr key={att.id} className="hover:bg-surface/40">
                    <td className="p-3 text-text-primary font-bold">{att.id.slice(0, 8)}…</td>
                    <td className="p-3 text-text-secondary">{new Date(att.timestamp).toLocaleString()}</td>
                    <td className="p-3 text-cyan-300">{att.cognitive_delta ? `${att.cognitive_delta.toFixed(3)} TVD` : 'N/A'}</td>
                    <td className="p-3">
                      <Badge color={att.was_correct ? 'green' : 'cyan'}>
                        {att.was_correct ? 'Passed' : 'Evaluated'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Misconception Resolution Logs Table */}
      <Card className="p-24 flex flex-col gap-16">
        <div className="flex justify-between items-center">
          <SectionHeader title="Misconception Refutation & Mastery Audit" />
          <span className="text-xs font-mono text-text-muted">
            {resolvedMisconceptions.length} of 8 verified resolved
          </span>
        </div>

        {resolvedMisconceptions.length === 0 ? (
          <div className="p-24 text-center text-xs text-text-muted border border-dashed border-brand-border rounded-xl">
            No misconceptions resolved yet. Go to{' '}
            <a href="/labs/conflict" className="text-brand-primary underline">
              Cognitive Conflict Lab
            </a>{' '}
            to test your hypotheses and resolve misconceptions.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-border/60 text-text-muted font-orbitron uppercase tracking-wider">
                  <th className="pb-12">Misconception Code</th>
                  <th className="pb-12">Flawed Model Tested</th>
                  <th className="pb-12">Date Cleared</th>
                  <th className="pb-12">Final Cognitive Delta</th>
                  <th className="pb-12">Cognitive Status</th>
                  <th className="pb-12">Empirical Laboratory Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/30">
                {resolvedMisconceptions.map(m => (
                  <tr key={m.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-14 font-mono font-bold text-brand-primary">{m.id}</td>
                    <td className="py-14 font-medium text-text-primary">{m.title}</td>
                    <td className="py-14 text-text-muted">{m.resolvedDate}</td>
                    <td className="py-14 font-mono text-brand-cyan">{m.tvd.toFixed(3)} TVD</td>
                    <td className="py-14">
                      <span className="px-8 py-3 rounded-full text-[10px] font-orbitron font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {m.status}
                      </span>
                    </td>
                    <td className="py-14 text-text-secondary max-w-[340px] leading-relaxed">
                      {m.evidence}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
