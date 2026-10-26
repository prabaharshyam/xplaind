// IQ-4: practice ratings and the order questions come back in. Pure.
// Ratings mirror the practice_ratings table (0 missed, 1 partly, 2 got it), so
// slice S5 can copy browser ratings to the account on sign-in.

export const RATINGS = [
  { value: 0, label: "Missed" },
  { value: 1, label: "Partly" },
  { value: 2, label: "Got it" },
] as const;

export type Rating = (typeof RATINGS)[number]["value"];

export type RatingRecord = { rating: Rating; /** YYYY-MM-DD in India. */ updatedOn: string };

export type Ratings = Readonly<Record<string, RatingRecord>>;

export const isRating = (v: unknown): v is Rating => v === 0 || v === 1 || v === 2;

/**
 * Practice order: questions never rated first (in content order), then missed,
 * then partly, then got it. Within a rating, the one rated longest ago comes
 * first. Release 2 replaces this with spaced repetition (IQ-8).
 */
export function practiceOrder(ids: readonly string[], ratings: Ratings): string[] {
  const position = new Map(ids.map((id, i) => [id, i]));
  const rank = (id: string) => (ratings[id] ? 1 + ratings[id].rating : 0);
  return [...ids].sort((a, b) => {
    const byRank = rank(a) - rank(b);
    if (byRank !== 0) return byRank;
    const ra = ratings[a];
    const rb = ratings[b];
    if (ra && rb && ra.updatedOn !== rb.updatedOn) return ra.updatedOn < rb.updatedOn ? -1 : 1;
    return position.get(a)! - position.get(b)!;
  });
}

export type PracticeSummary = { total: number; rated: number; gotIt: number; partly: number; missed: number };

export function summarise(ids: readonly string[], ratings: Ratings): PracticeSummary {
  const out: PracticeSummary = { total: ids.length, rated: 0, gotIt: 0, partly: 0, missed: 0 };
  for (const id of ids) {
    const r = ratings[id];
    if (!r) continue;
    out.rated += 1;
    if (r.rating === 2) out.gotIt += 1;
    else if (r.rating === 1) out.partly += 1;
    else out.missed += 1;
  }
  return out;
}
