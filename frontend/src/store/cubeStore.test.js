import { beforeEach, describe, expect, it } from "vitest";

import { createSolvedCubeState } from "../utils/cubeColors";
import { applyMoveToState } from "../utils/cubeLogic";
import { useCubeStore } from "./cubeStore";

function resetStore() {
  useCubeStore.setState({
    cubeState: createSolvedCubeState(),
    moveHistory: [],
    redoStack: [],
    activeMove: "",
    statistics: {
      totalSessions: 0,
      totalMoves: 0,
      totalTimeSeconds: 0,
      solvedCubes: 0,
      bestTime: null,
      averageTime: null,
      moveAccuracy: 100
    }
  });
}

describe("cube store history", () => {
  beforeEach(() => {
    resetStore();
  });

  it("undo restores the cube from before the move", () => {
    const before = createSolvedCubeState();
    const after = applyMoveToState(before, "R");

    useCubeStore.getState().applyMove("R", "user", before);
    useCubeStore.getState().setCubeState(after);
    expect(useCubeStore.getState().moveHistory[0].stateBefore).toEqual(before);

    useCubeStore.getState().undoMove();

    expect(useCubeStore.getState().cubeState).toEqual(before);
    expect(useCubeStore.getState().statistics.totalMoves).toBe(0);
  });

  it("redo reapplies the undone move from its saved state", () => {
    const before = createSolvedCubeState();
    useCubeStore.getState().applyMove("U", "user", before);
    useCubeStore.getState().setCubeState(applyMoveToState(before, "U"));

    useCubeStore.getState().undoMove();
    const redone = useCubeStore.getState().redoMove();

    expect(redone.stateBefore).toEqual(before);
    expect(applyMoveToState(redone.stateBefore, redone.move)).toEqual(applyMoveToState(before, "U"));
    expect(useCubeStore.getState().statistics.totalMoves).toBe(1);
  });

  it("clears undo history when a new cube state is loaded", () => {
    const before = createSolvedCubeState();
    useCubeStore.getState().applyMove("R", "user", before);
    useCubeStore.getState().loadCubeState(applyMoveToState(before, "F"));

    expect(useCubeStore.getState().moveHistory).toEqual([]);
    expect(useCubeStore.getState().undoMove()).toBeNull();
  });
});