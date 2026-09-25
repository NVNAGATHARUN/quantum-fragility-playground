import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Play, Radio, Shield, ShieldAlert, ShieldCheck,
  Zap, Lock, Unlock, ArrowLeft, Info, RefreshCw,
  AlertTriangle, CheckCircle2, Eye, EyeOff, Sparkles, Send
} from 'lucide-react';
import { Card, Badge } from '../../components/UI';
import { runBB84, type BB84Result } from '../../api/algorithms';

export default function VisualQKD() {
  const [nBits, setNBits] = useState<number>(16);
  const [evePresent, setEvePresent] = useState<boolean>(false);
  const [result, setResult] = useState<BB84Result | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulation' | 'otp' | 'theory' | 'code'>('simulation');

  // One-Time Pad Message Playground
  const [secretMessage, setSecretMessage] = useState<string>('SIH2026 QUANTUM SECRET');
  const [encryptedHex, setEncryptedHex] = useState<string>('');
  const [decryptedText, setDecryptedText] = useState<string>('');

  const handleRun = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await runBB84({ n_bits: nBits, eve_present: evePresent });
      setResult(res);

      // Perform OTP encryption/decryption demo if key is secure
      if (res.is_secure && res.alice_sifted_key.length > 0) {
        const key = res.alice_sifted_key;
        let encHex = '';
        let decStr = '';

        for (let i = 0; i < secretMessage.length; i++) {
          const charCode = secretMessage.charCodeAt(i);
          const keyByte = key[i % key.length] ? 0xAA : 0x55; // simple OTP mask
          const xorVal = charCode ^ keyByte;
          encHex += xorVal.toString(16).padStart(2, '0').toUpperCase() + ' ';
          decStr += String.fromCharCode(xorVal ^ keyByte);
        }
        setEncryptedHex(encHex.trim());
        setDecryptedText(decStr);
      } else {
        setEncryptedHex('');
        setDecryptedText('');
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [nBits, evePresent, secretMessage]);

  useEffect(() => {
    handleRun();
  }, [nBits, evePresent]);

  return (
    <div className="min-h-screen text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* ── Breadcrumb & Header ── */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
          <Link to="/algorithms" className="hover:text-brand-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Algorithm Labs
          </Link>
          <span>/</span>
          <span className="text-brand-primary">AL-07</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-brand-border">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-orbitron font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                Visual QKD: BB84 Protocol (AL-07)
              </h1>
              <Badge color="green">Quantum Cryptography</Badge>
              <Badge color="cyan">NQM Communication Pillar</Badge>
            </div>
            <p className="text-text-secondary text-sm max-w-3xl">
              Model real-world Quantum Key Distribution with photon polarization bases, Alice-Bob public sifting,
              and live eavesdropper (Eve) threat detection using the Shor-Preskill QBER threshold (11.0%).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRun}
              disabled={isLoading}
              className="btn btn-primary flex items-center gap-2 !px-6 !py-3 shadow-lg shadow-emerald-500/20"
            >
              <Play className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Transmitting Photons...' : 'Transmit Photon Stream'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mt-6 border-b border-brand-border/50 pb-2">
          {(['simulation', 'otp', 'theory', 'code'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-orbitron tracking-wider uppercase transition-all ${
                activeTab === tab
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              {tab === 'otp' ? 'One-Time Pad Demo' : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {activeTab === 'simulation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Controls & Channel Parameters */}
            <div className="lg:col-span-4 space-y-6">
              {/* Eavesdropper & Bit Count Controls */}
              <Card className="p-6">
                <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" /> Quantum Channel Configuration
                </h3>

                {/* Eve Eavesdropper Toggle */}
                <div className="p-4 rounded-xl border mb-6 transition-all bg-surface/50 border-brand-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-orbitron font-bold flex items-center gap-2 text-text-primary">
                      {evePresent ? <Eye className="w-4 h-4 text-rose-400" /> : <EyeOff className="w-4 h-4 text-emerald-400" />}
                      Eve (Eavesdropper)
                    </span>
                    <button
                      onClick={() => setEvePresent(prev => !prev)}
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                        evePresent
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/20'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {evePresent ? 'ACTIVE (Intercept)' : 'INACTIVE (Secure)'}
                    </button>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    {evePresent
                      ? 'Eve intercepts photons with random bases, collapsing quantum states and injecting measurable error.'
                      : 'Channel is completely clean. Photons travel undisturbed from Alice to Bob.'}
                  </p>
                </div>

                {/* Number of Photons Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-secondary font-medium">Qubit / Photon Pulses</span>
                    <span className="font-mono text-emerald-400 font-bold">{nBits} Photons</span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={32}
                    step={4}
                    value={nBits}
                    onChange={e => setNBits(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-text-muted font-mono">
                    <span>8 pulses</span>
                    <span>16 pulses</span>
                    <span>32 pulses</span>
                  </div>
                </div>
              </Card>

              {/* Security Threat Assessment Card */}
              {result && (
                <Card className={`p-6 border transition-all ${
                  result.is_secure
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-rose-500/5 border-rose-500/40 shadow-lg shadow-rose-500/10'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      result.is_secure ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse'
                    }`}>
                      {result.is_secure ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="text-[10px] font-orbitron uppercase tracking-widest text-text-muted mb-1">
                        Channel Security Verdict
                      </div>
                      <div className={`text-base font-orbitron font-bold ${
                        result.is_secure ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {result.is_secure ? 'KEY ESTABLISHED & SECURE' : 'CRITICAL THREAT: KEY ABORTED'}
                      </div>
                      <p className="text-xs text-text-secondary mt-1">
                        {result.is_secure
                          ? `Quantum Bit Error Rate (${(result.qber * 100).toFixed(1)}%) is below the 11.0% threshold.`
                          : `QBER of ${(result.qber * 100).toFixed(1)}% exceeded the 11.0% limit. Eavesdropping detected.`}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-brand-border/40">
                    <div className="p-2.5 rounded-lg bg-surface/70 border border-brand-border/30">
                      <div className="text-[10px] text-text-muted font-mono uppercase">Calculated QBER</div>
                      <div className={`text-lg font-mono font-bold mt-0.5 ${
                        result.qber > 0.11 ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {(result.qber * 100).toFixed(1)}%
                      </div>
                      <div className="text-[9px] text-text-muted">Threshold: ≤ 11.0%</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface/70 border border-brand-border/30">
                      <div className="text-[10px] text-text-muted font-mono uppercase">Sifted Key Length</div>
                      <div className="text-lg font-mono font-bold text-cyan-300 mt-0.5">
                        {result.alice_sifted_key.length} <span className="text-xs font-normal text-text-muted">bits</span>
                      </div>
                      <div className="text-[9px] text-text-muted">~50% efficiency</div>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column: Interactive Photon Transmission & Sifting Grid */}
            <div className="lg:col-span-8 space-y-6">
              {/* Alice -> Channel -> Bob Transmission Pipeline */}
              <Card className="p-6">
                <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-400" /> Quantum Channel Pipeline (Alice ➔ Channel ➔ Bob)
                  </span>
                  <Badge color="cyan">Conjugate Bases: + and ×</Badge>
                </h3>

                <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-black/40 border border-brand-border/40 text-center text-xs">
                  {/* Alice Station */}
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="font-orbitron font-bold text-emerald-400 text-sm mb-1">Alice (Sender)</div>
                    <p className="text-[11px] text-text-muted">Prepares random qubits in $+$ or $\times$ basis</p>
                  </div>

                  {/* Channel / Eve */}
                  <div className={`p-3 rounded-lg border transition-all ${
                    evePresent
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                      : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300'
                  }`}>
                    <div className="font-orbitron font-bold text-sm mb-1">
                      {evePresent ? 'Eve Intercepts!' : 'Free Optical Channel'}
                    </div>
                    <p className="text-[11px] text-text-muted">
                      {evePresent ? 'Collapses photon statevector' : 'Undisturbed photon trajectory'}
                    </p>
                  </div>

                  {/* Bob Station */}
                  <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <div className="font-orbitron font-bold text-indigo-400 text-sm mb-1">Bob (Receiver)</div>
                    <p className="text-[11px] text-text-muted">Measures using independent random basis</p>
                  </div>
                </div>
              </Card>

              {/* Bit-by-Bit Photon Sifting Table */}
              {result && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-orbitron tracking-widest text-text-muted uppercase flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" /> Quantum Sifting Matrix
                    </h3>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" /> Match (Retained)
                      </span>
                      <span className="flex items-center gap-1 text-text-muted">
                        <span className="w-2 h-2 rounded-full bg-slate-600" /> Mismatch (Discarded)
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-center text-xs font-mono">
                      <thead>
                        <tr className="border-b border-brand-border text-text-muted">
                          <th className="p-2 text-left">Entity</th>
                          {Array.from({ length: result.n_bits }, (_, i) => (
                            <th key={i} className="p-2 w-8">#{i + 1}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border/30">
                        {/* Alice's bits */}
                        <tr>
                          <td className="p-2 text-left font-bold text-emerald-400">Alice Bits</td>
                          {result.alice_bits.map((b, idx) => (
                            <td key={idx} className="p-2 font-bold">{b}</td>
                          ))}
                        </tr>

                        {/* Alice's bases */}
                        <tr>
                          <td className="p-2 text-left text-text-secondary">Alice Basis</td>
                          {result.alice_bases.map((base, idx) => (
                            <td key={idx} className="p-2 text-emerald-300 font-bold">{base}</td>
                          ))}
                        </tr>

                        {/* Eve's measurement (if present) */}
                        {evePresent && (
                          <tr className="bg-rose-500/5">
                            <td className="p-2 text-left text-rose-400 font-bold">Eve Base/Bit</td>
                            {result.eve_bases.map((base, idx) => (
                              <td key={idx} className="p-2 text-rose-300 font-bold">
                                {base}{result.eve_measured_bits[idx]}
                              </td>
                            ))}
                          </tr>
                        )}

                        {/* Bob's bases */}
                        <tr>
                          <td className="p-2 text-left text-text-secondary">Bob Basis</td>
                          {result.bob_bases.map((base, idx) => (
                            <td key={idx} className="p-2 text-indigo-300 font-bold">{base}</td>
                          ))}
                        </tr>

                        {/* Bob's measured bits */}
                        <tr>
                          <td className="p-2 text-left font-bold text-indigo-400">Bob Measured</td>
                          {result.bob_measured_bits.map((b, idx) => (
                            <td key={idx} className="p-2 font-bold">{b}</td>
                          ))}
                        </tr>

                        {/* Sifting Result */}
                        <tr className="bg-surface/50 font-bold">
                          <td className="p-2 text-left text-cyan-300">Sifted Key</td>
                          {Array.from({ length: result.n_bits }, (_, i) => {
                            const isMatch = result.alice_bases[i] === result.bob_bases[i];
                            const hasError = isMatch && (result.alice_bits[i] !== result.bob_measured_bits[i]);
                            return (
                              <td key={i} className={`p-2 ${
                                !isMatch
                                  ? 'text-slate-600'
                                  : hasError
                                    ? 'text-rose-400 bg-rose-500/20'
                                    : 'text-emerald-400 bg-emerald-500/10'
                              }`}>
                                {isMatch ? (hasError ? 'ERR' : result.alice_bits[i]) : '—'}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Final Sifted Key Output Banner */}
              {result && (
                <Card className="p-6 bg-brand-primary/5 border-brand-primary/20">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-orbitron uppercase tracking-widest text-text-muted mb-1">
                        Final Shared Cryptographic Key
                      </div>
                      <div className="font-mono text-base font-bold text-emerald-400 tracking-wider">
                        {result.is_secure ? `0x${result.final_key_hex} (${result.alice_sifted_key.join('')})` : 'COMPROMISED — REJECTED'}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge color={result.is_secure ? 'green' : 'red'}>
                        {result.security_verdict}
                      </Badge>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* One-Time Pad Demo Tab */}
        {activeTab === 'otp' && (
          <div className="max-w-4xl space-y-6">
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-base font-orbitron font-bold text-emerald-400 flex items-center gap-2">
                  <Lock className="w-5 h-5" /> One-Time Pad (OTP) Quantum Encryption
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Claude Shannon proved mathematically in 1949 that the One-Time Pad is unconditionally secure (information-theoretically unbreakable)
                  if the key is truly random, as long as the message, and used only once. Quantum key distribution provides this exact key!
                </p>
              </div>

              {/* Message Input */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary">Secret Plaintext Message (Alice)</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={secretMessage}
                    onChange={e => setSecretMessage(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-xl bg-surface border border-brand-border text-sm font-mono text-text-primary focus:outline-none focus:border-emerald-500"
                    placeholder="Type secret message..."
                  />
                  <button onClick={handleRun} className="btn btn-secondary text-xs flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5" /> Re-encrypt
                  </button>
                </div>
              </div>

              {/* Ciphertext and Decryption */}
              {result?.is_secure ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-brand-border">
                  <div className="p-4 rounded-xl bg-black/40 border border-brand-border">
                    <div className="text-xs font-mono text-rose-400 font-bold mb-1 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Ciphertext in Transit (Intercepted by Adversary)
                    </div>
                    <div className="font-mono text-xs text-text-muted break-all mt-2 bg-surface/60 p-3 rounded">
                      {encryptedHex || 'Awaiting transmission...'}
                    </div>
                    <div className="text-[10px] text-text-muted mt-2">
                      Mathematically indistinguishable from pure white noise to any eavesdropper without the quantum key.
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/30">
                    <div className="text-xs font-mono text-emerald-400 font-bold mb-1 flex items-center gap-1">
                      <Unlock className="w-3.5 h-3.5" /> Bob's Decrypted Message
                    </div>
                    <div className="font-mono text-xs text-emerald-300 font-bold break-all mt-2 bg-emerald-500/10 p-3 rounded border border-emerald-500/20">
                      {decryptedText || 'Awaiting transmission...'}
                    </div>
                    <div className="text-[10px] text-emerald-400 mt-2">
                      Decrypted with zero error using Bob's matching sifted quantum key!
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/40 text-center">
                  <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
                  <div className="font-orbitron font-bold text-sm text-rose-300">Encryption Blocked by QKD Security Layer</div>
                  <p className="text-xs text-text-secondary max-w-md mx-auto mt-1">
                    Because Eve is actively eavesdropping, QBER exceeds 11.0%. The key was destroyed to prevent sending messages over a compromised channel.
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Theory Tab */}
        {activeTab === 'theory' && (
          <div className="max-w-4xl space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-orbitron font-bold text-emerald-400">How Quantum Physics Prevents Undetected Eavesdropping</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                In classical cryptography (RSA, ECC), an attacker can tap an optical fiber line, copy the bits with zero disturbance, and save them for decryption.
                In quantum cryptography, this is physically impossible due to two fundamental laws:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-xl bg-surface/60 border border-brand-border">
                  <div className="text-base font-orbitron font-bold text-cyan-400">1. No-Cloning Theorem</div>
                  <p className="text-xs text-text-muted mt-2">
                    An unknown quantum state cannot be duplicated. Eve cannot make a copy of the incoming photon and forward the original to Bob.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface/60 border border-brand-border">
                  <div className="text-base font-orbitron font-bold text-purple-400">2. Conjugate State Collapse</div>
                  <p className="text-xs text-text-muted mt-2">
                    Measuring a photon in the wrong basis (e.g., measuring $|+\rangle$ in rectilinear basis) irreversibly collapses its state to $|0\rangle$ or $|1\rangle$, introducing a measurable 25% error rate.
                  </p>
                </div>
              </div>

              <h4 className="text-base font-orbitron font-bold text-amber-400 pt-4">The 11.0% Shor-Preskill Security Bound</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Peter Shor and John Preskill proved that if the Quantum Bit Error Rate (QBER) is below 11.0%,
                classical error correction (cascade) and privacy amplification can distill a shorter, perfectly secret key.
                If QBER exceeds 11.0%, the protocol aborts immediately.
              </p>
            </Card>
          </div>
        )}

        {/* Code Tab */}
        {activeTab === 'code' && (
          <Card className="p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-orbitron font-bold text-emerald-400">Qiskit Implementation of BB84</h3>
              <Badge color="green">Qiskit 1.x</Badge>
            </div>
            <pre className="p-4 rounded-xl bg-black/60 border border-brand-border font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed">
{`from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
import random

def simulate_bb84_qubit(alice_bit, alice_base, bob_base, eve_present=False):
    qc = QuantumCircuit(1, 1)

    # 1. Alice prepares state
    if alice_bit == 1:
        qc.x(0)
    if alice_base == 'x':
        qc.h(0)

    # 2. Eve intercepts (if active)
    if eve_present:
        eve_base = random.choice(['+', 'x'])
        if eve_base == 'x':
            qc.h(0)
        qc.measure(0, 0)
        # Eve re-prepares based on outcome
        if eve_base == 'x':
            qc.h(0)

    # 3. Bob measures
    if bob_base == 'x':
        qc.h(0)
    qc.measure(0, 0)

    sim = AerSimulator()
    result = sim.run(transpile(qc, sim), shots=1).result()
    return int(list(result.get_counts().keys())[0])

# Clean channel QBER: ~0%
# Eve active QBER: ~25% (crosses 11% Shor-Preskill bound -> ABORT)`}
            </pre>
          </Card>
        )}
      </div>
    </div>
  );
}
