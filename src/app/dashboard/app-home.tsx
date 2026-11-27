"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/art/icons";
import { useCurrentPathId, useGame } from "@/lib/browser/hooks";
import type { IconName } from "@/lib/themes";
import { TILE, type Tone } from "@/lib/tones";

const noSubscription = () => () => {};
const hourInIndia = () => Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "numeric", hourCycle: "h23" }).format(new Date()));

/** The greeting by India time; "Welcome back" while the page is prepared ahead of time. */
function useGreeting(): string {
  const h = useSyncExternalStore(noSubscription, hourInIndia, () => -1);
  if (h < 0) return "Welcome back";
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

type Action = { href: string; label: string; note: string; icon: IconName; tone: Tone };

/** APP-6: a card takes a soft tint of its own colour on hover. */
const HOVER: Record<Tone, string> = {
  teal: "hover:bg-brand-50 dark:hover:bg-brand-950/40",
  sky: "hover:bg-sky-50 dark:hover:bg-sky-950/30",
  emerald: "hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
  amber: "hover:bg-amber-50 dark:hover:bg-amber-950/30",
  rose: "hover:bg-rose-50 dark:hover:bg-rose-950/30",
};

/** APP-6: the Ask box suggests a question in turn while it is empty (still under reduced motion: nothing moves). */
const SUGGEST = ["Explain RAG like I am new to it", "What should I learn this week?", "How do embeddings work?", "Make me a plan for 5 hours a week", "How do I get my first AI job?"];
function useSuggestion(paused: boolean): string {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (paused) return;
    const t = window.setInterval(() => setI((k) => (k + 1) % SUGGEST.length), 3500);
    return () => window.clearInterval(t);
  }, [paused]);
  return SUGGEST[i];
}

/**
 * APP-3 (2026-11-27, owner: "once signed in an app interface where users can learn, download roadmaps, do mock
 * interviews, use the resume reviewer, flashcards and every feature"): the top of the app Home. A greeting, an "Ask
 * anything" box that opens the AI tutor with the question typed in (not sent: the learner sends it, so no AI use
 * happens without them), and the main things to do as cards with springy icon tiles (APP-2).
 */
export function AppHome({ paths }: { paths: { id: string; name: string }[] }) {
  const greeting = useGreeting();
  const game = useGame();
  const [typed, setTyped] = useState("");
  const suggestion = useSuggestion(typed.length > 0);
  const pathId = useCurrentPathId(paths.map((p) => p.id));
  const pathName = paths.find((p) => p.id === pathId)?.name ?? "your roadmap";
  const actions: Action[] = [
    { href: `/roadmap/${pathId}`, label: "Continue my roadmap", note: pathName, icon: "map", tone: "teal" },
    { href: "/interview/simulator", label: "Mock interview", note: "Answer out loud, get a report", icon: "mic", tone: "rose" },
    { href: "/ai/resume", label: "Review my resume", note: "Fixes that get you shortlisted", icon: "cert", tone: "emerald" },
    { href: "/ai/book", label: "Study from my notes", note: "Tests and flashcards from a PDF", icon: "book", tone: "amber" },
    { href: "/practice", label: "Flashcards", note: "Interview questions to practise", icon: "check", tone: "sky" },
    // Owner (2026-11-27): no "Download my roadmap" here; the roadmap page has its own download.
    { href: "/plan", label: "Plan my week", note: "Lessons sized to your hours", icon: "target", tone: "amber" },
    { href: "/playground", label: "Code playground", note: "Run Python in your browser", icon: "code", tone: "sky" },
    { href: "/jobs", label: "Jobs and salaries", note: "Pay by role and live openings", icon: "star", tone: "emerald" },
  ];
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{greeting}</h1>
        {/* APP-6: where the learner stands, at a glance. */}
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          {game.streak > 0 && (
            <li className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-900 dark:bg-amber-950/70 dark:text-amber-200">
              <Icon name="fire" size={14} /> {game.streak}-day streak
            </li>
          )}
          <li>
            <Link href={`/roadmap/${pathId}`} className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-900 hover:bg-brand-100 dark:bg-brand-950/60 dark:text-brand-100">
              <Icon name="map" size={14} /> {pathName}
            </Link>
          </li>
        </ul>
      </div>
      <form action="/ai/tutor" method="get" role="search" aria-label="Ask the AI tutor" className="flex items-center gap-2 rounded-3xl bg-white p-2 shadow-sm ring-1 ring-zinc-200 focus-within:ring-2 focus-within:ring-brand-700 dark:bg-zinc-900 dark:ring-zinc-800 dark:focus-within:ring-brand-300">
        <span aria-hidden="true" className={`lx-turn grid size-10 shrink-0 place-items-center rounded-2xl ${TILE.teal}`}>
          <Icon name="sparkles" size={18} />
        </span>
        <label htmlFor="home-ask" className="sr-only">
          Ask anything about AI
        </label>
        <input id="home-ask" name="q" type="text" required maxLength={1000} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={`Try: ${suggestion}`} className="min-w-0 flex-1 bg-transparent px-1 text-base outline-none placeholder:text-zinc-500" />
        <button type="submit" className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-700 text-white hover:bg-brand-800 dark:bg-brand-300 dark:text-brand-950">
          <Icon name="send" size={18} />
          <span className="sr-only">Ask the AI tutor</span>
        </button>
      </form>
      <section aria-labelledby="quick-h">
        <h2 id="quick-h" className="text-lg font-semibold">
          What would you like to do?
        </h2>
        {/* APP-6: the cards rise in one after another when Home opens (globals.css, .lx-stagger). */}
        <ul className="lx-stagger mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {actions.map((a) => (
            <li key={a.label}>
              <Link
                href={a.href}
                className={`lx-lift relative flex h-full flex-col gap-3 rounded-3xl bg-white p-4 ring-1 ring-zinc-200 transition-colors duration-200 hover:ring-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:bg-zinc-900 dark:ring-zinc-800 ${HOVER[a.tone]}`}
              >
                <span aria-hidden="true" className={`lx-pop lx-wiggle grid size-11 place-items-center rounded-2xl ${TILE[a.tone]}`}>
                  <Icon name={a.icon} size={20} />
                </span>
                <span aria-hidden="true" className="lx-nudge absolute top-4 right-4 text-zinc-400 dark:text-zinc-500">
                  →
                </span>
                <span className="min-w-0">
                  <span className="block text-sm leading-5 font-semibold">{a.label}</span>
                  <span className="mt-0.5 block text-sm leading-5 text-zinc-600 dark:text-zinc-400">{a.note}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
