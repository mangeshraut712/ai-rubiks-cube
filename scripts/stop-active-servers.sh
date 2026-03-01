#!/usr/bin/env bash
set -euo pipefail

PORTS=(3000 3005 5173 8080)
STOPPED=0

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
