import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, BookOpen, Cpu, FlaskConical, GitBranch,
  Sun, Moon, ArrowRight, Zap, Shield, Sparkles, X
} from 'lucide-react';
import { useTheme } from '../providers/ThemeProvider';

export interface CommandItem {
  id: string;
  category: 'Concepts' | 'Labs' | 'Algorithms' | 'Hardware' | 'Actions';
  title: string;
  description: string;
  link?: string;
  action?: () => void;
  icon: React.ReactNode;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const commands: CommandItem[] = useMemo(() => [
    // Labs
    {
      id: 'lab-circuit',
      category: 'Labs',
      title: 'Circuit Studio',
      description: 'Professional visual circuit composer with Qiskit Aer simulation and Predict-First UX',
      link: '/lab',
      icon: <FlaskConical className="w-4 h-4 text-blue-500" />,
    },
    {
      id: 'lab-fragility',
      category: 'Labs',
      title: 'Quantum Fragility Lab',
      description: 'Simulate T1 relaxation, T2 dephasing, and Kraus noise channels',
      link: '/fragility-lab',
      icon: <Zap className="w-4 h-4 text-rose-500" />,
    },
    {
      id: 'lab-conflict',
      category: 'Labs',
      title: 'Cognitive Conflict Lab',
      description: 'Targeted ~90s experiment to confront and correct quantum misconceptions',
      link: '/conflict-lab',
      icon: <Sparkles className="w-4 h-4 text-amber-500" />,
    },
    {
      id: 'lab-qc',
      category: 'Labs',
      title: 'Quantum vs Classical',
      description: 'Explore statevectors, Bloch sphere representation, and superposition vs classical bits',
      link: '/quantum-vs-classical',
      icon: <GitBranch className="w-4 h-4 text-indigo-500" />,
    },

    // Algorithms
    {
      id: 'algo-bell',
      category: 'Algorithms',
      title: 'AL-01: Bell State Generation',
      description: 'Create maximally entangled EPR pairs and observe quantum correlations',
      link: '/algorithms/bell-state',
      icon: <GitBranch className="w-4 h-4 text-indigo-500" />,
    },
    {
      id: 'algo-dj',
      category: 'Algorithms',
      title: 'AL-02: Deutsch-Jozsa Algorithm',
      description: 'Constant vs Balanced oracle evaluation in a single query with phase kickback',
      link: '/algorithms/deutsch-jozsa',
      icon: <Zap className="w-4 h-4 text-purple-500" />,
    },
    {
      id: 'algo-grover',
      category: 'Algorithms',
      title: "AL-03: Grover's Search Algorithm",
      description: 'Geometric amplitude amplification in O(√N) iterations',
      link: '/experiments/grover',
      icon: <Search className="w-4 h-4 text-blue-500" />,
    },
    {
      id: 'algo-teleport',
      category: 'Algorithms',
      title: 'AL-04: Quantum Teleportation',
      description: 'Transfer state using entanglement and classical feed-forward correction',
      link: '/algorithms/teleportation',
      icon: <ArrowRight className="w-4 h-4 text-emerald-500" />,
    },
    {
      id: 'algo-qft',
      category: 'Algorithms',
      title: 'AL-05: Quantum Fourier Transform (QFT)',
      description: 'Discrete Fourier transform on quantum state amplitudes with phasor analysis',
      link: '/algorithms/qft',
      icon: <Sparkles className="w-4 h-4 text-cyan-500" />,
    },
    {
      id: 'algo-qkd',
      category: 'Algorithms',
      title: 'AL-07: Visual QKD (BB84)',
      description: 'Quantum Key Distribution with photon pipeline, Eve detection, and OTP encryption',
      link: '/algorithms/qkd',
      icon: <Shield className="w-4 h-4 text-emerald-500" />,
    },
    {
      id: 'algo-network',
      category: 'Algorithms',
      title: 'AL-08: Quantum Network Repeater Lab',
      description: 'Entanglement swapping across long-haul optical fiber with Beer-Lambert attenuation',
      link: '/algorithms/network',
      icon: <Cpu className="w-4 h-4 text-blue-600" />,
    },

    // Concepts
    {
      id: 'concept-qubit',
      category: 'Concepts',
      title: 'The Qubit',
      description: 'Two-level quantum mechanical system represented on the Bloch sphere',
      link: '/learn',
      icon: <BookOpen className="w-4 h-4 text-blue-500" />,
    },
    {
      id: 'concept-h',
      category: 'Concepts',
      title: 'Hadamard Gate (H)',
      description: 'Unitary rotation creating equal superposition: |0⟩ → (|0⟩+|1⟩)/√2',
      link: '/lab',
      icon: <BookOpen className="w-4 h-4 text-indigo-500" />,
    },
    {
      id: 'concept-superposition',
      category: 'Concepts',
      title: 'Superposition & Interference',
      description: 'Complex amplitude addition and phase interference in quantum states',
      link: '/learn',
      icon: <BookOpen className="w-4 h-4 text-purple-500" />,
    },
    {
      id: 'concept-entanglement',
      category: 'Concepts',
      title: 'Entanglement & Bell States',
      description: 'Non-separable bipartite states violating classical local realism (CHSH)',
      link: '/algorithms/bell-state',
      icon: <BookOpen className="w-4 h-4 text-emerald-500" />,
    },

    // Hardware
    {
      id: 'hw-explorer',
      category: 'Hardware',
      title: 'Hardware Explorer',
      description: '3D exploration of dilution refrigerator, microwave control, and transmon QPU',
      link: '/hardware-explorer',
      icon: <Cpu className="w-4 h-4 text-cyan-500" />,
    },
    {
      id: 'hw-mixing',
      category: 'Hardware',
      title: 'Mixing Chamber Stage (15 mK)',
      description: 'Coldest stage using 3He/4He dilution refrigeration to suppress thermal excitations',
      link: '/hardware-explorer',
      icon: <Cpu className="w-4 h-4 text-blue-500" />,
    },

    // Actions
    {
      id: 'action-theme',
      category: 'Actions',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`,
      description: 'Toggle application theme between crisp neutral light and deep lab dark mode',
      action: () => toggleTheme(),
      icon: theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />,
    },
    {
      id: 'action-design',
      category: 'Actions',
      title: 'Design System Reference',
      description: 'Inspect typography, color tokens, gate chips, and interactive components',
      link: '/design-system',
      icon: <Sparkles className="w-4 h-4 text-purple-500" />,
    },
    {
      id: 'action-progress',
      category: 'Actions',
      title: 'Student Progress & Skill Map',
      description: 'View mastery across Qubits, Gates, Superposition, Measurement, and Entanglement',
      link: '/progress',
      icon: <ArrowRight className="w-4 h-4 text-emerald-500" />,
    },
    {
      id: 'action-instructor',
      category: 'Actions',
      title: 'Instructor Dashboard',
      description: 'Classroom mastery heatmaps and student misconception analytics',
      link: '/instructor',
      icon: <ArrowRight className="w-4 h-4 text-slate-500" />,
    },
  ], [theme, toggleTheme]);

  // Filter items based on query
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filtered[selectedIndex];
        if (selected) {
          executeCommand(selected);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filtered]);

  const executeCommand = (item: CommandItem) => {
    onClose();
    if (item.action) {
      item.action();
    } else if (item.link) {
      navigate(item.link);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/40 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: -10 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="relative w-full max-w-2xl bg-surface border border-border-subtle rounded-xl shadow-command overflow-hidden z-10 flex flex-col max-h-[75vh]"
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border-subtle">
          <Search className="w-5 h-5 text-text-muted flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search concepts, labs, algorithms, circuits, hardware... (e.g. Hadamard)"
            className="flex-1 bg-transparent border-0 outline-none text-text-primary placeholder:text-text-muted text-sm font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-text-muted hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-text-muted bg-surface-raised border border-border-subtle rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-border-subtle/40">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-xs font-sans">
              No matching quantum concepts or tools found for "{query}".
            </div>
          ) : (
            <div className="py-1">
              {filtered.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => executeCommand(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-brand/10 dark:bg-brand/15 text-text-primary'
                        : 'hover:bg-surface-raised text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-surface-raised border border-border-subtle flex items-center justify-center flex-shrink-0">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-text-primary truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-raised text-text-muted border border-border-subtle">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-muted truncate mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <ArrowRight className={`w-3.5 h-3.5 flex-shrink-0 transition-opacity ${isSelected ? 'opacity-100 text-brand' : 'opacity-0'}`} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-border-subtle bg-surface-raised/50 flex items-center justify-between text-[11px] text-text-muted font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>Quantum Lens Command Index</span>
        </div>
      </motion.div>
    </div>
  );
}
