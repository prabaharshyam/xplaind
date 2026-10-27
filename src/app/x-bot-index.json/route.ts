// X Bot's answer index (XB-2), prerendered at build time from the content files. No courses:
// X Bot never ranks resources (ED-2).
import type { BotEntry } from "@/lib/bot/answer";
import { SITE_GUIDE } from "@/lib/bot/guide";
import { getGlossary, getPaths, getProjects, getStops } from "@/lib/content";
import { getInterviewViews } from "@/lib/content/interview";

const clip = (s: string, n = 600) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

export function GET(): Response {
  const entries: BotEntry[] = [
    ...SITE_GUIDE,
    ...getGlossary().map((g): BotEntry => ({ k: "term", t: g.term, a: clip(g.explanation ? `${g.definition} ${g.explanation}` : g.definition), h: `/glossary#${g.id}`, w: g.also.join(" ") })),
    ...getStops().map((s): BotEntry => ({ k: "lesson", t: s.title, a: s.outcome, h: `/stop/${s.id}`, w: s.key_terms.join(" ").replaceAll("-", " ") })),
    ...getInterviewViews().map((q): BotEntry => ({ k: "question", t: q.question, a: clip(q.short_answer), h: `/interview/${q.id}`, w: q.topic.replaceAll("-", " ") })),
    ...getProjects().map((p): BotEntry => ({ k: "project", t: p.title, a: p.summary, h: `/projects/${p.id}`, w: "project" })),
    ...getPaths().map((p): BotEntry => ({ k: "path", t: p.name, a: p.tagline, h: `/roadmap/${p.id}`, w: "roadmap career role job" })),
  ];
  return Response.json(entries);
}
