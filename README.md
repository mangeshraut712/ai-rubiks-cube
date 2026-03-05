# Gemini Rubik's Tutor

AI-powered Rubik's Cube tutoring with real-time voice + vision using Gemini Live API.

## Live Links

- Frontend (Vercel): https://ai-rubiks-cube.vercel.app/
- Backend health (Cloud Run): https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/health
- Repository: https://github.com/mangeshraut712/ai-rubiks-cube

## Features

- Real-time multimodal tutoring (camera + microphone + speech responses)
- WebSocket streaming for low-latency interaction
- Deterministic cube-state grounding with Kociemba solver
- 3D cube visualization with move-by-move guidance
- Challenge mode, move tracking, and session transcript

## Classic 2x2 Solver (Restored)

The original 2x2x2 Rubik's Cube solver (BFS/A*/IDA* + interactive 3D visualization) is available again in this repo:

- Source: `frontend/public/legacy-2x2-solver/`
- Local URL: `http://localhost:5173/legacy-2x2-solver/index.html`
- Production URL: `https://ai-rubiks-cube.vercel.app/legacy-2x2-solver/index.html`

## Tech Stack

- Frontend: React, Vite, Three.js
- Backend: Node.js, Express, ws
- AI: Google GenAI SDK (`@google/genai`)
- Cloud: Cloud Run, Cloud Build, Artifact Registry, Secret Manager
- IaC: Terraform

## Repository Structure

```text
.
├── backend/
│   ├── src/
│   ├── cache/
│   └── package.json
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── scripts/
│   └── security-check.sh
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── cloudbuild.yaml
├── deploy.sh
├── Dockerfile
├── vercel.json
└── .env.example
```

## Local Setup

### 1. Prerequisites

- Node.js 20+
- npm
- Gemini API key

### 2. Configure environment

```bash
cp .env.example .env
```

Set values in `.env`:

- `GEMINI_API_KEY=...`
- `DEMO_MODE=false` (or `true` for demo fallback)

### 3. Install dependencies

```bash
npm ci --prefix backend
npm ci --prefix frontend
```

### 4. Run locally

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev
```

Open http://localhost:5173

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `PORT` | Backend port (default `8080`) | No |
| `GEMINI_API_KEY` | Gemini API key | Yes (unless demo mode) |
| `DEMO_MODE` | `true`/`false` local demo behavior | No |
| `CORS_ORIGIN` | Allowed origins list (comma-separated) | No |
| `FRONTEND_REDIRECT_URL` | Optional redirect for Cloud Run root `/` to hosted frontend | No |
| `GEMINI_LIVE_MODEL` | Primary live model | No |
| `GEMINI_FALLBACK_MODEL` | Fallback hint model | No |
| `VITE_BACKEND_ORIGIN` | Frontend backend origin for Vercel build | Yes for Vercel |
| `VITE_WS_URL` | Optional explicit WebSocket URL | Optional |

## Deployment

### Backend (Google Cloud Run)

```bash
./deploy.sh YOUR_GCP_PROJECT_ID
```

This script:

- runs security checks
- builds container with Cloud Build
- pushes image to Artifact Registry
- deploys Cloud Run service with Secret Manager key

### Frontend (Vercel)

The project includes `vercel.json` and `.vercelignore` for frontend-only deployment.

Set Vercel env vars:

- `VITE_BACKEND_ORIGIN=https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app`
- `VITE_WS_URL=wss://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/ws` (optional)

## Verification

```bash
curl -fsS https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/health
```

Expected response:

```json
{"status":"ok","model":"gemini-live"}
```

## Security Check Script

```bash
./scripts/security-check.sh --scope prompt --context "short summary"
./scripts/security-check.sh --scope commit
./scripts/security-check.sh --scope push
./scripts/security-check.sh --scope deploy
```
