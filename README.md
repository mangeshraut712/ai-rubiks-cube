# AI Rubik's Cube Suite 2026

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)](frontend/src/test)
[![Vite](https://img.shields.io/badge/vite-6-646CFF?logo=vite)](https://vitejs.dev)
[![React](https://img.shields.io/badge/react-19-61DAFB?logo=react)](https://react.dev)
[![Three.js](https://img.shields.io/badge/three.js-0.172-000000?logo=three.js)](https://threejs.org)
[![Tailwind CSS](https://img.shields.io/badge/tailwind-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![WebRTC](https://img.shields.io/badge/webrtc-ready-333333?logo=webrtc)](https://webrtc.org)
[![WebAssembly](https://img.shields.io/badge/webassembly-ready-654FF0?logo=webassembly)](https://webassembly.org)

> Gemini Live Agent Challenge 2026 entry: a single repository that contains the Gemini-powered live tutor and the original classic 2x2 solver.

## 🚀 Live Demo

- **Frontend (Vercel)**: https://ai-rubiks-cube.vercel.app/
- **Backend Health**: https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/health
- **Classic 2x2 Solver**: https://ai-rubiks-cube.vercel.app/legacy-2x2-solver/index.html

## ✨ What's New in 2026

### 🎮 Core Features

- **AI Tutor with Gemini Live** - Real-time voice coaching with webcam vision
- **Multiplayer Racing** - WebRTC-powered P2P cube solving races
- **WebAssembly Solver** - High-performance solving with JS fallback
- **Interactive Tutorial** - Step-by-step learning mode for beginners
- **Statistics Dashboard** - Track progress, times, and improvement

### 🎨 UI/UX Enhancements

- **Dark Mode** - Full dark theme support with system preference detection
- **Keyboard Shortcuts** - Complete keyboard control (moves, undo/redo, features)
- **Voice Commands** - Hands-free cube control with speech recognition
- **PWA Support** - Installable app with offline capabilities
- **Responsive Design** - Mobile-first with glass morphism effects

### 🔧 Technical Improvements

- **Zustand State Management** - Lightweight, persistent state with undo/redo
- **Vitest Testing** - Comprehensive test coverage with React Testing Library
- **WebRTC Signaling** - Custom matchmaking server for multiplayer
- **Enhanced 3D Viewer** - Better lighting, shadows, and animations

## 📁 Project Structure

```
ai-rubiks-cube/
├── docs/                     # Documentation
│   └── FEATURES.md           # Feature catalog / roadmap
├── scripts/                  # Operational scripts
│   ├── security-check.sh
│   ├── start-gemini.sh
│   └── start-core.sh
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── CubeViewer.jsx      # 3D cube visualization
│   │   │   ├── LiveSession.jsx     # Gemini Live integration
│   │   │   ├── Tutorial.jsx        # Interactive tutorial
│   │   │   ├── Statistics.jsx      # Stats dashboard
│   │   │   ├── Settings.jsx        # User preferences
│   │   │   └── MultiplayerLobby.jsx # WebRTC multiplayer
│   │   ├── hooks/            # Custom React hooks
│   │   │   ├── useKeyboardShortcuts.js  # Keyboard control
│   │   │   ├── useVoiceCommands.js      # Voice recognition
│   │   │   └── useMultiplayer.js        # WebRTC multiplayer
│   │   ├── store/            # Zustand state management
│   │   │   └── cubeStore.js         # Global cube state
│   │   ├── wasm/             # WebAssembly solver
│   │   │   └── solverWasm.js        # WASM interface
│   │   └── test/             # Test suite
│   └── public/
│       └── legacy-2x2-solver/  # Classic 2x2 solver
├── backend/                  # Node.js + Express backend
│   └── src/
│       ├── server.js         # Main server + Gemini Live
│       ├── signalingServer.js # WebRTC signaling
│       └── cubeStateManager.js # State management
├── terraform/                # Infrastructure as Code
├── deploy.sh                 # Cloud deployment entrypoint
├── cloudbuild.yaml           # Cloud Build pipeline
└── vercel.json               # Vercel frontend config
```

## 🛠️ Tech Stack

### Frontend

| Technology      | Version | Purpose          |
| --------------- | ------- | ---------------- |
| React           | 19.x    | UI framework     |
| Vite            | 6.x     | Build tool       |
| Three.js        | 0.172.x | 3D graphics      |
| Tailwind CSS    | 4.x     | Styling          |
| Zustand         | 5.0.3   | State management |
| Framer Motion   | 11.x    | Animations       |
| React Hot Toast | 2.5.x   | Notifications    |
| Vitest          | 3.x     | Testing          |

### Backend

| Technology     | Version | Purpose         |
| -------------- | ------- | --------------- |
| Node.js        | ≥20     | Runtime         |
| Express        | 5.x     | Web framework   |
| WebSocket (ws) | 8.18.x  | Real-time comms |
| Google GenAI   | 1.x     | Gemini Live API |
| Kociemba       | 1.0.1   | 3x3 solving     |

### Infrastructure

- **Cloud Run** - Serverless container hosting
- **Cloud Build** - CI/CD pipeline
- **Secret Manager** - API key management
- **Terraform** - Infrastructure as Code

## 🚀 Quick Start

### Prerequisites

- Node.js ≥22
- npm ≥10
- Google Cloud account (for deployment)

### Local Development

1. **Clone and setup**:

```bash
git clone https://github.com/mangeshraut712/ai-rubiks-cube.git
cd ai-rubiks-cube
```

2. **Environment variables**:

```bash
cp .env.example .env
# Edit .env with your Gemini API key
```

Minimum local `.env` values:

```bash
PORT=8080
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
VITE_BACKEND_ORIGIN=http://localhost:8080
DEMO_MODE=false
```

3. **Install dependencies**:

```bash
npm ci --prefix backend
npm ci --prefix frontend
```

4. **Start backend** (Terminal 1):

```bash
cd backend
npm run start
```

5. **Start frontend** (Terminal 2):

```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

6. **Open** http://localhost:5173

7. **Verify local services**:

```bash
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:5173
```

Notes:

- If you want a judge/demo-friendly local session without a live API key, set `DEMO_MODE=true`.
- Localhost now clears stale PWA/service-worker artifacts on boot so the dev build matches the current source more reliably.

Or use the one-command launcher:

```bash
./scripts/start-gemini.sh
```

## 🎮 Features Guide

### Keyboard Shortcuts

| Key                          | Action                     |
| ---------------------------- | -------------------------- |
| `U`, `R`, `F`, `D`, `L`, `B` | Basic moves                |
| `Shift` + Move               | Prime moves (U', R', etc.) |
| `Ctrl` + `Z`                 | Undo                       |
| `Ctrl` + `Shift` + `Z`       | Redo                       |
| `Ctrl` + `Y`                 | Redo (alternative)         |
| `H`                          | Request hint               |
| `Shift` + `C`                | Toggle challenge mode      |
| `Shift` + `D`                | Toggle dark mode           |
| `Ctrl` + `,`                 | Open settings              |
| `Space`                      | Start/End session          |
| `Esc`                        | Reset cube                 |

### Voice Commands

Say commands like:

- "Move U" / "U prime" / "U double"
- "Scramble the cube"
- "Reset cube"
- "Give me a hint"
- "Undo last move"

### Multiplayer Mode

1. Click "Multiplayer" on the landing page
2. Choose "Create Room" or "Join Room"
3. Share the room code with a friend
4. Race to solve the same scrambled cube!

## 🧪 Testing

Run the test suite:

```bash
npm run test --prefix backend -- --run
npm run test --prefix frontend -- --run
```

Run lint checks:

```bash
npm run lint --prefix backend
npm run lint --prefix frontend
```

## 📦 Building for Production

### Frontend

```bash
cd frontend
npm run build
```

### Backend (runtime check)

```bash
cd backend
npm run lint
npm run test -- --run
```

## 🚀 Deployment

### Vercel (Frontend)

```bash
vercel --prod
```

Use these Vercel project settings:

- Framework Preset: `Vite`
- Root Directory: repository root (same folder as `vercel.json`)
- Install Command: `cd frontend && npm ci --cache /tmp/.npm --prefer-online`
- Build Command: `cd frontend && npm run build`
- Output Directory: `frontend/dist`

Vercel environment variables:

- `VITE_BACKEND_ORIGIN=https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app` (required)
- `VITE_WS_URL=wss://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/ws` (recommended)
- `VITE_SIGNALING_SERVER=wss://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/multiplayer` (optional, for multiplayer signaling)

### Google Cloud Run (Backend)

```bash
gcloud builds submit --config cloudbuild.yaml
```

Or use the deploy script:

```bash
./deploy.sh
```

### GitHub Actions

This repo now contains:

- `.github/workflows/ci.yml` for lint/test/build checks
- `.github/workflows/vercel-deploy.yml` for production Vercel deploy on `main`

Set these GitHub repository secrets for Vercel deploy:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 🏗️ Architecture

### Gemini Live Tutor Flow

```
User Webcam/Mic → WebSocket → Gemini Live API
                      ↓
                Cube State Manager
                      ↓
              3D Cube Visualization
                      ↓
              Voice/Text Responses
```

### Multiplayer WebRTC Flow

```
Player A ←──WebRTC──→ Signaling Server ←──WebRTC──→ Player B
   ↓                      ↓                        ↓
Cube State           Matchmaking              Cube State
Sync                   Logic                    Sync
```

## 📝 API Documentation

### WebSocket Events

**Client → Server**:

- `end_session` - Terminate session
- `video_frame` - Send webcam frame (base64 JPEG)
- `audio_chunk` - Send audio data
- `hint_request` - Ask for solving hint
- `challenge_mode` - Toggle challenge mode
- `interrupt` - Barge in during tutor playback
- `auto_solve` - Start auto-solve playback

**Server → Client**:

- `status` - Connection status updates
- `instruction` - Move instructions
- `cube_state_update` - Current cube state
- `audio_response` - Audio data from tutor
- `hint_response` - Short corrective hint
- `thinking` - Tutor thinking state
- `interruption` - Tutor/user interruption event
- `error` - Error messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- **Google** - Gemini Live API
- **Three.js Community** - 3D graphics library
- **Kociemba Algorithm** - 3x3 solving algorithm
- **DevPost** - Gemini Live Agent Challenge 2026

## 📧 Contact

- **Author**: Mangesh Raut
- **DevPost**: https://devpost.com/mbr63drexel
- **Challenge**: https://geminiliveagentchallenge.devpost.com/

---

<p align="center">
  Made with ❤️ for the Gemini Live Agent Challenge 2026
</p>
