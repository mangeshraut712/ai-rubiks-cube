#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT_VALUE="${PORT:-8080}"
DEMO_MODE_VALUE="${DEMO_MODE:-false}"

echo "Starting Gemini contest tutor..."
echo "Backend: http://localhost:${PORT_VALUE}"
echo "Frontend: http://localhost:5173"

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "${BACKEND_PID}" >/dev/null 2>&1 || true
  fi
  if [[ -n "${FRONTEND_PID:-}" ]]; then
    kill "${FRONTEND_PID}" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

(
  cd "${ROOT_DIR}/backend"
  PORT="${PORT_VALUE}" DEMO_MODE="${DEMO_MODE_VALUE}" npm run dev
) &
BACKEND_PID=$!

(
  cd "${ROOT_DIR}/frontend"
  npm run dev
) &
FRONTEND_PID=$!

wait "${BACKEND_PID}" "${FRONTEND_PID}"
