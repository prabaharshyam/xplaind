import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import { DEFAULT_PATH_ID } from "@/lib/paths";
import { getPath } from "@/lib/content";
import { TestPage } from "./test-page";

export const metadata: Metadata = pageMeta({
  // SE-8: search-led title and description.
  title: ["AI Skills Test: Find Your Level in 10 Minutes", "AI Skills Test: Find Your Level"],
  description:
    "A 10-minute AI skills test that finds your level and where to start, so your AI roadmap skips what you already know. No sign-up needed.",
  path: "/start",
});

export default function StartPage() {
  return <TestPage goal={getPath(DEFAULT_PATH_ID)!} />;
}
