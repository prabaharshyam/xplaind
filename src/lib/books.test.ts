import { describe, expect, it } from "vitest";
import { amazonLink } from "./books";

describe("amazonLink (BK-2)", () => {
  const url = "https://www.amazon.in/s?k=AI+Engineering+Chip+Huyen&i=stripbooks";

  it("adds a valid Associates tag", () => {
    const out = new URL(amazonLink(url, "xplaind-21"));
    expect(out.searchParams.get("tag")).toBe("xplaind-21");
    expect(out.searchParams.get("k")).toBe("AI Engineering Chip Huyen");
  });

  it("leaves the link alone when no tag is set or the tag looks wrong", () => {
    expect(amazonLink(url, undefined)).toBe(url);
    expect(amazonLink(url, "")).toBe(url);
    expect(amazonLink(url, "evil&x=1")).toBe(url);
  });

  it("never tags a link to another site", () => {
    const other = "https://example.com/book";
    expect(amazonLink(other, "xplaind-21")).toBe(other);
  });
});
