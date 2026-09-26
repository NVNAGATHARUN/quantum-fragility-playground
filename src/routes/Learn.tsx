import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  LockKeyhole,
  Search,
  Sparkles,
} from "lucide-react";
import { V3_CURRICULUM } from "../content/curriculum";
import { useLessonProgress } from "../hooks/useLessonProgress";
import { useAuth } from "../providers/AuthProvider";

export default function Learn() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState("m01-math-primer");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All modules");
  const { isCompleted, error } = useLessonProgress();
  const { user, openAuthModal } = useAuth();
  const availableLessons = V3_CURRICULUM.flatMap((m) => m.lessons).filter(
    (l) => l.status === "available",
  );
  const completed = availableLessons.filter((l) =>
    isCompleted(l.moduleId, l.id),
  ).length;
  const next =
    availableLessons.find((l) => !isCompleted(l.moduleId, l.id)) ||
    availableLessons[0];
  const modules = V3_CURRICULUM.filter(
    (m) =>
      `${m.title} ${m.subtitle} ${m.lessons.map((l) => l.title).join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "All modules" ||
        (filter === "Available now"
          ? m.status === "available"
          : m.status !== "available")),
  );
  return (
    <div className="ql-page">
      <div className="ql-page-heading">
        <div>
          <p className="ql-eyebrow">THE LEARNING PATH</p>
          <h1>One concept. A new perspective.</h1>
          <p>A thoughtful path from your first qubit to quantum algorithms.</p>
        </div>
        <span className="ql-pill">
          <BookOpen size={14} /> {availableLessons.length} available lessons
        </span>
      </div>
      <div className="ql-learning-layout">
        <div>
          <div className="ql-path-intro">
            <div>
              <span className="ql-eyebrow">START WHERE YOU ARE</span>
              <h2>From curiosity to understanding.</h2>
              <p>
                Read a little, predict an outcome, then put your intuition to
                the test. Each module brings the theory closer to something you
                can see.
              </p>
            </div>
            <span className="ql-path-symbol" aria-hidden="true">
              |ψ⟩
            </span>
          </div>
          <div className="ql-filter-bar">
            <div className="ql-tabs" aria-label="Module availability">
              {["All modules", "Available now", "Coming next"].map((t) => (
                <button
                  key={t}
                  aria-pressed={filter === t}
                  className={filter === t ? "active" : ""}
                  onClick={() => setFilter(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <label className="ql-inline-search">
              <Search size={15} />
              <input
                aria-label="Search modules"
                placeholder="Find a concept…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>
          <div className="ql-module-list">
            {modules.map((m) => {
              const available =
                m.status === "available" && m.lessons.length > 0;
              const done = m.lessons.filter((l) =>
                isCompleted(m.id, l.id),
              ).length;
              const open = expanded === m.id || !!query;
              return (
                <article
                  key={m.id}
                  className={`ql-module ${open && available ? "expanded" : ""} ${!available ? "planned" : ""}`}
                >
                  <button
                    className="ql-module-toggle"
                    disabled={!available}
                    aria-expanded={available && open}
                    aria-controls={`lessons-${m.id}`}
                    onClick={() => setExpanded(open ? "" : m.id)}
                  >
                    <span className="ql-module-number">
                      {done > 0 && done === m.lessons.length ? (
                        <CheckCircle2 size={23} />
                      ) : (
                        m.number
                      )}
                    </span>
                    <span className="ql-module-info">
                      <span className="ql-course-meta">
                        {available
                          ? `${m.lessons.length} LESSONS${done ? ` · ${done} COMPLETED` : ""}`
                          : "COMING NEXT"}
                      </span>
                      <h2>{m.title}</h2>
                      <p>{m.subtitle}</p>
                    </span>
                    {available ? (
                      <ChevronDown
                        size={18}
                        className={open ? "rotated" : ""}
                      />
                    ) : (
                      <LockKeyhole size={17} />
                    )}
                  </button>
                  {available && open && (
                    <div id={`lessons-${m.id}`} className="ql-module-lessons">
                      <p>{m.description}</p>
                      {m.lessons.map((l, i) => (
                        <Link
                          key={l.id}
                          to={`/learn/${m.id}/${l.id}`}
                          className="ql-lesson-row"
                        >
                          <span
                            className={`ql-lesson-step ${isCompleted(m.id, l.id) ? "completed" : ""}`}
                          >
                            {isCompleted(m.id, l.id) ? (
                              <CheckCircle2 size={17} />
                            ) : (
                              String(i + 1).padStart(2, "0")
                            )}
                          </span>
                          <span>
                            <strong>{l.title}</strong>
                            <small>{l.typeLabel}</small>
                          </span>
                          <span className="ql-lesson-duration">
                            <Clock3 size={13} /> {l.duration}
                          </span>
                          <ArrowRight size={16} />
                        </Link>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
            {!modules.length && (
              <div className="ql-empty">
                <Search size={28} />
                <h3>No matching concepts yet.</h3>
                <p>Try “qubits”, “gates”, or clear your filters.</p>
                <button
                  className="ql-button ql-button-white"
                  onClick={() => {
                    setQuery("");
                    setFilter("All modules");
                  }}
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </div>
        <aside className="ql-path-aside">
          <div className="ql-panel">
            <span className="ql-eyebrow">YOUR LEARNING JOURNEY</span>
            <div className="ql-big-progress">
              <strong>
                {error ? "—" : completed}
                <span> / {availableLessons.length}</span>
              </strong>
              <p>lessons completed</p>
            </div>
            <div className="ql-progress-track">
              <i
                style={{
                  width: `${(completed / availableLessons.length) * 100}%`,
                }}
              />
            </div>
            <p className="ql-aside-copy">
              {error
                ? "We couldn’t load your saved progress. Your lessons are still available."
                : user
                  ? "Every concept is a step forward. Keep exploring at your own pace."
                  : "Create an account to save completed lessons and pick up where you left off."}
            </p>
            <button
              className="ql-button ql-button-primary"
              onClick={() =>
                user
                  ? navigate(`/learn/${next.moduleId}/${next.id}`)
                  : openAuthModal("signup")
              }
            >
              {user ? "Continue learning" : "Save your progress"}
              <ArrowRight size={15} />
            </button>
          </div>
          <div className="ql-path-tip">
            <Sparkles size={22} />
            <h3>Understanding takes practice.</h3>
            <p>
              You don’t need to get everything right on the first try. The labs
              are a place to experiment, get surprised, and try again.
            </p>
            <Link to="/labs">
              Find your next experiment <ArrowRight size={14} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
