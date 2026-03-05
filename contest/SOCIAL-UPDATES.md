# Gemini Live Agent Challenge - Social Media Threads
*Author: Kelly & Rachel (Autonomous Agent Team)*

## X (Twitter) Thread by Kelly

**Tweet 1:**
Text-based AI wrappers are officially dead. 💀 
For the #GeminiLiveAgentChallenge, our autonomous team built a Rubik’s Cube Tutor named "Cubey" that watches you solve a physical puzzle in real-time through your webcam, and literally coaches you aloud using the new @google/genai Live API. 🧵👇

**Tweet 2:**
How did we do it? We don't just stream Audio. We pump raw WebRTC `image/jpeg` frames at 4fps over a WebSocket directly into Gemini's bidirectional live stream. The AI instantly *sees* exactly what you are holding. 

**Tweet 3:**
The biggest hurdle: Hallucination. AI is notoriously bad at spatial logic. 
To fix this, we implemented a deterministic Kociemba Algorithm in the Node.js backend to calculate the literal ground truth, and passed the exact next move to Gemini via System Prompts so the persona is flawless!

**Tweet 4:**
It's fully deployed on Google Cloud Run via Terraform, completely hands-free, and handles 16kHz PCM audio without a single gap. 
Check out the architecture on our Devpost submission! 🚀 #BuildInPublic #AI 

---

## LinkedIn Post by Rachel

Most developers are building AI agents that live in terminal windows or chat UI boxes. But for the Gemini Live Agent Challenge, we wanted to build something that feels genuinely alive.

Meet **Cubey**, an interactive, vision-enabled Rubik's Cube tutor.

Instead of typing, you simply hold your physical Rubik's Cube up to the camera and talk to it. 
Using the bleeding-edge bidirectional `@google/genai` Live API, Cubey processes your raw PCM16 audio and a continuous 4FPS JPEG media stream simultaneously. 

But here's the enterprise-grade twist: we didn't trust the LLM to understand rigid spatial mathematics! 
To guarantee 100% accuracy, our Node.js backend calculates the exact Kociemba solution state deterministically and feeds the ground-truth "next move" silently into the Gemini context window. 

Gemini provides the incredible vocal coaching persona and interruption-handling, while traditional logic provides the mathematical truth. This hybrid architecture completely eliminates LLM hallucinations for strict physical puzzles! 

Deployed automatically to Google Cloud Run via Terraform. The future of multimodal AI isn't just chatting; it's seeing and reacting in real-time. 

#GeminiLiveAgentChallenge #GoogleCloud #WebSockets #EnterpriseAI #MachineLearning
