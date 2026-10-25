import { describe, expect, it } from "vitest";
import { resolveGo } from "./go";

const resources = {
  free: { id: "free", url: "https://example.org/free", level: "B2" as const, cost: "free", affiliate: false },
  aff: {
    id: "aff",
    url: "https://shop.example/book",
    level: "I1" as const,
    cost: "paid",
    affiliate: true,
    affiliate_url: "https://shop.example/book?tag=xplaind-21",
  },
};
const stops = { s1: { id: "s1", level: "B1" as const, primary_resource: "free", alternates: [] } };
const lookup = {
  resource: (id: string) => resources[id as keyof typeof resources],
  stop: (id: string) => stops[id as keyof typeof stops],
};

describe("resolveGo (RM-5, SC-4)", () => {
  it("refuses an unknown id, so there is never an open redirect", () => {
    expect(resolveGo("https://evil.example", null, lookup)).toEqual({ found: false });
    expect(resolveGo("nope", "s1", lookup)).toEqual({ found: false });
  });

  it("redirects to the content file's URL and logs no personal data", () => {
    const go = resolveGo("free", "s1", lookup);
    expect(go).toEqual({
      found: true,
      url: "https://example.org/free",
      click: { resource_id: "free", stop_id: "s1", level: "B1", cost: "free", affiliate: false },
    });
    if (go.found) expect(Object.keys(go.click).sort()).toEqual(["affiliate", "cost", "level", "resource_id", "stop_id"]);
  });

  it("adds the affiliate tag only for an affiliate resource", () => {
    const go = resolveGo("aff", null, lookup);
    expect(go.found && go.url).toBe("https://shop.example/book?tag=xplaind-21");
    expect(go.found && go.click.affiliate).toBe(true);
  });

  it("ignores a stop that does not list the resource, and falls back to the resource level", () => {
    expect(resolveGo("aff", "s1", lookup)).toMatchObject({ click: { stop_id: null, level: "I1" } });
    expect(resolveGo("free", "no-such-stop", lookup)).toMatchObject({ click: { stop_id: null, level: "B2" } });
  });
});
