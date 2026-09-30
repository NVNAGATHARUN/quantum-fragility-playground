import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FlaskConical,
  Sparkles,
  Target,
} from "lucide-react";
import { V3_CURRICULUM } from "../content/curriculum";
import { useLessonProgress } from "../hooks/useLessonProgress";
import { useAuth } from "../providers/AuthProvider";
import { useQuantumSession } from "../providers/QuantumSessionProvider";
import { fetchClassrooms, fetchAssignments, type ClassroomAssignment } from "../api/classrooms";
import { fetchProgressSummary, type StudentProgressSummary } from "../api/progress";
import { fetchDiagnosticSummary, type DiagnosticSummary } from "../api/diagnostics";

export default function ProgressOverview() {
  const { user, token, openAuthModal } = useAuth();
  const [assignments, setAssignments] = useState<ClassroomAssignment[]>([]);
  const [serverProgress, setServerProgress] = useState<StudentProgressSummary | null>(null);
  const [diagnostic, setDiagnostic] = useState<DiagnosticSummary | null>(null);
  useEffect(() => {
    if (!token || user?.role !== 'student') {
      setAssignments([]);
      setServerProgress(null);
      setDiagnostic(null);
      return;
    }
    fetchClassrooms(token).then(classes => Promise.all(classes.map(c => fetchAssignments(token, c.id)))).then(groups => setAssignments(groups.flat())).catch(() => setAssignments([]));
    fetchProgressSummary(token).then(setServerProgress).catch(() => setServerProgress(null));
    fetchDiagnosticSummary(token).then(setDiagnostic).catch(() => setDiagnostic(null));
  }, [token, user?.role]);
  const { isCompleted, error, isLoading } = useLessonProgress();
  const { labRecords, simulatedCircuitsCount } = useQuantumSession();
  const modules = V3_CURRICULUM.filter((m) => m.status === "available");
  const lessons = modules.flatMap((m) => m.lessons);
  const done = lessons.filter((l) => isCompleted(l.moduleId, l.id));
  const next =
    lessons.find((l) => !isCompleted(l.moduleId, l.id)) || lessons[0];
  const completionPercent = lessons.length
    ? Math.round((done.length / lessons.length) * 100)
    : 0;
  const firstName = user?.full_name?.split(" ")[0];
  return (
    <div className="ql-page ql-progress-page">
      <div className="ql-page-heading ql-progress-hero">
        <div>
          <p className="ql-eyebrow">{firstName ? `Welcome back, ${firstName}` : "Your learning journey"}</p>
          <h1>Pick up where you left off.</h1>
          <p>
            Review the lessons you completed, the questions you tested, and the
            next useful step in your learning path.
          </p>
          <div className="ql-progress-hero-actions">
            <Link to={`/learn/${next.moduleId}/${next.id}`} className="ql-button ql-button-primary">
              {done.length ? "Continue where you left off" : "Begin your first lesson"}
              <ArrowRight size={15} />
            </Link>
            <Link to="/labs" className="ql-progress-text-link">
              Explore a lab <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        <div className="ql-progress-portrait" aria-label={`${completionPercent}% of lessons completed`}>
          <div className="ql-progress-orbit" style={{ "--journey-progress": `${completionPercent}%` } as React.CSSProperties}>
            <span><strong>{completionPercent}%</strong><small>journey explored</small></span>
          </div>
          <p>{done.length ? `${done.length} lessons now part of your foundation` : "Your first insight is waiting"}</p>
        </div>
      </div>
      {!user && (
        <div className="ql-progress-welcome ql-progress-invitation">
          <Sparkles size={28} />
          <div>
            <h2>Let your progress follow you.</h2>
            <p>
              Create a free learning profile to continue on any device. Your
              current lab activity stays private in this browser until then.
            </p>
          </div>
          <button
            className="ql-button ql-button-primary"
            onClick={() => openAuthModal("signup")}
          >
            Save my journey <ArrowRight size={15} />
          </button>
        </div>
      )}
      {error && (
        <div className="ql-notice error" role="alert">
          Saved lesson progress is unavailable right now. Please check your
          connection and refresh.
        </div>
      )}
      {serverProgress?.recommendation && (
        <section className="ql-panel ql-adaptive-recommendation" aria-label="Evidence-based recommendation">
          <div>
            <span className="ql-eyebrow">
              {serverProgress.recommendation.misconception_id
                ? `${serverProgress.recommendation.misconception_id} · ${serverProgress.recommendation.stage?.toUpperCase()}`
                : "EVIDENCE-BASED NEXT STEP"}
            </span>
            <h2>{serverProgress.recommendation.title}</h2>
            <p>{serverProgress.recommendation.reason}</p>
            <small>Evidence: {serverProgress.recommendation.evidence}</small>
          </div>
          <Link to={serverProgress.recommendation.route} className="ql-button ql-button-primary">
            Start targeted activity <ArrowRight size={15} />
          </Link>
        </section>
      )}
      {user?.role === 'student' && (
        <section className="ql-panel ql-diagnostic-banner" aria-label="Concept diagnostic">
          <ClipboardCheck size={28}/>
          <div>
            <span className="ql-eyebrow">MEASURED LEARNING</span>
            <h2>{diagnostic?.baseline ? 'Verify your learning with an alternate form' : 'Establish your concept baseline'}</h2>
            <p>{diagnostic?.post && diagnostic.improvement !== null ? `Latest measured improvement: ${diagnostic.improvement >= 0 ? '+' : ''}${diagnostic.improvement} percentage points.` : 'Test eight core mental models and receive evidence-backed remediation.'}</p>
          </div>
          <Link to={`/diagnostic?phase=${diagnostic?.baseline ? 'post' : 'baseline'}`} className="ql-button ql-button-white">{diagnostic?.baseline ? 'Take post diagnostic' : 'Start baseline'} <ArrowRight size={15}/></Link>
        </section>
      )}
      <div className="ql-progress-stats ql-progress-vitals" aria-label="Learning momentum">
        {[
          {
            icon: BookOpen,
            number: error ? "—" : isLoading ? "…" : done.length,
            label: "Ideas explored",
            detail: `Across ${lessons.length} guided lessons`,
          },
          {
            icon: Target,
            number: modules.filter(
              (m) =>
                m.lessons.length &&
                m.lessons.every((l) => isCompleted(m.id, l.id)),
            ).length,
            label: "Foundations built",
            detail: `From ${modules.length} learning chapters`,
          },
          {
            icon: FlaskConical,
            number: serverProgress?.verified_attempts ?? simulatedCircuitsCount,
            label: serverProgress ? "Ideas tested" : "Experiments run",
            detail: serverProgress
              ? `${serverProgress.passed_attempts} passed · server graded`
              : "Hands-on work in this browser",
          },
        ].map(({ icon: Icon, number, label, detail }) => (
          <div className="ql-panel" key={label}>
            <Icon size={22} />
            <strong>{number}</strong>
            <h2>{label}</h2>
            <p>{detail}</p>
          </div>
        ))}
      </div>
      <div className="ql-progress-layout ql-progress-journey">
        <section className="ql-panel ql-journey-panel">
          <div className="ql-panel-title">
            <div>
              <span className="ql-eyebrow">Your path</span>
              <h2>Foundations you’re building</h2>
            </div>
            <span className="ql-course-meta">{done.length} of {lessons.length} explored</span>
          </div>
          <div className="ql-module-progress">
            {modules.map((m) => {
              const count = m.lessons.filter((l) =>
                isCompleted(m.id, l.id),
              ).length;
              return (
                <Link
                  to={`/learn/${m.id}/${(m.lessons.find((l) => !isCompleted(m.id, l.id)) || m.lessons[0]).id}`}
                  key={m.id}
                >
                  <span className="ql-module-number">{m.number}</span>
                  <div>
                    <h3>{m.title}</h3>
                    <div className="ql-progress-track">
                      <i
                        style={{
                          width: `${(count / m.lessons.length) * 100}%`,
                        }}
                      />
                    </div>
                    <small>{count ? `${count} of ${m.lessons.length} explored` : "Ready when you are"}</small>
                  </div>
                  <ArrowRight size={16} />
                </Link>
              );
            })}
          </div>
        </section>
        <aside className="ql-panel ql-next-lesson ql-human-next-step">
          <span className="ql-eyebrow">{serverProgress ? "Chosen from your evidence" : "Made for your next 10 minutes"}</span>
          <BookOpen size={30} />
          <h2>{serverProgress?.recommendation.title ?? next.title}</h2>
          <p>{serverProgress?.recommendation.reason ?? next.summary}</p>
          <div className="ql-next-context">
            <span>Next up</span>
            <strong>{next.typeLabel || "Guided concept"}</strong>
          </div>
          <Link
            to={serverProgress?.recommendation.route ?? `/learn/${next.moduleId}/${next.id}`}
            className="ql-button ql-button-primary"
          >
            {serverProgress ? "Follow my recommendation" : done.length ? "Continue my journey" : "Start this lesson"}
            <ArrowRight size={15} />
          </Link>
        </aside>
      </div>
      {assignments.length > 0 && <section className="ql-panel ql-progress-history">
        <div className="ql-panel-title"><h2>Assigned by your instructor</h2><span className="ql-course-meta">SERVER-VERIFIED COMPLETION</span></div>
        <div className="ql-history-list">{assignments.map(item => <Link key={item.id} to={item.route}>
          {item.current_user_completed ? <CheckCircle2 size={18}/> : <Target size={18}/>}<span><strong>{item.title}</strong><small>{item.current_user_completed ? 'Verified complete' : `${item.activity_type} · evidence required`}{item.due_at ? ` · due ${new Date(item.due_at).toLocaleDateString()}` : ''}</small></span><ArrowRight size={15}/>
        </Link>)}</div>
      </section>}
      <section className="ql-panel ql-progress-history">
        <div className="ql-panel-title">
          <div><span className="ql-eyebrow">Your story so far</span><h2>Your discoveries</h2></div>
          <span className="ql-course-meta">Lessons and experiments</span>
        </div>
        {!done.length && !labRecords.length ? (
          <div className="ql-empty">
            <CheckCircle2 size={27} />
            <h3>This space will become uniquely yours.</h3>
            <p>
              Each lesson, prediction, and experiment will leave a useful trace of how your understanding changed.
            </p>
            <Link to="/labs" className="ql-button ql-button-white">
              Explore the labs <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="ql-history-list">
            {done.map((l) => (
              <Link key={l.id} to={`/learn/${l.moduleId}/${l.id}`}>
                <CheckCircle2 size={18} />
                <span>
                  <strong>{l.title}</strong>
                  <small>Completed lesson</small>
                </span>
                <ArrowRight size={15} />
              </Link>
            ))}
            {labRecords.map((l, i) => (
              <div key={`${l.labId}-${i}`}>
                <FlaskConical size={18} />
                <span>
                  <strong>{l.title}</strong>
                  <small>
                    Local lab activity ·{" "}
                    {new Date(l.timestamp).toLocaleDateString()}
                  </small>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
      <Link to="/progress/details" className="ql-subtle-link">
        Open detailed lab analysis <ArrowRight size={14} />
      </Link>
    </div>
  );
}
