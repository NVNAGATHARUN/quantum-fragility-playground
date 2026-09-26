import React, { useState, useCallback, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Search,
  Zap,
  BarChart3,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { Card, Badge } from "../../components/UI";
import { runGrover, type GroverResult } from "../../api/grover";
import {
  ExperimentStatus,
  ResultBanner,
} from "../../components/AlgorithmLabUI";

// ─── Constants ────────────────────────────────────────────────────────────────

const QUBIT_OPTIONS = [2, 3, 4] as const;
type NQubits = (typeof QUBIT_OPTIONS)[number];

function allBinaryStrings(n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < 1 << n; i++) {
    out.push(i.toString(2).padStart(n, "0"));
  }
  return out;
}

function classicalAvgChecks(n: number): number {
  return Math.round((1 << n) / 2);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GroverLab() {
  const [nQubits, setNQubits] = useState<NQubits>(2);
  const [targetState, setTargetState] = useState<string>("11");
  const [shots, setShots] = useState<number>(1024);
  const [result, setResult] = useState<GroverResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [iterationIdx, setIterationIdx] = useState<number>(0);
  const [showMisconception, setShowMisconception] = useState(false);
  const requestSeq = useRef(0);

  useEffect(
    () => () => {
      requestSeq.current += 1;
    },
    [],
  );

  const bases = allBinaryStrings(nQubits);
  const N = 1 << nQubits;

  // Reset target state when qubit count changes
  const handleNQubitsChange = (n: NQubits) => {
    requestSeq.current += 1;
    setNQubits(n);
    setTargetState("0".repeat(n));
    setResult(null);
    setIterationIdx(0);
    setErrorMsg(null);
    setIsLoading(false);
  };

  const toggleTargetBit = (idx: number) => {
    requestSeq.current += 1;
    const arr = targetState.split("");
    arr[idx] = arr[idx] === "0" ? "1" : "0";
    setTargetState(arr.join(""));
    setResult(null);
    setIterationIdx(0);
    setErrorMsg(null);
    setIsLoading(false);
  };

  const handleShotsChange = (value: number) => {
    requestSeq.current += 1;
    setShots(value);
    setResult(null);
    setIterationIdx(0);
    setErrorMsg(null);
    setIsLoading(false);
  };

  const handleRun = useCallback(async () => {
    const seq = ++requestSeq.current;
    setIsLoading(true);
    setErrorMsg(null);
    setResult(null);
    setIterationIdx(0);
    try {
      const res = await runGrover({
        n_qubits: nQubits,
        target_state: targetState,
        shots,
      });
      if (seq === requestSeq.current) {
        setResult(res);
        setIterationIdx(res.optimal_iterations); // show final iteration by default
      }
    } catch (e: any) {
      if (seq === requestSeq.current)
        setErrorMsg(e.message ?? "Simulation failed");
    } finally {
      if (seq === requestSeq.current) setIsLoading(false);
    }
  }, [nQubits, targetState, shots]);

  // Current iteration snapshot for visualization
  const snapshot = result?.amplitude_snapshots[iterationIdx] ?? null;
  const maxProb = snapshot
    ? Math.max(...snapshot.map((a) => a.probability))
    : 1;

  return (
    <div className="algorithm-lab al-grover min-h-screen bg-[#070b14] text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto mb-6 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
          <Link
            to="/explore/algorithms"
            className="hover:text-cyan-400 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Algorithm Labs
          </Link>
          <span>/</span>
          <span className="text-cyan-400">AL-03</span>
        </div>

        <div className="al-header-main flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="al-title-line flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-orbitron font-bold tracking-wide bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Grover's Search Lab (AL-03)
              </h1>
              <Badge color="purple">Amplitude Amplification</Badge>
              <Badge color="cyan">Qiskit Aer</Badge>
            </div>
            <p className="text-slate-400 text-sm max-w-2xl">
              Watch how Grover's oracle and diffusion operator geometrically
              amplify the target state's amplitude — proving this is{" "}
              <span className="text-violet-300 font-semibold">
                NOT brute-force
              </span>{" "}
              search but a quadratic speedup through interference.
            </p>
          </div>
          <div className="al-header-actions">
            <button
              onClick={handleRun}
              disabled={isLoading}
              className="btn btn-primary"
            >
              <Play size={15} />{" "}
              {isLoading
                ? "Running…"
                : result
                  ? "Run again"
                  : "Run Grover's search"}
            </button>
            <button
              onClick={() => setShowMisconception((m) => !m)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs bg-amber-900/30 hover:bg-amber-900/50 border border-amber-500/40 text-amber-300 rounded-lg transition-all flex-shrink-0"
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Misconception M06
            </button>
          </div>
        </div>

        {/* M06 Misconception Panel */}
        <AnimatePresence>
          {showMisconception && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 p-4 bg-amber-950/40 border border-amber-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-200 font-semibold text-sm mb-1">
                      Common Misconception M06: "Grover works by brute-force
                      checking all answers simultaneously"
                    </p>
                    <p className="text-amber-100/70 text-xs leading-relaxed">
                      This is incorrect. Grover's algorithm does not evaluate
                      all {N} possibilities in parallel. Instead, it uses a{" "}
                      <strong>phase-flip oracle</strong> to mark the target,
                      then applies a<strong> diffusion operator</strong> that
                      reflects all amplitudes about their mean — geometrically{" "}
                      <em>rotating</em> the quantum state toward the target in
                      ~√{N} steps. The bar chart below makes the amplitude
                      rotation visible at each iteration.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="max-w-7xl mx-auto">
        <ExperimentStatus
          loading={isLoading}
          error={errorMsg}
          complete={!!result}
          detail={
            result
              ? `${Object.values(result.counts).reduce((a, b) => a + b, 0)} Qiskit Aer shots · ${result.optimal_iterations} oracle–diffusion cycles`
              : undefined
          }
        />
        {result && (
          <ResultBanner
            label="Amplitude amplification"
            value={`|${result.target_state}⟩ → ${((result.final_probabilities[result.target_state] ?? 0) * 100).toFixed(1)}%`}
            detail={`From ${(100 / N).toFixed(1)}% initially to the target after ${result.optimal_iterations} Grover cycles.`}
          >
            <aside>
              Measured target
              <br />
              {result.counts[result.target_state] ?? 0} /{" "}
              {Object.values(result.counts).reduce((a, b) => a + b, 0)} shots
            </aside>
          </ResultBanner>
        )}
        <div className="al-layout grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ─── Left: Controls ─────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-5">
            {/* Qubit count */}
            <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                1. Search Space
              </h2>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {QUBIT_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => handleNQubitsChange(n)}
                    className={`py-2.5 rounded-lg border text-xs font-orbitron font-bold transition-all ${
                      nQubits === n
                        ? "border-violet-500 bg-violet-500/20 text-violet-200"
                        : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    {n}q / N={1 << n}
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Classical avg:{" "}
                <span className="text-slate-300">
                  {classicalAvgChecks(nQubits)} queries
                </span>
                <br />
                Grover:{" "}
                <span className="text-violet-300 font-semibold">
                  ~√{N} ≈ {Math.round(Math.sqrt(N))} iterations
                </span>
              </div>
            </Card>

            {/* Target state */}
            <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                2. Target State |{targetState}⟩
              </h2>
              <p className="text-[11px] text-slate-500 mb-3">
                Toggle bits to pick which state to search for:
              </p>
              <div className="flex gap-2 flex-wrap mb-3">
                {targetState.split("").map((bit, i) => (
                  <button
                    key={i}
                    onClick={() => toggleTargetBit(i)}
                    className={`w-10 h-10 rounded-lg border font-orbitron text-base font-bold transition-all ${
                      bit === "1"
                        ? "border-violet-500 bg-violet-500/25 text-violet-200"
                        : "border-slate-700 bg-slate-800/50 text-slate-500 hover:border-slate-600"
                    }`}
                  >
                    {bit}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                q<sub>0</sub> (left) → q<sub>{nQubits - 1}</sub> (right)
              </p>
            </Card>

            {/* Shots */}
            <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                3. Shots
              </h2>
              <div className="flex gap-2">
                {[256, 1024, 2048].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleShotsChange(s)}
                    className={`flex-1 py-2 rounded-lg border text-xs font-mono transition-all ${
                      shots === s
                        ? "border-cyan-500 bg-cyan-500/15 text-cyan-200"
                        : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* ─── Center: Amplitude Visualization ────────────────────────── */}
          <div className="lg:col-span-9 space-y-5">
            {/* Pre-run explainer */}
            {!result && !isLoading && (
              <Card className="p-8 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                <div className="text-center max-w-xl mx-auto">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-violet-900/40 border border-violet-500/30 flex items-center justify-center">
                    <Search className="w-8 h-8 text-violet-400" />
                  </div>
                  <h2 className="text-lg font-orbitron font-bold text-slate-200 mb-3">
                    Grover's Amplitude Amplification
                  </h2>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    Configure your search space above and click Run. The
                    algorithm will iterate the
                    <strong className="text-violet-300">
                      {" "}
                      Oracle → Diffusion
                    </strong>{" "}
                    cycle
                    <strong className="text-cyan-300"> ⌊π/4·√N⌋</strong> times,
                    each time rotating the state vector closer to the target.
                    Watch the bars animate to see amplitude amplification
                    happening in real time.
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {[
                      {
                        label: "Search Space",
                        val: `N = ${N} states`,
                        color: "text-slate-300",
                      },
                      {
                        label: "Grover Iterations",
                        val: `k = ${Math.max(1, Math.floor((Math.PI / 4) * Math.sqrt(N)))}`,
                        color: "text-violet-300",
                      },
                      {
                        label: "Classical Avg",
                        val: `${classicalAvgChecks(nQubits)} queries`,
                        color: "text-red-400",
                      },
                    ].map(({ label, val, color }) => (
                      <div
                        key={label}
                        className="p-3 rounded-lg bg-slate-800/60 border border-slate-700"
                      >
                        <div
                          className={`text-lg font-orbitron font-bold ${color}`}
                        >
                          {val}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* ─── Amplitude Bar Chart ─── */}
            {result && snapshot && (
              <Card className="p-5 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                <div className="al-flow" aria-label="Grover iteration timeline">
                  <button
                    className={iterationIdx === 0 ? "is-active" : ""}
                    aria-pressed={iterationIdx === 0}
                    onClick={() => setIterationIdx(0)}
                  >
                    Equal superposition
                  </button>
                  {Array.from(
                    { length: result.optimal_iterations },
                    (_, index) => (
                      <button
                        key={index}
                        className={
                          iterationIdx === index + 1 ? "is-active" : ""
                        }
                        aria-pressed={iterationIdx === index + 1}
                        onClick={() => setIterationIdx(index + 1)}
                      >
                        Oracle → Diffusion {index + 1}
                      </button>
                    ),
                  )}
                  <span>Measure</span>
                </div>
                {/* Iteration Controls */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-violet-400" />
                      Amplitude Snapshot — Iteration {iterationIdx}
                      {iterationIdx === 0 && (
                        <span className="text-xs text-slate-500">
                          (After H⊗n initialization)
                        </span>
                      )}
                      {iterationIdx > 0 &&
                        iterationIdx < result.optimal_iterations && (
                          <span className="text-xs text-cyan-400">
                            ({iterationIdx} Grover cycle
                            {iterationIdx > 1 ? "s" : ""})
                          </span>
                        )}
                      {iterationIdx === result.optimal_iterations && (
                        <span className="text-xs text-green-400">
                          (Optimal — ready to measure)
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Each bar = probability amplitude² for that basis state
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIterationIdx((i) => Math.max(0, i - 1))}
                      disabled={iterationIdx === 0}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 disabled:opacity-40 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono text-slate-400 w-16 text-center">
                      {iterationIdx} / {result.optimal_iterations}
                    </span>
                    <button
                      onClick={() =>
                        setIterationIdx((i) =>
                          Math.min(result.optimal_iterations, i + 1),
                        )
                      }
                      disabled={iterationIdx === result.optimal_iterations}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 disabled:opacity-40 transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    {/* Play through all iterations */}
                    <button
                      onClick={() => {
                        setIterationIdx(0);
                        const timer = setInterval(() => {
                          setIterationIdx((prev) => {
                            if (prev >= result.optimal_iterations) {
                              clearInterval(timer);
                              return prev;
                            }
                            return prev + 1;
                          });
                        }, 900);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-900/40 hover:bg-violet-900/60 border border-violet-500/40 text-violet-300 text-xs font-semibold transition-all"
                    >
                      <Play className="w-3 h-3 fill-violet-300" />
                      Animate
                    </button>
                  </div>
                </div>

                {/* Bars */}
                <div className="al-amplitude-scroll">
                  <div className="al-amplitude-chart flex items-end gap-1.5 h-48 px-2">
                    {snapshot.map((amp) => {
                      const isTarget = amp.basis === result.target_state;
                      const heightPct =
                        maxProb > 0 ? (amp.probability / maxProb) * 100 : 0;
                      return (
                        <div
                          key={amp.basis}
                          className="flex flex-col items-center flex-1 h-full justify-end gap-1"
                        >
                          <span
                            className={`text-[9px] font-mono font-bold ${isTarget ? "text-violet-300" : "text-slate-500"}`}
                          >
                            {(amp.probability * 100).toFixed(1)}%
                          </span>
                          <motion.div
                            layout
                            animate={{ height: `${heightPct}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className={`w-full rounded-t-md ${
                              isTarget
                                ? "bg-gradient-to-t from-violet-600 to-violet-400 shadow-lg shadow-violet-500/30"
                                : "bg-gradient-to-t from-slate-700 to-slate-600"
                            }`}
                            style={{ minHeight: 2 }}
                          />
                          <span
                            className={`text-[9px] font-mono ${isTarget ? "text-violet-300 font-bold" : "text-slate-600"}`}
                          >
                            |{amp.basis}⟩{isTarget && " ✓"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mean line indicator */}
                <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
                  <div className="w-6 h-0.5 bg-cyan-500/60 border-dashed border-t border-cyan-500" />
                  <span>
                    Diffusion operator reflects all amplitudes about their mean
                    — boosting target, suppressing others
                  </span>
                </div>
              </Card>
            )}

            {/* ─── Shot Histogram ─── */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-5 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                  <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    Qiskit Aer Shot Results — {shots} Shots
                    <Badge color="green">Verified</Badge>
                  </h2>
                  <div className="space-y-2">
                    {Object.entries(result.counts)
                      .sort(([, a], [, b]) => b - a)
                      .map(([basis, count]) => {
                        const pct = count / shots;
                        const isTarget = basis === result.target_state;
                        return (
                          <div key={basis} className="flex items-center gap-3">
                            <span
                              className={`font-mono text-xs w-14 text-right ${isTarget ? "text-violet-300 font-bold" : "text-slate-500"}`}
                            >
                              |{basis}⟩
                            </span>
                            <div className="flex-1 h-5 bg-slate-800 rounded-md overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct * 100}%` }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className={`h-full rounded-md ${
                                  isTarget
                                    ? "bg-gradient-to-r from-violet-600 to-cyan-500"
                                    : "bg-slate-600"
                                }`}
                              />
                            </div>
                            <span
                              className={`font-mono text-xs w-14 ${isTarget ? "text-violet-300 font-bold" : "text-slate-500"}`}
                            >
                              {count} ({(pct * 100).toFixed(1)}%)
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* ─── Pedagogy Explanation ─── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-5 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
                  <Info className="w-4 h-4 text-cyan-400" />
                  How Grover's Algorithm Works
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {[
                    {
                      step: "① Oracle",
                      color: "border-violet-500/40 bg-violet-950/30",
                      titleColor: "text-violet-300",
                      content: `The phase-flip oracle marks the target state |${targetState}⟩ with a phase of −1. This doesn't change probabilities (all still equal), but "tags" the target in phase space. Classically, this is equivalent to checking one item.`,
                    },
                    {
                      step: "② Diffusion",
                      color: "border-cyan-500/40 bg-cyan-950/30",
                      titleColor: "text-cyan-300",
                      content: `The Grover diffusion operator (2|ψ⟩⟨ψ| − I) reflects all amplitudes about their mean. Since the target has a negative phase, reflection boosts it above the mean while all others drop below. This is NOT parallel evaluation — it's geometric rotation.`,
                    },
                    {
                      step: "③ Iterate",
                      color: "border-green-500/40 bg-green-950/30",
                      titleColor: "text-green-300",
                      content: `After ⌊π/4·√N⌋ = ${result?.optimal_iterations ?? Math.max(1, Math.floor((Math.PI / 4) * Math.sqrt(N)))} iterations, the state has rotated nearly to |${targetState}⟩. Measuring yields the target with probability ${result ? ((result.final_probabilities[result.target_state] ?? 0) * 100).toFixed(1) : "~"}%. Quadratic speedup over classical O(N) search.`,
                    },
                  ].map(({ step, color, titleColor, content }) => (
                    <div
                      key={step}
                      className={`p-3 rounded-xl border ${color}`}
                    >
                      <p
                        className={`font-orbitron font-bold text-sm mb-2 ${titleColor}`}
                      >
                        {step}
                      </p>
                      <p className="text-slate-400 leading-relaxed">
                        {content}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
