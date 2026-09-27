/**
 * TelemetryBar — Phase 1 Production Rewrite
 *
 * Displays live, real system status derived from:
 *   - Actual HTTP round-trip latency to /health (ping)
 *   - Actual framework self-test results from /api/v1/system/capabilities
 *
 * ZERO Math.random(). ZERO hardcoded fidelity/T2/node metrics.
 * The pill text reflects the real overallSimulationStatus from the capabilities engine.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, CheckCircle2, AlertTriangle, XCircle, ChevronDown, X, RefreshCw } from 'lucide-react';
import { apiUrl } from '../api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FrameworkStatus {
  id: string;
  name: string;
  installed: boolean;
  version?: string | null;
  configured: boolean;
  selfTestPassed: boolean;
  reachable?: boolean | null;
  status: 'available' | 'partially_available' | 'unavailable';
  reason?: string | null;
}

interface CapabilitiesData {
  overallSimulationStatus: 'available' | 'partially_available' | 'unavailable';
  frameworks: Record<string, FrameworkStatus>;
  api: { status: string; version: string; engine: string };
}

type PingState = 'idle' | 'checking' | 'online' | 'offline';

// ─── Status Helpers ───────────────────────────────────────────────────────────

function overallStatusLabel(status: string | null): string {
  if (status === 'available') return 'Simulation services available';
  if (status === 'partially_available') return 'Simulation partially available';
  if (status === 'unavailable') return 'Simulation unavailable';
  return 'Checking services…';
}

function overallStatusColor(status: string | null): string {
  if (status === 'available') return 'text-emerald-400';
  if (status === 'partially_available') return 'text-amber-400';
  if (status === 'unavailable') return 'text-rose-400';
  return 'text-slate-400';
}

function overallDotColor(status: string | null): string {
  if (status === 'available') return 'bg-emerald-400';
  if (status === 'partially_available') return 'bg-amber-400';
  if (status === 'unavailable') return 'bg-rose-400';
  return 'bg-slate-400';
}

function frameworkStatusIcon(fw: FrameworkStatus) {
  if (fw.status === 'available') {
    return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
  }
  if (fw.status === 'partially_available') {
    return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
  }
  return <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
}

function frameworkBadge(fw: FrameworkStatus): string {
  if (fw.status === 'available') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
  if (fw.status === 'partially_available') return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
  return 'bg-rose-500/10 text-rose-400 border-rose-500/25';
}

function frameworkStatusText(fw: FrameworkStatus): string {
  if (fw.status === 'available') return 'Available';
  if (fw.status === 'partially_available') return 'Partial';
  return 'Unavailable';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TelemetryBar() {
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [pingState, setPingState] = useState<PingState>('idle');
  const [capabilities, setCapabilities] = useState<CapabilitiesData | null>(null);
  const [capsError, setCapsError] = useState<string | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Real HTTP ping to /health
  const measurePing = useCallback(async () => {
    setPingState('checking');
    const t0 = performance.now();
    try {
      const res = await fetch(apiUrl('/health'), { method: 'GET', cache: 'no-store' });
      const t1 = performance.now();
      if (res.ok) {
        setPingMs(Math.round(t1 - t0));
        setPingState('online');
      } else {
        setPingMs(null);
        setPingState('offline');
      }
    } catch {
      setPingMs(null);
      setPingState('offline');
    }
  }, []);

  // Real capabilities fetch from /api/v1/system/capabilities
  const fetchCapabilities = useCallback(async () => {
    setCapsError(null);
    try {
      const res = await fetch(apiUrl('/api/v1/system/capabilities'), { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: CapabilitiesData = await res.json();
      setCapabilities(data);
      setLastRefreshed(new Date());
    } catch (err) {
      setCapsError(err instanceof Error ? err.message : 'Failed to reach capabilities endpoint');
      setCapabilities(null);
    }
  }, []);

  // Initial check + periodic ping every 30 s
  useEffect(() => {
    measurePing();
    fetchCapabilities();
    const interval = setInterval(measurePing, 30_000);
    return () => clearInterval(interval);
  }, [measurePing, fetchCapabilities]);

  // Close popover on outside click
  useEffect(() => {
    if (!isPopoverOpen) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isPopoverOpen]);

  const overallStatus = capabilities?.overallSimulationStatus ?? null;
  const frameworks = capabilities ? Object.values(capabilities.frameworks) : [];

  const handleRefresh = () => {
    measurePing();
    fetchCapabilities();
  };

  return (
    <div className="relative z-40" ref={popoverRef}>
      {/* ── Collapsed Bar ── */}
      <div className="w-full bg-[#050811]/90 backdrop-blur-md border-b border-white/[0.06] select-none">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-between gap-2">
          {/* Left: Platform badge */}
          <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
            <span className="hidden sm:inline text-slate-600">Quantum Lens AI</span>
            <span className="hidden sm:inline text-slate-700">·</span>
            <span className="hidden sm:inline">v3.0</span>
          </div>

          {/* Right: Status pill + toggle */}
          <button
            id="telemetry-status-pill"
            onClick={() => setIsPopoverOpen(prev => !prev)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-white/[0.08] hover:border-white/[0.15] bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-150 cursor-pointer group"
            title="View system status"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${overallDotColor(overallStatus)} ${
                overallStatus === 'available' ? 'animate-pulse' : ''
              }`}
            />
            <span className={`font-mono text-[10px] tracking-wide ${overallStatusColor(overallStatus)}`}>
              {overallStatusLabel(overallStatus)}
            </span>
            {pingState === 'online' && pingMs !== null && (
              <span className="hidden sm:inline font-mono text-[10px] text-slate-600">
                · {pingMs} ms
              </span>
            )}
            <ChevronDown
              className={`w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-transform duration-200 ${
                isPopoverOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── Status Popover ── */}
      <AnimatePresence>
        {isPopoverOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-4 sm:right-6 top-full mt-1 z-50 w-[360px] sm:w-[420px] bg-[#0b1120] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Popover header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-100">System Status</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="telemetry-refresh-btn"
                  onClick={handleRefresh}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-slate-300 transition-colors"
                  title="Refresh status"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  id="telemetry-close-btn"
                  onClick={() => setIsPopoverOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* API connectivity row */}
            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                <div className="flex items-center gap-2">
                  {pingState === 'online' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : pingState === 'offline' ? (
                    <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0 animate-spin border-t-slate-400" />
                  )}
                  <span className="text-xs text-slate-300 font-medium">API Server</span>
                  <span className="text-[10px] text-slate-600 font-mono">localhost:4000/health</span>
                </div>
                <div className="flex items-center gap-2">
                  {pingMs !== null && pingState === 'online' && (
                    <span className="font-mono text-[11px] text-slate-400">{pingMs} ms</span>
                  )}
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      pingState === 'online'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                        : pingState === 'offline'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                        : 'bg-slate-500/10 text-slate-400 border-slate-500/25'
                    }`}
                  >
                    {pingState === 'online' ? 'Online' : pingState === 'offline' ? 'Offline' : 'Checking'}
                  </span>
                </div>
              </div>
            </div>

            {/* Framework statuses */}
            <div className="px-4 pb-3">
              <p className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mb-2">
                Quantum Frameworks — Runtime Self-Tests
              </p>

              {capsError ? (
                <div className="flex items-center gap-2 py-2 text-xs text-rose-400">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Could not reach capabilities endpoint: {capsError}</span>
                </div>
              ) : frameworks.length === 0 ? (
                <div className="py-3 text-center text-xs text-slate-600">Probing frameworks…</div>
              ) : (
                <div className="space-y-1.5">
                  {frameworks.map(fw => (
                    <div
                      key={fw.id}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {frameworkStatusIcon(fw)}
                        <span className="text-xs text-slate-200 font-medium truncate">{fw.name}</span>
                        {fw.version && (
                          <span className="font-mono text-[10px] text-slate-600 shrink-0">
                            v{fw.version}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {fw.selfTestPassed && (
                          <span className="font-mono text-[9px] text-slate-600">self-test ✓</span>
                        )}
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${frameworkBadge(fw)}`}
                        >
                          {frameworkStatusText(fw)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reason for partial/unavailable states */}
              {frameworks.some(fw => fw.reason) && (
                <div className="mt-2 space-y-1">
                  {frameworks.filter(fw => fw.reason).map(fw => (
                    <p key={fw.id} className="text-[10px] text-slate-600 font-mono leading-snug">
                      <span className="text-slate-500">{fw.name}:</span> {fw.reason}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-white/[0.04] flex items-center justify-between">
              <span className="text-[10px] text-slate-700 font-mono">
                {lastRefreshed
                  ? `Last checked ${lastRefreshed.toLocaleTimeString()}`
                  : 'Checking…'}
              </span>
              <span className="text-[10px] text-slate-700 font-mono">
                Self-tests use real 1-qubit circuit execution
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
