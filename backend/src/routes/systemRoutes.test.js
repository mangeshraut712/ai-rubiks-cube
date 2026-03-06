import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createSystemRouter } from "./systemRoutes.js";

function createApp() {
  const app = express();

  app.use(
    createSystemRouter({
      getHealthPayload: () => ({
        status: "ok",
        liveModel: "gemini-live-2.5-flash"
      }),
      getRuntimePayload: () => ({
        app: "AI Rubik's Tutor",
        version: "2.0.0",
        routes: [{ path: "/part-1/live", type: "spa" }]
      })
    })
  );

  return app;
}

describe("system routes", () => {
  it("serves runtime metadata", async () => {
    const response = await request(createApp()).get("/api/runtime");

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.body.app).toBe("AI Rubik's Tutor");
    expect(response.body.routes[0].path).toBe("/part-1/live");
  });

  it("serves health metadata on both endpoints", async () => {
    const app = createApp();
    const response = await request(app).get("/api/health");
    const legacyResponse = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(legacyResponse.status).toBe(200);
    expect(legacyResponse.body.liveModel).toBe("gemini-live-2.5-flash");
  });
});
