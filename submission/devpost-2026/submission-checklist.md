# Submission Checklist

## Devpost Fields

- Project title finalized
- Category set to **Live Agents**
- `project-description.md` pasted into the text description field
- Public repo URL added
- Live app URL added

## Required Assets

- Architecture diagram uploaded from `architecture-diagram.svg`
- Google Cloud proof attached or linked from `google-cloud-proof.md`
- Demo video uploaded and under 4 minutes

## Repo Readiness

- README has judge spin-up instructions
- Public repo is pushed and clean
- Backend Cloud Run URL is reachable
- Frontend URL is reachable

## Final Sanity Checks

- Verify `/health`
- Verify `/api/runtime`
- Verify `/live`
- Verify `/labs/multiplayer`
- Verify legacy 2x2 link still works

## Zip Package

Generate with:

```bash
./scripts/package-devpost.sh
```

Output:

```bash
submission/ai-rubiks-tutor-devpost-2026.zip
```
