import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Code2, RefreshCw, Search, Trophy } from "lucide-react";
import { listChallenges, type ChallengeDefinition } from "../api/challenges";
export default function ChallengeLibrary() {
  const [items, setItems] = useState<ChallengeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [type, setType] = useState("all");
  const [query, setQuery] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    listChallenges()
      .then((data) => {
        if (active) {
          if (!Array.isArray(data)) throw new Error("Invalid challenge list");
          setItems(data);
        }
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  const filtered = items.filter(
    (c) =>
      (type === "all" || c.type === type) &&
      `${c.title} ${c.subtitle}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="ql-page">
      <div className="ql-page-heading">
        <div>
          <p className="ql-eyebrow">PUT YOUR INTUITION TO WORK</p>
          <h1>The best way to know? Try.</h1>
          <p>
            Build, predict, debug, and optimize your way to a deeper
            understanding.
          </p>
        </div>
        <Link to="/labs/studio" className="ql-button ql-button-white">
          <Code2 size={16} />
          Practice in the studio
        </Link>
      </div>
      <div className="ql-challenge-intro">
        <span className="ql-auth-mark">
          <Trophy size={27} />
        </span>
        <div>
          <h2>A challenge for every kind of curious.</h2>
          <p>
            Work through a problem, test your solution, and learn from the
            feedback. Take as many attempts as you need.
          </p>
        </div>
      </div>
      <div className="ql-filter-bar">
        <div className="ql-tabs" aria-label="Challenge types">
          {["all", "build", "predict", "debug", "code", "optimize"].map((t) => (
            <button
              key={t}
              aria-pressed={type === t}
              className={type === t ? "active" : ""}
              onClick={() => setType(t)}
            >
              {t === "all" ? "All challenges" : t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <label className="ql-inline-search">
          <Search size={15} />
          <input
            aria-label="Search challenges"
            placeholder="Find a challenge…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      {loading ? (
        <div className="ql-empty" role="status">
          <RefreshCw size={25} />
          <h3>Preparing your challenges…</h3>
        </div>
      ) : error ? (
        <div className="ql-empty">
          <Trophy size={32} />
          <h3>The challenge library is taking a pause.</h3>
          <p>
            We couldn’t reach the challenge service. Try again, or keep
            experimenting in the circuit studio.
          </p>
          <button
            className="ql-button ql-button-primary"
            onClick={() => setRetry((r) => r + 1)}
          >
            <RefreshCw size={15} />
            Try again
          </button>
          <Link to="/labs/studio" className="ql-subtle-link">
            Open circuit studio <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="ql-library-grid">
          {filtered.map((c, i) => (
            <Link
              to={`/challenges/${c.id}`}
              key={c.id}
              className="ql-library-card"
            >
              <div className={`ql-challenge-art ql-art-${i % 4}`}>
                <span>{c.type.toUpperCase()}</span>
                <code>
                  {c.type === "predict"
                    ? "|ψ⟩ → ?"
                    : c.type === "debug"
                      ? "H · ? · H"
                      : c.type === "optimize"
                        ? "U → U′"
                        : "q[0] ─ H ─"}
                </code>
              </div>
              <div className="ql-library-body">
                <span className="ql-level">
                  <i />
                  {c.difficulty}
                </span>
                <h2>{c.title}</h2>
                <p>{c.subtitle}</p>
                <div className="ql-library-card-bottom">
                  <span>{c.category}</span>
                  <span>
                    Take the challenge <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      {!loading && !error && !filtered.length && (
        <div className="ql-empty">
          <Search size={28} />
          <h3>No challenges match these filters.</h3>
          <button
            className="ql-button ql-button-white"
            onClick={() => {
              setType("all");
              setQuery("");
            }}
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}
