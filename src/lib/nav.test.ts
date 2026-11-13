import { describe, expect, it } from "vitest";
import { NAV_GROUPS, activeGroup } from "./nav";

describe("activeGroup (NV-2)", () => {
  it("marks the section a page belongs to", () => {
    expect(activeGroup("/paths")).toBe("learn");
    expect(activeGroup("/roadmap/ai-engineer")).toBe("learn");
    expect(activeGroup("/stop/rag-app")).toBe("learn");
    expect(activeGroup("/library")).toBe("learn");
    expect(activeGroup("/interview/simulator")).toBe("interview");
    expect(activeGroup("/interview/rag-basics")).toBe("interview");
    expect(activeGroup("/interview/patterns/rag-pipeline")).toBe("interview");
    expect(activeGroup("/practice/rag")).toBe("practice");
    expect(activeGroup("/jobs")).toBe("career");
    expect(activeGroup("/ai/resume")).toBe("career");
    expect(activeGroup("/ai")).toBe("ai");
    expect(activeGroup("/ai/tutor")).toBe("ai");
    expect(activeGroup("/papers")).toBe("learn");
    expect(activeGroup("/plan")).toBe("practice");
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

describe("Pro has its own place (NV-7)", () => {
  it("keeps the pricing page out of every menu group and names the AI group AI Studio", async () => {
    const { NAV_GROUPS, PRO_LINK } = await import("./nav");
    expect(NAV_GROUPS.flatMap((g) => g.items).some((i) => i.href === "/pricing")).toBe(false);
    expect(PRO_LINK.href).toBe("/pricing");
    expect(NAV_GROUPS.find((g) => g.id === "ai")?.label).toBe("AI Studio");
  });
});
