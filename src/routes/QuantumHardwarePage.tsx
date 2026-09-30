/**
 * QuantumHardwarePage.tsx
 * QuantumLens Interactive 3D Model & Quantum Hardware Atlas
 *
 * Recreates the exact visual layout, mechanics, styling, and educational depth
 * of the official Bluefors LDsl interactive 3D model (ldsl-system.bluefors.com):
 * - Top-left iconic "QUANTUMLENS 3d computer model" branding
 * - Top-right "Dilution Cryostat Architecture" header & quick 300K flange focus
 * - Bottom-left "< BACK" link navigation
 * - Bottom-right viewport action icons (Camera Reset & Fullscreen toggle)
 * - Floating right-hand informational card with dual pill tabs:
 *     [Components] (orange #c85a17 active pill)
 *     [Description] (Bluefors blue #0066cc active pill)
 *     Collapse/Expand toggle so the 3D model is never obscured
 * - Pure white description card with verbatim Bluefors LDsl descriptions and orange scrollbar
 * - Interactive 10-stage component list with live 3D camera focusing and Bluefors blue highlighting
 * - Advanced features:
 *     * Exploded view slider (0–100%)
 *     * Cinematic Quantum Signal Tracing with Dynamic Chase Cam & Real-Time Telemetry HUD
 *     * POV Director: Dynamic Chase Cam, Stage Macro, Hero Wide, Free Orbit
 *     * Full Room Temperature Flange reference view matching ldsl-system.bluefors.com/room-temperature-flange
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import CryostatScene, { type SignalPovMode } from "../components/CryostatScene";
import {
  HARDWARE_COMPONENTS,
  COMPONENT_ALIASES,
} from "../lib/hardware-components";
import { SIGNAL_FLOW_STEPS } from "../lib/signal-flow";

export default function QuantumHardwarePage() {
  const [selectedId, setSelectedId] = useState<string>("vacuum-enclosure-and-radiation-shields");
  const [activeTab, setActiveTab] = useState<"components" | "description">("description");
  const [cardCollapsed, setCardCollapsed] = useState(false);
  const [hiddenIds] = useState<Set<string>>(new Set());
  const [explodeFactor, setExplodeFactor] = useState(0);
  const [showLabels] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isolated, setIsolated] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showToolsDrawer, setShowToolsDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string; temp?: string } | null>(null);

  // Signal Tracing state
  const [signalTracingActive, setSignalTracingActive] = useState(false);
  const [signalStepIndex, setSignalStepIndex] = useState(0);
  const [signalProgress, setSignalProgress] = useState(0);
  const [signalPlaying, setSignalPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<0.5 | 1 | 1.5 | 2>(1);
  const [signalPovMode, setSignalPovMode] = useState<SignalPovMode>("chase");

  const signalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const signalProgressRef = useRef(0);
  const tourRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [tourRunning, setTourRunning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resolved selected component
  const canonicalSelectedId = COMPONENT_ALIASES[selectedId] ?? selectedId;
  const currentComponent = HARDWARE_COMPONENTS.find((c) => c.id === canonicalSelectedId) || HARDWARE_COMPONENTS[0];

  // Filtered components for the "Components" tab
  const filteredComponents = searchQuery.trim()
    ? HARDWARE_COMPONENTS.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.temperature?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : HARDWARE_COMPONENTS;

  /* Handle manual selection */
  const handleSelectComponent = useCallback((id: string) => {
    const canonical = COMPONENT_ALIASES[id] ?? id;
    setSelectedId(canonical);
    setIsolated(false);
    setActiveTab("description");
    setCardCollapsed(false); // auto-expand card when user selects a component
    if (tourRunning && tourRef.current) {
      clearInterval(tourRef.current);
      setTourRunning(false);
    }
  }, [tourRunning]);

  /* Reset View */
  const resetView = useCallback(() => {
    setSelectedId("");
    setActiveTab("description");
    setIsolated(false);
    setExplodeFactor(0);
    if (tourRunning && tourRef.current) {
      clearInterval(tourRef.current);
      setTourRunning(false);
    }
    if (signalTracingActive) {
      setSignalTracingActive(false);
      setSignalPlaying(false);
    }
  }, [tourRunning, signalTracingActive]);

  /* Focus specifically on Room Temperature Flange (Bluefors reference) */
  const focusRoomTempFlange = useCallback(() => {
    handleSelectComponent("room-temperature-flange");
  }, [handleSelectComponent]);

  /* Toggle Fullscreen */
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  /* Explode Tour */
  const startTour = useCallback(() => {
    if (tourRunning) {
      if (tourRef.current) clearInterval(tourRef.current);
      setTourRunning(false);
      return;
    }
    setTourRunning(true);
    let current = 0;
    const steps = 180;
    const duration = 6000;
    const interval = duration / steps;
    tourRef.current = setInterval(() => {
      current += 1;
      const t = current / steps;
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setExplodeFactor(eased);
      if (current >= steps) {
        if (tourRef.current) clearInterval(tourRef.current);
        setTourRunning(false);
        setExplodeFactor(1);
      }
    }, interval);
  }, [tourRunning]);

  /* Signal tracing animation loop */
  useEffect(() => {
    if (!signalTracingActive || !signalPlaying) {
      if (signalTimerRef.current) clearInterval(signalTimerRef.current);
      return;
    }
    const stepDurationMs = 2400 / playbackSpeed;
    const tickMs = 25;
    const increment = tickMs / stepDurationMs;

    signalTimerRef.current = setInterval(() => {
      signalProgressRef.current += increment;
      if (signalProgressRef.current >= 1.0) {
        signalProgressRef.current = 0;
        setSignalStepIndex((prev) => {
          const next = prev + 1;
          if (next >= SIGNAL_FLOW_STEPS.length) {
            setSignalPlaying(false);
            return 0;
          }
          const nextComp = SIGNAL_FLOW_STEPS[next].componentId;
          setSelectedId(COMPONENT_ALIASES[nextComp] ?? nextComp);
          return next;
        });
      }
      setSignalProgress(signalProgressRef.current);
    }, tickMs);

    return () => {
      if (signalTimerRef.current) clearInterval(signalTimerRef.current);
    };
  }, [signalPlaying, signalTracingActive, playbackSpeed]);

  const activeSignalStep = signalTracingActive ? SIGNAL_FLOW_STEPS[signalStepIndex] ?? null : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden select-none text-white font-sans"
      style={{
        background: "radial-gradient(ellipse at 42% 50%, #15181d 0%, #0e1013 70%, #070809 100%)",
      }}
    >
      {/* ── Top Bar ── */}
      <div className="absolute top-4 left-6 right-6 z-30 flex items-center justify-between pointer-events-none">
        {/* Brand */}
        <div className="flex items-center gap-2.5 pointer-events-auto bg-[#14171c]/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 shadow-lg">
          <span className="w-3 h-3 rounded-full border-2 border-[#00c2ff] inline-block shadow-[0_0_10px_rgba(0,194,255,0.7)]" />
          <span className="text-white text-base font-black tracking-[0.16em] uppercase flex items-center gap-2">
            QUANTUMLENS
            <span className="text-[#00c2ff] text-[11px] font-semibold tracking-normal lowercase border-l border-slate-700 pl-2 font-mono hidden sm:inline">
              3d dilution model
            </span>
          </span>
        </div>

        {/* Quick Flange Focus */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={focusRoomTempFlange}
            title="Focus on Room Temperature Flange (ldsl-system.bluefors.com reference)"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#14171c]/90 hover:bg-[#1e2329] border border-cyan-500/40 hover:border-cyan-400 text-xs font-semibold text-cyan-300 transition-all shadow-lg active:scale-95"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Room Temp Flange (~300 K)</span>
          </button>
        </div>
      </div>

      {/* ── Main 3D Interactive Canvas ── */}
      <div className="absolute inset-0 z-0">
        <CryostatScene
          selectedId={selectedId}
          hiddenIds={hiddenIds}
          explodeFactor={explodeFactor}
          showLabels={showLabels}
          autoRotate={autoRotate}
          isolated={isolated}
          activeSignalStep={activeSignalStep}
          signalProgress={signalProgress}
          signalPovMode={signalPovMode}
          onSelectComponent={handleSelectComponent}
          onHover={setTooltip}
          onResetViewRequest={resetView}
        />
      </div>

      {/* ── Hover Tooltip ── */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-y-full px-3 py-1.5 rounded-md bg-[#111317]/95 text-white text-xs border border-white/20 shadow-2xl backdrop-blur-md transition-opacity duration-75 flex items-center gap-2"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#0066cc]" />
          <span className="font-semibold tracking-wide">{tooltip.name}</span>
          {tooltip.temp && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
              {tooltip.temp}
            </span>
          )}
        </div>
      )}

      {/* ── Floating Right-Hand Card (Exact Bluefors LDsl styling) ── */}
      {cardCollapsed ? (
        <button
          onClick={() => setCardCollapsed(false)}
          className="absolute top-[68px] right-6 z-30 px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-2xl flex items-center gap-2 border border-slate-300 hover:bg-slate-100 transition-all pointer-events-auto"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#0066cc]" />
          <span>Show Component Info</span>
          <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ) : (
        <div
          className="absolute top-[68px] right-6 z-30 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col pointer-events-auto border border-black/15 transition-all duration-300"
          style={{
            width: "390px",
            maxWidth: "calc(100vw - 36px)",
            height: "calc(100vh - 160px)",
            maxHeight: "720px",
            backgroundColor: "#ffffff",
          }}
        >
          {/* Top Dual Pill Tabs (Active orange #c85a17 or active blue #0066cc) + Minimize button */}
          <div className="flex items-center bg-[#f1f2f4] p-1.5 border-b border-[#e2e4e8] select-none gap-1.5">
            <button
              onClick={() => setActiveTab("components")}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                activeTab === "components"
                  ? "bg-[#c85a17] text-white shadow-sm"
                  : "text-slate-600 hover:text-black hover:bg-black/5"
              }`}
            >
              Components
            </button>
            <button
              onClick={() => setActiveTab("description")}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                activeTab === "description"
                  ? "bg-[#0066cc] text-white shadow-sm"
                  : "text-slate-600 hover:text-black hover:bg-black/5"
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setCardCollapsed(true)}
              title="Minimize panel"
              className="w-7 h-7 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-black/5 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tab 1: Components List */}
          {activeTab === "components" && (
            <div className="flex-1 flex flex-col min-h-0 bg-white text-slate-800">
              {/* Search filter */}
              <div className="p-3 border-b border-slate-150">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stages, temperatures..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0066cc] text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Scrollable list of 10 components */}
              <div
                className="flex-1 overflow-y-auto divide-y divide-slate-100"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#c85a17 #f1f2f4",
                }}
              >
                {filteredComponents.map((comp) => {
                  const isSelected = comp.id === canonicalSelectedId;
                  return (
                    <button
                      key={comp.id}
                      onClick={() => handleSelectComponent(comp.id)}
                      className={`w-full text-left p-3.5 transition-colors flex items-center justify-between group ${
                        isSelected
                          ? "bg-[#eef6ff] border-l-4 border-[#0066cc]"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="pr-3">
                        <div
                          className={`text-xs font-bold tracking-tight transition-colors ${
                            isSelected
                              ? "text-[#0066cc]"
                              : "text-slate-800 group-hover:text-black"
                          }`}
                        >
                          {comp.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {comp.shortDescription}
                        </div>
                      </div>
                      {comp.temperature && (
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded whitespace-nowrap ${
                            isSelected
                              ? "bg-[#0066cc] text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {comp.temperature}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Verbatim Description */}
          {activeTab === "description" && currentComponent && (
            <div
              className="flex-1 overflow-y-auto p-5 md:p-6 bg-white text-slate-800"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#c85a17 #f1f2f4",
              }}
            >
              {/* Header with Title and Bluefors Blue Underline */}
              <div className="border-b-2 border-[#0066cc] pb-3 mb-4 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0066cc] block">
                    {currentComponent.category} Stage
                  </span>
                  <h2 className="text-xl font-black text-slate-900 leading-tight">
                    {currentComponent.name}
                  </h2>
                </div>
                {currentComponent.temperature && (
                  <span className="px-2.5 py-1 rounded bg-[#0066cc]/10 text-[#0066cc] font-mono text-xs font-bold border border-[#0066cc]/20">
                    {currentComponent.temperature}
                  </span>
                )}
              </div>

              {/* Verbatim Bluefors Description Paragraphs */}
              <div className="text-[13px] text-slate-700 leading-relaxed space-y-3.5 mb-6 font-normal">
                {currentComponent.fullDescription.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              {/* Technical Specifications Matrix */}
              <div className="bg-[#f8f9fa] rounded-xl p-4 border border-slate-200 text-xs space-y-2.5">
                <div className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 uppercase text-[10px] tracking-wider text-[#c85a17]">
                  Technical Specification
                </div>
                <div>
                  <span className="font-bold text-slate-600 block text-[11px]">Primary Role:</span>
                  <span className="text-slate-800">{currentComponent.purpose}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-600 block text-[11px]">Quantum Connection:</span>
                  <span className="text-slate-800">{currentComponent.quantumConnection}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-600 block text-[11px]">Cryogenic Materials:</span>
                  <span className="text-slate-800 font-mono text-[11px]">{currentComponent.material}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-600 block text-[11px]">Location in Stack:</span>
                  <span className="text-slate-800">{currentComponent.location}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Bottom-Left Navigation: "< BACK" ── */}
      <div className="absolute bottom-6 left-6 z-30 flex items-center gap-3 pointer-events-auto">
        <Link
          to="/"
          className="text-white hover:text-[#00c2ff] text-sm font-black tracking-widest uppercase transition-colors flex items-center gap-2 drop-shadow-md bg-[#16181b]/85 px-4 py-2.5 rounded-xl border border-white/10 hover:border-[#00c2ff]/40 shadow-lg"
        >
          <span className="text-base">‹</span>
          <span>Back</span>
        </Link>
      </div>

      {/* ── Bottom-Right Viewport Action Icons ── */}
      <div className="absolute bottom-6 right-6 z-30 flex items-center gap-2.5 pointer-events-auto">
        <button
          onClick={resetView}
          title="Reset Camera View to Home"
          className="w-10 h-10 rounded-xl bg-[#1e2227]/90 hover:bg-[#2a3036] text-white flex items-center justify-center transition-all border border-white/10 shadow-lg active:scale-95"
          aria-label="Reset View"
        >
          <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          className="w-10 h-10 rounded-xl bg-[#1e2227]/90 hover:bg-[#2a3036] text-white flex items-center justify-center transition-all border border-white/10 shadow-lg active:scale-95"
          aria-label="Toggle Fullscreen"
        >
          <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>

        <button
          onClick={() => setShowToolsDrawer((prev) => !prev)}
          title="Advanced Tools (Exploded View & Signal Tracing)"
          className={`h-10 px-3.5 rounded-xl text-xs font-bold tracking-wide flex items-center gap-1.5 transition-all border shadow-lg ${
            showToolsDrawer
              ? "bg-cyan-600 border-cyan-400 text-white"
              : "bg-[#1e2227]/90 border-white/10 text-slate-300 hover:text-white hover:bg-[#2a3036]"
          }`}
        >
          <span>Tools</span>
          <svg className={`w-3.5 h-3.5 transition-transform ${showToolsDrawer ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* ── Bottom Advanced Tools Drawer ── */}
      {showToolsDrawer && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 bg-[#1a1d22]/98 backdrop-blur-md border border-white/15 rounded-xl shadow-2xl px-6 py-3.5 flex flex-wrap items-center gap-5 text-xs pointer-events-auto max-w-[94vw]">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-300">Exploded View:</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={explodeFactor}
              onChange={(e) => setExplodeFactor(parseFloat(e.target.value))}
              className="w-32 accent-cyan-400 cursor-pointer"
            />
            <span className="font-mono text-cyan-400 w-10 text-right">
              {Math.round(explodeFactor * 100)}%
            </span>
            <button
              onClick={startTour}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide transition-all ${
                tourRunning
                  ? "bg-amber-600 text-white"
                  : "bg-[#2b3036] hover:bg-[#373d45] text-slate-200"
              }`}
            >
              {tourRunning ? "Pause Tour" : "Auto Explode"}
            </button>
          </div>

          <div className="w-px h-6 bg-white/15 hidden md:block" />

          <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-300">
            <input
              type="checkbox"
              checked={autoRotate}
              onChange={(e) => setAutoRotate(e.target.checked)}
              className="accent-cyan-400"
            />
            Auto Rotate
          </label>

          <div className="w-px h-6 bg-white/15 hidden md:block" />

          <button
            onClick={() => {
              if (signalTracingActive) {
                setSignalTracingActive(false);
                setSignalPlaying(false);
              } else {
                setSignalTracingActive(true);
                setSignalPlaying(true);
                setSignalStepIndex(0);
                setSignalPovMode("chase");
              }
            }}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs tracking-wide transition-all flex items-center gap-1.5 ${
              signalTracingActive
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30"
                : "bg-[#2b3036] hover:bg-[#373d45] text-cyan-400"
            }`}
          >
            <span>⚡</span>
            {signalTracingActive ? "Stop Signal Tracing" : "Play Signal Trace (Cinematic)"}
          </button>
        </div>
      )}

      {/* ── Cinematic Flight Telemetry HUD & POV Director Overlay ── */}
      {signalTracingActive && activeSignalStep && (
        <div
          className="absolute top-[68px] left-6 z-40 bg-[#14171c]/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] p-5 pointer-events-auto border-l-4 border-l-cyan-400"
          style={{ width: "420px", maxWidth: "calc(100vw - 48px)" }}
        >
          {/* Header & Close */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping inline-block" />
              <span className="text-[11px] font-black text-cyan-300 uppercase tracking-widest">
                Step {signalStepIndex + 1} of {SIGNAL_FLOW_STEPS.length} · {activeSignalStep.phaseLabel}
              </span>
            </div>
            <button
              onClick={() => {
                setSignalTracingActive(false);
                setSignalPlaying(false);
              }}
              className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-xs leading-none transition-all"
            >
              ✕
            </button>
          </div>

          <h3 className="font-black text-lg text-white mb-1.5 tracking-tight flex items-center justify-between">
            <span>{activeSignalStep.title}</span>
            <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-700/50">
              {activeSignalStep.temperature}
            </span>
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed mb-4 font-normal">
            {activeSignalStep.summary}
          </p>

          {/* 🎬 POV Director Controls */}
          <div className="mb-3.5 p-2.5 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Cinematic POV Director</span>
              <span className="text-cyan-400 font-mono">Active: {signalPovMode.toUpperCase()}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: "chase", label: "🎬 Chase Cam", desc: "Swoop along pulse" },
                { id: "macro", label: "🔍 Stage Macro", desc: "Lock on component" },
                { id: "hero", label: "📐 Hero Wide", desc: "Full cryostat path" },
                { id: "free", label: "🖐️ Free Orbit", desc: "Manual view" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSignalPovMode(m.id as SignalPovMode)}
                  title={m.desc}
                  className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all text-center ${
                    signalPovMode === m.id
                      ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/30"
                      : "bg-white/5 hover:bg-white/10 text-slate-300"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Physical Telemetry Badges */}
          <div className="grid grid-cols-3 gap-2 mb-4 text-[11px]">
            <div className="p-2 rounded-lg bg-black/30 border border-white/5 flex flex-col">
              <span className="text-slate-400 text-[10px]">Thermal Noise:</span>
              <span className="font-mono font-bold text-amber-300">
                {signalStepIndex < 2 ? "1,300 phot/Hz" : signalStepIndex < 4 ? "0.02 phot/Hz" : "< 10⁻⁵ phot/Hz"}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-black/30 border border-white/5 flex flex-col">
              <span className="text-slate-400 text-[10px]">Attenuation:</span>
              <span className="font-mono font-bold text-cyan-300">
                {signalStepIndex === 0 ? "0 dB" : signalStepIndex === 1 ? "-20 dB" : signalStepIndex < 4 ? "-50 dB" : "+40 dB HEMT"}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-black/30 border border-white/5 flex flex-col">
              <span className="text-slate-400 text-[10px]">Quantum State:</span>
              <span className="font-mono font-bold text-purple-300">
                {signalStepIndex < 3 ? "|0⟩ ground" : signalStepIndex === 3 ? "(|0⟩+|1⟩)/√2" : "|1⟩ excited"}
              </span>
            </div>
          </div>

          {/* Transport Controls & Playback Speed */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSignalPlaying((p) => !p)}
                className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg font-black tracking-wide shadow-md active:scale-95"
              >
                {signalPlaying ? "Pause" : "Play"}
              </button>
              <button
                onClick={() => {
                  setSignalStepIndex((prev) => Math.max(0, prev - 1));
                  setSignalProgress(0);
                  signalProgressRef.current = 0;
                }}
                className="px-2.5 py-1.5 bg-[#25292e] text-slate-200 rounded-lg hover:bg-[#2d3238] font-semibold"
              >
                ◀ Prev
              </button>
              <button
                onClick={() => {
                  setSignalStepIndex((prev) => Math.min(SIGNAL_FLOW_STEPS.length - 1, prev + 1));
                  setSignalProgress(0);
                  signalProgressRef.current = 0;
                }}
                className="px-2.5 py-1.5 bg-[#25292e] text-slate-200 rounded-lg hover:bg-[#2d3238] font-semibold"
              >
                Next ▶
              </button>
            </div>

            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
              {([0.5, 1, 1.5, 2] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                    playbackSpeed === spd
                      ? "bg-cyan-500 text-black"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
