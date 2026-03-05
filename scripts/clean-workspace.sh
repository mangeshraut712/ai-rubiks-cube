#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Cleaning local workspace artifacts..."

rm -rf \
  "${ROOT_DIR}/local-cache" \
  "${ROOT_DIR}/backend/node_modules" \
  "${ROOT_DIR}/frontend/node_modules" \
  "${ROOT_DIR}/frontend/dist" \
  "${ROOT_DIR}/frontend/local-cache" \
  "${ROOT_DIR}/.runtime" \
  "${ROOT_DIR}/.trash"

rm -f \
  "${ROOT_DIR}/backend.log" \
  "${ROOT_DIR}/frontend.log" \
  "${ROOT_DIR}"/*.pid

find "${ROOT_DIR}" -name ".DS_Store" -type f -delete

echo "Done."
