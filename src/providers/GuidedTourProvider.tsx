import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface TourStep {
    target: string;
    content: string;
    action?: () => void;
    duration?: number;
}

interface TourContextType {
    activeTour: string | null;
    currentStepIndex: number;
    startTour: (tourId: string, steps: TourStep[]) => void;
    nextStep: () => void;
    prevStep: () => void;
    endTour: () => void;
    steps: TourStep[];
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const GuidedTourProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeTour, setActiveTour] = useState<string | null>(null);
    const [steps, setSteps] = useState<TourStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    const startTour = useCallback((tourId: string, tourSteps: TourStep[]) => {
        setActiveTour(tourId);
        setSteps(tourSteps);
        setCurrentStepIndex(0);
        if (tourSteps[0]?.action) tourSteps[0].action();
    }, []);

    const endTour = useCallback(() => {
        setActiveTour(null);
        setSteps([]);
        setCurrentStepIndex(0);
    }, []);

    const nextStep = useCallback(() => {
        if (currentStepIndex < steps.length - 1) {
            const nextIdx = currentStepIndex + 1;
            setCurrentStepIndex(nextIdx);
            if (steps[nextIdx].action) steps[nextIdx].action();
        } else {
            endTour();
        }
    }, [currentStepIndex, steps, endTour]);

    const prevStep = useCallback(() => {
        if (currentStepIndex > 0) {
            const prevIdx = currentStepIndex - 1;
            setCurrentStepIndex(prevIdx);
            if (steps[prevIdx].action) steps[prevIdx].action();
        }
    }, [currentStepIndex, steps]);

    return (
        <TourContext.Provider value={{ activeTour, currentStepIndex, startTour, nextStep, prevStep, endTour, steps }}>
            {children}

            {/* Tour Overlay UI */}
            {activeTour && steps[currentStepIndex] && (
                <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[10000] w-[450px] pointer-events-auto">
                    <div className="glass-card-raised p-20 border-brand-primary/40 shadow-[0_0_50px_rgba(34,211,238,0.15)] flex flex-col gap-12 bg-[#0a0a1f]/90 backdrop-blur-xl">
                        <div className="flex justify-between items-center text-[10px] font-orbitron uppercase text-brand-primary tracking-widest">
                            <span>Guided Research: {activeTour}</span>
                            <span>Step {currentStepIndex + 1} / {steps.length}</span>
                        </div>
                        <p className="text-sm text-white/90 leading-relaxed font-medium">
                            {steps[currentStepIndex].content}
                        </p>
                        <div className="flex justify-between mt-8">
                            <button onClick={endTour} className="btn text-[10px] font-orbitron border-white/10 text-white/40 hover:text-white hover:bg-white/5 uppercase">Exit Tour</button>
                            <div className="flex gap-8">
                                <button onClick={prevStep} disabled={currentStepIndex === 0} className="btn text-[10px] font-orbitron border-white/10 text-white/60 hover:text-white disabled:opacity-20 uppercase">Prev</button>
                                <button onClick={nextStep} className="btn btn-primary !px-20 text-[10px] font-orbitron uppercase tracking-widest bg-brand-primary">
                                    {currentStepIndex === steps.length - 1 ? 'Finish' : 'Next Step'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </TourContext.Provider>
    );
};

export const useTour = () => {
    const context = useContext(TourContext);
    if (!context) throw new Error('useTour must be used within GuidedTourProvider');
    return context;
};
