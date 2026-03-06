# AI Rubik's Tutor

Gemini Live Agent Challenge project upgraded around a 2026-style stack: React 19.2, React Router 7, Vite 7, Tailwind 4.2, Express 5.2, Zod 4, and the current Google Gen AI SDK.

The product now behaves like one routed application instead of one page plus side experiments:

- `/` home and product story
- `/live` routed live coaching workspace
- `/labs/multiplayer` routed multiplayer lab
- `/classic` redirect to the legacy 2x2 solver
- `/api/health` and `/api/runtime` backend system endpoints

## Live URLs

- Frontend: https://ai-rubiks-cube.vercel.app/
- Backend health: https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/health
- Runtime metadata: https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/api/runtime
- Legacy 2x2 solver: https://ai-rubiks-cube.vercel.app/legacy-2x2-solver/index.html

## What The Current Build Showcases

- Gemini Live tutoring with voice, webcam frames, transcript memory, and move playback
- Routed navigation across home, live workspace, multiplayer lab, and classic solver
- Theme-aware UI shared across the main app and the legacy solver
- Route-loader runtime metadata so the frontend can surface backend capability state
- WebSocket tutor transport plus WebRTC multiplayer signaling
- Backend hardening with `helmet`, compression, rate limiting, payload validation, and audit checks
- Backend route tests for the new system endpoints

## Recent Modernization Pass

- Upgraded frontend runtime to React 19.2, React Router 7, Vite 7, Tailwind 4.2, Framer Motion 12, Three.js 0.183, Zustand 5, and Vitest 4
- Upgraded backend runtime to Express 5.2, Google Gen AI SDK 1.44, Zod 4, `ws` 8.19, `express-rate-limit` 8, and Vitest 4
- Removed the legacy `@google/generative-ai` dependency and migrated hint generation to `@google/genai`
- Added `/api/runtime` and `/api/health` for capability discovery and frontend route loading
- Added routing for `/live`, `/labs/multiplayer`, and `/classic`
- Added signaling heartbeat cleanup and environment-driven ICE server config for multiplayer
- Removed client-side `uuid` dependency in favor of `crypto.randomUUID()`
- Kept production sourcemaps opt-in with `VITE_SOURCEMAP=true`

## Repository Layout

```text
.
├── .github/workflows/              # CI and Vercel deployment workflows
├── backend/
│   ├── package.json
│   └── src/
│       ├── cubeStateManager.js
│       ├── geminiLiveClient.js
│       ├── runtimeInfo.js
│       ├── routes/
│       │   ├── systemRoutes.js
│       │   └── systemRoutes.test.js
│       ├── server.js
│       ├── signalingServer.js
│       └── tutorPrompt.js
├── docs/
│   └── FEATURES.md
├── frontend/
│   ├── package.json
│   ├── public/
│   │   └── legacy-2x2-solver/
│   └── src/
│       ├── components/
│       ├── content/
│       ├── hooks/
│       ├── router.jsx
│       ├── store/
│       ├── test/
│       ├── utils/
│       │   ├── runtimeApi.js
│       │   └── theme.js
│       └── wasm/
├── scripts/
│   ├── clean-workspace.sh
│   ├── security-check.sh
│   ├── start-core.sh
│   └── start-gemini.sh
├── SECURITY.md
├── cloudbuild.yaml
├── deploy.sh
└── vercel.json
```

## Tech Stack

### Frontend

- React 19.2
- React Router 7
- Vite 7
- Tailwind CSS 4.2
- Framer Motion 12
- Three.js 0.183
- Zustand 5
- Vitest 4

### Backend

- Node.js 22+
- Express 5.2
- Google Gen AI SDK 1.44
- `ws` 8.19
- Zod 4
- `express-rate-limit` 8

### Deployment

- Vercel for the frontend
- Google Cloud Run for the backend
- GitHub Actions for CI and optional Vercel deployment

## Route And API Surface

### Frontend routes

- `/`
- `/live`
- `/labs/multiplayer`
- `/classic`
- `/legacy-2x2-solver/index.html`

### Backend HTTP routes

- `/health`
- `/api/health`
- `/api/runtime`

### WebSocket routes

- `/ws` for live tutor transport
- `/multiplayer` for WebRTC signaling

## Local Development

### Prerequisites

- Node.js 22+
- npm 10+
- Gemini API key for live tutoring

### Install

```bash
npm ci --prefix backend
npm ci --prefix frontend
```

### Environment

Start from the checked-in template:

```bash
cp .env.example .env
```

Minimum local values:

```bash
PORT=8080
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
GEMINI_LIVE_MODEL=gemini-live-2.5-flash-preview
GEMINI_FALLBACK_MODEL=gemini-2.5-flash
DEMO_MODE=false
VITE_BACKEND_ORIGIN=http://localhost:8080
```

Useful optional values:

```bash
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
FRONTEND_REDIRECT_URL=
VITE_SIGNALING_SERVER=ws://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws
VITE_ICE_SERVERS_JSON=[{"urls":"stun:stun.l.google.com:19302"}]
VITE_SOURCEMAP=true
```

### Run both apps

```bash
./scripts/start-gemini.sh
```

Or separately:

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

Open:

- `http://localhost:5173`
- `http://localhost:5173/live`
- `http://localhost:5173/labs/multiplayer`
- `http://localhost:5173/legacy-2x2-solver/index.html`

### Legacy 2x2 only

```bash
./scripts/start-core.sh
```

### Clean local artifacts

```bash
./scripts/clean-workspace.sh
```

## Quality And Security Checks

### Frontend

```bash
cd frontend
npm run lint
npm run test -- --run
npm run build
```

### Backend

```bash
cd backend
npm run lint
npm run test -- --run
```

Current backend tests cover the system route module.

### Security gate

```bash
./scripts/security-check.sh --scope deploy
```

This checks:

- required backend protections
- `npm audit` in `backend/` and `frontend/`
- deployment-related environment requirements
- security documentation coverage

## Deployment

### Vercel frontend

`vercel.json` is configured for the repo root:

- Install command: `cd frontend && npm ci --cache /tmp/.npm --prefer-online`
- Build command: `cd frontend && npm run build`
- Output directory: `frontend/dist`

Important frontend environment variables:

- `VITE_BACKEND_ORIGIN`
- `VITE_WS_URL`
- `VITE_SIGNALING_SERVER`
- `VITE_ICE_SERVERS_JSON` for TURN/STUN configuration when needed

Manual deploy:

```bash
vercel --prod
```

### Cloud Run backend

```bash
gcloud builds submit --config cloudbuild.yaml
```

Or:

```bash
./deploy.sh
```

### GitHub Actions

This repo includes:

- `.github/workflows/ci.yml`
- `.github/workflows/vercel-deploy.yml`

For automatic Vercel deploys from GitHub Actions, configure:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Notes

- The main app now uses route-based navigation but still preserves the live-session workspace model
- The legacy 2x2 solver is still present for comparison and demos, but it is now connected back into the modern app flow
- Localhost clears stale PWA/service-worker artifacts on boot to reduce dev mismatch issues
- Production source maps are intentionally disabled by default and can be enabled explicitly with `VITE_SOURCEMAP=true`

## License

MIT
