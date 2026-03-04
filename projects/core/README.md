# Core Project

This is the original Gemini Rubik's Tutor product flow:

- Real Gemini Live API interaction
- Full coaching + cube state grounding
- Standard local developer workflow

## Run Locally

From repository root:

```bash
./scripts/start-core.sh
```

Notes:

- Defaults to `DEMO_MODE=false`.
- Expects `GEMINI_API_KEY` in environment or `.env`.
- Runs backend + frontend together.
