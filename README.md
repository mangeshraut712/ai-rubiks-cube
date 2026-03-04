# Gemini Rubik's Tutor 🤖🧩

AI-powered Rubik's Cube tutoring with Google Gemini Live API - real-time voice + vision interaction.

<p align="center">
  <a href="https://gemini.google.com/">
    <img src="https://img.shields.io/badge/Gemini-Live API-blueviolet" alt="Gemini Live API">
  </a>
  <a href="https://react.dev/">
    <img src="https://img.shields.io/badge/Frontend-React-61DAFB" alt="React">
  </a>
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/Backend-Node.js-339933" alt="Node.js">
  </a>
  <a href="https://cloud.google.com/run">
    <img src="https://img.shields.io/badge/Cloud-Google Cloud Run-4285F4" alt="Cloud Run">
  </a>
</p>

- ✅ **Category:** Live Agents (Real-time Audio/Vision Interaction)
- ✅ **Technology:** Gemini Live API with `@google/genai` SDK
- ✅ **Cloud Platform:** Google Cloud Run (see [`terraform/`](terraform/) and [`cloudbuild.yaml`](cloudbuild.yaml))
- ✅ **Contest Deployment Profile:** `contest/.env.judges.example` + `contest/deploy-cloud-run.sh`

---

## 🧩 Two Projects In One Repo

| Project | Purpose | Entry Point |
|---------|---------|-------------|
| **Core Project** | Original production-focused Gemini Rubik's Tutor flow | [`projects/core/README.md`](projects/core/README.md) |
| **Challenge Contest Project** | Contest-focused packaging, checklist, and deployment profile | [`projects/challenge/README.md`](projects/challenge/README.md) |

Quick launch:

```bash
./scripts/start-core.sh
./scripts/start-challenge.sh
```

---

## 📦 Submission Assets

- Google Cloud IaC proof: [`terraform/main.tf`](terraform/main.tf), [`cloudbuild.yaml`](cloudbuild.yaml), [`deploy.sh`](deploy.sh)
- Contest profile: [`contest/.env.judges.example`](contest/.env.judges.example), [`contest/deploy-cloud-run.sh`](contest/deploy-cloud-run.sh)
- Project split docs: [`projects/core/README.md`](projects/core/README.md), [`projects/challenge/README.md`](projects/challenge/README.md)
- Submission checklist: [`DEVPOST_SUBMISSION_CHECKLIST.md`](DEVPOST_SUBMISSION_CHECKLIST.md)
- Blog draft for bonus content: [`devpost-blog-post.md`](devpost-blog-post.md)

## 🧾 Devpost-Ready Artifacts (Fill Before Final Submit)

- **Demo video** (YouTube/Vimeo, up to 4 minutes): `TODO: Add URL Here`
- **Public code repository URL**: `TODO: Add URL Here`
- **Published blog/article** with `#GeminiLiveAgentChallenge`: `TODO: Add URL Here`
- **Live Cloud Run API URL**: `TODO: Add URL Here`
  - *How to verify:* Open your terminal and run `curl -fsS https://<YOUR-CLOUD-RUN-URL>/health`. It will return `{"status":"ok","model":"gemini-live"}` proving it is actively running.
- **Architecture diagram location**: See the [Architecture Diagram](#%EF%B8%8F-architecture-diagram) section below.

---

## 🌟 Features

| Feature | Description |
|---------|-------------|
| **Live Multimodal** | Real-time audio + video streaming via Gemini Live API ("See, Hear, Speak") |
| **Auto Solve Agent** | Step-by-step 3D animated solving with real-time voice coaching |
| **Distinct Persona** | "Cubey": An encouraging, playful, and patient AI tutor |
| **Voice Interaction** | Natural conversation about cube solving (handles interruptions gracefully) |
| **3D Visualization** | Interactive Three.js Rubik's Cube synchronized with voice |
| **Grounding & State** | Uses Kociemba algorithms to verify cube state, strictly preventing hallucinations |
| **Challenge Mode** | Timed solve challenges with scoring and random scrambles |
| **Premium UI** | Frost glassmorphism design with Google-inspired typography |
| **Security Tested** | Validated against the Vibe Coding Security framework (`SECURITY.md`) |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- Gemini API Key (optional for demo mode)

### Installation

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### Running Locally

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Open http://localhost:5173

Or run from repo root with project wrappers:

```bash
# Original core project
./scripts/start-core.sh

# Challenge contest profile
./scripts/start-challenge.sh
```

### Real Gemini Mode vs Demo Mode

- `DEMO_MODE=false`: real Gemini Live Agent (voice + multimodal coaching).
- `DEMO_MODE=true`: local demo fallback (text guidance, no real Gemini voice stream).

If you see transcript text like `Demo mode enabled`, you are not using the real Gemini session.

### Demo Mode (No API Key)

```bash
# Set demo mode
export DEMO_MODE=true

# Or use contest profile
cp contest/.env.judges.example .env
```

---

## Troubleshooting

### "Connection lost... ws://localhost:5173/ws"

Your backend is not reachable from frontend. Make sure backend is running on `:8080`:

```bash
curl http://localhost:8080/health
```

If this fails, restart backend and frontend.

### No Gemini voice/audio

1. Set `DEMO_MODE=false` in `.env`.
2. Set a valid `GEMINI_API_KEY`.
3. Restart backend and frontend after env changes.
4. In browser, click `Start Session` and allow microphone/camera.

---

## 📁 Project Structure

```
Gemini-Rubiks-Tutor/
├── projects/
│   ├── core/                 # Original core project profile
│   │   └── README.md
│   └── challenge/            # Contest project profile
│       └── README.md
├── backend/                  # Express + WebSocket server
│   ├── src/
│   │   ├── server.js         # Main server
│   │   ├── geminiLiveClient.js
│   │   ├── cubeStateManager.js
│   │   └── tutorPrompt.js
│   └── package.json
├── frontend/                  # React + Vite app
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── LiveSession.jsx
│   │   │   ├── CubeViewer.jsx
│   │   │   └── StatusBar.jsx
│   │   └── main.jsx
│   └── package.json
├── contest/                   # Contest profile
│   ├── .env.judges.example
│   └── deploy-cloud-run.sh
├── scripts/                  # Wrapper commands for both projects
│   ├── start-core.sh
│   ├── start-challenge.sh
│   └── deploy-challenge.sh
├── terraform/                 # Infrastructure
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── cloudbuild.yaml           # CI/CD
├── deploy.sh                # Deployment script
└── Dockerfile               # Container image
```

---

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 8080) | No |
| `GEMINI_API_KEY` | Google Gemini API key | Yes* |
| `DEMO_MODE` | Enable demo mode (default: false) | No |
| `CORS_ORIGIN` | Comma-separated allowlist (supports `https://*.run.app`) | No |
| `GEMINI_LIVE_MODEL` | Primary Gemini Live model | No |
| `GEMINI_FALLBACK_MODEL` | One-shot fallback model for hints | No |

*Required unless `DEMO_MODE=true`

---

## 🔐 Security Gate

- Security checklist: [`SECURITY.md`](SECURITY.md)
- Agent guardrail: [`AGENTS.md`](AGENTS.md)
- Automated gate script: `./scripts/security-check.sh`
- Security memory log: `.runtime/security-memory.log`

Enable commit/push hooks once per clone:

```bash
./scripts/install-git-hooks.sh
```

Manual checks:

```bash
./scripts/security-check.sh --scope prompt --context "short summary of current request"
./scripts/security-check.sh --scope commit
./scripts/security-check.sh --scope push
./scripts/security-check.sh --scope deploy
```

---

## ☁️ Cloud Deployment (Monorepo Setup)

This project is a monorepo containing both the React frontend and the Express/WebSocket backend. Because Vercel Serverless Functions do **not** support continuous WebSockets (required for the Gemini Live API), you must deploy the services separately:

### 1. Backend: Google Cloud Run (WebSockets)
The backend must be hosted on a platform that supports long-lived WebSockets without timeout constraints.

```bash
# Using deploy script
# Optional overrides (recommended for production):
# export CORS_ORIGIN_VALUE="https://your-frontend-domain.com,https://*.run.app"
# export DEMO_MODE_VALUE=false
./deploy.sh YOUR_GCP_PROJECT_ID

# Manual
gcloud builds submit --config cloudbuild.yaml
gcloud run deploy gemini-rubiks-tutor \
  --image gcr.io/$PROJECT_ID/gemini-rubiks-tutor \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

*(Once deployed, copy your Cloud Run URL. e.g., `https://gemini-rubiks-tutor-xxxxxx.a.run.app`)*

### 2. Frontend: Vercel or GitHub Pages
You can deploy the Vite React frontend directly from this GitHub repository to Vercel using the provided `vercel.json` configuration.

**Vercel Deployment:**
1. Import this repository into Vercel.
2. Vercel will automatically read the `vercel.json` to build the `frontend/` directory.
3. In your Vercel Project Settings -> Environment Variables, add:
   - `VITE_BACKEND_ORIGIN` = `https://your-cloud-run-backend-url.run.app` (This tells the frontend where the WebSocket server is located).

**GitHub Pages Deployment:**
Update `base` in `frontend/vite.config.js` to your repo name, run `npm run build`, and push the `dist/` folder to your `gh-pages` branch.

Contest deployment shortcut:

```bash
./scripts/deploy-challenge.sh YOUR_GCP_PROJECT_ID
```

---

## 🎯 Contest Requirements & Judging Criteria Coverage

### Innovation & Multimodal User Experience (40%)
- ✅ **Breaking the Text Box Paradigm:** Moves completely beyond text by allowing users to physically hold a puzzle and talk hands-free.
- ✅ **See, Hear, and Speak:** Employs the webcam (`image/jpeg` sampling), microphone, and speakers for a fully continuous multimodal loop.
- ✅ **Distinct Persona:** Programmed with "Cubey," a patient, encouraging tutor character that makes learning fun.
- ✅ **Interruption Handling:** Native Live API barge-in capabilities allow the user to interrupt the solver naturally if they make a mistake.

### Technical Implementation & Agent Architecture (30%)
- ✅ **Google Cloud & SDKs:** Built natively with `@google/genai` SDK and fully hosted on Google Cloud Run.
- ✅ **Grounding & Avoiding Hallucinations:** The physical cube state is verified continuously against a deterministic mathematical algorithm (Kociemba). Gemini coaches *based on this structured state*, entirely eliminating AI movement hallucinations.

### Bonus Points Status
- ✅ **Automated Cloud Infrastructure:** Fully orchestrated IaC provided in `terraform/`, paired with `cloudbuild.yaml` and `deploy.sh`.
- ⚠️ **Content Publication:** Draft prepared in [`devpost-blog-post.md`](devpost-blog-post.md). Publish on Medium/Dev.to and add the live link above to claim this bonus confidently.

---

## 🏗️ Architecture Diagram

```mermaid
graph TB
    User["User (Browser)"]
    Webcam["Webcam + Mic"]
    Frontend["React Frontend + Three.js"]
    Backend["Node.js Backend (Express + WS)"]
    GeminiLive["Gemini Live API"]
    SecretMgr["Secret Manager"]
    CloudBuild["Cloud Build / Deploy"]

    User --> Webcam
    Webcam --> Frontend
    Frontend -->|"WebSocket: audio + video frames"| Backend
    Backend -->|"@google/genai live.connect"| GeminiLive
    GeminiLive -->|"audio + text responses"| Backend
    Backend -->|"WebSocket tutor events"| Frontend
    SecretMgr -->|"GEMINI_API_KEY"| Backend
    CloudBuild -->|"build + deploy"| Backend
```

---

## 📋 Submission Checklist (Code Repo)

- ✅ Public repo includes full spin-up steps.
- ✅ Gemini model usage shown in code: [`backend/src/geminiLiveClient.js`](backend/src/geminiLiveClient.js).
- ✅ Google Cloud usage shown in code: [`terraform/main.tf`](terraform/main.tf), [`cloudbuild.yaml`](cloudbuild.yaml), [`deploy.sh`](deploy.sh).
- ✅ Architecture diagram included in this README.
- ✅ Health endpoint and runtime checks available (`GET /health`, WebSocket `/ws`).

---

## 📚 Findings, Learnings & Data Sources

**Findings & Data Sources**
- **Vision Limitations vs Ground Truth:** We found that depending solely on visual frame ingestion (`image/jpeg` at 4fps) to completely understand the mathematical state of a Rubik's cube led to LLM hallucinations, as small lighting changes could distort color perception. To fix this, we heavily utilized the **Kociemba Two-Phase Algorithm** repository to maintain a local ground truth matrix, feeding this structured data to Gemini as context alongside the visual feed.
- **Data Privacy & Ephemeral Sessions:** No persistent user data is recorded. Images processed by Gemini are done ephemerally via `ws` streaming protocols in the live connect session.

**Key Learnings**
- **Gapless Audio Buffering:** Real-time speech from Gemini arrives in small PCM chunks. We learned that using standard HTML5 `<audio>` tags caused stuttering, forcing us to use the browser `AudioContext` with precise packet time-scheduling for flawless gapless playback.
- **WebSockets on Serverless:** We learned Vercel Serverless Functions do not natively support stateful long-lived WebSockets. This requirement forced us into a split-monorepo design—putting the frontend on Vercel/GitHub Pages, and orchestrating the WebSocket backend precisely and securely on Google Cloud Run.

---

## 🔬 Technical Deep Dive

### Audio Processing

- WebRTC audio capture from browser
- PCM16LE raw audio encoding
- Streaming via Gemini Live API
- Voice Activity Detection (VAD)

### Video Processing

- Canvas frame capture at ~4fps with motion-based frame skipping
- JPEG compression for efficiency
- Multimodal content delivery to Gemini

### Cube State

- Kociemba algorithm for solution verification
- CFOP method tutoring (Cross → F2L → OLL → PLL)
- Real-time 3D rendering with Three.js

---

## 🙏 Acknowledgments

- [Google Gemini](https://gemini.google.com/) for Live API
- [Three.js](https://threejs.org/) for 3D rendering
- [Kociemba](https://github.com/hkociemba/RubiksCube-TwophaseSolver) for cube solving
