// ===== ULTRA-FAST 2×2 SOLVER =====
// Optimized Bidirectional BFS
// Fixed: Correct 2x2 cube representation

const MOVES = {
  // 2x2 cube move permutations - 24 stickers
  // Face order: U(0-3), R(4-7), F(8-11), D(12-15), L(16-19), B(20-23)
  // U moves: rotate top face (indices 0,1,2,3)
  U: [2, 3, 0, 1, 4, 5, 10, 11, 8, 9, 6, 7, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
  "U'": [1, 0, 3, 2, 4, 5, 6, 7, 10, 11, 8, 9, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],

  // R moves: rotate right face (affects R face and adjacent slices)
  R: [0, 5, 2, 7, 6, 4, 5, 3, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 1, 21, 22, 20],
  "R'": [0, 22, 2, 20, 3, 5, 7, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 7, 21, 1, 23],

  // F moves: rotate front face
  F: [0, 1, 19, 17, 2, 5, 3, 7, 10, 8, 11, 9, 6, 4, 14, 15, 16, 12, 18, 13, 20, 21, 22, 23],
  "F'": [0, 1, 4, 6, 13, 5, 12, 7, 9, 11, 8, 10, 17, 19, 14, 15, 16, 3, 18, 2, 20, 21, 22, 23],

  // D moves: rotate bottom face
  D: [0, 1, 2, 3, 4, 5, 8, 9, 10, 11, 6, 7, 14, 12, 15, 13, 16, 17, 20, 21, 18, 19, 22, 23],
  "D'": [0, 1, 2, 3, 4, 5, 10, 11, 6, 7, 8, 9, 13, 15, 12, 14, 16, 17, 22, 23, 20, 21, 18, 19],

  // L moves: rotate left face
  L: [23, 1, 21, 3, 4, 5, 6, 7, 0, 9, 2, 11, 8, 13, 10, 15, 18, 16, 19, 17, 20, 14, 22, 12],
  "L'": [8, 1, 10, 3, 4, 5, 6, 7, 12, 9, 14, 11, 23, 13, 21, 15, 17, 19, 16, 18, 20, 2, 22, 0],

  // B moves: rotate back face
  B: [18, 16, 2, 3, 4, 0, 6, 1, 8, 9, 10, 11, 12, 13, 7, 5, 14, 17, 15, 19, 22, 20, 23, 21],
  "B'": [5, 7, 2, 3, 4, 15, 6, 14, 8, 9, 10, 11, 12, 13, 1, 0, 16, 18, 3, 17, 21, 23, 20, 22]
};

const INVERSE = {
  U: "U'",
  "U'": "U",
  R: "R'",
  "R'": "R",
  F: "F'",
  "F'": "F",
  D: "D'",
  "D'": "D",
  L: "L'",
  "L'": "L",
  B: "B'",
  "B'": "B"
};

// Solved state: U=W, R=R, F=G, D=Y, L=O, B=B (standard colors)
// State format: U(0-3), R(4-7), F(8-11), D(12-15), L(16-19), B(20-23)
const SOLVED = "WWWWRRRRGGGGOOOOBBBB";
const ALL_MOVES = ["U", "U'", "R", "R'", "F", "F'", "D", "D'", "L", "L'", "B", "B'"];

function applyMove(move, state) {
  const p = MOVES[move];
  return p.map((i) => state[i]).join("");
}

const isSolved = (s) => s === SOLVED;
const reset = () => SOLVED;

function generateScramble(len) {
  const result = [];
  let last = "";
  for (let i = 0; i < len; i++) {
    let m;
    do {
      m = ALL_MOVES[Math.floor(Math.random() * 12)];
    } while (last && (m[0] === last[0] || INVERSE[m] === last));
    result.push(m);
    last = m;
  }
  return result;
}

// === BIDIRECTIONAL BFS ===
async function solveBFS(initial, onProgress) {
  if (initial === SOLVED) return { solution: [], nodesExplored: 0 };

  // Forward: from initial
  const fwd = new Map([[initial, null]]); // state -> {parent, move}
  let fwdFrontier = [initial];

  // Backward: from solved
  const bwd = new Map([[SOLVED, null]]);
  let bwdFrontier = [SOLVED];

  let nodes = 0;

  while (fwdFrontier.length > 0 && bwdFrontier.length > 0) {
    // Expand smaller frontier for efficiency
    if (fwdFrontier.length <= bwdFrontier.length) {
      const result = expandFrontier(fwdFrontier, fwd, bwd, false);
      nodes += fwdFrontier.length;
      fwdFrontier = result.nextFrontier;
      if (result.meeting) {
        return { solution: buildPath(result.meeting, fwd, bwd), nodesExplored: nodes };
      }
    } else {
      const result = expandFrontier(bwdFrontier, bwd, fwd, true);
      nodes += bwdFrontier.length;
      bwdFrontier = result.nextFrontier;
      if (result.meeting) {
        return { solution: buildPath(result.meeting, fwd, bwd), nodesExplored: nodes };
      }
    }

    if (onProgress && nodes % 5000 === 0) {
      onProgress(`BFS: ${nodes} nodes`);
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  return { solution: null, nodesExplored: nodes, error: "No solution" };
}

function expandFrontier(frontier, visited, other, isBackward) {
  const nextFrontier = [];

  for (const state of frontier) {
    const parentInfo = visited.get(state);
    const lastMove = parentInfo ? parentInfo.move : null;

    for (const move of ALL_MOVES) {
      if (lastMove && (INVERSE[move] === lastMove || move[0] === lastMove[0])) continue;

      const next = applyMove(move, state);

      if (!visited.has(next)) {
        visited.set(next, { parent: state, move });
        nextFrontier.push(next);

        if (other.has(next)) {
          return { nextFrontier, meeting: next };
        }
      }
    }
  }

  return { nextFrontier, meeting: null };
}

function buildPath(meeting, fwd, bwd) {
  const path = [];

  // Forward: initial -> meeting
  let s = meeting;
  while (fwd.get(s) !== null) {
    const info = fwd.get(s);
    path.unshift(info.move);
    s = info.parent;
  }

  // Backward: meeting -> solved (reverse moves)
  s = meeting;
  while (bwd.get(s) !== null) {
    const info = bwd.get(s);
    path.push(INVERSE[info.move]);
    s = info.parent;
  }

  return path;
}

// === IDA* (Iterative Deepening A*) ===
// Much faster than plain IDS due to heuristic pruning
async function solveIDS(initial, onProgress) {
  if (initial === SOLVED) return { solution: [], nodesExplored: 0 };

  const startTime = Date.now();
  const maxTime = 30000; // 30 second timeout
  let totalNodes = 0;

  // Simple heuristic: count misplaced stickers / 8
  function h(state) {
    let mismatch = 0;
    for (let i = 0; i < 24; i++) {
      if (state[i] !== SOLVED[i]) mismatch++;
    }
    return Math.floor(mismatch / 8);
  }

  // IDA* search
  function search(state, g, bound, lastMove) {
    totalNodes++;

    const f = g + h(state);
    if (f > bound) return { found: false, min: f };
    if (state === SOLVED) return { found: true, solution: [] };

    let min = Infinity;

    for (const move of ALL_MOVES) {
      // Pruning: don't undo or repeat same face
      if (lastMove && (INVERSE[move] === lastMove || move[0] === lastMove[0])) {
        continue;
      }

      const next = applyMove(move, state);
      const result = search(next, g + 1, bound, move);

      if (result.found) {
        return { found: true, solution: [move, ...result.solution] };
      }

      if (result.min < min) min = result.min;
    }

    return { found: false, min };
  }

  let bound = h(initial);

  for (let depth = 1; depth <= 14; depth++) {
    // Check time limit
    if (Date.now() - startTime > maxTime) {
      return {
        solution: null,
        nodesExplored: totalNodes,
        error: "Time limit (30s) - try BFS for complex scrambles"
      };
    }

    if (onProgress) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      onProgress(`IDA* depth ${bound} (${elapsed}s)`);
      await new Promise((r) => setTimeout(r, 0));
    }

    const result = search(initial, 0, bound, "");

    if (result.found) {
      return {
        solution: result.solution,
        nodesExplored: totalNodes
      };
    }

    if (result.min === Infinity) {
      return {
        solution: null,
        nodesExplored: totalNodes,
        error: "No solution found"
      };
    }

    bound = result.min;
  }

  return {
    solution: null,
    nodesExplored: totalNodes,
    error: "Max depth - try BFS for complex scrambles"
  };
}
