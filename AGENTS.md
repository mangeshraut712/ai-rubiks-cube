# AI Rubik's Tutor Agent Guide

## Project Surfaces

- `frontend/`: React 19 app for the live tutor, multiplayer lab, and routed product shell.
- `backend/`: Express 5 service for runtime metadata, Gemini Live integration, cube solving, and WebSocket signaling.
- `frontend/public/legacy-2x2-solver/`: classic 2x2 solver surface kept for demos and comparison.
- `submission/devpost-2026/`: submission assets and judge-facing documentation.

## Start Here

- Read `README.md` for product/deploy context.
- Read `docs/FEATURES.md` before making broad product changes.
- If touching the classic solver, preserve the shared cube core in `frontend/public/legacy-2x2-solver/cube-core.js`.

## High-Value Commands

- Frontend dev: `cd frontend && npm run dev`
- Frontend checks: `cd frontend && npm run lint && npm run test -- --run && npm run build`
- Backend dev: `cd backend && npm run dev`
- Backend checks: `cd backend && npm run lint && npm test`
- Security pass: `./scripts/security-check.sh --scope deploy`

## Project Guardrails

- Keep the live tutor shell and the classic 2x2 surface visually aligned unless the user asks for intentional divergence.
- Preserve cube logic correctness first. Do not rewrite solving behavior for style-only requests.
- Do not commit secrets or edit tracked env examples casually.
- Prefer small, testable changes over wide rewrites unless the user explicitly asks for a full redesign.

## OpenAI/Codex Guidance

- Use the OpenAI Developer Docs MCP server for Codex/OpenAI platform questions when available.
- Prefer `goal-driven` for large changes and `simplicity-first` when reducing scope or abstraction.
