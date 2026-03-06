# AI Rubik's Tutor 2026

<div align="center">
  <img src="docs/assets/logo.png" width="180" alt="AI Rubik's Tutor Logo" />
  <h3>The future of 3D cognitive training, powered by Gemini 2.x Live.</h3>
  
  [![Vite](https://img.shields.io/badge/vite-7-646CFF?logo=vite)](https://vitejs.dev)
  [![React](https://img.shields.io/badge/react-19-61DAFB?logo=react)](https://react.dev)
  [![Tailwind CSS](https://img.shields.io/badge/tailwind-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
  [![GCP](https://img.shields.io/badge/GCP-Cloud_Run-4285F4?logo=google-cloud)](https://cloud.google.com/run)
  [![Gemini](https://img.shields.io/badge/Gemini-2.5_Live-8E75B2?logo=google-gemini)](https://deepmind.google/technologies/gemini/)
</div>

---

## 🚀 One Repo. Two Intelligent Worlds.

AI Rubik's Tutor is a unified 2026 workspace that bridges high-level AI coaching with low-level deterministic logic. It's not just a solver; it's a **cognitive partner**.

### 🎙️ [Part 1: Gemini Live Tutor](/#part-1)
> **Coaching through companionship.**
> A realtime 3x3 coaching engine. It sees your physical cube via webcam, listens to your questions, and guides you to victory with voice, move-specific hints, and a shared 3D stage.
- **Vibe:** Realtime • Human-centric • Multi-modal.
- **Routes:** `/`, `/live`, `/multiplayer`.

### 🧪 [Part 2: Cubey Core Lab](/#part-2)
> **The science of the solve.**
> A deterministic 2x2 lab built on a shared 24-sticker state model. It handles the heavy lifting of BFS, A*, and IDA* algorithms with exact frame-by-frame solve playback.
- **Vibe:** Exact • Explorable • Algorithmic.
- **Routes:** `/part-2`, `/legacy-solver/index.html`.

---

## ✨ 2026 Feature Deck

| Feature | Description | Tech |
| :--- | :--- | :--- |
| **Multimodal Vision** | Realtime webcam frame analysis to verify physical cube state. | Gemini 2.x Flash + Canvas |
| **Voice Interruption** | Seamlessly "barge in" during tutor guidance. | WebRTC + PCM Audio |
| **Multiplayer Racing** | P2P Rubik's Cube races with shared scramble state. | WebRTC Signaling Server |
| **Unified UI** | A premium "Glassmorphic" interface across both parts. | Tailwind 4 + Framer Motion |

---

## 🛠️ The 2026 Tech Stack

### Frontend Architecture
- **Framework:** React 19 (Concurrent Rendering)
- **Tooling:** Vite 7 (Instant HMR)
- **Styling:** Tailwind CSS 4 (Modern CSS Engine)
- **3D Engine:** Three.js 0.183 (Physical Material Render)
- **State:** Zustand 5 (Persistent Storage)

### Backend Services
- **Runtime:** Node.js 22 (LTS)
- **Core:** Express 5 (Asynchronous Logic)
- **AI Integration:** Google GenAI SDK (`gemini-live-2.5-flash-preview`)
- **Transport:** WebSocket (`ws`) for low-latency feedback.

---

## 🏗️ Technical Architecture

```mermaid
flowchart TD
    subgraph Client ["Client (Browser)"]
        A[React 19 Shell]
        B[Three.js Workspace]
        C[WebRTC / Mic / Camera]
    end

    subgraph GCP ["Google Cloud (Production)"]
        D[Cloud Run Service]
        E[Secret Manager]
        F[Artifact Registry]
    end

    subgraph AI ["AI Services"]
        G[Gemini Live API]
        H[Kociemba Algorithm]
    end

    A <-->|WebSocket /ws| D
    A <-->|Multiplayer| D
    D <-->|API Key| E
    D <-->|Voice/Vision| G
    D <-->|Logic| H
```

---

## 🚦 Getting Started

### 1. Installation
```bash
npm ci --prefix backend
npm ci --prefix frontend
```

### 2. Environment Setup
Create a `.env` in the root (use `.env.example` as a template):
```env
GEMINI_API_KEY=AIza...
VITE_BACKEND_ORIGIN=http://localhost:8080
DEMO_MODE=false
```

### 3. Launch the Experience
```bash
# Start both Backend & Frontend in one go
./scripts/start-gemini.sh
```
Explore the workspace at `http://localhost:5173`.

---

## 📦 Deployment & Cloud Native

This project is optimized for **Google Cloud Platform**. The entire repo ships as a single integrated container.

```bash
# Deploy instantly to Cloud Run
./deploy.sh <PROJECT_ID>
```

**What happens under the hood:**
- Build system compiles React 19 optimized chunks.
- Docker multi-stage build bundles assets into an Express 5 runtime.
- Automated secret wiring via Secret Manager.
- Real-time smoke tests verify health and runtime stability.

---

## 🎖️ Devpost Submission Pack
Everything for the **Gemini Live Agent Challenge 2026** is pre-packaged:
- **Project Docs:** [`/submission/devpost-2026/`](/submission/devpost-2026/)
- **Health:** [`/health`](https://gemini-rubiks-tutor-906543212291.us-central1.run.app/health)
- **Architecture:** `docs/ARCHITECTURE.md`

---

<div align="center">
  <p>Made with ❤️ for the Gemini Live Agent Challenge 2026</p>
  <b>Author: Mangesh Raut</b>
</div>
