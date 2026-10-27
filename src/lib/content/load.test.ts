import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadContent } from "./load";
import { validateBundle } from "./validate";
import { todayInIST } from "@/lib/dates";
import { TODAY } from "./testing";

const dirs: string[] = [];
const REAL_LEVELS = fs.readFileSync(path.resolve(__dirname, "../../../content/levels/levels.yaml"), "utf8");

function tmp(files: Record<string, string>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "xplaind-content-"));
  dirs.push(root);
  for (const [rel, text] of Object.entries({ "levels/levels.yaml": REAL_LEVELS, ...files })) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, text);
  }
  return root;
}
afterEach(() => {
  while (dirs.length) fs.rmSync(dirs.pop()!, { recursive: true, force: true });
});

const RESOURCE = `id: res-one
title: A course
provider: Someone
url: https://example.org/course
type: course
level: B1
cost: free
hours: 2
certificate: false
editor_score: 4
why_picked: Good.
last_verified: 2026-10-20
verified_by: Asha Rao
tags: []
`;

const STOP = (extra = "") => `---
id: s-one
level: B1
theme: ai-basics
title: One
outcome: Do it.
why_it_matters: Because.
hours: 2
gap_tags: [ai-basics]
primary_resource: res-one
alternates: []
check:
  type: project
  brief: Build it.
drafted_with_ai: false
reviewed_by: Asha Rao
reviewed_on: 2026-10-20
${extra}---

Body text.
`;

const messagesFor = (root: string) => loadContent(root).issues.map((i) => `${i.file}: ${i.message}`);

describe("loadContent", () => {
  it("loads a valid resource and stop and keeps the lesson body", () => {
    const root = tmp({ "resources/res-one.yaml": RESOURCE, "stops/B1/s-one.mdx": STOP() });
    const { bundle, issues } = loadContent(root);
    expect(issues).toEqual([]);
    expect(bundle.stops[0].data.body).toBe("Body text.");
    expect(bundle.resources[0].data.language).toBe("en"); // default applied
  });

  it("reports a missing content folder", () => {
    expect(messagesFor(path.join(os.tmpdir(), "does-not-exist-xplaind"))[0]).toContain("not found");
  });

  it("reports YAML that cannot be read", () => {
    const root = tmp({ "resources/res-one.yaml": "id: [unclosed" });
    expect(messagesFor(root)[0]).toMatch(/YAML could not be read/);
  });

  it("reports duplicate YAML keys", () => {
    const root = tmp({ "resources/res-one.yaml": `${RESOURCE}hours: 3\n` });
    expect(messagesFor(root)[0]).toMatch(/YAML could not be read/);
  });

  it("reports a resource missing last_verified (ED-4)", () => {
    const root = tmp({ "resources/res-one.yaml": RESOURCE.replace(/last_verified: .*\n/, "") });
    expect(messagesFor(root).join()).toMatch(/last_verified/);
  });

  it("reports a file whose id does not match its name", () => {
    const root = tmp({ "resources/other-name.yaml": RESOURCE });
    expect(messagesFor(root)[0]).toMatch(/must match the file name/);
  });

  it("reports an unexpected file type", () => {
    const root = tmp({ "resources/notes.txt": "hi", "stops/B1/lesson.md": "hi" });
    expect(messagesFor(root).filter((m) => /unexpected file type/.test(m))).toHaveLength(2);
  });

  it("reports an mdx file with no frontmatter", () => {
    const root = tmp({ "stops/B1/s-one.mdx": "Just text, no block." });
    expect(messagesFor(root)[0]).toMatch(/no frontmatter/);
  });

  it("reports a stop filed under the wrong level folder", () => {
    const root = tmp({ "resources/res-one.yaml": RESOURCE, "stops/B2/s-one.mdx": STOP() });
    expect(messagesFor(root).join()).toMatch(/belongs at stops\/B1\/s-one\.mdx/);
  });

  it("reports a stop with an unknown frontmatter field", () => {
    const root = tmp({ "stops/B1/s-one.mdx": STOP("sponsored: true\n") });
    expect(messagesFor(root).join()).toMatch(/Unrecognized key/);
  });

  it("feeds the cross-file checks: a dangling resource reference fails", () => {
    const root = tmp({ "stops/B1/s-one.mdx": STOP() });
    const { bundle, issues } = loadContent(root);
    expect(issues).toEqual([]);
    const errors = validateBundle(bundle, { today: TODAY }).filter((i) => i.severity === "error");
    expect(errors.map((e) => e.message).join()).toMatch(/resource "res-one" does not exist/);
  });
});

describe("the real content/ folder", () => {
  it("loads and validates with no errors", () => {
    const { bundle, issues } = loadContent(path.resolve(__dirname, "../../../content"));
    expect(issues).toEqual([]);
    // Real content is checked against today in India, as the build does.
    const errors = validateBundle(bundle, { today: todayInIST() }).filter((i) => i.severity === "error");
    expect(errors).toEqual([]);
    expect(bundle.levels).toHaveLength(9);
  });
});
