🚀 Meet Cubey: my multimodal AI Rubik’s tutor for the #GeminiLiveAgentChallenge

I built **Gemini Rubik’s Tutor** to answer one question:
What if solving a cube with AI felt like talking to a real coach instead of typing into a chatbot?

With Cubey, you hold a physical Rubik’s Cube, turn on your camera + mic, and get real-time spoken guidance.

How it works:
- 👀 **Eyes:** Webcam frames stream over WebSockets (low-latency visual context)
- 🎙️ **Ears + Voice:** Bidirectional audio with the **Gemini Live API**
- 🧠 **Brain:** Hybrid architecture = Gemini conversation + deterministic Kociemba solver for mathematically correct move guidance

Built with:
- **Google GenAI SDK** (`@google/genai`)
- **Google Cloud Run** (WebSocket backend hosting)
- **Secret Manager** + **Artifact Registry**
- **Cloud Build** + **Terraform** (deployment automation)
- **React + Node.js**

Big learning: multimodal agents become significantly more useful when they are real-time, grounded, and interruption-friendly.

🔗 Repo: https://github.com/mangeshraut712/ai-rubiks-cube  
🔗 Live app: https://ai-rubiks-cube.vercel.app/  
🔗 Cloud backend proof: https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/health

**Disclosure:** I created this project specifically for the purpose of entering the Gemini Live Agent Challenge.

#GeminiLiveAgentChallenge #GoogleCloud #Gemini #AI #MultimodalAI #WebSockets #React #Nodejs #RubiksCube
