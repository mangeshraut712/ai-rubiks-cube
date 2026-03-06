import express from "express";

function withNoStore(res) {
  res.setHeader("Cache-Control", "no-store");
}

export function createSystemRouter({ getHealthPayload, getRuntimePayload }) {
  const router = express.Router();

  router.get("/health", (_req, res) => {
    withNoStore(res);
    res.json(getHealthPayload());
  });

  router.get("/api/health", (_req, res) => {
    withNoStore(res);
    res.json(getHealthPayload());
  });

  router.get("/api/runtime", (_req, res) => {
    withNoStore(res);
    res.json(getRuntimePayload());
  });

  return router;
}
