# 🧩 Gemini Rubik's Tutor - AI Live Agent Challenge Entry

<p align="center">
  <img src="https://img.shields.io/badge/Gemini-Live%20API-blueviolet" alt="Gemini Live API">
  <img src="https://img.shields.io/badge/Google%20Cloud-Run-blue" alt="Google Cloud Run">
  <img src="https://img.shields.io/badge/React-18-blue" alt="React">
  <img src="https://img.shields.io/badge/Three.js-3D-orange" alt="Three.js">
  <img src="https://img.shields.io/badge/WebRTC-Real--time-green" alt="WebRTC">
</p>

> **Category:** Live Agents 🗣️ - Real-time Interaction (Audio/Vision)

An AI-powered Rubik's Cube tutoring application using Google Gemini's **Live API** with real-time voice and video streaming. The AI tutor "Cubey" sees your cube through the webcam and guides you step-by-step to solve it using the CFOP method.

---

## 🎯 Contest Submission Checklist

- ✅ **Category:** Live Agents (Real-time Audio/Vision Interaction)
- ✅ **Technology:** Gemini Live API with `@google/genai` SDK
- ✅ **Cloud Platform:** Google Cloud Run (see [`terraform/`](terraform/) and [`cloudbuild.yaml`](cloudbuild.yaml))
- ✅ **Architecture Diagram:** See [`docs/architecture-diagram.md`](docs/architecture-diagram.md)
- ✅ **Deployment Proof:** Infrastructure-as-code with Terraform
- ✅ **Devpost Submission Draft:** See [`docs/devpost-submission.md`](docs/devpost-submission.md)
- ✅ **<4 Min Demo Script:** See [`docs/demo-video-script.md`](docs/demo-video-script.md)

---

## 📦 Submission Assets

- Devpost text draft: [`docs/devpost-submission.md`](docs/devpost-submission.md)
- Demo video script (<4 min): [`docs/demo-video-script.md`](docs/demo-video-script.md)
- Architecture diagram source: [`docs/architecture-diagram.md`](docs/architecture-diagram.md)
- Google Cloud IaC proof: [`terraform/main.tf`](terraform/main.tf), [`cloudbuild.yaml`](cloudbuild.yaml), [`deploy.sh`](deploy.sh)
- Final pre-submit checklist: [`docs/contest-final-checklist.md`](docs/contest-final-checklist.md)
- Core vs contest branch workflow: [`docs/maintenance-workflow.md`](docs/maintenance-workflow.md)
- Standalone contest profile: [`contest/README.md`](contest/README.md)

---

## 🌟 Features

### Core Capabilities
| Feature | Description |
|---------|-------------|
| 🎙️ **Real-time Voice** | Natural conversation with interruptions support |
| 🎥 **Computer Vision** | AI analyzes Rubik's cube through webcam |
| 🧠 **Intelligent Tutoring** | CFOP method: Cross → F2L → OLL → PLL |
| 🏆 **Challenge Mode** | Race against AI to solve scrambled cubes |
| 🎮 **3D Visualization** | Interactive Three.js cube with move animations |
| 🔊 **Audio Playback** | Real-time AI voice responses |

### Technical Highlights
- **WebSocket** bidirectional streaming (audio chunks + video frames)
- **VAD (Voice Activity Detection)** with noise floor adaptation
- **Motion Detection** to optimize video bandwidth
- **Kociemba Solver** for solution verification
- **Rate Limiting & Connection Limits** for production stability

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))
- Google Cloud account (for deployment)

### Installation

```bash
# Clone and navigate to project
cd Gemini-Rubiks-Tutor

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies  
cd ../frontend && npm install

# Configure environment
cp ../.env.example ../.env
# Edit .env and add your GEMINI_API_KEY
```

### Running Locally

```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Start frontend  
cd frontend && npm run dev
```

Open http://localhost:5173 in your browser.

## 🚀 Easy Vercel Deployment

1. Import the repository into your Vercel dashboard.
2. Select the `frontend` directory as the Root Directory.
3. Use `npm run build` for the build command.
4. Set the `VITE_WS_URL` environment variable in Vercel to your deployed backend URL (e.g., `wss://your-cloud-run-url.a.run.app/ws`).
5. Vercel will follow the `vercel.json` routing rules automatically, and the application will be live!

## 🎲 Bonus: Legacy 2x2 AI Solver

We've also included our classic 2x2 Rubik's Cube solver (featuring Bidirectional BFS, A*, and IDA*) in the repository.
It is bundled into the frontend deployment and can be accessed via `http://localhost:5173/legacy-2x2-solver/index.html` (or your Vercel deployment URL + `/legacy-2x2-solver/`).

---

## ☁️ Google Cloud Deployment

### Option 1: Automated Deployment Script

```bash
# Make script executable and run
chmod +x deploy.sh
./deploy.sh YOUR_GCP_PROJECT_ID
```

### Contest Profile Deployment (Judge-Friendly Defaults)

```bash
chmod +x contest/deploy-cloud-run.sh
./contest/deploy-cloud-run.sh YOUR_GCP_PROJECT_ID
```

### Option 2: Cloud Build (CI/CD)

```bash
# Trigger Cloud Build
gcloud builds submit --config cloudbuild.yaml
```

### Option 3: Terraform (Infrastructure as Code)

```bash
cd terraform

# Initialize and apply
terraform init
terraform apply

# Set your Gemini API key in Secret Manager
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-
```

### Required GCP APIs
The deployment automatically enables:
- Cloud Run
- Cloud Build
- Secret Manager
- Artifact Registry

---

## 🎮 How to Use

1. **Start Session** - Click the "Start Session" button
2. **Allow Permissions** - Grant camera and microphone access
3. **Show Your Cube** - Position it clearly in front of the webcam
4. **Talk to Cubey** - The AI will detect your voice and guide you through moves
5. **Challenge Mode** - Click "Challenge Mode" to race against the AI!

### Demo Mode for Judges
Set `DEMO_MODE=true` in `.env` to test without a physical Rubik's cube:
```bash
# .env
DEMO_MODE=true
GEMINI_API_KEY=your_key_here
```

### Standalone Local Contest Run

```bash
cp contest/.env.judges.example .env
# set GEMINI_API_KEY in .env
chmod +x scripts/*.sh contest/*.sh
./scripts/run-contest-local.sh
```

`run-contest-local.sh` uses contest defaults (`PORT=8080`, `DEMO_MODE=true`, wildcard CORS) unless you override with `CONTEST_DEMO_MODE` / `CORS_ORIGIN_OVERRIDE`.

---

## 📡 API Reference

### WebSocket Protocol

**Client → Server Messages:**

| Type | Payload | Description |
|------|---------|-------------|
| `video_frame` | `{ data: base64 }` | Webcam frame capture |
| `user_text` | `{ text: string }` | Text message |
| `move_applied` | `{ move: "R" }` | User completed move |
| `interrupt` | `{}` | Interrupt AI speech |
| `hint_request` | `{ frame: base64 }` | Request visual hint |
| `challenge_mode` | `{ enabled: true }` | Toggle challenge |
| `solve_request` | `{}` | Get Kociemba solution |
| `end_session` | `{}` | Close connection |

**Server → Client Messages:**

| Type | Payload | Description |
|------|---------|-------------|
| `status` | `{ status, message }` | Connection status |
| `text_response` | `{ text, ts }` | AI tutor text |
| `audio_response` | `{ data, mimeType }` | AI voice audio |
| `move_instruction` | `{ move, face }` | Suggested move |
| `cube_state_update` | `{ cubeState }` | Current state |
| `challenge_update` | `{ enabled, scramble }` | Challenge status |

---

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google AI Studio API key | ✅ Yes |
| `GEMINI_LIVE_MODEL` | Model ID (default: `gemini-2.0-flash-live-preview-04-09`) | ❌ No |
| `GEMINI_FALLBACK_MODEL` | Fallback model (default: `gemini-2.0-flash-exp`) | ❌ No |
| `PORT` | Server port (default: 8080) | ❌ No |
| `CORS_ORIGIN` | Allowed origins | ❌ No |
| `DEMO_MODE` | Test mode without camera | ❌ No |
| `VITE_WS_URL` | Frontend websocket URL override | ❌ No |

---

## 📁 Project Structure

```
Gemini-Rubiks-Tutor/
├── backend/                    # Express + WebSocket Server
│   ├── src/
│   │   ├── server.js          # Main server with rate limiting
│   │   ├── geminiLiveClient.js # Gemini Live API wrapper
│   │   ├── cubeStateManager.js # Cube logic + Kociemba solver
│   │   └── tutorPrompt.js     # AI system prompt
│   └── package.json
├── frontend/                   # React + Vite + Tailwind
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── LiveSession.jsx   # WebRTC + WebSocket
│   │   │   ├── CubeViewer.jsx    # Three.js 3D cube
│   │   │   ├── StatusBar.jsx     # Session status
│   │   │   └── TutorOverlay.jsx  # Chat UI
│   │   └── utils/
│   │       ├── webrtcHelpers.js  # Media capture
│   │       └── cubeColors.js     # Cube color mapping
│   └── package.json
├── terraform/                  # Infrastructure as Code
│   ├── main.tf                # Cloud Run, Secret Manager
│   ├── variables.tf
│   └── outputs.tf
├── cloudbuild.yaml            # CI/CD pipeline
├── deploy.sh                  # Deployment script
├── Dockerfile                 # Container image
├── scripts/                    # Local run/verify/stop helpers
├── contest/                    # Contest-only profile + deploy wrapper
└── docs/
    ├── architecture-diagram.md      # System architecture
    ├── devpost-submission.md        # Ready-to-paste Devpost text
    ├── demo-video-script.md         # Timed <4 minute demo script
    ├── contest-final-checklist.md   # Pre-submit checklist
    └── maintenance-workflow.md      # Main vs contest branch workflow
```

---

## 🏗️ Architecture

```
┌─────────────────┐     WebSocket      ┌──────────────────┐
│   React App     │ ◄────────────────► │   Cloud Run      │
│  (Frontend)     │   Audio/Video      │   (Node.js)      │
│                 │                    │                  │
│ • Three.js      │                    │ • Express        │
│ • WebRTC        │                    │ • WebSocket      │
│ • Vite          │                    │ • Gemini Client  │
└─────────────────┘                    └────────┬─────────┘
                                                │
                                                │ HTTPS
                                                ▼
                                        ┌──────────────────┐
                                        │  Gemini Live API │
                                        │                  │
                                        │ • Audio streaming│
                                        │ • Vision input   │
                                        │ • Text responses │
                                        └──────────────────┘
```

See full diagram: [`docs/architecture-diagram.md`](docs/architecture-diagram.md)

---

## 🔬 Technical Deep Dive

### Audio Processing
- **Sample Rate:** 16kHz mono PCM
- **VAD:** Adaptive noise-floor normalization for robust mic-level detection
- **Barge-in Trigger:** `0.15` normalized mic level while tutor audio is playing
- **Buffer Size:** 4096 samples
- **Echo Cancellation:** Enabled
- **Noise Suppression:** Enabled

### Video Processing
- **Resolution:** 640x480 (downscaled from 1280x720)
- **Frame Rate:** 4 FPS with motion detection
- **Encoding:** JPEG quality 0.7
- **Motion Detection:** Skip duplicate frames to save bandwidth

### AI Configuration
- **Primary Model:** `gemini-2.0-flash-live-preview-04-09`
- **Fallback Model:** `gemini-2.0-flash-exp`
- **Temperature:** 0.7
- **TopP:** 0.9
- **Max Output Tokens:** 256

### Security & Rate Limiting
- Rate limits (per IP, per minute):
  - connect: 30
  - control messages: 600
  - video frames: 360
  - audio chunks: 3000
- Max concurrent connections: 10
- CORS supports local development and configurable production origins
- API key stored in Google Secret Manager

---

## 🎬 Demonstration

### What to Show in Your Demo Video
1. **Landing Page** - Show the onboarding UI
2. **Start Session** - Grant camera/mic permissions
3. **Real-time Interaction** - Talk to Cubey naturally
4. **Vision Recognition** - AI identifies cube state
5. **Move Guidance** - Follow AI instructions
6. **3D Visualization** - Show the animated cube
7. **Challenge Mode** - Race against the AI

### Key Talking Points
- **Problem:** Learning Rubik's Cube is hard without guidance
- **Solution:** AI tutor that sees and hears in real-time
- **Tech:** Gemini Live API + Google Cloud Run
- **Innovation:** Multimodal AI with voice interruptions

---

## 📄 License

MIT License

---

<p align="center">
  Built with ❤️ for the <strong>Gemini Live Agent Challenge</strong><br>
  Powered by <strong>Google Gemini</strong> + <strong>Google Cloud</strong>
</p>
