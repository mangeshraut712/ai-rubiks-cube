# How I Built Gemini Rubik's Tutor with Google AI + Google Cloud

**Disclosure:** I created this post specifically for the purpose of entering the Gemini Live Agent Challenge.

Repository: https://github.com/mangeshraut712/ai-rubiks-cube  
Live backend health endpoint: https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/health

## Why this project

I wanted to build an agent experience that does not rely on typing. The idea was simple: hold a physical Rubik's Cube, talk naturally, and get real-time spoken guidance while the AI can see the cube state.

That became **Gemini Rubik's Tutor** ("Cubey"): a multimodal tutor that listens, watches, and responds in voice while a 3D cube visualization mirrors each move.

## What I built

- Real-time webcam frame ingestion (JPEG frames over WebSocket)
- Real-time microphone/audio streaming (PCM16)
- Bidirectional Gemini Live session for multimodal interaction
- Interruption-friendly voice tutoring behavior
- Deterministic cube-state grounding via Kociemba solver
- 3D move visualization in the frontend

## Google AI models and SDK usage

The backend uses the Google GenAI SDK (`@google/genai`) to open a live session and stream audio/video input parts to Gemini.  
Model configuration supports a primary live model and fallback handling for reliability.

Key flow:

1. Browser captures voice + camera frames.
2. Node.js backend forwards both streams to Gemini Live.
3. Gemini returns audio responses and transcripts.
4. Backend pushes responses to the frontend for playback and UI updates.

## Google Cloud services used

I deployed the backend on **Google Cloud Run** and automated deployment with:

- **Cloud Build** (build + deploy pipeline)
- **Artifact Registry** (container images)
- **Secret Manager** (`GEMINI_API_KEY`)
- **Terraform** (infrastructure-as-code definitions)

Code proof:

- `terraform/main.tf`
- `cloudbuild.yaml`
- `deploy.sh`
- `backend/src/geminiLiveClient.js`

## Architecture decisions that mattered

### 1) WebSockets for live multimodal sessions
Long-lived bidirectional streams are required for low-latency voice + vision interactions, so backend hosting had to support persistent WebSocket connections.

### 2) Gapless audio playback
Gemini audio arrives in chunks. Using Web Audio scheduling (`AudioContext`) prevented stutter and made the tutor feel conversational.

### 3) Anti-hallucination grounding
Pure vision input can drift due to lighting and camera angles.  
I grounded all move guidance with a deterministic Kociemba solver so Gemini delivers natural coaching on top of mathematically correct next moves.

## Challenges and fixes

- **Cloud provider fit:** Needed Cloud Run for reliable WebSocket handling.
- **Native dependency build in container:** `kociemba` compile issues on Alpine required a targeted build flag fix in Docker.
- **Secret access at runtime:** Cloud Run service account needed Secret Manager accessor permission for `GEMINI_API_KEY`.

## Findings and learnings

- Multimodal agents feel much more useful when they are continuous, voice-first, and context-aware.
- A hybrid approach works best: LLM for conversation + deterministic logic for strict correctness.
- Deployment reliability (IAM, secret wiring, CI deploy scripts) is as important as model prompts for a polished user experience.

## How to reproduce

The README includes full setup:

- Local run instructions (`Quick Start`)
- Cloud deployment instructions (`Cloud Deployment (Monorepo Setup)`)
- Contest-oriented scripts and checklist artifacts

If you are evaluating the project for the challenge, start from the repo root README and `submission/devpost/DEVPOST_SUBMISSION_CHECKLIST.md`.

---

Created for the Gemini Live Agent Challenge.  
#GeminiLiveAgentChallenge #GoogleCloud #Gemini #WebSockets #React #Nodejs
