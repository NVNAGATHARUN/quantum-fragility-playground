import React, { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'

// Lazy load routes
const Home = lazy(() => import('./routes/Home'))
const About = lazy(() => import('./routes/About'))
const Learn = lazy(() => import('./routes/Learn'))

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-6">
      <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
      <span className="font-mono text-[10px] tracking-[4px] text-slate-500 uppercase">Synchronizing...</span>
    </div>
  </div>
);

export default function App() {
  return (
    <div className="min-h-screen flex flex-col pt-[60px] bg-[#020617] text-white">
      <Navbar />
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-24 py-32">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/learn" element={<Learn />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}
