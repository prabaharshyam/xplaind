// The site search index, prerendered at build time from the content files.
import { getBlogPosts, getContent, getGlossary, getPaths, getStops } from "@/lib/content";
import { getInterviewViews } from "@/lib/content/interview";
import type { SearchItem } from "@/lib/search/search";
import { THEMES } from "@/lib/themes";

export function GET(): Response {
  const items: SearchItem[] = [
    ...getPaths().map((p): SearchItem => ({ k: "path", t: p.name, h: `/roadmap/${p.id}`, s: p.tagline })),
    ...THEMES.map((t): SearchItem => ({ k: "topic", t: t.label, h: `/topics/${t.id}` })),
    ...getStops().map((s): SearchItem => ({ k: "lesson", t: s.title, h: `/stop/${s.id}`, s: s.outcome })),
    ...getBlogPosts().map((b): SearchItem => ({ k: "post", t: b.title, h: `/blog/${b.id}` })),
    ...getInterviewViews().map((q): SearchItem => ({ k: "question", t: q.question, h: `/interview/${q.id}` })),
    ...getGlossary().map((g): SearchItem => ({ k: "term", t: g.term, h: `/glossary#${g.id}`, s: g.also.join(" ") })),
    ...getContent().resources.map(({ data: r }): SearchItem => ({ k: "course", t: r.title, h: `/go/${r.id}`, s: r.provider })),
  ];
  return Response.json(items);
}
