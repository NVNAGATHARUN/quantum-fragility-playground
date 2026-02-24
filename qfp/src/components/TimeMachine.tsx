import React from 'react';
import { motion } from 'framer-motion';

interface TimeMachineProps {
    history: any[];
    onScrub: (index: number) => void;
    currentIndex: number;
    isRunning: boolean;
    onTogglePlay: () => void;
}

export default function TimeMachine({ history, onScrub, currentIndex, isRunning, onTogglePlay }: TimeMachineProps) {
    if (history.length <= 1) return null;

    return (
        <div className="w-full flex flex-col gap-12 p-16 rounded-2xl bg-surface/30 border border-brand-border backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-12">
                    <button
                        onClick={onTogglePlay}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isRunning ? 'bg-brand-red/20 text-brand-red border border-brand-red/30' : 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30'}`}
                    >
                        {isRunning ? '⏸' : '▶'}
                    </button>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-orbitron text-text-secondary uppercase tracking-widest leading-tight">Evolution Time Machine</span>
                        <span className="text-[9px] font-mono text-text-muted">{currentIndex + 1} / {history.length} frames captured</span>
                    </div>
                </div>
                {!isRunning && (
                    <div className="px-8 py-2 rounded-md bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-[8px] font-orbitron animate-pulse">
                        SCRIBING ARCHIVE
                    </div>
                )}
            </div>

            <div className="relative h-12 flex items-center group">
                {/* Background Track */}
                <div className="absolute inset-0 h-2 my-auto bg-brand-border/30 rounded-full" />

                {/* Progress Fill */}
                <div
                    className="absolute h-2 my-auto bg-gradient-to-r from-brand-primary to-brand-cyan rounded-full transition-all duration-300"
                    style={{ width: `${(currentIndex / (history.length - 1)) * 100}%` }}
                />

                {/* Input Range */}
                <input
                    type="range"
                    min={0}
                    max={history.length - 1}
                    value={currentIndex}
                    onChange={(e) => onScrub(parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                {/* Custom Thumb */}
                <motion.div
                    className="absolute top-1/2 -mt-6 w-12 h-12 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] pointer-events-none border-2 border-brand-primary flex items-center justify-center"
                    style={{ left: `calc(${(currentIndex / (history.length - 1)) * 100}% - 6px)` }}
                >
                    <div className="w-2 h-2 bg-brand-primary rounded-full" />
                </motion.div>
            </div>

            <div className="flex justify-between text-[8px] font-mono text-text-muted uppercase tracking-tighter">
                <span>T-History Start</span>
                <span>Real-time T-0</span>
            </div>
        </div>
    );
}
