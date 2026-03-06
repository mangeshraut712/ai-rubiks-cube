import {
  getRuntimeUrlCandidates,
  getSignalingSocketBase,
  getTutorSocketUrlCandidates
} from "./backendOrigin.js";

function createLocation(url) {
  return new URL(url);
}

describe("backend origin selection", () => {
  it("prefers the hosted Cloud Run backend when the frontend is served from Vercel", () => {
    const location = createLocation("https://ai-rubiks-cube.vercel.app/");

    expect(getRuntimeUrlCandidates(location)[0]).toBe(
      "https://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/api/runtime"
    );
    expect(getTutorSocketUrlCandidates(location)[0]).toBe(
      "wss://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app/ws"
    );
    expect(getSignalingSocketBase(location)).toBe(
      "wss://gemini-rubiks-tutor-vnc62azkwq-uc.a.run.app"
    );
  });

  it("keeps same-origin runtime paths first during localhost development", () => {
    const location = createLocation("http://localhost:5173/part-1/live");

    expect(getRuntimeUrlCandidates(location)[0]).toBe("http://localhost:5173/api/runtime");
    expect(getTutorSocketUrlCandidates(location)[0]).toBe("ws://localhost:5173/ws");
  });
});
