import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  ArrowUpRight,
  Atom,
  BookOpen,
  ChartNoAxesCombined,
  ChevronRight,
  Compass,
  FlaskConical,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import CommandPalette from "./CommandPalette";
import { useAuth } from "../providers/AuthProvider";
import { useRole } from "../providers/RoleProvider";
import { useDialogFocus } from "../hooks/useDialogFocus";
import { useTheme } from "../providers/ThemeProvider";

const navigation = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/labs", label: "Labs", icon: FlaskConical },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/progress", label: "Progress", icon: ChartNoAxesCombined },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => window.matchMedia("(max-width: 1100px)").matches,
  );
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
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isWorkbench =
    location.pathname.startsWith("/labs/studio") ||
    location.pathname.startsWith("/labs/fragility") ||
    location.pathname.startsWith("/explore/hardware");
  useEffect(() => {
    if (isWorkbench && !compact) setCollapsed(true);
  }, [isWorkbench, compact]);
  const menuRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const current = [...navigation]
    .reverse()
    .find((n) =>
      n.end ? n.to === location.pathname : location.pathname.startsWith(n.to),
    );
  const title = location.pathname.startsWith("/labs/studio")
    ? "Circuit Studio"
    : location.pathname.startsWith("/labs/fragility")
      ? "Quantum Fragility"
      : location.pathname.startsWith("/labs/guided/")
        ? "Guided experiment"
        : location.pathname.startsWith("/challenges")
          ? "Challenges"
          : location.pathname.includes("hardware")
            ? "Hardware Explorer"
            : current?.label || "Quantum Lens";
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
  useEffect(() => {
    if (mobileOpen) closeRef.current?.focus();
  }, [mobileOpen]);
  return (
    <div className={`ql-app ${collapsed ? "sidebar-collapsed" : ""} ${isWorkbench ? "is-workbench" : ""}`}>
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
          <span className="ql-brand-copy">
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
        <p className="ql-nav-label">Workspace</p>
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
            </NavLink>
          ))}
          {isInstructor && (
            <NavLink to="/instructor" className={({ isActive }) => `ql-nav-link ${isActive ? "is-active" : ""}`}>
              <GraduationCap size={19} strokeWidth={1.7} />
              <span>Instructor</span>
            </NavLink>
          )}
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
              aria-label={compact ? "Open navigation" : collapsed ? "Expand navigation" : "Collapse navigation"}
              aria-expanded={compact ? mobileOpen : !collapsed}
              onClick={() => compact ? setMobileOpen(true) : setCollapsed((value) => !value)}
            >
              {compact ? <Menu size={21} /> : collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{title}</strong>
          </div>
          <div className="ql-topbar-actions">
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
              className="ql-icon-button ql-theme-toggle"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              onClick={toggleTheme}
            >
              {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
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
        <main id="main-content" tabIndex={-1} className="ql-main">
          {children}
        </main>
        <footer className="ql-footer">
          <span>Made for curious minds.</span>
          <span>
            Quantum Lens <span aria-hidden="true">/</span> Learn. Experiment.
            Understand.
          </span>
        </footer>
      </div>
    </div>
  );
}
