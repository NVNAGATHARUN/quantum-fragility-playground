import { useRef, useCallback, useEffect } from 'react';

let globalCtx: AudioContext | null = null;

function getCtx(): AudioContext {
    if (!globalCtx) {
        globalCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return globalCtx;
}

function resume() {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
}

// ─── Low-level primitives ─────────────────────────────────────────────────────

function playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gain = 0.3,
    attack = 0.005,
    decay = 0.1,
    pan = 0
) {
    const ctx = resume();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const panner = ctx.createStereoPanner();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(gain, now + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + attack + decay + duration);

    panner.pan.value = pan;

    osc.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + attack + decay + duration + 0.05);
}

function playNoise(duration: number, gain = 0.12, hipass = 800, pan = 0) {
    const ctx = resume();
    const now = ctx.currentTime;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = hipass;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(gain, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(ctx.destination);

    source.start(now);
    source.stop(now + duration);
}

// ─── Sound presets ────────────────────────────────────────────────────────────

/** Atom emitted from source — short click + low whoosh */
export function soundAtomFire() {
    playNoise(0.08, 0.1, 1200, -0.3);
    playTone(220, 0.05, 'sawtooth', 0.08, 0.003, 0.05);
}

/** Spin-Up detection at screen — clean high ping */
export function soundSpinUp() {
    playTone(880, 0.01, 'sine', 0.25, 0.003, 0.18, 0.5);
    playTone(1320, 0.01, 'sine', 0.12, 0.005, 0.15, 0.5);
}

/** Spin-Down detection at screen — lower ping */
export function soundSpinDown() {
    playTone(440, 0.01, 'sine', 0.25, 0.003, 0.18, 0.5);
    playTone(660, 0.01, 'sine', 0.12, 0.005, 0.15, 0.5);
}

/** Photon emitted into cavity — soft pop */
export function soundPhotonPop() {
    playTone(523, 0.01, 'sine', 0.2, 0.004, 0.12);
    playNoise(0.05, 0.06, 2000);
}

/** Rabi swap peak — resonant hum burst */
export function soundRabiPeak(freq = 440) {
    playTone(freq, 0.06, 'sine', 0.15, 0.01, 0.1);
    playTone(freq * 1.5, 0.04, 'triangle', 0.07, 0.01, 0.08);
}

/** Entangled pair fired — eerie dual-tone sweep */
export function soundEntanglementFire() {
    const ctx = resume();
    const now = ctx.currentTime;

    // Left particle tone
    const oscL = ctx.createOscillator();
    const gainL = ctx.createGain();
    const panL = ctx.createStereoPanner();
    oscL.frequency.setValueAtTime(440, now);
    oscL.frequency.linearRampToValueAtTime(220, now + 0.3);
    oscL.type = 'sine';
    gainL.gain.setValueAtTime(0.2, now);
    gainL.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    panL.pan.value = -0.8;
    oscL.connect(gainL); gainL.connect(panL); panL.connect(ctx.destination);
    oscL.start(now); oscL.stop(now + 0.4);

    // Right particle tone (mirror)
    const oscR = ctx.createOscillator();
    const gainR = ctx.createGain();
    const panR = ctx.createStereoPanner();
    oscR.frequency.setValueAtTime(440, now);
    oscR.frequency.linearRampToValueAtTime(220, now + 0.3);
    oscR.type = 'sine';
    gainR.gain.setValueAtTime(0.2, now);
    gainR.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    panR.pan.value = 0.8;
    oscR.connect(gainR); gainR.connect(panR); panR.connect(ctx.destination);
    oscR.start(now); oscR.stop(now + 0.4);
}

/** Correlation match — satisfying chime */
export function soundCorrelated() {
    playTone(659, 0.01, 'sine', 0.22, 0.005, 0.3);
    playTone(880, 0.01, 'sine', 0.14, 0.008, 0.28);
    playTone(1099, 0.01, 'sine', 0.08, 0.01, 0.25);
}

/** Anti-correlation — dissonant buzz */
export function soundAntiCorrelated() {
    playTone(233, 0.01, 'sawtooth', 0.15, 0.005, 0.2);
    playTone(247, 0.01, 'sawtooth', 0.1, 0.005, 0.18);
}

// ─── Continuous ambient hum (Cavity QED) ─────────────────────────────────────
let humOsc: OscillatorNode | null = null;
let humGain: GainNode | null = null;

export function startCavityHum(freq = 110) {
    stopCavityHum();
    const ctx = resume();
    humOsc = ctx.createOscillator();
    humGain = ctx.createGain();
    humOsc.type = 'sine';
    humOsc.frequency.value = freq;
    humGain.gain.value = 0.04;
    humOsc.connect(humGain);
    humGain.connect(ctx.destination);
    humOsc.start();
}

export function updateCavityHum(freq: number, intensity: number) {
    if (humOsc && humGain) {
        humOsc.frequency.setTargetAtTime(freq, getCtx().currentTime, 0.1);
        humGain.gain.setTargetAtTime(intensity * 0.08, getCtx().currentTime, 0.1);
    }
}

export function stopCavityHum() {
    if (humOsc) { try { humOsc.stop(); } catch (_) { } humOsc = null; }
    if (humGain) { humGain = null; }
}

// ─── Continuous Health Sonification (Fragility Lab) ──────────────────────────
let healthOsc: OscillatorNode | null = null;
let healthNoise: AudioBufferSourceNode | null = null;
let healthOscGain: GainNode | null = null;
let healthNoiseGain: GainNode | null = null;
let healthMasterGain: GainNode | null = null;

export function initHealthSonification() {
    if (healthMasterGain) return;
    const ctx = getCtx();
    healthMasterGain = ctx.createGain();
    healthMasterGain.gain.value = 0; // Quiet by default
    healthMasterGain.connect(ctx.destination);

    // Clean sine
    healthOsc = ctx.createOscillator();
    healthOsc.type = 'sine';
    healthOsc.frequency.value = 440;
    healthOscGain = ctx.createGain();
    healthOscGain.gain.value = 0;
    healthOsc.connect(healthOscGain);
    healthOscGain.connect(healthMasterGain);
    healthOsc.start();

    // Noisy static
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    healthNoise = ctx.createBufferSource();
    healthNoise.buffer = buffer;
    healthNoise.loop = true;
    healthNoiseGain = ctx.createGain();
    healthNoiseGain.gain.value = 0;
    healthNoise.connect(healthNoiseGain);
    healthNoiseGain.connect(healthMasterGain);
    healthNoise.start();
}

export function updateHealthSonification(health: number, enabled: boolean) {
    if (!healthMasterGain) initHealthSonification();
    const ctx = resume(); // Ensure context is resumed
    const now = ctx.currentTime;

    if (!enabled) {
        healthMasterGain?.gain.setTargetAtTime(0, now, 0.1);
        return;
    }

    healthMasterGain?.gain.setTargetAtTime(0.12, now, 0.1);
    const h01 = Math.max(0, Math.min(1, health / 100));

    // Pure state = clean tone
    healthOscGain?.gain.setTargetAtTime(h01 * 0.8, now, 0.1);
    // Mixed state = chaos/noise
    const noiseLevel = Math.pow(1 - h01, 1.5) * 0.5;
    healthNoiseGain?.gain.setTargetAtTime(noiseLevel, now, 0.1);
}

export function stopHealthSonification() {
    healthMasterGain?.gain.setTargetAtTime(0, getCtx().currentTime, 0.1);
}

// ─── React hook ──────────────────────────────────────────────────────────────
export function useSound(enabled = true) {
    const enabledRef = useRef(enabled);
    useEffect(() => { enabledRef.current = enabled; }, [enabled]);

    const play = useCallback((fn: () => void) => {
        if (enabledRef.current) fn();
    }, []);

    // New: Sonification integration
    const updateHealth = useCallback((health: number, audioEnabled: boolean) => {
        if (enabledRef.current) {
            updateHealthSonification(health, audioEnabled);
        } else {
            stopHealthSonification();
        }
    }, []);

    const resumeAudio = useCallback(() => resume(), []);

    return { play, updateHealth, resumeAudio };
}
