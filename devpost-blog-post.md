# Building the Gemini Rubik's Tutor: Moving Beyond the Text Box

## The Gemini Live Agent Challenge
To compete in the #GeminiLiveAgentChallenge, we were tasked with redefining how users interact with AI. The prompt was simple but revolutionary: Stop typing, and start interacting. Create an experience where the AI can "See, Hear, and Speak" simultaneously, breaking out of the traditional text-based chatbot paradigm. 

I knew immediately what I wanted to build: **The Gemini Rubik’s Tutor**. A patient, observant AI named "Cubey" who watches you solve a physical puzzle in the real world and coaches you step-by-step through voice. 

*(Note: I built this project specifically for the Gemini Live Agent Challenge!)*

---

## Technical Architecture: Giving AI Eyes and a Voice

To make this immersive experience a reality, I had to seamlessly weave together real-time browser MediaStreams, WebSockets, Google Cloud Run, and the powerful `@google/genai` Gemini Live API. 

Here is how the architecture comes together:

### 1. The "Eyes": Real-Time Computer Vision
Using the standard web `getUserMedia` API, the React frontend captures the user's webcam feed. Instead of sending full video streams which would bottleneck the connection, the application samples the `<canvas>` buffer at ~4 frames per second into compressed `image/jpeg` base64 strings.

These frames are continuously piped over a WebSocket to a Node.js backend. The backend then injects them as `mimeType: "image/jpeg"` parts directly into the active Gemini Live bidirectional stream. The AI instantly *"sees"* the state of the physical Rubik's cube you are holding up to the camera.

### 2. The "Ears & Voice": Gapless Web Audio
The most impressive part of the Gemini Live API is its conversational fluidity. 
- **Listening:** We capture PCM16LE raw audio via the browser's audio context, sending it up to Gemini constantly. 
- **Speaking:** When Gemini responds with `serverContent.modelTurn.parts` containing audio, our Node backend forwards the raw PCM stream back to the client. The tricky part is scheduling: we use the `AudioContext` timeline to queue the audio chunks consecutively, ensuring perfectly gapless playback. 
- **Interrupting:** If the user speaks up or makes a mistake, the Live API naturally handles the voice activity detection (VAD), firing an `interrupted` signal. The system stops playback instantly and re-evaluates. 

### 3. Anti-Hallucination: Grounding the AI
Perhaps the biggest challenge when asking an LLM to solve a spatial puzzle is hallucination. A language model might confidently tell you to make a move that physically breaks the cube's mathematical constraints. 

To solve this, I implemented the "Kociemba Algorithm" locally in the Node.js backend. As Cubey *"sees"* the cube via the Gemini Vision models, it synchronizes the colors with an internal state manager. 
- The backend queries the deterministic Kociemba solver to find the optimal string of moves (e.g., `U R2 F L D`).
- The backend then prompts Gemini via system messages: *"The user is currently stuck. The mathematically correct next move is U (Up Face Clockwise). Please coach them to make this move in a playful, encouraging tone."*
This architecture completely eliminates hallucination! Gemini handles the conversational persona, while the backend dictates the ground truth.

---

## 🚀 The Result: Total Immersion
When you use the application, you don't use your keyboard. You use both hands to hold your Rubik's Cube. You simply talk to Cubey. 

**"Cubey, I'm stuck, where does this red piece go?"**
Cubey looks through your camera, verifies the state against its internal Kociemba solver, and responds aloud: **"I see it! You're doing great. Turn the top face clockwise towards you."**

As it speaks, a beautiful 3D Three.js visualization animates the move on your screen.

If you are stuck and need some help, there is even an **Auto-Solve Agent** mode. The backend orchestrates a queue of 3D animations, pausing 1.8 seconds between each move, prompting Gemini to continuously speak and guide you through the entire solution sequence in perfectly synced real-time. 

## Final Thoughts & Learning
Deploying this to Google Cloud Run using Terraform was the icing on the cake, giving the application the robust backend it needs to maintain the Live WebSocket connections securely. 

This challenge pushed me to think differently about AI. When you combine real-world physical object manipulation with low-latency Audio and Vision, an LLM stops feeling like a "bot" and starts feeling like a localized, aware assistant. 

**Takeaways:**
1. Use WebSockets for real-time multimodal transport. 
2. Always ground LLMs using deterministic algorithms when dealing with strict logic puzzles.
3. The future of interaction is hands-free, continuous, and "Live"!

#GeminiLiveAgentChallenge #GoogleCloud #WebSockets #AI #MachineLearning #React
