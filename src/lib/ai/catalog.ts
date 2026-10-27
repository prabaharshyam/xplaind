// The lessons the model may link to, from the content files. Node only.
import { getContent, getStops } from "@/lib/content";
import type { CatalogLesson, ChatReply } from "./features";

export const aiCatalog = (): CatalogLesson[] => getStops().map((s) => ({ id: s.id, title: s.title, level: s.level }));
export const lessonIds = (): Set<string> => new Set(getStops().map((s) => s.id));

/** A lesson's title, goal and full text, for the learning companion. */
export function lessonForTutor(id: string): { title: string; outcome: string; body: string } | null {
  const entry = getContent().stops.find((s) => s.data.id === id);
  return entry ? { title: entry.data.title, outcome: entry.data.outcome, body: entry.data.body } : null;
}

/** A chat reply for the browser: lesson ids become links with titles. */
export function withTitles(r: ChatReply): { reply: string; follow_ups: string[]; lessons: { id: string; title: string }[] } {
  const stops = getStops();
  return {
    reply: r.reply,
    follow_ups: r.follow_ups,
    lessons: r.lesson_ids.flatMap((id) => {
      const s = stops.find((x) => x.id === id);
      return s ? [{ id, title: s.title }] : [];
    }),
  };
}
