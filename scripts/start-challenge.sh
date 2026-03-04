#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

DEMO_MODE="${DEMO_MODE:-true}" PORT="${PORT:-8080}" "${ROOT_DIR}/scripts/start-core.sh"
