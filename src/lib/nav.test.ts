import { describe, expect, it } from "vitest";
import { NAV_GROUPS, activeGroup, activeTab, tabBarHidden } from "./nav";

describe("activeGroup (NV-2)", () => {
  it("marks the section a page belongs to", () => {
    expect(activeGroup("/paths")).toBe("learn");
    expect(activeGroup("/roadmap/ai-engineer")).toBe("learn");
    expect(activeGroup("/stop/rag-app")).toBe("learn");
    expect(activeGroup("/library")).toBe("learn");
    expect(activeGroup("/interview/simulator")).toBe("interview");
    expect(activeGroup("/interview/rag-basics")).toBe("interview");
    expect(activeGroup("/interview/patterns/rag-pipeline")).toBe("interview");
    expect(activeGroup("/practice/rag")).toBe("interview"); // IP-6
    expect(activeGroup("/jobs")).toBe("career");
    expect(activeGroup("/ai/resume")).toBe("career");
    expect(activeGroup("/ai")).toBe("ai");
    expect(activeGroup("/ai/tutor")).toBe("ai");
    expect(activeGroup("/papers")).toBe("learn");
    expect(activeGroup("/plan")).toBe("learn"); // NV-10
    expect(activeGroup("/playground")).toBe("ai"); // NV-10
  });

  it("marks nothing on pages outside the menu, and does not match on a shared prefix", () => {
    expect(activeGroup("/")).toBeNull();
    expect(activeGroup("/about")).toBeNull();
    expect(activeGroup("/planets")).toBeNull();
  });

  it("lists every link once", () => {
    const hrefs = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href));
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

describe("menu structure (LY-2, IP-4, NV-8)", () => {
  const items = (id: string) => NAV_GROUPS.find((g) => g.id === id)!.items.map((i) => i.href);

  it("has no separate Topics entry: Library covers it", () => {
    expect(NAV_GROUPS.flatMap((g) => g.items).some((i) => i.href === "/topics")).toBe(false);
    expect(items("learn")).toContain("/library");
  });

  it("has three Interview entries: mock interview, prep plan and questions (IP-6)", () => {
    expect(items("interview")).toEqual(["/interview/simulator", "/interview/prep", "/interview"]);
    expect(NAV_GROUPS.flatMap((g) => g.items).some((i) => i.href === "/practice")).toBe(false); // flashcards live inside Questions
  });

  it("has four groups: Learn, Interview, Career and AI Studio (NV-10)", () => {
    expect(NAV_GROUPS.map((g) => g.id)).toEqual(["learn", "interview", "career", "ai"]);
    expect(items("learn")).toContain("/plan");
    expect(items("ai")).toContain("/playground");
  });

  it("does not call the pricing link Pro, which read as being subscribed", async () => {
    const { PRO_LINK } = await import("./nav");
    expect(PRO_LINK.label).not.toMatch(/^pro$/i);
    expect(PRO_LINK.title).not.toMatch(/^pro$/i);
  });
});

describe("Pro has its own place (NV-7)", () => {
  it("keeps the pricing page out of every menu group and names the AI group AI Studio", async () => {
    const { NAV_GROUPS, PRO_LINK } = await import("./nav");
    expect(NAV_GROUPS.flatMap((g) => g.items).some((i) => i.href === "/pricing")).toBe(false);
    expect(PRO_LINK.href).toBe("/pricing");
    expect(NAV_GROUPS.find((g) => g.id === "ai")?.label).toBe("AI Studio");
  });
});

describe("the phone tab bar (NV-11)", () => {
  it("marks the tab a page belongs to", () => {
    expect(activeTab("/dashboard")).toBe("today");
    expect(activeTab("/roadmap/ai-engineer")).toBe("learn");
    expect(activeTab("/plan")).toBe("learn");
    expect(activeTab("/interview/prep")).toBe("interview");
    expect(activeTab("/practice/rag")).toBe("interview");
    expect(activeTab("/playground")).toBe("ai");
    expect(activeTab("/jobs")).toBeNull();
    expect(activeTab("/")).toBeNull();
  });

  it("stays out of the way where a page has its own bar at the bottom", () => {
    expect(tabBarHidden("/stop/rag-app")).toBe(true);
    expect(tabBarHidden("/stop/rag-app/ta")).toBe(true);
    expect(tabBarHidden("/interview/simulator")).toBe(true);
    expect(tabBarHidden("/interview")).toBe(false);
    expect(tabBarHidden("/stopwatch")).toBe(false);
  });
});
