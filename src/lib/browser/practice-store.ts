// Browser-only interview practice ratings (IQ-4) until sign-in exists (slice S5).
// Holds question ids and ratings only, no personal data.
import { isRating, type RatingRecord, type Ratings } from "@/lib/practice/queue";
import { syncRating } from "./account-sync";
import { read, write } from "./storage";

export const PRACTICE_KEY = "xplaind.practice.v1";

export type SavedPractice = { version: 1; ratings: Ratings };

const EMPTY: SavedPractice = { version: 1, ratings: {} };

export const rawPractice = (): string | null => read(PRACTICE_KEY);

export function parsePractice(raw: string | null): SavedPractice {
  if (!raw) return EMPTY;
  try {
    const v = JSON.parse(raw) as SavedPractice;
    if (!v || v.version !== 1 || typeof v.ratings !== "object" || v.ratings === null) return EMPTY;
    const ratings: Record<string, RatingRecord> = {};
    for (const [id, r] of Object.entries(v.ratings)) {
      if (r && isRating(r.rating) && typeof r.updatedOn === "string") ratings[id] = r;
    }
    return { version: 1, ratings };
  } catch {
    return EMPTY;
  }
}

export function rate(questionId: string, record: RatingRecord): void {
  const current = parsePractice(rawPractice());
  write(PRACTICE_KEY, JSON.stringify({ ...current, ratings: { ...current.ratings, [questionId]: record } }));
  syncRating(questionId, record);
}

/** Replaces all ratings with the merged copy from the server, without sending anything back. */
export const replaceRatings = (ratings: Ratings): void => write(PRACTICE_KEY, JSON.stringify({ version: 1, ratings }));
