function normalizeOrigin(origin) {
  return String(origin || "")
    .trim()
    .replace(/\/+$/, "");
}

function buildRuntimeUrl() {
  const configuredOrigin = normalizeOrigin(import.meta.env.VITE_BACKEND_ORIGIN);
  if (configuredOrigin) {
    return `${configuredOrigin}/api/runtime`;
  }

  return "/api/runtime";
}

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
  routes: [],
  features: [
    "React Router workspace navigation",
    "Theme-aware main app and legacy solver",
    "WebRTC multiplayer signaling"
  ],
  links: {
    classicSolver: "/legacy-2x2-solver/index.html",
    frontendRedirectEnabled: false
  },
  connectionState: "offline"
};

export async function fetchRuntimeInfo() {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch(buildRuntimeUrl(), {
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
    return FALLBACK_RUNTIME_INFO;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
