// APP-4: what a study set suggests next, like StudyFetch's "Recommended" module. Pure, for tests.
export type NextStep =
  | { kind: "review"; deckId: string; cards: number }
  | { kind: "take"; testId: string }
  | { kind: "make"; what: "notes" | "test" | "cards" }
  | { kind: "retest"; testId: string; percent: number };

export function nextStep(input: {
  notes: number;
  tests: { id: string; percent: number | null }[];
  decks: { id: string; due: number }[];
}): NextStep {
  const due = [...input.decks].sort((a, b) => b.due - a.due)[0];
  if (due && due.due > 0) return { kind: "review", deckId: due.id, cards: due.due };
  const untaken = input.tests.find((t) => t.percent === null);
  if (untaken) return { kind: "take", testId: untaken.id };
  if (input.notes === 0) return { kind: "make", what: "notes" };
  if (input.tests.length === 0) return { kind: "make", what: "test" };
  const weak = input.tests.filter((t) => t.percent !== null && t.percent < 70).sort((a, b) => a.percent! - b.percent!)[0];
  if (weak) return { kind: "retest", testId: weak.id, percent: weak.percent! };
  if (input.decks.length === 0) return { kind: "make", what: "cards" };
  return { kind: "make", what: "test" };
}
