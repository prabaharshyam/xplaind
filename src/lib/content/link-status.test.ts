import { describe, expect, it } from "vitest";
import { parseLinkStatus } from "./link-status";

describe("parseLinkStatus (RM-4, ED-5)", () => {
  it("reads results by resource id", () => {
    const raw = { results: { cs50p: { status: "ok", checked_on: "2026-10-20" } } };
    expect(parseLinkStatus(raw)).toEqual({ cs50p: { status: "ok", checked_on: "2026-10-20" } });
  });

  it("treats a missing or malformed file as no checks yet", () => {
    expect(parseLinkStatus(undefined)).toEqual({});
    expect(parseLinkStatus({ results: { x: { status: "fine", checked_on: "yesterday" } } })).toEqual({});
  });
});
