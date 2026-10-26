import type { MetadataRoute } from "next";
import { getBlogPosts, getPaths, getProjects, getStops } from "@/lib/content";
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
    "/ai/roadmap",
    "/ai/course",
    "/ai/coach",
    "/ai/book",
    ...getPaths().map((p) => `/interview/for/${p.id}`),
    ...getInterviewViews().map((q) => `/interview/${q.id}`),
    "/practice",
    ...INTERVIEW_TOPIC_IDS.map((t) => `/practice/${t}`),
    "/projects",
    ...getProjects().map((p) => `/projects/${p.id}`),
    "/resources",
    "/certifications",
    "/blog",
    ...getBlogPosts().map((b) => `/blog/${b.id}`),
    "/glossary",
    "/how-we-rank",
  ];
  return paths.map((p) => ({ url: `${base}${p}` }));
}
