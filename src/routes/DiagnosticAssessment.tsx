import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ClipboardCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';
import { fetchDiagnosticForm, fetchDiagnosticSummary, submitDiagnostic, type DiagnosticForm, type DiagnosticPhase, type DiagnosticResult } from '../api/diagnostics';

export default function DiagnosticAssessment() {
  const { token, user, openAuthModal } = useAuth();
  const [params, setParams] = useSearchParams();
  const requested = params.get('phase') as DiagnosticPhase | null;
  const [phase, setPhase] = useState<DiagnosticPhase>(requested === 'post' ? 'post' : 'baseline');
  const [form, setForm] = useState<DiagnosticForm | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setBusy(true); setError('');
    fetchDiagnosticSummary(token).then(summary => {
      const chosen = requested === 'baseline' || requested === 'post' ? requested : summary.recommended_phase;
      if (!active) throw new Error('cancelled');
      setPhase(chosen); setParams({ phase: chosen }, { replace: true });
      return fetchDiagnosticForm(token, chosen);
    }).then(data => { if (active) { setForm(data); setConfidence(Object.fromEntries(data.items.map(item => [item.id, 3]))); } })
      .catch(e => { if (active && e.message !== 'cancelled') setError(e.message); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [token, requested, setParams]);

  async function submit() {
    if (!token || !form || Object.keys(answers).length !== form.items.length) return;
    setBusy(true); setError('');
    try { setResult(await submitDiagnostic(token, phase, answers, confidence)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not grade this diagnostic'); }
    finally { setBusy(false); }
  }

  if (!user) return <div className="ql-page"><section className="ql-panel ql-diagnostic-intro"><ClipboardCheck size={32}/><h1>Concept diagnostic</h1><p>Sign in so the server can preserve your evidence and recommend the right experiment.</p><button className="ql-button ql-button-primary" onClick={() => openAuthModal('login')}>Sign in</button></section></div>;
  if (result) return <div className="ql-page"><section className="ql-panel ql-diagnostic-result"><CheckCircle2 size={38}/><p className="ql-eyebrow">{phase.toUpperCase()} DIAGNOSTIC · SERVER GRADED</p><h1>{result.score}%</h1><p>{result.correct_count} of {result.item_count} concepts verified. Incorrect concepts now have evidence-backed remediation on your progress page.</p><div className="ql-diagnostic-concepts">{result.items.map(item => <div key={item.item_id} className={item.passed ? 'passed' : 'review'}><strong>{item.misconception_id} · {item.concept}</strong><span>{item.passed ? 'Verified' : 'Targeted review created'}</span></div>)}</div><Link to="/progress" className="ql-button ql-button-primary">See evidence and next step <ArrowRight size={15}/></Link></section></div>;
  return <div className="ql-page"><div className="ql-page-heading"><div><p className="ql-eyebrow">{phase.toUpperCase()} CONCEPT DIAGNOSTIC</p><h1>{phase === 'baseline' ? 'Map your starting mental models.' : 'Verify what changed.'}</h1><p>Eight alternate-form questions. Answers and confidence are graded on the server; this is evidence, not a personality quiz.</p></div></div>{error && <div className="ql-notice error" role="alert">{error}</div>}{busy && !form ? <div className="ql-panel ql-empty"><RefreshCw className="animate-spin"/><p>Loading diagnostic…</p></div> : <div className="ql-diagnostic-list">{form?.items.map((item, index) => <fieldset className="ql-panel ql-diagnostic-question" key={item.id}><legend><span>{String(index + 1).padStart(2, '0')}</span>{item.concept}</legend><h2>{item.prompt}</h2><div className="ql-diagnostic-options">{item.options.map((option, optionIndex) => <label key={option}><input type="radio" name={item.id} checked={answers[item.id] === optionIndex} onChange={() => setAnswers(current => ({ ...current, [item.id]: optionIndex }))}/><span>{option}</span></label>)}</div><label className="ql-confidence">Confidence <input type="range" min="1" max="5" value={confidence[item.id] ?? 3} onChange={event => setConfidence(current => ({ ...current, [item.id]: Number(event.target.value) }))}/><strong>{confidence[item.id] ?? 3}/5</strong></label></fieldset>)}</div>}<button className="ql-button ql-button-primary" disabled={busy || !form || Object.keys(answers).length !== form.items.length} onClick={submit}>{busy ? 'Grading…' : 'Submit all eight answers'} <ArrowRight size={15}/></button></div>;
}
