#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

REMOVE_SOLVER_CACHE=false
REMOVE_NODE_MODULES=false

for arg in "$@"; do
  case "$arg" in
    --solver-cache)
      REMOVE_SOLVER_CACHE=true
      ;;
    --node-modules)
      REMOVE_NODE_MODULES=true
      ;;
    *)
      echo "Unknown option: $arg"
      echo "Usage: $0 [--solver-cache] [--node-modules]"
      exit 1
      ;;
  esac
done

echo "==> Stopping active local servers"
bash "${ROOT_DIR}/scripts/stop-active-servers.sh" >/dev/null 2>&1 || true

TARGETS=(
  "${ROOT_DIR}/.runtime"
  "${ROOT_DIR}/frontend/dist"
  "${ROOT_DIR}/backend/local-cache"
  "${ROOT_DIR}/frontend/local-cache"
  "${ROOT_DIR}/local-cache"
  "${ROOT_DIR}/local-cache-frontend"
  "${ROOT_DIR}/backend.log"
  "${ROOT_DIR}/frontend.log"
)

if [[ "${REMOVE_SOLVER_CACHE}" == "true" ]]; then
  TARGETS+=("${ROOT_DIR}/backend/cache")
fi

if [[ "${REMOVE_NODE_MODULES}" == "true" ]]; then
  TARGETS+=("${ROOT_DIR}/backend/node_modules" "${ROOT_DIR}/frontend/node_modules")
fi

echo "==> Removing local artifacts"
for target in "${TARGETS[@]}"; do
  if [[ -e "${target}" ]]; then
    echo " - removing ${target}"
    rm -rf "${target}"
  fi
done

echo "==> Cleanup completed"
if [[ "${REMOVE_SOLVER_CACHE}" == "false" ]]; then
  echo "Tip: add --solver-cache to remove kociemba generated tables."
fi
if [[ "${REMOVE_NODE_MODULES}" == "false" ]]; then
  echo "Tip: add --node-modules for a full dependency cleanup."
fi
