import { describe, expect, it } from "vitest";

import { createSolvedCubeState } from "./cubeColors";
import { applyMoveToState } from "./cubeLogic";

function inverseMove(move) {
  if (move.endsWith("2")) {
    return move;
  }

  return move.endsWith("'") ? move[0] : `${move}'`;
}

function applySequence(moves) {
  return applyMoveToState(createSolvedCubeState(), moves.join(" "));
}

describe("cubeLogic", () => {
  it("returns to solved state after a move followed by its inverse", () => {
    const moves = ["U", "R", "F", "D", "L", "B", "U2", "R2", "F2"];

    for (const move of moves) {
      const state = applyMoveToState(createSolvedCubeState(), `${move} ${inverseMove(move)}`);
      expect(state).toEqual(createSolvedCubeState());
    }
  });

  it("returns to solved state after a sequence and its inverse sequence", () => {
    const sequence = ["R", "U", "R'", "U'", "F2", "L", "D'"];
    const inverseSequence = [...sequence].reverse().map(inverseMove);

    const state = applyMoveToState(
      createSolvedCubeState(),
      [...sequence, ...inverseSequence].join(" ")
    );

    expect(state).toEqual(createSolvedCubeState());
  });

  it("preserves all 54 stickers after a representative sequence", () => {
    const state = applySequence(["R", "U", "R'", "U'", "F2"]);
    const stickers = Object.values(state).flatMap((face) => face.flat());

    expect(stickers).toHaveLength(54);
    expect(stickers.filter((item) => item === "U")).toHaveLength(9);
    expect(stickers.filter((item) => item === "R")).toHaveLength(9);
    expect(stickers.filter((item) => item === "F")).toHaveLength(9);
    expect(stickers.filter((item) => item === "D")).toHaveLength(9);
    expect(stickers.filter((item) => item === "L")).toHaveLength(9);
    expect(stickers.filter((item) => item === "B")).toHaveLength(9);
  });

  it("throws on invalid move notation", () => {
    expect(() => applyMoveToState(createSolvedCubeState(), "X")).toThrow(/Invalid move token/);
  });
});
