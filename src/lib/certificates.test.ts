import { describe, expect, it } from "vitest";
import { certificateId, type DoneHow, eligibility, linkedInAddUrl, normaliseHandle } from "./certificates";

const lessons = ["a", "b", "c", "d", "e"];
const all = (how: DoneHow) => new Map(lessons.map((id) => [id, how]));

describe("CT-1 eligibility", () => {
  it("needs every lesson, 80% verified and a passed project", () => {
    expect(eligibility(lessons, all("check"), new Set(["p1"]), ["p1", "p2"]).ok).toBe(true);
  });
  it("fails when a lesson is missing", () => {
    const done = all("check");
    done.delete("e");
    const e = eligibility(lessons, done, new Set(["p1"]), ["p1"]);
    expect(e.ok).toBe(false);
    expect(e.lessonsDone).toBe(4);
  });
  it("fails when too few lessons were verified", () => {
    const done = all("self_marked");
    done.set("a", "check").set("b", "project").set("c", "check");
    const e = eligibility(lessons, done, new Set(["p1"]), ["p1"]);
    expect(e.verified).toBe(3);
    expect(e.verifiedNeeded).toBe(4);
    expect(e.ok).toBe(false);
    done.set("d", "check");
    expect(eligibility(lessons, done, new Set(["p1"]), ["p1"]).ok).toBe(true);
  });
  it("needs a project of the role, or any project when the role has none", () => {
    expect(eligibility(lessons, all("check"), new Set(["other"]), ["p1"]).ok).toBe(false);
    expect(eligibility(lessons, all("check"), new Set(["other"]), []).ok).toBe(true);
    expect(eligibility(lessons, all("check"), new Set(), []).ok).toBe(false);
  });
  it("never passes an empty roadmap", () => {
    expect(eligibility([], new Map(), new Set(["p1"]), []).ok).toBe(false);
  });
});

describe("certificate helpers", () => {
  it("makes a 10-character id without look-alikes", () => {
    const id = certificateId(new Uint8Array(16).map((_, i) => i * 37));
    expect(id).toMatch(/^[a-z0-9]{10}$/);
    expect(id).not.toMatch(/[ilo01]/);
  });
  it("normalises handles", () => {
    expect(normaliseHandle("  Shyam-K ")).toBe("shyam-k");
    expect(normaliseHandle("ab")).toBeNull();
    expect(normaliseHandle("-abc")).toBeNull();
    expect(normaliseHandle("a b c")).toBeNull();
    expect(normaliseHandle(42)).toBeNull();
  });
  it("fills in LinkedIn's add-certification link", () => {
    const url = new URL(linkedInAddUrl({ title: "AI Engineer", issuedAt: new Date("2026-11-14T00:00:00Z"), url: "https://xplaind.in/certificate/abc", id: "abc" }));
    expect(url.hostname).toBe("www.linkedin.com");
    expect(url.searchParams.get("name")).toBe("AI Engineer");
    expect(url.searchParams.get("issueMonth")).toBe("11");
    expect(url.searchParams.get("certUrl")).toBe("https://xplaind.in/certificate/abc");
  });
});
