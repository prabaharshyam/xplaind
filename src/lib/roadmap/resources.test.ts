import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { orderResources } from "./resources";

const r = (id: string, cost: "free" | "free_cert_paid" | "paid") => ({ id, cost });

describe("orderResources (RM-2, RM-9)", () => {
  const list = [r("paid-primary", "paid"), r("free-alt", "free"), r("cert-alt", "free_cert_paid")];

  it("keeps the editor's order by default", () => {
    expect(orderResources(list, { freeOnly: false }).map((x) => x.id)).toEqual(["paid-primary", "free-alt", "cert-alt"]);
  });

  it("with Free only, moves paid resources below the free ones so they are never primary", () => {
    expect(orderResources(list, { freeOnly: true }).map((x) => x.id)).toEqual(["free-alt", "cert-alt", "paid-primary"]);
  });

  it("keeps an all-paid list as it is", () => {
    const paid = [r("a", "paid"), r("b", "paid")];
    expect(orderResources(paid, { freeOnly: true }).map((x) => x.id)).toEqual(["a", "b"]);
  });

  it("does not change the input", () => {
    const copy = [...list];
    orderResources(list, { freeOnly: true });
    expect(list).toEqual(copy);
  });
});

describe("ranking ignores affiliate and commission fields (ED-2)", () => {
  // Keep this test. Any function that picks or orders resources or stops lives in
  // one of these files, and none of them may read those fields.
  const RANKING_FILES = ["resources.ts", "next-steps.ts", "progress.ts"];

  for (const file of RANKING_FILES) {
    it(`${file} never mentions affiliate or commission`, () => {
      const text = fs.readFileSync(path.join(__dirname, file), "utf8");
      const code = text.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
      expect(code).not.toMatch(/affiliate|commission/i);
    });
  }

  it("orders identically whatever the affiliate flag says, and never reads it", () => {
    const trap = (id: string, cost: "free" | "paid") =>
      Object.defineProperty({ id, cost }, "affiliate", {
        get() {
          throw new Error("ranking read the affiliate field");
        },
        enumerable: true,
      });
    const list = [trap("a", "paid"), trap("b", "free")];
    expect(orderResources(list, { freeOnly: false }).map((x) => x.id)).toEqual(["a", "b"]);
    expect(orderResources(list, { freeOnly: true }).map((x) => x.id)).toEqual(["b", "a"]);
  });
});

describe("roadmap module purity", () => {
  const sources = fs.readdirSync(__dirname).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));
  for (const file of sources) {
    it(`${file} imports only the level and date helpers and its own files`, () => {
      const text = fs.readFileSync(path.join(__dirname, file), "utf8");
      const imports = [...text.matchAll(/^import\s+(type\s+)?[^;]*?from\s+"([^"]+)"/gm)].filter((m) => !m[1]).map((m) => m[2]);
      expect(imports.filter((s) => !/^(\.\/|@\/lib\/levels$|@\/lib\/dates$)/.test(s))).toEqual([]);
    });
  }
});
