# Devpost Submission Text (Ready to Paste)

## Project Summary
Gemini Rubik's Tutor is a real-time multimodal AI agent built for the **Live Agents** category of the Gemini Live Agent Challenge.  
It watches a physical Rubik's Cube through webcam frames, listens to voice input, and responds with spoken, step-by-step guidance to solve the cube using CFOP (Cross, F2L, OLL, PLL).  
The tutor supports natural interruption (barge-in), challenge mode, and demo mode for judges.

## Problem and Value
Most cube tutorials are static and hard to follow in real-time. Beginners often make move mistakes and lose track.  
Gemini Rubik's Tutor provides interactive, adaptive coaching that can see, hear, and respond instantly, making cube learning faster and more engaging.

## Core Features
- Real-time multimodal interaction (audio + vision + voice response)
- Interruptible voice tutoring with barge-in handling
- One-move-at-a-time coaching with notation + plain-language explanations
- 3D Three.js cube visualization synchronized to move instructions
- Hint mode for mistake recovery
- Challenge mode (scramble + race experience)
- Demo mode (`DEMO_MODE=true`) for judge testing without physical cube setup
- Session transcript and move-history export

## Technologies Used
- Frontend: React 18, Vite, Three.js, Tailwind CSS, WebRTC, WebSocket
- Backend: Node.js 20, Express, ws, `@google/genai`, `@google/generative-ai`, kociemba
- Cloud: Google Cloud Run, Cloud Build, Secret Manager, Artifact Registry, Terraform

## Gemini/Agent Stack
- Uses Gemini via Google GenAI SDK (`@google/genai`)
- Uses Gemini Live API style bidirectional session for real-time audio+vision tutoring
- Multimodal input: microphone PCM + webcam JPEG frames
- Multimodal output: tutor audio + transcript + move events

## Data Sources
- Live in-session user media only (webcam + microphone)
- No external private dataset ingestion
- Deterministic Kociemba solver for solution verification and challenge workflows

## Findings and Learnings
- Barge-in and short response turns are critical for natural real-time tutoring UX.
- Motion-gated frame streaming reduces bandwidth while preserving visual context.
- Adaptive noise-floor mic handling improves reliability in noisy environments.
- Demo mode materially improves reproducibility for judges.
- Deployment automation (Cloud Build + Terraform + deploy script) reduces evaluation friction.

## Public Repository
- Repo URL: `PASTE_YOUR_GITHUB_REPO_URL`

## Live Deployment
- Frontend URL: `PASTE_PUBLIC_FRONTEND_URL`
- Backend URL (Cloud Run): `PASTE_CLOUD_RUN_URL`

## Google Cloud Proof
This repository includes direct Google Cloud deployment and infrastructure code:
- `deploy.sh`
- `cloudbuild.yaml`
- `terraform/main.tf`

For submission, include either:
1. A short backend deployment proof recording from GCP console, or
2. Direct links to the files above in the public repo.

## Architecture Diagram
- Mermaid diagram: `docs/architecture-diagram.md`
- Include screenshot/rendered diagram in Devpost media for judge visibility.
