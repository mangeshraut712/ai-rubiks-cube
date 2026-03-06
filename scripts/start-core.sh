#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Starting Part 2: Cubey Core 2x2 lab..."
echo "Open: http://localhost:5173/part-2"

cd "${ROOT_DIR}/frontend"
npm run dev
