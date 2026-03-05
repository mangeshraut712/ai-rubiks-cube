# AI Rubik's Cube Suite (2026)

One repository, two complete Rubik's Cube projects:

1. **Gemini Live Tutor** (multimodal voice + vision coaching)
2. **Classic 2x2 Solver** (BFS / A* / IDA* with interactive 3D)

## Live Links

- Repo: https://github.com/mangeshraut712/ai-rubiks-cube
- Gemini frontend (Vercel): https://ai-rubiks-cube.vercel.app/
- Gemini backend health (Cloud Run): https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/health
- Classic 2x2 route: `https://ai-rubiks-cube.vercel.app/legacy-2x2-solver/index.html` (requires latest Vercel deploy from current `main`)

## Projects At A Glance

| Project            | Purpose                                 | Runtime                                | Source Path                         |
| ------------------ | --------------------------------------- | -------------------------------------- | ----------------------------------- |
| Gemini Live Tutor  | Real-time AI coach that sees and speaks | React + Node + WebSocket + Gemini Live | `frontend/src`, `backend/src`       |
| Classic 2x2 Solver | Deterministic 2x2 solving playground    | Static browser app (Three.js)          | `frontend/public/legacy-2x2-solver` |

## 2026 Stack (Current)

### Frontend

- React `18.3.1`
- Vite `7.1.3`
- Three.js `0.179.1`
- Tailwind CSS `4.1.13` (`@tailwindcss/vite`)

### Backend

- Node.js `>=20`
- Express `4.21.2`
- `ws` `8.18.3`
- Google GenAI SDK `@google/genai` `1.43.0`
- Kociemba solver `1.0.1`

### Cloud

- Cloud Run
- Cloud Build
- Artifact Registry
- Secret Manager
- Terraform

## Project A: Gemini Live Tutor

### Highlights

- Real-time webcam frame streaming + microphone streaming
- Bidirectional audio responses via Gemini Live
- Low-latency WebSocket architecture
- Deterministic cube-state grounding to reduce hallucinations
- 3D cube visualization synchronized with tutor guidance

### Local Run

1. Create local env file:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm ci --prefix backend
npm ci --prefix frontend
```

3. Start backend (terminal 1):

```bash
cd backend
npm run dev
```

4. Start frontend (terminal 2):

```bash
cd frontend
npm run dev
```

5. Open `http://localhost:5173`

Optional single-command launcher:

```bash
./scripts/start-gemini.sh
```

## Project B: Classic 2x2 Solver

### Highlights

- 2x2x2 state-space solving
- Bidirectional BFS for fast practical solves
- A* and IDA* variants for algorithm comparison
- Interactive 3D cube visualization

### Local Run

1. Install frontend dependencies:

```bash
npm ci --prefix frontend
```

2. Start frontend dev server:

```bash
npm run dev --prefix frontend
```

3. Open:

`http://localhost:5173/legacy-2x2-solver/index.html`

Optional launcher:

```bash
./scripts/start-core.sh
```

## Environment Variables

### Backend / Runtime

| Variable                | Description                         | Required                      |
| ----------------------- | ----------------------------------- | ----------------------------- |
| `GEMINI_API_KEY`        | Gemini API key                      | Yes (unless `DEMO_MODE=true`) |
| `DEMO_MODE`             | Demo fallback mode                  | No                            |
| `PORT`                  | Backend port (default `8080`)       | No                            |
| `CORS_ORIGIN`           | Allowed origins list                | No                            |
| `FRONTEND_REDIRECT_URL` | Optional redirect for Cloud Run `/` | No                            |
| `GEMINI_LIVE_MODEL`     | Live model ID                       | No                            |
| `GEMINI_FALLBACK_MODEL` | Fallback model ID                   | No                            |

### Frontend Build (Vercel)

| Variable              | Description                     | Required |
| --------------------- | ------------------------------- | -------- |
| `VITE_BACKEND_ORIGIN` | Backend origin used by frontend | Yes      |
| `VITE_WS_URL`         | Explicit WebSocket URL override | Optional |

Recommended Vercel values:

- `VITE_BACKEND_ORIGIN=https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app`
- `VITE_WS_URL=wss://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/ws`

## Deployment

### Gemini Backend (Cloud Run)

```bash
./deploy.sh YOUR_GCP_PROJECT_ID
```

### Frontend (Vercel)

- Build configuration is in `vercel.json`
- Static 2x2 assets are served from `frontend/public/legacy-2x2-solver`

If `/legacy-2x2-solver/index.html` returns 404 on Vercel, trigger a fresh Vercel redeploy from current `main`.

## Verification

### Gemini backend

```bash
curl -fsS https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/health
```

Expected:

```json
{ "status": "ok", "model": "gemini-live" }
```

### Classic 2x2 route

Open locally:

- `http://localhost:5173/legacy-2x2-solver/index.html`

Open on Vercel:

- `https://ai-rubiks-cube.vercel.app/legacy-2x2-solver/index.html`

## Repository Structure

```text
.
├── backend/
│   ├── src/
│   └── cache/
├── frontend/
│   ├── src/
│   └── public/legacy-2x2-solver/
├── scripts/
│   ├── security-check.sh
│   ├── start-gemini.sh
│   ├── start-core.sh
│   └── clean-workspace.sh
├── docs/
│   └── PROJECT_STRUCTURE.md
├── terraform/
├── cloudbuild.yaml
├── deploy.sh
├── vercel.json
├── .gcloudignore
├── Dockerfile
└── .env.example
```

## Workspace Hygiene

- Keep only source, infra, and config in git.
- Local artifacts should stay untracked: `node_modules`, `dist`, logs, `.runtime`.
- Clean local artifacts when needed:

```bash
./scripts/clean-workspace.sh
```

## Security Gate

```bash
./scripts/security-check.sh --scope prompt --context "summary"
./scripts/security-check.sh --scope commit
./scripts/security-check.sh --scope push
./scripts/security-check.sh --scope deploy
```
