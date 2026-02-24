import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BlochSphere3D from '../components/BlochSphere3D';
import { CircuitDiagram } from '../components/CircuitDiagram';
import { Card, PageHeader, SectionHeader, Badge, InfoBox, Divider } from '../components/UI';
import type { BlochVector, CircuitGate } from '../types/quantum';

const EXAMPLES: Record<string, string> = {
  bell: `OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\ncreg c[2];\nh q[0];\ncx q[0],q[1];\nmeasure q[0] -> c[0];\nmeasure q[1] -> c[1];`,
  superpos: `OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[1];\ncreg c[1];\nh q[0];\nmeasure q[0] -> c[0];`,
};

function parseQASM(src: string): CircuitGate[] {
  const gates: CircuitGate[] = [];
  src.split('\n').forEach(line => {
    line = line.trim().replace(/;$/, '');
    if (!line || line.startsWith('OPENQASM') || line.startsWith('include') || line.startsWith('//') || line.startsWith('qreg') || line.startsWith('creg')) return;
    if (line.startsWith('measure')) {
      const m = line.match(/measure\s+\w+\[(\d+)\]/);
      if (m) gates.push({ gate: 'M', qubit: +m[1] }); return;
    }
    const cx = line.match(/^cx\s+\w+\[(\d+)\]\s*,\s*\w+\[(\d+)\]/);
    if (cx) { gates.push({ gate: 'CNOT', qubit: +cx[1], target: +cx[2] }); return; }
    const gm = line.match(/^(\w+)\s+\w+\[(\d+)\]/);
    if (gm) {
      const g = gm[1].toUpperCase();
      if (['H', 'X', 'Y', 'Z', 'S', 'T'].includes(g)) gates.push({ gate: g as any, qubit: +gm[2] });
    }
  });
  return gates;
}

function applyGate(v: BlochVector, g: CircuitGate): BlochVector {
  let { x, y, z } = v;
  const a = g.angle ?? Math.PI;
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
    case 'Z': return { x: -x, y: -y, z };
    default: return v;
  }
}

export default function QasmVisualizer() {
  const [src, setSrc] = useState(EXAMPLES.bell);
  const [stepIdx, setStepIdx] = useState(0);
  const [errMsg, setErrMsg] = useState('');

  const gates = useMemo(() => {
    try {
      setErrMsg('');
      return parseQASM(src);
    } catch (e: any) {
      setErrMsg(e.message);
      return [];
    }
  }, [src]);

  const nq = useMemo(() => {
    if (gates.length === 0) return 1;
    return Math.max(1, ...gates.map(g => Math.max((g.qubit ?? 0) + 1, (g.target ?? 0) + 1)));
  }, [gates]);

  const vec = useMemo(() => {
    let v: BlochVector = { x: 0, y: 0, z: 1 };
    for (let i = 0; i < stepIdx && i < gates.length; i++) {
      const g = gates[i];
      if ((g.qubit ?? 0) === 0 && g.gate !== 'M') {
        v = applyGate(v, g);
        const L = Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
        if (L > 0) { v.x /= L; v.y /= L; v.z /= L; }
      }
    }
    return v;
  }, [gates, stepIdx]);

  const p0 = (vec.z + 1) / 2;

  const handleExample = (key: string) => {
    setSrc(EXAMPLES[key]);
    setStepIdx(0);
  };

  return (
    <div className="flex flex-col gap-32">
      <PageHeader
        title="QASM Visualizer"
        subtitle="Write OpenQASM 2.0 code and watch it transform qubits in real-time."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-32">
        <div className="flex flex-col gap-32">
          <Card className="p-0 overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-16 border-b border-brand-border bg-surface flex justify-between items-center">
              <SectionHeader title="QASM Editor" />

              <div className="flex gap-8">
                {Object.keys(EXAMPLES).map(k => (
                  <button key={k} onClick={() => handleExample(k)} className="px-12 py-4 rounded-lg border border-brand-border text-[9px] font-orbitron hover:border-brand-primary transition-all uppercase">{k}</button>
                ))}
              </div>
            </div>
            <textarea
              className="flex-1 w-full bg-background/50 p-24 font-mono text-sm text-brand-cyan outline-none resize-none"
              spellCheck={false}
              value={src}
              onChange={e => { setSrc(e.target.value); setStepIdx(0); }}
            />
            {errMsg && <div className="p-12 bg-brand-red/10 text-brand-red text-xs border-t border-brand-red/20">{errMsg}</div>}
          </Card>

          <Card className="p-24 flex flex-col gap-16">
            <div className="flex justify-between items-center">
              <SectionHeader title="Circuit Preview" />
              <Badge color="primary">{gates.length} Gates Parsed</Badge>
            </div>
            <div className="min-h-[120px] rounded-xl border border-brand-border bg-background/50 overflow-x-auto p-24">
              <CircuitDiagram gates={gates.slice(0, stepIdx)} nqubits={nq} />
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-32">
          <Card className="p-24 flex flex-col gap-24 h-full">
            <SectionHeader title="State Analysis" />

            <div className="h-[240px] glass-card bg-background/30 rounded-2xl overflow-hidden mb-24">
              <BlochSphere3D state={vec} health={100} history={[]} />
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

            <InfoBox label="Pro Tip">
              This visualizer only tracks the state of <strong>Qubit 0</strong>. Cross-qubit gates like CNOT will affect Qubit 0 if it is the target or control qubit.
            </InfoBox>
          </Card>
        </div>
      </div>
    </div>
  );
}
