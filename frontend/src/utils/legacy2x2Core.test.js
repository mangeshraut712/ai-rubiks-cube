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
  it("turns every face clockwise in standard notation", () => {
    // Faces are stored U R F D L B, 4 stickers each (U=W R=R F=G D=Y L=O B=B).
    const sticker = (state, face, ...cells) =>
      cells.map((cell) => state["URFDLB".indexOf(face) * 4 + cell]).join("");
    const after = (move) => cubeCore.applyMove(move, cubeCore.SOLVED_STATE);

    expect(sticker(after("U"), "F", 0, 1)).toBe("RR"); // front top row comes from the right
    expect(sticker(after("D"), "F", 2, 3)).toBe("OO"); // front bottom row comes from the left
    expect(sticker(after("R"), "U", 1, 3)).toBe("GG"); // up right column comes from the front
    expect(sticker(after("L"), "U", 0, 2)).toBe("BB"); // up left column comes from the back
    expect(sticker(after("F"), "U", 2, 3)).toBe("OO"); // up front row comes from the left
    expect(sticker(after("B"), "U", 0, 1)).toBe("RR"); // up back row comes from the right
  });

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

  it("solves a half turn, which needs two quarter turns on the same face", async () => {
    const scrambledState = applySequence(cubeCore.SOLVED_STATE, ["U", "U"]);
    const bfs = await legacySolver.solveBFS(scrambledState);
    const astar = await legacyAStar.solveAStar(scrambledState);
    const ida = await legacySolver.solveIDS(scrambledState);

    expect(applySequence(scrambledState, bfs.solution)).toBe(cubeCore.SOLVED_STATE);
    expect(bfs.solution).toHaveLength(2);
    expect(astar.solution).toHaveLength(bfs.solution.length);
    expect(applySequence(scrambledState, astar.solution)).toBe(cubeCore.SOLVED_STATE);
    expect(ida.solution).toHaveLength(bfs.solution.length);
    expect(applySequence(scrambledState, ida.solution)).toBe(cubeCore.SOLVED_STATE);
  });
});
