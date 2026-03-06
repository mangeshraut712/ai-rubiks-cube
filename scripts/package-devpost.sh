#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_DIR="${ROOT_DIR}/submission/devpost-2026"
OUTPUT_ZIP="${ROOT_DIR}/submission/ai-rubiks-tutor-devpost-2026.zip"

if [[ ! -d "${PACKAGE_DIR}" ]]; then
  echo "Missing package directory: ${PACKAGE_DIR}" >&2
  exit 1
fi

rm -f "${OUTPUT_ZIP}"

if command -v zip >/dev/null 2>&1; then
  (
    cd "${ROOT_DIR}/submission"
    zip -qr "${OUTPUT_ZIP}" "devpost-2026"
  )
else
  ditto -c -k --sequesterRsrc --keepParent "${PACKAGE_DIR}" "${OUTPUT_ZIP}"
fi

echo "Created ${OUTPUT_ZIP}"
