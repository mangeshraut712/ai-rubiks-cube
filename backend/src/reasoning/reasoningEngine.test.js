/**
 * Unit tests for the Reasoning Engine parsing logic.
 */
import { describe, expect, it } from "vitest";
import {
  extractTreeOfThought,
  parseReasoningResponse,
  parseVerificationResponse
} from "./reasoningEngine.js";

describe("Reasoning Engine Parsing", () => {
  describe("parseReasoningResponse", () => {
    it("extracts strategy from response text", () => {
      const rawText = "Strategy: CFOP\nStep 1: Build the cross R U R'";
      const result = parseReasoningResponse(rawText, "chain-of-thought", "CFOP");

      expect(result.strategy).toBe("CFOP");
    });

    it("extracts numbered steps with thoughts and actions", () => {
      const rawText = [
        "Step 1: Build the white cross",
        "Observe: White edge at front-right",
        "Move: R U R'",
        "Verify: This is correct, cross piece is now in place",
        "",
        "Step 2: Insert first F2L pair",
        "Move: U R U' R'"
      ].join("\n");

      const result = parseReasoningResponse(rawText, "chain-of-thought", "CFOP");

      expect(result.steps).toHaveLength(2);
      expect(result.steps[0].step).toBe(1);
      expect(result.steps[0].thought).toBe("Build the white cross");
      expect(result.steps[0].action).toBe("R U R'");
      expect(result.steps[0].verified).toBe(true);
      expect(result.steps[1].step).toBe(2);
    });

    it("extracts all moves from response", () => {
      const rawText = "Do R U R' U' then F2 and L D'";
      const result = parseReasoningResponse(rawText, "chain-of-thought", "CFOP");

      expect(result.moves).toEqual(["R", "U", "R'", "U'", "F2", "L", "D'"]);
    });

    it("deduplicates moves while preserving order", () => {
      const rawText = "R U R' and then R U again";
      const result = parseReasoningResponse(rawText, "chain-of-thought", "CFOP");

      expect(result.moves).toEqual(["R", "U", "R'"]);
    });

    it("calculates verification confidence", () => {
      const rawText = [
        "Step 1: Do R - Verify: correct",
        "Step 2: Do U - Verify: wrong",
        "Step 3: Do R' - Verify: confirmed"
      ].join("\n");

      const result = parseReasoningResponse(rawText, "chain-of-thought", "CFOP");

      expect(result.verification.totalSteps).toBe(3);
      expect(result.verification.verifiedSteps).toBe(2);
      expect(result.verification.confidence).toBeCloseTo(0.667, 2);
    });

    it("handles empty response gracefully", () => {
      const result = parseReasoningResponse("", "chain-of-thought", "CFOP");

      expect(result.steps).toHaveLength(0);
      expect(result.moves).toHaveLength(0);
      expect(result.verification.confidence).toBe(0);
    });

    it("builds explanation from steps", () => {
      const rawText = "Step 1: Build cross → R U R'\nStep 2: F2L pair → U R U' R'";
      const result = parseReasoningResponse(rawText, "chain-of-thought", "CFOP");

      expect(result.explanation).toContain("Step 1: Build cross → R U R'");
      expect(result.explanation).toContain("Step 2: F2L pair → U R U' R'");
    });
  });

  describe("parseVerificationResponse", () => {
    it("validates individual moves", () => {
      const rawText = "R is valid. U is correct. R' passes verification.";
      const result = parseVerificationResponse(rawText, ["R", "U", "R'"]);

      expect(result.moveVerifications).toHaveLength(3);
      expect(result.moveVerifications[0].valid).toBe(true);
      expect(result.moveVerifications[1].valid).toBe(true);
      expect(result.moveVerifications[2].valid).toBe(true);
      expect(result.overallValid).toBe(true);
    });

    it("detects invalid moves", () => {
      const rawText = "R is valid but X is invalid and illegal in this position";
      const result = parseVerificationResponse(rawText, ["R", "X"]);

      expect(result.moveVerifications[0].valid).toBe(true);
      expect(result.moveVerifications[1].valid).toBe(false);
      expect(result.overallValid).toBe(false);
    });

    it("extracts suggestions", () => {
      const rawText = "Instead try F' as an alternative. Consider using U2 instead.";
      const result = parseVerificationResponse(rawText, ["R"]);

      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe("extractTreeOfThought", () => {
    it("extracts strategy branches", () => {
      const rawText = [
        "Branch 1: CFOP with cross-first approach",
        "Branch 2: Roux with block building",
        "Branch 3: ZZ with edge orientation",
        "Best strategy: Branch 1 is optimal"
      ].join("\n");

      const result = extractTreeOfThought(rawText);

      expect(result.branches).toHaveLength(3);
      expect(result.branches[0].description).toBe("CFOP with cross-first approach");
      expect(result.branches[0].selected).toBe(true);
      expect(result.totalExplored).toBe(3);
    });

    it("handles text without branches", () => {
      const result = extractTreeOfThought("Just do R U R'");

      expect(result.branches).toHaveLength(0);
      expect(result.totalExplored).toBe(0);
    });
  });
});
