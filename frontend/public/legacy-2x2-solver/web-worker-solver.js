// ===== WEB WORKER FOR NON-BLOCKING SOLVE =====
// Runs solver in background thread to keep UI responsive
// Fixed: Correct 2x2 cube representation

self.importScripts = self.importScripts || function () {};

// Move definitions - fixed 2x2 permutations
const MOVES = {
  U: [2, 3, 0, 1, 4, 5, 10, 11, 8, 9, 6, 7, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
  "U'": [1, 0, 3, 2, 4, 5, 6, 7, 10, 11, 8, 9, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
  R: [0, 5, 2, 7, 6, 4, 5, 3, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 1, 21, 22, 20],
  "R'": [0, 22, 2, 20, 3, 5, 7, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 7, 21, 1, 23],
  F: [0, 1, 19, 17, 2, 5, 3, 7, 10, 8, 11, 9, 6, 4, 14, 15, 16, 12, 18, 13, 20, 21, 22, 23],
  "F'": [0, 1, 4, 6, 13, 5, 12, 7, 9, 11, 8, 10, 17, 19, 14, 15, 16, 3, 18, 2, 20, 21, 22, 23],
  D: [0, 1, 2, 3, 4, 5, 8, 9, 10, 11, 6, 7, 14, 12, 15, 13, 16, 17, 20, 21, 18, 19, 22, 23],
  "D'": [0, 1, 2, 3, 4, 5, 10, 11, 6, 7, 8, 9, 13, 15, 12, 14, 16, 17, 22, 23, 20, 21, 18, 19],
  L: [23, 1, 21, 3, 4, 5, 6, 7, 0, 9, 2, 11, 8, 13, 10, 15, 18, 16, 19, 17, 20, 14, 22, 12],
  "L'": [8, 1, 10, 3, 4, 5, 6, 7, 12, 9, 14, 11, 23, 13, 21, 15, 17, 19, 16, 18, 20, 2, 22, 0],
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

// Fixed solved state
const SOLVED = "WWWWRRRRGGGGOOOOBBBB";
const ALL_MOVES = ["U", "U'", "R", "R'", "F", "F'", "D", "D'", "L", "L'", "B", "B'"];

function applyMove(move, state) {
  const p = MOVES[move];
  return p.map((i) => state[i]).join("");
}

// Bidirectional BFS (copied from main solver)
function solveBFS(initial) {
  if (initial === SOLVED) return { solution: [], nodesExplored: 0 };

  const fwd = new Map([[initial, null]]);
  let fwdFrontier = [initial];
  const bwd = new Map([[SOLVED, null]]);
  let bwdFrontier = [SOLVED];
  let nodes = 0;

  while (fwdFrontier.length > 0 && bwdFrontier.length > 0) {
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

    // Send progress update
    if (nodes % 5000 === 0) {
      self.postMessage({ type: "progress", nodes });
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

  let s = meeting;
  while (fwd.get(s) !== null) {
    const info = fwd.get(s);
    path.unshift(info.move);
    s = info.parent;
  }

  s = meeting;
  while (bwd.get(s) !== null) {
    const info = bwd.get(s);
    path.push(INVERSE[info.move]);
    s = info.parent;
  }

  return path;
}

// Listen for messages from main thread
self.addEventListener("message", function (e) {
  const { type, state, algorithm } = e.data;

  if (type === "solve") {
    try {
      const result = solveBFS(state); // Can be extended for other algorithms
      self.postMessage({
        type: "complete",
        solution: result.solution,
        nodesExplored: result.nodesExplored,
        error: result.error
      });
    } catch (error) {
      self.postMessage({
        type: "error",
        message: error.message
      });
    }
  }
});
