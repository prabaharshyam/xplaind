import path from "node:path";
import { describe, expect, it } from "vitest";
import { getContent, getPaths } from "./index";
import { getInterviewViews } from "./interview";
import { loadContent } from "./load";
import { isHumanName } from "./review";

describe("the interview bank as the site sees it", () => {
  it("IQ-6: holds no question until a person has signed it off", () => {
    expect(getContent().interview.every((q) => isHumanName(q.data.reviewed_by))).toBe(true);
    const onDisk = loadContent(path.join(process.cwd(), "content")).bundle.interview;
    const drafts = onDisk.filter((q) => !isHumanName(q.data.reviewed_by)).length;
    expect(getContent().interview).toHaveLength(onDisk.length - drafts);
  });

  it("PREP-2: a question asked in every role's interview belongs to every roadmap", () => {
    const everyRole = new Set(getContent().interview.filter((q) => q.data.all_roles).map((q) => q.data.id));
    for (const q of getInterviewViews().filter((v) => everyRole.has(v.id))) expect(q.paths, q.id).toHaveLength(getPaths().length);
  });
});
