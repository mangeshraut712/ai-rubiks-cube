import { describe, expect, it } from "vitest";

import { CubeState } from "../cubeStateManager.js";
import { CubeAnalyzer, PLL_CASES } from "./cubeAnalyzer.js";

function solvedSnapshot() {
  return new CubeState().getSnapshot();
}

describe("CubeAnalyzer", () => {
  it("keeps PLL move counts equal to the algorithm length", () => {
    for (const pllCase of PLL_CASES) {
      const tokens = pllCase.algorithm.split(/\s+/).filter(Boolean);
      expect({ id: pllCase.id, moveCount: pllCase.moveCount }).toEqual({
        id: pllCase.id,
        moveCount: tokens.length
      });
    }
  });

  it("stays on the cross when down-face edges are right but side colors are not", () => {
    const snapshot = solvedSnapshot();
    snapshot.F[2][1] = "R";
    snapshot.R[2][1] = "F";

    const analysis = new CubeAnalyzer().analyzeState(snapshot);

    expect(analysis.phase).toBe("cross");
  });

  it("reports a solved cube as solved", () => {
    const analysis = new CubeAnalyzer().analyzeState(solvedSnapshot());
    expect(analysis.phase).toBe("solved");
  });

  it("does not recommend an OLL algorithm for a partial pattern match", () => {
    const snapshot = solvedSnapshot();
    const pattern = ["0", "1", "0", "1", "0", "1", "0", "1"];
    let index = 0;

    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        if (row === 1 && col === 1) {
          continue;
        }
        snapshot.U[row][col] = pattern[index] === "1" ? "U" : "F";
        index += 1;
      }
    }

    const analysis = new CubeAnalyzer().analyzeState(snapshot);

    expect(analysis.phase).toBe("oll");
    expect(analysis.ollCase.id).toBe(0);
    expect(analysis.ollCase.algorithm).toMatch(/two-look OLL/i);
  });

  it("matches an all-oriented last layer exactly", () => {
    const snapshot = solvedSnapshot();
    snapshot.F[0][1] = "R";
    snapshot.R[0][1] = "F";

    const analysis = new CubeAnalyzer().analyzeState(snapshot);

    expect(analysis.phase).toBe("pll");
    expect(analysis.ollCase).toBeNull();
  });
});
