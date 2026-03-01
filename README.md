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

## 📦 Submission Assets

- Google Cloud IaC proof: [`terraform/main.tf`](terraform/main.tf), [`cloudbuild.yaml`](cloudbuild.yaml), [`deploy.sh`](deploy.sh)
- Contest profile: [`contest/.env.judges.example`](contest/.env.judges.example), [`contest/deploy-cloud-run.sh`](contest/deploy-cloud-run.sh)

---

## 🌟 Features

| Feature | Description |
|---------|-------------|
| **Live Multimodal** | Real-time audio + video streaming via Gemini Live API |
| **Voice Interaction** | Natural conversation about cube solving |
| **3D Visualization** | Interactive Three.js Rubik's Cube |
| **Smart Hints** | AI-generated contextual hints |
| **Challenge Mode** | Timed solve challenges with scoring |
| **Demo Mode** | Works without API key for testing |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
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

### Demo Mode (No API Key)

```bash
# Set demo mode
export DEMO_MODE=true

# Or use contest profile
cp contest/.env.judges.example .env
```

---

## 📁 Project Structure

```
Gemini-Rubiks-Tutor/
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

*Required unless `DEMO_MODE=true`

---

## ☁️ Cloud Deployment

### Google Cloud Run

```bash
# Using deploy script
./deploy.sh

# Manual
gcloud builds submit --config cloudbuild.yaml
gcloud run deploy gemini-rubiks-tutor \
  --image gcr.io/$PROJECT_ID/gemini-rubiks-tutor \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Terraform

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

---

## 🎯 Contest Requirements Coverage

- ✅ Live multimodal session (audio + video + WebSocket streaming)
- ✅ Interruption handling (`interrupt` flow)
- ✅ Challenge mode (scramble + guided race)
- ✅ Hint mode (visual hint response)
- ✅ Cloud deployment assets (`deploy.sh`, `cloudbuild.yaml`, `terraform/`)

---

## 🔬 Technical Deep Dive

### Audio Processing

- WebRTC audio capture from browser
- PCM16LE raw audio encoding
- Streaming via Gemini Live API
- Voice Activity Detection (VAD)

### Video Processing

- Canvas frame capture at 1fps
- JPEG compression for efficiency
- Multimodal content delivery to Gemini

### Cube State

- Kociemba algorithm for solution verification
- CFOP method tutoring (Cross → F2L → OLL → PLL)
- Real-time 3D rendering with Three.js

---

## 📄 License

MIT License - See LICENSE file for details.

---

## 🙏 Acknowledgments

- [Google Gemini](https://gemini.google.com/) for Live API
- [Three.js](https://threejs.org/) for 3D rendering
- [Kociemba](https://github.com/hkociemba/RubiksCube-TwophaseSolver) for cube solving
