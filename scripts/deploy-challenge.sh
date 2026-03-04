#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ $# -lt 1 ]]; then
  echo "Usage: ./scripts/deploy-challenge.sh <GCP_PROJECT_ID>"
  exit 1
fi

"${ROOT_DIR}/contest/deploy-cloud-run.sh" "$1"
