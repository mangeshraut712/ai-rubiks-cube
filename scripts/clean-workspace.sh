#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Cleaning local workspace artifacts..."

rm -rf \
  "${ROOT_DIR}/local-cache" \
  "${ROOT_DIR}/Gemini-Rubiks-Tutor/local-cache" \
  "${ROOT_DIR}/backend/local-cache" \
  "${ROOT_DIR}/frontend/local-cache" \
  "${ROOT_DIR}/backend/node_modules" \
  "${ROOT_DIR}/frontend/node_modules" \
  "${ROOT_DIR}/backend/cache" \
  "${ROOT_DIR}/frontend/dist" \
  "${ROOT_DIR}/frontend/dev-dist" \
  "${ROOT_DIR}/frontend/coverage" \
  "${ROOT_DIR}/backend/coverage" \
  "${ROOT_DIR}/frontend/.vite" \
  "${ROOT_DIR}/.runtime" \
  "${ROOT_DIR}/.trash"

rm -f \
  "${ROOT_DIR}/backend.log" \
  "${ROOT_DIR}/frontend.log" \
  "${ROOT_DIR}"/*.pid

find "${ROOT_DIR}" -name ".DS_Store" -type f -delete

# Remove legacy empty helper dir if it only held cache artifacts.
rmdir "${ROOT_DIR}/Gemini-Rubiks-Tutor" 2>/dev/null || true

echo "Done."
