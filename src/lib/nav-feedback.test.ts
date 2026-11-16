import { describe, expect, it } from "vitest";
import { isPageChangeLink } from "./nav-feedback";

const here = { href: "https://xplaind.in/stop/what-is-ai", origin: "https://xplaind.in", pathname: "/stop/what-is-ai", search: "" };

describe("UX-7: which links start a page change", () => {
  it("counts a link to another page of this site, including a language switch", () => {
    expect(isPageChangeLink({ href: "https://xplaind.in/stop/what-is-ai/ta" }, here)).toBe(true);
    expect(isPageChangeLink({ href: "/roadmap/ai-engineer" }, here)).toBe(true);
    expect(isPageChangeLink({ href: "/stop/what-is-ai?tab=practice" }, here)).toBe(true);
  });

  it("ignores the same page, a #anchor on it, and missing links", () => {
    expect(isPageChangeLink({ href: "https://xplaind.in/stop/what-is-ai" }, here)).toBe(false);
    expect(isPageChangeLink({ href: "https://xplaind.in/stop/what-is-ai#practice" }, here)).toBe(false);
    expect(isPageChangeLink(null, here)).toBe(false);
    expect(isPageChangeLink({ href: "" }, here)).toBe(false);
  });

  it("ignores other sites, new tabs, downloads and the redirect and API paths", () => {
    expect(isPageChangeLink({ href: "https://example.com/x" }, here)).toBe(false);
    expect(isPageChangeLink({ href: "/roadmap/x", target: "_blank" }, here)).toBe(false);
    expect(isPageChangeLink({ href: "/file.pdf", hasAttribute: (n) => n === "download" }, here)).toBe(false);
    expect(isPageChangeLink({ href: "/go/some-course" }, here)).toBe(false);
    expect(isPageChangeLink({ href: "/api/billing/receipt" }, here)).toBe(false);
  });

  it("does not throw on a malformed address", () => {
    expect(isPageChangeLink({ href: "http://[bad" }, here)).toBe(false);
  });
});
