# Security Checklist and Gate

This repository uses a lightweight security gate for four moments:

1. New prompt/context switch (`prompt`)
2. Before commit (`commit`)
3. Before push (`push`)
4. Before deployment (`deploy`)

Run manually at any time:

```bash
./scripts/security-check.sh --scope prompt --context "short summary of current user request"
./scripts/security-check.sh --scope commit
./scripts/security-check.sh --scope push
./scripts/security-check.sh --scope deploy
```

The script appends a short memory trail to `.runtime/security-memory.log` inside the repo.
For `deploy`, it also runs `npm audit --omit=dev --audit-level=high` in both `backend/` and `frontend/`.

## 01 - Secrets and Config

- [ ] No hardcoded secrets, tokens, or API keys in tracked code
- [ ] Secrets are not leaked in logs, error messages, or API responses
- [ ] Real `.env` files are not tracked in git
- [ ] API keys are not exposed client-side when they should stay server-only
- [ ] CORS is restricted to trusted origins (not `*`) for production
- [ ] Redirect targets are validated against an allow-list before 302 redirects
- [ ] No dependency alerts ignored for production releases
- [ ] No default credentials or placeholder config left enabled
- [ ] Debug/dev-only behavior is disabled in production

## 02 - Access and API

- [ ] Auth is required for protected pages/routes
- [ ] No IDOR risk (changing IDs in URL cannot access other user data)
- [ ] Tokens are stored securely on the client
- [ ] Login/reset flows do not reveal whether an account exists
- [ ] Sensitive endpoints are rate-limited
- [ ] WebSocket and signaling messages are schema-validated and size-limited
- [ ] Error responses do not expose internal implementation details
- [ ] Endpoints only return the minimum required data
- [ ] Sensitive actions require explicit confirmation
- [ ] Admin routes are protected by backend authorization, not hidden URLs

## 03 - User Input

- [ ] User input is sanitized/validated before DB queries
- [ ] Output encoding prevents XSS from user content
- [ ] File uploads enforce type and size limits
- [ ] Payment/billing logic cannot be bypassed client-side

## Release Rule

Treat any failed automated gate or unchecked critical item above as a release blocker.
