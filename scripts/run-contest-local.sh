#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="${ROOT_DIR}/.runtime"
BACKEND_LOG="${RUNTIME_DIR}/backend.log"
FRONTEND_LOG="${RUNTIME_DIR}/frontend.log"

mkdir -p "${RUNTIME_DIR}"

DEMO_MODE_EFFECTIVE="${CONTEST_DEMO_MODE:-true}"
CORS_ORIGIN_EFFECTIVE="${CORS_ORIGIN_OVERRIDE:-*}"
LIVE_MODEL_EFFECTIVE="${GEMINI_LIVE_MODEL_OVERRIDE:-${GEMINI_LIVE_MODEL:-gemini-2.0-flash-live-preview-04-09}}"
FALLBACK_MODEL_EFFECTIVE="${GEMINI_FALLBACK_MODEL_OVERRIDE:-${GEMINI_FALLBACK_MODEL:-gemini-2.0-flash-exp}}"
WS_URL_EFFECTIVE="${VITE_WS_URL_OVERRIDE:-ws://localhost:5173/ws}"

if [[ -f "${ROOT_DIR}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/.env"
  set +a
fi

HAS_VALID_KEY=false
if [[ "${GEMINI_API_KEY:-}" =~ ^AIza[A-Za-z0-9_-]{20,}$ ]]; then
  HAS_VALID_KEY=true
fi

if [[ "${HAS_VALID_KEY}" != "true" && "${DEMO_MODE_EFFECTIVE}" != "true" ]]; then
  echo "Missing/invalid GEMINI_API_KEY and DEMO mode is disabled."
  echo "Set a valid GEMINI_API_KEY or run with CONTEST_DEMO_MODE=true."
  exit 1
fi

if [[ "${HAS_VALID_KEY}" != "true" && "${DEMO_MODE_EFFECTIVE}" == "true" ]]; then
  echo "No valid GEMINI_API_KEY found. Starting in local demo fallback mode."
fi

"${ROOT_DIR}/scripts/stop-active-servers.sh"

echo "Starting backend on :8080 (DEMO_MODE=${DEMO_MODE_EFFECTIVE})..."
(
  cd "${ROOT_DIR}/backend"
  PORT=8080 \
  CORS_ORIGIN="${CORS_ORIGIN_EFFECTIVE}" \
  DEMO_MODE="${DEMO_MODE_EFFECTIVE}" \
  GEMINI_API_KEY="${GEMINI_API_KEY}" \
  GEMINI_LIVE_MODEL="${LIVE_MODEL_EFFECTIVE}" \
  GEMINI_FALLBACK_MODEL="${FALLBACK_MODEL_EFFECTIVE}" \
  node src/server.js
) >"${BACKEND_LOG}" 2>&1 &
BACKEND_PID=$!
echo "${BACKEND_PID}" > "${RUNTIME_DIR}/backend.pid"

sleep 2
if ! curl -fsS "http://localhost:8080/health" >/dev/null; then
  echo "Backend health check failed. See ${BACKEND_LOG}"
  exit 1
fi

echo "Starting frontend on :5173..."
(
  cd "${ROOT_DIR}/frontend"
  VITE_WS_URL="${WS_URL_EFFECTIVE}" npm run dev -- --host 0.0.0.0 --port 5173
) >"${FRONTEND_LOG}" 2>&1 &
FRONTEND_PID=$!
echo "${FRONTEND_PID}" > "${RUNTIME_DIR}/frontend.pid"

sleep 3
if ! curl -fsS "http://localhost:5173" >/dev/null; then
  echo "Frontend check failed. See ${FRONTEND_LOG}"
  exit 1
fi

echo "Opening Chrome at http://localhost:5173 ..."
open -a "Google Chrome" "http://localhost:5173" || true

echo
echo "Contest stack is running."
echo "Backend PID:  ${BACKEND_PID} (log: ${BACKEND_LOG})"
echo "Frontend PID: ${FRONTEND_PID} (log: ${FRONTEND_LOG})"
echo "Stop with: ${ROOT_DIR}/scripts/stop-active-servers.sh"
