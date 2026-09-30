import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Atom, Gem, Link2, Magnet, type LucideIcon } from 'lucide-react';
import { Card, PageHeader, Badge, InfoBox } from '../components/UI';
import { SternGerlachCanvas, BellStateCanvas, CavityQEDCanvas } from '../components/learning/SimVisuals';

interface Step {
    title: string;
    description: string;
}

interface Experiment {
    id: string;
    title: string;
    Icon: LucideIcon;
    fullPath: string;
    steps: Step[];
    VisualComponent: React.FC<{ step: number }>;
}

const EXPERIMENTS: Experiment[] = [
    {
        id: 'stern-gerlach',
        title: 'Stern–Gerlach Experiment',
        Icon: Magnet,
        fullPath: '/experiments/stern-gerlach',
        VisualComponent: SternGerlachCanvas,
        steps: [
            {
                title: 'Step 1 – Concept Introduction',
                description: 'Think of tiny particles as small compass needles. In the quantum world, they have "spin." When they pass through a magnet, they don’t just go anywhere—they are forced into one of two specific states: UP or DOWN. This is the heart of quantum quantization!'
            },
            {
                title: 'Step 2 – Controlled Interaction',
                description: 'What if we rotate the magnet? By changing the angle of the magnetic field, we change the "question" we ask the particle. Rotating the magnet shifts the split from Vertical to Horizontal (Left/Right).'
            },
            {
                title: 'Step 3 – Noise and Decoherence Effect',
                description: 'Environment Noise is the enemy of quantum precision. Small vibrations or stray electric fields act like a "blur." Instead of two sharp dots, the particles get scrambled, and the quantum information "fades away" into a messy cloud.'
            },
            {
                title: 'Step 4 – Observation and Result',
                description: 'Finally, we look at where the particles landed. While we can\'t guess where one particle goes, after thousands of hits, we see a perfect 50/50 split. This is the foundation of quantum probability.'
            }
        ]
    },
    {
        id: 'bell-state',
        title: 'Bell State (Entanglement) Experiment',
        Icon: Link2,
        fullPath: '/experiments/bell-state',
        VisualComponent: BellStateCanvas,
        steps: [
            {
                title: 'Step 1 – Concept Introduction',
                description: 'Entanglement is like "ghostly" twins. When two qubits are entangled, they share the same fate. If you measure one, you instantly know what the other is doing, even if it\'s on the other side of the galaxy!'
            },
            {
                title: 'Step 2 – Controlled Interaction',
                description: 'We use a "Phase" control to change the link. Depending on the setting, the twins might always agree (matching colors) or always disagree (opposite colors). They are perfectly synchronized.'
            },
            {
                title: 'Step 3 – Noise and Decoherence Effect',
                description: 'Entanglement is extremely fragile. Just a tiny bump from the environment can "cut" the invisible bridge between the twins. Once the link is broken, they become two independent, random particles again.'
            },
            {
                title: 'Step 4 – Observation and Result',
                description: 'We prove entanglement by checking "Correlations." If they match up 100% of the time, the link is strong. This is used in building super-secure quantum networks.'
            }
        ]
    },
    {
        id: 'cavity-qed',
        title: 'Cavity Qubit Experiment',
        Icon: Gem,
        fullPath: '/experiments/cavity-qed',
        VisualComponent: CavityQEDCanvas,
        steps: [
            {
                title: 'Step 1 – Concept Introduction',
                description: 'Imagine trapping a single atom inside a hallway of perfect mirrors. Then, we throw in a single piece of light (a photon). The atom and light start a high-speed "game of catch," swapping energy back and forth.'
            },
            {
                title: 'Step 2 – Controlled Interaction',
                description: 'By moving the mirrors closer (Coupling), we make the game faster. The energy swaps back and forth with incredible speed. This allows us to "store" light energy inside the atom.'
            },
            {
                title: 'Step 3 – Noise and Decoherence Effect',
                description: 'Even the best mirrors can leak. If the photon escapes through the glass, the energy dance stops. The atom gets "tired" and its quantum signals fade away, becoming a flat line of inactivity.'
            },
            {
                title: 'Step 4 – Observation and Result',
                description: 'The result is a "Rabi Oscillation"—a beautiful wave showing energy moving between light and matter. The cleaner the wave, the better our quantum "memory" is working!'
            }
        ]
    }
];

const ModuleCard = ({ experiment }: { experiment: Experiment }) => {
    const [currentStep, setCurrentStep] = useState(0);

    return (
        <section className="scroll-mt-80 ql-simulation-module">
            <Card className="p-0 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] min-h-[520px]">
                    {/* Content Area */}
                    <div className="p-40 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-brand-border/60">
                        <div>
                            <div className="flex items-center justify-between mb-40">
                                <div className="flex items-center gap-16">
                                    <div className="ql-simulation-icon">
                                        <experiment.Icon size={22} strokeWidth={1.7} />
                                    </div>
                                    <h2 className="text-3xl font-orbitron font-900 tracking-tighter text-text-primary leading-none">
                                        {experiment.title.split(' ')[0]} <span className="gradient-text">{experiment.title.split(' ').slice(1).join(' ')}</span>
                                    </h2>
                                </div>
                                <Badge color="primary" className="opacity-80">MODULE {EXPERIMENTS.indexOf(experiment) + 1}</Badge>
                            </div>

                            {/* Step Progress Dots */}
                            <div className="flex gap-6 mb-32">
                                {experiment.steps.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentStep(idx)}
                                        aria-label={`Go to ${experiment.title}, step ${idx + 1}: ${experiment.steps[idx].title}`}
                                        aria-current={idx === currentStep ? 'step' : undefined}
                                        className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${idx === currentStep ? 'bg-brand-primary shadow-[0_0_15px_rgba(79,70,229,0.8)]' : idx < currentStep ? 'bg-brand-primary/40' : 'bg-white/5'}`}
                                    />
                                ))}
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                    className="space-y-32"
                                >
                                    <div className="space-y-8">
                                        <h3 className="text-sm font-orbitron font-bold text-brand-primary uppercase tracking-[4px]">
                                            {experiment.steps[currentStep].title}
                                        </h3>
                                        <p className="text-text-secondary leading-relaxed text-lg font-medium max-w-[90%]">
                                            {experiment.steps[currentStep].description}
                                        </p>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <div className="flex items-center justify-between mt-48 pt-32 border-t border-white/5">
                            <div className="flex gap-12">
                                <button
                                    onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                                    disabled={currentStep === 0}
                                    className="btn btn-ghost disabled:opacity-20 !px-20 text-xs font-bold uppercase tracking-widest"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => setCurrentStep(prev => Math.min(experiment.steps.length - 1, prev + 1))}
                                    className={`btn !px-32 text-xs font-bold uppercase tracking-widest transition-all ${currentStep === experiment.steps.length - 1 ? 'btn-ghost opacity-40' : 'btn-secondary'}`}
                                >
                                    {currentStep === experiment.steps.length - 1 ? 'End Guide' : 'Next Lesson'}
                                </button>
                            </div>

                            {currentStep === experiment.steps.length - 1 && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    <Link to={experiment.fullPath} className="ql-button ql-button-primary">
                                        Open full lab <ArrowRight size={15} />
                                    </Link>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Visual Container */}
                    <div className="ql-simulation-visual p-40 flex flex-col items-center justify-center relative overflow-hidden">
                        {/* Visual Grid Background */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                            style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                        <div className="w-full h-full flex flex-col items-center justify-center z-10">
                            <div className="mb-24 px-12 py-4 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-[10px] font-mono text-brand-primary uppercase tracking-[4px] animate-pulse">
                                SIMULATION ACTIVE
                            </div>

                            <div className="w-full flex-1 min-h-[220px]">
                                <experiment.VisualComponent step={currentStep} />
                            </div>

                            <div className="mt-32 grid grid-cols-2 gap-32 w-full">
                                <div className="space-y-4">
                                    <div className="text-[10px] font-mono text-text-muted">MODEL SOURCE</div>
                                    <div className="text-xs font-mono text-brand-cyan">Concept animation</div>
                                </div>
                                <div className="space-y-4">
                                    <div className="text-[10px] font-mono text-text-muted">NUMERICAL METRICS</div>
                                    <div className="text-xs font-mono text-brand-primary">Available in full lab</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="px-32 py-16 flex items-center gap-12 text-[11px] font-mono text-text-muted opacity-40 italic">
                <span className="w-8 h-8 rounded-full bg-brand-primary animate-ping" />
                Illustrative concept guide. Launch the full lab for simulator-derived measurements.
            </div>
        </section>
    );
};

const LearningBySimulation = () => {
    return (
        <div className="flex flex-col gap-48 pb-64 ql-simulation-guide">
            <PageHeader
                title="Simulation Guides"
                subtitle="Visual, step-by-step walkthroughs designed for students. Master the physics before you enter the lab."
            />

            <div className="flex flex-col gap-64 max-w-6xl mx-auto w-full px-12">
                <InfoBox label="Student Note" className="bg-brand-primary/5 border-brand-primary/20">
                    Use the <strong>"Next Lesson"</strong> buttons to move through the 4 crucial steps of each experiment. Each step introduces a new physical parameter and visualizes its effect on the quantum state.
                </InfoBox>

                {EXPERIMENTS.map(exp => (
                    <ModuleCard key={exp.id} experiment={exp} />
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="ql-simulation-cta"
            >
                <Atom size={32} strokeWidth={1.4} />
                <h3 className="text-3xl font-orbitron font-900 shadow-brand-primary mb-16">The Quantum Lab Awaits</h3>
                <p className="text-text-secondary text-lg mb-40 max-w-2xl mx-auto font-medium">Once you've completed all guides, continue into the interactive lab with 7 configurable noise channels and real-time gate debugging.</p>
                <Link to="/labs/fragility" className="ql-button ql-button-primary">
                    Enter Research Lab
                </Link>
            </motion.div>
        </div>
    );
};

export default LearningBySimulation;
