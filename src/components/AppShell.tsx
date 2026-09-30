import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  ArrowUpRight,
  Atom,
  BookOpen,
  ChartNoAxesCombined,
  ChevronRight,
  Code2,
  Compass,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import CommandPalette from "./CommandPalette";
import { useAuth } from "../providers/AuthProvider";
import { useRole } from "../providers/RoleProvider";
import { useDialogFocus } from "../hooks/useDialogFocus";

const navigation = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/learn", label: "Learning path", icon: BookOpen },
  { to: "/labs", label: "Quantum labs", icon: FlaskConical, end: true },
  { to: "/labs/studio", label: "Circuit studio", icon: Code2 },
  { to: "/quantum-lens", label: "QuantumLens 3D", icon: Atom },
  { to: "/explore", label: "Algorithm library", icon: Compass },
  { to: "/challenges", label: "Challenges", icon: Trophy },
  { to: "/progress", label: "My progress", icon: ChartNoAxesCombined },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [compact, setCompact] = useState(
    () => window.matchMedia("(max-width: 760px)").matches,
  );
  const sidebarRef = useRef<HTMLElement>(null);
  useDialogFocus(compact && mobileOpen, sidebarRef, () => setMobileOpen(false));
  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const change = () => {
      setCompact(media.matches);
      if (!media.matches) setMobileOpen(false);
    };
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  const { user, openAuthModal, logout } = useAuth();
  const { isInstructor } = useRole();
  const location = useLocation();
  const menuRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const isImmersive =
    location.pathname.startsWith("/quantum-lens") ||
    location.pathname.startsWith("/quantum-hardware") ||
    location.pathname.startsWith("/explore/hardware");
  const current = [...navigation]
    .reverse()
    .find((n) =>
      n.end ? n.to === location.pathname : location.pathname.startsWith(n.to),
    );
  const title =
    (isImmersive
      ? "QuantumLens 3D Model"
      : undefined) ||
    (location.pathname.startsWith("/labs/guided/")
      ? "Guided experiment"
      : current?.label) ||
    "Workspace";
  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo(0, 0);
    document.title = `${title} · Quantum Lens`;
  }, [location.pathname, title]);
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setMobileOpen(false);
        menuRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);
  const isStandalone =
    location.pathname === "/quantum-lens" ||
    location.pathname === "/quantum-lens/model" ||
    location.pathname === "/quantum-hardware";

  if (isStandalone) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-[#111214] select-none">
        {children}
      </div>
    );
  }

  return (
    <div className="ql-app">
      <a className="ql-skip" href="#main-content">
        Skip to content
      </a>
      <CommandPalette
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
      {mobileOpen && (
        <button
          className="ql-sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        ref={sidebarRef}
        {...(compact && !mobileOpen ? { inert: "" } : {})}
        aria-hidden={compact && !mobileOpen ? true : undefined}
        className={`ql-sidebar ${mobileOpen ? "is-open" : ""}`}
        aria-label="Main navigation"
      >
        <Link to="/" className="ql-brand">
          <span className="ql-brand-mark">
            <Atom size={26} strokeWidth={1.5} />
          </span>
          <span>
            quantum<span className="ql-brand-light">lens</span>
            <small>THE LEARNING LAB</small>
          </span>
        </Link>
        <button
          ref={closeRef}
          className="ql-mobile-close ql-icon-button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        >
          <X size={20} />
        </button>
        <div className="ql-workspace-label">
          <span className="ql-workspace-icon">Q</span>
          <div>
            Personal workspace<small>Your space to discover</small>
          </div>
          <ChevronRight size={14} />
        </div>
        <p className="ql-nav-label">WORKSPACE</p>
        <nav className="ql-navigation">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `ql-nav-link ${isActive ? "is-active" : ""}`
              }
            >
              <Icon size={19} strokeWidth={1.7} />
              <span>{label}</span>
              {to === "/labs/studio" && <span className="ql-nav-tag">LAB</span>}
            </NavLink>
          ))}
        </nav>
        <div className="ql-sidebar-bottom">
          <div className="ql-sidebar-note">
            <span className="ql-tiny-orbit">✳</span>
            <strong>
              A little curiosity.
              <br />A quantum leap.
            </strong>
            <p>
              Start with a question.
              <br />
              Find the answer by doing.
            </p>
            <Link to="/labs/guided/superposition">
              Try your first experiment <ArrowUpRight size={15} />
            </Link>
          </div>
          <Link
            className="ql-nav-link"
            to={isInstructor ? "/instructor" : "/about"}
          >
            <GraduationCap size={19} />
            <span>
              {isInstructor ? "Instructor dashboard" : "About the platform"}
            </span>
            <ArrowUpRight size={14} />
          </Link>
          <div className="ql-account">
            <span className="ql-avatar">
              {user?.full_name?.charAt(0).toUpperCase() || "Q"}
            </span>
            <button
              onClick={() => {
                if (!user) {
                  setMobileOpen(false);
                  openAuthModal("login");
                }
              }}
            >
              <strong>{user?.full_name || "Curious explorer"}</strong>
              <small>
                {user ? "Personal account" : "Sign in to save progress"}
              </small>
            </button>
            {user && (
              <button
                className="ql-icon-button"
                aria-label="Sign out"
                onClick={logout}
              >
                <LogOut size={17} />
              </button>
            )}
          </div>
        </div>
      </aside>
      <div className="ql-main-shell">
        <header className="ql-topbar">
          <div className="ql-breadcrumb">
            <button
              ref={menuRef}
              className="ql-menu-toggle ql-icon-button"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={22} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{title}</strong>
          </div>
          <div className="ql-topbar-actions flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Qiskit Aer · 15 mK</span>
            </div>

            <Link
              to="/quantum-lens"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-400 text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>QuantumLens 3D</span>
            </Link>

            <button
              className="ql-search-trigger"
              aria-label="Search lessons, labs, and algorithms"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={16} />
              <span>Search anything</span>
              <kbd>Ctrl K</kbd>
            </button>
            <button
              className="ql-mentor-trigger"
              aria-label="Ask AI tutor"
              onClick={() =>
                window.dispatchEvent(new Event("quantum-lens:open-mentor"))
              }
            >
              <Sparkles size={16} />
              <span>Ask AI tutor</span>
            </button>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className={`ql-main ${isImmersive ? "ql-main-immersive" : ""}`}
          style={
            isImmersive
              ? {
                  padding: 0,
                  maxWidth: "100%",
                  height: "calc(100vh - 76px)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }
              : undefined
          }
        >
          {children}
        </main>
        {!isImmersive && (
          <footer className="ql-footer">
            <span>Made for curious minds.</span>
            <span>
              Quantum Lens <span aria-hidden="true">/</span> Learn. Experiment.
              Understand.
            </span>
          </footer>
        )}
      </div>
    </div>
  );
}
