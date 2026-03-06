await import("../../public/legacy-2x2-solver/cube-core.js");
await import("../../public/legacy-2x2-solver/solver.js");
await import("../../public/legacy-2x2-solver/a-star-solver.js");

const cubeCore = globalThis.CubeCore2x2;
const legacySolver = globalThis.Legacy2x2Solver;
const legacyAStar = { solveAStar: globalThis.solveAStar };

function applySequence(initialState, moves) {
  return moves.reduce((state, move) => cubeCore.applyMove(move, state), initialState);
}

describe("legacy 2x2 cube core", () => {
  it("keeps a valid 24-sticker solved state", () => {
    expect(cubeCore.SOLVED_STATE).toHaveLength(24);
    expect(cubeCore.validateState(cubeCore.SOLVED_STATE)).toBe(true);
  });

  it("derives bijective quarter-turn permutations", () => {
    Object.values(cubeCore.MOVE_PERMUTATIONS).forEach((permutation) => {
      expect(permutation).toHaveLength(24);
      expect(new Set(permutation).size).toBe(24);
    });
  });

  it("returns to solved state after a move followed by its inverse", () => {
    cubeCore.ALL_MOVES.forEach((move) => {
      const nextState = cubeCore.applyMove(move, cubeCore.SOLVED_STATE);
      const resetState = cubeCore.applyMove(cubeCore.INVERSE_MOVES[move], nextState);
      expect(resetState).toBe(cubeCore.SOLVED_STATE);
    });
  });

  it("solves representative scrambles with bidirectional BFS", async () => {
    const scramble = ["R", "U", "F", "R'", "D"];
    const scrambledState = applySequence(cubeCore.SOLVED_STATE, scramble);
    const result = await legacySolver.solveBFS(scrambledState);

    expect(result.solution).toBeTruthy();
    expect(applySequence(scrambledState, result.solution)).toBe(cubeCore.SOLVED_STATE);
  });

  it("solves short scrambles with A*", async () => {
    const scramble = ["F", "U", "R", "U'"];
    const scrambledState = applySequence(cubeCore.SOLVED_STATE, scramble);
    const result = await legacyAStar.solveAStar(scrambledState);

    expect(result.solution).toBeTruthy();
    expect(applySequence(scrambledState, result.solution)).toBe(cubeCore.SOLVED_STATE);
  });
});
