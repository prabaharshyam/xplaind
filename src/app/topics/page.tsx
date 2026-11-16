import { permanentRedirect } from "next/navigation";

/**
 * LY-2 (owner request, 2026-11-16): Library and Topics were two pages that did nearly the same job.
 * They are one page now, with a "By topic" view, so old links and bookmarks land there. Each topic
 * keeps its own page at /topics/<topic>.
 */
export default function TopicsPage(): never {
  permanentRedirect("/library?view=topics");
}
