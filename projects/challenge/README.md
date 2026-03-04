# Challenge Contest Profile: Gemini Live Agent Challenge

This represents the contest-bound configuration profile of the Gemini Live Agent Challenge. It safely isolates the contest deployment needs (like running in "Demo Mode" for judges who may not have API keys, or pre-populating specific `.env` targets).

## How to Run

```bash
# Run the contest profile natively
./scripts/start-challenge.sh

# Deploy to Cloud Run using the challenge constraints 
./scripts/deploy-challenge.sh YOUR_GCP_PROJECT_ID
```

*(This wraps the deployment scripts setting `DEMO_MODE=true` by default and enforces strict specific CORS origins).*
