# 🏆 Gemini Live Agent Challenge - Contest Submission

## Quick Start for Judges

### Option 1: Local Testing (Recommended for Development)

```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Configure environment
cp ../.env.example ../.env
# Edit .env and add your GEMINI_API_KEY

# 3. Start backend (Terminal 1)
cd backend && npm run dev

# 4. Start frontend (Terminal 2)
cd frontend && npm run dev

# 5. Open http://localhost:5173
```

### Option 2: Demo Mode (No Camera Required)

```bash
# Edit .env and set:
DEMO_MODE=true
GEMINI_API_KEY=your_api_key

# Then start as normal - the AI will demonstrate on a virtual cube
```

### Option 3: Google Cloud Run (Production)

```bash
# Using the deployment script
./deploy.sh YOUR_GCP_PROJECT_ID

# Or using Cloud Build
gcloud builds submit --config cloudbuild.yaml
```

---

## 📋 Contest Requirements Verification

| Requirement | Implementation | Location |
|-------------|----------------|----------|
| **Category: Live Agents** | Real-time voice + vision AI tutor | `backend/src/geminiLiveClient.js` |
| **Gemini Live API** | Uses `@google/genai` Live API | `backend/src/geminiLiveClient.js` |
| **Google Cloud Hosted** | Cloud Run deployment ready | `terraform/`, `cloudbuild.yaml` |
| **Audio/Vision** | WebRTC + WebSocket streaming | `frontend/src/components/LiveSession.jsx` |
| **Interruptions** | VAD with 0.15 threshold | `frontend/src/utils/webrtcHelpers.js` |

---

## 🎬 Demo Video Outline

1. **Introduction (0:00-0:30)**
   - Problem: Learning Rubik's Cube is difficult alone
   - Solution: AI tutor with real-time vision and voice

2. **Features Demo (0:30-2:30)**
   - Landing page and onboarding
   - Start session with camera/mic
   - AI guiding through moves with voice
   - 3D cube visualization
   - Challenge mode race

3. **Technical Highlights (2:30-3:30)**
   - Gemini Live API integration
   - WebSocket bidirectional streaming
   - Google Cloud Run deployment

4. **Conclusion (3:30-4:00)**
   - Value proposition
   - Future possibilities

---

## 🔧 Environment Variables for Judges

```env
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional - for testing without physical cube
DEMO_MODE=false

# Optional - model selection
GEMINI_LIVE_MODEL=gemini-2.0-flash-live-preview-04-09
GEMINI_FALLBACK_MODEL=gemini-2.0-flash-exp

# Optional - frontend dev proxy target
VITE_BACKEND_ORIGIN=http://localhost:8080
```

## 🎨 Design Language

- Google-inspired frontend styling (colors, typography, and surface hierarchy)
- Gemini-themed visual identity for the contest demo

---

## ☁️ Google Cloud Deployment Proof

### Infrastructure as Code
- **Terraform**: `terraform/main.tf` - Defines Cloud Run service, Secret Manager
- **Cloud Build**: `cloudbuild.yaml` - CI/CD pipeline for automated deployment
- **Deployment Script**: `deploy.sh` - One-command deployment

### Services Used
1. **Cloud Run** - Serverless container hosting
2. **Secret Manager** - Secure API key storage
3. **Cloud Build** - Automated builds and deployments
4. **Artifact Registry** - Docker image storage

### Deployment Verification
```bash
# Check Cloud Run service
gcloud run services describe gemini-rubiks-tutor --region us-central1

# Verify Secret Manager
gcloud secrets versions list GEMINI_API_KEY
```

---

## 🏗️ Architecture Overview

```
User Browser (Chrome)
    ↕ WebSocket (ws://localhost:8080/ws)
    ↕ HTTP (http://localhost:5173)
    
Frontend (React + Vite)
- LiveSession.jsx (WebRTC capture)
- CubeViewer.jsx (Three.js 3D)
- WebSocket client

    ↕ WebSocket (Audio/Video frames)
    
Backend (Node.js + Express)
- server.js (WebSocket handling)
- geminiLiveClient.js (Gemini Live API)
- cubeStateManager.js (Cube logic)

    ↕ HTTPS (Streaming)
    
Google Gemini Live API
- Real-time audio + vision
- Multimodal responses
```

---

## 📊 Testing Checklist

### Functional Tests
- [ ] Landing page loads correctly
- [ ] Camera/mic permissions work
- [ ] WebSocket connection established
- [ ] AI voice responses play
- [ ] 3D cube renders and animates
- [ ] Challenge mode scrambles cube
- [ ] Hint system provides guidance

### Technical Tests
- [ ] Backend health check passes (`/health`)
- [ ] WebSocket messages flow bidirectionally
- [ ] Video frames send at 4fps
- [ ] Audio playback is smooth
- [ ] Rate limiting prevents abuse

---

## 🆘 Troubleshooting

### Backend won't start
```bash
# Check port availability
lsof -i :8080
# Kill existing processes
pkill -f "node.*server.js"
```

### Frontend connection issues
```bash
# Verify backend is running
curl http://localhost:8080/health

# Check CORS settings in .env
CORS_ORIGIN=http://localhost:5173
```

### Gemini API errors
- Verify API key is valid at https://aistudio.google.com/app/apikey
- Check rate limits haven't been exceeded
- Try fallback model if primary fails

---

## 📁 Repository Structure

```
├── backend/              # Express + WebSocket server
│   ├── src/
│   │   ├── server.js
│   │   ├── geminiLiveClient.js
│   │   ├── cubeStateManager.js
│   │   └── tutorPrompt.js
│   └── package.json
├── frontend/             # React + Vite app
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   └── utils/
│   └── package.json
├── terraform/            # GCP infrastructure
├── cloudbuild.yaml       # CI/CD pipeline
├── deploy.sh            # Deployment script
├── Dockerfile           # Container image
└── README.md            # Full documentation
```

---

**Ready for judging!** 🎉
