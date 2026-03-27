/**
 * Reasoning Engine for AI Rubik's Tutor
 * =======================================
 * Demonstrates 2026 LLM reasoning patterns applied to Rubik's Cube solving:
 *
 * 1. Chain-of-Thought (CoT) — Step-by-step decomposition of the solve
 * 2. Tree-of-Thought (ToT) — Multi-path strategy exploration (CFOP vs Roux vs ZZ)
 * 3. Self-Verification — Validate each proposed move against cube state
 * 4. Algorithmic Reasoning — Explain WHY each algorithm works, not just what to do
 *
 * This module wraps the Google GenAI SDK with structured reasoning prompts
 * and verification loops — the kind of architecture that powers production
 * LLM reasoning systems in 2026.
 */

import { GoogleGenAI } from "@google/genai";
import { REASONING_PROMPTS } from "./prompts.js";

const DEFAULT_MODEL = "gemini-2.5-flash";

/**
 * @typedef {Object} ReasoningStep
 * @property {number} step
 * @property {string} thought - The reasoning thought at this step
 * @property {string} action - The move or action derived
 * @property {string} verification - Self-check result
 * @property {boolean} verified - Whether the step passed verification
 */

/**
 * @typedef {Object} ReasoningResult
 * @property {string} strategy - The chosen strategy (CFOP/Roux/ZZ)
 * @property {string} chainOfThought - Full CoT reasoning trace
 * @property {ReasoningStep[]} steps - Individual reasoning steps
 * @property {string[]} moves - Ordered list of moves
 * @property {string} explanation - Human-readable explanation
 * @property {Object} treeOfThought - ToT exploration results
 * @property {Object} verification - Final verification summary
 */

export class ReasoningEngine {
  /**
   * @param {{ apiKey: string, model?: string }} options
   */
  constructor({ apiKey, model = DEFAULT_MODEL }) {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required for the reasoning engine.");
    }

    this.ai = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  /**
   * Chain-of-Thought Reasoning: Decompose the solve into explicit reasoning steps.
   *
   * The model must show its work at each stage:
   * - Observe current cube state
   * - Identify the next sub-goal
   * - Reason about which moves achieve it
   * - Verify the proposed move
   *
   * @param {string} cubeState - Serialized cube state
   * @param {string} method - Solving method (CFOP, Roux, ZZ)
   * @returns {Promise<ReasoningResult>}
   */
  async chainOfThought(cubeState, method = "CFOP") {
    const prompt = REASONING_PROMPTS.chainOfThought(cubeState, method);

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.2,
        maxOutputTokens: 4096,
      },
    });

    const rawText = response?.text || "";
    return this.#parseReasoningResponse(rawText, "chain-of-thought", method);
  }

  /**
   * Tree-of-Thought Reasoning: Explore multiple solving strategies in parallel.
   *
   * The model evaluates CFOP, Roux, and ZZ approaches and selects the best one
   * based on the current cube state. This demonstrates branching reasoning
   * where multiple paths are explored before committing.
   *
   * @param {string} cubeState - Serialized cube state
   * @returns {Promise<ReasoningResult>}
   */
  async treeOfThought(cubeState) {
    const prompt = REASONING_PROMPTS.treeOfThought(cubeState);

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.3,
        maxOutputTokens: 6144,
      },
    });

    const rawText = response?.text || "";
    return this.#parseReasoningResponse(rawText, "tree-of-thought", "multi");
  }

  /**
   * Self-Verification: Check a proposed move sequence against cube state.
   *
   * After the model proposes moves, this pass verifies each one:
   * - Does the move exist in standard notation?
   * - Is the move sequence legal (no impossible transitions)?
   * - Does it advance toward the stated sub-goal?
   * - Are there shorter alternatives?
   *
   * @param {string} cubeState - Serialized cube state
   * @param {string[]} proposedMoves - Moves to verify
   * @param {string} subGoal - What the moves should accomplish
   * @returns {Promise<Object>}
   */
  async selfVerify(cubeState, proposedMoves, subGoal) {
    const prompt = REASONING_PROMPTS.selfVerify(cubeState, proposedMoves, subGoal);

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
    });

    const rawText = response?.text || "";
    return this.#parseVerificationResponse(rawText, proposedMoves);
  }

  /**
   * Algorithmic Reasoning: Explain WHY an algorithm works, step by step.
   *
   * Instead of just listing moves, this explains:
   * - What each sub-sequence does to the cube
   * - Why the commutator/conjugate structure works
   * - How to recognize when to use it
   * - Common mistakes and how to avoid them
   *
   * @param {string} algorithmName - e.g., "T-Perm", "Sexy Move", "Sune"
   * @param {string} algorithmMoves - e.g., "R U R' U' R' F R2 U' R' U' R U R' F'"
   * @returns {Promise<Object>}
   */
  async explainAlgorithm(algorithmName, algorithmMoves) {
    const prompt = REASONING_PROMPTS.explainAlgorithm(algorithmName, algorithmMoves);

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.2,
        maxOutputTokens: 3072,
      },
    });

    const rawText = response?.text || "";
    return this.#parseAlgorithmExplanation(rawText, algorithmName, algorithmMoves);
  }

  /**
   * Guided Solve with Reasoning: Full interactive solve with reasoning at every step.
   *
   * This is the main entry point — it combines CoT reasoning with self-verification
   * to produce a complete, explained solution.
   *
   * @param {string} cubeState - Serialized cube state
   * @param {string} method - Solving method
   * @param {number} maxSteps - Maximum steps to plan ahead
   * @returns {Promise<ReasoningResult>}
   */
  async guidedSolve(cubeState, method = "CFOP", maxSteps = 20) {
    const prompt = REASONING_PROMPTS.guidedSolve(cubeState, method, maxSteps);

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.15,
        maxOutputTokens: 8192,
      },
    });

    const rawText = response?.text || "";
    return this.#parseReasoningResponse(rawText, "guided-solve", method);
  }

  // ---------------------------------------------------------------------------
  // Response parsers
  // ---------------------------------------------------------------------------

  #parseReasoningResponse(rawText, reasoningType, method) {
    const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

    const steps = [];
    const moves = [];
    let strategy = method;
    let chainOfThought = "";
    let explanation = "";
    let treeOfThought = null;

    // Extract strategy
    for (const line of lines) {
      const stratMatch = line.match(/(?:strategy|method|approach):\s*(.+)/i);
      if (stratMatch) {
        strategy = stratMatch[1].trim();
      }
    }

    // Extract numbered reasoning steps
    const stepPattern = /^(?:step\s+)?(\d+)[:.]\s*(.+)/i;
    const movePattern = /\b([UDLRFB](?:2|')?)\b/g;
    let currentStep = null;

    for (const line of lines) {
      const stepMatch = line.match(stepPattern);
      if (stepMatch) {
        if (currentStep) {
          steps.push(currentStep);
        }
        currentStep = {
          step: parseInt(stepMatch[1], 10),
          thought: stepMatch[2],
          action: "",
          verification: "",
          verified: false,
        };
      }

      if (currentStep) {
        const lineMoves = [...line.matchAll(movePattern)].map((m) => m[1]);
        if (lineMoves.length > 0 && !currentStep.action) {
          currentStep.action = lineMoves.join(" ");
        }

        if (/verify|check|confirm/i.test(line)) {
          currentStep.verification = line;
          currentStep.verified = /correct|valid|confirmed|pass/i.test(line);
        }
      }

      // Collect all moves
      const lineMoves = [...line.matchAll(movePattern)].map((m) => m[1]);
      moves.push(...lineMoves);
    }

    if (currentStep) {
      steps.push(currentStep);
    }

    chainOfThought = rawText;

    // Build explanation from thoughts
    explanation = steps
      .map((s) => `Step ${s.step}: ${s.thought}${s.action ? ` → ${s.action}` : ""}`)
      .join("\n");

    if (reasoningType === "tree-of-thought") {
      treeOfThought = this.#extractTreeOfThought(rawText);
    }

    return {
      strategy,
      chainOfThought,
      steps,
      moves: [...new Set(moves)], // deduplicate while preserving order
      explanation,
      treeOfThought,
      verification: {
        totalSteps: steps.length,
        verifiedSteps: steps.filter((s) => s.verified).length,
        confidence: steps.length > 0
          ? steps.filter((s) => s.verified).length / steps.length
          : 0,
      },
      rawText,
      reasoningType,
    };
  }

  #parseVerificationResponse(rawText, proposedMoves) {
    const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

    const results = {
      overallValid: true,
      moveVerifications: [],
      suggestions: [],
      alternatives: [],
      rawText,
    };

    for (const move of proposedMoves) {
      const moveRegex = new RegExp(move.replace("'", "\\'"), "i");
      const found = lines.some((l) => moveRegex.test(l));
      const invalid = lines.some(
        (l) => moveRegex.test(l) && /invalid|illegal|impossible|wrong/i.test(l)
      );

      results.moveVerifications.push({
        move,
        found,
        valid: found && !invalid,
        reason: invalid ? "May not be legal in this position" : "Appears valid",
      });
    }

    // Check overall validity
    results.overallValid = results.moveVerifications.every((v) => v.valid);

    // Extract suggestions
    for (const line of lines) {
      if (/suggest|recommend|instead|consider/i.test(line)) {
        results.suggestions.push(line);
      }
      if (/alternative|other option|try/i.test(line)) {
        results.alternatives.push(line);
      }
    }

    return results;
  }

  #parseAlgorithmExplanation(rawText, algorithmName, algorithmMoves) {
    return {
      name: algorithmName,
      moves: algorithmMoves,
      explanation: rawText,
      sections: this.#extractSections(rawText),
    };
  }

  #extractTreeOfThought(rawText) {
    const branches = [];
    const branchPattern = /(?:branch|path|option|strategy)\s*(\d+)[:.]\s*(.+)/gi;
    let match;

    while ((match = branchPattern.exec(rawText)) !== null) {
      branches.push({
        id: parseInt(match[1], 10),
        description: match[2].trim(),
        score: 0,
        selected: false,
      });
    }

    // Try to identify which branch was selected
    for (const line of rawText.split("\n")) {
      if (/best|optimal|recommend|choose|select/i.test(line)) {
        const numMatch = line.match(/(\d+)/);
        if (numMatch) {
          const selectedId = parseInt(numMatch[1], 10);
          for (const branch of branches) {
            branch.selected = branch.id === selectedId;
          }
        }
      }
    }

    return { branches, totalExplored: branches.length };
  }

  #extractSections(text) {
    const sections = [];
    const lines = text.split("\n");
    let currentSection = null;

    for (const line of lines) {
      const headingMatch = line.match(/^#+\s+(.+)/);
      if (headingMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = { title: headingMatch[1], content: "" };
      } else if (currentSection) {
        currentSection.content += line + "\n";
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }
}
