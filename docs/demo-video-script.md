# Demo Video Script (<4 Minutes)

Target length: **3:20 to 3:45**

## 0:00 - 0:20 | Hook + Problem
Say:
"This is Gemini Rubik's Tutor, a real-time multimodal AI agent. It can see my cube, hear my voice, and coach me move-by-move with interruption support."

Show:
- Landing screen
- Start Session button

## 0:20 - 0:45 | Real-Time Live Agent Setup
Say:
"I’m starting a live session. The app opens webcam and mic, then streams audio and vision context to Gemini in real time."

Show:
- Permission prompt accepted
- Webcam PIP visible
- Status bar changing to connected

## 0:45 - 1:40 | Core Interaction (Audio + Vision + Barge-In)
Say:
"Cubey gives one clear move at a time and confirms progress."

Show:
- Tutor speaking instruction
- Move instruction appears in transcript
- 3D cube highlights active face

Then interrupt:
"Wait, I did that wrong."

Show:
- Barge-in interrupt behavior
- Tutor re-guides with corrected instruction

## 1:40 - 2:10 | Hint and Recovery
Say:
"If I get stuck, I can press Hint."

Show:
- Click Hint
- Hint response appears in overlay + transcript

## 2:10 - 2:45 | Challenge Mode
Say:
"Challenge Mode scrambles the cube and turns coaching into a race experience."

Show:
- Toggle Challenge Mode
- Scramble notification
- Move counter and timer running

## 2:45 - 3:05 | Demo Mode for Judges
Say:
"For judges without a physical cube setup, I support demo mode with a virtual walkthrough."

Show:
- `.env` with `DEMO_MODE=true` (brief)
- Session in demo mode with automatic move-by-move guidance

## 3:05 - 3:30 | Cloud + Architecture + Close
Say:
"Backend is deployed on Google Cloud Run, with Cloud Build and Terraform for reproducible deployment."

Show:
- `docs/architecture-diagram.md`
- `cloudbuild.yaml`, `deploy.sh`, `terraform/main.tf`
- Optional quick GCP console view

Close:
"Gemini Rubik's Tutor turns static cube tutorials into an interactive, real-time, multimodal coaching experience."
