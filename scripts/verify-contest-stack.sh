#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "1) Backend install check..."
cd "${ROOT_DIR}/backend"
npm run start -- --help >/dev/null &
PID=$!
sleep 2
kill "${PID}" >/dev/null 2>&1 || true
wait "${PID}" 2>/dev/null || true

echo "2) Frontend production build..."
cd "${ROOT_DIR}/frontend"
npm run build >/dev/null

echo "3) Backend /health smoke test..."
cd "${ROOT_DIR}/backend"
PORT=3012 GEMINI_API_KEY="smoke-test-key" node src/server.js >/tmp/gemini-rubiks-smoke.log 2>&1 &
SMOKE_PID=$!
sleep 2
curl -fsS "http://localhost:3012/health" >/dev/null
kill "${SMOKE_PID}" >/dev/null 2>&1 || true
wait "${SMOKE_PID}" 2>/dev/null || true

echo "Contest stack verification passed."
