import { describe, expect, it } from "vitest";
import { type DirectoryItem, EMPTY_FILTER, filterDirectory } from "./directory";

const item = (o: Partial<DirectoryItem>): DirectoryItem => ({
  id: "x",
  title: "Course",
  provider: "Provider",
  type: "course",
  level: "B1",
  cost: "free",
  hours: 2,
  certificate: false,
  editorScore: 4,
  paths: ["genai-engineer"],
  themes: ["llm"],
  ...o,
});

describe("filterDirectory (RM-2)", () => {
  const list = [
    item({ id: "a", title: "Prompting basics", level: "I1", provider: "DeepLearning.AI" }),
    item({ id: "b", title: "AI for everyone", level: "B1", certificate: true, paths: ["ai-for-beginners"] }),
    item({ id: "c", title: "Agents course", level: "I1", editorScore: 4.5, type: "repo" }),
    item({ id: "d", title: "Paid course", level: "I1", editorScore: 4.5, cost: "paid" }),
  ];

  it("orders easiest first, then by editor score, free before paid", () => {
    expect(filterDirectory(list, EMPTY_FILTER).map((i) => i.id)).toEqual(["b", "c", "d", "a"]);
  });

  it("filters by path, band, type and certificate", () => {
    expect(filterDirectory(list, { ...EMPTY_FILTER, pathId: "ai-for-beginners" }).map((i) => i.id)).toEqual(["b"]);
    expect(filterDirectory(list, { ...EMPTY_FILTER, band: "I" }).map((i) => i.id)).toEqual(["c", "d", "a"]);
    expect(filterDirectory(list, { ...EMPTY_FILTER, type: "repo" }).map((i) => i.id)).toEqual(["c"]);
    expect(filterDirectory(list, { ...EMPTY_FILTER, certificateOnly: true }).map((i) => i.id)).toEqual(["b"]);
    expect(filterDirectory([...list, item({ id: "e", themes: ["agents"] })], { ...EMPTY_FILTER, theme: "agents" }).map((i) => i.id)).toEqual(["e"]);
  });

  it("searches title and provider, every word, ignoring case", () => {
    expect(filterDirectory(list, { ...EMPTY_FILTER, query: "deeplearning PROMPT" }).map((i) => i.id)).toEqual(["a"]);
    expect(filterDirectory(list, { ...EMPTY_FILTER, query: "nothing here" })).toEqual([]);
  });
});
