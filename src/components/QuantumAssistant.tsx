import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = 'user' | 'model';
type Msg = { id: number; role: Role; text: string };

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


async function callGemini(
    message: string,
    history: Array<{ role: string; parts: string }>,
    currentLocation: string,
    onRetryCountdown?: (sec: number) => void,
): Promise<string> {
    if (!GEMINI_KEY) throw new Error('AI Assistant is currently in demo mode. Please configure your API key to enable live chat.');

    const prompt = SYSTEM_PROMPT.replace('{{LOCATION}}', currentLocation);

    const contents = [
        ...history.map(h => ({
            role: h.role === 'model' ? 'model' : 'user',
            parts: [{ text: h.parts }],
        })),
        { role: 'user', parts: [{ text: message }] },
    ];

    const body = JSON.stringify({
        system_instruction: { parts: [{ text: prompt }] },
        contents,
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }, // Lower heat for stricter focus
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
        const match = e.message?.match(/retry in ([\d.]+)s/i);
        const delaySec = match ? Math.ceil(parseFloat(match[1])) : 60;
        if (delaySec > 90 || e.message?.includes('limit: 0')) {
            throw new Error('🌌 ARIA is resting. The daily quantum compute quota has been reached. Please try again tomorrow or use a different API key.');
        }
        for (let t = delaySec; t > 0; t--) {
            onRetryCountdown?.(t);
            await new Promise(r => setTimeout(r, 1000));
        }
        onRetryCountdown?.(0);
        return await attempt();
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
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Msg[]>([
        { id: 0, role: 'model', text: "Hello! I'm **ARIA**, your dedicated Quantum Tutor. ⚛️\n\nI'm specialized in quantum physics and this website's labs. How can I help you explore the quantum world today?" },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [retryCountdown, setRetryCountdown] = useState(0);
    const [listening, setListening] = useState(false);
    const [autoSpeak, setAutoSpeak] = useState(true);
    const [speakingId, setSpeakingId] = useState<number | null>(null);
    const endRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);
    const nextId = useRef(1);

    const clearChat = useCallback(() => {
        stopSpeaking();
        setSpeakingId(null);
        setMessages([
            { id: 0, role: 'model', text: "Hello! I'm **ARIA**, your dedicated Quantum Tutor. ⚛️\n\nI'm specialized in quantum physics and this website's labs. How can I help you explore the quantum world today?" },
        ]);
        nextId.current = 1;
    }, []);

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

    const sendMessage = useCallback(async (text?: string) => {
        const msg = (text ?? input).trim();
        if (!msg || loading) return;
        setInput('');
        stopSpeaking();
        const userMsg: Msg = { id: nextId.current++, role: 'user', text: msg };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        try {
            const history = messages.slice(-10).map(m => ({ role: m.role, parts: m.text }));
            const reply = await callGemini(msg, history, location.pathname, setRetryCountdown);
            const botMsg: Msg = { id: nextId.current++, role: 'model', text: reply };
            setMessages(p => [...p, botMsg]);
            if (autoSpeak) { setSpeakingId(botMsg.id); speak(reply, () => setSpeakingId(null)); }
        } catch (err: any) {
            setMessages(p => [...p, { id: nextId.current++, role: 'model', text: `⚠️ ${err.message}` }]);
        } finally {
            setLoading(false);
        }
    }, [input, loading, messages, location.pathname, autoSpeak]);

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
                        className="fixed bottom-24 right-24 z-[1999] w-[420px] max-w-[calc(100vw-32px)] flex flex-col rounded-[32px] overflow-hidden"
                        style={{
                            height: 600,
                            background: 'linear-gradient(170deg, rgba(6,10,23,0.98) 0%, rgba(10,15,32,0.98) 100%)',
                            border: '1px solid rgba(34,211,238,0.2)',
                            boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(32px)',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-24 py-24 border-b border-white/10"
                            style={{ background: 'linear-gradient(180deg, rgba(34,211,238,0.08) 0%, transparent 100%)' }}>
                            <div className="flex items-center gap-16">
                                <motion.div
                                    animate={loading ? { scale: [1, 1.1, 1], rotate: [0, 90, 180, 270, 360] } : {}}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="w-14 h-14 rounded-full flex items-center justify-center transition-all bg-gradient-to-br from-cyan-400 to-indigo-600 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                                >
                                    ⚛
                                </motion.div>
                                <div>
                                    <div className="font-orbitron font-black text-white tracking-[0.15em] text-lg leading-none mb-1">ARIA</div>
                                    <div className="text-[10px] font-orbitron text-cyan-400 uppercase tracking-[0.2em] opacity-80 font-bold">Quantum AI Tutor</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                {/* Read Aloud Toggle */}
                                <button
                                    onClick={() => {
                                        setAutoSpeak(!autoSpeak);
                                        if (!autoSpeak) {
                                            // Prime the engine on user gesture
                                            const silence = new SpeechSynthesisUtterance('');
                                            silence.volume = 0;
                                            synth?.speak(silence);
                                        } else {
                                            stopSpeaking();
                                            setSpeakingId(null);
                                        }
                                    }}
                                    title={autoSpeak ? 'Disable Read-Aloud' : 'Enable Read-Aloud'}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border ${autoSpeak ? 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'text-white/30 border-transparent hover:bg-white/5 hover:text-white/60'}`}
                                >
                                    {autoSpeak ? Icons.speaker : Icons.speakerOff}
                                </button>

                                {/* Delete Chat */}
                                <button
                                    onClick={clearChat}
                                    title="Delete Chat History"
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-400/20"
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
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white/30 hover:text-white/80 hover:bg-white/10 transition-all border border-transparent hover:border-white/10 shadow-lg"
                                >
                                    {Icons.close}
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-24 py-20 flex flex-col gap-14">
                            {messages.length <= 1 && (
                                <div className="grid grid-cols-2 gap-8 mb-10">
                                    {QUICK_PROMPTS.map(p => (
                                        <button key={p.text} onClick={() => sendMessage(p.text)} className="text-left p-12 rounded-2xl border border-white/5 bg-white/5 text-[11px] hover:border-cyan-400/30 transition-all">
                                            <span className="block text-lg mb-2">{p.icon}</span>
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
                                    <div className={`max-w-[88%] rounded-[28px] px-20 py-15 text-[14.5px] leading-relaxed shadow-2xl backdrop-blur-xl border ${m.role === 'user'
                                        ? 'bg-gradient-to-br from-cyan-500/20 to-indigo-600/20 border-cyan-500/40 text-white rounded-tr-sm'
                                        : 'bg-white/10 border-white/20 text-white/95 rounded-tl-sm'}`}>
                                        {renderMarkdown(m.text)}
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
