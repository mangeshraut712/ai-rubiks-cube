#!/usr/bin/env bash
set -euo pipefail

SCOPE="general"
CI_MODE="false"
CONTEXT_NOTE="${SECURITY_CONTEXT:-}"

usage() {
  cat <<'EOF'
Usage: ./scripts/security-check.sh [--scope <prompt|commit|push|deploy>] [--context "<note>"] [--ci]

Scopes:
  prompt  - run before starting work on a new prompt/request
  commit  - run against staged changes before commit
  push    - run against branch delta before push
  deploy  - run full checks before deployment
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --scope)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for --scope"
        usage
        exit 2
      fi
      SCOPE="$2"
      shift 2
      ;;
    --context)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for --context"
        usage
        exit 2
      fi
      CONTEXT_NOTE="$2"
      shift 2
      ;;
    --ci)
      CI_MODE="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      usage
      exit 2
      ;;
  esac
done

case "$SCOPE" in
  prompt|commit|push|deploy|general)
    ;;
  *)
    echo "Invalid scope: $SCOPE"
    usage
    exit 2
    ;;
esac

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RUNTIME_DIR="/tmp/.runtime"
MEMORY_FILE="$RUNTIME_DIR/security-memory.log"
mkdir -p "$RUNTIME_DIR"

declare -a FAILURES=()
declare -a WARNINGS=()
declare -a TARGET_FILES=()

add_failure() {
  FAILURES+=("$1")
}

add_warning() {
  WARNINGS+=("$1")
}

collect_target_files() {
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    case "$SCOPE" in
      commit)
        git diff --cached --name-only --diff-filter=ACMR
        ;;
      push)
        local upstream=""
        upstream="$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null || true)"
        if [[ -n "$upstream" ]]; then
          if git merge-base "$upstream" HEAD >/dev/null 2>&1; then
            git diff --name-only --diff-filter=ACMR "${upstream}...HEAD"
          else
            git diff --name-only --diff-filter=ACMR "${upstream}..HEAD"
          fi
        else
          git ls-files
        fi
        ;;
      *)
        git ls-files
        ;;
    esac
  else
    if command -v rg >/dev/null 2>&1; then
      rg --files
    else
      find . -type f \
        -not -path './.git/*' \
        -not -path './node_modules/*' \
        -not -path './cache/*' \
        -not -path './.runtime/*'
    fi
  fi
}

while IFS= read -r line; do
  [[ -n "${line//[[:space:]]/}" ]] || continue
  TARGET_FILES+=("$line")
done < <(collect_target_files)

write_memory() {
  local status="$1"
  local ts=""
  local clean_context=""
  ts="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  clean_context="$(printf '%s' "$CONTEXT_NOTE" | tr '\n' ' ' | tr -s ' ' | cut -c1-200)"
  {
    echo "[$ts] scope=$SCOPE status=$status files=${#TARGET_FILES[@]} failures=${#FAILURES[@]} warnings=${#WARNINGS[@]} ci=$CI_MODE context=\"$clean_context\""
    if [[ ${#FAILURES[@]} -gt 0 ]]; then
      for item in "${FAILURES[@]}"; do
        printf '  FAIL: %s\n' "$(printf '%s' "$item" | head -n 1)"
      done
    fi
    if [[ ${#WARNINGS[@]} -gt 0 ]]; then
      for item in "${WARNINGS[@]}"; do
        printf '  WARN: %s\n' "$(printf '%s' "$item" | head -n 1)"
      done
    fi
  } >> "$MEMORY_FILE"
}

if [[ "$SCOPE" == "commit" && ${#TARGET_FILES[@]} -eq 0 ]]; then
  echo "Security check skipped: no staged files."
  write_memory "SKIP"
  exit 0
fi

declare -a SECRET_SCAN_FILES=()
for file in "${TARGET_FILES[@]-}"; do
  [[ -f "$file" ]] || continue
  case "$file" in
    *.md|*.txt|*.png|*.jpg|*.jpeg|*.svg|*.ico|*.gif|*.pdf|*.lock|backend/package-lock.json|frontend/package-lock.json|.env.example|contest/.env.judges.example)
      continue
      ;;
  esac
  SECRET_SCAN_FILES+=("$file")
done

secret_hits=""
if [[ ${#SECRET_SCAN_FILES[@]} -gt 0 ]]; then
  if command -v rg >/dev/null 2>&1; then
    secret_hits="$(
      printf '%s\0' "${SECRET_SCAN_FILES[@]}" | xargs -0 rg --line-number --no-heading --color=never \
        -e '(api[_-]?key|secret|token|password)\s*[:=]\s*["'"'"'`][^"'"'"'`\s]{12,}["'"'"'`]' \
        -e '-----BEGIN (RSA |EC )?PRIVATE KEY-----' \
        -e 'AIza[0-9A-Za-z_-]{35}' \
        -e 'ghp_[0-9A-Za-z]{36}' \
        -e 'AKIA[0-9A-Z]{16}' \
        -e 'xox[baprs]-[0-9A-Za-z-]{10,}' 2>/dev/null || true
    )"
  else
    secret_hits="$(
      printf '%s\0' "${SECRET_SCAN_FILES[@]}" | xargs -0 grep -nHE \
        '(api[_-]?key|secret|token|password)[[:space:]]*[:=][[:space:]]*["'"'"'`][^"'"'"'`[:space:]]{12,}["'"'"'`]|-----BEGIN (RSA |EC )?PRIVATE KEY-----|AIza[0-9A-Za-z_-]{35}|ghp_[0-9A-Za-z]{36}|AKIA[0-9A-Z]{16}|xox[baprs]-[0-9A-Za-z-]{10,}' 2>/dev/null || true
    )"
  fi
fi

if [[ -n "$secret_hits" ]]; then
  add_failure $'Possible hardcoded secrets found:\n'"$secret_hits"
fi

tracked_env_hits=""
tracked_env_hits="$(
  printf '%s\n' "${TARGET_FILES[@]-}" \
    | { if command -v rg >/dev/null 2>&1; then rg '(^|/)\.env($|(\.[^/]+$))'; else grep -E '(^|/)\.env($|(\.[^/]+$))'; fi; } \
    | { if command -v rg >/dev/null 2>&1; then rg -v '(\.example$|\.sample$|\.template$|contest/\.env\.judges\.example$)'; else grep -Ev '(\.example$|\.sample$|\.template$|contest/\.env\.judges\.example$)'; fi; } \
    || true
)"

if [[ -n "$tracked_env_hits" ]]; then
  add_failure $'Tracked env files detected (should stay untracked):\n'"$tracked_env_hits"
fi

if [[ "$SCOPE" == "deploy" || "$SCOPE" == "prompt" ]]; then
  effective_cors="${SECURITY_CORS_ORIGIN:-}"
  if [[ -n "$effective_cors" && "$effective_cors" == "*" ]]; then
    add_failure "CORS origin is '*'. Set a trusted origin before deployment."
  elif [[ -z "$effective_cors" ]]; then
    if rg -n \
      -e 'CORS_ORIGIN[^[:cntrl:]]*:-\*' \
      -e 'CORS_ORIGIN[^[:cntrl:]]*[:=][[:space:]]*"\*"' \
      deploy.sh cloudbuild.yaml contest/deploy-cloud-run.sh terraform/variables.tf >/dev/null 2>&1; then
      add_warning "Deployment defaults still allow CORS '*'. Override CORS_ORIGIN_VALUE/_CORS_ORIGIN for production."
    fi
  fi

  effective_demo="${SECURITY_DEMO_MODE:-}"
  if [[ "$SCOPE" == "deploy" && "$effective_demo" == "true" ]]; then
    add_warning "DEMO_MODE is true for deployment. Confirm this is intentional."
  fi

  if [[ "$SCOPE" == "prompt" && -z "$CONTEXT_NOTE" ]]; then
    add_warning "No --context note supplied for prompt memory."
  fi
fi

if [[ "$SCOPE" == "deploy" ]]; then
  add_warning "Run manual checklist sections in SECURITY.md for auth/rate-limit/input before release."
fi

echo "Security check scope: $SCOPE"
echo "Files considered: ${#TARGET_FILES[@]}"

if [[ ${#WARNINGS[@]} -gt 0 ]]; then
  echo
  echo "Warnings:"
  for item in "${WARNINGS[@]}"; do
    echo "- $item"
  done
fi

if [[ ${#FAILURES[@]} -gt 0 ]]; then
  echo
  echo "Failures:"
  for item in "${FAILURES[@]}"; do
    echo "- $item"
  done
  write_memory "FAIL"
  exit 1
fi

echo "Security check passed."
write_memory "PASS"
