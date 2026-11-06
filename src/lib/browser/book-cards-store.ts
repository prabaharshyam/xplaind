// MB-5: flashcard decks made from the learner's notes or book, kept on this device only.
// The file itself is never saved: only the cards, their short quotes and how the learner rated them.
import { useMemo, useSyncExternalStore } from "react";
import { z } from "zod";
import { read, serverSnapshot, subscribe, write } from "./storage";

export const CARDS_KEY = "xplaind.bookcards.v1";
const MAX_DECKS = 10;

const Card = z.object({
  id: z.string().max(10),
  front: z.string().max(400),
  back: z.string().max(800),
  quote: z.string().max(500),
  page: z.number().int().min(1),
  section: z.string().max(200),
});
const Deck = z.object({
  id: z.string().max(40),
  createdOn: z.string().max(10),
  book: z.string().max(200),
  cards: z.array(Card).min(1).max(30),
  /** Card id to "knew" or "again", from the last round. */
  marks: z.record(z.string().max(10), z.enum(["knew", "again"])).default({}),
});
export type BookCard = z.infer<typeof Card>;
export type BookDeck = z.infer<typeof Deck>;

export function parseDecks(raw: string | null): BookDeck[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as { version?: number; decks?: unknown[] };
    if (v?.version !== 1 || !Array.isArray(v.decks)) return [];
    return v.decks
      .flatMap((d) => {
        const p = Deck.safeParse(d);
        return p.success ? [p.data] : [];
      })
      .slice(0, MAX_DECKS);
  } catch {
    return [];
  }
}

const rawDecks = () => read(CARDS_KEY);
const save = (decks: BookDeck[]) => write(CARDS_KEY, JSON.stringify({ version: 1, decks: decks.slice(0, MAX_DECKS) }));

export function useDecks(): BookDeck[] {
  const raw = useSyncExternalStore(subscribe, rawDecks, serverSnapshot);
  return useMemo(() => parseDecks(raw), [raw]);
}

/** Saves a new deck first in the list and returns its id. */
export function addDeck(deck: Omit<BookDeck, "id" | "marks">): string {
  const id = Math.random().toString(36).slice(2, 10);
  save([{ ...deck, id, marks: {} }, ...parseDecks(rawDecks())]);
  return id;
}

export function markCard(deckId: string, cardId: string, mark: "knew" | "again"): void {
  save(parseDecks(rawDecks()).map((d) => (d.id === deckId ? { ...d, marks: { ...d.marks, [cardId]: mark } } : d)));
}

export function deleteDeck(id: string): void {
  save(parseDecks(rawDecks()).filter((d) => d.id !== id));
}

/** Cards to study: the ones marked "again" first, then the rest, in book order. Pure, for tests. */
export function studyOrder(deck: BookDeck): BookCard[] {
  const again = deck.cards.filter((c) => deck.marks[c.id] === "again");
  return [...again, ...deck.cards.filter((c) => deck.marks[c.id] !== "again")];
}

/** The deck as CSV (front, back, where), which Anki and most flashcard apps can import. Pure, for tests. */
export function deckCsv(deck: BookDeck): string {
  const cell = (s: string) => `"${s.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
  return ["Front,Back,Where", ...deck.cards.map((c) => [c.front, c.back, `${c.section}, page ${c.page}`].map(cell).join(","))].join("\r\n");
}
