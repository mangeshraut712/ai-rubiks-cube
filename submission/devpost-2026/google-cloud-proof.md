# Proof Of Google Cloud Deployment

This project uses **Google Cloud Run** as the backend hosting target and includes **Google Cloud Build** deployment automation in the public repository.

## Public Deployment Evidence

- Backend health endpoint:
  - https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/health
- Runtime metadata endpoint:
  - https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/api/runtime

## Repository Evidence

- `cloudbuild.yaml`
  - Cloud Build pipeline for deploying the backend container
- `deploy.sh`
  - Cloud Run deployment script with live model and CORS configuration
- `terraform/variables.tf`
  - Infrastructure defaults for the Cloud deployment path
- `backend/src/geminiLiveClient.js`
  - Server-side use of the Google Gen AI SDK
- `backend/src/server.js`
  - Production backend routes, WebSocket transport, and signaling integration

## Suggested Devpost Proof Wording

The backend is deployed on Google Cloud Run and is publicly reachable at the Cloud Run URL above. The repository includes deployment automation through `cloudbuild.yaml`, `deploy.sh`, and Terraform configuration, and the backend source shows server-side use of the Google Gen AI SDK for Gemini Live integration.

## Optional Video Proof Plan

If you want a short screen recording instead of only code proof:

1. Open the Google Cloud Run service in the console
2. Show the deployed service URL
3. Open the health endpoint in the browser
4. Open the repo files `cloudbuild.yaml` and `deploy.sh`
5. Keep the proof video under 30 seconds
