# Testing Guide (Project + Contest)

This guide verifies the full Gemini Rubik's Tutor stack and the Gemini Live Agent Challenge requirements.

## 1) Quick Health Check

```bash
# backend
curl http://localhost:8080/health
# expected: {"status":"ok","model":"gemini-live"}

# frontend
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173
# expected: 200
```

## 2) Standard Local Run

```bash
# terminal 1
cd backend
npm install
npm run dev

# terminal 2
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## 3) Contest/Judge Run (Recommended)

```bash
cp contest/.env.judges.example .env
# set GEMINI_API_KEY if you want real Gemini live responses

chmod +x scripts/*.sh
./scripts/run-contest-local.sh
```

This launches:
- Backend on `:8080`
- Frontend on `:5173`
- Demo mode defaults for judge-friendly testing

## 4) Full Automated Verification

```bash
./scripts/verify-contest-stack.sh
```

What this validates:
- backend starts
- frontend production build works
- `/health` smoke test passes

## 4.1) Full Quality Sweep (lint/syntax/build/smoke)

```bash
./scripts/quality-check.sh
```

## 5) Manual Feature Checklist (Chrome)

1. Open `http://localhost:5173`
2. Click `Start Session`
3. Confirm connection status moves to `connected` or `demo_mode`
4. Click `Challenge Mode` and verify challenge status appears
5. Click `Solve Preview` and verify solution transcript appears
6. Click `Hint` and verify hint appears
7. Confirm 3D cube renders and updates
8. Click `End Session` and confirm return to landing screen

## 6) WebSocket Error Troubleshooting

If you see `WebSocket error occurred` / disconnected status:

1. Ensure backend is running:
```bash
curl http://localhost:8080/health
```

2. Verify frontend backend target:
- `frontend/.env`:
```env
VITE_BACKEND_ORIGIN=http://localhost:8080
```
- or set explicit websocket URL:
```env
VITE_WS_URL=ws://localhost:8080/ws
```

3. Restart both frontend and backend after env changes.

4. If you use a custom backend port, keep all three in sync:
- root `.env` -> `PORT`
- `frontend/.env` -> `VITE_BACKEND_ORIGIN`
- any deployment env overrides

## 7) GEMINI_API_KEY Behavior

- With valid `GEMINI_API_KEY`: real Gemini Live responses.
- With missing/invalid key + `DEMO_MODE=true`: local demo fallback works (no hard failure).
- With missing/invalid key + `DEMO_MODE=false`: session initialization fails by design.

## 8) Contest Requirements Coverage

- Live multimodal session: audio + video + WS streaming
- Interruption handling: `interrupt` flow
- Challenge mode: scramble + guided race
- Hint mode: visual hint response
- Cloud deployment assets: `deploy.sh`, `cloudbuild.yaml`, `terraform/`
