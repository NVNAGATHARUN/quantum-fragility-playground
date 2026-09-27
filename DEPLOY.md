# Deployment Notes — Quantum Lens AI

Quantum Lens AI is designed for multi-target deployment (Vercel, Render, Docker, or bare metal).

## Repository
- GitHub: `https://github.com/NVNAGATHARUN/gst-qlp.git`

## Architecture Targets
1. **Frontend (Vercel / Nginx):**
   - Built via Vite (`npm run build`).
   - Serves static SPA from `dist/`.
   - Proxies `/api/*` requests to the FastAPI / Qiskit backend.
   - For split hosting, set `VITE_API_BASE_URL` during the frontend build to the
     public backend origin. Every frontend API client resolves through this one
     setting. Docker/Nginx leaves it empty and uses the same-origin proxy.

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

## Repeatable Judge Demo State

Reset and seed a local student, instructor, classroom, assignment, failed
phase-interference attempt, and active misconception:

```powershell
backend\.venv\Scripts\python.exe backend\scripts\seed_demo.py --reset
```

The script prints the local demo credentials. Override its default password by
setting `QL_DEMO_PASSWORD` before running it. It only resets records belonging
to the dedicated demo learner.

Use `/health` for process liveness and `/health/ready` to verify database and
Qiskit Aer readiness before a demonstration.
