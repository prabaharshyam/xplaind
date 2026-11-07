import { describe, expect, it } from "vitest";
import { ALL, EMPTY_VIDEO_FILTER, type VideoRow, filterVideos, formatMinutes, formatViews, lengthBand, topicCounts } from "./browse";

const row = (o: Partial<VideoRow> & { id: string }): VideoRow => ({
  title: o.id,
  channel: "Chan",
  topics: ["llm"],
  level: "B1",
  minutes: 10,
  views: 100,
  lesson: null,
  ...o,
});

const rows = [
  row({ id: "a", title: "Attention explained", topics: ["llm", "ml"], level: "I1", minutes: 8, views: 5000, channel: "3Blue1Brown" }),
  row({ id: "b", title: "RAG in an hour", topics: ["retrieval"], level: "I2", minutes: 60, views: 900_000 }),
  row({ id: "c", title: "Git basics", topics: ["software-engineering"], level: "B3", minutes: 25, views: null }),
  row({ id: "d", title: "From a channel", topics: ["llm"], level: null, minutes: 12, views: 70 }),
];

describe("filterVideos (VD-1)", () => {
  it("sorts by views by default, most first, and puts unknown counts last", () => {
    expect(filterVideos(rows, EMPTY_VIDEO_FILTER).map((r) => r.id)).toEqual(["b", "a", "d", "c"]);
  });

  it("filters by topic, including a video that has several", () => {
    expect(filterVideos(rows, { ...EMPTY_VIDEO_FILTER, topic: "ml" }).map((r) => r.id)).toEqual(["a"]);
    expect(filterVideos(rows, { ...EMPTY_VIDEO_FILTER, topic: "llm" }).map((r) => r.id)).toEqual(["a", "d"]);
  });

  it("filters by level band and leaves out videos with no level", () => {
    expect(filterVideos(rows, { ...EMPTY_VIDEO_FILTER, band: "I" }).map((r) => r.id)).toEqual(["b", "a"]);
    expect(filterVideos(rows, { ...EMPTY_VIDEO_FILTER, band: "B" }).map((r) => r.id)).toEqual(["c"]);
  });

  it("filters by length", () => {
    expect(lengthBand(9)).toBe("short");
    expect(lengthBand(10)).toBe("medium");
    expect(lengthBand(30)).toBe("medium");
    expect(lengthBand(31)).toBe("long");
    expect(filterVideos(rows, { ...EMPTY_VIDEO_FILTER, length: "long" }).map((r) => r.id)).toEqual(["b"]);
    expect(filterVideos(rows, { ...EMPTY_VIDEO_FILTER, length: "short" }).map((r) => r.id)).toEqual(["a"]);
  });

  it("searches title, channel and lesson, ignoring case and accents", () => {
    expect(filterVideos(rows, { ...EMPTY_VIDEO_FILTER, query: "3blue" }).map((r) => r.id)).toEqual(["a"]);
    expect(filterVideos(rows, { ...EMPTY_VIDEO_FILTER, query: "ATTENTION expl" }).map((r) => r.id)).toEqual(["a"]);
    const withLesson = [row({ id: "z", lesson: { id: "embeddings", title: "Embeddings" } })];
    expect(filterVideos(withLesson, { ...EMPTY_VIDEO_FILTER, query: "embedd" })).toHaveLength(1);
    expect(filterVideos(rows, { ...EMPTY_VIDEO_FILTER, query: "zzz" })).toEqual([]);
  });

  it("sorts shortest, longest and easiest first", () => {
    expect(filterVideos(rows, { ...EMPTY_VIDEO_FILTER, sort: "short" }).map((r) => r.id)).toEqual(["a", "d", "c", "b"]);
    expect(filterVideos(rows, { ...EMPTY_VIDEO_FILTER, sort: "long" }).map((r) => r.id)).toEqual(["b", "c", "d", "a"]);
    expect(filterVideos(rows, { ...EMPTY_VIDEO_FILTER, sort: "level" }).map((r) => r.id)).toEqual(["c", "a", "b", "d"]);
  });

  it("does not change the list it is given", () => {
    const copy = [...rows];
    filterVideos(rows, { ...EMPTY_VIDEO_FILTER, sort: "short" });
    expect(rows).toEqual(copy);
    expect(EMPTY_VIDEO_FILTER.topic).toBe(ALL);
  });
});

describe("topicCounts and number formats (VD-1)", () => {
  it("counts videos per topic, most first", () => {
    expect(topicCounts(rows)).toEqual([
      { topic: "llm", count: 2 },
      { topic: "ml", count: 1 },
      { topic: "retrieval", count: 1 },
      { topic: "software-engineering", count: 1 },
    ]);
  });

  it("writes view counts short and never rounds up", () => {
    expect(formatViews(0)).toBe("0");
    expect(formatViews(840)).toBe("840");
    expect(formatViews(1000)).toBe("1K");
    expect(formatViews(3456)).toBe("3.4K");
    expect(formatViews(45_999)).toBe("45K");
    expect(formatViews(1_250_000)).toBe("1.2M");
    expect(formatViews(2_000_000)).toBe("2M");
  });

  it("writes minutes, and hours for long videos", () => {
    expect(formatMinutes(8)).toBe("8 min");
    expect(formatMinutes(89)).toBe("89 min");
    expect(formatMinutes(120)).toBe("2 h");
  });
});
