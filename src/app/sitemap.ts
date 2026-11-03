import type { MetadataRoute } from "next";
import { contentUpdatedOn, getBlogPosts, getPaths, getProjects, getStops } from "@/lib/content";
import { getInterviewViews } from "@/lib/content/interview";
import { INTERVIEW_TOPIC_IDS } from "@/lib/interview-topics";
import { LEVEL_IDS } from "@/lib/levels";
import { siteUrl } from "@/lib/site";
import { THEMES } from "@/lib/themes";

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
    "/ai",
    "/ai/tutor",
    "/jobs",
    "/playground",
    "/plan",
    "/ai/roadmap",
    "/ai/book",
    "/ai/resume",
    ...getPaths().map((p) => `/interview/for/${p.id}`),
    ...getInterviewViews().map((q) => `/interview/${q.id}`),
    "/practice",
    ...INTERVIEW_TOPIC_IDS.map((t) => `/practice/${t}`),
    "/projects",
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
  // Lessons use their review date; everything else the date of this build.
  const built = new Date(`${contentUpdatedOn()}T00:00:00+05:30`);
  const lessonDate = new Map(getStops().map((s) => [`/stop/${s.id}`, new Date(`${s.reviewed_on}T00:00:00+05:30`)]));
  const priority = (p: string) => (p === "/" ? 1 : p.startsWith("/roadmap/") || p === "/paths" ? 0.9 : p.startsWith("/stop/") ? 0.8 : 0.6);
  return paths.map((p) => ({ url: `${base}${p}`, lastModified: lessonDate.get(p) ?? built, priority: priority(p) }));
}
