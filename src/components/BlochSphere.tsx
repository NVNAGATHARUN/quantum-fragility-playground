import React, { useRef, useEffect, useCallback } from 'react'
import type { BlochVector } from '../types/quantum'

interface BlochSphereProps {
  vector: BlochVector
  trail?: BlochVector[]
  size?: number
}

function blochLen(v: BlochVector) {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
}

function healthColor(h: number): string {
  if (h > 0.65) return '#34d399'
  if (h > 0.35) return '#fbbf24'
  return '#f87171'
}

// Simple 2D projection: project (x, y, z) ignoring y for perspective
// px = cx + x * scale, py = cy - z * scale
// We add a gentle rotation for aesthetics using angle ref
export const BlochSphere: React.FC<BlochSphereProps> = ({ vector, trail, size = 320 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const angleRef = useRef(0.3)
  const rafRef = useRef<number | null>(null)
  const vecRef = useRef(vector)
  const trailRef = useRef(trail ?? [])

  useEffect(() => { vecRef.current = vector }, [vector])
  useEffect(() => { trailRef.current = trail ?? [] }, [trail])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const S = canvas.width
    const cx = S / 2, cy = S / 2, R = S * 0.38
    ctx.clearRect(0, 0, S, S)

    // Background
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.45)
    bg.addColorStop(0, 'rgba(18,8,45,0.92)')
    bg.addColorStop(1, 'rgba(5,5,16,0.97)')
    ctx.fillStyle = bg
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.45, 0, Math.PI * 2); ctx.fill()

    const rx = 0.5, rz = angleRef.current

    function proj(x: number, y: number, z: number) {
      const x1 = x * Math.cos(rz) - y * Math.sin(rz)
      const y1 = x * Math.sin(rz) + y * Math.cos(rz)
      const y2 = y1 * Math.cos(rx) - z * Math.sin(rx)
      return { sx: cx + x1 * R, sy: cy - y2 * R }
    }

    // Wireframe
    ctx.strokeStyle = 'rgba(56,189,248,0.09)'; ctx.lineWidth = 0.45
    for (let lat = -80; lat <= 80; lat += 20) {
      ctx.beginPath()
      for (let lon = 0; lon <= 360; lon += 6) {
        const lr = lat * Math.PI / 180, ln = lon * Math.PI / 180
        const p = proj(Math.cos(lr) * Math.cos(ln), Math.cos(lr) * Math.sin(ln), Math.sin(lr))
        lon === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy)
      }
      ctx.stroke()
    }
    for (let lon = 0; lon < 360; lon += 30) {
      ctx.beginPath()
      for (let lat = -90; lat <= 90; lat += 5) {
        const lr = lat * Math.PI / 180, ln = lon * Math.PI / 180
        const p = proj(Math.cos(lr) * Math.cos(ln), Math.cos(lr) * Math.sin(ln), Math.sin(lr))
        lat === -90 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy)
      }
      ctx.stroke()
    }

    // Equator
    ctx.strokeStyle = 'rgba(56,189,248,0.22)'; ctx.lineWidth = 1
    ctx.beginPath()
    for (let lon = 0; lon <= 360; lon += 4) {
      const p = proj(Math.cos(lon * Math.PI / 180), Math.sin(lon * Math.PI / 180), 0)
      lon === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy)
    }
    ctx.stroke()

    // Axes
    const axes = [
      { v: [1,0,0] as [number,number,number], l: 'X', c: 'rgba(248,113,113,0.75)' },
      { v: [0,1,0] as [number,number,number], l: 'Y', c: 'rgba(52,211,153,0.65)' },
      { v: [0,0,1] as [number,number,number], l: 'Z', c: 'rgba(96,165,250,0.9)' },
    ]
    axes.forEach(({ v, l, c }) => {
      const p0 = proj(0, 0, 0), p1 = proj(...v)
      ctx.beginPath(); ctx.moveTo(p0.sx, p0.sy); ctx.lineTo(p1.sx, p1.sy)
      ctx.strokeStyle = c; ctx.lineWidth = 1.2; ctx.stroke()
      ctx.fillStyle = c; ctx.font = 'bold 10px Orbitron, monospace'
      ctx.fillText(l, p1.sx + 3, p1.sy + 4)
    })

    // Pole labels
    const pN = proj(0, 0, 1), pS = proj(0, 0, -1)
    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 10px Orbitron, monospace'
    ctx.fillText('|0⟩', pN.sx - 14, pN.sy - 8)
    ctx.fillText('|1⟩', pS.sx - 14, pS.sy + 16)

    // Trail
    const t = trailRef.current
    if (t.length > 1) {
      for (let i = 1; i < t.length; i++) {
        const pa = proj(t[i-1].x, t[i-1].y, t[i-1].z)
        const pb = proj(t[i].x, t[i].y, t[i].z)
        const alpha = 0.07 + (i / t.length) * 0.55
        ctx.beginPath(); ctx.moveTo(pa.sx, pa.sy); ctx.lineTo(pb.sx, pb.sy)
        ctx.strokeStyle = `rgba(52,211,153,${alpha})`; ctx.lineWidth = 1.3; ctx.stroke()
      }
    }

    // Bloch vector
    const vec = vecRef.current
    const tip = proj(vec.x, vec.y, vec.z), base = proj(0, 0, 0)
    const hl = blochLen(vec), col = healthColor(hl)

    // Glow shadow
    ctx.beginPath(); ctx.moveTo(base.sx, base.sy); ctx.lineTo(tip.sx, tip.sy)
    ctx.strokeStyle = 'rgba(129,140,248,0.18)'; ctx.lineWidth = 11; ctx.stroke()

    // Gradient stroke
    const vg = ctx.createLinearGradient(base.sx, base.sy, tip.sx, tip.sy)
    vg.addColorStop(0, 'rgba(56,189,248,0.9)'); vg.addColorStop(1, col)
    ctx.beginPath(); ctx.moveTo(base.sx, base.sy); ctx.lineTo(tip.sx, tip.sy)
    ctx.strokeStyle = vg; ctx.lineWidth = 2.5
    ctx.shadowColor = col; ctx.shadowBlur = 10; ctx.stroke(); ctx.shadowBlur = 0

    // Arrowhead
    const dx = tip.sx - base.sx, dy = tip.sy - base.sy
    const L = Math.sqrt(dx * dx + dy * dy) || 1
    const nx = dx / L, ny = dy / L
    ctx.beginPath()
    ctx.moveTo(tip.sx, tip.sy)
    ctx.lineTo(tip.sx - nx * 11 + ny * 5.5, tip.sy - ny * 11 - nx * 5.5)
    ctx.lineTo(tip.sx - nx * 11 - ny * 5.5, tip.sy - ny * 11 + nx * 5.5)
    ctx.closePath(); ctx.fillStyle = col
    ctx.shadowColor = col; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0

    // Tip dot
    ctx.beginPath(); ctx.arc(tip.sx, tip.sy, 4.5, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'; ctx.shadowColor = col; ctx.shadowBlur = 14
    ctx.fill(); ctx.shadowBlur = 0

    // Origin dot
    ctx.beginPath(); ctx.arc(base.sx, base.sy, 3, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill()
  }, [])

  // Auto-rotation loop
  useEffect(() => {
    let cancelled = false
    function frame() {
      if (cancelled) return
      angleRef.current += 0.004
      draw()
      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)
    return () => {
      cancelled = true
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ borderRadius: 12, display: 'block', maxWidth: '100%' }}
    />
  )
}
