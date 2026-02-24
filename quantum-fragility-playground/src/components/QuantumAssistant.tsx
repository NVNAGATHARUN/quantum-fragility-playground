import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = 'user' | 'model';
type Msg = { id: number; role: Role; text: string };

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

const SYSTEM_PROMPT = `You are ARIA (Adaptive Research Intelligence Assistant), the premium AI tutor inside "QFragility" — a high-fidelity virtual quantum computing laboratory.

## About QFragility
QFragility is an interactive browser-based quantum physics education platform with these pages:
1. **Home** (/) — Landing page with animated 3D Bloch sphere demo and module grid.
2. **Fragility Lab** (/fragility-lab) — Control 4 noise channels (Bit Flip, Phase Flip, Amplitude Damping, Depolarizing) in real-time.
3. **Quantum vs Classical** (/quantum-vs-classical) — Side-by-side stability comparison.
4. **Gate Builder** (/gate-builder) — Drag-and-drop quantum circuit builder inspired by IBM Quantum Composer.
5. **Qiskit Visualizer** (/qiskit-visualizer) — Paste Qiskit Python code and visualize circuits.
6. **QASM Visualizer** (/qasm-visualizer) — Paste OpenQASM code and visualize circuits.
7. **Learn** (/learn) — Educational hub with Bloch sphere, decoherence, entanglement, algorithms, and quiz.
8. **Experiments** (/experiments) — Hub with 5 virtual labs:
   - Stern-Gerlach (/experiments/stern-gerlach) — Spin quantization, Born rule.
   - Bell State (/experiments/bell-state) — Entanglement, CHSH inequality.
   - Cavity QED (/experiments/cavity-qed) — Rabi oscillations, Jaynes-Cummings.
   - Deutsch-Jozsa (/experiments/deutsch) — Quantum speedup, phase kickback.
   - Ramsey Interferometry (/experiments/ramsey) — Atomic clocks, T₂ decoherence, fringe patterns.
9. **About** (/about) — Project info and tech stack.

## Your Role
- Friendly, knowledgeable quantum physics tutor.
- Answer ANY quantum physics question: superposition, entanglement, decoherence, Bell's theorem, Rabi oscillations, density matrices, quantum gates, algorithms (Deutsch-Jozsa, Grover, Shor, BB84), error correction, etc.
- Guide users through the website — reference specific routes.
- Use **bold** for key terms, bullet points for lists. Keep answers to 2-3 paragraphs unless asked for more.
- Be enthusiastic! If asked something unrelated, politely redirect to quantum physics.`;


async function callGemini(
    message: string,
    history: Array<{ role: string; parts: string }>,
    onRetryCountdown?: (sec: number) => void,
): Promise<string> {
    if (!GEMINI_KEY) throw new Error('No API key configured — add VITE_GEMINI_API_KEY to .env');

    const contents = [
        ...history.map(h => ({
            role: h.role === 'model' ? 'model' : 'user',
            parts: [{ text: h.parts }],
        })),
        { role: 'user', parts: [{ text: message }] },
    ];

    const body = JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    });

    const attempt = async () => {
        const res = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
        });
        if (res.ok) {
            const data = await res.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response received.';
        }
        const err = await res.json().catch(() => ({}));
        const errMsg: string = err?.error?.message ?? `HTTP ${res.status}`;
        throw { status: res.status, message: errMsg };
    };

    try {
        return await attempt();
    } catch (e: any) {
        if (e?.status !== 429) throw new Error(e?.message ?? 'Unknown error');

        // Parse wait time from error
        const match = e.message?.match(/retry in ([\d.]+)s/i);
        const delaySec = match ? Math.ceil(parseFloat(match[1])) : 60;

        // If delay is very long (>90s) or limit:0 in message, daily quota is gone — don't retry
        if (delaySec > 90 || e.message?.includes('limit: 0')) {
            throw new Error(
                '🚫 Daily API quota exhausted. Your free-tier key has no remaining requests today.\n\n' +
                'Options:\n' +
                '- Wait until tomorrow (quota resets ~midnight PT)\n' +
                '- Get a new key at aistudio.google.com/apikey\n' +
                '- Enable billing on your Google AI project'
            );
        }

        // Short per-minute wait — do exactly one retry
        for (let t = delaySec; t > 0; t--) {
            onRetryCountdown?.(t);
            await new Promise(r => setTimeout(r, 1000));
        }
        onRetryCountdown?.(0);
        return await attempt(); // one retry only
    }
}

// ─── Quick Prompts ────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
    { text: 'What is quantum superposition?', icon: '⟨ψ⟩' },
    { text: 'Guide me through Fragility Lab', icon: '🧪' },
    { text: 'What does the Bloch sphere show?', icon: '🌐' },
    { text: 'Explain Bell State entanglement', icon: '🔗' },
    { text: 'How do I use the Gate Builder?', icon: '🔧' },
    { text: 'What experiments can I run?', icon: '🔬' },
];

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const Icons = {
    atom: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
            <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
            <ellipse cx="12" cy="12" rx="10" ry="4" />
            <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
            <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
        </svg>
    ),
    close: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
    ),
    send: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    mic: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0014 0" strokeLinecap="round" />
            <line x1="12" y1="17" x2="12" y2="22" strokeLinecap="round" />
            <line x1="8" y1="22" x2="16" y2="22" strokeLinecap="round" />
        </svg>
    ),
    micOff: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0014 0" strokeLinecap="round" />
            <line x1="12" y1="17" x2="12" y2="22" strokeLinecap="round" />
            <line x1="8" y1="22" x2="16" y2="22" strokeLinecap="round" />
            <line x1="2" y1="2" x2="22" y2="22" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    ),
    speaker: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
            <path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" strokeLinecap="round" />
        </svg>
    ),
    speakerOff: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
            <line x1="23" y1="9" x2="17" y2="15" strokeLinecap="round" />
            <line x1="17" y1="9" x2="23" y2="15" strokeLinecap="round" />
        </svg>
    ),
    trash: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <polyline points="3 6 5 6 21 6" strokeLinecap="round" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            <path d="M10 11v6M14 11v6" strokeLinecap="round" />
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
        </svg>
    ),
    stop: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
            <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
    ),
};

// ─── Speech helpers ───────────────────────────────────────────────────────────
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

function speak(text: string, onEnd?: () => void) {
    if (!synth) return;
    synth.cancel();
    const clean = text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(/#{1,6}\s/g, '')
        .replace(/[>\-]/g, '')
        .replace(/\n+/g, '. ')
        .slice(0, 800);
    const utt = new SpeechSynthesisUtterance(clean);
    utt.rate = 1.0;
    utt.pitch = 1.0;
    utt.volume = 1;
    const voices = synth.getVoices();
    const preferred =
        voices.find(v => v.lang === 'en-US' && v.name.includes('Natural')) ??
        voices.find(v => v.lang === 'en-US') ??
        voices[0];
    if (preferred) utt.voice = preferred;
    if (onEnd) utt.onend = onEnd;
    synth.speak(utt);
}

function stopSpeaking() {
    synth?.cancel();
}

// ─── Markdown Renderer ───────────────────────────────────────────────────────
function renderMarkdown(text: string): React.ReactNode[] {
    return text.split('\n').map((line, i) => {
        // Headings
        const h3 = line.match(/^###\s+(.*)/);
        if (h3) return <strong key={i} className="block text-[13px] text-cyan-300 mt-2 mb-1">{h3[1]}</strong>;
        const h2 = line.match(/^##\s+(.*)/);
        if (h2) return <strong key={i} className="block text-[14px] text-white mt-2 mb-1">{h2[1]}</strong>;

        // Bullet points
        const bullet = line.match(/^[-*]\s+(.*)/);
        if (bullet) {
            const content = formatInline(bullet[1]);
            return <span key={i} className="block pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-cyan-400">{content}</span>;
        }

        // Regular line
        if (line.trim() === '') return <span key={i} className="block h-2" />;
        return <span key={i} className="block">{formatInline(line)}</span>;
    });
}

function formatInline(text: string): React.ReactNode {
    // Process bold, italic, inline code
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
        // Bold
        const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
        // Inline code
        const codeMatch = remaining.match(/`(.*?)`/);
        // Italic
        const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/);

        let earliest: { match: RegExpMatchArray; type: string } | null = null;

        if (boldMatch && boldMatch.index !== undefined) {
            earliest = { match: boldMatch, type: 'bold' };
        }
        if (codeMatch && codeMatch.index !== undefined) {
            if (!earliest || codeMatch.index < (earliest.match.index ?? Infinity)) {
                earliest = { match: codeMatch, type: 'code' };
            }
        }
        if (italicMatch && italicMatch.index !== undefined) {
            if (!earliest || italicMatch.index < (earliest.match.index ?? Infinity)) {
                earliest = { match: italicMatch, type: 'italic' };
            }
        }

        if (!earliest || earliest.match.index === undefined) {
            parts.push(remaining);
            break;
        }

        const idx = earliest.match.index;
        if (idx > 0) parts.push(remaining.slice(0, idx));

        if (earliest.type === 'bold') {
            parts.push(<strong key={key++} className="text-white font-semibold">{earliest.match[1]}</strong>);
        } else if (earliest.type === 'code') {
            parts.push(
                <code key={key++} className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 text-[11px] font-mono">
                    {earliest.match[1]}
                </code>
            );
        } else {
            parts.push(<em key={key++} className="italic text-white/70">{earliest.match[1]}</em>);
        }

        remaining = remaining.slice(idx + earliest.match[0].length);
    }

    return <>{parts}</>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function QuantumAssistant() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Msg[]>([
        {
            id: 0,
            role: 'model',
            text: "Hello! I'm **ARIA**, your quantum AI tutor. 🌟\n\nI can help you with:\n- **Quantum physics** — superposition, entanglement, decoherence, gates, algorithms\n- **Navigating QFragility** — labs, experiments, visualizers, and more\n\nAsk me anything, or tap a suggestion below to get started!",
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [retryCountdown, setRetryCountdown] = useState(0); // seconds until auto-retry
    const [listening, setListening] = useState(false);
    const [speakingId, setSpeakingId] = useState<number | null>(null);
    const endRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);
    const nextId = useRef(1);

    // Auto-scroll
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 250);
    }, [open]);

    // ── Voice Recognition ──────────────────────────────────────────────────────
    const toggleListening = useCallback(() => {
        if (listening) {
            recognitionRef.current?.stop();
            setListening(false);
            return;
        }

        const SpeechRecognition =
            (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Speech recognition is not supported in this browser. Try Chrome or Edge.');
            return;
        }

        const rec = new SpeechRecognition();
        rec.lang = 'en-US';
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        rec.continuous = false;
        recognitionRef.current = rec;

        rec.onstart = () => setListening(true);
        rec.onend = () => setListening(false);
        rec.onerror = () => setListening(false);
        rec.onresult = (e: any) => {
            const transcript = e.results[0][0].transcript;
            setInput(transcript);
        };
        rec.start();
    }, [listening]);

    // ── Send Message ───────────────────────────────────────────────────────────
    const sendMessage = useCallback(
        async (text?: string) => {
            const msg = (text ?? input).trim();
            if (!msg || loading) return;
            setInput('');
            stopSpeaking();
            setSpeakingId(null);

            const userMsg: Msg = { id: nextId.current++, role: 'user', text: msg };
            setMessages(prev => {
                const updated = [...prev, userMsg];

                // Build history for context (last 20 messages, exclude the welcome msg id=0)
                const history = updated
                    .slice(-20)
                    .filter(m => m.id !== 0)
                    .map(m => ({ role: m.role, parts: m.text }));

                // Call Gemini directly from the browser
                callGemini(msg, history.slice(0, -1), setRetryCountdown)
                    .then(reply => {
                        const botMsg: Msg = { id: nextId.current++, role: 'model', text: reply };
                        setMessages(p => [...p, botMsg]);
                        setRetryCountdown(0);
                        setLoading(false);
                    })
                    .catch((err: Error) => {
                        setMessages(p => [
                            ...p,
                            {
                                id: nextId.current++,
                                role: 'model',
                                text: `⚠️ ${err.message || 'Could not reach the Gemini API. Check your VITE_GEMINI_API_KEY in .env.'}`,
                            },
                        ]);
                        setLoading(false);
                    });

                return updated;
            });
            setLoading(true);
        },
        [input, loading]
    );

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        stopSpeaking();
        setSpeakingId(null);
        setMessages([
            {
                id: nextId.current++,
                role: 'model',
                text: "Chat cleared! ✨ I'm **ARIA**, ready to help. What would you like to explore?",
            },
        ]);
    };

    const toggleSpeak = (msg: Msg) => {
        if (speakingId === msg.id) {
            stopSpeaking();
            setSpeakingId(null);
        } else {
            setSpeakingId(msg.id);
            speak(msg.text, () => setSpeakingId(null));
        }
    };

    // ── Styles ──────────────────────────────────────────────────────────────────
    const panelStyle: React.CSSProperties = {
        height: 580,
        background: 'linear-gradient(170deg, rgba(6,10,23,0.97) 0%, rgba(10,15,32,0.97) 100%)',
        border: '1px solid rgba(34,211,238,0.15)',
        borderRadius: '28px',
        boxShadow:
            '0 0 100px rgba(34,211,238,0.06), 0 40px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
        backdropFilter: 'blur(32px)',
    };

    return (
        <>
            {/* ── Floating Toggle Button ── */}
            <motion.button
                onClick={() => {
                    setOpen(o => !o);
                    stopSpeaking();
                    setSpeakingId(null);
                }}
                className="fixed bottom-24 right-24 z-[2000] w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl"
                style={{
                    background: open
                        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                        : 'linear-gradient(135deg, #22d3ee, #6366f1)',
                    boxShadow: open
                        ? '0 0 40px rgba(239,68,68,0.35), 0 8px 32px rgba(0,0,0,0.5)'
                        : '0 0 40px rgba(34,211,238,0.35), 0 8px 32px rgba(0,0,0,0.5)',
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                title={open ? 'Close ARIA' : 'Open ARIA — Quantum AI Tutor'}
            >
                <AnimatePresence mode="wait">
                    <motion.span
                        key={open ? 'close' : 'atom'}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ duration: 0.3 }}
                        className="text-white"
                    >
                        {open ? Icons.close : Icons.atom}
                    </motion.span>
                </AnimatePresence>
            </motion.button>

            {/* ── Chat Panel ── */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                        className="fixed bottom-[100px] right-24 z-[1999] w-[420px] max-w-[calc(100vw-32px)] flex flex-col"
                        style={panelStyle}
                    >
                        {/* ── Header ── */}
                        <div
                            className="flex items-center justify-between px-20 pt-16 pb-14 flex-shrink-0"
                            style={{
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                background: 'linear-gradient(180deg, rgba(34,211,238,0.04) 0%, transparent 100%)',
                            }}
                        >
                            <div className="flex items-center gap-12">
                                <div className="relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ background: 'linear-gradient(135deg, #22d3ee, #6366f1)' }}>
                                    <span className="text-white text-sm">⚛</span>
                                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2"
                                        style={{ borderColor: '#060a17' }}>
                                        <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
                                    </span>
                                </div>
                                <div>
                                    <div className="font-orbitron font-black text-sm text-white tracking-wider">ARIA</div>
                                    <div className="text-[9px] font-orbitron uppercase tracking-[3px]"
                                        style={{ color: '#22d3ee' }}>
                                        Quantum AI Tutor
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => { stopSpeaking(); setSpeakingId(null); }}
                                    title="Stop speaking"
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/25 hover:text-white/60 hover:bg-white/5 transition-all"
                                >
                                    {Icons.speakerOff}
                                </button>
                                <button
                                    onClick={clearChat}
                                    title="Clear chat"
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/25 hover:text-red-400/70 hover:bg-red-400/5 transition-all"
                                >
                                    {Icons.trash}
                                </button>
                            </div>
                        </div>

                        {/* ── Messages ── */}
                        <div
                            className="flex-1 overflow-y-auto px-16 py-14 flex flex-col gap-10 min-h-0"
                            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(34,211,238,0.15) transparent' }}
                        >
                            {/* Quick prompts (show only initially) */}
                            {messages.length <= 1 && (
                                <div className="flex flex-wrap gap-6 mb-6">
                                    {QUICK_PROMPTS.map(p => (
                                        <button
                                            key={p.text}
                                            onClick={() => sendMessage(p.text)}
                                            className="px-10 py-6 rounded-xl text-[10px] font-medium border transition-all flex items-center gap-6 leading-tight"
                                            style={{
                                                borderColor: 'rgba(99,102,241,0.15)',
                                                color: 'rgba(255,255,255,0.45)',
                                                background: 'rgba(255,255,255,0.02)',
                                            }}
                                            onMouseEnter={e => {
                                                (e.target as HTMLElement).style.borderColor = 'rgba(34,211,238,0.4)';
                                                (e.target as HTMLElement).style.color = '#22d3ee';
                                                (e.target as HTMLElement).style.background = 'rgba(34,211,238,0.06)';
                                            }}
                                            onMouseLeave={e => {
                                                (e.target as HTMLElement).style.borderColor = 'rgba(99,102,241,0.15)';
                                                (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.45)';
                                                (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                                            }}
                                        >
                                            <span className="text-xs">{p.icon}</span>
                                            {p.text}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {messages.map(msg => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-8`}
                                >
                                    {msg.role === 'model' && (
                                        <div
                                            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-1 text-[10px] text-white"
                                            style={{ background: 'linear-gradient(135deg, #22d3ee, #6366f1)' }}
                                        >
                                            ⚛
                                        </div>
                                    )}

                                    <div
                                        className={`max-w-[82%] rounded-2xl px-14 py-10 text-[12px] leading-relaxed relative group ${msg.role === 'user'
                                            ? 'text-white rounded-tr-sm'
                                            : 'text-white/85 rounded-tl-sm'
                                            }`}
                                        style={{
                                            background:
                                                msg.role === 'user'
                                                    ? 'linear-gradient(135deg, rgba(34,211,238,0.18), rgba(99,102,241,0.22))'
                                                    : 'rgba(255,255,255,0.04)',
                                            border: `1px solid ${msg.role === 'user'
                                                ? 'rgba(34,211,238,0.3)'
                                                : 'rgba(255,255,255,0.06)'
                                                }`,
                                        }}
                                    >
                                        {renderMarkdown(msg.text)}

                                        {/* Read-aloud button on ARIA messages */}
                                        {msg.role === 'model' && msg.id !== 0 && (
                                            <button
                                                onClick={() => toggleSpeak(msg)}
                                                className="absolute -bottom-2.5 -right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                                                style={{
                                                    background:
                                                        speakingId === msg.id
                                                            ? 'rgba(34,211,238,0.5)'
                                                            : 'rgba(255,255,255,0.1)',
                                                    border: '1px solid rgba(255,255,255,0.12)',
                                                    color:
                                                        speakingId === msg.id
                                                            ? '#ffffff'
                                                            : 'rgba(255,255,255,0.5)',
                                                }}
                                                title={speakingId === msg.id ? 'Stop reading' : 'Read aloud'}
                                            >
                                                {speakingId === msg.id ? Icons.stop : Icons.speaker}
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Loading / retry-countdown indicator */}
                            {loading && (
                                <div className="flex items-center gap-8">
                                    <div
                                        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] text-white"
                                        style={{ background: 'linear-gradient(135deg,#22d3ee,#6366f1)' }}
                                    >
                                        ⚛
                                    </div>
                                    <div
                                        className="flex items-center gap-[5px] px-14 py-12 rounded-2xl rounded-tl-sm"
                                        style={{
                                            background: retryCountdown > 0 ? 'rgba(251,191,36,0.07)' : 'rgba(255,255,255,0.04)',
                                            border: `1px solid ${retryCountdown > 0 ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.06)'}`,
                                        }}
                                    >
                                        {retryCountdown > 0 ? (
                                            <>
                                                <span className="text-[11px] mr-1">⏳</span>
                                                <span className="text-[11px] font-mono" style={{ color: '#fbbf24' }}>
                                                    Rate limited — retrying in {retryCountdown}s
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                {[0, 1, 2].map(i => (
                                                    <motion.div
                                                        key={i}
                                                        className="w-[6px] h-[6px] rounded-full"
                                                        style={{ background: '#22d3ee' }}
                                                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                                                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
                                                    />
                                                ))}
                                                <span className="text-[10px] text-white/20 ml-6 font-mono">thinking</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div ref={endRef} />
                        </div>

                        {/* ── Input Area ── */}
                        <div
                            className="px-16 pb-14 pt-10 flex-shrink-0"
                            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                        >
                            <div
                                className="flex items-center gap-8 px-12 py-8 rounded-2xl transition-all duration-200"
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${listening
                                        ? 'rgba(239,68,68,0.5)'
                                        : 'rgba(255,255,255,0.08)'
                                        }`,
                                    boxShadow: listening ? '0 0 20px rgba(239,68,68,0.1)' : 'none',
                                }}
                            >
                                {/* Mic button */}
                                <button
                                    onClick={toggleListening}
                                    className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                                    style={{
                                        background: listening
                                            ? 'rgba(239,68,68,0.2)'
                                            : 'rgba(255,255,255,0.05)',
                                        color: listening ? '#ef4444' : 'rgba(255,255,255,0.35)',
                                        border: `1px solid ${listening
                                            ? 'rgba(239,68,68,0.3)'
                                            : 'transparent'
                                            }`,
                                    }}
                                    title={listening ? 'Stop listening' : 'Voice input'}
                                >
                                    {listening ? (
                                        <motion.span
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 0.8, repeat: Infinity }}
                                        >
                                            {Icons.mic}
                                        </motion.span>
                                    ) : (
                                        Icons.mic
                                    )}
                                </button>

                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKey}
                                    placeholder={listening ? '🎙 Listening...' : 'Ask about quantum physics...'}
                                    disabled={loading}
                                    className="flex-1 bg-transparent text-[12px] text-white placeholder:text-white/20 outline-none font-medium"
                                />

                                {/* Send button */}
                                <button
                                    onClick={() => sendMessage()}
                                    disabled={!input.trim() || loading}
                                    className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
                                    style={{
                                        background:
                                            input.trim() && !loading
                                                ? 'linear-gradient(135deg, #22d3ee, #6366f1)'
                                                : 'rgba(255,255,255,0.05)',
                                        opacity: input.trim() && !loading ? 1 : 0.3,
                                        color: 'white',
                                    }}
                                >
                                    {Icons.send}
                                </button>
                            </div>

                            {/* Help text */}
                            <div className="text-[8px] text-white/12 text-center mt-8 font-mono tracking-wider">
                                🎙 Voice Input · 🔊 Read Aloud · 🗑 Clear Chat
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
