import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import BlochSphere3D from '../components/BlochSphere3D';
import { Card, PageHeader, SectionHeader, Badge, InfoBox } from '../components/UI';
import type { BlochVector, Gate, GateId, PresetState } from '../types/quantum';
import { PRESET_VECTORS } from '../types/quantum';

const GATE_DATA: Record<GateId, { label: string; color: string; desc: string }> = {
  H: { label: 'H', color: '#38bdf8', desc: 'Hadamard: Creates superposition' },
  X: { label: 'X', color: '#ef4444', desc: 'Pauli-X: Bit-flip (NOT)' },
  Y: { label: 'Y', color: '#10b981', desc: 'Pauli-Y: Bit & Phase flip' },
  Z: { label: 'Z', color: '#f59e0b', desc: 'Pauli-Z: Phase flip' },
  CNOT: { label: 'CX', color: '#a855f7', desc: 'CNOT: Condition Bit-Flip' },
};

const GATE_IDS: GateId[] = ['H', 'X', 'Y', 'Z', 'CNOT'];

// ─── Math Utils ─────────────────────────────────────────────────────────────

function blen(v: BlochVector) {
  return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
}

function applyGate(v: BlochVector, g: Gate): BlochVector {
  let { x, y, z } = v;
  switch (g.id) {
    case 'H': return { x: z, y, z: x };
    case 'X':
    case 'CNOT': return { x, y: -y, z: -z };
    case 'Y': return { x: -x, y, z: -z };
    case 'Z': return { x: -x, y: -y, z };
    default: return v;
  }
}

function applyDecoherence(v: BlochVector, amount: number): BlochVector {
  // Amount is a value from 0 to 1 representing the strength of decoherence per gate
  const factor = 1 - amount;
  return {
    x: v.x * factor,
    y: v.y * factor,
    z: v.z * (1 - amount / 2) + (amount / 2) // Slowly decay toward ground state |0> (z=1)
  };
}

// ─── Componentry ────────────────────────────────────────────────────────────

interface CircuitGate extends Gate {
  instanceId: string;
}

const SortableGate = ({
  gate,
  index,
  isActive,
  onRemove
}: {
  gate: CircuitGate;
  index: number;
  isActive: boolean;
  onRemove: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: gate.instanceId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const color = GATE_DATA[gate.id as GateId]?.color || '#ffffff';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group flex flex-col items-center gap-4 min-w-[60px] cursor-grab active:cursor-grabbing`}
      {...attributes}
      {...listeners}
    >
      <div
        className={`w-40 h-40 rounded-lg border-2 flex items-center justify-center font-orbitron font-bold text-xs transition-all
          ${isActive ? 'scale-110 shadow-[0_0_15px_var(--gate-color)]' : 'opacity-80'}
        `}
        style={{
          borderColor: color,
          color: color,
          backgroundColor: `${color}10`,
          // @ts-ignore
          '--gate-color': color
        }}
      >
        {gate.id}
        {gate.angle != null && (
          <span className="absolute -bottom-2 right-0 text-[8px] font-mono bg-background border border-brand-border px-2 rounded">
            {(gate.angle / Math.PI).toFixed(1)}π
          </span>
        )}
      </div>

      <button
        onPointerDown={(e) => { e.stopPropagation(); onRemove(gate.instanceId); }}
        className="absolute -top-8 -right-8 w-16 h-16 bg-brand-red text-white rounded-full text-[10px] items-center justify-center hidden group-hover:flex z-10"
      >
        ×
      </button>

      <div className="absolute top-20 left-[-16px] right-[-16px] h-2 bg-text-muted/20 -z-10 group-first:left-full group-last:right-full" />
    </div>
  );
};

export default function GateBuilder() {
  const [circuit, setCircuit] = useState<CircuitGate[]>([]);
  const [activeStep, setActiveStep] = useState(-1); // -1 is initial state
  const [initPreset, setInitPreset] = useState<PresetState>('zero');
  const [gateNoise, setGateNoise] = useState(0.05); // Noise per gate
  const [isPlaying, setIsPlaying] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Compute state at current step
  const currentState = useMemo(() => {
    let v = { ...PRESET_VECTORS[initPreset] };
    for (let i = 0; i <= activeStep && i < circuit.length; i++) {
      const g = circuit[i];
      v = applyGate(v, g);
      // Apply noise after gate
      v = applyDecoherence(v, gateNoise);

      const L = blen(v);
      if (L > 1) { v.x /= L; v.y /= L; v.z /= L; }
    }
    return v;
  }, [circuit, activeStep, initPreset, gateNoise]);

  // Circuit Actions
  const addGate = (id: GateId) => {
    const newGate: CircuitGate = {
      id,
      instanceId: `gate-${Math.random().toString(36).substr(2, 9)}`,
    };
    setCircuit(prev => [...prev, newGate]);
  };

  const removeGate = (instanceId: string) => {
    setCircuit(prev => prev.filter(g => g.instanceId !== instanceId));
    if (activeStep >= circuit.length - 1) setActiveStep(prev => prev - 1);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setCircuit((items) => {
        const oldIndex = items.findIndex(i => i.instanceId === active.id);
        const newIndex = items.findIndex(i => i.instanceId === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Playback Control
  const playCircuit = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setActiveStep(-1);

    for (let i = 0; i < circuit.length; i++) {
      await new Promise(r => setTimeout(r, 800));
      setActiveStep(i);
    }
    setIsPlaying(false);
  };

  const resetCircuit = () => {
    setActiveStep(-1);
    setIsPlaying(false);
  };

  const p0 = (currentState.z + 1) / 2;

  return (
    <div className="flex flex-col gap-24">
      <PageHeader
        title="Gate Builder"
        subtitle="Compose quantum circuits by dragging gates and visualize the resulting state evolution on the Bloch sphere."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_260px] gap-24 items-start">
        {/* Left Col: Palette and Settings */}
        <Card className="p-20 flex flex-col gap-32">
          <div>
            <SectionHeader title="Gate Palette" />
            <div className="grid grid-cols-3 gap-8">
              {GATE_IDS.map(id => (
                <button
                  key={id}
                  onClick={() => addGate(id)}
                  title={GATE_DATA[id].desc}
                  className="flex flex-col items-center p-8 rounded-lg border border-brand-border hover:border-brand-primary hover:bg-brand-primary/5 transition-all group"
                >
                  <span className="text-sm font-bold font-orbitron transition-transform group-hover:scale-110" style={{ color: GATE_DATA[id].color }}>{GATE_DATA[id].label}</span>
                  <span className="text-[8px] text-text-muted uppercase tracking-tighter">Fixed Gate</span>
                </button>
              ))}
            </div>


            <div className="mt-20 flex flex-col gap-8">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-orbitron text-text-muted uppercase">Gate Noise</label>
                <span className="text-[10px] font-mono text-brand-red">{(gateNoise * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range" min={0} max={0.5} step={0.01}
                value={gateNoise} onChange={e => setGateNoise(parseFloat(e.target.value))}
                className="w-full h-4 bg-brand-border rounded-full appearance-none cursor-pointer accent-brand-red"
              />
            </div>
          </div>

          <div>
            <SectionHeader title="Initial State" />
            <div className="grid grid-cols-2 gap-8">
              {(['zero', 'plus', 'one', 'minus'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => { setInitPreset(p); setActiveStep(-1); }}
                  className={`px-12 py-8 rounded-lg border font-mono text-xs transition-all ${initPreset === p ? 'bg-brand-primary border-brand-primary text-white' : 'bg-surface border-brand-border hover:border-brand-primary/40 text-text-secondary'}`}
                >
                  {p === 'zero' ? '|0⟩' : p === 'one' ? '|1⟩' : p === 'plus' ? '|+⟩' : '|−⟩'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <button
              onClick={playCircuit}
              disabled={isPlaying || circuit.length === 0}
              className="btn btn-primary w-full disabled:opacity-30"
            >
              {isPlaying ? 'Running...' : '▶ Play Circuit'}
            </button>
            <div className="grid grid-cols-2 gap-8">
              <button
                onClick={() => setActiveStep(prev => Math.min(prev + 1, circuit.length - 1))}
                disabled={activeStep >= circuit.length - 1}
                className="btn btn-secondary !py-8 text-[10px]"
              >
                Next Step
              </button>
              <button onClick={resetCircuit} className="btn btn-ghost !py-8 text-[10px]">Reset Walk</button>
            </div>
          </div>
        </Card>

        {/* Center Col: Visualiser & Strip */}
        <div className="flex flex-col gap-24">
          <Card className="h-[450px] p-8 relative flex flex-col items-center justify-center">
            <div className="absolute top-16 left-16">
              <Badge color="primary">
                Step {activeStep + 1} of {circuit.length}
              </Badge>
            </div>

            {activeStep >= 0 && (
              <div className="absolute top-16 right-16">
                <Badge color="gold">
                  Current: {circuit[activeStep].id}
                </Badge>
              </div>
            )}

            <BlochSphere3D
              state={currentState}
              health={blen(currentState) * 100}
              history={[]} // We don't need history here as we show discrete steps
            />
          </Card>

          <Card className="p-24 flex flex-col gap-16 relative overflow-visible">
            <div className="flex justify-between items-center">
              <SectionHeader title="Quantum Circuit Strip" />
              <button onClick={() => setCircuit([])} className="text-[10px] text-brand-red opacity-60 hover:opacity-100 transition-opacity uppercase font-orbitron">Clear All</button>
            </div>

            <div className="relative min-h-[120px] rounded-xl border-2 border-dashed border-brand-border bg-background/50 flex items-center px-24 overflow-x-auto overflow-y-visible py-32">
              {/* The "Wire" */}
              <div className="absolute left-0 right-0 h-1 bg-brand-border/40 top-1/2 -mt-0.5" />

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={circuit.map(c => c.instanceId)}
                  strategy={horizontalListSortingStrategy}
                >
                  <div className="flex items-center gap-24 relative z-10">
                    <AnimatePresence>
                      {circuit.map((gate, index) => (
                        <SortableGate
                          key={gate.instanceId}
                          gate={gate}
                          index={index}
                          isActive={index === activeStep}
                          onRemove={removeGate}
                        />
                      ))}
                    </AnimatePresence>

                    {circuit.length === 0 && (
                      <div className="text-text-muted text-xs font-mono opacity-50 flex flex-col items-center gap-8 w-full">
                        <span>No gates in circuit</span>
                        <span className="text-[9px]">Click gates on the left to add them to the wire</span>
                      </div>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </Card>
        </div>

        {/* Right Col: Readout */}
        <Card className="p-20 flex flex-col gap-32">
          <div>
            <SectionHeader title="State Readout" />
            <div className="flex flex-col gap-12">
              <div className="p-12 rounded-xl bg-background border border-brand-border text-center">
                <div className="text-[10px] text-text-muted uppercase mb-4">Probability of |0⟩</div>
                <div className="text-2xl font-mono text-brand-cyan">{(p0 * 100).toFixed(1)}%</div>
              </div>
              <div className="p-12 rounded-xl bg-background border border-brand-border text-center">
                <div className="text-[10px] text-text-muted uppercase mb-4">Probability of |1⟩</div>
                <div className="text-2xl font-mono text-brand-purple">{((1 - p0) * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>

          <div>
            <SectionHeader title="Coordinates" />
            <div className="grid grid-cols-1 gap-8 font-mono text-xs">
              <div className="flex justify-between text-text-secondary border-b border-brand-border pb-4">
                <span>X</span>
                <span>{currentState.x.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-text-secondary border-b border-brand-border pb-4">
                <span>Y</span>
                <span>{currentState.y.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-text-secondary border-b border-brand-border pb-4">
                <span>Z</span>
                <span>{currentState.z.toFixed(4)}</span>
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <InfoBox label="Pro Tip">
              Reorder gates by dragging them! Try <strong>H → Z → H</strong> to see how it transforms the state differently than <strong>H → H → Z</strong>.
            </InfoBox>
          </div>
        </Card>
      </div>
    </div>
  );
}
