import { afterEach, describe, expect, it, vi } from "vitest";

import { startMovePlayback } from "./solvePlayback.js";

describe("startMovePlayback", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("applies each move once and then completes", () => {
    vi.useFakeTimers();
    const applied = [];
    let completed = 0;

    startMovePlayback({
      moves: ["R", "U"],
      intervalMs: 1000,
      onMove: (move) => applied.push(move),
      onComplete: () => {
        completed += 1;
      }
    });

    vi.advanceTimersByTime(1000);
    expect(applied).toEqual(["R"]);
    vi.advanceTimersByTime(1000);
    expect(applied).toEqual(["R", "U"]);
    vi.advanceTimersByTime(1000);
    expect(completed).toBe(1);
  });

  it("does not keep playing after stop", () => {
    vi.useFakeTimers();
    const applied = [];
    const stop = startMovePlayback({
      moves: ["R", "U", "F"],
      intervalMs: 1000,
      onMove: (move) => applied.push(move)
    });

    vi.advanceTimersByTime(1000);
    stop();
    vi.advanceTimersByTime(5000);
    expect(applied).toEqual(["R"]);
  });

  it("stops when the caller marks the session closed", () => {
    vi.useFakeTimers();
    let closed = false;
    const applied = [];

    startMovePlayback({
      moves: ["R", "U"],
      intervalMs: 1000,
      isStopped: () => closed,
      onMove: (move) => applied.push(move),
      onComplete: () => applied.push("done")
    });

    closed = true;
    vi.advanceTimersByTime(3000);
    expect(applied).toEqual([]);
  });
});
