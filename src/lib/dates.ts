// Weeks and dates use Asia/Kolkata everywhere (CLAUDE.md, PRD). Keep date maths here.

const IST_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today's calendar date in India as YYYY-MM-DD. */
export function todayInIST(now: Date = new Date()): string {
  return IST_DAY.format(now);
}

/** Whole days from date `a` to date `b` (both YYYY-MM-DD). Negative if b is before a. */
export function daysBetween(a: string, b: string): number {
  const toUtc = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
}
