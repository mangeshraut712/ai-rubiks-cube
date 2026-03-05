#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Starting Core 2x2 solver UI..."
echo "Open: http://localhost:5173/legacy-2x2-solver/index.html"

cd "${ROOT_DIR}/frontend"
npm run dev
