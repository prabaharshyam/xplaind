// Site search over a small prebuilt index. Pure, so it runs in the browser and in tests.
export type SearchKind = "path" | "topic" | "lesson" | "question" | "term" | "course" | "post";
export type SearchItem = { k: SearchKind; t: string; h: string; s?: string };

export const KIND_LABEL: Record<SearchKind, string> = {
  path: "Roadmap",
  topic: "Topic",
  lesson: "Lesson",
  question: "Interview question",
  term: "Glossary",
  course: "Course",
  post: "Guide",
};

/** Roadmaps and topics first, then lessons; the order breaks ties between equal scores. */
const KIND_ORDER: SearchKind[] = ["path", "topic", "lesson", "post", "question", "term", "course"];

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

export function search(items: readonly SearchItem[], query: string, limit = 12): SearchItem[] {
  const words = norm(query).split(" ").filter(Boolean);
  if (words.length === 0) return [];
  const scored: { item: SearchItem; score: number }[] = [];
  for (const item of items) {
    const title = ` ${norm(item.t)} `;
    const sub = ` ${norm(item.s ?? "")} `;
    let score = 0;
    let all = true;
    for (const w of words) {
      if (title.includes(` ${w} `)) score += 4;
      else if (title.includes(` ${w}`)) score += 3;
      else if (title.includes(w)) score += 1;
      else if (sub.includes(` ${w}`)) score += 1;
      else {
        all = false;
        break;
      }
    }
    if (!all) continue;
    if (title.trim() === words.join(" ")) score += 6;
    scored.push({ item, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || KIND_ORDER.indexOf(a.item.k) - KIND_ORDER.indexOf(b.item.k) || a.item.t.length - b.item.t.length)
    .slice(0, limit)
    .map((x) => x.item);
}
