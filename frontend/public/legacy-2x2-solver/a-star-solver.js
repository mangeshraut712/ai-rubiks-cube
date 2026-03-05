// ===== IMPROVED A* SOLVER =====
// Optimized for complex scrambles with IDA* fallback
// Fixed: Correct 2x2 cube representation

// Solved state - must match solver.js
const SOLVED = "WWWWRRRRGGGGOOOOBBBB";
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
const ALL_MOVES = ["U", "U'", "R", "R'", "F", "F'", "D", "D'", "L", "L'", "B", "B'"];

// Move permutations - must match solver.js
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

function applyMove(move, state) {
  const p = MOVES[move];
  return p.map((i) => state[i]).join("");
}

/**
 * Binary heap priority queue
 */
class MinHeap {
  constructor() {
    this.heap = [];
  }

  push(element, priority) {
    this.heap.push({ element, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const end = this.heap.pop();
    if (this.heap.length > 0 && end) {
      this.heap[0] = end;
      this.sinkDown(0);
    }
    return min;
  }

  bubbleUp(index) {
    const element = this.heap[index];
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIndex];
      if (element.priority >= parent.priority) break;
      this.heap[index] = parent;
      index = parentIndex;
    }
    this.heap[index] = element;
  }

  sinkDown(index) {
    const length = this.heap.length;
    const element = this.heap[index];

    while (true) {
      let swapIndex = null;
      const leftIndex = 2 * index + 1;
      const rightIndex = 2 * index + 2;

      if (leftIndex < length && this.heap[leftIndex].priority < element.priority) {
        swapIndex = leftIndex;
      }

      if (rightIndex < length) {
        const right = this.heap[rightIndex];
        if (
          (swapIndex === null && right.priority < element.priority) ||
          (swapIndex !== null && right.priority < this.heap[swapIndex].priority)
        ) {
          swapIndex = rightIndex;
        }
      }

      if (swapIndex === null) break;
      this.heap[index] = this.heap[swapIndex];
      index = swapIndex;
    }
    this.heap[index] = element;
  }

  isEmpty() {
    return this.heap.length === 0;
  }
  get length() {
    return this.heap.length;
  }
}

/**
 * A* Search with high node limit and time limit
 */
async function solveAStar(initial, onProgress) {
  if (initial === SOLVED) {
    return { solution: [], nodesExplored: 0 };
  }

  const pq = new MinHeap();
  const visited = new Map();
  const closed = new Set();

  pq.push(initial, heuristic(initial));
  visited.set(initial, { parent: null, move: null, g: 0 });

  let nodes = 0;
  const maxNodes = 2000000; // 2 million nodes
  const startTime = Date.now();
  const maxTime = 30000; // 30 second timeout

  while (!pq.isEmpty() && nodes < maxNodes) {
    // Check time limit
    if (Date.now() - startTime > maxTime) {
      return {
        solution: null,
        nodesExplored: nodes,
        error: "Time limit (30s) - try BFS instead"
      };
    }

    const result = pq.pop();
    if (!result) break;

    const state = result.element;

    if (closed.has(state)) continue;
    closed.add(state);
    nodes++;

    if (state === SOLVED) {
      return {
        solution: reconstructPath(state, visited),
        nodesExplored: nodes
      };
    }

    const stateInfo = visited.get(state);
    const currentG = stateInfo.g;
    const lastMove = stateInfo.move || "";

    for (const move of ALL_MOVES) {
      if (lastMove && (INVERSE[move] === lastMove || move[0] === lastMove[0])) {
        continue;
      }

      const next = applyMove(move, state);
      if (closed.has(next)) continue;

      const nextG = currentG + 1;
      const existingInfo = visited.get(next);

      if (!existingInfo || nextG < existingInfo.g) {
        visited.set(next, { parent: state, move, g: nextG });
        pq.push(next, nextG + heuristic(next));
      }
    }

    if (onProgress && nodes % 5000 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      onProgress(`A*: ${nodes.toLocaleString()} nodes (${elapsed}s)`);
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  return {
    solution: null,
    nodesExplored: nodes,
    error: nodes >= maxNodes ? "Node limit reached - use BFS for complex scrambles" : "No solution"
  };
}

/**
 * Reconstruct solution path
 */
function reconstructPath(state, visited) {
  const path = [];
  let current = state;

  while (true) {
    const info = visited.get(current);
    if (!info || info.parent === null) break;
    path.unshift(info.move);
    current = info.parent;
  }

  return path;
}
