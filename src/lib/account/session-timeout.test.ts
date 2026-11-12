import { describe, expect, it } from "vitest";
import { IDLE_MS, MAX_MS, sessionExpiry, signedInAtFromClaims, toMs } from "./session-timeout";

const now = Date.parse("2026-11-12T10:00:00Z");

describe("session timeout (AC-13)", () => {
  it("keeps a session that is recent and active", () => {
    expect(sessionExpiry({ now, signedInAt: now - 2 * 86400000, lastSeen: now - 3600000 })).toBeNull();
  });

  it("ends a session after 7 days without a visit", () => {
    expect(sessionExpiry({ now, signedInAt: now - 10 * 86400000, lastSeen: now - IDLE_MS - 1 })).toBe("idle");
  });

  it("ends a session 30 days after sign-in even with daily use", () => {
    expect(sessionExpiry({ now, signedInAt: now - MAX_MS - 1, lastSeen: now - 60000 })).toBe("max");
  });

  it("never ends a session on unknown times", () => {
    expect(sessionExpiry({ now, signedInAt: null, lastSeen: null })).toBeNull();
  });

  it("reads sign-in time from token claims and times from cookies", () => {
    expect(signedInAtFromClaims({ amr: [{ method: "oauth", timestamp: 1700000000 }, { method: "otp", timestamp: 1700000500 }] })).toBe(1700000000000);
    expect(signedInAtFromClaims({})).toBeNull();
    expect(toMs("1700000000000")).toBe(1700000000000);
    expect(toMs("2026-11-01T00:00:00Z")).toBe(Date.parse("2026-11-01T00:00:00Z"));
    expect(toMs("junk")).toBeNull();
  });
});
