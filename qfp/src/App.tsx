import React, { Suspense, lazy } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import QuantumAssistant from './components/QuantumAssistant'
import './styles/crt.css'


// Lazy load routes
const Home = lazy(() => import('./routes/Home'))
const FragilityLab = lazy(() => import('./routes/FragilityLab'))
const QuantumVsClassical = lazy(() => import('./routes/QuantumVsClassical'))
const GateBuilder = lazy(() => import('./routes/GateBuilder'))
const QiskitVisualizer = lazy(() => import('./routes/QiskitVisualizer'))
const QasmVisualizer = lazy(() => import('./routes/QasmVisualizer'))
const Learn = lazy(() => import('./routes/Learn'))
const ExperimentsIndex = lazy(() => import('./routes/Experiments/Index'))
const SternGerlach = lazy(() => import('./routes/Experiments/SternGerlach'))
const BellState = lazy(() => import('./routes/Experiments/BellState'))
const CavityQed = lazy(() => import('./routes/Experiments/CavityQed'))
const About = lazy(() => import('./routes/About'))

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-16">
      <div className="w-48 h-48 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
      <span className="font-orbitron text-xs tracking-[4px] text-text-muted uppercase">Initializing Quantum State...</span>
    </div>
  </div>
);

export default function App() {
  const location = useLocation()
  const [crtMode, setCrtMode] = React.useState(false)

  // Global toggle listener
  React.useEffect(() => {
    const handleToggle = () => setCrtMode(v => !v)
    window.addEventListener('toggle-crt', handleToggle)
    return () => window.removeEventListener('toggle-crt', handleToggle)
  }, [])

  return (
    <div className={`min-h-screen flex flex-col pt-[60px] transition-all duration-700 ${crtMode ? 'crt-mode' : ''}`}>
      {crtMode && <div className="crt-overlay" />}
      <Navbar />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-24 py-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/fragility-lab" element={<FragilityLab />} />
                <Route path="/quantum-vs-classical" element={<QuantumVsClassical />} />
                <Route path="/gate-builder" element={<GateBuilder />} />
                <Route path="/qiskit-visualizer" element={<QiskitVisualizer />} />
                <Route path="/qasm-visualizer" element={<QasmVisualizer />} />
                <Route path="/learn" element={<Learn />} />
                <Route path="/experiments" element={<ExperimentsIndex />} />
                <Route path="/experiments/stern-gerlach" element={<SternGerlach />} />
                <Route path="/experiments/bell-state" element={<BellState />} />
                <Route path="/experiments/cavity-qed" element={<CavityQed />} />
                <Route path="/about" element={<About />} />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-brand-border/50 bg-surface/30 backdrop-blur">
        <div className="max-w-[1280px] mx-auto px-24 py-12 flex items-center justify-center text-[11px] font-mono text-text-muted tracking-widest uppercase">
          <span>&copy; {new Date().getFullYear()} Quantum Fragility Playground</span>
        </div>
      </footer>

      {/* Global floating AI chatbot */}
      <QuantumAssistant />
    </div>
  )
}
