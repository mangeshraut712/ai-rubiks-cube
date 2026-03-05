# Devpost Submission Form Template

*Use this document to easily copy-paste your answers into the Devpost submission portal.*

---

## General Info

**Project name**
`Gemini Rubik's Tutor`

**Elevator pitch** (Max 200 characters)
`An interactive, real-time AI tutor that watches you solve a Rubik's Cube and provides voice guidance using the Gemini Live API.`

## Devpost Wizard (Paste-Ready)

### Project Overview Step

**Project name**
`Gemini Rubik's Tutor`

**Elevator pitch**
`An interactive, real-time AI tutor that watches you solve a Rubik's Cube and provides voice guidance using the Gemini Live API.`

### Additional Info Step (Non-public judge fields)

**Submitter Type**
`Individual` *(or organization, if applicable)*

**Submitter country of residence**
`TODO_ADD_COUNTRY`

**Which category are you submitting to?**
`Live Agents`

**What date did you start this project? (MM-DD-YY)**
`03-01-26`

---

## Project Story

**About the project** (Markdown)
```markdown
## Inspiration
For the Gemini Live Agent Challenge, we were tasked with redefining how users interact with AI—stopping typing and starting interacting. I was inspired to create an experience where the AI can "See, Hear, and Speak" simultaneously, breaking out of the traditional text-based chatbot paradigm. I decided to build **The Gemini Rubik’s Tutor**, featuring "Cubey", a patient, observant AI who watches you solve a physical puzzle in the real world and coaches you step-by-step through voice.

## What it does
You don't use your keyboard. You use both hands to hold your physical Rubik's Cube. You simply talk to Cubey.
"Cubey, I'm stuck, where does this red piece go?"
Cubey looks through your camera, verifies the state against its internal Kociemba solver, and responds aloud: "I see it! You're doing great. Turn the top face clockwise towards you."
As it speaks, a beautiful 3D visualization animates the move on your screen.

## How we built it (Architecture)
The architecture seamlessly weaves together real-time browser MediaStreams, WebSockets, Google Cloud Run, and the powerful `@google/genai` Gemini Live API:
* **The "Eyes" (Real-Time Vision):** The React frontend captures the webcam feed and samples the `<canvas>` buffer at ~4 frames per second into compressed `image/jpeg` frames. These are piped over a WebSocket to a Node.js backend, which injects them directly into the active Gemini Live bidirectional stream.
* **The "Ears & Voice" (Gapless Web Audio):** We capture PCM16LE raw audio via the browser's audio context and send it to Gemini constantly. When Gemini responds, our backend forwards the raw PCM stream back to the client, scheduling it on the `AudioContext` timeline for perfectly gapless playback.
* **Anti-Hallucination (Grounding the AI):** To prevent the LLM from hallucinating impossible moves, I implemented the Kociemba Algorithm locally. The backend coordinates the detected state with the determinist Kociemba solver and whispers the *absolute ground truth* move to Gemini in system prompts, which Gemini then communicates naturally.

## Challenges we ran into
* **Gapless Audio Buffering:** Real-time speech from Gemini arrives in small PCM chunks. We learned that using standard HTML5 `<audio>` tags caused stuttering, forcing us to use the browser `AudioContext` for flawless playback.
* **WebSockets on Serverless:** We learned Vercel Serverless Functions do not natively support stateful WebSockets. This requirement forced us into a split-monorepo design—putting the frontend on Vercel/GitHub Pages, and orchestrating the WebSocket backend securely on Google Cloud Run.

## Accomplishments that we're proud of
* Implementing a fully real-time Live API application that eliminates the keyboard entirely.
* Successfully routing audio and video streams simultaneously over WebSockets without overwhelming the connection.
* Completely eliminating AI "hallucination" in puzzle-solving by rigidly grounding Gemini's outputs in a local solver.

## What we learned
When you combine real-world physical object manipulation with low-latency Audio and Vision, an LLM stops feeling like a "bot" and starts feeling like a localized, aware assistant. The future of interaction is hands-free, continuous, and "Live"!

## Findings & Data Sources
* **Vision Limitations vs Ground Truth:** We found that depending solely on visual frame ingestion (`image/jpeg` at 4fps) to completely understand the mathematical state of a Rubik's cube led to LLM hallucinations, as small lighting changes could distort color perception. To fix this, we heavily utilized the **Kociemba Two-Phase Algorithm** repository as our data source to maintain a local ground truth matrix, feeding this structured data to Gemini as context alongside the visual feed.
* **Data Privacy:** No persistent user data is recorded. Images processed by Gemini are done ephemerally via `ws` streaming protocols in the live connect session.
```

**Built with**
`React`, `Node.js`, `Google GenAI SDK`, `Gemini Live API`, `Three.js`, `WebSockets`, `Google Cloud Run`, `Terraform`

**"Try it out" links**
`https://github.com/mangeshraut712/ai-rubiks-cube` (README includes full local spin-up + Cloud Deployment instructions)
`https://github.com/mangeshraut712/ai-rubiks-cube/tree/main/contest` (judge-focused contest profile and deployment helper scripts)
`https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app` (Live Cloud Run Deployment)

**Video demo link**
`PENDING_FINAL_VIDEO_URL` (Upload final <4 minute YouTube/Vimeo demo showing real multimodal behavior + interruption handling)

---

## Additional Info (For judges and organizers)

**Which category are you submitting to?**
`Live Agents`

**URL to PUBLIC Code Repo to show judges how your project was built**
`https://github.com/mangeshraut712/ai-rubiks-cube`

**Did you add Reproducible Testing instructions to your README?**  
`Yes. Reproducible spin-up steps are documented in the README ("Quick Start" and "Cloud Deployment (Monorepo Setup)").`

**URL to Proof of Google Cloud deployment**  
*(You can use a combination of your YouTube video OR link directly to the Terraform proof and backend codebase. Examples:)*  
`https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/health` (Live Cloud Run backend health proof: `{"status":"ok","model":"gemini-live"}`)
`https://github.com/mangeshraut712/ai-rubiks-cube/tree/main/terraform` (Google Cloud Run + Secret Manager IaC)
`https://github.com/mangeshraut712/ai-rubiks-cube/blob/main/cloudbuild.yaml` (Cloud Build pipeline + deploy + health smoke test)
`https://github.com/mangeshraut712/ai-rubiks-cube/blob/main/deploy.sh` (Automated Cloud Run deployment script)
`https://github.com/mangeshraut712/ai-rubiks-cube/blob/main/backend/src/geminiLiveClient.js` (Gemini Live API integration via `@google/genai`)
`TODO_ADD_SHORT_GCP_PROOF_RECORDING_URL` *(recommended: 15-30 second behind-the-scenes deployment/Cloud Run console clip)*

**(REQUIRED) Where did you upload an architecture diagram in the image Gallery or File Upload?**  
`File Upload on Devpost. The same architecture is also documented in the GitHub README "Architecture Diagram" section and in architecture.mmd in the repository root.`

**OPTIONAL for Bonus Points (Max 0.6) URL to published piece of content (blog, podcast, video)**  
`TODO_ADD_PUBLISHED_BLOG_URL`
Draft source in repo: `https://github.com/mangeshraut712/ai-rubiks-cube/blob/main/devpost-blog-post.md` *(includes required disclosure that it was created for entering this hackathon + hashtag `#GeminiLiveAgentChallenge`)*

**OPTIONAL for Bonus Points (Max 0.2) Automating Cloud Deployment - Provide a link to the section of your code that demonstrates you have automated...**  
`https://github.com/mangeshraut712/ai-rubiks-cube/blob/main/terraform/main.tf`  
`https://github.com/mangeshraut712/ai-rubiks-cube/blob/main/deploy.sh`

**OPTIONAL for Bonus Points (Max 0.2) URL to PUBLIC Google Developer Group profile.**  
*(Add your GDG profile link here, or leave blank if you haven't joined one)*
