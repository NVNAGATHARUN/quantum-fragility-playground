import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────
export type TourStep = {
    id: string;
    title: string;
    body: string;
    highlight?: string; // CSS selector to spotlight
    action?: () => void; // Auto-run action for this step
    duration?: number; // ms to auto-advance if no user click
};

type LabShellProps = {
    children: React.ReactNode;
    tourSteps?: TourStep[];
    labName: string;
    soundEnabled: boolean;
    setSoundEnabled: (v: boolean) => void;
};

// ─── CRT Overlay ─────────────────────────────────────────────────────────────
const CRTOverlay = ({ active }: { active: boolean }) => (
    <AnimatePresence>
        {active && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9998] pointer-events-none"
                style={{
                    background: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 0, 0, 0.08) 2px,
              rgba(0, 0, 0, 0.08) 4px
            )
          `,
                    mixBlendMode: 'multiply',
                }}
            >
                {/* Vignette */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.55) 100%)',
                }} />
                {/* Phosphor glow tint */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0, 255, 128, 0.018)',
                    mixBlendMode: 'screen',
                }} />
            </motion.div>
        )}
    </AnimatePresence>
);

// ─── Tour Callout ─────────────────────────────────────────────────────────────
const TourCallout = ({
    step, stepIndex, total, onNext, onSkip,
}: {
    step: TourStep; stepIndex: number; total: number;
    onNext: () => void; onSkip: () => void;
}) => {
    useEffect(() => {
        if (step.action) step.action();
        if (step.duration) {
            const t = setTimeout(onNext, step.duration);
            return () => clearTimeout(t);
        }
    }, [step]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[9999] w-[480px] max-w-[90vw]"
            style={{
                background: 'linear-gradient(135deg, rgba(8,12,20,0.97), rgba(15,20,40,0.97))',
                border: '1px solid rgba(34,211,238,0.35)',
                borderRadius: '20px',
                boxShadow: '0 0 60px rgba(34,211,238,0.12), 0 24px 48px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(20px)',
            }}
        >
            {/* Top bar */}
            <div className="flex items-center justify-between px-24 pt-20 pb-8">
                <div className="flex items-center gap-10">
                    <div className="w-6 h-6 rounded-full bg-[#22d3ee] animate-pulse" />
                    <span className="text-[9px] font-orbitron text-[#22d3ee] uppercase tracking-[3px]">Lab Tour</span>
                </div>
                <div className="flex items-center gap-8">
                    <span className="text-[9px] font-mono text-white/30">{stepIndex + 1}/{total}</span>
                    <button onClick={onSkip} className="text-[9px] font-orbitron text-white/30 hover:text-white/60 transition-colors uppercase">
                        Skip ✕
                    </button>
                </div>
            </div>

            {/* Dots */}
            <div className="flex gap-5 px-24">
                {Array.from({ length: total }).map((_, i) => (
                    <div key={i} className="h-1.5 rounded-full flex-1 transition-all duration-300"
                        style={{ background: i <= stepIndex ? '#22d3ee' : 'rgba(255,255,255,0.1)' }} />
                ))}
            </div>

            {/* Content */}
            <div className="px-24 py-20">
                <h3 className="text-lg font-orbitron font-black text-white mb-8 tracking-tight">{step.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{step.body}</p>
            </div>

            {/* Footer */}
            <div className="px-24 pb-20 flex justify-end">
                <button
                    onClick={onNext}
                    className="px-20 py-10 rounded-xl font-orbitron text-[11px] font-bold uppercase tracking-wider transition-all"
                    style={{
                        background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(99,102,241,0.2))',
                        border: '1px solid rgba(34,211,238,0.4)',
                        color: '#22d3ee',
                    }}
                >
                    {stepIndex + 1 < total ? 'Next →' : 'Finish ✓'}
                </button>
            </div>
        </motion.div>
    );
};

// ─── Toolbar ─────────────────────────────────────────────────────────────────
const ToolbarButton = ({ onClick, active, title, children }: {
    onClick: () => void; active?: boolean; title: string; children: React.ReactNode;
}) => (
    <button
        onClick={onClick}
        title={title}
        className="w-32 h-32 rounded-lg flex items-center justify-center text-sm transition-all"
        style={{
            background: active ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${active ? 'rgba(34,211,238,0.4)' : 'rgba(255,255,255,0.1)'}`,
            color: active ? '#22d3ee' : 'rgba(255,255,255,0.4)',
        }}
    >
        {children}
    </button>
);

// ─── Main LabShell ───────────────────────────────────────────────────────────
export default function LabShell({ children, tourSteps = [], labName, soundEnabled, setSoundEnabled }: LabShellProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [crtMode, setCrtMode] = useState(false);
    const [tourActive, setTourActive] = useState(false);
    const [tourStep, setTourStep] = useState(0);

    // Sync fullscreen state with browser
    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const toggleFullscreen = useCallback(async () => {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
        } else {
            await document.exitFullscreen();
        }
    }, []);

    const startTour = useCallback(() => {
        setTourStep(0);
        setTourActive(true);
    }, []);

    const nextTourStep = useCallback(() => {
        if (tourStep + 1 < tourSteps.length) {
            setTourStep(s => s + 1);
        } else {
            setTourActive(false);
        }
    }, [tourStep, tourSteps.length]);

    return (
        <div ref={containerRef} className="relative">
            {/* CRT Overlay */}
            <CRTOverlay active={crtMode} />

            {/* Lab Toolbar */}
            <div className="fixed top-[70px] right-16 z-[1001] flex flex-col gap-6">
                <ToolbarButton onClick={toggleFullscreen} active={isFullscreen} title="Toggle Fullscreen">
                    {isFullscreen ? '⛶' : '⛶'}
                </ToolbarButton>
                <ToolbarButton onClick={() => setCrtMode(c => !c)} active={crtMode} title="CRT Retro Mode">
                    📟
                </ToolbarButton>
                <ToolbarButton onClick={() => setSoundEnabled(!soundEnabled)} active={soundEnabled} title="Toggle Sound">
                    {soundEnabled ? '🔊' : '🔇'}
                </ToolbarButton>
                {tourSteps.length > 0 && (
                    <ToolbarButton onClick={startTour} active={tourActive} title="Start Lab Tour">
                        🎓
                    </ToolbarButton>
                )}
            </div>

            {/* Main content */}
            <div style={{ filter: crtMode ? 'contrast(1.06) brightness(0.94) saturate(0.85)' : undefined }}>
                {children}
            </div>

            {/* Tour Callout */}
            <AnimatePresence mode="wait">
                {tourActive && tourSteps[tourStep] && (
                    <TourCallout
                        key={tourStep}
                        step={tourSteps[tourStep]}
                        stepIndex={tourStep}
                        total={tourSteps.length}
                        onNext={nextTourStep}
                        onSkip={() => setTourActive(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
