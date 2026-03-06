(function (root, factory) {
  const api = factory(
    root.CubeCore2x2 || (typeof module === "object" && module.exports ? require("./cube-core.js") : null)
  );

  root.solveAStar = api.solveAStar;

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (CubeCore2x2) {
  if (!CubeCore2x2) {
    throw new Error("CubeCore2x2 is required before loading a-star-solver.js");
  }

  const { ALL_MOVES, INVERSE_MOVES: INVERSE, SOLVED_STATE: SOLVED, applyMove } = CubeCore2x2;

  class MinHeap {
    constructor() {
      this.heap = [];
    }

    push(element, priority) {
      this.heap.push({ element, priority });
      this.bubbleUp(this.heap.length - 1);
    }

    pop() {
      if (this.heap.length === 0) {
        return null;
      }

      const minimum = this.heap[0];
      const tail = this.heap.pop();

      if (this.heap.length > 0 && tail) {
        this.heap[0] = tail;
        this.sinkDown(0);
      }

      return minimum;
    }

    bubbleUp(index) {
      const element = this.heap[index];

      while (index > 0) {
        const parentIndex = Math.floor((index - 1) / 2);
        const parent = this.heap[parentIndex];

        if (element.priority >= parent.priority) {
          break;
        }

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
        const leftIndex = index * 2 + 1;
        const rightIndex = index * 2 + 2;

        if (leftIndex < length && this.heap[leftIndex].priority < element.priority) {
          swapIndex = leftIndex;
        }

        if (rightIndex < length) {
          const rightChild = this.heap[rightIndex];
          if (
            (swapIndex === null && rightChild.priority < element.priority) ||
            (swapIndex !== null && rightChild.priority < this.heap[swapIndex].priority)
          ) {
            swapIndex = rightIndex;
          }
        }

        if (swapIndex === null) {
          break;
        }

        this.heap[index] = this.heap[swapIndex];
        index = swapIndex;
      }

      this.heap[index] = element;
    }

    isEmpty() {
      return this.heap.length === 0;
    }
  }

  function heuristic(state) {
    let mismatchCount = 0;

    for (let index = 0; index < SOLVED.length; index += 1) {
      if (state[index] !== SOLVED[index]) {
        mismatchCount += 1;
      }
    }

    return Math.floor(mismatchCount / 8);
  }

  function reconstructPath(targetState, visited) {
    const path = [];
    let currentState = targetState;

    while (true) {
      const info = visited.get(currentState);
      if (!info || info.parent === null) {
        break;
      }

      path.unshift(info.move);
      currentState = info.parent;
    }

    return path;
  }

  async function solveAStar(initial, onProgress) {
    if (initial === SOLVED) {
      return { solution: [], nodesExplored: 0 };
    }

    const queue = new MinHeap();
    const visited = new Map();
    const closed = new Set();
    const startTime = Date.now();
    const maxNodes = 2000000;
    const maxTimeMs = 30000;
    let nodesExplored = 0;

    queue.push(initial, heuristic(initial));
    visited.set(initial, { parent: null, move: null, g: 0 });

    while (!queue.isEmpty() && nodesExplored < maxNodes) {
      if (Date.now() - startTime > maxTimeMs) {
        return {
          solution: null,
          nodesExplored,
          error: "A* timed out after 30 seconds. Try BFS for guaranteed results."
        };
      }

      const current = queue.pop();
      if (!current) {
        break;
      }

      const currentState = current.element;
      if (closed.has(currentState)) {
        continue;
      }

      closed.add(currentState);
      nodesExplored += 1;

      if (currentState === SOLVED) {
        return {
          solution: reconstructPath(currentState, visited),
          nodesExplored
        };
      }

      const currentInfo = visited.get(currentState);
      const currentCost = currentInfo.g;
      const lastMove = currentInfo.move || "";

      for (const move of ALL_MOVES) {
        if (lastMove && (INVERSE[move] === lastMove || move[0] === lastMove[0])) {
          continue;
        }

        const nextState = applyMove(move, currentState);
        if (closed.has(nextState)) {
          continue;
        }

        const nextCost = currentCost + 1;
        const existingInfo = visited.get(nextState);

        if (!existingInfo || nextCost < existingInfo.g) {
          visited.set(nextState, { parent: currentState, move, g: nextCost });
          queue.push(nextState, nextCost + heuristic(nextState));
        }
      }

      if (onProgress && nodesExplored % 5000 === 0) {
        const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
        onProgress(`A*: ${nodesExplored.toLocaleString()} states after ${elapsedSeconds}s`);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    return {
      solution: null,
      nodesExplored,
      error:
        nodesExplored >= maxNodes
          ? "A* hit the node budget. Use BFS for deeper scrambles."
          : "No solution found"
    };
  }

  return {
    solveAStar
  };
});
