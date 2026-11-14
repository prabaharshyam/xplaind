import type { MetadataRoute } from "next";
import { contentUpdatedOn, getBlogPosts, getDesigns, getPatterns, getContent, getPaths, getProjects, getStops } from "@/lib/content";
import { getInterviewViews } from "@/lib/content/interview";
import { INTERVIEW_TOPIC_IDS } from "@/lib/interview-topics";
import { LEVEL_IDS } from "@/lib/levels";
import { siteUrl } from "@/lib/site";
import { THEMES } from "@/lib/themes";

/** The last day the site's own pages (home, menus, tools) changed. Bump it with page changes. */
export const PAGES_UPDATED_ON = "2026-11-09";

// IQ-3: every public page, including each interview question. /result and /go are
// left out: one is personal, the other only redirects.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const paths = [
    "/",
    "/start",
    "/about",
    "/privacy",
    "/terms",
    "/refunds",
    "/contact",
    "/pricing",
    "/colleges",
    "/stories",
    "/paths",
    "/topics",
    ...THEMES.map((t) => `/topics/${t.id}`),
    ...getPaths().map((p) => `/roadmap/${p.id}`),
    ...getPaths()
      .filter((p) => p.placement === "ladder" && p.id !== "genai-engineer")
      .map((p) => `/start/${p.id}`),
    ...LEVEL_IDS.map((l) => `/roadmap/genai-engineer/${l.toLowerCase()}`),
    ...getStops().map((s) => `/stop/${s.id}`),
    "/interview",
    "/interview/simulator",
    "/interview/top",
    ...getPaths()
      .filter((p) => p.top_interview.length)
      .map((p) => `/interview/top/${p.id}`),
    "/ai",
    "/ai/tutor",
    "/jobs",
    "/playground",
    "/plan",
    "/ai/book",
    "/ai/resume",
    ...getPaths().map((p) => `/interview/for/${p.id}`),
    ...getInterviewViews().map((q) => `/interview/${q.id}`),
    "/practice",
    ...INTERVIEW_TOPIC_IDS.map((t) => `/practice/${t}`),
    "/projects",
    "/interview/patterns",
    ...getPatterns().map((p) => `/interview/patterns/${p.id}`),
    "/interview/design",
    ...getDesigns().map((d) => `/interview/design/${d.id}`),
    "/library",
    "/videos",
    "/books",
    "/interview/answers",
    "/papers",
    "/disclosure",
    ...getProjects().map((p) => `/projects/${p.id}`),
    "/resources",
    "/certifications",
    "/blog",
    ...getBlogPosts().map((b) => `/blog/${b.id}`),
    "/glossary",
    "/how-we-rank",
  ];
  // SE-2: last-modified dates, so search and AI engines can tell fresh pages from stale ones.
  // Lessons, interview questions and projects use their review date and guides their update date.
  // Every other page uses the newest of those and PAGES_UPDATED_ON.
  const day = (d: string) => new Date(`${d}T00:00:00+05:30`);
  const dated = new Map<string, string>([
    ...getStops().map((s) => [`/stop/${s.id}`, s.reviewed_on] as const),
    ...getContent().interview.map(({ data: q }) => [`/interview/${q.id}`, q.reviewed_on] as const),
    ...getProjects().map((p) => [`/projects/${p.id}`, p.reviewed_on] as const),
    ...getPatterns().map((p) => [`/interview/patterns/${p.id}`, p.reviewed_on] as const),
    ...getDesigns().map((d) => [`/interview/design/${d.id}`, d.reviewed_on] as const),
    ...getBlogPosts().map((b) => [`/blog/${b.id}`, b.updated_on] as const),
  ]);
  const newest = [PAGES_UPDATED_ON, contentUpdatedOn(), ...dated.values()].reduce((m, d) => (d > m ? d : m));
  const priority = (p: string) => (p === "/" ? 1 : p.startsWith("/roadmap/") || p === "/paths" ? 0.9 : p.startsWith("/stop/") ? 0.8 : 0.6);
  return [...new Set(paths)].map((p) => ({ url: `${base}${p}`, lastModified: day(dated.get(p) ?? newest), priority: priority(p) }));
}
