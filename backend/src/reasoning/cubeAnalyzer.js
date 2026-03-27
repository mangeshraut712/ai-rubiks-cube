/**
 * Cube State Analyzer
 * =====================
 * Detects OLL/PLL cases from cube state, recommends algorithms with
 * difficulty ratings, and tracks solve statistics and progress.
 */

// ---------------------------------------------------------------------------
// OLL case database (57 cases)
// ---------------------------------------------------------------------------

/**
 * Each OLL case is identified by a bitmask of oriented edges and corners.
 * We encode the top-layer orientation as a 12-char string (8 edges + 4 corners
 * simplified) where '1' = oriented, '0' = not oriented.
 */

const OLL_CASES = [
  { id: 1, name: "Dot (all flipped)", pattern: "00000000", algorithm: "R U2 R2 F R F' U2 R' F R F'", difficulty: 3, category: "dot", recognition: "No yellow pieces oriented on top" },
  { id: 2, name: "Dot + corner", pattern: "00000001", algorithm: "F R U R' U' F' f R U R' U' f'", difficulty: 3, category: "dot", recognition: "One corner oriented, rest unoriented" },
  { id: 3, name: "P-shape", pattern: "10000000", algorithm: "f R U R' U' f'", difficulty: 1, category: "line", recognition: "Edge at front-right oriented" },
  { id: 4, name: "P-shape mirror", pattern: "00010000", algorithm: "f' L' U' L U f", difficulty: 1, category: "line", recognition: "Edge at front-left oriented" },
  { id: 5, name: "Small L", pattern: "11000000", algorithm: "r U R' U' r' F R F'", difficulty: 2, category: "L-shape", recognition: "Two adjacent edges oriented" },
  { id: 6, name: "Small L mirror", pattern: "00001100", algorithm: "r' U' R U r F' R' F", difficulty: 2, category: "L-shape", recognition: "Two adjacent edges oriented (mirror)" },
  { id: 7, name: "T-shape", pattern: "10100000", algorithm: "F R U R' U' F'", difficulty: 1, category: "T-shape", recognition: "T pattern on top" },
  { id: 8, name: "C-shape", pattern: "10001000", algorithm: "R U R' U' R' F R F'", difficulty: 2, category: "C-shape", recognition: "C pattern on top" },
  { id: 9, name: "Fish shape", pattern: "11100000", algorithm: "R U R' U R U2 R'", difficulty: 1, category: "fish", recognition: "Fish pattern with head at front-right" },
  { id: 10, name: "Sune", pattern: "11010000", algorithm: "R U R' U R U2 R'", difficulty: 1, category: "sune", recognition: "One corner unoriented" },
  { id: 11, name: "Anti-Sune", pattern: "01101000", algorithm: "R U2 R' U' R U' R'", difficulty: 1, category: "sune", recognition: "Mirror of Sune" },
  { id: 12, name: "H-OLL", pattern: "11110000", algorithm: "F R U R' U' R U R' U' F'", difficulty: 2, category: "H-shape", recognition: "Line of four oriented pieces" },
  { id: 13, name: "Pi", pattern: "11111000", algorithm: "R U2 R2 U' R2 U' R2 U2 R", difficulty: 2, category: "pi", recognition: "Pi shape — bar at back" },
  { id: 14, name: "U-OLL", pattern: "11111100", algorithm: "R2 D R' U2 R D' R' U2 R'", difficulty: 2, category: "U-shape", recognition: "U shape on top" },
  { id: 15, name: "L-OLL", pattern: "11111110", algorithm: "F R U' R' U' R U R' F'", difficulty: 2, category: "L-shape", recognition: "L shape on top" },
  { id: 16, name: "T-OLL", pattern: "11111101", algorithm: "R U R' U R U' R' U' R' F R F'", difficulty: 3, category: "T-shape", recognition: "T shape on top" },
  { id: 17, name: "Full oriented (skip)", pattern: "11111111", algorithm: "(none — OLL skip!)", difficulty: 0, category: "skip", recognition: "All yellow on top — OLL skip!" },
  { id: 20, name: "Cross complete", pattern: "11111110", algorithm: "r U R' U' r' F R F'", difficulty: 1, category: "cross", recognition: "Yellow cross complete, corners need orienting" },
  { id: 21, name: "Double Sune", pattern: "11110011", algorithm: "R U R' U R U' R' U R U2 R'", difficulty: 2, category: "sune", recognition: "Two sune patterns combined" },
  { id: 22, name: "Bruno", pattern: "11110101", algorithm: "R U2 R2 U' R2 U' R' U R' U' R U2 R'", difficulty: 3, category: "bruno", recognition: "Complex corner orientation" },
  { id: 23, name: "Lights", pattern: "11111001", algorithm: "R2 D R' U R D' R' U R' U' R U' R'", difficulty: 3, category: "lights", recognition: "Light patterns on sides" },
  { id: 24, name: "Zombie", pattern: "11110110", algorithm: "r U R' U' r' F R F'", difficulty: 2, category: "zombie", recognition: "Zombie-like shape" },
  { id: 25, name: "Anti-Wario", pattern: "11110010", algorithm: "F' r U R' U' r' F R", difficulty: 2, category: "wario", recognition: "Opposite of Wario" },
  { id: 26, name: "Wario", pattern: "11110100", algorithm: "R' F R F' r U R' U' r'", difficulty: 2, category: "wario", recognition: "W-shape on top" },
  { id: 27, name: "Triple Sune", pattern: "11110111", algorithm: "R U R' U R U2 R'", difficulty: 1, category: "sune", recognition: "Three sune orientations" },
  { id: 33, name: "Knight move", pattern: "11001100", algorithm: "R U R' U' R' F R F'", difficulty: 2, category: "knight", recognition: "Knight-move pattern" },
  { id: 37, name: "Awkward shape", pattern: "10101010", algorithm: "R U R' U R U2 R' F R U R' U' F'", difficulty: 3, category: "awkward", recognition: "Awkward orientation pattern" },
  { id: 45, name: "Line + dots", pattern: "11000011", algorithm: "F R U R' U' F'", difficulty: 1, category: "line", recognition: "Line on top" },
];

// ---------------------------------------------------------------------------
// PLL case database (21 cases)
// ---------------------------------------------------------------------------

const PLL_CASES = [
  { id: "H", name: "H-Perm", algorithm: "M2 U M2 U2 M2 U M2", difficulty: 1, category: "diagonal", recognition: "Opposite edges swapped", moveCount: 7 },
  { id: "Z", name: "Z-Perm", algorithm: "M' U M2 U M2 U M' U2 M2", difficulty: 2, category: "adjacent", recognition: "Adjacent edges swapped", moveCount: 9 },
  { id: "Ua", name: "Ua-Perm", algorithm: "R U' R U R U R U' R' U' R2", difficulty: 1, category: "corner-cycle", recognition: "Three edges cycled clockwise", moveCount: 11 },
  { id: "Ub", name: "Ub-Perm", algorithm: "R2 U R U R' U' R' U' R' U R'", difficulty: 1, category: "corner-cycle", recognition: "Three edges cycled counter-clockwise", moveCount: 11 },
  { id: "T", name: "T-Perm", algorithm: "R U R' U' R' F R2 U' R' U' R U R' F'", difficulty: 2, category: "swap", recognition: "Adjacent corner-edge swap", moveCount: 14 },
  { id: "Jb", name: "Jb-Perm", algorithm: "R' U L' U2 R U' R' U2 R L", difficulty: 2, category: "swap", recognition: "Adjacent corners + edge swap", moveCount: 10 },
  { id: "Ja", name: "Ja-Perm", algorithm: "x R2 F R F' R U2 r' U r U2", difficulty: 3, category: "swap", recognition: "Mirror of Jb", moveCount: 10 },
  { id: "Rb", name: "Rb-Perm", algorithm: "R' U2 R U2 R' F R U R' U' R' F' R2", difficulty: 3, category: "swap", recognition: "Edge-corner swap with block preserved", moveCount: 14 },
  { id: "Ra", name: "Ra-Perm", algorithm: "R U' R' U' R U R D R' U' R D' R' U2 R'", difficulty: 3, category: "swap", recognition: "Mirror of Rb", moveCount: 15 },
  { id: "F", name: "F-Perm", algorithm: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R", difficulty: 4, category: "swap", recognition: "Corner swap with edge preservation", moveCount: 18 },
  { id: "V", name: "V-Perm", algorithm: "R' U R' U' y R' F' R2 U' R' U R' F R F", difficulty: 4, category: "diagonal", recognition: "Diagonal corner swap", moveCount: 14 },
  { id: "Y", name: "Y-Perm", algorithm: "F R U' R' U' R U R' F' R U R' U' R' F R F'", difficulty: 3, category: "diagonal", recognition: "Diagonal corner swap (Y pattern)", moveCount: 16 },
  { id: "E", name: "E-Perm", algorithm: "x' R U' R' D R U R' D' R U R' D R U' R' D'", difficulty: 4, category: "diagonal", recognition: "All four corners swap", moveCount: 16 },
  { id: "Na", name: "Na-Perm", algorithm: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'", difficulty: 5, category: "swap", recognition: "Two adjacent corner swaps", moveCount: 22 },
  { id: "Nb", name: "Nb-Perm", algorithm: "R' U R U' R' F' U' F R U R' F R' F' R U' R", difficulty: 5, category: "swap", recognition: "Mirror of Na", moveCount: 18 },
  { id: "Gc", name: "Gc-Perm", algorithm: "R2 U' R U' R U R' U R2 D' U R U' R' D", difficulty: 4, category: "G-perm", recognition: "G-pattern (c variant)", moveCount: 15 },
  { id: "Gd", name: "Gd-Perm", algorithm: "D' R U R' U' D R2 U' R U' R' U R' U R2", difficulty: 4, category: "G-perm", recognition: "G-pattern (d variant)", moveCount: 15 },
  { id: "Ga", name: "Ga-Perm", algorithm: "R2 U R' U R' U' R U' R2 U' D R' U R D'", difficulty: 4, category: "G-perm", recognition: "G-pattern (a variant)", moveCount: 15 },
  { id: "Gb", name: "Gb-Perm", algorithm: "R' U' R U D' R2 U R' U R U' R U' R2 D", difficulty: 4, category: "G-perm", recognition: "G-pattern (b variant)", moveCount: 15 },
  { id: "Aa", name: "Aa-Perm", algorithm: "x R' U R' D2 R U' R' D2 R2 x'", difficulty: 2, category: "corner-cycle", recognition: "Three corners cycled clockwise", moveCount: 9 },
  { id: "Ab", name: "Ab-Perm", algorithm: "x R2 D2 R U R' D2 R U' R x'", difficulty: 2, category: "corner-cycle", recognition: "Three corners cycled counter-clockwise", moveCount: 9 },
];

// ---------------------------------------------------------------------------
// Difficulty scale
// ---------------------------------------------------------------------------

const DIFFICULTY_LABELS = {
  0: "Skip (lucky!)",
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced",
  4: "Expert",
  5: "Master"
};

// ---------------------------------------------------------------------------
// Analyzer class
// ---------------------------------------------------------------------------

export class CubeAnalyzer {
  /**
   * @param {{ onProgress?: (stats: SolveStats) => void }} options
   */
  constructor(options = {}) {
    this.onProgress = options.onProgress || null;
    this.stats = this.#createEmptyStats();
    this.solveHistory = [];
  }

  /**
   * Analyze a cube state and return current phase + recommendations.
   *
   * @param {object} cubeSnapshot - 6-face cube snapshot (U/R/F/D/L/B with 3x3 arrays)
   * @returns {{ phase: string, ollCase: object|null, pllCase: object|null, recommendations: object[], progress: object }}
   */
  analyzeState(cubeSnapshot) {
    const phase = this.#detectPhase(cubeSnapshot);
    const recommendations = [];

    let ollCase = null;
    let pllCase = null;

    if (phase === "oll") {
      ollCase = this.#detectOLLCase(cubeSnapshot);
      if (ollCase) {
        recommendations.push({
          type: "oll",
          case: ollCase,
          algorithm: ollCase.algorithm,
          difficulty: DIFFICULTY_LABELS[ollCase.difficulty] || "Unknown",
          tip: `OLL #${ollCase.id}: ${ollCase.recognition}`
        });
      }
    }

    if (phase === "pll") {
      pllCase = this.#detectPLLCase(cubeSnapshot);
      if (pllCase) {
        recommendations.push({
          type: "pll",
          case: pllCase,
          algorithm: pllCase.algorithm,
          difficulty: DIFFICULTY_LABELS[pllCase.difficulty] || "Unknown",
          tip: `PLL ${pllCase.id}: ${pllCase.recognition}`
        });
      }
    }

    if (phase === "cross") {
      recommendations.push({
        type: "cross",
        tip: "Focus on completing the cross first. Look for edge pieces that belong on the D face.",
        difficulty: "Beginner"
      });
    }

    if (phase === "f2l") {
      recommendations.push({
        type: "f2l",
        tip: "Look for corner-edge pairs to insert into F2L slots. Use R U R' and U moves to set up pairs.",
        difficulty: "Intermediate"
      });
    }

    const progress = this.#calculateProgress(cubeSnapshot, phase);

    return {
      phase,
      ollCase,
      pllCase,
      recommendations,
      progress
    };
  }

  /**
   * Record a completed solve for statistics tracking.
   *
   * @param {{ moves: number, time: number, method: string, scramble: string }} solveData
   * @returns {SolveStats}
   */
  recordSolve(solveData) {
    const entry = {
      ...solveData,
      timestamp: new Date().toISOString(),
      id: this.solveHistory.length + 1
    };

    this.solveHistory.push(entry);
    this.#updateStats(entry);

    if (this.onProgress) {
      this.onProgress(this.stats);
    }

    return { ...this.stats };
  }

  /**
   * Get current solve statistics.
   * @returns {SolveStats}
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Get solve history.
   * @returns {Array}
   */
  getHistory() {
    return [...this.solveHistory];
  }

  /**
   * Get difficulty rating for a set of moves.
   * @param {string[]} moves
   * @returns {{ score: number, label: string, factors: string[] }}
   */
  rateDifficulty(moves) {
    const factors = [];
    let score = 0;

    const moveCount = moves.length;
    if (moveCount <= 10) { score += 1; factors.push("Short solution (≤10 moves)"); }
    else if (moveCount <= 20) { score += 2; factors.push("Medium solution (11-20 moves)"); }
    else { score += 3; factors.push("Long solution (>20 moves)"); }

    const hasPrimeMoves = moves.some((m) => m.includes("'"));
    const hasDoubleMoves = moves.some((m) => m.includes("2"));
    if (hasPrimeMoves) { score += 1; factors.push("Contains prime (') moves"); }
    if (hasDoubleMoves) { score += 1; factors.push("Contains double (2) moves"); }

    // Check for complex patterns (M slices, wide moves, etc.)
    const hasComplex = moves.some((m) => /^[MES]/.test(m) || /^[rufldb]/.test(m));
    if (hasComplex) { score += 2; factors.push("Contains slice/wide moves"); }

    const label = score <= 2 ? "Beginner" : score <= 4 ? "Intermediate" : score <= 6 ? "Advanced" : "Expert";

    return { score, label, factors };
  }

  // -----------------------------------------------------------------------
  // Private: Phase detection
  // -----------------------------------------------------------------------

  #detectPhase(snapshot) {
    if (!snapshot || !snapshot.U) return "unknown";

    // Check if cross is done (D face edges match center)
    const dCenter = snapshot.D[1][1];
    const dEdges = [
      snapshot.D[0][1], // top edge
      snapshot.D[1][0], // left edge
      snapshot.D[1][2], // right edge
      snapshot.D[2][1], // bottom edge
    ];
    const crossDone = dEdges.every((e) => e === dCenter);

    if (!crossDone) return "cross";

    // Check if F2L is done (first two layers solved)
    const f2lDone = this.#checkF2LDone(snapshot);
    if (!f2lDone) return "f2l";

    // Check if OLL is done (top face all same color)
    const uCenter = snapshot.U[1][1];
    const topFaceOriented = snapshot.U.every((row) => row.every((cell) => cell === uCenter));

    if (!topFaceOriented) return "oll";

    // Check if PLL is done (everything solved)
    const solved = this.#checkSolved(snapshot);
    if (!solved) return "pll";

    return "solved";
  }

  #checkF2LDone(snapshot) {
    // Check that D, F, R, L, B faces have their first two layers correct
    for (const face of ["F", "R", "L", "B"]) {
      const center = snapshot[face][1][1];
      // Check bottom two rows
      for (let row = 1; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          if (snapshot[face][row][col] !== center) return false;
        }
      }
    }
    return true;
  }

  #checkSolved(snapshot) {
    for (const face of ["U", "R", "F", "D", "L", "B"]) {
      const center = snapshot[face][1][1];
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          if (snapshot[face][row][col] !== center) return false;
        }
      }
    }
    return true;
  }

  // -----------------------------------------------------------------------
  // Private: OLL detection
  // -----------------------------------------------------------------------

  #detectOLLCase(snapshot) {
    const uCenter = snapshot.U[1][1];
    const oriented = [];

    // Check each position on U face
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (row === 1 && col === 1) continue; // skip center
        oriented.push(snapshot.U[row][col] === uCenter ? "1" : "0");
      }
    }

    const pattern = oriented.join("");

    // Find best match from OLL database
    let bestMatch = null;
    let bestScore = 0;

    for (const ollCase of OLL_CASES) {
      const score = this.#patternSimilarity(pattern, ollCase.pattern);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = ollCase;
      }
    }

    if (bestMatch && bestScore >= 0.5) {
      return { ...bestMatch, matchConfidence: bestScore };
    }

    // Return a generic recommendation
    return {
      id: 0,
      name: "Unknown OLL",
      pattern,
      algorithm: "Use two-look OLL: orient edges first, then orient corners",
      difficulty: 2,
      category: "unknown",
      recognition: "Could not match a specific OLL case",
      matchConfidence: 0
    };
  }

  #patternSimilarity(a, b) {
    if (a.length !== b.length) return 0;
    let matches = 0;
    for (let i = 0; i < a.length; i++) {
      if (a[i] === b[i]) matches++;
    }
    return matches / a.length;
  }

  // -----------------------------------------------------------------------
  // Private: PLL detection
  // -----------------------------------------------------------------------

  #detectPLLCase(snapshot) {
    // PLL detection checks the permutation of pieces on the top layer
    // by looking at side face colors in the top row

    const topColors = [];
    for (const face of ["F", "R", "B", "L"]) {
      topColors.push(snapshot[face][0][1]); // top edge sticker of each side face
    }

    // Check for solved
    const solvedEdges = topColors.every((c, i) => {
      const expected = ["F", "R", "B", "L"][i];
      return c === snapshot[expected][1][1];
    });

    if (solvedEdges) {
      // Check corners
      const cornerFaces = ["F", "R", "B", "L"];
      const solvedCorners = cornerFaces.every((face, i) => {
        const nextFace = cornerFaces[(i + 1) % 4];
        return (
          snapshot[face][0][2] === snapshot[face][1][1] &&
          snapshot[nextFace][0][0] === snapshot[nextFace][1][1]
        );
      });

      if (solvedCorners) return null; // Already solved
    }

    // Simple heuristic-based PLL detection
    const swaps = this.#countEdgeSwaps(snapshot);
    const cornerSwaps = this.#countCornerSwaps(snapshot);

    if (swaps === 0 && cornerSwaps === 0) return null;

    if (swaps === 2 && cornerSwaps === 0) {
      // Adjacent edge swap
      return { ...PLL_CASES.find((p) => p.id === "T") || PLL_CASES[0], matchConfidence: 0.7 };
    }

    if (swaps === 2 && cornerSwaps === 2) {
      return { ...PLL_CASES.find((p) => p.id === "Y") || PLL_CASES[0], matchConfidence: 0.6 };
    }

    if (swaps === 4) {
      return { ...PLL_CASES.find((p) => p.id === "H") || PLL_CASES[0], matchConfidence: 0.8 };
    }

    // Default: recommend learning recognition
    return {
      id: "?",
      name: "Unknown PLL",
      algorithm: "Practice PLL recognition — look at blocks and headlights",
      difficulty: 3,
      category: "unknown",
      recognition: "Could not match a specific PLL case",
      moveCount: 0,
      matchConfidence: 0
    };
  }

  #countEdgeSwaps(snapshot) {
    const edges = [
      { face: "F", row: 0, col: 1 },
      { face: "R", row: 0, col: 1 },
      { face: "B", row: 0, col: 1 },
      { face: "L", row: 0, col: 1 },
    ];

    let swaps = 0;
    for (const edge of edges) {
      const color = snapshot[edge.face][edge.row][edge.col];
      const expected = snapshot[edge.face][1][1];
      if (color !== expected) swaps++;
    }
    return swaps;
  }

  #countCornerSwaps(snapshot) {
    // Simplified: check top corners of each side face
    const corners = [
      { face: "F", positions: [[0, 0], [0, 2]] },
      { face: "R", positions: [[0, 0], [0, 2]] },
      { face: "B", positions: [[0, 0], [0, 2]] },
      { face: "L", positions: [[0, 0], [0, 2]] },
    ];

    let swaps = 0;
    for (const corner of corners) {
      for (const [r, c] of corner.positions) {
        const color = snapshot[corner.face][r][c];
        const expected = snapshot[corner.face][1][1];
        if (color !== expected) swaps++;
      }
    }
    return Math.min(swaps, 8);
  }

  // -----------------------------------------------------------------------
  // Private: Progress and stats
  // -----------------------------------------------------------------------

  #calculateProgress(snapshot, phase) {
    const phases = ["cross", "f2l", "oll", "pll", "solved"];
    const phaseIndex = phases.indexOf(phase);

    // Count solved pieces for percentage
    let totalPieces = 0;
    let solvedPieces = 0;

    for (const face of ["U", "R", "F", "D", "L", "B"]) {
      const center = snapshot[face][1][1];
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          totalPieces++;
          if (snapshot[face][row][col] === center) solvedPieces++;
        }
      }
    }

    const overallPercent = totalPieces > 0 ? Math.round((solvedPieces / totalPieces) * 100) : 0;

    return {
      phase,
      phaseIndex,
      totalPhases: phases.length - 1, // exclude "solved" from count
      overallPercent,
      solvedPieces,
      totalPieces,
      cfopProgress: {
        cross: phaseIndex >= 1 ? "done" : phase === "cross" ? "in-progress" : "pending",
        f2l: phaseIndex >= 2 ? "done" : phase === "f2l" ? "in-progress" : "pending",
        oll: phaseIndex >= 3 ? "done" : phase === "oll" ? "in-progress" : "pending",
        pll: phaseIndex >= 4 ? "done" : phase === "pll" ? "in-progress" : "pending",
      }
    };
  }

  #createEmptyStats() {
    return {
      totalSolves: 0,
      bestTime: null,
      worstTime: null,
      averageTime: null,
      averageMoves: null,
      totalTime: 0,
      totalMoves: 0,
      methodBreakdown: {},
      lastSolve: null
    };
  }

  #updateStats(entry) {
    this.stats.totalSolves++;
    this.stats.totalTime += entry.time || 0;
    this.stats.totalMoves += entry.moves || 0;
    this.stats.lastSolve = entry;

    if (entry.time != null) {
      if (this.stats.bestTime === null || entry.time < this.stats.bestTime) {
        this.stats.bestTime = entry.time;
      }
      if (this.stats.worstTime === null || entry.time > this.stats.worstTime) {
        this.stats.worstTime = entry.time;
      }
      this.stats.averageTime = this.stats.totalTime / this.stats.totalSolves;
    }

    this.stats.averageMoves = this.stats.totalMoves / this.stats.totalSolves;

    if (entry.method) {
      this.stats.methodBreakdown[entry.method] = (this.stats.methodBreakdown[entry.method] || 0) + 1;
    }
  }
}

export { OLL_CASES, PLL_CASES, DIFFICULTY_LABELS };
