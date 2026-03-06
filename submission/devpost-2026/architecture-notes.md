# Architecture Notes

## Main Flow

1. The user opens the React/Vite frontend on Vercel.
2. The frontend route loader fetches `/api/runtime` from the Cloud Run backend.
3. The live workspace streams microphone PCM audio and camera JPEG frames over WebSocket to `/ws`.
4. The Cloud Run backend forwards multimodal input to Gemini Live through the Google Gen AI SDK.
5. Gemini returns audio and text guidance, which the frontend renders as spoken coaching, transcript entries, and move instructions.
6. Multiplayer uses `/multiplayer` for signaling while peers exchange game data over WebRTC.

## Why This Diagram Matters

- It shows clear separation between frontend, backend, Gemini live transport, and multiplayer signaling
- It demonstrates required Google Cloud usage
- It helps judges understand that the live agent is not just a static chat UI
