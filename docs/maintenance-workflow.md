# Core vs Contest Maintenance Workflow

This repository should be maintained with two long-lived branches:

- `main`: stable core codebase
- `contest/live-agent`: contest submission variant (judge/deploy tuned)

## One-Time Setup

```bash
git checkout main
git pull origin main
git checkout -b contest/live-agent
git push -u origin contest/live-agent
```

## Recommended Daily Workflow

1. Build and stabilize features on `main`.
2. Cherry-pick only validated commits into `contest/live-agent`.
3. Keep contest-only files in `contest/` and `docs/*contest*` where possible.
4. Before submission updates, run:
   - `./scripts/verify-contest-stack.sh`
   - `./scripts/run-contest-local.sh`
5. Tag immutable contest releases:

```bash
git checkout contest/live-agent
git tag -a contest-freeze-v1 -m "Contest-ready freeze"
git push origin contest/live-agent --tags
```

## Isolated Worktrees (Optional, Safer)

Use separate folders to avoid branch contamination:

```bash
git worktree add ../Gemini-Rubiks-Tutor-main main
git worktree add ../Gemini-Rubiks-Tutor-contest contest/live-agent
```

This lets you iterate on `main` while preserving a clean contest-ready tree.
