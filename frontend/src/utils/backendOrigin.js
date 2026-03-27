const DEFAULT_PRODUCTION_BACKEND_ORIGIN = "https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app";

function normalizeOrigin(origin) {
  return String(origin || "")
    .trim()
    .replace(/\/+$/, "");
}

function isLocalHostname(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function isLocalOrigin(origin) {
  try {
    const parsed = new URL(origin);
    return isLocalHostname(parsed.hostname);
  } catch (_error) {
    return false;
  }
}

function pushUnique(list, value) {
  const normalized = normalizeOrigin(value);
  if (!normalized || list.includes(normalized)) {
    return;
  }
  list.push(normalized);
}

export function toWsOrigin(origin) {
  const normalized = normalizeOrigin(origin);

  if (normalized.startsWith("https://")) {
    return normalized.replace("https://", "wss://");
  }

  if (normalized.startsWith("http://")) {
    return normalized.replace("http://", "ws://");
  }

  return normalized;
}

export function getConfiguredBackendOrigin(browserLocation) {
  const configuredOrigin = normalizeOrigin(
    import.meta.env.VITE_BACKEND_ORIGIN || import.meta.env.VITE_PUBLIC_BACKEND_ORIGIN
  );

  const location = resolveBrowserLocation(browserLocation);
  if (location && !isLocalHostname(location.hostname) && isLocalOrigin(configuredOrigin)) {
    return "";
  }

  return configuredOrigin;
}

function resolveBrowserLocation(browserLocation) {
  if (browserLocation) {
    return browserLocation;
  }

  if (typeof window !== "undefined") {
    return window.location;
  }

  return null;
}

export function getPreferredBackendOrigins(browserLocation) {
  const candidates = [];
  const configuredOrigin = getConfiguredBackendOrigin(browserLocation);
  const location = resolveBrowserLocation(browserLocation);
  const currentOrigin = normalizeOrigin(location?.origin);
  const hostname = String(location?.hostname || "");
  const preferHostedBackend =
    hostname && !isLocalHostname(hostname) && !hostname.endsWith(".run.app");

  if (preferHostedBackend) {
    pushUnique(candidates, configuredOrigin);
    pushUnique(candidates, DEFAULT_PRODUCTION_BACKEND_ORIGIN);
    pushUnique(candidates, currentOrigin);
  } else {
    pushUnique(candidates, currentOrigin);
    pushUnique(candidates, configuredOrigin);
    pushUnique(candidates, DEFAULT_PRODUCTION_BACKEND_ORIGIN);
  }

  return candidates;
}

export function getRuntimeUrlCandidates(browserLocation) {
  return getPreferredBackendOrigins(browserLocation).map((origin) => `${origin}/api/runtime`);
}

export function getTutorSocketUrlCandidates(browserLocation) {
  const candidates = [];
  const location = resolveBrowserLocation(browserLocation);

  pushUnique(candidates, import.meta.env.VITE_WS_URL);

  for (const origin of getPreferredBackendOrigins(browserLocation)) {
    pushUnique(candidates, `${toWsOrigin(origin)}/ws`);
  }

  if (location) {
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    const hostname = location.hostname;

    if (isLocalHostname(hostname)) {
      for (const port of [8080, 3005, 3000, 8081]) {
        pushUnique(candidates, `${protocol}://${hostname}:${port}/ws`);
      }
    }
  }

  return candidates;
}

export function getSignalingSocketBase(browserLocation) {
  const explicit =
    normalizeOrigin(import.meta.env.VITE_SIGNALING_SERVER) ||
    normalizeOrigin(import.meta.env.VITE_WS_URL);

  if (explicit) {
    return explicit.replace(/\/ws$/, "");
  }

  const preferredOrigin = getPreferredBackendOrigins(browserLocation)[0];
  if (preferredOrigin) {
    return toWsOrigin(preferredOrigin);
  }

  return "ws://localhost:8081";
}

export function getFallbackBackendOrigin() {
  return DEFAULT_PRODUCTION_BACKEND_ORIGIN;
}
