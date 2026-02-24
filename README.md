# Quantum Lens Fragility Playground

A virtual quantum computing lab I built for the HackXAmrita 2.0 Ed-Tech hackathon. The idea came from trying to explain decoherence to a friend and realizing there's no good interactive tool for it — everything's either too theoretical or too dumbed down.

Live demo: https://quantum-fragility-playground.vercel.app

---

## What is this?

Quantum computers are incredibly fragile. Qubits lose their quantum state (superposition, entanglement) within microseconds due to environmental noise. Most students learn this as a dry fact in a textbook. I wanted to make it *visual* and *interactive*.

So I built a browser-based lab where you can:
- Watch a qubit decay on a Bloch sphere in real time
- Tweak noise parameters with sliders and see the effect live
- Run classic quantum experiments (Bell state, BB84, Deutsch algorithm, etc.)
- Compare quantum vs classical info under the same noise model
- Build your own circuits gate by gate

It's not perfect — the gate builder in particular was a pain to get right — but overall pretty happy with how it came out.

## Pages

| Route | What it does |
|-------|------|
| `/` | Landing / home |
| `/fragility-lab` | Main lab — Bloch sphere + noise sliders |
| `/quantum-vs-classical` | Qubit vs classical bit decay comparison |
| `/gate-builder` | Drag-and-drop circuit builder |
| `/qiskit-visualizer` | Visualize Qiskit-style JSON circuits |
| `/qasm-visualizer` | Parse + visualize OpenQASM 2.0 |
| `/experiments` | All experiments |
| `/experiments/stern-gerlach` | Stern-Gerlach spin measurement |
| `/experiments/bell-state` | Bell state correlations |
| `/experiments/ghz-state` | 3-qubit GHZ entanglement |
| `/experiments/deutsch` | Deutsch algorithm demo |
| `/experiments/bb84` | BB84 quantum key distribution |
| `/learn` | Theory + quiz |

## Tech stack

Frontend is React 18 + TypeScript with Vite. I used Tailwind for styling and Framer Motion for animations. Three.js handles the 3D Bloch sphere.

Backend is just a small Express server (Node + TypeScript) that handles the quantum simulation math and the Gemini AI chatbot integration. Could probably have done the sim on the frontend but it felt cleaner to keep it server-side.

## Running locally

You'll need Node 18+ and npm.

```bash
npm install
```

Then start both frontend and backend together:

```bash
npm run dev:full
```

Frontend runs at http://localhost:5173, backend at http://localhost:4000.

Or run them separately if you want:
```bash
npm run server   # backend
npm run dev      # frontend (separate terminal)
```

### Environment variables

Copy `.env.example` to `.env` and fill in your Gemini API key if you want the AI assistant to work:

```bash
cp .env.example .env
```

Without the key the chat button just won't respond — everything else works fine.

## API

The backend exposes a few endpoints for the experiment simulations:

```
GET  /health
POST /api/experiments/bell      { shots }
POST /api/experiments/ghz       { shots }
POST /api/experiments/deutsch   { functionId }
POST /api/experiments/bb84      { rounds, withEve }
POST /api/chat                  { message, history }
```

## Project layout

```
├── server/
│   ├── index.ts        # Express routes
│   └── quantumSim.ts   # simulation math
├── src/
│   ├── api/            # API calls to backend
│   ├── components/     # shared UI components
│   ├── hooks/
│   ├── routes/         # page components
│   │   └── Experiments/
│   └── types/
├── vite.config.ts
└── package.json
```

## Known issues / things I'd fix if I had more time

- The QASM parser is pretty basic — it handles common gates but will choke on more complex programs
- Gate builder undo history is limited to 20 steps
- Mobile layout on the Bloch sphere page is a bit cramped

## Acknowledgements

Nielsen & Chuang "Quantum Computation and Quantum Information" was basically my bible for the simulation math. Qiskit's documentation also helped a lot for understanding the standard gate definitions.
