/**
 * Structured Reasoning Prompts for AI Rubik's Tutor
 * ===================================================
 * Each prompt template is designed to elicit specific reasoning patterns
 * from the LLM. These follow 2026 best practices for structured reasoning:
 *
 * - Explicit step-by-step decomposition (CoT)
 * - Multi-path exploration with evaluation (ToT)
 * - Verification-first design (Self-Verify)
 * - Deep causal explanation (Algorithmic Reasoning)
 */

export const REASONING_PROMPTS = {
  /**
   * Chain-of-Thought: Decompose a solve into explicit reasoning steps.
   * Forces the model to show its work at each stage.
   */
  chainOfThought: (cubeState, method) => `
You are an expert Rubik's Cube solving engine with deep reasoning capabilities.

## Task
Solve this Rubik's Cube using the ${method} method. You MUST reason step-by-step, showing your complete thought process at each stage.

## Cube State
${cubeState}

## Required Reasoning Format

For EACH step, you must follow this exact structure:

### Step N: [Sub-goal description]
**Observe:** [What I see on the cube right now]
**Sub-goal:** [What I need to achieve at this step]
**Reasoning:** [Why this move works — explain the commutator/conjugate logic]
**Move:** [The move in standard notation]
**Verify:** [Check that this move advances toward the goal without undoing previous work]

## Solving Method: ${method}
${
  method === "CFOP"
    ? `
- Phase 1: Cross (build cross on D face)
- Phase 2: F2L (First Two Layers — pair and insert corner-edge pairs)
- Phase 3: OLL (Orient Last Layer — make top face uniform color)
- Phase 4: PLL (Permute Last Layer — position pieces correctly)
`
    : method === "Roux"
      ? `
- Phase 1: First Block (1x2x3 on L)
- Phase 2: Second Block (1x2x3 on R)
- Phase 3: CMLL (Corners of Last Layer)
- Phase 4: LSE (Last Six Edges)
`
      : `
- Phase 1: EOLine (Edge Orientation + Line)
- Phase 2: F2L (First Two Layers with oriented edges)
- Phase 3: LL (Last Layer)
`
}

## Rules
1. Show your reasoning BEFORE each move
2. Verify each move against the current state
3. If a move doesn't work, explain why and try the next option
4. Use standard cube notation: U, D, L, R, F, B with ' (prime) and 2 (double)
5. Complete the full solve — don't stop mid-algorithm
`,

  /**
   * Tree-of-Thought: Explore multiple strategies and select the best.
   * The model evaluates different approaches before committing.
   */
  treeOfThought: (cubeState) => `
You are a Rubik's Cube strategy optimizer. Your job is to explore MULTIPLE solving approaches and select the optimal one.

## Cube State
${cubeState}

## Task
Explore THREE different solving strategies for this cube state. For each strategy, estimate the move count and difficulty.

## Required Format

### Branch 1: CFOP Strategy
**Assessment:** [Analyze the cross, F2L pairs, OLL case, PLL case]
**Estimated Moves:** [Number]
**Difficulty:** [Easy/Medium/Hard]
**Key Insight:** [What makes this approach good or bad for THIS specific state]

### Branch 2: Roux Strategy
**Assessment:** [Analyze block building potential, CMLL case, LSE edges]
**Estimated Moves:** [Number]
**Difficulty:** [Easy/Medium/Hard]
**Key Insight:** [What makes this approach good or bad for THIS specific state]

### Branch 3: ZZ Strategy
**Assessment:** [Analyze EO case, line placement, F2L potential]
**Estimated Moves:** [Number]
**Difficulty:** [Easy/Medium/Hard]
**Key Insight:** [What makes this approach good or bad for THIS specific state]

### Selection
**Best Strategy:** [CFOP/Roux/ZZ]
**Reason:** [Why this is optimal for this specific cube state]
**Confidence:** [0-100%]

### Solution Plan
[Step-by-step plan using the selected strategy]
Use format: Step N: [Sub-goal] → [Move sequence]
`,

  /**
   * Self-Verification: Validate proposed moves against cube state.
   */
  selfVerify: (cubeState, proposedMoves, subGoal) => `
You are a Rubik's Cube move validator. Your job is to verify each proposed move against the current cube state.

## Current Cube State
${cubeState}

## Sub-goal
${subGoal}

## Proposed Moves to Verify
${proposedMoves.join(" → ")}

## Verification Checklist

For EACH move, check:
1. **Notation Valid:** Is this a standard move? (U, D, L, R, F, B with ' or 2)
2. **Position Legal:** Can this face be turned given the current state?
3. **Goal Alignment:** Does this move advance toward the sub-goal?
4. **Side Effects:** Does this undo any previously solved pieces?

## Required Format

### Move: [move]
- Notation Valid: [Yes/No]
- Position Legal: [Yes/No — explain if No]
- Goal Alignment: [Yes/No — explain how it helps]
- Side Effects: [None / describes any damage]
- Verdict: [PASS / FAIL / WARN]

### Overall Assessment
- All moves valid: [Yes/No]
- Suggested improvements: [Any]
- Alternative moves to consider: [Any]
`,

  /**
   * Algorithmic Reasoning: Deep explanation of WHY an algorithm works.
   */
  explainAlgorithm: (algorithmName, algorithmMoves) => `
You are a Rubik's Cube mathematician. Explain the DEEP MECHANICS of why this algorithm works.

## Algorithm: ${algorithmName}
## Moves: ${algorithmMoves}

## Required Explanation Sections

### 1. What It Does
[Describe the net effect on the cube — which pieces move where]

### 2. Step-by-Step Trace
For each move or sub-sequence:
- Move: [notation]
- Effect: [what physically happens to the pieces]
- Purpose: [why this move is in the sequence]

### 3. Commutator/Conjugate Analysis
- Is this a commutator? [Yes/No — if yes, identify A and B]
- Is this a conjugate? [Yes/No — if yes, identify setup and algorithm]
- Mathematical structure: [explain the group theory behind it]

### 4. Recognition
- When to use this algorithm: [visual pattern to look for]
- Common mistakes: [what goes wrong and why]
- Tips for memorization: [mnemonic or pattern]

### 5. Related Algorithms
- Variants: [similar algorithms with slightly different effects]
- Inverse: [what the inverse algorithm does]
`,

  /**
   * Guided Solve: Full interactive solve with reasoning at every step.
   */
  guidedSolve: (cubeState, method, maxSteps) => `
You are Cubey, an expert Rubik's Cube tutor. Solve this cube using ${method}, explaining your reasoning at EVERY step.

## Cube State
${cubeState}

## Constraints
- Maximum ${maxSteps} steps planned at once
- Use ${method} method
- Show reasoning before each move
- Verify moves as you go

## Required Output Format

### Current Analysis
**Solved pieces:** [list what's already done]
**Next priority:** [what to solve next]
**Why this priority:** [reasoning for the order]

### Solution Steps
For each step:
**Step N**
- Looking at: [what part of the cube I'm focusing on]
- Sub-goal: [what I need to achieve]
- Candidates: [2-3 possible move sequences considered]
- Selected: [the chosen move] because [reasoning]
- Verification: [confirm it works and doesn't break anything]

### Summary
- Total moves: [count]
- Method used: [CFOP/Roux/ZZ]
- Key decisions: [any interesting reasoning branches]
- Confidence: [how confident I am this solves it]
`
};
