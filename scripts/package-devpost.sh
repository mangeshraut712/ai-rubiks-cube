#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_DIR="${ROOT_DIR}/submission/devpost-2026"
OUTPUT_ZIP="${ROOT_DIR}/submission/ai-rubiks-tutor-devpost-2026.zip"

if [[ ! -d "${PACKAGE_DIR}" ]]; then
  echo "Missing submission directory: ${PACKAGE_DIR}"
  exit 1
fi

rm -f "${OUTPUT_ZIP}"

(
  cd "${ROOT_DIR}/submission"
  zip -r "ai-rubiks-tutor-devpost-2026.zip" "devpost-2026" >/dev/null
)

echo "Created ${OUTPUT_ZIP}"
