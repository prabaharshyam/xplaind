import { describe, expect, it } from "vitest";
import { choose, clock, idle, lastDays, lengthOf, next, pause, remaining, reset, running, start } from "./focus";

describe("FC-1 focus timer", () => {
  it("starts, pauses with what is left, and resumes from there", () => {
    const s = start(idle(), 1_000);
    expect(running(s)).toBe(true);
    expect(remaining(s, 1_000 + 60_000)).toBe(24 * 60_000);
    const p = pause(s, 1_000 + 60_000);
    expect(running(p)).toBe(false);
    expect(remaining(p, 999_999_999)).toBe(24 * 60_000);
    expect(remaining(start(p, 5_000), 5_000 + 30_000)).toBe(24 * 60_000 - 30_000);
    expect(remaining(s, 1_000 + 26 * 60_000)).toBe(0); // never below zero
  });

  it("logs a focus block that ran to its end, not a skipped one or a break, and waits for Start", () => {
    const done = next(idle(), {}, "2026-11-27", true);
    expect(done.state).toMatchObject({ phase: "rest", endsAt: null, left: lengthOf("25", "rest") });
    expect(done.log).toEqual({ "2026-11-27": { sessions: 1, minutes: 25 } });
    const twice = next(choose("50"), done.log, "2026-11-27", true);
    expect(twice.log["2026-11-27"]).toEqual({ sessions: 2, minutes: 75 });
    expect(next(idle(), {}, "2026-11-27", false).log).toEqual({});
    expect(next(done.state, done.log, "2026-11-27", true).log).toEqual(done.log);
    expect(next(done.state, {}, "2026-11-27", true).state.phase).toBe("focus");
  });

  it("resets to a fresh focus block of the chosen length, and shows minutes and seconds", () => {
    expect(reset(start(choose("50"), 0))).toEqual(idle("50"));
    expect(clock(25 * 60_000)).toBe("25:00");
    expect(clock(61_500)).toBe("1:02");
    expect(clock(0)).toBe("0:00");
  });

  it("lists the last seven days, oldest first, across a month end", () => {
    const days = lastDays({ "2026-11-30": { sessions: 1, minutes: 25 }, "2026-12-02": { sessions: 2, minutes: 50 } }, "2026-12-02");
    expect(days.map((d) => d.day)).toEqual(["2026-11-26", "2026-11-27", "2026-11-28", "2026-11-29", "2026-11-30", "2026-12-01", "2026-12-02"]);
    expect(days.map((d) => d.minutes)).toEqual([0, 0, 0, 0, 25, 0, 50]);
  });
});
