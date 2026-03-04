# Challenge Contest Project

This project profile is optimized for Gemini Live Agent Challenge submission packaging:

- Contest-focused docs and checklist
- Contest deployment wrapper
- Demo-friendly local defaults (overridable)

## Run Locally

From repository root:

```bash
./scripts/start-challenge.sh
```

## Deploy Contest Profile

```bash
./scripts/deploy-challenge.sh YOUR_GCP_PROJECT_ID
```

Notes:

- Local run defaults to `DEMO_MODE=true` for judge/demo friendliness.
- Deploy wrapper delegates to `contest/deploy-cloud-run.sh`.
