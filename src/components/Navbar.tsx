import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../providers/ThemeProvider";
import {
  Sparkles,
  FlaskConical,
  Cpu,
  Atom,
  Terminal,
  Search,
  Moon,
  Sun,
  Menu,
  X,
  ChevronDown,
  Layers,
  Activity,
  Award,
  BookOpen,
  Compass,
  ArrowRight,
  Shield,
  Zap,
} from "lucide-react";

interface NavDropdownItem {
  to: string;
  label: string;
  desc?: string;
  icon: React.ReactNode;
  badge?: string;
  end?: boolean;
}

interface NavDropdownProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  items: NavDropdownItem[];
  activePrefixes?: string[];
  activeId: string | null;
  onSetActive: (id: string | null) => void;
  closeTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

const DesktopDropdown: React.FC<NavDropdownProps> = ({
  id,
  label,
  icon,
  items,
  activePrefixes,
  activeId,
  onSetActive,
  closeTimerRef,
}) => {
  const location = useLocation();
  const isOpen = activeId === id;

  const isActive = activePrefixes
    ? activePrefixes.some(prefix => location.pathname.startsWith(prefix))
    : items.some(item => location.pathname === item.to || location.pathname.startsWith(item.to + "/"));

  const openMenu = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    onSetActive(id);
  };

  const scheduleClose = () => {
    closeTimerRef.current = setTimeout(() => {
      onSetActive(null);
    }, 160);
  };

  const { theme } = useTheme();

  return (
    <div
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        onClick={() => onSetActive(isOpen ? null : id)}
        className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 cursor-pointer " +
          (isActive || isOpen
            ? "text-indigo-700 bg-indigo-50 border border-indigo-200 shadow-xs dark:text-cyan-400 dark:bg-cyan-950/40 dark:border-cyan-500/30 dark:shadow-[0_0_12px_rgba(6,182,212,0.15)]"
            : "text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5")}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {icon && <span className="opacity-90 flex items-center">{icon}</span>}
        <span>{label}</span>
        <ChevronDown
          className={"w-[14px] h-[14px] transition-transform duration-200 " +
            (isOpen ? "rotate-180 text-indigo-600 dark:text-cyan-400" : "text-slate-400")}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.13, ease: "easeOut" }}
            className="absolute left-0 top-full pt-2 z-50 w-[380px]"
            onMouseEnter={openMenu}
            onMouseLeave={scheduleClose}
          >
            <div
              className="rounded-2xl p-3 shadow-2xl border backdrop-blur-2xl transition-colors duration-200"
              style={{
                background: theme === "dark" ? "rgba(5, 10, 26, 0.97)" : "rgba(255, 255, 255, 0.98)",
                borderColor: theme === "dark" ? "rgba(99, 102, 241, 0.35)" : "rgba(226, 232, 240, 0.95)",
                boxShadow: theme === "dark"
                  ? "0 25px 50px -12px rgba(0,0,0,0.85), 0 0 35px rgba(99,102,241,0.2)"
                  : "0 20px 45px -10px rgba(15, 23, 42, 0.12), 0 0 20px rgba(99, 102, 241, 0.06)",
              }}
            >
              <div className="max-h-[68vh] overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-1.5">
                {items.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => onSetActive(null)}
                    className={({ isActive: active }) =>
                      "flex items-start gap-3 p-2.5 rounded-xl transition-all group " +
                      (active
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs dark:bg-indigo-600/25 dark:text-cyan-300 dark:border-cyan-500/40"
                        : "text-slate-700 hover:text-indigo-600 hover:bg-slate-50 border border-transparent dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/[0.08] dark:hover:border-white/10")
                    }
                  >
                    <div
                      className="w-[38px] h-[38px] min-w-[38px] rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        background: theme === "dark" ? "rgba(99, 102, 241, 0.16)" : "rgba(99, 102, 241, 0.08)",
                        border: theme === "dark" ? "1px solid rgba(99, 102, 241, 0.35)" : "1px solid rgba(99, 102, 241, 0.20)",
                      }}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-semibold tracking-wide text-slate-900 group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-cyan-300 transition-colors">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 border border-cyan-500/30 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40 uppercase whitespace-nowrap shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.desc && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 leading-snug mt-0.5 line-clamp-2">
                          {item.desc}
                        </p>
                      )}
                    </div>
                  </NavLink>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface NavbarProps {
  onOpenCommandPalette?: () => void;
}

export default function Navbar({ onOpenCommandPalette }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setActiveMenu(null);
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const nav = document.getElementById("desktop-nav");
      if (nav && !nav.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveMenu(null);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const handleSetActive = useCallback((id: string | null) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setActiveMenu(id);
  }, []);

  const labItems: NavDropdownItem[] = [
    {
      to: "/labs/fragility",
      label: "Fragility Lab",
      desc: "Real-time 3D Bloch decoherence & Kraus noise",
      badge: "Core Lab",
      icon: <FlaskConical className="w-[18px] h-[18px] text-cyan-400" />,
    },
    {
      to: "/labs/studio",
      label: "Circuit Studio",
      desc: "Interactive gate canvas & matrix math workbench",
      badge: "Workbench",
      icon: <Terminal className="w-[18px] h-[18px] text-purple-400" />,
    },
    {
      to: "/labs/conflict",
      label: "Cognitive Conflict Lab",
      desc: "Predict-Observe-Explain misconception breaker",
      badge: "POE AI",
      icon: <Zap className="w-[18px] h-[18px] text-amber-400" />,
    },
    {
      to: "/quantum-vs-classical",
      label: "Quantum vs Classical",
      desc: "Side-by-side noise decay comparison",
      icon: <Activity className="w-[18px] h-[18px] text-emerald-400" />,
    },
    {
      to: "/learning-by-simulation",
      label: "Simulation Guide",
      desc: "Foundational quantum mechanics visual lessons",
      icon: <BookOpen className="w-[18px] h-[18px] text-blue-400" />,
    },
    {
      to: "/labs",
      label: "All Guided Labs",
      desc: "Step-by-step interactive laboratory exercises",
      icon: <Layers className="w-[18px] h-[18px] text-indigo-400" />,
      end: true,
    },
    {
      to: "/challenges",
      label: "Interactive Challenges",
      desc: "Solve state synthesis and algorithm puzzles",
      badge: "Puzzles",
      icon: <Award className="w-[18px] h-[18px] text-rose-400" />,
    },
  ];

  const algorithmItems: NavDropdownItem[] = [
    {
      to: "/explore/algorithms",
      label: "All Algorithms",
      desc: "Comprehensive visual quantum algorithms hub",
      icon: <Compass className="w-[18px] h-[18px] text-cyan-400" />,
      end: true,
    },
    {
      to: "/explore/algorithms/bell-state",
      label: "Bell State (AL-01)",
      desc: "Maximal entanglement & EPR pairs",
      icon: <Atom className="w-[18px] h-[18px] text-violet-400" />,
    },
    {
      to: "/explore/algorithms/deutsch-jozsa",
      label: "Deutsch-Jozsa (AL-02)",
      desc: "Quantum parallelism & constant vs balanced",
      icon: <Zap className="w-[18px] h-[18px] text-amber-400" />,
    },
    {
      to: "/explore/experiments/grover",
      label: "Grover Search (AL-03)",
      desc: "Quadratic speedup & amplitude amplification",
      icon: <Search className="w-[18px] h-[18px] text-emerald-400" />,
    },
    {
      to: "/explore/algorithms/teleportation",
      label: "Quantum Teleportation (AL-04)",
      desc: "Transfer unknown quantum state via Bell pair",
      icon: <Activity className="w-[18px] h-[18px] text-rose-400" />,
    },
    {
      to: "/explore/algorithms/qft",
      label: "Quantum Fourier Transform (AL-05)",
      desc: "Phase estimation engine for Shor algorithm",
      icon: <Layers className="w-[18px] h-[18px] text-indigo-400" />,
    },
    {
      to: "/explore/algorithms/qkd",
      label: "Visual QKD BB84 (AL-07)",
      desc: "Quantum cryptography with Eve eavesdropping",
      badge: "Crypto",
      icon: <Shield className="w-[18px] h-[18px] text-cyan-400" />,
    },
    {
      to: "/explore/algorithms/network",
      label: "Network Repeater (AL-08)",
      desc: "Quantum entanglement swapping & repeaters",
      icon: <Atom className="w-[18px] h-[18px] text-purple-400" />,
    },
  ];

  const experimentItems: NavDropdownItem[] = [
    {
      to: "/explore/experiments",
      label: "All Experiments",
      desc: "Browse verified V-Labs physics setups",
      icon: <FlaskConical className="w-[18px] h-[18px] text-cyan-400" />,
      end: true,
    },
    {
      to: "/explore/experiments/stern-gerlach",
      label: "Stern-Gerlach",
      desc: "Spatial spin quantization in inhomogeneous B-field",
      icon: <Atom className="w-[18px] h-[18px] text-amber-400" />,
    },
    {
      to: "/explore/experiments/bell-state",
      label: "Bell State & CHSH Test",
      desc: "EPR correlations violating classical Bell inequality",
      icon: <Activity className="w-[18px] h-[18px] text-purple-400" />,
    },
    {
      to: "/explore/experiments/cavity-qed",
      label: "Cavity QED (Jaynes-Cummings)",
      desc: "Atom-photon coupling in optical cavity",
      icon: <Sparkles className="w-[18px] h-[18px] text-blue-400" />,
    },
    {
      to: "/explore/experiments/grover",
      label: "Grover Search Experiment",
      desc: "Simulate oracle inversion and diffusion operator",
      icon: <Search className="w-[18px] h-[18px] text-emerald-400" />,
    },
  ];

  const visualizerItems: NavDropdownItem[] = [
    {
      to: "/qasm-visualizer",
      label: "OpenQASM 2.0 Visualizer",
      desc: "Import assembly code, tokenize AST, render circuit",
      badge: "QASM",
      icon: <Terminal className="w-[18px] h-[18px] text-cyan-400" />,
    },
    {
      to: "/qiskit-visualizer",
      label: "Qiskit Circuit Visualizer",
      desc: "Import IBM Qiskit JSON schema & gate representations",
      badge: "IBM",
      icon: <Cpu className="w-[18px] h-[18px] text-indigo-400" />,
    },
  ];

  const toggleMobileAccordion = (key: string) => {
    setOpenAccordion(prev => (prev === key ? null : key));
  };

  const ddProps = {
    activeId: activeMenu,
    onSetActive: handleSetActive,
    closeTimerRef,
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 h-[72px] transition-all duration-300"
        style={{
          background: theme === "dark" ? "rgba(3, 7, 20, 0.92)" : "rgba(255, 255, 255, 0.94)",
          backdropFilter: "blur(20px)",
          borderBottom: theme === "dark" ? "1px solid rgba(99, 102, 241, 0.18)" : "1px solid rgba(226, 232, 240, 0.90)",
          boxShadow: theme === "dark" ? "0 4px 30px rgba(0, 0, 0, 0.45)" : "0 4px 20px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div className="max-w-[1560px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-lg transition-transform duration-300 group-hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
                boxShadow: "0 0 16px rgba(124, 58, 237, 0.4)",
              }}
            >
              <span className="text-xl leading-none">&#9883;</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span
                  className="font-orbitron font-extrabold text-[16px] tracking-wide text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-cyan-300 transition-colors"
                  style={{ letterSpacing: "0.05em" }}
                >
                  Quantum Lens
                </span>
                <span className="hidden sm:inline-block text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-700 border border-cyan-500/30 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30">
                  AI LAB
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 tracking-wider -mt-0.5">
                Grounded Quantum Lab &bull; SIH PS26140
              </span>
            </div>
          </Link>

          <nav id="desktop-nav" className="hidden xl:flex items-center gap-1.5">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                "px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all " +
                (isActive
                  ? "text-indigo-700 bg-indigo-50 border border-indigo-200 shadow-xs dark:text-cyan-300 dark:bg-cyan-950/40 dark:border-cyan-500/30"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5")
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/learn"
              className={({ isActive }) =>
                "px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all " +
                (isActive
                  ? "text-indigo-700 bg-indigo-50 border border-indigo-200 shadow-xs dark:text-cyan-300 dark:bg-cyan-950/40 dark:border-cyan-500/30"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5")
              }
            >
              Learn
            </NavLink>

            <DesktopDropdown
              id="labs"
              label="Virtual Labs"
              icon={<FlaskConical className="w-[15px] h-[15px] text-indigo-600 dark:text-cyan-400" />}
              items={labItems}
              activePrefixes={["/labs", "/fragility-lab", "/gate-builder", "/quantum-vs-classical", "/learning-by-simulation", "/challenges"]}
              {...ddProps}
            />

            <DesktopDropdown
              id="algorithms"
              label="Algorithms"
              icon={<Atom className="w-[15px] h-[15px] text-purple-600 dark:text-purple-400" />}
              items={algorithmItems}
              activePrefixes={["/explore/algorithms", "/algorithms"]}
              {...ddProps}
            />

            <DesktopDropdown
              id="experiments"
              label="Experiments"
              icon={<Sparkles className="w-[15px] h-[15px] text-amber-500 dark:text-amber-400" />}
              items={experimentItems}
              activePrefixes={["/explore/experiments", "/experiments"]}
              {...ddProps}
            />

            <DesktopDropdown
              id="visualizers"
              label="Visualizers"
              icon={<Terminal className="w-[15px] h-[15px] text-emerald-600 dark:text-emerald-400" />}
              items={visualizerItems}
              activePrefixes={["/qasm-visualizer", "/qiskit-visualizer"]}
              {...ddProps}
            />

            <NavLink
              to="/explore/hardware"
              className={({ isActive }) =>
                "px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all " +
                (isActive
                  ? "text-indigo-700 bg-indigo-50 border border-indigo-200 shadow-xs dark:text-cyan-300 dark:bg-cyan-950/40 dark:border-cyan-500/30"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5")
              }
            >
              Hardware
            </NavLink>

            {/* ── QuantumLens 3D ── glowing pill CTA */}
            <NavLink
              to="/quantum-lens"
              className={({ isActive }) =>
                "relative px-3.5 py-1.5 rounded-lg text-[13px] font-bold tracking-wide transition-all flex items-center gap-1.5 " +
                (isActive
                  ? "text-white border border-cyan-400/60 shadow-lg shadow-cyan-500/25"
                  : "text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/60 hover:text-white hover:shadow-md hover:shadow-cyan-500/20")
              }
              style={({ isActive }) => ({
                background: isActive
                  ? "linear-gradient(135deg, rgba(6,182,212,0.25), rgba(99,102,241,0.20))"
                  : "linear-gradient(135deg, rgba(6,182,212,0.08), rgba(99,102,241,0.06))",
              })}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              QuantumLens 3D
            </NavLink>

            <NavLink
              to="/progress"
              className={({ isActive }) =>
                "px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all " +
                (isActive
                  ? "text-indigo-700 bg-indigo-50 border border-indigo-200 shadow-xs dark:text-cyan-300 dark:bg-cyan-950/40 dark:border-cyan-500/30"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5")
              }
            >
              Progress
            </NavLink>

            <NavLink
              to="/instructor"
              className={({ isActive }) =>
                "px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all " +
                (isActive
                  ? "text-amber-800 bg-amber-50 border border-amber-200 shadow-xs dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-500/30"
                  : "text-amber-700/90 hover:text-amber-900 hover:bg-amber-50 border border-transparent dark:text-amber-400/80 dark:hover:text-amber-300 dark:hover:bg-amber-500/10")
              }
            >
              Instructor
            </NavLink>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenCommandPalette}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all text-slate-600 hover:text-slate-900 border border-slate-200 bg-slate-100/70 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:bg-white/[0.04] dark:border-white/[0.08]"
              title="Search command palette (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />
              <span>Search labs...</span>
              <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-white dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 shadow-2xs">
                Ctrl+K
              </kbd>
            </button>

            <Link
              to="/labs/fragility"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all duration-300 hover:brightness-110 shadow-md"
              style={{
                background: "linear-gradient(135deg, #6366F1, #06B6D4)",
                boxShadow: "0 0 14px rgba(99, 102, 241, 0.35)",
              }}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Fragility Lab</span>
              <ArrowRight className="w-3 h-3 opacity-80" />
            </Link>

            {/* Human-Centric Animated Bright / Dark Mode Button */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 group cursor-pointer shadow-xs select-none bg-amber-50 hover:bg-amber-100/90 border-amber-200 text-amber-950 dark:bg-slate-900/80 dark:hover:bg-slate-800 dark:border-white/15 dark:text-slate-200"
              title={theme === "dark" ? "Switch to Bright / Daylight Mode" : "Switch to Deep Space Dark Mode"}
              aria-label="Toggle Bright / Dark theme"
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                {theme === "dark" ? (
                  <Moon className="w-3.5 h-3.5 text-cyan-400 rotate-0 transition-transform duration-300" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500 rotate-180 transition-transform duration-300" />
                )}
              </div>
              <span className="text-[11px] font-bold tracking-wider uppercase font-mono">
                {theme === "dark" ? "Dark" : "Bright"}
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  theme === "dark" ? "bg-cyan-400" : "bg-amber-500"
                }`}
              />
            </button>

            <button
              onClick={() => setMobileOpen(prev => !prev)}
              className="xl:hidden p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5 dark:border-white/10 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="w-5 h-5 text-indigo-600 dark:text-cyan-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 xl:hidden flex flex-col"
            style={{
              background: theme === "dark" ? "rgba(3, 7, 20, 0.98)" : "rgba(255, 255, 255, 0.98)",
              backdropFilter: "blur(24px)",
            }}
          >
            <div className="flex items-center justify-between px-6 h-[72px] border-b border-slate-200 dark:border-white/10">
              <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
                <span className="text-xl">&#9883;</span>
                <span className="font-orbitron font-bold text-base text-slate-900 dark:text-white">Quantum Lens</span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 border border-slate-200 dark:text-slate-400 dark:hover:text-white dark:border-white/10"
              >
                <X className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <NavLink to="/" end onClick={() => setMobileOpen(false)} className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-center font-medium text-slate-800 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-slate-200 dark:hover:text-white">Home</NavLink>
                <NavLink to="/learn" onClick={() => setMobileOpen(false)} className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-center font-medium text-slate-800 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-slate-200 dark:hover:text-white">Learn Academy</NavLink>
              </div>

              {[
                { key: "labs", label: "Virtual Labs", icon: <FlaskConical className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />, items: labItems },
                { key: "algo", label: "Quantum Algorithms", icon: <Atom className="w-4 h-4 text-purple-600 dark:text-purple-400" />, items: algorithmItems },
                { key: "exp", label: "Physics Experiments", icon: <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />, items: experimentItems },
                { key: "vis", label: "Code Visualizers", icon: <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />, items: visualizerItems },
              ].map(section => (
                <div key={section.key} className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden bg-slate-50/70 dark:bg-white/[0.02]">
                  <button
                    onClick={() => toggleMobileAccordion(section.key)}
                    className="w-full flex items-center justify-between p-4 font-semibold text-slate-800 dark:text-slate-200 text-left"
                  >
                    <span className="flex items-center gap-2">{section.icon}{section.label}</span>
                    <ChevronDown className={"w-4 h-4 transition-transform " + (openAccordion === section.key ? "rotate-180 text-indigo-600 dark:text-cyan-400" : "text-slate-400")} />
                  </button>
                  {openAccordion === section.key && (
                    <div className="p-3 pt-0 flex flex-col gap-1 border-t border-slate-200 dark:border-white/5">
                      {section.items.map(item => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 p-2 rounded-lg text-sm text-slate-700 hover:text-indigo-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5"
                        >
                          {item.icon}
                          <div className="flex-1">
                            <div className="text-xs font-medium">{item.label}</div>
                            {item.desc && <div className="text-[10px] text-slate-500">{item.desc}</div>}
                          </div>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="grid grid-cols-3 gap-2">
                <NavLink to="/explore/hardware" onClick={() => setMobileOpen(false)} className="p-3 rounded-xl bg-white/5 border border-white/10 text-center text-xs font-medium text-slate-300">Hardware</NavLink>
                <NavLink to="/progress" onClick={() => setMobileOpen(false)} className="p-3 rounded-xl bg-white/5 border border-white/10 text-center text-xs font-medium text-slate-300">Progress</NavLink>
                <NavLink to="/instructor" onClick={() => setMobileOpen(false)} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center text-xs font-medium text-amber-300">Instructor</NavLink>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

