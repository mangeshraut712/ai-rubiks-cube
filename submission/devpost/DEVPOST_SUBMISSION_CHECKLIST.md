# Gemini Live Agent Challenge Checklist

Status date: 2026-03-05
Deadline: **March 16, 2026 @ 8:00 PM EDT**

Official references:
- https://geminiliveagentchallenge.devpost.com/
- https://geminiliveagentchallenge.devpost.com/rules
- https://geminiliveagentchallenge.devpost.com/details/dates

## 1) Category + Mandatory Tech Lock

Selected category: **Live Agents** (real-time Audio/Vision)

- [x] Uses a Gemini model
- [x] Uses Google GenAI SDK (`@google/genai`) or ADK
- [x] Uses at least one Google Cloud service
- [x] Live multimodal interaction path (see/hear/speak) implemented
- [ ] Interruption handling clearly demonstrated in video

## 1.5) Devpost Wizard Fields

- [ ] Project Overview step completed in Devpost UI (name + elevator pitch)
- [ ] Project Details step completed in Devpost UI (story + built with + links + media)
- [ ] Additional Info step completed in Devpost UI (all required fields)
- [ ] Submitter country entered
- [x] Category selected: `Live Agents`
- [x] Project start date entered as `03-01-26`
- [ ] Terms checkbox checked on final Submit step

## 2) Hard Submission Requirements

- [x] Devpost submission text completed (features, tech, data sources, learnings)
- [x] Public source repo URL provided with reproducible spin-up instructions
- [x] Proof of Google Cloud deployment provided (recording or explicit Cloud service code proof)
- [x] Architecture diagram attached and easy for judges to find
- [ ] Public demo video uploaded (**< 4 minutes**) showing real multimodal behavior (no mockups)

## 3) Artifact Links (Fill Before Final Submit)

- [ ] Demo video URL (YouTube/Vimeo, <4m): `TODO_ADD_VIDEO_URL`
- [x] Public repository URL: `https://github.com/mangeshraut712/ai-rubiks-cube`
- [x] Live Cloud Run URL: `https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app`
- [x] Cloud deployment proof URL/recording: `https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/health` (`{"status":"ok","model":"gemini-live"}`) + `https://github.com/mangeshraut712/ai-rubiks-cube/tree/main/terraform` + `https://github.com/mangeshraut712/ai-rubiks-cube/blob/main/cloudbuild.yaml` + `https://github.com/mangeshraut712/ai-rubiks-cube/blob/main/deploy.sh` + `https://github.com/mangeshraut712/ai-rubiks-cube/blob/main/backend/src/geminiLiveClient.js`
- [x] Devpost file upload package prepared: `submission/Gemini_Rubiks_Tutor_Final_Submission.zip` (clean project zip for Devpost File Upload)
- [ ] Published article/post with `#GeminiLiveAgentChallenge`: `TODO_ADD_PUBLISHED_ARTICLE_URL`
- [x] Blog draft in repo: `submission/devpost/devpost-blog-post.md`
- [x] Architecture diagram uploaded via Devpost File Upload (also mirrored in `README.md` mermaid section + `submission/architecture/architecture.mmd`)

## 4) Judging Criteria Mapping

| Criteria | Weight | Current Evidence | Status |
|---|---:|---|---|
| Innovation & Multimodal User Experience | 40% | Live audio + webcam + tutor persona + real-time flow | Strong |
| Technical Implementation & Agent Architecture | 30% | `@google/genai`, WebSocket backend, deterministic grounding (Kociemba) | Strong |
| Demo & Presentation | 30% | Docs + architecture + deploy scripts + Cloud proof links | Needs final public demo video (+ optional live URL) |

## 5) Bonus Opportunities

- [ ] Publish article/video/podcast with explicit contest mention + hashtag
- [x] Automated cloud deployment scripts / IaC included (`terraform/`, `cloudbuild.yaml`, `deploy.sh`)
- [ ] GDG profile link added (optional)

## 6) Final Runbook

1. Record and upload <4-minute public demo showing real multimodal interaction and interruptions.
2. Paste demo URL into this checklist and Devpost submission.
3. (Optional but recommended) Deploy/refresh Cloud Run and paste live URL (`./deploy.sh <PROJECT_ID>` + `/health` check).
4. Publish article/post and attach link for bonus points.
5. Submit on Devpost after verifying no required field is left as TODO.
