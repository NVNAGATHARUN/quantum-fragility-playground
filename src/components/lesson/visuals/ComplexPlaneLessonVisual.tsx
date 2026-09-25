/**
 * ComplexPlaneLessonVisual — interactive complex number representation for lessons.
 * Shows magnitude r and phase angle phi on the complex Argand plane.
 */

import React, { useState, useCallback } from 'react';

interface Props {
  id: string;
  initialProps?: Record<string, unknown>;
  interactionPrompt?: string;
  onInteract?: () => void;
}

export default function ComplexPlaneLessonVisual({ id, interactionPrompt, onInteract }: Props) {
  const [magnitude, setMagnitude] = useState(1.0);
  const [phaseDeg, setPhaseDeg] = useState(45);
  const [hasInteracted, setHasInteracted] = useState(false);

  const phaseRad = (phaseDeg * Math.PI) / 180;
  const real = magnitude * Math.cos(phaseRad);
  const imag = magnitude * Math.sin(phaseRad);
  const prob = magnitude * magnitude;

  const triggerInteract = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
      onInteract?.();
    }
  }, [hasInteracted, onInteract]);

  const cx = 100;
  const cy = 100;
  const scale = 70; // 1.0 unit = 70px

  const px = cx + real * scale;
  const py = cy - imag * scale; // Invert SVG y

  return (
    <div className="rounded-xl border border-border bg-surface-secondary/60 p-5 space-y-4" id={id}>
      {interactionPrompt && (
        <p className="text-xs text-text-secondary italic">{interactionPrompt}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* SVG Argand Plane */}
        <div className="flex-shrink-0">
          <svg width="200" height="200" viewBox="0 0 200 200" className="drop-shadow-sm">
            {/* Unit Circle */}
            <circle cx={cx} cy={cy} r={scale} fill="none" stroke="#e4e7ec" strokeWidth="1.5" strokeDasharray="3 3" />
            {/* Axes */}
            <line x1={15} y1={cy} x2={185} y2={cy} stroke="#94a3b8" strokeWidth="1.2" />
            <line x1={cx} y1={185} x2={cx} y2={15} stroke="#94a3b8" strokeWidth="1.2" />
            {/* Axis labels */}
            <text x="186" y={cy + 4} fontSize="9" fill="#667085" fontFamily="monospace">Re</text>
            <text x={cx + 4} y="15" fontSize="9" fill="#667085" fontFamily="monospace">Im</text>
            <text x={cx + scale - 4} y={cy + 12} fontSize="8" fill="#94a3b8">1</text>
            <text x={cx - scale - 4} y={cy + 12} fontSize="8" fill="#94a3b8">-1</text>

            {/* Arc for phase angle */}
            <path
              d={`M ${cx + 25} ${cy} A 25 25 0 ${phaseDeg > 180 ? 1 : 0} 0 ${cx + 25 * Math.cos(phaseRad)} ${cy - 25 * Math.sin(phaseRad)}`}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="1.5"
            />

            {/* Vector from origin */}
            <line x1={cx} y1={cy} x2={px} y2={py} stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx={px} cy={py} r="4.5" fill="#6366f1" />
            <circle cx={cx} cy={cy} r="2.5" fill="#94a3b8" />

            {/* Real and Imaginary projections */}
            <line x1={px} y1={py} x2={px} y2={cy} stroke="#6366f1" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
            <line x1={px} y1={py} x2={cx} y2={py} stroke="#6366f1" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
          </svg>
        </div>

        {/* Sliders and Numerical Feedback */}
        <div className="flex-1 space-y-4 min-w-0">
          <div>
            <div className="flex justify-between text-xs text-text-secondary mb-1">
              <span>Phase Angle (φ)</span>
              <span className="font-mono font-medium text-text-primary">{phaseDeg}° ({phaseRad.toFixed(2)} rad)</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={phaseDeg}
              onChange={(e) => {
                setPhaseDeg(Number(e.target.value));
                triggerInteract();
              }}
              className="w-full accent-primary h-1.5 bg-border rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-text-secondary mb-1">
              <span>Magnitude |c|</span>
              <span className="font-mono font-medium text-text-primary">{magnitude.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={magnitude}
              onChange={(e) => {
                setMagnitude(Number(e.target.value));
                triggerInteract();
              }}
              className="w-full accent-primary h-1.5 bg-border rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 bg-surface-primary p-3 rounded-lg border border-border/80 font-mono text-xs text-center">
            <div>
              <div className="text-[10px] text-text-muted mb-0.5">Real Part (Re)</div>
              <div className="font-semibold text-text-primary">{real.toFixed(3)}</div>
            </div>
            <div>
              <div className="text-[10px] text-text-muted mb-0.5">Imag Part (Im)</div>
              <div className="font-semibold text-text-primary">{imag >= 0 ? `+${imag.toFixed(3)}i` : `${imag.toFixed(3)}i`}</div>
            </div>
            <div>
              <div className="text-[10px] text-text-muted mb-0.5">Probability |c|²</div>
              <div className="font-semibold text-primary">{prob.toFixed(3)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
