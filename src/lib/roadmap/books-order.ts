// BK-2 and ED-2: the order books appear in. Pure. Reads only the editor's score,
// the level and the title, so commission can never move a book up the list.
import { LEVEL_IDS, type LevelId } from "@/lib/levels";

type Orderable = { id: string; title: string; score: number; level: LevelId; themes: readonly string[] };

const levelIndex = (l: LevelId) => LEVEL_IDS.indexOf(l);

/** Highest editor score first; ties go to the easier book, then the title. */
export function sortBooks<T extends Orderable>(books: readonly T[]): T[] {
  return [...books].sort((a, b) => b.score - a.score || levelIndex(a.level) - levelIndex(b.level) || a.title.localeCompare(b.title));
}

/** BK-4: the best books for one topic, at most `max`. */
export function booksForTheme<T extends Orderable>(books: readonly T[], theme: string, max: number): T[] {
  return sortBooks(books.filter((b) => b.themes.includes(theme))).slice(0, max);
}
