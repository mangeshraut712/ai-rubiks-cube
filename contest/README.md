# Contest Standalone Profile

This folder isolates the **Gemini Live Agent Challenge** variant so judges can run and deploy it quickly without affecting core development defaults.

## Local Judge Run

1. Copy the judge environment template:

```bash
cp contest/.env.judges.example .env
```

2. Edit `.env` and set a valid `GEMINI_API_KEY`.

3. Start the full local stack (backend + frontend) and open Chrome automatically:

```bash
chmod +x scripts/*.sh contest/*.sh
./scripts/run-contest-local.sh
```

`run-contest-local.sh` forces `DEMO_MODE=true` by default for judge-friendly behavior.
Override only when needed:

```bash
CONTEST_DEMO_MODE=false ./scripts/run-contest-local.sh
```

4. Run smoke verification:

```bash
./scripts/verify-contest-stack.sh
```

## Contest Cloud Run Deployment

Deploy with contest defaults (`DEMO_MODE=true`, wildcard CORS, live+fallback model env):

```bash
./contest/deploy-cloud-run.sh YOUR_GCP_PROJECT_ID
```

Optional overrides:

```bash
DEMO_MODE_VALUE=true \
CORS_ORIGIN_VALUE="*" \
GEMINI_LIVE_MODEL_VALUE="gemini-2.0-flash-live-preview-04-09" \
GEMINI_FALLBACK_MODEL_VALUE="gemini-2.0-flash-exp" \
./contest/deploy-cloud-run.sh YOUR_GCP_PROJECT_ID
```
