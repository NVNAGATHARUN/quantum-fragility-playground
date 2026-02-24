import React, { useRef, useEffect } from 'react'
import type { CircuitGate } from '../types/quantum'

interface CircuitDiagramProps {
  gates: CircuitGate[]
  nqubits: number
  height?: number
}

const GATE_COLORS: Record<string, string> = {
  H: '#38bdf8', X: '#f87171', Y: '#34d399', Z: '#fbbf24',
  S: '#818cf8', T: '#f472b6', Rx: '#f87171', Ry: '#34d399', Rz: '#fbbf24',
  CNOT: '#a78bfa', CX: '#a78bfa', M: '#64748b', measure: '#64748b',
}

export const CircuitDiagram: React.FC<CircuitDiagramProps> = ({ gates, nqubits, height = 90 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const GW = 44, GAP = 12, PAD = 44, LINE_H = 50
    const W = Math.max(400, gates.length * (GW + GAP) + PAD * 2)
    const H = nqubits * LINE_H + 20

    canvas.width = W
    canvas.height = H

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    if (ctx.roundRect) ctx.roundRect(0, 0, W, H, 8)
    else ctx.rect(0, 0, W, H)
    ctx.fill()

    const lineY = (q: number) => q * LINE_H + 45

    // Wires + qubit labels
    for (let q = 0; q < nqubits; q++) {
      ctx.beginPath()
      ctx.moveTo(PAD, lineY(q))
      ctx.lineTo(W - 20, lineY(q))
      ctx.strokeStyle = 'rgba(56,189,248,0.25)'; ctx.lineWidth = 1.5; ctx.stroke()
      ctx.fillStyle = 'rgba(56,189,248,0.6)'
      ctx.font = 'bold 11px Share Tech Mono, monospace'
      ctx.fillText(`q${q}`, 8, lineY(q) + 4)
    }

    // Gates
    gates.forEach((g, i) => {
      const x = PAD + i * (GW + GAP)
      const q0 = g.qubit ?? 0
      const y0 = lineY(q0)
      const col = GATE_COLORS[g.gate] ?? '#818cf8'

      if (g.gate === 'CNOT' || g.gate === 'CX') {
        const q1 = g.target ?? 1
        const y1 = lineY(q1)
        // Control dot
        ctx.beginPath(); ctx.arc(x + GW / 2, y0, 6, 0, Math.PI * 2)
        ctx.fillStyle = col; ctx.fill()
        // Connector line
        ctx.beginPath(); ctx.moveTo(x + GW / 2, y0); ctx.lineTo(x + GW / 2, y1)
        ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke()
        // Target (⊕)
        ctx.beginPath(); ctx.arc(x + GW / 2, y1, 12, 0, Math.PI * 2)
        ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x + GW / 2 - 10, y1); ctx.lineTo(x + GW / 2 + 10, y1)
        ctx.moveTo(x + GW / 2, y1 - 10); ctx.lineTo(x + GW / 2, y1 + 10)
        ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.stroke()
      } else if (g.gate === 'M' || g.gate === 'measure') {
        ctx.beginPath()
        if (ctx.roundRect) ctx.roundRect(x, y0 - 14, GW, 28, 5)
        else ctx.rect(x, y0 - 14, GW, 28)
        ctx.fillStyle = 'rgba(100,116,139,0.2)'; ctx.fill()
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1; ctx.stroke()
        ctx.fillStyle = '#64748b'
        ctx.font = 'bold 10px Orbitron, monospace'; ctx.textAlign = 'center'
        ctx.fillText('M', x + GW / 2, y0 + 4); ctx.textAlign = 'left'
      } else {
        ctx.beginPath()
        if (ctx.roundRect) ctx.roundRect(x, y0 - 14, GW, 28, 5)
        else ctx.rect(x, y0 - 14, GW, 28)
        ctx.fillStyle = col + '28'; ctx.fill()
        ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.stroke()
        const label = g.gate + (g.angle != null ? `(${g.angle.toFixed(1)})` : '')
        const short = label.length > 5 ? g.gate : label
        ctx.fillStyle = col
        ctx.font = 'bold 11px Share Tech Mono, monospace'; ctx.textAlign = 'center'
        ctx.fillText(short, x + GW / 2, y0 + 4); ctx.textAlign = 'left'
      }
    })
  }, [gates, nqubits, height])

  return (
    <div style={{ overflowX: 'auto', padding: '4px 0' }}>
      <canvas ref={canvasRef} style={{ borderRadius: 8, display: 'block' }} />
    </div>
  )
}
