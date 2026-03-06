# AI Rubik's Tutor

## Summary

AI Rubik's Tutor is a multimodal Rubik's Cube coach built as two connected products in one repo.

- Part 1, `Gemini Live Tutor`, is a realtime 3x3 coaching workspace where the user can speak naturally, show the cube to the camera, receive live guidance, request hints, and practice with multiplayer support.
- Part 2, `Cubey Core 2x2 Lab`, is a deterministic 2x2 solver workspace that exposes the core cube logic, search algorithms, and exact playback in a way that is easy to inspect and demo.

Together they move beyond text-in/text-out chat by combining voice, camera input, live tutor responses, move-by-move coaching, and interactive visual cube state.

## What problem it solves

Most cube tutorials are static, delayed, or text-heavy. They assume the user can translate notation alone into physical action.

This project turns solving into a live, multimodal session:

- the tutor can see the cube context through the camera flow
- the user can speak instead of typing only
- the system responds in a guided, stateful workspace instead of a plain chat box
- the 2x2 lab gives a transparent core environment for search, playback, and algorithm inspection

## Core features

### Part 1: Gemini Live Tutor

- Realtime Gemini Live tutor transport over WebSocket
- Voice + webcam interaction loop
- Guided move coaching and tutor memory
- Hints, solve preview, and auto-solve actions
- Multiplayer/WebRTC lab
- Theme-aware routed product shell

### Part 2: Cubey Core 2x2 Lab

- Shared valid 24-sticker cube core
- BFS, A*, and IDA* solving
- Manual move controls
- Solve playback and state inspection
- Theme-aware workspace aligned with Part 1

## Technologies used

### Frontend

- React 19
- React Router 7
- Vite 7
- Tailwind CSS 4
- Framer Motion 12
- Three.js
- Zustand
- Vitest

### Backend

- Node.js 22
- Express 5
- `@google/genai`
- `ws`
- Zod
- Helmet
- Compression
- `express-rate-limit`

### Google Cloud

- Cloud Run
- Cloud Build
- Artifact Registry
- Secret Manager

## Data sources and dependencies

- Google Gemini via the Google GenAI SDK
- Camera and microphone from the user device
- Local cube-state logic and search algorithms in-repo

No external private dataset is required for the main user workflow.

## Learnings

- The biggest quality gain came from treating the product as a realtime workspace instead of a chatbot.
- Hosting the frontend and backend together on Cloud Run simplified the public deployment path and made route/runtime validation much easier.
- Keeping Part 2 as an explicit core-lab companion improved trust and debuggability because the solver behavior can be inspected directly.

## Why this is a strong Live Agents submission

- It uses Gemini in a realtime multimodal tutoring flow.
- It goes beyond text-only interaction.
- It is hosted on Google Cloud.
- It combines an immersive live interface with a transparent, exact solver core that supports demos and verification.
