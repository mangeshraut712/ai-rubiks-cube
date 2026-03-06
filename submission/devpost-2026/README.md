# Devpost Submission Package

This folder is the judge-ready submission bundle for the Gemini Live Agent Challenge.

## Included Files

- `project-description.md`: copy-ready Devpost text description
- `requirements-crosscheck.md`: requirement-by-requirement contest fit check
- `google-cloud-proof.md`: proof of Google Cloud deployment with repo references
- `architecture-diagram.svg`: architecture image for Devpost upload/carousel
- `architecture-notes.md`: explanation of the diagram
- `demo-video-script.md`: under-4-minute demo outline
- `submission-checklist.md`: final upload checklist

## Recommended Judge Order

1. Read `project-description.md`
2. Upload `architecture-diagram.svg`
3. Use `google-cloud-proof.md` for the Cloud proof field
4. Follow `submission-checklist.md` before publishing

## URLs

- Public repo: https://github.com/mangeshraut712/ai-rubiks-cube
- Frontend: https://ai-rubiks-cube.vercel.app/
- Backend health: https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/health
- Runtime metadata: https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/api/runtime

## Zip Command

From the repo root:

```bash
./scripts/package-devpost.sh
```

This generates:

```bash
submission/ai-rubiks-tutor-devpost-2026.zip
```
