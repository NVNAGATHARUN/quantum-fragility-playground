import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Code2,
  FlaskConical,
  Play,
  Sparkles,
} from "lucide-react";
import {
  QuantumOrb,
  CircuitMotif,
  WaveMotif,
} from "../components/QuantumArtwork";
import { V3_CURRICULUM } from "../content/curriculum";
import { useAuth } from "../providers/AuthProvider";
import { useLessonProgress } from "../hooks/useLessonProgress";

export default function Home() {
  const { user } = useAuth();
  const { isCompleted, isLoading, error } = useLessonProgress();
  const [angle, setAngle] = useState(90);
  const modules = V3_CURRICULUM.filter(
    (m) => m.status === "available" && m.lessons.length,
  );
  const lessons = modules.flatMap((m) => m.lessons);
  const completed = lessons.filter((l) => isCompleted(l.moduleId, l.id)).length;
  const next =
    lessons.find((l) => !isCompleted(l.moduleId, l.id)) || lessons[0];
  const probability = Math.round(Math.cos((angle * Math.PI) / 360) ** 2 * 100);

  return (
    <div className="ql-page ql-overview">
      <div className="ql-page-heading">
        <div>
          <p className="ql-eyebrow">YOUR QUANTUM JOURNEY</p>
          <h1>
            {user
              ? `Welcome back, ${user.full_name.split(" ")[0]}.`
              : "A new way to see the world."}
          </h1>
          <p>Build intuition. Test ideas. Make quantum computing click.</p>
        </div>
        <Link to="/learn" className="ql-button ql-button-white">
          Explore learning path <ArrowRight size={16} />
        </Link>
      </div>
      <section className="ql-hero" aria-label="Begin your quantum journey">
        <div className="ql-hero-copy">
          <span className="ql-hero-label">
            <span /> THE QUANTUM LEARNING LAB
          </span>
          <h2>
            Big ideas.
            <br />
            Small particles.
            <br />
            <em>Endless possibilities.</em>
          </h2>
          <p>
            Go from “what if” to “now I get it.” Learn the concepts, build a
            circuit, and see quantum theory come alive.
          </p>
          <div className="ql-hero-actions">
            <Link
              to={`/learn/${next.moduleId}/${next.id}`}
              className="ql-button ql-button-mint"
            >
              {completed ? "Continue learning" : "Start learning"}{" "}
              <ArrowRight size={17} />
            </Link>
            <Link to="/labs/studio" className="ql-hero-secondary">
              <Play size={15} /> Open the playground
            </Link>
          </div>
          <div className="ql-hero-footnote">
            <span>01 — Learn by doing</span>
            <span>
              No quantum background needed <ArrowDown size={12} />
            </span>
          </div>
        </div>
        <div className="ql-hero-art">
          <span className="ql-art-caption">THE BEAUTY OF POSSIBILITY</span>
          <QuantumOrb />
          <div className="ql-state-caption">
            <span className="ql-state-dot" />
            <span>|ψ⟩ = α|0⟩ + β|1⟩</span>
            <span className="ql-art-small">A WORLD BEYOND 0 AND 1</span>
          </div>
        </div>
      </section>
      <section className="ql-overview-strip" aria-label="Workspace at a glance">
        <div>
          <span className="ql-stat-icon">
            <BookOpen size={19} />
          </span>
          <span>
            <strong>{modules.length} learning modules</strong>
            <small>Build a solid foundation</small>
          </span>
        </div>
        <div>
          <span className="ql-stat-icon">
            <FlaskConical size={19} />
          </span>
          <span>
            <strong>Hands-on experiments</strong>
            <small>Make the abstract tangible</small>
          </span>
        </div>
        <div>
          <span className="ql-stat-icon">
            <Code2 size={19} />
          </span>
          <span>
            <strong>Your circuit playground</strong>
            <small>Build, run, and understand</small>
          </span>
        </div>
        <Link to="/progress">
          <span
            className="ql-progress-ring"
            style={
              {
                "--progress": `${(completed / lessons.length) * 360}deg`,
              } as React.CSSProperties
            }
          >
            {error ? "—" : isLoading ? "…" : completed}
          </span>
          <span>
            <strong>
              {error
                ? "Progress unavailable"
                : `${completed} of ${lessons.length} lessons`}
            </strong>
            <small>
              {user
                ? "Your learning progress"
                : "Sign in to track your journey"}
            </small>
          </span>
          <ArrowUpRight size={17} />
        </Link>
      </section>
      <div className="ql-home-columns">
        <div className="ql-home-primary">
          <div className="ql-section-heading">
            <div>
              <span className="ql-eyebrow">ONE STEP AT A TIME</span>
              <h2>
                {completed
                  ? "Keep your momentum."
                  : "Start with the fundamentals."}
              </h2>
            </div>
            <Link to="/learn">
              View learning path <ArrowRight size={15} />
            </Link>
          </div>
          <div className="ql-course-grid">
            {modules.map((m, i) => {
              const done = m.lessons.filter((l) =>
                isCompleted(m.id, l.id),
              ).length;
              const lesson =
                m.lessons.find((l) => !isCompleted(m.id, l.id)) || m.lessons[0];
              return (
                <Link
                  key={m.id}
                  to={`/learn/${m.id}/${lesson.id}`}
                  className="ql-course-card"
                >
                  <div className={`ql-course-art ql-art-${i}`}>
                    <span className="ql-course-number">MODULE {m.number}</span>
                    {i === 0 ? (
                      <div className="ql-math-art">
                        α<span> + </span>β<small>THE LANGUAGE OF QUANTUM</small>
                      </div>
                    ) : i === 1 ? (
                      <div className="ql-mini-orb">
                        <QuantumOrb compact />
                      </div>
                    ) : (
                      <CircuitMotif />
                    )}
                  </div>
                  <div className="ql-course-body">
                    <span className="ql-course-meta">
                      {i === 0
                        ? "FOUNDATIONS"
                        : i === 1
                          ? "QUANTUM STATES"
                          : "BUILDING BLOCKS"}
                    </span>
                    <h3>{m.title}</h3>
                    <p>{m.subtitle}</p>
                    <div className="ql-course-bottom">
                      <span>
                        <BookOpen size={13} /> {m.lessons.length} lessons
                      </span>
                      <span className="ql-round-arrow">
                        {done === m.lessons.length ? (
                          <Check size={16} />
                        ) : (
                          <ArrowUpRight size={16} />
                        )}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="ql-section-heading ql-experiments-heading">
            <div>
              <span className="ql-eyebrow">CURIOSITY, MEET POSSIBILITY</span>
              <h2>Your next “aha” moment.</h2>
            </div>
            <Link to="/labs">
              All experiments <ArrowRight size={15} />
            </Link>
          </div>
          <div className="ql-experiment-grid">
            <Link
              to="/labs/guided/superposition"
              className="ql-experiment-card"
            >
              <div className="ql-experiment-art ql-art-1">
                <WaveMotif />
              </div>
              <div>
                <span className="ql-course-meta">
                  GUIDED EXPERIMENT · 10 MIN
                </span>
                <h3>Two possibilities. One qubit.</h3>
                <p>Meet superposition, one Hadamard gate at a time.</p>
              </div>
              <ArrowUpRight size={19} />
            </Link>
            <Link
              to="/explore/algorithms/bell-state"
              className="ql-experiment-card"
            >
              <div className="ql-experiment-art ql-art-2">
                <CircuitMotif />
              </div>
              <div>
                <span className="ql-course-meta">ALGORITHM EXPLORER</span>
                <h3>Connected, even apart.</h3>
                <p>Build a Bell pair and explore entanglement.</p>
              </div>
              <ArrowUpRight size={19} />
            </Link>
          </div>
        </div>
        <aside className="ql-home-secondary">
          <div className="ql-sandbox-card">
            <div className="ql-card-kicker">
              <span className="ql-dot" /> A LITTLE EXPERIMENT{" "}
              <FlaskConical size={15} />
            </div>
            <h3>A qubit. A world of possibility.</h3>
            <p>Rotate the state. Watch the odds change.</p>
            <div className="ql-probability-bars">
              <div>
                <span>|0⟩</span>
                <div>
                  <i style={{ width: `${probability}%` }} />
                </div>
                <strong>{probability}%</strong>
              </div>
              <div>
                <span>|1⟩</span>
                <div>
                  <i style={{ width: `${100 - probability}%` }} />
                </div>
                <strong>{100 - probability}%</strong>
              </div>
            </div>
            <label className="ql-range-label" htmlFor="quick-angle">
              Rotation angle θ <span>{angle}°</span>
            </label>
            <input
              id="quick-angle"
              type="range"
              min="0"
              max="180"
              step="1"
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
            />
            <div className="ql-range-endpoints">
              <span>|0⟩</span>
              <span>|+⟩</span>
              <span>|1⟩</span>
            </div>
            <p className="ql-sandbox-explainer" aria-live="polite">
              {angle === 90
                ? "Equal probabilities. Measuring gives 0 or 1 with a 50% chance."
                : `After a Y rotation, P(0) = cos²(θ/2). Here, that’s ${probability}%.`}
            </p>
            <Link to="/labs/studio">
              Take it to the circuit studio <ArrowRight size={15} />
            </Link>
          </div>
          <div className="ql-mentor-card">
            <span className="ql-mentor-symbol">
              <Sparkles size={22} />
            </span>
            <span className="ql-course-meta">YOUR THINKING PARTNER</span>
            <h3>
              Good questions lead
              <br />
              to great discoveries.
            </h3>
            <p>
              Stuck on a concept? Work through it with your AI tutor, one hint
              at a time.
            </p>
            <button
              className="ql-button ql-button-white"
              onClick={() =>
                window.dispatchEvent(new Event("quantum-lens:open-mentor"))
              }
            >
              Let’s figure it out <ArrowUpRight size={15} />
            </button>
            <small>AI can make mistakes. Test ideas in the lab.</small>
          </div>
        </aside>
      </div>
    </div>
  );
}
