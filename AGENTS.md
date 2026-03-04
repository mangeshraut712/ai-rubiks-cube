# Agent Security Guardrail

For every new user prompt and before any commit/push/deploy action:

1. Run `./scripts/security-check.sh --scope prompt` when starting work for a new request.
   Include a short prompt summary for memory:
   `./scripts/security-check.sh --scope prompt --context "<prompt summary>"`
2. Run the scope-specific gate before VCS/release actions:
   - `commit`: `./scripts/security-check.sh --scope commit`
   - `push`: `./scripts/security-check.sh --scope push`
   - `deploy`: `./scripts/security-check.sh --scope deploy`
3. Treat failures as blockers until fixed or explicitly acknowledged by the user.
4. Use `.runtime/security-memory.log` as the running memory trail of security checks.
5. Use `SECURITY.md` as the manual release checklist source of truth.
