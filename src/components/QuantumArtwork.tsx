import React, { useId } from "react";

/** Analytically projected wireframe sphere; decorative, not a state measurement. */
export function QuantumOrb({ compact = false }: { compact?: boolean }) {
  const id = useId().replace(/:/g, "");
  const project = (x: number, y: number, z: number) => {
    const a = -0.36,
      b = 0.48;
    const xx = x * Math.cos(a) + z * Math.sin(a);
    const zz = -x * Math.sin(a) + z * Math.cos(a);
    return [200 + xx * 127, 176 + (y * Math.cos(b) - zz * Math.sin(b)) * 127];
  };
  const path = (fn: (t: number) => number[]) =>
    Array.from({ length: 101 }, (_, i) => {
      const p = project(
        ...(fn((i * Math.PI * 2) / 100) as [number, number, number]),
      );
      return `${i ? "L" : "M"}${p[0].toFixed(2)},${p[1].toFixed(2)}`;
    }).join(" ");
  return (
    <svg
      className={`ql-orb ${compact ? "compact" : ""}`}
      viewBox="0 0 400 350"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${id}glow`}>
          <stop stopColor="#818cf8" stopOpacity=".15" />
          <stop offset="1" stopColor="#818cf8" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id={`${id}line`}
          x1="80"
          y1="60"
          x2="310"
          y2="285"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#dbeafe" />
          <stop offset=".6" stopColor="#818cf8" />
          <stop offset="1" stopColor="#3b4ca0" />
        </linearGradient>
      </defs>
      <circle cx="200" cy="176" r="173" fill={`url(#${id}glow)`} />
      <g stroke={`url(#${id}line)`} strokeWidth=".65" opacity=".8">
        {Array.from({ length: 17 }, (_, i) => {
          const angle = ((i + 1) * Math.PI) / 18;
          return (
            <path
              key={`a${i}`}
              d={path((t) => [
                Math.sin(angle) * Math.cos(t),
                Math.cos(angle),
                Math.sin(angle) * Math.sin(t),
              ])}
            />
          );
        })}
        {Array.from({ length: 20 }, (_, i) => (
          <path
            key={`b${i}`}
            d={path((t) => [
              Math.cos((i * Math.PI) / 20) * Math.sin(t),
              Math.cos(t),
              Math.sin((i * Math.PI) / 20) * Math.sin(t),
            ])}
          />
        ))}
      </g>
      <ellipse
        cx="200"
        cy="176"
        rx="180"
        ry="55"
        transform="rotate(-28 200 176)"
        stroke="#c7d2fe"
        strokeOpacity=".55"
        strokeDasharray="2 5"
      />
      <path
        d="M200 26V324 M38 220L359 130"
        stroke="#a5b4fc"
        strokeOpacity=".25"
      />
      <circle cx="200" cy="176" r="4" fill="#dbeafe" />
      <path d="M200 176L260 77" stroke="#dbeafe" strokeWidth="2" />
      <circle cx="260" cy="77" r="6" fill="#eef2ff" />
      <circle cx="260" cy="77" r="13" stroke="#a5b4fc" strokeOpacity=".3" />
      <g fill="#a5b4fc" fontSize="12" fontFamily="monospace">
        <text x="209" y="33">
          |0⟩
        </text>
        <text x="209" y="327">
          |1⟩
        </text>
        <text x="276" y="75">
          |ψ⟩
        </text>
        <text x="28" y="244">
          x
        </text>
        <text x="357" y="123">
          y
        </text>
      </g>
    </svg>
  );
}
export function CircuitMotif({ variant = 0 }: { variant?: number }) {
  return (
    <svg
      viewBox="0 0 360 130"
      fill="none"
      aria-hidden="true"
      className="ql-circuit-motif"
    >
      {[40, 90].map((y, i) => (
        <g key={y}>
          <text
            x="20"
            y={y + 4}
            fill="currentColor"
            fontSize="12"
            fontFamily="monospace"
          >
            q{i}
          </text>
          <path d={`M50 ${y}H340`} stroke="currentColor" strokeOpacity=".25" />
        </g>
      ))}
      <rect
        x="89"
        y="22"
        width="36"
        height="36"
        rx="7"
        fill="currentColor"
        fillOpacity=".12"
        stroke="currentColor"
        strokeOpacity=".5"
      />
      <text
        x="107"
        y="45"
        textAnchor="middle"
        fill="currentColor"
        fontSize="15"
        fontFamily="monospace"
      >
        {variant === 1 ? "Rᵧ" : "H"}
      </text>
      <path d="M180 40V90" stroke="currentColor" />
      <circle cx="180" cy="40" r="5" fill="currentColor" />
      <circle cx="180" cy="90" r="13" stroke="currentColor" />
      <path d="M171 90H189M180 81V99" stroke="currentColor" />
      <rect
        x="248"
        y="72"
        width="36"
        height="36"
        rx="7"
        fill="currentColor"
        fillOpacity=".12"
        stroke="currentColor"
        strokeOpacity=".5"
      />
      <text
        x="266"
        y="95"
        textAnchor="middle"
        fill="currentColor"
        fontSize="15"
        fontFamily="monospace"
      >
        {variant === 1 ? "Z" : "H"}
      </text>
    </svg>
  );
}
export function WaveMotif() {
  return (
    <svg
      viewBox="0 0 360 130"
      fill="none"
      aria-hidden="true"
      className="ql-circuit-motif"
    >
      {[0, 1, 2].map((n) => (
        <path
          key={n}
          d={Array.from(
            { length: 121 },
            (_, i) =>
              `${i ? "L" : "M"}${i * 3},${65 + Math.sin(i / 10 + n * 0.9) * (37 - n * 7) * Math.sin((i * Math.PI) / 120)}`,
          ).join(" ")}
          stroke="currentColor"
          strokeWidth="1.5"
          opacity={1 - n * 0.28}
        />
      ))}
      <path
        d="M15 65H345"
        stroke="currentColor"
        strokeOpacity=".15"
        strokeDasharray="4 5"
      />
    </svg>
  );
}
