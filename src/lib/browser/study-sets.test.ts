import { describe, expect, it } from "vitest";
import { MAX_SETS, parseSets, placeSet } from "./study-sets";

const book = (title: string, pages = 10) => ({ title, pages, sections: ["One", "Two"] });

describe("MB-13 study sets kept on the device", () => {
  it("adds a new set first, and brings the same file back to the top without a second copy", () => {
    const a = placeSet([], book("Biology"), "2026-11-26", "a");
    const b = placeSet(a.list, book("Physics"), "2026-11-27", "b");
    expect(b.list.map((s) => s.id)).toEqual(["b", "a"]);
    const again = placeSet(b.list, book("Biology"), "2026-11-28", "c");
    expect(again.id).toBe("a");
    expect(again.list.map((s) => s.id)).toEqual(["a", "b"]);
    expect(again.list[0]).toMatchObject({ createdOn: "2026-11-26", openedOn: "2026-11-28" });
    // A different edition (another page count) is its own set.
    expect(placeSet(again.list, book("Biology", 12), "2026-11-28", "d").list).toHaveLength(3);
  });

  it("keeps at most ten sets and says which fell off", () => {
    let list = Array.from({ length: MAX_SETS }, (_, i) => placeSet([], book(`Book ${i}`), "2026-11-01", `s${i}`).list[0]);
    const r = placeSet(list, book("New"), "2026-11-27", "n");
    list = r.list;
    expect(list).toHaveLength(MAX_SETS);
    expect(r.dropped).toEqual(["s9"]);
  });

  it("drops a malformed entry and anything not version 1", () => {
    const good = placeSet([], book("Biology"), "2026-11-27", "a").list[0];
    expect(parseSets(JSON.stringify({ version: 1, sets: [good, { id: 5 }] }))).toEqual([good]);
    expect(parseSets(JSON.stringify({ version: 2, sets: [good] }))).toEqual([]);
    expect(parseSets("not json")).toEqual([]);
    expect(parseSets(null)).toEqual([]);
  });
});
