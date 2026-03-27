/**
 * Reasoning Routes for AI Rubik's Tutor
 * ========================================
 * REST API endpoints that expose the reasoning engine capabilities.
 *
 * Endpoints:
 *   POST /api/reasoning/chain-of-thought — Step-by-step CoT reasoning
 *   POST /api/reasoning/tree-of-thought — Multi-strategy exploration
 *   POST /api/reasoning/self-verify — Verify proposed moves
 *   POST /api/reasoning/explain-algorithm — Deep algorithm explanation
 *   POST /api/reasoning/guided-solve — Full explained solve
 */

import express from "express";
import { z } from "zod";
import { ReasoningEngine } from "../reasoning/reasoningEngine.js";

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const CubeStateInput = z.union([
  z.string().min(1, "cubeState must be a non-empty string"),
  z.record(z.any()),
]);

const ChainOfThoughtSchema = z.object({
  cubeState: CubeStateInput,
  method: z.enum(["CFOP", "Roux", "ZZ"]).default("CFOP"),
});

const TreeOfThoughtSchema = z.object({
  cubeState: CubeStateInput,
});

const SelfVerifySchema = z.object({
  cubeState: CubeStateInput,
  proposedMoves: z.union([
    z.array(z.string().min(1)).min(1, "At least one move is required"),
    z.string().min(1),
  ]),
  subGoal: z.string().min(1, "subGoal is required"),
});

const ExplainAlgorithmSchema = z.object({
  name: z.string().min(1, "Algorithm name is required"),
  moves: z.string().min(1, "Algorithm moves are required"),
});

const GuidedSolveSchema = z.object({
  cubeState: CubeStateInput,
  method: z.enum(["CFOP", "Roux", "ZZ"]).default("CFOP"),
  maxSteps: z.number().int().min(1).max(50).default(20),
});

// ---------------------------------------------------------------------------
// Rate limiting for reasoning endpoints
// ---------------------------------------------------------------------------

const reasoningRateLimit = new Map();
const REASONING_RATE_LIMIT_WINDOW = 60_000; // 1 minute
const REASONING_MAX_REQUESTS = 10; // per window

function checkReasoningRateLimit(ip) {
  const now = Date.now();
  const data = reasoningRateLimit.get(ip);

  if (!data || now > data.resetTime) {
    reasoningRateLimit.set(ip, { count: 1, resetTime: now + REASONING_RATE_LIMIT_WINDOW });
    return true;
  }

  if (data.count >= REASONING_MAX_REQUESTS) {
    return false;
  }

  data.count++;
  return true;
}

/**
 * @param {{ apiKey: string, model?: string }} options
 * @returns {express.Router}
 */
export function createReasoningRouter({ apiKey, model }) {
  const router = express.Router();

  // Lazy-init the engine (only when first request arrives)
  let engine = null;
  function getEngine() {
    if (!engine) {
      engine = new ReasoningEngine({ apiKey, model });
    }
    return engine;
  }

  // Middleware: check API key is configured
  router.use((_req, res, next) => {
    if (!apiKey) {
      return res.status(503).json({
        error: "reasoning_not_configured",
        message:
          "Reasoning engine requires GEMINI_API_KEY. Set it in your environment.",
      });
    }
    next();
  });

  // Middleware: rate limiting for reasoning endpoints
  router.use((req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    if (!checkReasoningRateLimit(ip)) {
      return res.status(429).json({
        error: "rate_limited",
        message: "Too many reasoning requests. Please slow down.",
        retryAfter: Math.ceil(REASONING_RATE_LIMIT_WINDOW / 1000),
      });
    }
    next();
  });

  // -----------------------------------------------------------------------
  // POST /api/reasoning/chain-of-thought
  // -----------------------------------------------------------------------
  router.post("/chain-of-thought", async (req, res) => {
    try {
      const parsed = ChainOfThoughtSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "validation_error",
          message: "Invalid request body",
          details: parsed.error.issues,
        });
      }

      const { cubeState, method } = parsed.data;
      const result = await getEngine().chainOfThought(
        typeof cubeState === "string" ? cubeState : JSON.stringify(cubeState),
        method
      );

      res.json({
        reasoning: "chain-of-thought",
        ...result,
      });
    } catch (error) {
      console.error("[reasoning] chain-of-thought failed:", error);
      res.status(500).json({
        error: "reasoning_failed",
        message: error?.message || "Chain-of-thought reasoning failed.",
      });
    }
  });

  // -----------------------------------------------------------------------
  // POST /api/reasoning/tree-of-thought
  // -----------------------------------------------------------------------
  router.post("/tree-of-thought", async (req, res) => {
    try {
      const parsed = TreeOfThoughtSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "validation_error",
          message: "Invalid request body",
          details: parsed.error.issues,
        });
      }

      const { cubeState } = parsed.data;
      const result = await getEngine().treeOfThought(
        typeof cubeState === "string" ? cubeState : JSON.stringify(cubeState)
      );

      res.json({
        reasoning: "tree-of-thought",
        ...result,
      });
    } catch (error) {
      console.error("[reasoning] tree-of-thought failed:", error);
      res.status(500).json({
        error: "reasoning_failed",
        message: error?.message || "Tree-of-thought reasoning failed.",
      });
    }
  });

  // -----------------------------------------------------------------------
  // POST /api/reasoning/self-verify
  // -----------------------------------------------------------------------
  router.post("/self-verify", async (req, res) => {
    try {
      const parsed = SelfVerifySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "validation_error",
          message: "Invalid request body",
          details: parsed.error.issues,
        });
      }

      const { cubeState, proposedMoves, subGoal } = parsed.data;
      const moves = Array.isArray(proposedMoves)
        ? proposedMoves
        : String(proposedMoves).split(/\s+/);

      const result = await getEngine().selfVerify(
        typeof cubeState === "string" ? cubeState : JSON.stringify(cubeState),
        moves,
        subGoal
      );

      res.json({
        reasoning: "self-verification",
        ...result,
      });
    } catch (error) {
      console.error("[reasoning] self-verify failed:", error);
      res.status(500).json({
        error: "verification_failed",
        message: error?.message || "Self-verification failed.",
      });
    }
  });

  // -----------------------------------------------------------------------
  // POST /api/reasoning/explain-algorithm
  // -----------------------------------------------------------------------
  router.post("/explain-algorithm", async (req, res) => {
    try {
      const parsed = ExplainAlgorithmSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "validation_error",
          message: "Invalid request body",
          details: parsed.error.issues,
        });
      }

      const { name, moves } = parsed.data;
      const result = await getEngine().explainAlgorithm(name, moves);

      res.json({
        reasoning: "algorithm-explanation",
        ...result,
      });
    } catch (error) {
      console.error("[reasoning] explain-algorithm failed:", error);
      res.status(500).json({
        error: "explanation_failed",
        message: error?.message || "Algorithm explanation failed.",
      });
    }
  });

  // -----------------------------------------------------------------------
  // POST /api/reasoning/guided-solve
  // -----------------------------------------------------------------------
  router.post("/guided-solve", async (req, res) => {
    try {
      const parsed = GuidedSolveSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "validation_error",
          message: "Invalid request body",
          details: parsed.error.issues,
        });
      }

      const { cubeState, method, maxSteps } = parsed.data;
      const result = await getEngine().guidedSolve(
        typeof cubeState === "string" ? cubeState : JSON.stringify(cubeState),
        method,
        maxSteps
      );

      res.json({
        reasoning: "guided-solve",
        ...result,
      });
    } catch (error) {
      console.error("[reasoning] guided-solve failed:", error);
      res.status(500).json({
        error: "solve_failed",
        message: error?.message || "Guided solve failed.",
      });
    }
  });

  return router;
}
