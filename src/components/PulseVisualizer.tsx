/**
 * PulseVisualizer
 *
 * Inline gate-pulse coupling drawer that renders inside Circuit Studio's gate
 * inspector panel. Shows the representative DRAG waveform (I and Q channels)
 * for the selected gate using an SVG canvas.
 *
 * These are EDUCATIONAL approximations, not calibrated device data.
 */
import { useMemo, useRef } from "react";
import { computePulse, GATE_PULSE, type PulsePoint } from "../lib/pulse";
import type { GateOperation } from "../types/quantum";
import { isRotationGate } from "../lib/studio";

interface PulseVisualizerProps {
  gate: GateOperation;
}

const W = 340;
const H = 110;
const PAD = { top: 14, right: 10, bottom: 22, left: 36 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

function pointsToPath(points: PulsePoint[], key: "I" | "Q"): string {
  if (points.length === 0) return "";
  const first = points[0];
  let d = `M ${first.t * PLOT_W},${(1 - (key === "I" ? first.I : first.Q)) * (PLOT_H / 2)}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    const x = p.t * PLOT_W;
    const y = (PLOT_H / 2) - (key === "I" ? p.I : p.Q) * (PLOT_H / 2);
    d += ` L ${x},${y}`;
  }
  return d;
}

function VirtualBadge() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "14px 16px",
      background: "rgba(148,163,184,0.07)",
      borderRadius: 10,
      border: "1px dashed rgba(148,163,184,0.25)",
      fontSize: 12,
      color: "#94a3b8",
      lineHeight: 1.5,
    }}>
      <span style={{ fontSize: 20 }}>⚡</span>
      <span>
        <strong style={{ color: "#cbd5e1" }}>Virtual gate</strong> — implemented as a
        classical software frame rotation on the control hardware. No microwave pulse is
        emitted; zero gate time overhead.
      </span>
    </div>
  );
}

export function PulseVisualizer({ gate }: PulseVisualizerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const params = useMemo(() => {
    const base = GATE_PULSE[gate.gate] ?? GATE_PULSE["X"];
    // Scale amplitude proportionally for rotation gates
    if (isRotationGate(gate.gate) && gate.params?.theta !== undefined) {
      const scale = Math.abs(gate.params.theta) / Math.PI;
      return { ...base, amplitude: base.amplitude * Math.min(scale, 1) };
    }
    return base;
  }, [gate.gate, gate.params?.theta]);

  const points = useMemo(() => computePulse(params), [params]);
  const isVirtual = params.amplitude === 0;
  const accent = params.color;

  const IPath = useMemo(() => pointsToPath(points, "I"), [points]);
  const QPath = useMemo(() => pointsToPath(points, "Q"), [points]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: accent,
        }}>
          Pulse Profile
        </span>
        <span style={{ fontSize: 10, color: "#64748b", fontStyle: "italic" }}>
          representative · not device-calibrated
        </span>
      </div>

      {isVirtual ? <VirtualBadge /> : (
        <>
          {/* SVG Waveform */}
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            style={{ display: "block", overflow: "visible" }}
            aria-label={`Pulse waveform for ${gate.gate} gate`}
          >
            {/* Background grid */}
            <defs>
              <linearGradient id={`pulse-bg-${gate.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={accent} stopOpacity="0.04" />
                <stop offset="1" stopColor={accent} stopOpacity="0.01" />
              </linearGradient>
            </defs>
            <rect
              x={PAD.left}
              y={PAD.top}
              width={PLOT_W}
              height={PLOT_H}
              fill={`url(#pulse-bg-${gate.id})`}
              rx={4}
            />
            {/* Zero line */}
            <line
              x1={PAD.left}
              y1={PAD.top + PLOT_H / 2}
              x2={PAD.left + PLOT_W}
              y2={PAD.top + PLOT_H / 2}
              stroke="rgba(148,163,184,0.18)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            {/* Y-axis labels */}
            <text x={PAD.left - 4} y={PAD.top + 4} textAnchor="end" fill="#64748b" fontSize={8}>+1</text>
            <text x={PAD.left - 4} y={PAD.top + PLOT_H / 2 + 3} textAnchor="end" fill="#64748b" fontSize={8}>0</text>
            <text x={PAD.left - 4} y={PAD.top + PLOT_H - 1} textAnchor="end" fill="#64748b" fontSize={8}>−1</text>
            {/* X-axis label */}
            <text x={PAD.left + PLOT_W / 2} y={H - 4} textAnchor="middle" fill="#475569" fontSize={9}>Time →</text>

            {/* Q channel (underneath) */}
            <g transform={`translate(${PAD.left},${PAD.top})`}>
              <path
                d={QPath}
                fill="none"
                stroke={accent}
                strokeWidth={1.5}
                strokeOpacity={0.45}
                strokeDasharray="4 3"
              />
            </g>

            {/* I channel (on top) */}
            <g transform={`translate(${PAD.left},${PAD.top})`}>
              {/* Area fill */}
              <path
                d={`${IPath} L ${PLOT_W},${PLOT_H / 2} L 0,${PLOT_H / 2} Z`}
                fill={accent}
                fillOpacity={0.08}
              />
              {/* Stroke */}
              <path
                d={IPath}
                fill="none"
                stroke={accent}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </svg>

          {/* Legend */}
          <div style={{ display: "flex", gap: 14, fontSize: 10, color: "#64748b" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <svg width={24} height={8}>
                <line x1={0} y1={4} x2={24} y2={4} stroke={accent} strokeWidth={2} />
              </svg>
              I(t) in-phase
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <svg width={24} height={8}>
                <line x1={0} y1={4} x2={24} y2={4} stroke={accent} strokeWidth={1.5} strokeOpacity={0.5} strokeDasharray="4 3" />
              </svg>
              Q(t) DRAG
            </span>
          </div>
        </>
      )}

      {/* Decomposition */}
      <div style={{
        padding: "9px 12px",
        background: "rgba(15,23,42,0.45)",
        borderRadius: 8,
        border: "1px solid rgba(51,65,85,0.6)",
        fontSize: 11,
        lineHeight: 1.6,
        color: "#94a3b8",
      }}>
        <span style={{ color: "#cbd5e1", fontWeight: 600 }}>Native decomposition: </span>
        {params.decomposition}
        {params.nativeCount > 0 && (
          <span style={{
            marginLeft: 8,
            padding: "1px 7px",
            background: `${accent}22`,
            border: `1px solid ${accent}55`,
            borderRadius: 4,
            color: accent,
            fontWeight: 600,
            fontSize: 10,
          }}>
            {params.nativeCount} pulse{params.nativeCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
