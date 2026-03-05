import http from "http";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import WebSocket, { WebSocketServer } from "ws";
import { fileURLToPath } from "url";

import { GeminiLiveClient } from "./geminiLiveClient.js";
import {
  CubeState,
  generateScramble,
  solveCube
} from "./cubeStateManager.js";
import { TUTOR_SYSTEM_PROMPT } from "./tutorPrompt.js";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const hasExplicitPort = Boolean(process.env.PORT);
const PORT = Number(process.env.PORT || 8080);
const API_KEY = String(process.env.GEMINI_API_KEY || "").trim();
const LIVE_MODEL = process.env.GEMINI_LIVE_MODEL || "gemini-live";
const DEMO_MODE = process.env.DEMO_MODE === "true";

function hasUsableApiKey(value) {
  return typeof value === "string" && value.startsWith("AIza") && value.length > 20;
}

const HAS_USABLE_API_KEY = hasUsableApiKey(API_KEY);

// Rate limiting and connection limits
const MAX_CONNECTIONS = 10;
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const CONNECT_REQUESTS_PER_WINDOW = 30;
const CONTROL_MESSAGES_PER_WINDOW = 600;
const VIDEO_FRAMES_PER_WINDOW = 360;
const AUDIO_CHUNKS_PER_WINDOW = 3000;
const DEMO_AUTOPLAY_TARGET_MOVES = 8;
const DEMO_AUTOPLAY_INTERVAL_MS = 3500;

const rateLimitData = new Map();

const LOCAL_DEMO_MOVES = [
  { move: "R", explanation: "turn the right face clockwise" },
  { move: "U", explanation: "turn the top face clockwise" },
  { move: "R'", explanation: "turn the right face counterclockwise" },
  { move: "U'", explanation: "turn the top face counterclockwise" },
  { move: "F", explanation: "turn the front face clockwise" },
  { move: "F'", explanation: "turn the front face counterclockwise" },
  { move: "U2", explanation: "do a double turn of the top face" },
  { move: "R2", explanation: "do a double turn of the right face" }
];

class LocalDemoGeminiClient {
  constructor() {
    this.activeModel = "demo-local-fallback";
    this.closed = false;
    this.moveIndex = 0;
    this.audioCallback = null;
    this.textCallback = null;
    this.interruptionCallback = null;
    this.thinkingCallback = null;
  }

  async startSession() {
    return Promise.resolve();
  }

  onAudioResponse(callback) {
    this.audioCallback = callback;
  }

  onTextResponse(callback) {
    this.textCallback = callback;
  }

  onInterruption(callback) {
    this.interruptionCallback = callback;
  }

  onThinkingChange(callback) {
    this.thinkingCallback = callback;
  }

  sendAudioChunk() {
    // No-op in local demo fallback.
  }

  sendVideoFrame() {
    // No-op in local demo fallback.
  }

  sendTextTurn(text) {
    if (this.closed || !this.textCallback) {
      return;
    }

    const normalized = String(text || "").toLowerCase();

    if (normalized.includes("introduce yourself") || normalized.includes("session started")) {
      this.#emitText(
        "Hi, I'm Cubey. Great to meet you. We'll solve this step by step using CFOP. Do R, turn the right face clockwise."
      );
      return;
    }

    if (normalized.includes("continue demo walkthrough") || normalized.includes("demo mode is active")) {
      this.#emitText(this.#nextMoveInstruction());
      return;
    }

    if (normalized.includes("challenge mode is on")) {
      this.#emitText("Challenge accepted. Do U, turn the top face clockwise.");
      return;
    }

    this.#emitText("Nice. I can help in demo mode too. Do U, turn the top face clockwise.");
  }

  async requestHint() {
    return "Demo hint: keep white on top, form a clean cross first, then pair corner-edge pieces one slot at a time.";
  }

  interrupt() {
    if (!this.closed && this.interruptionCallback) {
      this.interruptionCallback("local_demo_interrupt");
    }
  }

  close() {
    this.closed = true;
    this.audioCallback = null;
    this.textCallback = null;
    this.interruptionCallback = null;
  }

  #nextMoveInstruction() {
    const entry = LOCAL_DEMO_MOVES[this.moveIndex % LOCAL_DEMO_MOVES.length];
    this.moveIndex += 1;
    return `Now do ${entry.move}, ${entry.explanation}.`;
  }

  #emitText(text) {
    if (this.thinkingCallback) {
      this.thinkingCallback(true);
    }

    setTimeout(() => {
      if (!this.closed && this.textCallback) {
        this.textCallback(text);
      }
      if (!this.closed && this.thinkingCallback) {
        this.thinkingCallback(false);
      }
    }, 180);
  }
}

function checkRateLimit(ip, bucket, maxRequests, windowMs = RATE_LIMIT_WINDOW) {
  const key = `${ip}:${bucket}`;
  const now = Date.now();
  const data = rateLimitData.get(key) || { count: 0, resetTime: now + windowMs };

  if (now > data.resetTime) {
    data.count = 1;
    data.resetTime = now + windowMs;
    rateLimitData.set(key, data);
    return true;
  }

  if (data.count >= maxRequests) {
    return false;
  }

  data.count++;
  rateLimitData.set(key, data);
  return true;
}

function getConnectionCount() {
  return wss.clients.size;
}

function isServerOverloaded() {
  return getConnectionCount() >= MAX_CONNECTIONS;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "15mb" }));

const DEFAULT_CORS_ORIGINS =
  "https://*.run.app,http://localhost:5173,http://127.0.0.1:5173";

function normalizeOrigin(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

const allowedOrigins = (process.env.CORS_ORIGIN || DEFAULT_CORS_ORIGINS)
  .split(",")
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);

function isOriginAllowed(origin, host) {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);

  // Allow same-origin requests implicitly
  if (host && normalizedOrigin === `https://${host}`) {
    return true;
  }
  if (host && normalizedOrigin === `http://${host}`) {
    return true;
  }

  return allowedOrigins.some((allowed) => {
    if (allowed === "*" || allowed === normalizedOrigin) {
      return true;
    }

    const wildcard = allowed.match(/^(https?:\/\/)\*\.(.+)$/i);
    if (!wildcard) {
      return false;
    }

    const scheme = wildcard[1].toLowerCase();
    const baseDomain = wildcard[2].toLowerCase();
    const lowerOrigin = normalizedOrigin.toLowerCase();

    return lowerOrigin.startsWith(scheme) && lowerOrigin.endsWith(`.${baseDomain}`);
  });
}

app.use(
  cors({
    origin(origin, callback) {
      // In Express, req is available if we wrap this or use app.use((req, res, next) => cors(...)(req, res, next))
      // But we can also check the Origin vs Host header if provided.
      // For now, let's keep it simple and just rely on the expanded allowedOrigins list
      // which will now include *.run.app.
      if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", model: "gemini-live" });
});

const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");
const frontendIndexPath = path.join(frontendDistPath, "index.html");

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}

app.get("*", (req, res, next) => {
  if (req.path === "/health") {
    next();
    return;
  }

  if (fs.existsSync(frontendIndexPath)) {
    res.sendFile(frontendIndexPath);
    return;
  }

  res.status(404).json({
    error: "frontend_not_built",
    message: "Frontend build not found. Run `npm run build` in frontend/."
  });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("error", (error) => {
  // During startup, ws can mirror server listen errors before fallback logic retries.
  if (error?.code === "EADDRINUSE") {
    console.warn("[ws] WebSocket server address in use during startup.");
    return;
  }

  console.error("[ws] WebSocket server error", error);
});

function sendJson(ws, payload) {
  if (ws.readyState !== WebSocket.OPEN) {
    return;
  }

  ws.send(JSON.stringify(payload));
}

function decodeBinaryEnvelope(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) {
    throw new Error("Invalid binary envelope.");
  }

  const headerLength = buffer.readUInt32BE(0);
  const headerStart = 4;
  const headerEnd = headerStart + headerLength;

  if (buffer.length < headerEnd) {
    throw new Error("Truncated binary header.");
  }

  const headerRaw = buffer.subarray(headerStart, headerEnd).toString("utf8");
  const header = JSON.parse(headerRaw);
  const payload = buffer.subarray(headerEnd);

  return { header, payload };
}

function parseMoveFromTutorText(text) {
  if (!text || typeof text !== "string") {
    return null;
  }

  const direct = text.match(/\b([UDLRFB](?:2|')?)\b/);
  if (direct) {
    return direct[1].toUpperCase();
  }

  const prime = text.match(/\b([UDLRFB])\s*(?:prime|counter[- ]?clockwise)\b/i);
  if (prime) {
    return `${prime[1].toUpperCase()}'`;
  }

  const double = text.match(/\b([UDLRFB])\s*(?:double|2)\b/i);
  if (double) {
    return `${double[1].toUpperCase()}2`;
  }

  const clockwise = text.match(/\b([UDLRFB])\s*(?:clockwise)\b/i);
  if (clockwise) {
    return clockwise[1].toUpperCase();
  }

  return null;
}

function createSessionRecord() {
  return {
    sessionId: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    endedAt: null,
    transcript: [],
    moveHistory: [],
    challengeMode: false
  };
}

function pushTranscript(record, speaker, text) {
  record.transcript.push({
    ts: new Date().toISOString(),
    speaker,
    text
  });
}

wss.on("connection", async (ws, req) => {
  ws.isAlive = true;

  const clientIp = req.socket.remoteAddress || "unknown";

  // Check connection limit
  if (isServerOverloaded()) {
    sendJson(ws, {
      type: "error",
      code: "server_overloaded",
      message: "Server is at capacity. Please try again later."
    });
    ws.close(1013, "Server overloaded");
    return;
  }

  // Check rate limit
  if (!checkRateLimit(clientIp, "connect", CONNECT_REQUESTS_PER_WINDOW)) {
    sendJson(ws, {
      type: "error",
      code: "connect_rate_limited",
      message: "Too many requests. Please slow down."
    });
    ws.close(1013, "Rate limited");
    return;
  }

  // Demo mode notification
  if (DEMO_MODE) {
    console.log(`[ws] Demo mode enabled for ${clientIp}`);
    sendJson(ws, {
      type: "status",
      status: "demo_mode",
      message: "Demo mode - AI will demonstrate moves on virtual cube"
    });
  }

  const cubeState = new CubeState();
  const sessionRecord = createSessionRecord();
  let challengeMode = false;
  let lastVideoFrame = null;
  let closed = false;
  let demoAutoplayTimer = null;
  let tutorIsThinking = false;
  let lastTutorResponseAt = 0;
  let lastTutorNormalizedText = "";

  let gemini = null;

  const safeClose = () => {
    if (closed) {
      return;
    }

    closed = true;
    sessionRecord.endedAt = new Date().toISOString();

    try {
      gemini?.close();
    } catch (error) {
      console.warn("[ws] live client close failed", error?.message ?? error);
    }

    if (demoAutoplayTimer) {
      clearInterval(demoAutoplayTimer);
      demoAutoplayTimer = null;
    }
  };

  try {
    if (!HAS_USABLE_API_KEY && !DEMO_MODE) {
      throw new Error(
        "GEMINI_API_KEY is missing or invalid. Set a valid key or enable DEMO_MODE=true for local demo fallback."
      );
    }

    const useLocalDemoFallback = DEMO_MODE && !HAS_USABLE_API_KEY;

    if (useLocalDemoFallback) {
      console.warn(`[ws] Using local demo fallback for ${clientIp} (no GEMINI_API_KEY).`);
      gemini = new LocalDemoGeminiClient();
    } else {
      gemini = new GeminiLiveClient({
        apiKey: API_KEY,
        systemPrompt: TUTOR_SYSTEM_PROMPT,
        model: process.env.GEMINI_LIVE_MODEL
      });
    }

    gemini.onAudioResponse((chunk) => {
      sendJson(ws, {
        type: "audio_response",
        mimeType: chunk.mimeType,
        data: chunk.data
      });
    });

    // Handle AI thinking state changes
    gemini.onThinkingChange((isThinking) => {
      tutorIsThinking = Boolean(isThinking);
      sendJson(ws, {
        type: "thinking",
        thinking: isThinking
      });
    });

    gemini.onTextResponse((text) => {
      const normalizedText = String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s']/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const now = Date.now();
      const hasPrevious = Boolean(lastTutorNormalizedText);
      const isExactDuplicate = normalizedText && normalizedText === lastTutorNormalizedText;
      const isContainedDuplicate =
        hasPrevious &&
        normalizedText &&
        (lastTutorNormalizedText.includes(normalizedText) ||
          normalizedText.includes(lastTutorNormalizedText));
      const isLongReplayPrefix =
        hasPrevious &&
        normalizedText.length >= 30 &&
        lastTutorNormalizedText.length >= 30 &&
        now - lastTutorResponseAt < 12_000 &&
        normalizedText.split(" ").slice(0, 8).join(" ") ===
        lastTutorNormalizedText.split(" ").slice(0, 8).join(" ");

      if (isExactDuplicate || isContainedDuplicate || isLongReplayPrefix) {
        return;
      }
      lastTutorNormalizedText = normalizedText;
      lastTutorResponseAt = now;
      pushTranscript(sessionRecord, "cubey", text);

      sendJson(ws, {
        type: "text_response",
        text,
        ts: new Date().toISOString()
      });

      const move = parseMoveFromTutorText(text);
      if (!move) {
        return;
      }

      try {
        cubeState.applyMove(move);
        sessionRecord.moveHistory.push({ move, ts: new Date().toISOString(), source: "tutor" });

        sendJson(ws, {
          type: "move_instruction",
          move,
          face: move[0]
        });

        sendJson(ws, {
          type: "cube_state_update",
          cubeState: cubeState.getSnapshot(),
          move
        });

        sendJson(ws, {
          type: "move_history_update",
          moveHistory: sessionRecord.moveHistory
        });
      } catch (error) {
        console.error("[ws] failed to apply tutor move", { move, error });
      }
    });

    gemini.onInterruption((reason) => {
      // Only propagate explicit user/local interruption signals to the UI.
      // Model-level interruption flags can appear mid-stream and should not
      // forcibly stop playback client-side.
      if (reason === "model_interrupted") {
        return;
      }

      sendJson(ws, { type: "interruption" });
    });

    await gemini.startSession();

    sendJson(ws, {
      type: "status",
      status: "connected",
      model: gemini.activeModel || LIVE_MODEL,
      message: "Live tutor session connected."
    });

    sendJson(ws, {
      type: "cube_state_update",
      cubeState: cubeState.getSnapshot()
    });

    if (DEMO_MODE) {
      gemini.sendTextTurn(
        "Demo mode is active. There is no guaranteed camera feed. Start a virtual walkthrough and give exactly one move now with plain-English explanation.",
        true
      );

      demoAutoplayTimer = setInterval(() => {
        if (closed || !gemini || challengeMode) {
          return;
        }
        if (tutorIsThinking) {
          return;
        }
        if (Date.now() - lastTutorResponseAt < 2400) {
          return;
        }

        const tutorMoves = sessionRecord.moveHistory.filter((entry) => entry.source === "tutor");
        if (tutorMoves.length >= DEMO_AUTOPLAY_TARGET_MOVES) {
          clearInterval(demoAutoplayTimer);
          demoAutoplayTimer = null;
          return;
        }

        gemini.sendTextTurn(
          "Continue demo walkthrough with exactly one next move and a short confirmation.",
          true
        );
      }, DEMO_AUTOPLAY_INTERVAL_MS);
    } else {
      gemini.sendTextTurn(
        "Session started. Introduce yourself as Cubey, ask the user to show the full cube, then give the first single move guidance.",
        true
      );
    }
  } catch (error) {
    console.error("[ws] session init error", {
      ip: req.socket.remoteAddress,
      error: error?.message ?? String(error)
    });

    sendJson(ws, {
      type: "error",
      code: "session_init_failed",
      message: error?.message || "Failed to initialize Gemini session."
    });

    safeClose();
    ws.close(1011, "Session initialization failed");
    return;
  }

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", async (rawMessage, isBinary) => {
    try {
      if (isBinary) {
        const dataBuffer = Buffer.isBuffer(rawMessage)
          ? rawMessage
          : Buffer.from(rawMessage);

        const { header, payload } = decodeBinaryEnvelope(dataBuffer);

        if (header.type === "audio_chunk") {
          if (!checkRateLimit(clientIp, "audio", AUDIO_CHUNKS_PER_WINDOW)) {
            return;
          }
          gemini.sendAudioChunk(payload);
          return;
        }

        console.warn("[ws] unsupported binary message", header.type);
        return;
      }

      const messageString = Buffer.isBuffer(rawMessage)
        ? rawMessage.toString("utf8")
        : String(rawMessage);

      const message = JSON.parse(messageString);
      const messageType = typeof message.type === "string" ? message.type : "";

      if (messageType === "video_frame") {
        if (!checkRateLimit(clientIp, "video", VIDEO_FRAMES_PER_WINDOW)) {
          return;
        }
      } else if (!checkRateLimit(clientIp, "control", CONTROL_MESSAGES_PER_WINDOW)) {
        sendJson(ws, {
          type: "error",
          code: "control_rate_limited",
          message: "You're sending control messages too quickly. Please slow down."
        });
        return;
      }

      switch (messageType) {
        case "video_frame": {
          if (typeof message.data === "string" && message.data.length > 0) {
            lastVideoFrame = message.data;
            gemini.sendVideoFrame(message.data);
          }
          break;
        }

        case "user_text": {
          const text = String(message.text || "").trim();
          if (text) {
            pushTranscript(sessionRecord, "user", text);
            gemini.sendTextTurn(text, true);
          }
          break;
        }

        case "interrupt": {
          gemini.interrupt();
          break;
        }

        case "move_applied": {
          const move = String(message.move || "").trim().toUpperCase();
          if (move) {
            cubeState.applyMove(move);
            sessionRecord.moveHistory.push({ move, ts: new Date().toISOString(), source: "user" });

            sendJson(ws, {
              type: "move_instruction",
              move,
              face: move[0]
            });

            sendJson(ws, {
              type: "cube_state_update",
              cubeState: cubeState.getSnapshot()
            });

            sendJson(ws, {
              type: "move_history_update",
              moveHistory: sessionRecord.moveHistory
            });
          }
          break;
        }

        case "hint_request": {
          const frame = message.frame || lastVideoFrame;
          const hint =
            DEMO_MODE && !frame
              ? "Demo hint: keep white on top, form a clean cross first, then pair corner-edge pieces one slot at a time."
              : await gemini.requestHint(frame);

          sendJson(ws, {
            type: "hint_response",
            text: hint
          });

          pushTranscript(sessionRecord, "cubey", `[Hint] ${hint}`);
          break;
        }

        case "challenge_mode": {
          challengeMode = Boolean(message.enabled);
          sessionRecord.challengeMode = challengeMode;

          if (challengeMode) {
            const scramble = generateScramble(20);
            cubeState.applyMove(scramble.join(" "));

            sessionRecord.moveHistory.push({
              move: `SCRAMBLE: ${scramble.join(" ")}`,
              ts: new Date().toISOString(),
              source: "system"
            });

            sendJson(ws, {
              type: "challenge_update",
              enabled: true,
              scramble,
              message: "Challenge mode enabled. Cube scrambled. Race Cubey to solve it!"
            });

            sendJson(ws, {
              type: "cube_state_update",
              cubeState: cubeState.getSnapshot()
            });

            gemini.sendTextTurn(
              `Challenge mode is ON. Scramble sequence applied: ${scramble.join(" ")}. Start coaching quickly and keep one move at a time.`,
              true
            );
          } else {
            sendJson(ws, {
              type: "challenge_update",
              enabled: false,
              message: "Challenge mode disabled."
            });
          }

          break;
        }

        case "solve_request": {
          const faceString = cubeState.toFaceString();
          const solution = solveCube(faceString);
          sendJson(ws, {
            type: "solution_response",
            solution,
            length: solution.length
          });

          // Also notify user via transcript
          if (solution.length > 0) {
            const solutionText = `Solution found: ${solution.join(" ")} (${solution.length} moves). Click "Auto Solve" to watch me solve it step by step!`;
            sendJson(ws, {
              type: "text_response",
              text: solutionText,
              ts: new Date().toISOString()
            });
            pushTranscript(sessionRecord, "cubey", solutionText);
          }
          break;
        }

        case "auto_solve": {
          const solveFaceString = cubeState.toFaceString();
          const solutionMoves = solveCube(solveFaceString);

          if (solutionMoves.length === 0) {
            sendJson(ws, {
              type: "text_response",
              text: "The cube is already solved! 🎉",
              ts: new Date().toISOString()
            });
            sendJson(ws, {
              type: "solve_complete",
              totalMoves: 0
            });
            break;
          }

          sendJson(ws, {
            type: "text_response",
            text: `Starting auto-solve: ${solutionMoves.length} moves. Watch the cube!`,
            ts: new Date().toISOString()
          });
          pushTranscript(sessionRecord, "cubey", `Auto-solving: ${solutionMoves.join(" ")}`);

          // Ask Gemini to coach the solve
          if (gemini && typeof gemini.sendTextTurn === "function") {
            gemini.sendTextTurn(
              `I am now auto-solving the cube. The solution is: ${solutionMoves.join(" ")}. Coach the user through each move enthusiastically! Start with the first move ${solutionMoves[0]}.`,
              true
            );
          }

          // Execute moves one-by-one with delay for animation
          let solveIndex = 0;
          const solveInterval = setInterval(() => {
            if (closed || solveIndex >= solutionMoves.length) {
              clearInterval(solveInterval);
              if (!closed && solveIndex >= solutionMoves.length) {
                sendJson(ws, {
                  type: "text_response",
                  text: "🎉 Cube solved! Great job watching along!",
                  ts: new Date().toISOString()
                });
                sendJson(ws, {
                  type: "solve_complete",
                  totalMoves: solutionMoves.length
                });
                pushTranscript(sessionRecord, "cubey", "Cube solved!");
              }
              return;
            }

            const move = solutionMoves[solveIndex];
            try {
              cubeState.applyMove(move);
              sessionRecord.moveHistory.push({
                move,
                ts: new Date().toISOString(),
                source: "auto_solve"
              });

              // Send move instruction to trigger 3D animation
              sendJson(ws, {
                type: "move_instruction",
                move,
                face: move[0],
                autoSolve: true,
                step: solveIndex + 1,
                total: solutionMoves.length
              });

              // Send updated cube state
              sendJson(ws, {
                type: "cube_state_update",
                cubeState: cubeState.getSnapshot(),
                move
              });

              sendJson(ws, {
                type: "move_history_update",
                moveHistory: sessionRecord.moveHistory
              });
            } catch (error) {
              console.error("[ws] auto-solve move failed", { move, error });
            }

            solveIndex += 1;
          }, 1800); // 1.8s per move for smooth animation

          break;
        }

        case "end_session": {
          sendJson(ws, { type: "status", status: "closing" });
          ws.close(1000, "Client ended session");
          break;
        }

        default:
          sendJson(ws, {
            type: "error",
            code: "unsupported_message",
            message: `Unsupported message type: ${messageType}`
          });
      }
    } catch (error) {
      console.error("[ws] message handling failed", {
        error: error?.message ?? String(error)
      });

      sendJson(ws, {
        type: "error",
        code: "message_error",
        message: error?.message || "Failed to process message."
      });
    }
  });

  ws.on("error", (error) => {
    console.error("[ws] socket error", error);
    safeClose();
  });

  ws.on("close", () => {
    // Note: socket is already closed here, cannot send.
    // Log the session record for debugging / auditing.
    if (sessionRecord.transcript.length > 0) {
      console.log(
        `[ws] Session ${sessionRecord.sessionId} ended. Moves: ${sessionRecord.moveHistory.length}, Transcript lines: ${sessionRecord.transcript.length}`
      );
    }

    safeClose();
  });
});

const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((client) => {
    if (client.isAlive === false) {
      client.terminate();
      return;
    }

    client.isAlive = false;
    client.ping();
  });
}, 30_000);

wss.on("close", () => {
  clearInterval(heartbeatInterval);
});

const fallbackPorts = Array.from(
  new Set([PORT, 3005, 3000, 8081].filter((value) => Number.isInteger(value) && value > 0))
);
let listenAttemptIndex = 0;

server.on("listening", () => {
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : PORT;
  console.log(`[server] Gemini Rubik's Tutor listening on :${port}`);
});

server.on("error", (error) => {
  const shouldAllowFallback = !hasExplicitPort || PORT === 8080;

  if (
    error?.code === "EADDRINUSE" &&
    shouldAllowFallback &&
    listenAttemptIndex < fallbackPorts.length - 1
  ) {
    const occupiedPort = fallbackPorts[listenAttemptIndex];
    listenAttemptIndex += 1;
    const nextPort = fallbackPorts[listenAttemptIndex];

    console.warn(
      `[server] Port ${occupiedPort} is in use. Retrying on :${nextPort}...`
    );

    setTimeout(() => {
      server.listen(nextPort);
    }, 150);
    return;
  }

  console.error("[server] Uncaught exception:", error);
  process.exit(1);
});

server.listen(fallbackPorts[listenAttemptIndex]);
