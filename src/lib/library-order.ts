/**
 * LY-1: the order the Library lists things in. A visitor who lands on the Library should meet the
 * technical lessons first, not the general-awareness ones, or the whole site looks basic. So the
 * list starts at "What automation is", runs through every technical lesson, and ends with the
 * "good to know" Beginner 1 lessons (AI rules in India and abroad, bias and fairness, your
 * company's AI policy, and so on). Pure, so it is unit-tested; no content or UI imports.
 */
import type { LevelId } from "@/lib/levels";
import type { ThemeId } from "@/lib/themes";

/** The lesson the Library starts from. */
export const LIBRARY_START = "what-is-automation";

/** Beginner 1 lessons in these themes are awareness lessons: useful, but not what makes the site look deep. */
const GOOD_TO_KNOW_THEMES: ReadonlySet<ThemeId> = new Set<ThemeId>(["ai-basics", "using-ai", "governance", "career", "security"]);

/** True for the awareness lessons that go last: Beginner 1, in a "good to know" theme. */
export const isGoodToKnow = (lesson: { level: LevelId; theme: ThemeId }): boolean => lesson.level === "B1" && GOOD_TO_KNOW_THEMES.has(lesson.theme);

type Orderable = { kind: string; key: string; goodToKnow: boolean };

/**
 * Pins the starting lesson first and moves the good-to-know items to the end. Everything else keeps
 * its order (level by level, as the lessons are written). Stable, and it never drops or adds an item.
 */
export function orderLibrary<T extends Orderable>(items: T[]): T[] {
  const start = `lesson:${LIBRARY_START}`;
  const rank = (i: T) => (i.key === start ? 0 : i.goodToKnow ? 2 : 1);
  return items.map((item, index) => ({ item, index })).sort((a, b) => rank(a.item) - rank(b.item) || a.index - b.index).map((x) => x.item);
}
