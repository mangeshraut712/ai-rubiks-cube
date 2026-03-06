# AI Rubik's Tutor Agent Guide

## Project Surfaces

- `frontend/`: React 19 product shell for the repo overview and Part 1 Gemini live tutor.
- `backend/`: Express 5 service for runtime metadata, Gemini Live integration, cube solving, WebSocket signaling, and Cloud Run hosting.
- `frontend/public/legacy-2x2-solver/`: Part 2 Cubey Core 2x2 lab with the shared 24-sticker cube core.
- `submission/devpost-2026/`: submission-only docs bundle for Devpost text, proof, checklist, and architecture assets.

## Start Here

- Read `README.md` for product/deploy context.
- Read `docs/FEATURES.md` before making broad product changes.
- If touching Part 2, preserve the shared cube core in `frontend/public/legacy-2x2-solver/cube-core.js`.

## High-Value Commands

- Frontend dev: `cd frontend && npm run dev`
- Frontend checks: `cd frontend && npm run lint && npm run test -- --run && npm run build`
- Backend dev: `cd backend && npm run dev`
- Backend checks: `cd backend && npm run lint && npm test`
- Security pass: `./scripts/security-check.sh --scope deploy`

## Project Guardrails

- Keep Part 1 and Part 2 visually aligned unless the user asks for intentional divergence.
- Preserve cube logic correctness first. Do not rewrite solving behavior for style-only requests.
- Do not commit secrets or edit tracked env examples casually.
- Prefer small, testable changes over wide rewrites unless the user explicitly asks for a full redesign.

## OpenAI/Codex Guidance

- Use the OpenAI Developer Docs MCP server for Codex/OpenAI platform questions when available.
- Prefer `goal-driven` for large changes and `simplicity-first` when reducing scope or abstraction.
