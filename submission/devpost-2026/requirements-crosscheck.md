# Requirements Crosscheck

Crosschecked against the Gemini Live Agent Challenge Devpost page on March 7, 2026.

Official challenge page:
https://geminiliveagentchallenge.devpost.com/

## Category fit

Primary category: `Live Agents`

Why:

- the app is centered on realtime voice + vision interaction
- the tutor responds in a live session rather than a turn-based text workflow
- the backend uses Gemini Live through the Google GenAI SDK

## Mandatory build requirements

### Requirement: Leverage a Gemini model

Status: `Met`

Evidence:

- `backend/src/geminiLiveClient.js`
- `backend/src/server.js`
- runtime metadata on Cloud Run reports active Gemini live + fallback models

### Requirement: Use Google GenAI SDK or ADK

Status: `Met`

Evidence:

- `backend/package.json`
- `backend/src/geminiLiveClient.js`

### Requirement: Use at least one Google Cloud service

Status: `Met`

Evidence:

- Cloud Run deployment
- `cloudbuild.yaml`
- `deploy.sh`
- `Dockerfile`
- `terraform/`

### Requirement: Agent hosted on Google Cloud

Status: `Met`

Evidence:

- public Cloud Run URL:
  `https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/`
- runtime endpoint is CORS-readable from the public frontend origin:
  `https://ai-rubiks-cube.vercel.app` -> `/api/runtime`
- Cloud deployment proof in `google-cloud-proof.md`

## Required submission items

### Text description

Status: `In repo`

Evidence:

- `project-description.md`

### Public code repository URL

Status: `In repo`

Evidence:

- https://github.com/mangeshraut712/ai-rubiks-cube
- spin-up instructions are in the root `README.md`

### Proof of Google Cloud deployment

Status: `In repo`

Evidence:

- `google-cloud-proof.md`
- `cloudbuild.yaml`
- `deploy.sh`
- `Dockerfile`

### Architecture diagram

Status: `In repo`

Evidence:

- `architecture-diagram.svg`
- `architecture-notes.md`

### Demonstration video under 4 minutes

Status: `Script in repo, recording still manual`

Evidence:

- `demo-video-script.md`

Note:

The actual video file still needs to be recorded and uploaded outside the repo.

## Bonus point readiness

### Automated cloud deployment using scripts or IaC

Status: `Met`

Evidence:

- `cloudbuild.yaml`
- `deploy.sh`
- `terraform/`

### Content piece about how the project was built

Status: `Not in repo`

Optional only.

### GDG profile

Status: `Not in repo`

Optional only.

## Final assessment

The repo now contains the main written and diagram artifacts needed for a strong Devpost submission.

Remaining manual items before final submission:

1. Record the demo video.
2. Paste the project description into Devpost.
3. Upload the architecture diagram and demo video to the submission form.
