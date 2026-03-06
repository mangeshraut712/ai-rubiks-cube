# Google Cloud Proof

## Public deployment proof

The app backend and website are deployed to Google Cloud Run.

Verified public URLs on March 7, 2026:

- App root:
  `https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/`
- Health:
  `https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/health`
- Runtime metadata:
  `https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/api/runtime`

The runtime endpoint confirms:

- environment: `production`
- backend package: `gemini-rubiks-tutor-backend`
- live model: `gemini-live-2.5-flash-preview`
- Cloud-hosted routes and websocket endpoints

## Code proof in this repo

### Cloud Run deployment pipeline

- `cloudbuild.yaml`
- `deploy.sh`
- `Dockerfile`

### Infrastructure and deployment helpers

- `terraform/main.tf`
- `terraform/variables.tf`
- `terraform/outputs.tf`

### Runtime/backend code

- `backend/src/server.js`
- `backend/src/runtimeInfo.js`

## Why this satisfies the challenge rule

The challenge allows cloud proof either by:

1. a short behind-the-scenes recording showing the app on Google Cloud, or
2. a code file in the public repo that demonstrates use of Google Cloud services and APIs.

This repo provides both a public Cloud Run deployment URL and the deployment code that builds and rolls out the service on Google Cloud.

## Recommended Devpost attachment

Use this file plus `architecture-diagram.svg` in the Devpost upload/image area.
