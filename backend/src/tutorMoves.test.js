import { describe, expect, it } from "vitest";

import { parseMoveFromTutorText } from "./tutorMoves.js";

describe("parseMoveFromTutorText", () => {
  it("keeps prime notation instead of the bare face letter", () => {
    expect(parseMoveFromTutorText("Now do R', turn the right face counterclockwise.")).toBe("R'");
    expect(parseMoveFromTutorText("Do U prime next.")).toBe("U'");
  });

  it("keeps double turns", () => {
    expect(parseMoveFromTutorText("Do U2, a double turn of the top face.")).toBe("U2");
    expect(parseMoveFromTutorText("Turn F twice.")).toBe("F2");
  });

  it("reads a plain clockwise face when no modifier is attached", () => {
    expect(parseMoveFromTutorText("Do R, turn the right face clockwise.")).toBe("R");
  });

  it("returns null when the text has no move", () => {
    expect(parseMoveFromTutorText("Look at the whole cube first.")).toBeNull();
    expect(parseMoveFromTutorText("")).toBeNull();
  });
});
