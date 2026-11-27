import { pageMeta } from "@/lib/seo";
import { ExploreTools } from "@/components/explore-tools";
import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { aiEnabled } from "@/lib/ai/settings";
import { getStops } from "@/lib/content";
import { EXAMPLES } from "@/lib/playground/examples";
import { PlaygroundStudio } from "./playground-studio";

export const metadata: Metadata = pageMeta({
  // SE-8: search-led title and description.
  title: ["Online Python Compiler for AI: Run Code in Your Browser", "Online Python Playground for AI Learners"],
  description:
    "Online Python compiler for AI learners: run Python in your browser with NumPy and pandas, nothing to install, with starter programs on tokens and RAG.",
  path: "/playground",
});

export default function PlaygroundPage() {
  const wanted = new Set(EXAMPLES.flatMap((e) => (e.lesson ? [e.lesson] : [])));
  const lessonTitles = Object.fromEntries(getStops().filter((s) => wanted.has(s.id)).map((s) => [s.id, s.title]));
  return (
    <main>
      <PageHero
        size="full"
        shape="icon:code"
        theme="code"
        seed="playground"
        icon="code"
        eyebrow="Practice · Code playground"
        title="Write and run Python, right here"
        lead="Python with NumPy and pandas, right in your browser. Pick a warm-up or paste your code; if it breaks, the AI tutor explains why."
      />
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <PlaygroundStudio aiOn={aiEnabled()} lessonTitles={lessonTitles} />
        {/* UX-22: the small print as short chips. */}
        <ul className="mt-8 flex flex-wrap gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          {["Runs on your device", "Only sent to the AI tutor if you ask it to explain an error", "First run downloads Python once (about 10 MB)", "input() is not supported yet"].map((t) => (
            <li key={t} className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              {t}
            </li>
          ))}
        </ul>
      </div>
      <ExploreTools current="/playground" />
    </main>
  );
}
