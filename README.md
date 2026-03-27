<div align="center">

# AI Rubik's Tutor

Two Rubik's cube products in one monorepo: a realtime Gemini tutor and a deterministic 2x2 solver lab.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js)](https://nodejs.org/)
[![Google GenAI](https://img.shields.io/badge/Google_GenAI-SDK-4285F4?logo=google)](https://ai.google.dev/)
[![Cloud Run](https://img.shields.io/badge/Deploy-Cloud_Run-4285F4?logo=googlecloud)](https://cloud.google.com/run)

[Repository](https://github.com/mangeshraut712/ai-rubiks-cube)

</div>

## Overview

This repository bundles two related experiences: a live 3x3 tutoring surface backed by Gemini, and a separate 2x2 solver lab with exact algorithms and playback controls. Both apps share one visual system and one deployment story, but stay independent enough to work on separately.

## Table of Contents

- [Products](#products)
- [Stack](#stack)
- [Quick Start](#quick-start)
- [Repository Layout](#repository-layout)
- [Scripts](#scripts)
- [Deployment](#deployment)

## Products

| Product | Purpose | Main Surface |
| --- | --- | --- |
| Gemini Live Tutor | Realtime coaching for a physical or virtual 3x3 cube | `frontend/src/`, `backend/src/` |
| Cubey Core 2x2 Lab | Deterministic 2x2 solving, inspection, and playback | `frontend/public/legacy-2x2-solver/` |

### Gemini Live Tutor

- Webcam and microphone driven tutor flow.
- Reasoning endpoints for guided solving and explanation.
- Multiplayer signaling and live session state.
- Runtime health and service metadata exposed from the backend.

### Cubey Core 2x2 Lab

- Static 2x2 cube engine shipped with the frontend.
- Manual moves, scramble/reset, and exact solution playback.
- Useful for comparing BFS, A*, and IDA* style solver behavior.

## Stack

- Frontend: React 19, Vite 7, Tailwind CSS 4, Framer Motion, React Router.
- Backend: Node.js 22, Express 5, WebSocket transport, Zod, Helmet, compression.
- AI: Google GenAI SDK, Gemini Live client, structured reasoning prompts.
- Quality: Vitest, ESLint, Prettier, Cloud Build, Cloud Run.

## Quick Start

```bash
git clone https://github.com/mangeshraut712/ai-rubiks-cube.git
cd ai-rubiks-cube
npm ci --prefix backend
npm ci --prefix frontend
```

### Run the live tutor

```bash
./scripts/start-gemini.sh
```

This starts the backend on `http://localhost:8080` and the frontend on `http://localhost:5173`.

### Run the 2x2 lab

```bash
./scripts/start-core.sh
```

Open `http://localhost:5173/part-2`.

## Repository Layout

```text
.
├── backend/              # Express server, WebSocket support, reasoning routes
├── frontend/             # Vite app, cube UI, solver lab, PWA assets
├── scripts/              # Local start helpers
├── cloudbuild.yaml       # Cloud Build deployment config
├── deploy.sh             # Deployment helper
└── Dockerfile            # Container build
```

## Scripts

- `npm run dev --prefix backend` - start the backend in watch mode.
- `npm run dev --prefix frontend` - start the frontend in development mode.
- `npm run build --prefix frontend` - build the frontend.
- `npm run test --prefix backend` - run backend tests.
- `npm run test --prefix frontend` - run frontend tests.
- `./scripts/start-gemini.sh` - start the live tutor workflow.
- `./scripts/start-core.sh` - start the 2x2 lab workflow.

## Deployment

The repo includes `Dockerfile`, `cloudbuild.yaml`, and `deploy.sh` for cloud deployment. The backend defaults to port `8080`, which matches the local and containerized setup.
