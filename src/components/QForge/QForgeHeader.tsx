import React from 'react';
import { Link } from 'react-router-dom';

export const QForgeHeader: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-purple-900 via-indigo-900 to-black text-white py-4 px-6 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-2xl font-orbitron font-bold tracking-wider hover:text-emerald-300 transition-colors">
          Q‑Forge
        </Link>
        <nav className="space-x-6">
          <Link to="/" className="hover:text-emerald-300 transition-colors">Home</Link>
          <Link to="/algorithms" className="hover:text-emerald-300 transition-colors">Algorithms</Link>
          <Link to="/labs" className="hover:text-emerald-300 transition-colors">Labs</Link>
          <Link to="/about" className="hover:text-emerald-300 transition-colors">About</Link>
        </nav>
      </div>
    </header>
  );
};
