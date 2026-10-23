import { describe, expect, it } from "vitest";

import { parseCommand } from "./useVoiceCommands";

describe("parseCommand", () => {
  it("keeps prime and double modifiers instead of the shorter face phrase", () => {
    expect(parseCommand("up prime")).toBe("U'");
    expect(parseCommand("turn up prime")).toBe("U'");
    expect(parseCommand("right prime")).toBe("R'");
    expect(parseCommand("up twice")).toBe("U2");
    expect(parseCommand("turn right twice")).toBe("R2");
  });

  it("still recognizes plain moves and control commands", () => {
    expect(parseCommand("up")).toBe("U");
    expect(parseCommand("please scramble the cube")).toBe("SCRAMBLE");
    expect(parseCommand("r prime")).toBe("R'");
  });
});