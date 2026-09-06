import { getAppBasename } from "./appBase.js";

describe("getAppBasename", () => {
  it("returns Vite BASE_URL without a trailing slash for subdirectory hosts", () => {
    expect(getAppBasename()).toBe(import.meta.env.BASE_URL.replace(/\/+$/, "") || "/");
  });
});
