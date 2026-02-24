import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import BlochSphere3D from '../components/BlochSphere3D';
import { CircuitDiagram } from '../components/CircuitDiagram';
import { Card, PageHeader, SectionHeader, Badge, InfoBox, Divider } from '../components/UI';
import type { BlochVector, CircuitGate } from '../types/quantum';

const EXAMPLES: Record<string, string> = {
  bell: JSON.stringify({ qubits: 2, gates: [{ gate: 'H', qubit: 0 }, { gate: 'CNOT', qubit: 0, target: 1 }] }, null, 2),
  ghz: JSON.stringify({ qubits: 3, gates: [{ gate: 'H', qubit: 0 }, { gate: 'CNOT', qubit: 0, target: 1 }, { gate: 'CNOT', qubit: 1, target: 2 }] }, null, 2),
  hchain: JSON.stringify({ qubits: 1, gates: [{ gate: 'H', qubit: 0 }, { gate: 'H', qubit: 0 }, { gate: 'H', qubit: 0 }, { gate: 'H', qubit: 0 }] }, null, 2),
  xyz: JSON.stringify({ qubits: 1, gates: [{ gate: 'X', qubit: 0 }, { gate: 'Y', qubit: 0 }, { gate: 'Z', qubit: 0 }] }, null, 2),
};

function applyDecoherence(v: BlochVector, amount: number): BlochVector {
  const factor = 1 - amount;
  return {
    x: v.x * factor,
    y: v.y * factor,
    z: v.z * (1 - amount / 2) + (amount / 2)
  };
}

function applyGateToBloch(v: BlochVector, g: CircuitGate): BlochVector {
  let { x, y, z } = v;
  switch (g.gate) {
    case 'H': return { x: z, y, z: x };
    case 'X': return { x, y: -y, z: -z };
    case 'Y': return { x: -x, y, z: -z };
    case 'Z': return { x: -x, y: -y, z };
    case 'S': {
      const ca = Math.cos(Math.PI / 2), sa = Math.sin(Math.PI / 2);
      return { x: x * ca - y * sa, y: x * sa + y * ca, z };
    }
    case 'T': {
      const ca = Math.cos(Math.PI / 4), sa = Math.sin(Math.PI / 4);
      return { x: x * ca - y * sa, y: x * sa + y * ca, z };
    }
    case 'CNOT':
      // If control is qubit 0, it becomes entangled (decoheres)
      // This is a simplification for visualization
      return { x: x * 0.7, y: y * 0.7, z: z * 0.7 };
    default: return v;
  }
}

export default function QiskitVisualizer() {
  const [src, setSrc] = useState(EXAMPLES.bell);
  const [stepIdx, setStepIdx] = useState(0);
  const [gateNoise, setGateNoise] = useState(0.02);
  const [error, setError] = useState('');

  const config = useMemo(() => {
    try {
      setError('');
      return JSON.parse(src);
    } catch (e: any) {
      setError('Invalid JSON format');
      return { qubits: 1, gates: [] };
    }
  }, [src]);

  const gates: CircuitGate[] = config.gates || [];
  const nq = config.qubits || 1;

  const vec = useMemo(() => {
    let v: BlochVector = { x: 0, y: 0, z: 1 };
    for (let i = 0; i < stepIdx && i < gates.length; i++) {
      const g = gates[i];
      if ((g.qubit ?? 0) === 0 || g.target === 0) {
        v = applyGateToBloch(v, g);
        v = applyDecoherence(v, gateNoise);
        const L = Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
        if (L > 1) { v.x /= L; v.y /= L; v.z /= L; }
      }
    }
    return v;
  }, [gates, stepIdx, gateNoise]);

  const p0 = (vec.z + 1) / 2;
  const hl = Math.sqrt(vec.x ** 2 + vec.y ** 2 + vec.z ** 2);

  const handleExample = (key: string) => {
    setSrc(EXAMPLES[key]);
    setStepIdx(0);
  };

  return (
    <div className="flex flex-col gap-32">
      <PageHeader
        title="Qiskit Visualizer"
        subtitle="Decode and visualize Qiskit-style JSON circuit definitions."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-32">
        <div className="flex flex-col gap-32">
          <Card className="p-0 overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-16 border-b border-brand-border bg-surface flex justify-between items-center">
              <SectionHeader title="Circuit Source (JSON)" />
              <div className="flex gap-8">
                {Object.keys(EXAMPLES).map(k => (
                  <button key={k} onClick={() => handleExample(k)} className="px-12 py-4 rounded-lg border border-brand-border text-[9px] font-orbitron hover:border-brand-primary transition-all uppercase">{k}</button>
                ))}
              </div>
            </div>
            <textarea
              className="flex-1 w-full bg-background/50 p-24 font-mono text-sm text-brand-purple outline-none resize-none"
              spellCheck={false}
              value={src}
              onChange={e => { setSrc(e.target.value); setStepIdx(0); }}
            />
            {error && <div className="p-12 bg-brand-red/10 text-brand-red text-xs border-t border-brand-red/20">{error}</div>}
          </Card>

          <Card className="p-24 flex flex-col gap-16">
            <div className="flex justify-between items-center">
              <SectionHeader title="Circuit Diagram" />
              <Badge color="purple">{gates.length} Gates</Badge>
            </div>
            <div className="min-h-[120px] rounded-xl border border-brand-border bg-background/50 overflow-x-auto p-24">
              <CircuitDiagram gates={gates.slice(0, stepIdx)} nqubits={nq} />
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-32">
          <Card className="p-24 flex flex-col gap-24 h-full">
            <SectionHeader title="State Analysis" />

            <div className="h-[240px] glass-card bg-background/30 rounded-2xl overflow-hidden mb-24 relative">
              <BlochSphere3D state={vec} health={hl * 100} history={[]} />
              <div className="absolute top-12 left-12">
                <Badge color="gold">Qubit 0</Badge>
              </div>
            </div>

            <div className="flex flex-col gap-12">
              <div className="flex justify-between items-center text-[10px] font-orbitron uppercase text-text-muted">
                <span>Probability |0⟩</span>
                <span className="text-brand-cyan font-mono">{(p0 * 100).toFixed(1)}%</span>
              </div>
              <div className="h-4 bg-brand-border rounded-full overflow-hidden">
                <motion.div className="h-full bg-brand-cyan" animate={{ width: `${p0 * 100}%` }} />
              </div>
            </div>

            <div className="flex flex-col gap-12">
              <div className="flex justify-between items-center text-[10px] font-orbitron uppercase text-text-muted">
                <span>Probability |1⟩</span>
                <span className="text-brand-purple font-mono">{((1 - p0) * 100).toFixed(1)}%</span>
              </div>
              <div className="h-4 bg-brand-border rounded-full overflow-hidden">
                <motion.div className="h-full bg-brand-purple" animate={{ width: `${(1 - p0) * 100}%` }} />
              </div>
            </div>

            <Divider />

            <div className="flex flex-col gap-8">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-orbitron uppercase text-text-muted">Execution Step</span>
                <span className="text-xs font-mono text-brand-gold">{stepIdx} / {gates.length}</span>
              </div>
              <input
                type="range" min={0} max={gates.length} step={1}
                value={stepIdx} onChange={e => setStepIdx(parseInt(e.target.value))}
                className="w-full h-4 bg-brand-border rounded-full appearance-none cursor-pointer accent-brand-gold"
              />
            </div>

            <div className="flex flex-col gap-8">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-orbitron uppercase text-text-muted">Noise Strength</span>
                <span className="text-xs font-mono text-brand-red">{(gateNoise * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range" min={0} max={0.2} step={0.01}
                value={gateNoise} onChange={e => setGateNoise(parseFloat(e.target.value))}
                className="w-full h-4 bg-brand-border rounded-full appearance-none cursor-pointer accent-brand-red"
              />
            </div>

            <InfoBox label="Visualizer Logic">
              This simulator tracks the state of <strong>Qubit 0</strong>. Entangling gates like CNOT and environmental noise will cause the Bloch vector to shrink, representing decoherence.
            </InfoBox>
          </Card>
        </div>
      </div>
    </div>
  );
}
