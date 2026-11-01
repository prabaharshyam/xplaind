import { describe, expect, it } from "vitest";
import { booksForTheme, sortBooks } from "./books-order";

const book = (id: string, score: number, level: "B1" | "I1" | "P1", themes: string[]) => ({ id, title: id, score, level, themes });

describe("book order (BK-2, ED-2)", () => {
  it("puts the highest editor score first, then the easier book", () => {
    const out = sortBooks([book("c", 4.2, "I1", ["ml"]), book("a", 4.8, "P1", ["ml"]), book("b", 4.2, "B1", ["ml"])]);
    expect(out.map((b) => b.id)).toEqual(["a", "b", "c"]);
  });

  it("orders identically whatever the affiliate flag says, and never reads it", () => {
    const trap = (id: string, score: number) =>
      Object.defineProperty(book(id, score, "B1", ["ml"]), "affiliate", {
        get() {
          throw new Error("ranking read the affiliate field");
        },
        enumerable: true,
      });
    expect(sortBooks([trap("x", 3), trap("y", 5)]).map((b) => b.id)).toEqual(["y", "x"]);
  });

  it("picks the best books for one topic", () => {
    const all = [book("a", 4, "B1", ["ml"]), book("b", 5, "B1", ["dsa"]), book("c", 4.5, "I1", ["ml", "dsa"])];
    expect(booksForTheme(all, "ml", 1).map((b) => b.id)).toEqual(["c"]);
  });
});
