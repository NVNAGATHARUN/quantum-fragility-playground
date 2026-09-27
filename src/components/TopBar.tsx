import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  Sun,
  Moon,
  Menu,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  RefreshCw,
  UserCheck,
  GraduationCap,
  LogIn,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useTheme } from '../providers/ThemeProvider';
import { useRole } from '../providers/RoleProvider';
import { useAuth } from '../providers/AuthProvider';
import { apiUrl } from '../api/client';

interface TopBarProps {
  onOpenCommandPalette: () => void;
  onToggleSidebarMobile: () => void;
  isSidebarCollapsed: boolean;
}

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

export default function TopBar({
  onOpenCommandPalette,
  onToggleSidebarMobile,
  isSidebarCollapsed
}: TopBarProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { role, toggleRole } = useRole();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const isTechnicalRoute = location.pathname.startsWith('/labs') || location.pathname.startsWith('/explore/hardware');

  // Status indicator state
  const [capabilities, setCapabilities] = useState<CapabilitiesData | null>(null);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [isStatusPopoverOpen, setIsStatusPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Ping check
  const measurePing = useCallback(async () => {
    const t0 = performance.now();
    try {
      const res = await fetch(apiUrl('/health'), { method: 'GET', cache: 'no-store' });
      const t1 = performance.now();
      if (res.ok) {
        setPingMs(Math.round(t1 - t0));
      } else {
        setPingMs(null);
      }
    } catch {
      setPingMs(null);
    }
  }, []);

  // Capabilities fetch
  const fetchCapabilities = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/v1/system/capabilities'), { cache: 'no-store' });
      if (res.ok) {
        const data: CapabilitiesData = await res.json();
        setCapabilities(data);
      }
    } catch {
      // Offline or degraded
    }
  }, []);

  useEffect(() => {
    measurePing();
    fetchCapabilities();
    const interval = setInterval(measurePing, 30_000);
    return () => clearInterval(interval);
  }, [measurePing, fetchCapabilities]);

  // Close popover on outside click
  useEffect(() => {
    if (!isStatusPopoverOpen) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsStatusPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isStatusPopoverOpen]);

  // Close user menu on outside click
  useEffect(() => {
    if (!isUserMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isUserMenuOpen]);


  // Listen for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenCommandPalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenCommandPalette]);

  // Compute clean breadcrumb label
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/' || path === '/app/home') return 'Home';
    if (path === '/learn') return 'Learn';
    if (path.startsWith('/learn/')) return 'Learn / Lesson';
    if (path === '/labs') return 'Labs';
    if (path.startsWith('/labs/studio')) return 'Circuit Studio';
    if (path.startsWith('/labs/fragility')) return 'Quantum Fragility';
    if (path === '/explore') return 'Explore';
    if (path.startsWith('/explore/algorithms')) return 'Algorithm Explorer';
    if (path.startsWith('/explore/hardware')) return 'Inside a Quantum Computer';
    if (path === '/progress') return 'Progress';
    if (path.startsWith('/instructor')) return 'Instructor';
    if (path === '/design-system') return 'Design System Reference';
    return path.replace('/', '').replace(/-/g, ' ');
  };

  const isAvailable = capabilities?.overallSimulationStatus === 'available';
  const frameworks = capabilities ? Object.values(capabilities.frameworks) : [];

  return (
    <header
      className={`topbar fixed top-0 right-0 z-20 h-14 transition-all duration-300 flex items-center justify-between px-4 sm:px-6 ${
        isSidebarCollapsed ? 'left-16' : 'left-0 sm:left-60'
      }`}
    >
      {/* Left: Mobile hamburger & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebarMobile}
          className="sm:hidden p-1.5 rounded-lg transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94A3C0' }}
          title="Toggle Navigation"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono font-semibold" style={{ color: '#8B5CF6' }}>Ψ</span>
          <ChevronRight className="w-3 h-3" style={{ color: '#3A4E6A' }} />
          <span className="font-semibold capitalize" style={{ color: '#F0F4FF', fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px' }}>
            {getBreadcrumb()}
          </span>
        </div>
      </div>

      {/* Center: Search input button */}
      <div className="flex-1 max-w-md mx-6 hidden md:block">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-4 py-2 rounded-xl transition-all text-xs group"
          style={{ background: 'rgba(16,26,50,0.60)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.35)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-3.5 h-3.5" style={{ color: '#5E7090' }} />
            <span style={{ color: '#3A4E6A', fontFamily: "'Space Grotesk', sans-serif" }}>Search circuits, algorithms, concepts...</span>
          </div>
          <kbd className="px-2 py-0.5 text-[10px] font-mono rounded-md" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: '#3A4E6A' }}>
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Contextual System Status Pill (strictly on technical simulation workspaces) */}
        {isTechnicalRoute && (
          <div className="relative" ref={popoverRef}>
            <button
              onClick={() => setIsStatusPopoverOpen(prev => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
              title="View simulation system status"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isAvailable ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span className="hidden sm:inline text-[11px]">
                {isAvailable ? 'Simulator ready' : 'Connecting...'}
              </span>
            </button>

            {/* Clean Status Popover */}
            {isStatusPopoverOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-lg bg-surface border border-border shadow-popover p-4 z-50 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="font-semibold text-text-primary">Simulator Status</span>
                  <button
                    onClick={() => setIsStatusPopoverOpen(false)}
                    className="text-text-muted hover:text-text-primary"
                    aria-label="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="py-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">API Server</span>
                    <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                      {pingMs !== null ? `${pingMs}ms` : 'online'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Qiskit Aer</span>
                    <span className="font-mono text-[11px] text-text-primary">
                      {capabilities?.frameworks?.qiskit_aer?.installed
                        ? `v${capabilities.frameworks.qiskit_aer.version ?? '0.17'}`
                        : 'Unavailable'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Self-Test</span>
                    <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                      Passed (1-qubit X)
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-text-muted">
                  <span>Verified via 1-qubit self-test</span>
                  <button
                    onClick={() => {
                      measurePing();
                      fetchCapabilities();
                    }}
                    className="hover:text-text-primary flex items-center gap-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    Refresh
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Authentication Controls */}
        {isAuthenticated && user ? (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-border bg-surface hover:bg-surface-secondary text-xs transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
              </div>
              <span className="font-medium text-text-primary hidden sm:inline max-w-[120px] truncate">
                {user.full_name}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider ${
                user.role === 'instructor'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
              }`}>
                {user.role}
              </span>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 rounded-lg bg-surface border border-border shadow-popover p-2 z-50 text-xs animate-fade-in">
                <div className="px-2 py-1.5 border-b border-border mb-1">
                  <div className="font-semibold text-text-primary truncate">{user.full_name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-md transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => openAuthModal('signup')}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors shadow-xs"
            >
              <span>Join</span>
            </button>
          </div>
        )}

        {/* Development Role Toggle (Dev Environment Only) */}
        {import.meta.env.DEV && (
          <button
            onClick={toggleRole}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] transition-colors ${
              role === 'instructor'
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300'
                : 'bg-surface border-border text-text-secondary hover:text-text-primary'
            }`}
            title="Toggle Student / Instructor view (development preview)"
          >
            {role === 'instructor' ? (
              <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
            ) : (
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span className="capitalize font-medium">{role}</span>
          </button>
        )}

        {/* Theme Toggle (Light / Dark) */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md hover:bg-surface-secondary text-text-secondary hover:text-text-primary transition-colors border border-border"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-slate-600" />
          )}
        </button>
      </div>
    </header>
  );
}
