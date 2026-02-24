import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../providers/ThemeProvider';

// ── Desktop hover dropdown ────────────────────────────────────────────────────
const NavDropdown = ({ label, items }: { label: string; items: { to: string; label: string; icon?: string }[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
            <button className="btn btn-ghost !px-12 !py-4 flex items-center gap-4">
                {label}
                <span className={`text-[10px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full pt-8 z-50 min-w-[220px]"
                    >
                        <div className="glass-card-raised p-8 flex flex-col gap-2">
                            {items.map(item => (
                                <NavLink key={item.to} to={item.to}
                                    className={({ isActive }) =>
                                        `flex items-center gap-8 px-12 py-8 rounded-lg text-[13px] font-medium transition-all
                    ${isActive ? 'bg-brand-primary/15 text-brand-primary' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`
                                    }
                                >
                                    <span className="text-base">{item.icon}</span>{item.label}
                                </NavLink>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ── Mobile accordion section ──────────────────────────────────────────────────
type NavItem = { to: string; label: string; icon?: string; end: boolean };
type Section = { title: string; items: NavItem[] };

const AccordionSection = ({ section, isOpen, onToggle, close }: {
    section: Section;
    isOpen: boolean;
    onToggle: () => void;
    close: () => void;
}) => {
    const single = section.items.length === 1;
    if (single) {
        // Direct link row — no expand needed
        const item = section.items[0];
        return (
            <NavLink to={item.to} end={item.end} onClick={close}
                className={({ isActive }) =>
                    `flex items-center gap-14 w-full px-16 py-[13px] rounded-xl text-[16px] font-semibold transition-all mb-1
          ${isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:text-white hover:bg-white/6'}`
                }
            >
                <span className="text-[18px] w-6 text-center">{item.icon}</span>
                <span>{item.label}</span>
            </NavLink>
        );
    }

    return (
        <div className="mb-1">
            {/* Tappable heading */}
            <button
                onClick={onToggle}
                className={`flex items-center justify-between w-full px-16 py-[13px] rounded-xl text-[16px] font-semibold transition-all hover:bg-white/6 text-left ${isOpen ? 'text-white' : 'text-white/65'}`}
            >
                <span>{section.title}</span>
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.18 }}
                    className="text-[11px] opacity-40">▼</motion.span>
            </button>

            {/* Expanding sub-items */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div className="flex flex-col gap-[2px] pt-1 pb-3 pl-10">
                            {section.items.map(item => (
                                <NavLink key={item.to} to={item.to} end={item.end} onClick={close}
                                    className={({ isActive }) =>
                                        `flex items-center gap-12 px-14 py-[10px] rounded-xl text-[14px] font-medium transition-all
                      ${isActive ? 'bg-indigo-500/15 text-white border border-indigo-500/25' : 'text-white/50 hover:text-white hover:bg-white/6'}`
                                    }
                                >
                                    <span className="text-[16px] w-5 text-center">{item.icon}</span>
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ── Navbar ────────────────────────────────────────────────────────────────────
const Navbar = () => {
    const [open, setOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const [openSection, setOpenSection] = useState<number | null>(null);
    const close = () => { setOpen(false); setOpenSection(null); };

    const labItems: NavItem[] = [
        { to: '/fragility-lab', label: 'Fragility Lab', icon: '🧪', end: false },
        { to: '/quantum-vs-classical', label: 'Quantum vs Classical', icon: '⚖️', end: false },
        { to: '/gate-builder', label: 'Gate Builder', icon: '🔧', end: false },
    ];
    const visualizerItems: NavItem[] = [
        { to: '/qiskit-visualizer', label: 'Qiskit Visualizer', icon: '📊', end: false },
        { to: '/qasm-visualizer', label: 'QASM Visualizer', icon: '📝', end: false },
    ];
    const experimentItems: NavItem[] = [
        { to: '/experiments', label: 'All Experiments', icon: '🔬', end: false },
        { to: '/experiments/stern-gerlach', label: 'Stern–Gerlach', icon: '🧲', end: false },
        { to: '/experiments/cavity-qed', label: 'Cavity QED', icon: '💎', end: false },
        { to: '/experiments/bell-state', label: 'Bell State', icon: '🔔', end: false },
    ];
    const learnItems: NavItem[] = [
        { to: '/learn', label: 'Theory & Wiki', icon: '📚', end: false },
        { to: '/learning-by-simulation', label: 'Simulation Guide', icon: '🎓', end: false },
    ];

    const mobileSections: Section[] = [
        { title: 'Home', items: [{ to: '/', label: 'Home', icon: '🏠', end: true }] },
        { title: 'Labs', items: labItems },
        { title: 'Visualizers', items: visualizerItems },
        { title: 'Experiments', items: experimentItems },
        { title: 'Learn', items: learnItems },
        { title: 'About', items: [{ to: '/about', label: 'About', icon: 'ℹ️', end: false }] },
    ];

    return (
        <>
            {/* Fixed top bar */}
            <header className="fixed top-0 left-0 right-0 z-[1000] h-[60px] bg-background/90 backdrop-blur-xl border-b border-brand-border">
                <div className="max-w-[1280px] mx-auto h-full px-20 flex items-center justify-between">
                    <Link to="/" className="flex flex-col group">
                        <span className="font-orbitron font-black text-[18px] tracking-[2px] group-hover:opacity-80 transition-opacity">⚛ Quantum Lens</span>
                        <span className="text-[9px] font-mono tracking-widest text-text-muted -mt-1 uppercase">Virtual Quantum Lab</span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden lg:flex items-center gap-4">
                        <NavLink to="/" end className={({ isActive }) => `btn btn-ghost !px-12 !py-4 ${isActive ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20' : ''}`}>Home</NavLink>
                        <NavDropdown label="Labs" items={labItems} />
                        <NavDropdown label="Visualizers" items={visualizerItems} />
                        <NavDropdown label="Experiments" items={experimentItems} />
                        <NavDropdown label="Learn" items={learnItems} />
                        <NavLink to="/about" className={({ isActive }) => `btn btn-ghost !px-12 !py-4 ${isActive ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20' : ''}`}>About</NavLink>
                    </nav>

                    <div className="flex items-center gap-10">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="btn btn-ghost !p-8 flex items-center justify-center group relative overflow-hidden"
                            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            <motion.span
                                key={theme}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="text-[18px]"
                            >
                                {theme === 'dark' ? '🌙' : '☀️'}
                            </motion.span>
                        </button>

                        {/* Animated hamburger */}
                        <button onClick={() => setOpen(v => !v)} className="lg:hidden flex flex-col justify-center items-center gap-[5px] w-9 h-9" aria-label="Open menu">
                            <motion.span animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }} transition={{ duration: 0.2 }} className="block h-[2px] w-6 bg-white rounded-full" />
                            <motion.span animate={open ? { opacity: 0 } : { opacity: 1 }} transition={{ duration: 0.15 }} className="block h-[2px] w-6 bg-white rounded-full" />
                            <motion.span animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }} transition={{ duration: 0.2 }} className="block h-[2px] w-6 bg-white rounded-full" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile full-screen overlay — z-[9999] puts it above everything */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="mobile-overlay"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[9999] bg-[#07071a] flex flex-col lg:hidden"
                        style={{ paddingTop: 'env(safe-area-inset-top)' }}
                    >
                        {/* Header row */}
                        <div className="flex items-center justify-between px-20 h-[60px] border-b border-white/10 shrink-0">
                            <Link to="/" onClick={close} className="font-orbitron font-black text-[17px]">⚛ Quantum Lens</Link>
                            <button onClick={close} className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 text-white/60 hover:text-white transition-all text-lg">✕</button>
                        </div>

                        {/* Accordion list */}
                        <div className="flex-1 overflow-y-auto px-14 py-10" style={{ WebkitOverflowScrolling: 'touch' }}>
                            {mobileSections.map((section, i) => (
                                <AccordionSection
                                    key={section.title}
                                    section={section}
                                    isOpen={openSection === i}
                                    onToggle={() => setOpenSection(prev => prev === i ? null : i)}
                                    close={close}
                                />
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="shrink-0 flex items-center justify-end px-20 py-14 border-t border-white/8"
                            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 14px)' }}>
                            <span className="text-[24px] opacity-20">⚛</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
