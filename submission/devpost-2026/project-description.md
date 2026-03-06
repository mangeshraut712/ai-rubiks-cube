# Devpost Project Description

## Project Summary

AI Rubik's Tutor is a real-time, multimodal coaching agent for solving a physical Rubik's Cube. Instead of making users type into a chatbot, the product listens through the microphone, watches the cube through the camera, speaks back with live guidance, and keeps the full coaching loop on a single workspace screen.

The project fits the **Live Agents** category. The user can naturally interrupt the agent, ask follow-up questions, request hints, preview solutions, and switch between solo coaching and multiplayer challenge mode without leaving the main experience.

## What It Does

- Watches a physical cube through the camera
- Streams microphone audio and webcam frames to a live Gemini-backed tutor
- Speaks instructions back to the user in real time
- Supports interruption, challenge mode, hint requests, and auto-solve walkthroughs
- Preserves transcript memory and current instruction state in the same workspace
- Offers a multiplayer lab using WebRTC signaling
- Includes a legacy 2x2 solver for comparison and demo backup

## Why It Matters

Most AI products still force users into text-only, turn-based workflows. Solving a physical cube is spatial, visual, and time-sensitive, so text-only chat is the wrong interface. AI Rubik's Tutor turns the tutoring loop into a live multimodal experience where the agent can see, hear, speak, and respond in context.

## Technologies Used

### Core AI and agent stack

- Google Gemini Live API through the Google Gen AI SDK
- Multimodal live transport for voice, text, and image frames
- Gemini fallback model for visual hint generation

### Frontend

- React 19.2
- React Router 7
- Vite 7
- Tailwind CSS 4.2
- Framer Motion 12
- Three.js for the cube stage
- Zustand for persistent state

### Backend

- Node.js 24 runtime tested locally
- Express 5.2
- `ws` WebSocket server for live tutor transport
- Zod 4 validation for WebSocket and signaling payloads
- WebRTC signaling server for multiplayer

### Google Cloud

- Google Cloud Run for backend hosting
- Google Cloud Build for deployment automation
- Terraform variables for infrastructure configuration

## Data Sources

- Live microphone audio from the user
- Live camera frames of the physical cube
- Internal cube-state transitions and move history
- Local cube-solving logic and Kociemba-based solution helpers

No third-party user dataset is required for normal operation.

## Learnings

- A live multimodal agent needs much stronger transport discipline than a standard chat app. Heartbeats, payload limits, deduping, and retry paths mattered.
- The frontend had to become route-aware and state-aware at the same time. The live session cannot feel like a modal on top of a landing page.
- Judges benefit from explicit runtime metadata. Adding `/api/runtime` made it easier to inspect capability state and helped the frontend surface backend readiness.
- Multiplayer needs more than STUN-only assumptions. The project now accepts environment-driven ICE configuration so TURN can be added cleanly for production networking.

## Public Repository

https://github.com/mangeshraut712/ai-rubiks-cube

## Live URLs

- Frontend: https://ai-rubiks-cube.vercel.app/
- Backend health: https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/health
- Runtime metadata: https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/api/runtime
