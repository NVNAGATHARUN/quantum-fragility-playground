import React from "react";

export function ExperimentStatus({
  loading,
  error,
  complete,
  detail,
}: {
  loading: boolean;
  error?: string | null;
  complete: boolean;
  detail?: string;
}) {
  return (
    <div
      className={`al-status ${error ? "is-error" : complete ? "is-complete" : ""}`}
      role={error ? "alert" : "status"}
    >
      <span className="al-status-dot" aria-hidden="true" />
      <span>
        <strong>
          {error
            ? "Experiment unavailable"
            : loading
              ? "Running quantum experiment…"
              : complete
                ? "Experiment complete ✓"
                : "Ready to run"}
        </strong>
        <small>
          {error ||
            detail ||
            (loading
              ? "Waiting for Qiskit Aer"
              : "Configure and run a simulation")}
        </small>
      </span>
    </div>
  );
}

export function ResultBanner({
  label,
  value,
  detail,
  children,
}: {
  label: string;
  value: string;
  detail: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="al-result-banner" aria-label={label}>
      <div>
        <span className="al-kicker">{label}</span>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
      {children}
    </section>
  );
}

export function ResultBar({
  label,
  value,
  detail,
  target = false,
}: {
  label: string;
  value: number;
  detail?: string;
  target?: boolean;
}) {
  const percent = Math.max(0, Math.min(100, value * 100));
  return (
    <div className={`al-result-bar ${target ? "is-target" : ""}`}>
      <div className="al-result-bar-heading">
        <span>{label}</span>
        <strong>{percent.toFixed(1)}%</strong>
      </div>
      <div
        className="al-result-track"
        role="img"
        aria-label={`${label}: ${percent.toFixed(1)} percent`}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      {detail && <small>{detail}</small>}
    </div>
  );
}
