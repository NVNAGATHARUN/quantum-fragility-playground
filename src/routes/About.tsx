import React from 'react';
import { motion } from 'framer-motion';
import { Card, PageHeader, SectionHeader, Badge, Divider } from '../components/UI';

export default function About() {
    return (
        <div className="flex flex-col gap-48 pb-64">
            <PageHeader
                title="About the Playground"
                subtitle="Building a bridge between classical intuition and quantum reality."
                icon="ℹ️"
            />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-48">
                <div className="flex flex-col gap-48">
                    <section>
                        <SectionHeader title="The Mission" />
                        <div className="text-text-secondary leading-relaxed flex flex-col gap-16 text-lg">
                            <p>
                                Quantum computers promise to revolutionize cryptography, material science, and medicine. However, they face a formidable enemy: <strong>Decoherence</strong>.
                            </p>
                            <p>
                                Unlike classical bits (0 or 1), which are robust and can be stored for years, quantum bits (superpositions of 0 and 1) are incredibly fragile. Even the slightest interaction with the environment—a stray magnetic field or a microscopic temperature change—destroys the quantum state.
                            </p>
                            <p>
                                The <strong>Quantum Fragility Playground</strong> was built to visualize this fragility. Our goal is to make the complex mathematics of noise channels intuitive through interactive 3D simulations and virtual labs.
                            </p>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 md:grid-cols-2 gap-24">
                        <Card className="p-32 flex flex-col gap-16 border-brand-cyan/20">
                            <div className="text-3xl">🧩</div>
                            <h3 className="text-xl font-orbitron text-brand-cyan">Why it matters</h3>
                            <p className="text-sm text-text-secondary">
                                To build useful quantum computers, we must find ways to shield qubits from noise. This is the field of <strong>Quantum Error Correction (QEC)</strong>.
                            </p>
                        </Card>
                        <Card className="p-32 flex flex-col gap-16 border-brand-purple/20">
                            <div className="text-3xl">⚡</div>
                            <h3 className="text-xl font-orbitron text-brand-purple">Real Physics</h3>
                            <p className="text-sm text-text-secondary">
                                This isn't just a game. Our backend uses a <strong>Density Matrix</strong> simulator that calculates actual probabilities using standard quantum noise models (T₁, T₂, Depolarizing).
                            </p>
                        </Card>
                    </section>

                    <section>
                        <SectionHeader title="Scientific Acknowledgments" />
                        <div className="text-text-secondary text-sm leading-relaxed italic border-l-2 border-brand-border pl-24">
                            "If you think you understand quantum mechanics, you don't understand quantum mechanics." — Richard Feynman.
                            <br /><br />
                            This project draws inspiration from the <strong>Qiskit</strong> framework, the <strong>IBM Quantum</strong> educator tools, and the works of Nielsen & Chuang.
                        </div>
                    </section>
                </div>

                <aside className="flex flex-col gap-24">
                    <Card className="p-24 flex flex-col gap-16 bg-surface-raised">
                        <SectionHeader title="Project Specs" />
                        <div className="flex flex-col gap-12">
                            <div className="flex justify-between items-center text-[10px] font-orbitron uppercase border-b border-brand-border pb-8">
                                <span className="text-text-muted">Version</span>
                                <span className="text-brand-gold">v2.0.0</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-orbitron uppercase border-b border-brand-border pb-8">
                                <span className="text-text-muted">Tech Stack</span>
                                <span className="text-brand-primary">Vite + React</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-orbitron uppercase border-b border-brand-border pb-8">
                                <span className="text-text-muted">Visuals</span>
                                <span className="text-brand-cyan">Three.js + R3F</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-orbitron uppercase">
                                <span className="text-text-muted">Sim Engine</span>
                                <span className="text-brand-purple">Custom TS/MD</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-24 border-brand-primary/20 bg-brand-primary/5">
                        <h4 className="text-[10px] font-orbitron uppercase mb-12">Open Source</h4>
                        <p className="text-[11px] text-text-secondary mb-16">
                            This playground is open for educational use. Feel free to explore the code to understand how we map Bloch sphere rotations to 3D quaternions.
                        </p>
                        <button className="btn btn-primary w-full text-[9px]">View Repository</button>
                    </Card>
                </aside>
            </div>
        </div>
    );
}
