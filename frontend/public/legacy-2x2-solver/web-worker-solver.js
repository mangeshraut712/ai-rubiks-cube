self.importScripts("./cube-core.js");

const { ALL_MOVES, INVERSE_MOVES: INVERSE, SOLVED_STATE: SOLVED, applyMove } = self.CubeCore2x2;

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

function solveBFS(initialState) {
  if (initialState === SOLVED) {
    return { solution: [], nodesExplored: 0 };
  }

  const forwardVisited = new Map([[initialState, null]]);
  let forwardFrontier = [initialState];

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

    if (nodesExplored % 5000 === 0) {
      self.postMessage({ type: "progress", nodes: nodesExplored });
    }
  }

  return {
    solution: null,
    nodesExplored,
    error: "No solution found"
  };
}

self.addEventListener("message", (event) => {
  const { type, state } = event.data;

  if (type !== "solve") {
    return;
  }

  try {
    const result = solveBFS(state);
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
});
