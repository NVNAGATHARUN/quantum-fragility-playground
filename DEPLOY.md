# Deployment notes

Frontend on Vercel, backend on Render.

Currently deployed at:
- https://quantum-fragility-playground.vercel.app (frontend)
- Render backend (free tier — might be slow on first request after idle)

## Backend (Render)

1. New Web Service → connect this repo
2. Settings:
   - Environment: Node
   - Build: `npm install && npm run server:build`
   - Start: `npm run server:start`
3. Env vars to set:
   - `PORT=4000`
   - `GEMINI_API_KEY=...`
   - `ALLOWED_ORIGIN=https://your-vercel-url.vercel.app`

## Frontend (Vercel)

1. Import repo → Vite preset
2. Env vars:
   - `VITE_API_BASE_URL=https://your-render-url.onrender.com`
3. Deploy

## After deploying

Update `ALLOWED_ORIGIN` on Render with the actual Vercel URL, then redeploy the backend so CORS works.

Note: Render free tier spins down after 15 min of inactivity. First request will be slow. Not ideal but fine for a demo.
