#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="${ROOT_DIR}/.runtime"

# Default local app ports used by scripts/dev workflow.
PORTS=(5173 5174 8080 3005 3000 8081)
STOPPED=0

stop_pid_file() {
  local pid_file="$1"
  if [[ -f "${pid_file}" ]]; then
    local pid
    pid="$(cat "${pid_file}" 2>/dev/null || true)"
    if [[ -n "${pid}" ]] && kill -0 "${pid}" 2>/dev/null; then
      echo "Stopping PID ${pid} from $(basename "${pid_file}")"
      kill "${pid}" || true
      STOPPED=1
    fi
    rm -f "${pid_file}"
  fi
}

# Prefer PID files when available.
stop_pid_file "${RUNTIME_DIR}/backend.pid"
stop_pid_file "${RUNTIME_DIR}/frontend.pid"
stop_pid_file "${RUNTIME_DIR}/backend.restart.pid"
stop_pid_file "${RUNTIME_DIR}/frontend.restart.pid"

# Also stop anything still listening on known ports.
for PORT in "${PORTS[@]}"; do
  PIDS="$(lsof -ti tcp:${PORT} -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "${PIDS}" ]]; then
    echo "Stopping listeners on :${PORT} -> ${PIDS}"
    kill ${PIDS} || true
    STOPPED=1
  fi
done

if [[ ${STOPPED} -eq 0 ]]; then
  echo "No active app servers found on monitored ports."
else
  sleep 1
  echo "Active app servers terminated."
fi
