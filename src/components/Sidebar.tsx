import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, BookOpen, FlaskConical, Compass, BarChart3,
  GraduationCap, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useRole } from '../providers/RoleProvider';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItemDef {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  end?: boolean;
  accent: string;
}

const STATS = [
  { label: 'Qubits', value: '32', color: '#22D3EE' },
  { label: 'Gates', value: '9', color: '#8B5CF6' },
  { label: 'Labs', value: '12', color: '#10B981' },
];

export default function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const { isInstructor } = useRole();

  const primaryNav: NavItemDef[] = [
    { to: '/app/home', label: 'Overview', icon: Home, accent: '#8B5CF6' },
    { to: '/learn', label: 'Learn', icon: BookOpen, accent: '#22D3EE' },
    { to: '/labs', label: 'Labs', icon: FlaskConical, accent: '#D946EF' },
    { to: '/explore', label: 'Explore', icon: Compass, accent: '#3B82F6' },
    { to: '/progress', label: 'Progress', icon: BarChart3, accent: '#10B981' },
  ];

  const instructorNav: NavItemDef[] = [
    { to: '/instructor', label: 'Classroom', icon: GraduationCap, accent: '#F59E0B' },
  ];

  const sidebarStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, rgba(4,8,24,0.98) 0%, rgba(2,5,16,0.98) 100%)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    boxShadow: '4px 0 24px rgba(0,0,0,0.40), 1px 0 0 rgba(139,92,246,0.06)',
  };

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-30 flex flex-col transition-all duration-300 ease-in-out select-none ${isCollapsed ? 'w-16' : 'w-60'}`}
      style={sidebarStyle}
    >
      {/* Brand Header */}
      <div
        className={`h-14 flex items-center border-b transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-4 gap-3'}`}
        style={{ borderBottomColor: 'rgba(255,255,255,0.06)' }}
      >
        <NavLink to="/app/home" className="flex items-center gap-3 min-w-0">
          <div
            className="relative shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #7C3AED 0%, #0891B2 100%)',
              boxShadow: '0 0 20px rgba(139,92,246,0.40), inset 0 1px 0 rgba(255,255,255,0.20)',
            }}
          >
            <span className="text-white font-bold text-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Ψ</span>
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="block font-bold text-sm tracking-tight text-white truncate" style={{ fontFamily: "'Syne', sans-serif" }}>
                Quantum Lens
              </span>
              <span className="block text-[10px] font-mono" style={{ color: '#22D3EE', letterSpacing: '0.08em' }}>
                SIH 2026 · PS26140
              </span>
            </div>
          )}
        </NavLink>
      </div>

      {/* Status Strip */}
      {!isCollapsed && (
        <div
          className="mx-3 my-2 px-3 py-2 rounded-lg flex items-center justify-between"
          style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
        >
          <div className="flex items-center gap-2">
            <div className="status-dot-live" />
            <span className="text-[10px] font-mono font-semibold" style={{ color: '#6EE7B7', letterSpacing: '0.06em' }}>SYSTEM ONLINE</span>
          </div>
          <span className="text-[9px] font-mono" style={{ color: '#5E7090' }}>Qiskit Aer</span>
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 py-2 space-y-0.5 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {!isCollapsed && (
          <div className="px-2 py-1.5 mb-1">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-widest" style={{ color: '#3A4E6A' }}>Platform</span>
          </div>
        )}

        {primaryNav.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-[18px] h-[18px] shrink-0" style={{ color: isActive ? item.accent : '#5E7090' }} />
                  {!isCollapsed && <span className="truncate text-[13px]">{item.label}</span>}
                  {isActive && !isCollapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.accent, boxShadow: `0 0 8px ${item.accent}` }} />
                  )}
                </>
              )}
            </NavLink>
          );
        })}

        {isInstructor && (
          <div className={`pt-3 mt-2 ${isCollapsed ? '' : 'border-t'}`} style={{ borderTopColor: 'rgba(255,255,255,0.06)' }}>
            {!isCollapsed && (
              <div className="px-2 py-1.5 mb-1">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-widest" style={{ color: '#3A4E6A' }}>Faculty</span>
              </div>
            )}
            {instructorNav.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={isCollapsed ? item.label : undefined}
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
                >
                  {({ isActive }) => (
                    <>
                      <Icon className="w-[18px] h-[18px] shrink-0" style={{ color: isActive ? item.accent : '#5E7090' }} />
                      {!isCollapsed && <span className="truncate text-[13px]">{item.label}</span>}
                      {isActive && !isCollapsed && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.accent, boxShadow: `0 0 8px ${item.accent}` }} />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        )}
      </nav>

      {/* Stats Strip */}
      {!isCollapsed && (
        <div className="mx-3 mb-3 p-3 rounded-xl" style={{ background: 'rgba(8,14,28,0.80)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="grid grid-cols-3 gap-2">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-sm font-bold" style={{ color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
                <div className="text-[9px] font-mono mt-0.5 uppercase tracking-wide" style={{ color: '#3A4E6A' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="p-2 flex items-center justify-end" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#5E7090' }}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>
    </aside>
  );
}
