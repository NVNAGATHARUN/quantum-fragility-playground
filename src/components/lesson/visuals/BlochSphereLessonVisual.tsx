/**
 * BlochSphereLessonVisual — simplified interactive Bloch sphere for lesson contexts.
 *
 * This is NOT the full BlochSphere3D component (which is used in the Circuit Studio).
 * This is a lighter, pedagogically-focused version for lesson embedding.
 */

import React, { useState, useCallback } from 'react';

interface Props {
  id: string;
  initialProps?: Record<string, unknown>;
  interactionPrompt?: string;
  onInteract?: () => void;
}

export default function BlochSphereLessonVisual({ id, interactionPrompt, onInteract }: Props) {
  const [theta, setTheta] = useState(0); // polar angle in degrees [0..180]
  const [phi, setPhi] = useState(0);     // azimuthal angle in degrees [0..360]
  const [hasInteracted, setHasInteracted] = useState(false);

  const thetaRad = (theta * Math.PI) / 180;
  const phiRad = (phi * Math.PI) / 180;

  const prob0 = Math.pow(Math.cos(thetaRad / 2), 2);
  const prob1 = Math.pow(Math.sin(thetaRad / 2), 2);

  const alpha0Real = Math.cos(thetaRad / 2).toFixed(3);
  const beta0Real = (Math.cos(phiRad) * Math.sin(thetaRad / 2)).toFixed(3);
  const beta0Imag = (Math.sin(phiRad) * Math.sin(thetaRad / 2)).toFixed(3);

  // 2D projection of Bloch vector for the SVG visualization
  const bx = Math.sin(thetaRad) * Math.cos(phiRad);
  const by = Math.sin(thetaRad) * Math.sin(phiRad);
  const bz = Math.cos(thetaRad);

  const cx = 100; // SVG center x
  const cy = 100; // SVG center y
  const r = 70;   // sphere radius in SVG units

  // Project 3D to 2D isometric-ish view
  const projX = cx + r * (bx * 0.8 - by * 0.5);
  const projY = cy - r * (bz * 0.9 + (bx * 0.3 + by * 0.5) * 0.2);

  const handleThetaChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTheta(Number(e.target.value));
    if (!hasInteracted) {
      setHasInteracted(true);
      onInteract?.();
    }
  }, [hasInteracted, onInteract]);

  const handlePhiChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPhi(Number(e.target.value));
    if (!hasInteracted) {
      setHasInteracted(true);
      onInteract?.();
    }
  }, [hasInteracted, onInteract]);

  const stateLabel =
    theta === 0 ? '|0⟩ (north pole)' :
    theta === 180 ? '|1⟩ (south pole)' :
    theta === 90 && phi === 0 ? '|+⟩ (equator)' :
    theta === 90 && phi === 180 ? '|−⟩ (equator)' :
    'superposition';

  return (
    <div className="rounded-xl border border-border bg-surface-secondary/60 p-5 space-y-4" id={id}>
      {interactionPrompt && (
        <p className="text-xs text-text-secondary italic">{interactionPrompt}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* SVG Bloch Sphere */}
        <div className="flex-shrink-0">
          <svg width="200" height="200" viewBox="0 0 200 200" className="drop-shadow-sm">
            {/* Sphere outline */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e4e7ec" strokeWidth="1.5" />
            {/* Equator ellipse */}
            <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.28} fill="none" stroke="#e4e7ec" strokeWidth="1" strokeDasharray="4 3" />
            {/* Z axis */}
            <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
            {/* X axis */}
            <line x1={cx - r * 0.8} y1={cy + r * 0.25} x2={cx + r * 0.8} y2={cy - r * 0.25} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
            {/* North/South labels */}
            <text x={cx + 4} y={cy - r - 6} fontSize="9" fill="#667085" fontFamily="monospace">|0⟩</text>
            <text x={cx + 4} y={cy + r + 14} fontSize="9" fill="#667085" fontFamily="monospace">|1⟩</text>
            <text x={cx + r * 0.8 + 4} y={cy - r * 0.25 + 4} fontSize="9" fill="#667085" fontFamily="monospace">|+⟩</text>
            {/* State vector arrow */}
            <line x1={cx} y1={cy} x2={projX} y2={projY} stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
            <circle cx={projX} cy={projY} r="4" fill="#2563eb" />
            {/* Origin dot */}
            <circle cx={cx} cy={cy} r="2" fill="#94a3b8" />
          </svg>
        </div>

        {/* Controls and readout */}
        <div className="flex-1 space-y-4 min-w-0">
          <div>
            <label className="block text-[11px] font-mono text-text-muted mb-1">
              θ (theta) = {theta}° — probability balance
            </label>
            <input
              type="range" min={0} max={180} step={1}
              value={theta}
              onChange={handleThetaChange}
              className="w-full accent-brand"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-text-muted mb-1">
              φ (phi) = {phi}° — relative phase
            </label>
            <input
              type="range" min={0} max={360} step={1}
              value={phi}
              onChange={handlePhiChange}
              className="w-full accent-brand"
            />
          </div>

          {/* State readout */}
          <div className="rounded-lg bg-surface border border-border p-3 space-y-2 text-[11px] font-mono">
            <div className="text-text-muted">State: <span className="text-text-primary">{stateLabel}</span></div>
            <div className="text-text-muted">
              |ψ⟩ = {alpha0Real}|0⟩ + ({beta0Real}{Number(beta0Imag) >= 0 ? '+' : ''}{beta0Imag}i)|1⟩
            </div>
            <div className="flex gap-4 pt-1">
              <div>
                <span className="text-text-muted">P(|0⟩) = </span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">{(prob0 * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-text-muted">P(|1⟩) = </span>
                <span className="text-purple-600 dark:text-purple-400 font-semibold">{(prob1 * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!hasInteracted && (
        <p className="text-[10px] text-text-muted text-center">
          Move the sliders above to interact ↑
        </p>
      )}
      {hasInteracted && (
        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 text-center">
          ✓ Interaction recorded
        </p>
      )}
    </div>
  );
}
