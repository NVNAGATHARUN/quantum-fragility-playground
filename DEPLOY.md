# Deployment Notes — Quantum Lens AI

Quantum Lens AI is designed for multi-target deployment (Vercel, Render, Docker, or bare metal).

## Repository
- GitHub: `https://github.com/NVNAGATHARUN/gst-qlp.git`

## Architecture Targets
1. **Frontend (Vercel / Nginx):**
   - Built via Vite (`npm run build`).
   - Serves static SPA from `dist/`.
   - Proxies `/api/*` requests to the FastAPI / Qiskit backend.

2. **Backend (FastAPI / Qiskit Aer):**
   - High-performance asynchronous Python 3.11 server.
   - Run command: `uvicorn backend.app.main:app --host 0.0.0.0 --port 8000`
   - Real-time Qiskit Aer 0.17.2 density matrix simulation and circuit IR validation.

3. **1-Command Production Container (Docker Compose):**
   ```bash
   docker-compose up --build -d
   ```
   - Frontend: `http://localhost`
   - Backend API: `http://localhost:8000`
   - API Docs: `http://localhost:8000/docs`
