# AI Rubik's Tutor

Google Gemini Live Agent Challenge project for coaching a physical Rubik's Cube with voice, vision, transcript memory, and multiplayer experiments. The repo now contains two frontend experiences:

- A redesigned Google Labs-inspired live coaching workspace
- A legacy 2x2 solver that now follows the shared light/dark theme

## Live URLs

- Frontend: https://ai-rubiks-cube.vercel.app/
- Backend health: https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/health
- Legacy 2x2 solver: https://ai-rubiks-cube.vercel.app/legacy-2x2-solver/index.html

## What This Project Includes

- Live Gemini tutoring with webcam + microphone input
- Search-style coaching workspace with transcript memory and quick actions
- Theme-aware UI with shared light/dark preference across the main app and legacy solver
- 3D cube stage with move playback and auto-solve previews
- WebRTC multiplayer lobby for peer practice sessions
- PWA support for the frontend
- Backend hardening with `helmet`, compression, rate limiting, payload validation, and deploy-time audit checks

## Recent Cleanup And Performance Work

- Extracted frontend shell content and theme logic out of the main app file
- Lazy-loaded session-only and modal surfaces to reduce initial bundle pressure
- Fixed the responsive status strip so it respects the actual column width instead of viewport size
- Switched production sourcemaps to opt-in with `VITE_SOURCEMAP=true`
- Added deploy-time `npm audit` checks and stronger backend message validation

## Repository Layout

```text
.
├── .github/workflows/        # CI and Vercel deployment workflows
├── backend/
│   ├── package.json
│   └── src/
│       ├── cubeStateManager.js
│       ├── geminiLiveClient.js
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
│       │   ├── AppShellPrimitives.jsx
│       │   ├── CubeViewer.jsx
│       │   ├── LiveSession.jsx
│       │   ├── MultiplayerLobby.jsx
│       │   ├── Settings.jsx
│       │   ├── Statistics.jsx
│       │   ├── StatusBar.jsx
│       │   ├── Tutorial.jsx
│       │   └── TutorOverlay.jsx
│       ├── content/
│       │   └── appContent.js
│       ├── hooks/
│       ├── store/
│       ├── test/
│       ├── utils/
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

- React 19
- Vite 6
- Tailwind CSS 4
- Three.js
- Zustand
- Framer Motion
- Vitest + Testing Library

### Backend

- Node.js 22+
- Express 5
- `ws`
- Google GenAI / Gemini Live
- Zod

### Deployment

- Vercel for the frontend
- Google Cloud Run for the backend
- GitHub Actions for CI and optional Vercel production deployment

## Local Development

### Prerequisites

- Node.js 22+
- npm 10+
- A Gemini API key for live tutoring

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
DEMO_MODE=false
VITE_BACKEND_ORIGIN=http://localhost:8080
```

Useful optional values:

```bash
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
FRONTEND_REDIRECT_URL=
GEMINI_LIVE_MODEL=gemini-2.5-flash-native-audio-preview-09-2025
GEMINI_FALLBACK_MODEL=gemini-2.5-flash
```

### Run Both Apps

```bash
./scripts/start-gemini.sh
```

Or run them separately:

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

Open:

- `http://localhost:5173`
- `http://localhost:5173/legacy-2x2-solver/index.html`

### Legacy 2x2 Only

```bash
./scripts/start-core.sh
```

### Clean Local Artifacts

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

Note: backend tests currently exit cleanly but there are no backend test files yet.

### Security Gate

```bash
./scripts/security-check.sh --scope deploy
```

That script checks for:

- required backend protections
- `npm audit` in `backend/` and `frontend/`
- deployment-related environment requirements
- project security documentation coverage

## Deployment

### Vercel Frontend

`vercel.json` is already configured for the repo root:

- Install command: `cd frontend && npm ci --cache /tmp/.npm --prefer-online`
- Build command: `cd frontend && npm run build`
- Output directory: `frontend/dist`

Required frontend environment variables:

- `VITE_BACKEND_ORIGIN`
- `VITE_WS_URL` recommended
- `VITE_SIGNALING_SERVER` optional for multiplayer signaling

Manual deploy:

```bash
vercel --prod
```

If you want production source maps for a debugging build:

```bash
VITE_SOURCEMAP=true npm run build --prefix frontend
```

### Cloud Run Backend

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

For automatic Vercel deploys from GitHub Actions, configure these repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Product Notes

- The main workspace is optimized for live coaching first, not just puzzle solving
- The legacy solver is kept for comparison, demos, and classic control workflows
- Theme preference is shared between the new UI and the legacy page
- In development, localhost clears stale PWA artifacts on boot to reduce service worker mismatch issues

## License

MIT
