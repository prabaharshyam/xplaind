import { describe, expect, it } from "vitest";
import { isStaleDeployError, shouldReload } from "./chunk-error";

describe("stale-deploy errors (UX-1)", () => {
  it("recognises missing code files from an older deploy", () => {
    const e = new Error("Loading chunk 123 failed.");
    e.name = "ChunkLoadError";
    expect(isStaleDeployError(e)).toBe(true);
    expect(isStaleDeployError(new TypeError("Failed to fetch dynamically imported module: https://xplaind.in/_next/x.js"))).toBe(true);
    expect(isStaleDeployError("Loading CSS chunk 7 failed")).toBe(true);
  });

  it("leaves real errors alone", () => {
    expect(isStaleDeployError(new Error("Cannot read properties of undefined"))).toBe(false);
    expect(isStaleDeployError(null)).toBe(false);
  });

  it("reloads at most once a minute", () => {
    expect(shouldReload(100_000, null)).toBe(true);
    expect(shouldReload(100_000, "90000")).toBe(false);
    expect(shouldReload(200_000, "90000")).toBe(true);
  });
});
