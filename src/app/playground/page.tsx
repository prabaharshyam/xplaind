import { pageMeta } from "@/lib/seo";
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
        lead="Nothing to install: Python runs inside your browser, with NumPy and pandas ready. Pick a warm-up, an AI idea or a challenge, or paste your own code. If it breaks, the AI tutor explains the error."
      />
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <PlaygroundStudio aiOn={aiEnabled()} lessonTitles={lessonTitles} />
        <p className="mt-8 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Your code runs on your device and is not sent anywhere, unless you ask the AI tutor to explain an error. Then only the code and the
          error go to it. The first run downloads Python once (about 10 MB). Programs that ask for input with input() are not supported yet.
        </p>
      </div>
    </main>
  );
}
