import { describe, expect, it } from "vitest";
import { nextStep } from "./next-step";

describe("APP-4 the study set's next step", () => {
  it("reviews due cards first, then an untaken test", () => {
    expect(nextStep({ notes: 1, tests: [{ id: "t", percent: null }], decks: [{ id: "a", due: 2 }, { id: "b", due: 5 }] })).toEqual({ kind: "review", deckId: "b", cards: 5 });
    expect(nextStep({ notes: 1, tests: [{ id: "t", percent: 80 }, { id: "u", percent: null }], decks: [{ id: "a", due: 0 }] })).toEqual({ kind: "take", testId: "u" });
  });
  it("starts a new set with notes, then a test, retests a weak score, then makes cards", () => {
    expect(nextStep({ notes: 0, tests: [], decks: [] })).toEqual({ kind: "make", what: "notes" });
    expect(nextStep({ notes: 1, tests: [], decks: [] })).toEqual({ kind: "make", what: "test" });
    expect(nextStep({ notes: 1, tests: [{ id: "t", percent: 50 }, { id: "u", percent: 40 }], decks: [] })).toEqual({ kind: "retest", testId: "u", percent: 40 });
    expect(nextStep({ notes: 1, tests: [{ id: "t", percent: 90 }], decks: [] })).toEqual({ kind: "make", what: "cards" });
  });
});
