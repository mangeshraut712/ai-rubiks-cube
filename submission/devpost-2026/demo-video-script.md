# Demo Video Script

Target length: `3:15` to `3:45`

## 1. Problem and hook — 20s

- Show a physical cube and the app home page.
- Say: most cube tutorials are static, text-heavy, and hard to follow while holding a real cube.
- Introduce the repo as two connected products:
  `Part 1` Gemini Live Tutor
  `Part 2` Cubey Core 2x2 Lab

## 2. Part 1: Live multimodal tutoring — 90s

- Open `/part-1/live`
- Start the live session
- Show webcam tile and cube stage
- Speak a natural prompt:
  “Cubey, tell me what move I should do next.”
- Show the system responding in the live workspace
- Request a hint
- Trigger solve preview or auto-solve
- Briefly show transcript memory and tutor response panels

## 3. Part 1: Multiplayer / interaction depth — 25s

- Open `/part-1/multiplayer`
- Show that the tutor product also supports peer/shared interaction
- Keep this short; the main focus remains the live tutor

## 4. Part 2: Core lab transparency — 55s

- Open `/part-2`
- Scramble the 2x2 cube
- Show manual moves
- Run BFS or A*
- Show exact solve playback and result panel
- Explain that Part 2 exposes the deterministic cube core behind the broader tutoring product

## 5. Google Cloud proof — 20s

- Show the Cloud Run root URL and `/api/runtime`
- Mention Cloud Run + Cloud Build + Secret Manager

## 6. Close — 20s

- Re-state the value:
  live, multimodal Rubik's Cube tutoring
  voice + vision
  Google Cloud deployment
  transparent core-lab companion

## Recording notes

- Keep cuts tight
- Avoid dead time during load screens
- Use real interactions, not mockups
- Keep the Cloud proof short and factual
