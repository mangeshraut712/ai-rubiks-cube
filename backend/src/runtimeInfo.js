import fs from "fs";
import { URL } from "url";

const BACKEND_PACKAGE = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf8")
);

export function buildRuntimePayload({
  demoMode,
  hasUsableApiKey,
  liveModel,
  fallbackModel,
  nodeEnv,
  frontendRedirectUrl,
  activeTutorSessions,
  signalingStats
}) {
  return {
    app: "AI Rubik's Tutor",
    version: BACKEND_PACKAGE.version,
    environment: nodeEnv,
    runtime: {
      node: process.version,
      packageManager: "npm",
      backendPackage: BACKEND_PACKAGE.name
    },
    live: {
      enabled: demoMode || hasUsableApiKey,
      demoMode,
      apiKeyConfigured: hasUsableApiKey,
      model: liveModel,
      fallbackModel
    },
    websocket: {
      tutorPath: "/ws",
      multiplayerPath: "/multiplayer",
      activeTutorSessions,
      activeMultiplayerRooms: signalingStats.totalRooms,
      activeMultiplayerClients: signalingStats.totalClients
    },
    routes: [
      { path: "/", type: "spa" },
      { path: "/part-1", type: "spa" },
      { path: "/part-1/live", type: "spa" },
      { path: "/part-1/multiplayer", type: "spa" },
      { path: "/live", type: "redirect" },
      { path: "/labs/multiplayer", type: "redirect" },
      { path: "/part-2", type: "redirect" },
      { path: "/classic", type: "redirect" },
      { path: "/legacy-2x2-solver/index.html", type: "static" },
      { path: "/health", type: "system" },
      { path: "/api/health", type: "api" },
      { path: "/api/runtime", type: "api" },
      { path: "/ws", type: "websocket" },
      { path: "/multiplayer", type: "websocket" }
    ],
    features: [
      "Part 1 Gemini Live tutor transport",
      "Part 2 Cubey Core 2x2 solver lab",
      "React Router workspace navigation",
      "Theme-aware shared product shell",
      "WebRTC multiplayer signaling",
      "PWA-ready frontend",
      "Validated WebSocket payloads"
    ],
    links: {
      partOne: "/part-1",
      partOneLive: "/part-1/live",
      partOneMultiplayer: "/part-1/multiplayer",
      partTwoLab: "/part-2",
      partTwoStatic: "/legacy-2x2-solver/index.html",
      frontendRedirectEnabled: Boolean(frontendRedirectUrl)
    }
  };
}

export function buildHealthPayload({
  demoMode,
  hasUsableApiKey,
  liveModel,
  activeTutorSessions,
  signalingStats
}) {
  return {
    status: "ok",
    ts: new Date().toISOString(),
    demoMode,
    geminiConfigured: hasUsableApiKey,
    liveModel,
    websocket: {
      tutorSessions: activeTutorSessions,
      multiplayerRooms: signalingStats.totalRooms,
      multiplayerClients: signalingStats.totalClients
    }
  };
}
