#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: ./contest/deploy-cloud-run.sh <GCP_PROJECT_ID>"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ID="$1"

export DEMO_MODE_VALUE="${DEMO_MODE_VALUE:-true}"
export CORS_ORIGIN_VALUE="${CORS_ORIGIN_VALUE:-*}"
export GEMINI_LIVE_MODEL_VALUE="${GEMINI_LIVE_MODEL_VALUE:-gemini-2.0-flash-live-preview-04-09}"
export GEMINI_FALLBACK_MODEL_VALUE="${GEMINI_FALLBACK_MODEL_VALUE:-gemini-2.0-flash-exp}"

echo "Deploying contest profile with DEMO_MODE=${DEMO_MODE_VALUE}"
cd "${ROOT_DIR}"
./deploy.sh "${PROJECT_ID}"
