import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { askMentor } from '../api/quantum';
import type { MentorRequestPayload, MentorResponsePayload, CircuitIR, MentorMode } from '../api/quantum';

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = 'user' | 'model';
type Msg = {
    id: number;
    role: Role;
    text: string;
    mode?: string;
    suggestedCircuit?: CircuitIR | null;
    debugFindings?: string[] | null;
    optimizationDeltas?: any | null;
    misconceptionAlert?: string | null;
};

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

const SYSTEM_PROMPT = `You are ARIA (Adaptive Research Intelligence Assistant), the premium AI tutor for the "Quantum Lens" quantum laboratory.

## Your Core Mission
- You are a specialist in **Quantum Physics** and the **Quantum Lens Website**.
- You explain concepts like superposition, entanglement, decoherence, and quantum labs.

## Out-of-Box Guardrail (CRITICAL)
- If a user asks a question UNRELATED to quantum physics or this website (e.g., cooking recipes, sports, general history, programming unrelated to quantum, movies, etc.):
    1. **Gently decline**: "I'm sorry, but that falls outside my specialization in quantum physics."
    2. **Explain your purpose**: "My role is to be your dedicated Quantum AI Tutor, helping you navigate the labs and master the principles of quantum mechanics."
    3. **Redirect**: "I'd be happy to explain how Bit Flips affect qubits in our Fragility Lab or answer any other quantum question you have!"

## Current Context
The user is currently on: {{LOCATION}}. 
- Contextualize your help based on the lab they are viewing.

## Website Overview
- **Home** (/) - Landing page.
- **Fragility Lab** (/fragility-lab) - Noise channel control (Bit Flip, Phase Flip, etc.).
- **Gate Builder** (/gate-builder) - Circuit construction.
- **Experiments** (/experiments) - Stern-Gerlach, Bell State, Cavity QED, Deutsch-Jozsa, Ramsey.

## Personality
- Professional, minimalist, and deeply pedagogical.
- Use **bold** for particles and key terms.
- Prioritize physical intuition (e.g., "Imagine the qubit like a compass...") over complex equations.
- **Strict Rule**: Never mention the terms "Born Rule" or "No Middle Ground" in your explanations; keep the focus on physical results and visual stability.`;

// ─── Quick Prompts ────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
    { text: 'What is quantum superposition?', icon: '⟨ψ⟩', mode: 'socratic' as MentorMode },
    { text: 'Synthesize a 3-qubit GHZ state', icon: '⚡', mode: 'generate' as MentorMode },
    { text: 'Debug potential circuit flaws', icon: '🛠️', mode: 'debug' as MentorMode },
    { text: 'Optimize current circuit depth', icon: '🚀', mode: 'optimize' as MentorMode },
    { text: 'Explain Bell State entanglement', icon: '🔗', mode: 'explain' as MentorMode },
    { text: 'Guide me through Fragility Lab', icon: '🧪', mode: 'hint' as MentorMode },
];

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const Icons = {
    atom: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
            <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
            <ellipse cx="12" cy="12" rx="10" ry="4" />
            <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
            <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
        </svg>
    ),
    close: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
    ),
    send: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-7 h-7">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    mic: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-7 h-7">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0014 0" strokeLinecap="round" />
            <line x1="12" y1="17" x2="12" y2="22" strokeLinecap="round" />
            <line x1="8" y1="22" x2="16" y2="22" strokeLinecap="round" />
        </svg>
    ),
    micOff: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-7 h-7">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0014 0" strokeLinecap="round" />
            <line x1="12" y1="17" x2="12" y2="22" strokeLinecap="round" />
            <line x1="8" y1="22" x2="16" y2="22" strokeLinecap="round" />
            <line x1="2" y1="2" x2="22" y2="22" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
        </svg>
    ),
    speaker: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-7 h-7">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
            <path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" strokeLinecap="round" />
        </svg>
    ),
    speakerOff: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-7 h-7">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
            <line x1="23" y1="9" x2="17" y2="15" strokeLinecap="round" />
            <line x1="17" y1="9" x2="23" y2="15" strokeLinecap="round" />
        </svg>
    ),
    trash: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-7 h-7">
            <polyline points="3 6 5 6 21 6" strokeLinecap="round" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            <path d="M10 11v6M14 11v6" strokeLinecap="round" />
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
        </svg>
    ),
    stop: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
            <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
    ),
};

// ─── Speech helpers ───────────────────────────────────────────────────────────
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

function speak(text: string, onEnd?: () => void) {
    if (!synth) return;
    synth.cancel();
    setTimeout(() => {
        const clean = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/`(.*?)`/g, '$1').replace(/#{1,6}\s/g, '').replace(/[>\-]/g, '').replace(/\n+/g, '. ').slice(0, 1000);
        const utt = new SpeechSynthesisUtterance(clean);
        utt.rate = 1.05;
        const voices = synth.getVoices();
        const preferred = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female')) ?? voices.find(v => v.lang.startsWith('en')) ?? voices[0];
        if (preferred) utt.voice = preferred;
        if (onEnd) utt.onend = onEnd;
        synth.speak(utt);
    }, 50);
}

function stopSpeaking() { synth?.cancel(); }

// ─── Markdown Renderer ───────────────────────────────────────────────────────
function renderMarkdown(text: string): React.ReactNode[] {
    return text.split('\n').map((line, i) => {
        const h3 = line.match(/^###\s+(.*)/);
        if (h3) return <strong key={i} className="block text-[14px] text-cyan-300 font-bold mt-4 mb-2">{h3[1]}</strong>;
        const bullet = line.match(/^[-*]\s+(.*)/);
        if (bullet) return <span key={i} className="block pl-4 relative mb-1.5"><span className="absolute left-0 text-cyan-400">•</span>{formatInline(bullet[1])}</span>;
        if (line.trim() === '') return <span key={i} className="block h-3" />;
        return <span key={i} className="block mb-2">{formatInline(line)}</span>;
    });
}

function formatInline(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;
    while (remaining.length > 0) {
        const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
        const codeMatch = remaining.match(/`(.*?)`/);
        let earliest: { match: RegExpMatchArray; type: string } | null = null;
        if (boldMatch && boldMatch.index !== undefined) earliest = { match: boldMatch, type: 'bold' };
        if (codeMatch && codeMatch.index !== undefined && (!earliest || codeMatch.index < (earliest.match.index ?? Infinity))) earliest = { match: codeMatch, type: 'code' };
        if (!earliest || earliest.match.index === undefined) { parts.push(remaining); break; }
        const idx = earliest.match.index;
        if (idx > 0) parts.push(remaining.slice(0, idx));
        if (earliest.type === 'bold') parts.push(<strong key={key++} className="text-white font-semibold">{earliest.match[1]}</strong>);
        else parts.push(<code key={key++} className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 text-[11px] font-mono">{earliest.match[1]}</code>);
        remaining = remaining.slice(idx + earliest.match[0].length);
    }
    return <>{parts}</>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function QuantumAssistant() {
    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Msg[]>([
        { id: 0, role: 'model', text: "Hello! I'm **ARIA**, your zero-hallucination Quantum AI Tutor. ⚛️\n\nI am grounded directly by our Qiskit Aer simulation engine. You can ask me anything, synthesize verified quantum circuits, debug flaws, or optimize gate depth!" },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [retryCountdown, setRetryCountdown] = useState(0);
    const [listening, setListening] = useState(false);
    const [autoSpeak, setAutoSpeak] = useState(true);
    const [speakingId, setSpeakingId] = useState<number | null>(null);
    const [hintTier, setHintTier] = useState<number>(1);
    const [mentorMode, setMentorMode] = useState<MentorMode>('socratic');
    const endRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);
    const nextId = useRef(1);

    const clearChat = useCallback(() => {
        stopSpeaking();
        setSpeakingId(null);
        setMessages([
            { id: 0, role: 'model', text: "Hello! I'm **ARIA**, your zero-hallucination Quantum AI Tutor. ⚛️\n\nI am grounded directly by our Qiskit Aer simulation engine. You can ask me anything, or toggle our **3-Tier Progressive Hints** (Socratic, Conceptual, or Mathematical) to master quantum algorithms!" },
        ]);
        nextId.current = 1;
    }, []);

    const loadCircuitIntoStudio = useCallback((circuit: CircuitIR) => {
        window.dispatchEvent(new CustomEvent('quantum-lens:load-circuit', { detail: { circuit } }));
        if (!location.pathname.includes('studio') && !location.pathname.includes('gate-builder')) {
            navigate('/labs/studio');
        }
    }, [location.pathname, navigate]);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
    useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 250); }, [open]);

    const toggleListening = useCallback(() => {
        if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
        const SpeechRecognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) { alert('Speech recognition not supported.'); return; }
        const rec = new SpeechRecognition();
        rec.onstart = () => setListening(true);
        rec.onend = () => setListening(false);
        rec.onresult = (e: any) => setInput(e.results[0][0].transcript);
        rec.start();
    }, [listening]);

    const sendMessage = useCallback(async (text?: string, overrideTier?: number, overrideMode?: MentorMode) => {
        const msg = (text ?? input).trim();
        if (!msg || loading) return;
        setInput('');
        stopSpeaking();
        const activeMode = overrideMode ?? mentorMode;
        const userMsg: Msg = { id: nextId.current++, role: 'user', text: msg, mode: activeMode };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        const currentTier = overrideTier ?? hintTier;

        try {
            const history = messages.slice(-8).map(m => ({ role: m.role, text: m.text }));
            const res = await askMentor({
                message: msg,
                mode: activeMode,
                context: {
                    hintTier: currentTier,
                    location: location.pathname,
                    mode: activeMode,
                },
                history,
            });
            const botMsg: Msg = {
                id: nextId.current++,
                role: 'model',
                text: res.reply,
                mode: res.mode,
                suggestedCircuit: res.suggestedCircuit,
                debugFindings: res.debugFindings,
                optimizationDeltas: res.optimizationDeltas,
                misconceptionAlert: res.misconceptionAlert,
            };
            setMessages(p => [...p, botMsg]);
            if (autoSpeak) { setSpeakingId(botMsg.id); speak(res.reply, () => setSpeakingId(null)); }
        } catch (err: any) {
            setMessages(p => [...p, { id: nextId.current++, role: 'model', text: `⚠️ ${err.message}` }]);
        } finally {
            setLoading(false);
        }
    }, [input, loading, messages, location.pathname, autoSpeak, hintTier, mentorMode]);

    return (
        <>
            {/* Floating Toggle */}
            {!open && (
                <motion.button
                    layoutId="assistant-toggle"
                    onClick={() => setOpen(true)}
                    className="fixed bottom-8 right-8 w-18 h-18 rounded-3xl flex items-center justify-center shadow-[0_15px_40px_rgba(0,0,0,0.4)] z-[9999] border border-white/10"
                    style={{ background: 'linear-gradient(135deg, #22d3ee, #6366f1)' }}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {Icons.atom}
                </motion.button>
            )}

            {/* Chat Panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.9 }}
                        className="fixed bottom-24 right-24 z-[1999] w-[450px] max-w-[calc(100vw-32px)] flex flex-col rounded-[32px] overflow-hidden"
                        style={{
                            height: 640,
                            background: 'linear-gradient(170deg, rgba(6,10,23,0.98) 0%, rgba(10,15,32,0.98) 100%)',
                            border: '1px solid rgba(34,211,238,0.2)',
                            boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(32px)',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-24 py-20 border-b border-white/10"
                            style={{ background: 'linear-gradient(180deg, rgba(34,211,238,0.08) 0%, transparent 100%)' }}>
                            <div className="flex items-center gap-14">
                                <motion.div
                                    animate={loading ? { scale: [1, 1.1, 1], rotate: [0, 90, 180, 270, 360] } : {}}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all bg-gradient-to-br from-cyan-400 to-indigo-600 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                                >
                                    ⚛
                                </motion.div>
                                <div>
                                    <div className="font-orbitron font-black text-white tracking-[0.15em] text-base leading-none mb-1">ARIA</div>
                                    <div className="text-[10px] font-orbitron text-cyan-400 uppercase tracking-[0.2em] opacity-80 font-bold">Grounded AI Mentor</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                {/* Read Aloud Toggle */}
                                <button
                                    onClick={() => {
                                        setAutoSpeak(!autoSpeak);
                                        if (!autoSpeak) {
                                            const silence = new SpeechSynthesisUtterance('');
                                            silence.volume = 0;
                                            synth?.speak(silence);
                                        } else {
                                            stopSpeaking();
                                            setSpeakingId(null);
                                        }
                                    }}
                                    title={autoSpeak ? 'Disable Read-Aloud' : 'Enable Read-Aloud'}
                                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all border ${autoSpeak ? 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'text-white/30 border-transparent hover:bg-white/5 hover:text-white/60'}`}
                                >
                                    {autoSpeak ? Icons.speaker : Icons.speakerOff}
                                </button>

                                {/* Delete Chat */}
                                <button
                                    onClick={clearChat}
                                    title="Delete Chat History"
                                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-400/20"
                                >
                                    {Icons.trash}
                                </button>

                                {/* Close */}
                                <button
                                    onClick={() => {
                                        setOpen(false);
                                        stopSpeaking();
                                        setSpeakingId(null);
                                    }}
                                    title="Close Assistant"
                                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white/30 hover:text-white/80 hover:bg-white/10 transition-all border border-transparent hover:border-white/10 shadow-lg"
                                >
                                    {Icons.close}
                                </button>
                            </div>
                        </div>

                        {/* Mode Bar (Phase 11) */}
                        <div className="px-14 py-6 bg-white/[0.03] border-b border-white/10 flex items-center justify-between gap-1 overflow-x-auto">
                            {[
                                { id: 'socratic', label: '💡 Socratic' },
                                { id: 'hint', label: '🔍 Hint' },
                                { id: 'explain', label: '📖 Explain' },
                                { id: 'generate', label: '⚡ Synth' },
                                { id: 'debug', label: '🛠️ Debug' },
                                { id: 'optimize', label: '🚀 Opt' },
                            ].map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setMentorMode(m.id as MentorMode)}
                                    className={`px-6 py-2 rounded-lg text-[9px] font-orbitron whitespace-nowrap transition-all ${
                                        mentorMode === m.id
                                            ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/40 font-bold shadow-glow-primary'
                                            : 'text-white/40 hover:text-white/70 border border-transparent'
                                    }`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        {/* 3-Tier Progressive Hinting Bar (when in Hint mode) */}
                        {mentorMode === 'hint' && (
                            <div className="px-16 py-6 bg-white/5 border-b border-white/10 flex items-center justify-between">
                                <span className="text-[9px] font-orbitron font-bold text-cyan-400 tracking-wider uppercase">
                                    Hint Tier:
                                </span>
                                <div className="flex items-center gap-4">
                                    {[
                                        { tier: 1, label: 'Tier 1: Nudge' },
                                        { tier: 2, label: 'Tier 2: Concept' },
                                        { tier: 3, label: 'Tier 3: Solution' },
                                    ].map(h => (
                                        <button
                                            key={h.tier}
                                            onClick={() => setHintTier(h.tier)}
                                            className={`px-6 py-1.5 rounded text-[9px] font-mono transition-all ${
                                                hintTier === h.tier
                                                    ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 font-bold'
                                                    : 'text-white/40 hover:text-white/80 border border-transparent'
                                            }`}
                                        >
                                            {h.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-20 py-16 flex flex-col gap-12">
                            {messages.length <= 1 && (
                                <div className="grid grid-cols-2 gap-8 mb-6">
                                    {QUICK_PROMPTS.map(p => (
                                        <button
                                            key={p.text}
                                            onClick={() => {
                                                setMentorMode(p.mode);
                                                sendMessage(p.text, undefined, p.mode);
                                            }}
                                            className="text-left p-10 rounded-2xl border border-white/5 bg-white/5 text-[11px] hover:border-cyan-400/30 transition-all"
                                        >
                                            <span className="block text-base mb-1">{p.icon}</span>
                                            {p.text}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {messages.map(m => (
                                <motion.div
                                    key={m.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[90%] rounded-[24px] px-16 py-12 text-[13.5px] leading-relaxed shadow-2xl backdrop-blur-xl border ${m.role === 'user'
                                        ? 'bg-gradient-to-br from-cyan-500/20 to-indigo-600/20 border-cyan-500/40 text-white rounded-tr-sm'
                                        : 'bg-white/10 border-white/20 text-white/95 rounded-tl-sm'}`}>
                                        {renderMarkdown(m.text)}

                                        {/* Misconception Alert Banner */}
                                        {m.misconceptionAlert && (
                                            <div className="mt-3 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2">
                                                <span>⚠️</span>
                                                <span><strong>Alert:</strong> {m.misconceptionAlert}</span>
                                            </div>
                                        )}

                                        {/* Debug findings */}
                                        {m.debugFindings && m.debugFindings.length > 0 && (
                                            <div className="mt-3 p-3 rounded-xl bg-black/40 border border-cyan-400/20 space-y-1 text-xs">
                                                <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                                                    <span>🔍</span>
                                                    <span>Sanity & Quantum Flaws:</span>
                                                </div>
                                                {m.debugFindings.map((f, i) => (
                                                    <div key={i} className="text-white/80 text-[11px] leading-relaxed pl-2">• {f}</div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Suggested Circuit Action Card */}
                                        {m.suggestedCircuit && (
                                            <div className="mt-3 p-3 rounded-xl bg-cyan-950/40 border border-cyan-400/30 space-y-2">
                                                <div className="flex items-center justify-between text-xs text-cyan-300 font-medium">
                                                    <span>Verified Circuit ({m.suggestedCircuit.qubits} Qubits, {m.suggestedCircuit.operations.length} Gates)</span>
                                                    <span className="text-[9px] text-emerald-400 font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">0 Hallucinations</span>
                                                </div>
                                                <div className="font-mono text-[10px] text-white/80 bg-black/40 p-2 rounded truncate">
                                                    {m.suggestedCircuit.operations.map((o: any) => `${o.gate || 'OP'}(${o.targets?.join(',')})`).join(' ─ ')}
                                                </div>
                                                <button
                                                    onClick={() => loadCircuitIntoStudio(m.suggestedCircuit!)}
                                                    className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow hover:opacity-90 transition-opacity"
                                                >
                                                    ⚡ Load into Circuit Studio
                                                </button>
                                            </div>
                                        )}

                                        {/* Optimization Deltas */}
                                        {m.optimizationDeltas && (
                                            <div className="mt-3 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2 text-xs">
                                                <div className="flex items-center justify-between text-emerald-300 font-semibold">
                                                    <span>Gate Reduction Summary</span>
                                                    <span className="font-mono text-emerald-400">-{m.optimizationDeltas.reductionPercent}%</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-[10px] text-white/80 font-mono">
                                                    <div>Gates: {m.optimizationDeltas.originalGateCount} → {m.optimizationDeltas.optimizedGateCount}</div>
                                                    <div>Depth: {m.optimizationDeltas.depthOriginal} → {m.optimizationDeltas.depthOptimized}</div>
                                                </div>
                                                {m.suggestedCircuit && (
                                                    <button
                                                        onClick={() => loadCircuitIntoStudio(m.suggestedCircuit!)}
                                                        className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-200 border border-emerald-500/40 transition-colors"
                                                    >
                                                        ⚡ Apply Optimized Circuit
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            {loading && <div className="text-white/20 text-[10px] uppercase tracking-widest animate-pulse">Thinking...</div>}
                            <div ref={endRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-24 border-t border-white/10" style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <div className={`flex items-center gap-14 bg-white/5 rounded-3xl p-8 border transition-all duration-300 ${listening ? 'border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-white/10 focus-within:border-cyan-400/60 focus-within:shadow-[0_0_20px_rgba(34,211,238,0.15)] shadow-inner'}`}>
                                <button
                                    onClick={toggleListening}
                                    title={listening ? "Stop Listening" : "Voice Input"}
                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${listening ? 'text-red-500 bg-red-500/20 shadow-lg' : 'text-white/40 hover:text-white/70 hover:bg-white/10'}`}
                                >
                                    {Icons.mic}
                                </button>
                                <input
                                    ref={inputRef}
                                    type="text" value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                    placeholder={listening ? "Listening..." : "Ask ARIA about quantum..."}
                                    className="flex-1 bg-transparent border-none outline-none text-white text-[15px] placeholder:text-white/20 font-medium tracking-tight"
                                />
                                <button
                                    onClick={() => sendMessage()}
                                    disabled={!input.trim() || loading}
                                    title="Send Message"
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-xl hover:shadow-cyan-500/40 disabled:opacity-20 disabled:grayscale transition-all transform active:scale-95"
                                >
                                    {Icons.send}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
