import { describe, expect, it } from "vitest";
import { cleanBookAnswer, NOT_IN_NOTES } from "@/lib/ai/features";
import { addDays, dueCards, INTERVALS, isDue, missedAsCards, nextDue, relevantExcerpts, retestCount, retestSections, review, terms } from "./loop";
import type { BookQuestion } from "./report";

const chunk = (id: string, section: string, text: string) => ({ id, page: Number(id.slice(1)), section, text });

describe("ask your notes: picking passages (MB-8)", () => {
  const book = {
    chunks: [
      chunk("c1", "Cells", "The mitochondria is the powerhouse of the cell and makes energy from glucose through respiration."),
      chunk("c2", "Plants", "Photosynthesis happens in the chloroplast. Plants use light, water and carbon dioxide to make glucose."),
      chunk("c3", "Plants", "Chlorophyll is the green pigment in the chloroplast that absorbs light for photosynthesis."),
      chunk("c4", "History", "The printing press spread books across Europe in the fifteenth century."),
    ],
  };

  it("drops stop words and trims simple plurals", () => {
    expect(terms("What are the chloroplasts for?")).toEqual(["chloroplast"]);
  });

  it("returns the passages that share the question's words, in book order", () => {
    const ids = relevantExcerpts(book, "Where does photosynthesis happen in plants?").map((c) => c.id);
    expect(ids).toContain("c2");
    expect(ids).not.toContain("c4");
    expect(ids).toEqual([...ids].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1))));
  });

  it("returns nothing when no word matches, so no AI call is made", () => {
    expect(relevantExcerpts(book, "Who won the cricket world cup?")).toEqual([]);
    expect(relevantExcerpts(book, "the and of")).toEqual([]);
  });

  it("keeps at most n passages", () => {
    expect(relevantExcerpts(book, "glucose light chloroplast energy", 2)).toHaveLength(2);
  });
});

describe("ask your notes: checking the answer (MB-8)", () => {
  const excerpts = [{ id: "c2", page: 12, section: "Plants", text: "Photosynthesis happens in the chloroplast. Plants use light, water and carbon dioxide to make glucose." }];

  it("keeps an answer only with a quote that is really in the cited passage", () => {
    const a = cleanBookAnswer(
      { found: true, answer: "In the chloroplast.", citations: [{ excerpt_id: "c2", quote: "Photosynthesis happens in the chloroplast. Plants use light" }], follow_ups: ["What is chlorophyll?"] },
      excerpts,
    );
    expect(a.found).toBe(true);
    expect(a.citations).toEqual([{ quote: "Photosynthesis happens in the chloroplast. Plants use light", page: 12, section: "Plants" }]);
  });

  it("turns an answer with no real quote into 'not in your notes'", () => {
    const made_up = cleanBookAnswer({ found: true, answer: "In the nucleus.", citations: [{ excerpt_id: "c2", quote: "Photosynthesis happens in the nucleus of every cell" }], follow_ups: [] }, excerpts);
    expect(made_up).toMatchObject({ found: false, answer: NOT_IN_NOTES, citations: [] });
    const wrong_id = cleanBookAnswer({ found: true, answer: "x", citations: [{ excerpt_id: "c9", quote: "Photosynthesis happens in the chloroplast. Plants use light" }], follow_ups: [] }, excerpts);
    expect(wrong_id.found).toBe(false);
  });

  it("passes on the model's own 'not found' sentence", () => {
    const a = cleanBookAnswer({ found: false, answer: "This is not in the parts that matched. Try searching for 'mitosis'.", citations: [], follow_ups: [] }, excerpts);
    expect(a).toMatchObject({ found: false, answer: "This is not in the parts that matched. Try searching for 'mitosis'." });
  });
});

const q = (id: string, section: string, answer = 0): BookQuestion => ({ id, question: `Q ${id}?`, options: ["A", "B", "C", "D"], answer, explanation: "Because.", quote: "quote", page: 3, section });

describe("retest what I missed (MB-9)", () => {
  const test = { questions: [q("q1", "Cells"), q("q2", "Cells"), q("q3", "Plants"), q("q4", "Plants"), q("q5", "History")] };

  it("covers the sections scored under 60%", () => {
    // Cells 0 of 2, Plants 1 of 2 (50%), History 1 of 1.
    expect(retestSections(test, [1, null, 0, 2, 0])).toEqual(["Cells", "Plants"]);
  });

  it("falls back to any section with a miss when none scored that low", () => {
    const many = { questions: [q("q1", "A"), q("q2", "A"), q("q3", "A"), q("q4", "B")] };
    expect(retestSections(many, [0, 0, 1, 0])).toEqual(["A"]);
    expect(retestSections(many, [0, 0, 0, 0])).toEqual([]);
  });

  it("asks two questions per miss, between 5 and 15", () => {
    expect(retestCount(test, [0, 0, 0, 0, 1])).toBe(5);
    expect(retestCount(test, [1, 1, 1, 0, 0])).toBe(6);
    expect(retestCount({ questions: Array.from({ length: 20 }, (_, i) => q(`q${i}`, "A")) }, Array(20).fill(1))).toBe(15);
  });

  it("turns missed questions into review cards with the right answer and the quote", () => {
    const cards = missedAsCards(test, [0, 1, 0, 0, 0]);
    expect(cards).toEqual([{ id: "m1", front: "Q q2?", back: "A. Because.", quote: "quote", page: 3, section: "Cells" }]);
  });
});

describe("spaced repetition (MB-10)", () => {
  it("adds calendar days across month ends", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 2)).toBe("2027-01-02");
  });

  it("moves a known card up a box and sends a missed card back to tomorrow", () => {
    const first = review(undefined, "knew", "2026-11-12");
    expect(first).toEqual({ box: 1, due: addDays("2026-11-12", INTERVALS[1]) });
    const second = review(first, "knew", "2026-11-14");
    expect(second.box).toBe(2);
    expect(review(second, "again", "2026-11-18")).toEqual({ box: 0, due: "2026-11-19" });
  });

  it("never goes past the last box", () => {
    let r = review(undefined, "knew", "2026-01-01");
    for (let k = 0; k < 10; k++) r = review(r, "knew", "2026-01-01");
    expect(r.box).toBe(INTERVALS.length - 1);
  });

  it("lists overdue cards first, then new ones, and skips cards not yet due", () => {
    const cards = [{ id: "c1" }, { id: "c2" }, { id: "c3" }, { id: "c4" }];
    const schedule = { c1: { box: 2, due: "2026-11-20" }, c2: { box: 1, due: "2026-11-12" }, c3: { box: 0, due: "2026-11-10" } };
    expect(dueCards(cards, schedule, "2026-11-12").map((c) => c.id)).toEqual(["c3", "c2", "c4"]);
    expect(isDue(schedule.c1, "2026-11-12")).toBe(false);
    expect(nextDue(schedule)).toBe("2026-11-10");
    expect(nextDue({})).toBeNull();
  });
});
