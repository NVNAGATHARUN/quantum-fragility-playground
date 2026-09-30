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
  const { isCompleted } = useLessonProgress();
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
    <div className="ql-page ql-overview ql-human-home">
      <section className="ql-hero" aria-label="Begin your quantum journey">
        <div className="ql-hero-copy">
          <span className="ql-hero-label">
            <span /> {user ? `WELCOME BACK, ${user.full_name.split(" ")[0].toUpperCase()}` : "THE QUANTUM LEARNING LAB"}
          </span>
          <h2>
            Learn quantum
            <br />
            by asking
            <br />
            <em>what changes.</em>
          </h2>
          <p>
            Make a prediction, build the circuit, and compare what you expected
            with what the simulator measures.
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
            <Link to="/judge" className="ql-hero-secondary ql-hero-judge-link">
              <Sparkles size={15} /> View SIH evidence
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
          <span className="ql-art-caption">A LIVE QUBIT · DRAG TO EXPLORE</span>
          <div className="ql-hero-experiment">
            <div className="ql-hero-orb-wrap">
              <QuantumOrb compact />
              <span className="ql-hero-state">|ψ⟩</span>
            </div>
            <div className="ql-hero-measurement" aria-live="polite">
              <div><span>|0⟩</span><i><b style={{ width: `${probability}%` }} /></i><strong>{probability}%</strong></div>
              <div><span>|1⟩</span><i><b style={{ width: `${100 - probability}%` }} /></i><strong>{100 - probability}%</strong></div>
            </div>
            <label htmlFor="hero-angle">Rotate the state <span>{angle}°</span></label>
            <input
              id="hero-angle"
              type="range"
              min="0"
              max="180"
              step="1"
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
            />
            <p>{angle === 90 ? "At 90°, either result is equally possible." : `A measurement now returns |0⟩ with ${probability}% probability.`}</p>
          </div>
        </div>
      </section>
      <section className="ql-overview-strip ql-learning-loop" aria-label="How learning works">
        <div>
          <span className="ql-stat-icon">
            <BookOpen size={19} />
          </span>
          <span>
            <strong>Learn</strong>
            <small>Meet one clear idea</small>
          </span>
        </div>
        <div>
          <span className="ql-stat-icon">
            <Sparkles size={19} />
          </span>
          <span>
            <strong>Predict</strong>
            <small>Commit to what you expect</small>
          </span>
        </div>
        <div>
          <span className="ql-stat-icon">
            <Code2 size={19} />
          </span>
          <span>
            <strong>Build and run</strong>
            <small>Test it in a real simulator</small>
          </span>
        </div>
        <Link to="/progress" aria-label="Open learning progress">
          <span className="ql-stat-icon"><FlaskConical size={19} /></span>
          <span>
            <strong>Understand</strong>
            <small>Compare evidence with intuition</small>
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
            {modules.slice(0, 3).map((m, i) => {
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
