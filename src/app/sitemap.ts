import type { MetadataRoute } from "next";
import { getStops } from "@/lib/content";
import { getInterviewViews } from "@/lib/content/interview";
import { INTERVIEW_TOPIC_IDS } from "@/lib/interview-topics";
import { LEVEL_IDS } from "@/lib/levels";
import { siteUrl } from "@/lib/site";

// IQ-3: every public page, including each interview question. /result and /go are
// left out: one is personal, the other only redirects.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const paths = [
    "/",
    "/start",
    "/roadmap/genai-engineer",
    ...LEVEL_IDS.map((l) => `/roadmap/genai-engineer/${l.toLowerCase()}`),
    ...getStops().map((s) => `/stop/${s.id}`),
    "/interview",
    ...getInterviewViews().map((q) => `/interview/${q.id}`),
    "/practice",
    ...INTERVIEW_TOPIC_IDS.map((t) => `/practice/${t}`),
    "/how-we-rank",
  ];
  return paths.map((p) => ({ url: `${base}${p}` }));
}
