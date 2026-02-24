import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { simulateBell, simulateGhz, runBb84, simulateSternGerlach } from './quantumSim'
import type { Bb84RunConfig, SternGerlachConfig } from '../src/types/quantum'

// ─── Gemini Setup ─────────────────────────────────────────────────────────────
const GEMINI_KEY = process.env.GEMINI_API_KEY ?? ''
const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null

const QUANTUM_SYSTEM_PROMPT = `You are ARIA (Adaptive Research Intelligence Assistant), the premium AI tutor inside "Quantum Lens" — a high-fidelity virtual quantum computing laboratory built for HackXAmrita 2.0.

## About Quantum Lens — Complete Website Guide
Quantum Lens is an interactive, browser-based quantum physics education platform. Here is every page and feature:

### Pages & Routes
1. **Home** (/) — Landing page with animated hero section, 3D Bloch sphere demo showing auto-decoherence, module grid with 6 cards linking to all major features, and live stats (7 noise channels, 9 quantum gates, 3 experiments).
2. **Fragility Lab** (/fragility-lab) — The flagship lab. Users control 4 noise channels (Bit Flip, Phase Flip, Amplitude Damping, Depolarizing) with real-time sliders. Features a 3D Bloch sphere visualization showing the qubit state vector shrinking under noise, a live decoherence graph plotting fidelity over time, preset noise configurations, and educational annotations.
3. **Quantum vs Classical** (/quantum-vs-classical) — Side-by-side comparison showing how classical bits (robust 0/1) remain stable while quantum qubits decay under identical noise. Demonstrates why quantum error correction matters.
4. **Gate Builder** (/gate-builder) — Drag-and-drop quantum circuit builder inspired by IBM Quantum Composer. Users can place gates (H, X, Y, Z, S, T, CNOT, etc.) on a multi-qubit grid, see the statevector update in real-time, and export circuits.
5. **Qiskit Visualizer** (/qiskit-visualizer) — Paste Qiskit Python code and visualize the circuit diagram with step-by-step state evolution.
6. **QASM Visualizer** (/qasm-visualizer) — Paste OpenQASM code and visualize the resulting quantum circuit.
7. **Learn** (/learn) — Educational hub covering: The Bloch Sphere (|ψ⟩ = cos(θ/2)|0⟩ + e^{iφ}sin(θ/2)|1⟩), Quantum Decoherence (T₁ amplitude damping, T₂ phase damping, depolarizing), Entanglement (Bell states, teleportation), Quantum Algorithms (Grover, Shor). Includes an interactive quiz.
8. **Experiments Index** (/experiments) — Hub linking to all virtual experiments.
9. **Stern-Gerlach** (/experiments/stern-gerlach) — Simulates the classic experiment: spin quantization and adjustable magnetic field angle.
10. **Bell State** (/experiments/bell-state) — Creates entangled Bell pairs, measures correlations, tests CHSH inequality violation, shows interference fringes.
11. **Cavity QED** (/experiments/cavity-qed) — Jaynes-Cummings model: Rabi oscillations, photon-atom coupling strength, vacuum Rabi splitting.
12. **About** (/about) — Project mission, scientific acknowledgments, tech stack (Vite + React + Three.js + TypeScript), and team info.

### Key Features
- **3D Bloch Sphere** — Three.js-powered rotating sphere with qubit state vector, trail history, and health indicator.
- **Real-time Decoherence Simulation** — Density matrix-based noise simulation with physically accurate math.
- **Sci-fi UI** — Dark glassmorphism design with Orbitron font, cyan/indigo gradients, and subtle animations.
- **You (ARIA)** — AI assistant powered by Gemini, accessible via the floating ⚛ button in the bottom-right corner.

### Tech Stack
- Frontend: React 18, TypeScript, Vite, Tailwind CSS v3, Framer Motion, Three.js
- Backend: Node.js, Express, Google Gemini AI
- Simulation: Custom TypeScript density-matrix engine

## Your Role & Personality
- You are a friendly, knowledgeable quantum physics tutor.
- **Answer ANY quantum physics question**: superposition, entanglement, decoherence, Bell's theorem, Rabi oscillations, density matrices, quantum gates (H, X, Y, Z, CNOT, Toffoli), algorithms (Grover's, Shor's, BB84 QKD), error correction, measurement, etc.
- **Guide users through the website**: tell them which page to visit, what controls do, what visualizations mean, how to interpret results. Always reference specific routes (e.g., "Head to /fragility-lab to see this in action!").
- **Adapt to the user's level**: use simple analogies for beginners, rigorous math for experts.
- **Format nicely**: use **bold** for key terms, bullet points for lists, and keep answers concise (2-3 paragraphs max unless asked for more).
- **Be enthusiastic** about quantum physics! Make learning fun.
- If asked about something unrelated to quantum physics or the website, politely redirect: "I'm specialized in quantum physics and the Quantum Lens platform. For that topic, I'd recommend checking a general-purpose assistant!"
- Never fabricate information. If unsure, say so honestly.`

const app = express()
const PORT = parseInt(process.env.PORT ?? '4000', 10)

// ─── Middleware ───────────────────────────────────────────────────────────────

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  // Production Vercel URL — set ALLOWED_ORIGIN env var on Render
  ...(process.env.ALLOWED_ORIGIN ? [process.env.ALLOWED_ORIGIN] : []),
]

app.use(cors({ origin: allowedOrigins }))
app.use(express.json())


// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── AI Chat ─────────────────────────────────────────────────────────────────

app.post('/api/chat', async (req: Request, res: Response) => {
  const { message, history } = req.body as { message?: string; history?: Array<{ role: string; parts: string }> }
  if (!message?.trim()) return res.status(400).json({ error: 'message required' })
  if (!genAI) return res.status(503).json({ error: 'AI not configured — set GEMINI_API_KEY env var' })

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash', systemInstruction: QUANTUM_SYSTEM_PROMPT })
    const chat = model.startChat({
      history: (history ?? []).map(h => ({ role: h.role as 'user' | 'model', parts: [{ text: h.parts }] }))
    })
    const result = await chat.sendMessage(message)
    return res.json({ reply: result.response.text() })
  } catch (err: any) {
    console.error('Gemini error:', err?.message)
    const isQuota = err?.message?.includes('429') || err?.message?.includes('quota') || err?.message?.includes('limit');
    const userMessage = isQuota
      ? '🌌 ARIA is resting. The daily quantum compute quota has been reached. Please try again tomorrow.'
      : (err?.message ?? 'AI error');
    return res.status(isQuota ? 429 : 500).json({ error: userMessage })
  }
})

// ─── Bell State ───────────────────────────────────────────────────────────────

app.post('/api/experiments/bell', (req: Request, res: Response) => {
  const shotsStr = req.body?.shots ?? '100'
  const shots = parseInt(String(shotsStr), 10)

  if (isNaN(shots) || shots < 1 || shots > 10000) {
    return res.status(400).json({ error: 'shots must be an integer between 1 and 10000' })
  }

  const result = simulateBell(shots)
  return res.json(result)
})

// ─── GHZ State ────────────────────────────────────────────────────────────────

app.post('/api/experiments/ghz', (req: Request, res: Response) => {
  const shotsStr = req.body?.shots ?? '100'
  const shots = parseInt(String(shotsStr), 10)

  if (isNaN(shots) || shots < 1 || shots > 10000) {
    return res.status(400).json({ error: 'shots must be an integer between 1 and 10000' })
  }

  const result = simulateGhz(shots)
  return res.json(result)
})


// ─── BB84 QKD ────────────────────────────────────────────────────────────────

app.post('/api/experiments/bb84', (req: Request, res: Response) => {
  const body = req.body as Partial<Bb84RunConfig>
  const rounds = parseInt(String(body.rounds ?? '50'), 10)
  const withEve = body.withEve === true

  if (isNaN(rounds) || rounds < 1 || rounds > 5000) {
    return res.status(400).json({ error: 'rounds must be an integer between 1 and 5000' })
  }

  const result = runBb84({ rounds, withEve })
  return res.json(result)
})

// ─── Stern-Gerlach ────────────────────────────────────────────────────────────

app.post('/api/experiments/stern-gerlach', (req: Request, res: Response) => {
  const { angleDegrees } = req.body ?? {}
  const angle = parseFloat(String(angleDegrees ?? '0'))
  if (isNaN(angle)) {
    return res.status(400).json({ error: 'angleDegrees must be a number' })
  }
  const result = simulateSternGerlach({ angleDegrees: angle })
  return res.json(result)
})

// ─── Error handler ────────────────────────────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

// ─── Start ────────────────────────────────────────────────────────────────────

function startServer(port: number): void {
  const server = app.listen(port, () => {
    console.log(`\n⚛  Quantum Fragility Playground API`)
    console.log(`   Listening on http://localhost:${port}`)
    console.log(`   Health: http://localhost:${port}/health`)
    if (port !== PORT) {
      console.log(`\n   ⚠  Port ${PORT} was busy. Set in .env:`)
      console.log(`      VITE_API_BASE_URL=http://localhost:${port}`)
    }
    console.log()
  })

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`   Port ${port} in use, trying ${port + 1}...`)
      server.close()
      startServer(port + 1)
    } else {
      console.error('Server error:', err)
      process.exit(1)
    }
  })
}

startServer(PORT)
