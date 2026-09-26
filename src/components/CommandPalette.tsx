import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, BookOpen, Search, X } from "lucide-react";
import { V3_CURRICULUM } from "../content/curriculum";
import {
  ALGORITHM_RESOURCES,
  LAB_RESOURCES,
} from "../content/workspaceCatalog";
import { useDialogFocus } from "../hooks/useDialogFocus";

const destinations = [
  { title: "Overview", category: "Workspace", to: "/" },
  { title: "Circuit studio", category: "Workspace", to: "/labs/studio" },
  { title: "Learning path", category: "Workspace", to: "/learn" },
  { title: "Challenges", category: "Workspace", to: "/challenges" },
  { title: "My progress", category: "Workspace", to: "/progress" },
  {
    title: "Hardware explorer",
    category: "Workspace",
    to: "/explore/hardware",
  },
  ...LAB_RESOURCES.map((r) => ({ title: r.title, category: "Lab", to: r.to })),
  ...ALGORITHM_RESOURCES.map((r) => ({
    title: r.title,
    category: "Algorithm",
    to: r.to,
  })),
  ...V3_CURRICULUM.flatMap((m) =>
    m.lessons.map((l) => ({
      title: l.title,
      category: m.title,
      to: `/learn/${m.id}/${l.id}`,
    })),
  ),
];
export default function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useDialogFocus(isOpen, ref, onClose);
  const results = useMemo(
    () =>
      destinations.filter((d) =>
        `${d.title} ${d.category}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );
  useEffect(() => {
    setQuery("");
    setSelected(0);
  }, [isOpen]);
  useEffect(() => {
    ref.current
      ?.querySelector(`#ql-search-result-${selected}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selected, query]);
  if (!isOpen) return null;
  const select = (to: string) => {
    onClose();
    navigate(to);
  };
  return (
    <div className="ql-modal-backdrop" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Search Quantum Lens"
        className="ql-search-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ql-search-input">
          <Search size={21} />
          <input
            aria-label="Search lessons, labs, and algorithms"
            role="combobox"
            aria-expanded="true"
            aria-controls="ql-search-results"
            aria-activedescendant={
              results.length ? `ql-search-result-${selected}` : undefined
            }
            placeholder="What are you curious about?"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelected((i) => Math.max(0, Math.min(i + 1, results.length - 1)));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelected((i) => Math.max(0, i - 1));
              }
              if (e.key === "Enter" && results[selected]) {
                e.preventDefault();
                select(results[selected].to);
              }
            }}
          />
          <button
            className="ql-icon-button"
            aria-label="Close search"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <div
          className="ql-search-results"
          id="ql-search-results"
          role="listbox"
        >
          {results.map((r, i) => (
            <button
              role="option"
              aria-selected={selected === i}
              id={`ql-search-result-${i}`}
              className={selected === i ? "selected" : ""}
              key={`${r.to}-${i}`}
              onMouseMove={() => setSelected(i)}
              onClick={() => select(r.to)}
            >
              <BookOpen size={17} />
              <span>
                <strong>{r.title}</strong>
                <small>{r.category}</small>
              </span>
              <ArrowUpRight size={16} />
            </button>
          ))}
          {!results.length && (
            <div className="ql-empty">
              <Search size={25} />
              <h3>No results yet.</h3>
              <p>Try a concept like “phase” or “gates”.</p>
            </div>
          )}
        </div>
        <div className="ql-search-footer">
          <span>↑ ↓ to explore · Enter to open</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}
