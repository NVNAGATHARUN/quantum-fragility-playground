import React, { useState } from 'react';
import Navbar from './Navbar';
import CommandPalette from './CommandPalette';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-text-primary transition-colors duration-300 selection:bg-cyan-500/30 selection:text-cyan-800 dark:selection:text-cyan-200">
      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Full-width Fixed Top Navigation Bar */}
      <Navbar onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />

      {/* Main Content Area — Expansive Full-Screen Canvas with Zero Sidebar Constraint */}
      <div className="flex-1 flex flex-col pt-[88px] sm:pt-[96px] transition-all duration-300">
        <main className="flex-1 w-full max-w-[1560px] mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* High-Tech Quantum Lab Footer */}
        <footer
          className="mt-auto py-6 px-6 sm:px-8 border-t border-slate-200 dark:border-white/[0.06] bg-white/80 dark:bg-[#020512]/80 backdrop-blur-md transition-colors duration-300 text-slate-600 dark:text-slate-400"
        >
          <div className="max-w-[1560px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 text-white"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                  boxShadow: '0 0 10px rgba(124, 58, 237, 0.3)',
                }}
              >
                Ψ
              </div>
              <div>
                <span className="font-semibold text-slate-900 dark:text-slate-200">Quantum Lens AI</span>
                <span className="mx-2 text-slate-400 dark:text-slate-600">•</span>
                <span>SIH 2026 Problem Statement PS26140</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                Qiskit Aer 0.17.2 Verified
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-purple-600 dark:text-purple-400 font-semibold">3D WebGL Bloch Engine</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Full Mathematical Rigor</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
