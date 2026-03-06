(function (root, factory) {
  const api = factory(
    root.CubeCore2x2 || (typeof module === "object" && module.exports ? require("./cube-core.js") : null)
  );

  root.Legacy2x2Solver = api;
  root.applyMove = api.applyMove;
  root.generateScramble = api.generateScramble;
  root.isSolved = api.isSolved;
  root.reset = api.reset;
  root.solveBFS = api.solveBFS;
  root.solveIDS = api.solveIDS;

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (CubeCore2x2) {
  if (!CubeCore2x2) {
    throw new Error("CubeCore2x2 is required before loading solver.js");
  }

  const { ALL_MOVES, INVERSE_MOVES: INVERSE, SOLVED_STATE: SOLVED, applyMove, generateScramble, isSolved } =
    CubeCore2x2;

  function reset() {
    return SOLVED;
  }

  async function solveBFS(initial, onProgress) {
    if (initial === SOLVED) {
      return { solution: [], nodesExplored: 0 };
    }

    const forwardVisited = new Map([[initial, null]]);
    let forwardFrontier = [initial];

    const backwardVisited = new Map([[SOLVED, null]]);
    let backwardFrontier = [SOLVED];

    let nodesExplored = 0;

    while (forwardFrontier.length > 0 && backwardFrontier.length > 0) {
      if (forwardFrontier.length <= backwardFrontier.length) {
        const result = expandFrontier(forwardFrontier, forwardVisited, backwardVisited);
        nodesExplored += forwardFrontier.length;
        forwardFrontier = result.nextFrontier;

        if (result.meetingState) {
          return {
            solution: buildPath(result.meetingState, forwardVisited, backwardVisited),
            nodesExplored
          };
        }
      } else {
        const result = expandFrontier(backwardFrontier, backwardVisited, forwardVisited);
        nodesExplored += backwardFrontier.length;
        backwardFrontier = result.nextFrontier;

        if (result.meetingState) {
          return {
            solution: buildPath(result.meetingState, forwardVisited, backwardVisited),
            nodesExplored
          };
        }
      }

      if (onProgress && nodesExplored % 5000 === 0) {
        onProgress(`BFS: ${nodesExplored.toLocaleString()} states`);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    return {
      solution: null,
      nodesExplored,
      error: "No solution found for the current state"
    };
  }

  function expandFrontier(frontier, visited, otherVisited) {
    const nextFrontier = [];

    for (const state of frontier) {
      const parentInfo = visited.get(state);
      const lastMove = parentInfo ? parentInfo.move : null;

      for (const move of ALL_MOVES) {
        if (lastMove && (INVERSE[move] === lastMove || move[0] === lastMove[0])) {
          continue;
        }

        const nextState = applyMove(move, state);

        if (visited.has(nextState)) {
          continue;
        }

        visited.set(nextState, { parent: state, move });
        nextFrontier.push(nextState);

        if (otherVisited.has(nextState)) {
          return { nextFrontier, meetingState: nextState };
        }
      }
    }

    return { nextFrontier, meetingState: null };
  }

  function buildPath(meetingState, forwardVisited, backwardVisited) {
    const path = [];

    let currentState = meetingState;
    while (forwardVisited.get(currentState) !== null) {
      const info = forwardVisited.get(currentState);
      path.unshift(info.move);
      currentState = info.parent;
    }

    currentState = meetingState;
    while (backwardVisited.get(currentState) !== null) {
      const info = backwardVisited.get(currentState);
      path.push(INVERSE[info.move]);
      currentState = info.parent;
    }

    return path;
  }

  async function solveIDS(initial, onProgress) {
    if (initial === SOLVED) {
      return { solution: [], nodesExplored: 0 };
    }

    const startTime = Date.now();
    const maxTimeMs = 30000;
    let totalNodes = 0;

    function heuristic(state) {
      let mismatchCount = 0;

      for (let index = 0; index < SOLVED.length; index += 1) {
        if (state[index] !== SOLVED[index]) {
          mismatchCount += 1;
        }
      }

      return Math.floor(mismatchCount / 8);
    }

    function search(state, depth, bound, lastMove) {
      totalNodes += 1;

      const estimate = depth + heuristic(state);
      if (estimate > bound) {
        return { found: false, min: estimate };
      }

      if (state === SOLVED) {
        return { found: true, solution: [] };
      }

      let minimum = Infinity;

      for (const move of ALL_MOVES) {
        if (lastMove && (INVERSE[move] === lastMove || move[0] === lastMove[0])) {
          continue;
        }

        const result = search(applyMove(move, state), depth + 1, bound, move);

        if (result.found) {
          return { found: true, solution: [move, ...result.solution] };
        }

        minimum = Math.min(minimum, result.min);
      }

      return { found: false, min: minimum };
    }

    let bound = heuristic(initial);

    for (let depth = 1; depth <= 14; depth += 1) {
      if (Date.now() - startTime > maxTimeMs) {
        return {
          solution: null,
          nodesExplored: totalNodes,
          error: "IDA* timed out after 30 seconds. Try BFS for guaranteed results."
        };
      }

      if (onProgress) {
        const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
        onProgress(`IDA*: depth ${bound} after ${elapsedSeconds}s`);
        await new Promise((resolve) => setTimeout(resolve, 0));
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
      error: "Max depth reached. Try a shorter scramble or BFS."
    };
  }

  return {
    ALL_MOVES,
    INVERSE,
    SOLVED,
    applyMove,
    generateScramble,
    isSolved,
    reset,
    solveBFS,
    solveIDS
  };
});
