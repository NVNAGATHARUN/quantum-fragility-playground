import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Shot {
    id: number;
    value: 0 | 1;
    x: number;
}

export default function ShotVisualizer({ getShot, active }: { getShot: () => number; active: boolean }) {
    const [shots, setShots] = useState<Shot[]>([]);
    const [counts, setCounts] = useState({ zero: 0, one: 0 });
    const [lastShot, setLastShot] = useState<number | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (active) {
            timerRef.current = setInterval(() => {
                const val = getShot() as 0 | 1;
                const newShot = {
                    id: Date.now() + Math.random(),
                    value: val,
                    x: val === 0 ? 25 + Math.random() * 50 : 125 + Math.random() * 50
                };

                setShots(prev => [...prev.slice(-20), newShot]);
                setLastShot(val);
                setCounts(prev => ({
                    zero: prev.zero + (val === 0 ? 1 : 0),
                    one: prev.one + (val === 1 ? 1 : 0)
                }));
            }, 100);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [active, getShot]);

    const total = counts.zero + counts.one;
    const p0 = total > 0 ? (counts.zero / total) * 100 : 50;
    const p1 = total > 0 ? (counts.one / total) * 100 : 50;

    return (
        <div className="flex flex-col h-full w-full bg-black/40 rounded-2xl border border-white/5 overflow-hidden p-20 relative">
            <div className="flex justify-between items-center mb-20 px-10">
                <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-text-muted uppercase tracking-[3px]">Total Shots (N)</span>
                    <span className="text-2xl font-mono text-white tracking-tighter">{total.toLocaleString()}</span>
                </div>
                <div className="flex gap-12">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-mono text-brand-cyan uppercase">|0⟩ States</span>
                        <span className="text-xl font-mono text-brand-cyan">{p0.toFixed(1)}%</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-mono text-brand-purple uppercase">|1⟩ States</span>
                        <span className="text-xl font-mono text-brand-purple">{p1.toFixed(1)}%</span>
                    </div>
                </div>
            </div>

            {/* Bin Visualizer */}
            <div className="flex-1 relative border-x border-white/5 mx-10">
                <div className="absolute inset-0 flex">
                    {/* Bin 0 */}
                    <div className="flex-1 border-r border-white/5 bg-gradient-to-t from-brand-cyan/5 to-transparent flex flex-col justify-end p-10">
                        <motion.div
                            animate={{ height: `${p0}%` }}
                            className="w-full bg-brand-cyan/20 border-t border-brand-cyan/40 rounded-t-sm relative"
                        >
                            <div className="absolute -top-16 left-0 right-0 text-center text-[10px] font-mono text-brand-cyan">|0⟩</div>
                        </motion.div>
                    </div>
                    {/* Bin 1 */}
                    <div className="flex-1 bg-gradient-to-t from-brand-purple/5 to-transparent flex flex-col justify-end p-10">
                        <motion.div
                            animate={{ height: `${p1}%` }}
                            className="w-full bg-brand-purple/20 border-t border-brand-purple/40 rounded-t-sm relative"
                        >
                            <div className="absolute -top-16 left-0 right-0 text-center text-[10px] font-mono text-brand-purple">|1⟩</div>
                        </motion.div>
                    </div>
                </div>

                {/* Falling Pips */}
                <AnimatePresence>
                    {shots.map((shot) => (
                        <motion.div
                            key={shot.id}
                            initial={{ y: -20, x: shot.x, opacity: 0 }}
                            animate={{ y: 200, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6, ease: "linear" }}
                            className={`absolute w-3 h-3 rounded-full shadow-lg ${shot.value === 0 ? 'bg-brand-cyan shadow-brand-cyan/40' : 'bg-brand-purple shadow-brand-purple/40'}`}
                        />
                    ))}
                </AnimatePresence>
            </div>

            <div className="mt-20 flex justify-center gap-24">
                <div className="flex items-center gap-8">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
                    <span className="text-[10px] font-mono text-text-muted">|0⟩ hits: {counts.zero}</span>
                </div>
                <div className="flex items-center gap-8">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
                    <span className="text-[10px] font-mono text-text-muted">|1⟩ hits: {counts.one}</span>
                </div>
            </div>

            {/* Probability Rule Indicator */}
            {lastShot !== null && (
                <motion.div
                    key={total}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute bottom-40 right-40 pointer-events-none opacity-20"
                >
                    <span className="text-4xl font-black font-orbitron text-white">SHOT #{total}</span>
                </motion.div>
            )}
        </div>
    );
}
