# Submission Checklist

Crosschecked on March 7, 2026.

## Repo readiness

- [x] Repo clearly presents exactly two products:
  Part 1 `Gemini Live Tutor`
  Part 2 `Cubey Core 2x2 Lab`
- [x] Root `README.md` contains spin-up instructions
- [x] Public repository URL is available:
  `https://github.com/mangeshraut712/ai-rubiks-cube`
- [x] Google Cloud deployment code is in repo
- [x] Architecture diagram is in repo
- [x] Project description copy is in repo
- [x] Submission crosscheck is in repo
- [x] Cloud proof write-up is in repo
- [x] Demo script is in repo

## Public link check

- [x] Cloud Run root works:
  `https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/`
- [x] Cloud Run health works:
  `https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/health`
- [x] Cloud Run runtime works:
  `https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/api/runtime`
- [x] Cloud Run runtime is readable from the public frontend origin:
  `Origin: https://ai-rubiks-cube.vercel.app`
- [x] Part 2 route works:
  `https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/part-2`

## Devpost form material

- [x] Text description:
  `project-description.md`
- [x] Requirement mapping:
  `requirements-crosscheck.md`
- [x] Google Cloud proof:
  `google-cloud-proof.md`
- [x] Architecture asset:
  `architecture-diagram.svg`
- [x] Demo script:
  `demo-video-script.md`

## Manual steps still required outside git

- [ ] Record the actual demo video file under 4 minutes
- [ ] Upload the demo video to Devpost
- [ ] Upload the architecture image to Devpost
- [ ] Paste the description into the Devpost form
- [ ] Optionally attach or record a short behind-the-scenes Cloud Run proof clip

## Recommended submission order

1. Use `project-description.md` for the Devpost written sections.
2. Upload `architecture-diagram.svg`.
3. Record the demo using `demo-video-script.md`.
4. Double-check live URLs before pressing submit.
