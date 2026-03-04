# Devpost Submission Checklist

Last cross-checked: 2026-03-04

Official references:
- https://geminiliveagentchallenge.devpost.com/
- https://geminiliveagentchallenge.devpost.com/rules
- https://geminiliveagentchallenge.devpost.com/details/dates

## 1. Hard Requirements

- [ ] Devpost submission page filled with final title, description, and impact statement.
- [ ] Demo behavior is shown in a video and/or clearly explained in the text description (rule wording).
- [ ] Public source repository link is added to the submission.
- [ ] Google Cloud usage is shown (Cloud Run and deployment workflow evidence).
- [ ] Gemini Live API usage is shown with concrete implementation references.
- [ ] Architecture diagram is included in submission materials.

## 2. Artifact Links (Fill Before Final Submit)

- [ ] Demo video (YouTube/Vimeo, max 4 minutes): `TODO_ADD_VIDEO_URL`
- [ ] Public repository URL: `TODO_ADD_REPO_URL`
- [ ] Live deployment URL: `TODO_ADD_CLOUD_RUN_URL`
- [ ] Cloud deployment proof recording (or equivalent visual proof): `TODO_ADD_CLOUD_PROOF_URL`
- [ ] Published article/post with `#GeminiLiveAgentChallenge`: `TODO_ADD_PUBLISHED_ARTICLE_URL`
- [x] Blog draft prepared in repo: [`devpost-blog-post.md`](devpost-blog-post.md)
- [x] Architecture diagram in repo: [`README.md`](README.md)

## 3. Judging Criteria Coverage Map

| Criteria | Weight | Current Evidence | Status |
|---|---:|---|---|
| Innovation & Multimodal UX | 40% | Live audio + webcam + speaker loop, interruption handling, tutor persona | Strong |
| Technical Implementation & Agent Architecture | 30% | `@google/genai`, WebSocket transport, deterministic cube-state grounding | Strong |
| Demo & Presentation | 30% | Quickstart, architecture diagram, deployment docs | Needs final video + public links |

## 4. Repo Evidence Pointers

- Live connection: [`backend/src/geminiLiveClient.js`](backend/src/geminiLiveClient.js)
- Interruption flow: [`backend/src/server.js`](backend/src/server.js)
- Hint/challenge flows: [`backend/src/server.js`](backend/src/server.js)
- Cloud deploy scripts: [`deploy.sh`](deploy.sh), [`cloudbuild.yaml`](cloudbuild.yaml), [`contest/deploy-cloud-run.sh`](contest/deploy-cloud-run.sh)
- Terraform IaC: [`terraform/main.tf`](terraform/main.tf)

## 5. Final Pre-Submit Runbook

1. Publish the demo video and paste URL here + Devpost.
2. Publish the blog article and paste URL here + Devpost.
3. Set production origins and deploy:
   - `export CORS_ORIGIN_VALUE="https://your-frontend-domain.com,https://*.run.app"`
   - `./deploy.sh YOUR_GCP_PROJECT_ID`
4. Confirm `GET /health` works on deployed URL.
5. Run `./scripts/security-check.sh --scope deploy` and resolve failures.
