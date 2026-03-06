# Architecture Notes

## Overview

The system is intentionally simple:

- one React frontend shell
- one Express backend
- one Google Cloud Run deployment for the full app

## Part 1 flow

1. User opens the product shell.
2. User starts the live tutor.
3. Frontend sends mic/video context and user actions over WebSocket.
4. Backend manages Gemini Live communication and cube session state.
5. Tutor responses come back into the live workspace with guidance, memory, and actions.

## Part 2 flow

1. User opens the 2x2 lab.
2. The lab runs on the shared 24-sticker cube core.
3. BFS, A*, and IDA* solve and playback stay deterministic and inspectable.

## Deployment

- Frontend assets are built with Vite.
- Backend and built frontend are bundled into one Docker image.
- Cloud Build deploys to Cloud Run.
- Secret Manager supplies the Gemini API key.
