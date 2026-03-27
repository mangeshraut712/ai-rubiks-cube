/**
 * Tests for Reasoning Routes (endpoint tests).
 */
import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

// Mock the ReasoningEngine to avoid real API calls
vi.mock("../reasoning/reasoningEngine.js", () => ({
  ReasoningEngine: class MockReasoningEngine {
    async chainOfThought(_cubeState, method) {
      return {
        strategy: method,
        chainOfThought: `Step 1: Analyze state\nStep 2: Execute R U R'`,
        steps: [
          { step: 1, thought: "Analyze state", action: "", verification: "", verified: true },
          {
            step: 2,
            thought: "Execute move",
            action: "R U R'",
            verification: "Looks correct",
            verified: true
          }
        ],
        moves: ["R", "U", "R'"],
        explanation: "Step 1: Analyze state\nStep 2: Execute move → R U R'",
        treeOfThought: null,
        verification: { totalSteps: 2, verifiedSteps: 2, confidence: 1.0 }
      };
    }

    async treeOfThought(_cubeState) {
      return {
        strategy: "CFOP",
        chainOfThought: "Evaluated CFOP, Roux, ZZ",
        steps: [],
        moves: ["R", "U", "R'"],
        explanation: "CFOP is optimal for this state",
        treeOfThought: {
          branches: [
            { id: 1, description: "CFOP", score: 90, selected: true },
            { id: 2, description: "Roux", score: 70, selected: false }
          ],
          totalExplored: 2
        },
        verification: { totalSteps: 0, verifiedSteps: 0, confidence: 0 }
      };
    }

    async selfVerify(_cubeState, proposedMoves, _subGoal) {
      return {
        overallValid: true,
        moveVerifications: proposedMoves.map((m) => ({
          move: m,
          found: true,
          valid: true,
          reason: "Appears valid"
        })),
        suggestions: [],
        alternatives: []
      };
    }

    async explainAlgorithm(name, moves) {
      return {
        name,
        moves,
        explanation: `${name} works by cycling pieces using commutators.`,
        sections: [
          { title: "What It Does", content: "Cycles three pieces" },
          { title: "Recognition", content: "Look for matching blocks" }
        ]
      };
    }

    async guidedSolve(_cubeState, method, _maxSteps) {
      return {
        strategy: method,
        chainOfThought: "Full guided solve...",
        steps: [
          { step: 1, thought: "Cross", action: "R U R' U'", verification: "done", verified: true }
        ],
        moves: ["R", "U", "R'", "U'"],
        explanation: "Step 1: Cross → R U R' U'",
        verification: { totalSteps: 1, verifiedSteps: 1, confidence: 1.0 }
      };
    }
  }
}));

import { createReasoningRouter } from "./reasoningRoutes.js";

function createApp(apiKey = "test-api-key") {
  const app = express();
  app.use(express.json());
  app.use("/api/reasoning", createReasoningRouter({ apiKey, model: "test-model" }));
  return app;
}

function createAppNoKey() {
  const app = express();
  app.use(express.json());
  app.use("/api/reasoning", createReasoningRouter({ apiKey: "", model: "test-model" }));
  return app;
}

describe("reasoning routes", () => {
  describe("POST /api/reasoning/chain-of-thought", () => {
    it("returns reasoning result for valid input", async () => {
      const response = await request(createApp()).post("/api/reasoning/chain-of-thought").send({
        cubeState: "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB",
        method: "CFOP"
      });

      expect(response.status).toBe(200);
      expect(response.body.reasoning).toBe("chain-of-thought");
      expect(response.body.strategy).toBe("CFOP");
      expect(response.body.steps).toHaveLength(2);
      expect(response.body.moves).toContain("R");
    });

    it("returns 400 when cubeState is missing", async () => {
      const response = await request(createApp()).post("/api/reasoning/chain-of-thought").send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("missing_cube_state");
    });

    it("returns 503 when API key is not configured", async () => {
      const response = await request(createAppNoKey())
        .post("/api/reasoning/chain-of-thought")
        .send({ cubeState: "test" });

      expect(response.status).toBe(503);
      expect(response.body.error).toBe("reasoning_not_configured");
    });
  });

  describe("POST /api/reasoning/tree-of-thought", () => {
    it("returns tree-of-thought analysis", async () => {
      const response = await request(createApp())
        .post("/api/reasoning/tree-of-thought")
        .send({ cubeState: "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB" });

      expect(response.status).toBe(200);
      expect(response.body.reasoning).toBe("tree-of-thought");
      expect(response.body.treeOfThought.branches.length).toBeGreaterThan(0);
    });

    it("returns 400 when cubeState is missing", async () => {
      const response = await request(createApp()).post("/api/reasoning/tree-of-thought").send({});

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/reasoning/self-verify", () => {
    it("verifies proposed moves", async () => {
      const response = await request(createApp())
        .post("/api/reasoning/self-verify")
        .send({
          cubeState: "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB",
          proposedMoves: ["R", "U", "R'"],
          subGoal: "Build the cross"
        });

      expect(response.status).toBe(200);
      expect(response.body.reasoning).toBe("self-verification");
      expect(response.body.overallValid).toBe(true);
      expect(response.body.moveVerifications).toHaveLength(3);
    });

    it("returns 400 when required fields are missing", async () => {
      const response = await request(createApp())
        .post("/api/reasoning/self-verify")
        .send({ cubeState: "test" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("missing_fields");
    });

    it("accepts proposedMoves as a string", async () => {
      const response = await request(createApp()).post("/api/reasoning/self-verify").send({
        cubeState: "test",
        proposedMoves: "R U R'",
        subGoal: "Insert pair"
      });

      expect(response.status).toBe(200);
    });
  });

  describe("POST /api/reasoning/explain-algorithm", () => {
    it("explains an algorithm", async () => {
      const response = await request(createApp())
        .post("/api/reasoning/explain-algorithm")
        .send({ name: "T-Perm", moves: "R U R' U' R' F R2 U' R' U' R U R' F'" });

      expect(response.status).toBe(200);
      expect(response.body.reasoning).toBe("algorithm-explanation");
      expect(response.body.name).toBe("T-Perm");
    });

    it("returns 400 when name or moves are missing", async () => {
      const response = await request(createApp())
        .post("/api/reasoning/explain-algorithm")
        .send({ name: "T-Perm" });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/reasoning/guided-solve", () => {
    it("returns guided solve result", async () => {
      const response = await request(createApp()).post("/api/reasoning/guided-solve").send({
        cubeState: "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB",
        method: "CFOP",
        maxSteps: 10
      });

      expect(response.status).toBe(200);
      expect(response.body.reasoning).toBe("guided-solve");
      expect(response.body.moves.length).toBeGreaterThan(0);
    });

    it("uses defaults for optional parameters", async () => {
      const response = await request(createApp())
        .post("/api/reasoning/guided-solve")
        .send({ cubeState: "test" });

      expect(response.status).toBe(200);
    });
  });
});
