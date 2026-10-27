import { describe, expect, it } from "vitest";
import { parseProgress } from "./progress-store";

describe("parseProgress: stage projects", () => {
  it("keeps valid project records and drops the rest", () => {
    const raw = JSON.stringify({
      version: 1,
      stops: {},
      freeOnly: false,
      projects: {
        "fde/foundations": { status: "done", url: "https://github.com/a/b", updatedOn: "2026-10-27" },
        "fde/rag": { status: "building", updatedOn: "2026-10-27" },
        "fde/bad": { status: "finished", updatedOn: "2026-10-27" },
        "fde/nodate": { status: "done" },
      },
    });
    expect(parseProgress(raw).projects).toEqual({
      "fde/foundations": { status: "done", url: "https://github.com/a/b", updatedOn: "2026-10-27" },
      "fde/rag": { status: "building", updatedOn: "2026-10-27" },
    });
  });

  it("has no projects field when none are saved", () => {
    expect(parseProgress(JSON.stringify({ version: 1, stops: {}, freeOnly: false }))).not.toHaveProperty("projects");
  });
});
