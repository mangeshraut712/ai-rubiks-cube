#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Stopping active servers"
bash "${ROOT_DIR}/scripts/stop-active-servers.sh" >/dev/null 2>&1 || true

echo "==> Backend syntax checks"
cd "${ROOT_DIR}/backend"
node --check src/server.js
node --check src/geminiLiveClient.js
node --check src/cubeStateManager.js
node --check src/tutorPrompt.js

echo "==> Frontend production build"
cd "${ROOT_DIR}/frontend"
npm run build >/dev/null

echo "==> Contest verification"
cd "${ROOT_DIR}"
bash "${ROOT_DIR}/scripts/verify-contest-stack.sh" >/dev/null

echo "==> Quality check passed"
