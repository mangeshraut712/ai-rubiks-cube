#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: ./deploy.sh <GCP_PROJECT_ID>"
  exit 1
fi

PROJECT_ID="$1"
REGION="us-central1"
SERVICE_NAME="gemini-rubiks-tutor"
REPO_NAME="gemini-rubiks-tutor"
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:latest"
DEMO_MODE_VALUE="${DEMO_MODE_VALUE:-true}"
CORS_ORIGIN_VALUE="${CORS_ORIGIN_VALUE:-https://gemini-rubiks-tutor.vercel.app,http://localhost:5173}"
GEMINI_LIVE_MODEL_VALUE="${GEMINI_LIVE_MODEL_VALUE:-gemini-2.5-flash-native-audio-preview-09-2025}"
GEMINI_FALLBACK_MODEL_VALUE="${GEMINI_FALLBACK_MODEL_VALUE:-gemini-2.5-flash}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SECURITY_CORS_ORIGIN="${CORS_ORIGIN_VALUE}" \
SECURITY_DEMO_MODE="${DEMO_MODE_VALUE}" \
"${SCRIPT_DIR}/scripts/security-check.sh" --scope deploy

echo "Setting gcloud project to ${PROJECT_ID}"
gcloud config set project "${PROJECT_ID}" >/dev/null

echo "Enabling required APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com

echo "Ensuring Artifact Registry repository exists (${REPO_NAME})..."
if ! gcloud artifacts repositories describe "${REPO_NAME}" --location "${REGION}" >/dev/null 2>&1; then
  gcloud artifacts repositories create "${REPO_NAME}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Gemini Rubik's Tutor images"
fi

echo "Ensuring Secret Manager secret GEMINI_API_KEY exists..."
if ! gcloud secrets describe GEMINI_API_KEY >/dev/null 2>&1; then
  gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
fi

read -r -s -p "Paste GEMINI_API_KEY and press Enter: " GEMINI_KEY_INPUT
echo

if [[ -z "${GEMINI_KEY_INPUT}" ]]; then
  echo "GEMINI_API_KEY cannot be empty."
  exit 1
fi

printf "%s" "${GEMINI_KEY_INPUT}" | gcloud secrets versions add GEMINI_API_KEY --data-file=- >/dev/null
unset GEMINI_KEY_INPUT

echo "Building container image with Cloud Build..."
gcloud builds submit --tag "${IMAGE_URI}" .

echo "Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_URI}" \
  --platform managed \
  --region "${REGION}" \
  --allow-unauthenticated \
  --port "8080" \
  --set-env-vars "^##^DEMO_MODE=${DEMO_MODE_VALUE}##CORS_ORIGIN=${CORS_ORIGIN_VALUE}##GEMINI_LIVE_MODEL=${GEMINI_LIVE_MODEL_VALUE}##GEMINI_FALLBACK_MODEL=${GEMINI_FALLBACK_MODEL_VALUE}" \
  --set-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest"

SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --region "${REGION}" --format='value(status.url)')

echo "Deployment complete."
echo "Service URL: ${SERVICE_URL}"
