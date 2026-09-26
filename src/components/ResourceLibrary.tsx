import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Clock3, Search } from "lucide-react";
import { CircuitMotif, WaveMotif } from "./QuantumArtwork";
import type { WorkspaceResource } from "../content/workspaceCatalog";

export default function ResourceLibrary({
  resources,
  kind,
}: {
  resources: WorkspaceResource[];
  kind: "labs" | "algorithms";
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [level, setLevel] = useState("All levels");
  const categories = ["All", ...new Set(resources.map((r) => r.category))];
  const filtered = resources.filter(
    (r) =>
      (category === "All" || r.category === category) &&
      (level === "All levels" || r.level === level) &&
      `${r.title} ${r.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="ql-library-controls">
        <div className="ql-tabs" aria-label="Resource categories">
          {categories.map((c) => (
            <button
              key={c}
              className={category === c ? "active" : ""}
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {c === "All" ? `All ${kind}` : c}
            </button>
          ))}
        </div>
        <div className="ql-library-search">
          <label className="ql-inline-search">
            <Search size={16} />
            <input
              aria-label={`Search ${kind}`}
              placeholder={`Search ${kind}…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            aria-label="Filter by difficulty"
            className="ql-select"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            {["All levels", "Beginner", "Intermediate", "Advanced"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>
      <p className="ql-results-count" aria-live="polite">
        {filtered.length} {kind === "labs" ? "experiments" : "algorithms"} to
        explore
      </p>
      <div className="ql-library-grid">
        {filtered.map((r, i) => (
          <Link to={r.to} key={r.to} className="ql-library-card">
            <div className={`ql-library-art ql-art-${r.art}`}>
              <span>{r.category.toUpperCase()}</span>
              {r.art % 2 ? <WaveMotif /> : <CircuitMotif variant={i % 2} />}
              <ArrowUpRight size={17} />
            </div>
            <div className="ql-library-body">
              <span className="ql-level">
                <i className={`level-${r.level.toLowerCase()}`} />
                {r.level}
              </span>
              <h2>{r.title}</h2>
              <strong className="ql-library-question">{r.question}</strong>
              <p>{r.description}</p>
              <p className="ql-library-takeaway">
                <span>Your goal</span> {r.takeaway}
              </p>
              <div className="ql-library-card-bottom">
                <span>
                  {r.duration ? (
                    <>
                      <Clock3 size={13} />
                      {r.duration}
                    </>
                  ) : (
                    "Interactive exploration"
                  )}
                </span>
                <span>
                  {kind === "labs" ? "Open experiment" : "Explore algorithm"}
                  <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {!filtered.length && (
        <div className="ql-empty">
          <Search size={28} />
          <h3>No matches this time.</h3>
          <p>Try another topic or broaden your filters.</p>
          <button
            className="ql-button ql-button-white"
            onClick={() => {
              setQuery("");
              setCategory("All");
              setLevel("All levels");
            }}
          >
            Reset filters
          </button>
        </div>
      )}
    </>
  );
}
