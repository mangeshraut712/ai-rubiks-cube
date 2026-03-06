import { getRuntimeUrlCandidates } from "./backendOrigin.js";

const KNOWN_RUNTIME_ROUTES = [
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
];

export const FALLBACK_RUNTIME_INFO = {
  app: "AI Rubik's Tutor",
  version: "2.0.0",
  environment: "offline",
  runtime: {
    node: "unknown",
    packageManager: "npm",
    backendPackage: "gemini-rubiks-tutor-backend"
  },
  live: {
    enabled: false,
    demoMode: false,
    apiKeyConfigured: false,
    model: "Unavailable",
    fallbackModel: "Unavailable"
  },
  websocket: {
    tutorPath: "/ws",
    multiplayerPath: "/multiplayer",
    activeTutorSessions: 0,
    activeMultiplayerRooms: 0,
    activeMultiplayerClients: 0
  },
  routes: KNOWN_RUNTIME_ROUTES,
  features: [
    "Part 1 Gemini live tutor",
    "Part 2 Cubey Core 2x2 lab",
    "WebRTC multiplayer signaling"
  ],
  links: {
    partOne: "/part-1",
    partOneLive: "/part-1/live",
    partOneMultiplayer: "/part-1/multiplayer",
    partTwoLab: "/part-2",
    partTwoStatic: "/legacy-2x2-solver/index.html",
    frontendRedirectEnabled: false
  },
  connectionState: "offline"
};

export async function fetchRuntimeInfo() {
  for (const url of getRuntimeUrlCandidates()) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 2200);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Runtime endpoint returned ${response.status}`);
      }

      const payload = await response.json();
      return {
        ...FALLBACK_RUNTIME_INFO,
        ...payload,
        connectionState: "online"
      };
    } catch (_error) {
      // Try the next known backend candidate.
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  return FALLBACK_RUNTIME_INFO;
}
