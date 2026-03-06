import { describe, expect, it } from "vitest";

import { CubeState, generateScramble, solveCube } from "./cubeStateManager.js";

function inverseMove(move) {
  if (move.endsWith("2")) {
    return move;
  }

  return move.endsWith("'") ? move[0] : `${move}'`;
}

describe("cubeStateManager", () => {
  it("creates a solved cube by default", () => {
    const cube = new CubeState();

    expect(cube.isSolved()).toBe(true);
    expect(cube.toFaceString()).toHaveLength(54);
  });

  it("returns to solved state after a sequence and its inverse", () => {
    const cube = new CubeState();
    const sequence = ["R", "U", "R'", "U'", "F2", "L", "D'"];
    const inverseSequence = [...sequence].reverse().map(inverseMove);

    cube.applyMove(sequence.join(" "));
    expect(cube.isSolved()).toBe(false);

    cube.applyMove(inverseSequence.join(" "));
    expect(cube.isSolved()).toBe(true);
  });

  it("solves a representative scramble through the Kociemba path", () => {
    const cube = new CubeState();
    const scramble = "R U R' U' F2";

    cube.applyMove(scramble);
    const solution = solveCube(cube.toFaceString());

    expect(solution.length).toBeGreaterThan(0);

    cube.applyMove(solution.join(" "));
    expect(cube.isSolved()).toBe(true);
  });

  it("generates scrambles with the requested length and without repeated adjacent faces", () => {
    const scramble = generateScramble(20);

    expect(scramble).toHaveLength(20);
    expect(scramble.every((move, index) => index === 0 || move[0] !== scramble[index - 1][0])).toBe(
      true
    );
  });

  it("throws when solveCube receives an invalid face string", () => {
    expect(() => solveCube("short")).toThrow(/54-character face string/);
  });
});
