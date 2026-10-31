// AC-6: the weekly streak. Weeks run Monday to Sunday in India time. Pure.
// Days come in as YYYY-MM-DD calendar dates in India (activity_days.day).

const DAY_MS = 86_400_000;

const toUtc = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

/** The Monday that starts the week of this date, as YYYY-MM-DD. */
export function weekStart(iso: string): string {
  const t = toUtc(iso);
  const dow = new Date(t).getUTCDay(); // 0 Sunday .. 6 Saturday
  const back = (dow + 6) % 7; // days since Monday
  return new Date(t - back * DAY_MS).toISOString().slice(0, 10);
}

const weekIndex = (iso: string) => Math.round(toUtc(weekStart(iso)) / (7 * DAY_MS));

export type Streak = { current: number; weeksActive: number; activeThisWeek: boolean };

/**
 * current: consecutive active weeks ending at the latest active week, if that
 * week is this week or last week. It resets after one empty week, not before:
 * an empty current week does not break a streak until the week is over.
 */
export function weeklyStreak(activityDays: readonly string[], today: string): Streak {
  const weeks = new Set(activityDays.map(weekIndex));
  const now = weekIndex(today);
  const activeThisWeek = weeks.has(now);
  let start = activeThisWeek ? now : now - 1;
  let current = 0;
  while (weeks.has(start)) {
    current += 1;
    start -= 1;
  }
  return { current, weeksActive: weeks.size, activeThisWeek };
}
