"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Icon } from "@/components/art/icons";
import { useCurrentPathId } from "@/lib/browser/hooks";
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

/**
 * APP-3 (2026-11-27, owner: "once signed in an app interface where users can learn, download roadmaps, do mock
 * interviews, use the resume reviewer, flashcards and every feature"): the top of the app Home. A greeting, an "Ask
 * anything" box that opens the AI tutor with the question typed in (not sent: the learner sends it, so no AI use
 * happens without them), and the main things to do as cards with springy icon tiles (APP-2).
 */
export function AppHome({ paths }: { paths: { id: string; name: string }[] }) {
  const greeting = useGreeting();
  const pathId = useCurrentPathId(paths.map((p) => p.id));
  const pathName = paths.find((p) => p.id === pathId)?.name ?? "your roadmap";
  const actions: Action[] = [
    { href: `/roadmap/${pathId}`, label: "Continue my roadmap", note: pathName, icon: "map", tone: "teal" },
    { href: "/interview/simulator", label: "Mock interview", note: "Answer out loud, get a report", icon: "mic", tone: "rose" },
    { href: "/ai/resume", label: "Review my resume", note: "Fixes that get you shortlisted", icon: "cert", tone: "emerald" },
    { href: "/ai/book", label: "Study from my notes", note: "Tests and flashcards from a PDF", icon: "book", tone: "amber" },
    { href: "/practice", label: "Flashcards", note: "Interview questions to practise", icon: "check", tone: "sky" },
    { href: `/roadmap/${pathId}#download`, label: "Download my roadmap", note: "A PDF checklist of every topic", icon: "download", tone: "teal" },
    { href: "/plan", label: "Plan my week", note: "Lessons sized to your hours", icon: "target", tone: "amber" },
    { href: "/jobs", label: "Jobs and salaries", note: "Pay by role and live openings", icon: "star", tone: "emerald" },
  ];
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{greeting}</h1>
      <form action="/ai/tutor" method="get" role="search" aria-label="Ask the AI tutor" className="flex items-center gap-2 rounded-3xl bg-white p-2 shadow-sm ring-1 ring-zinc-200 focus-within:ring-2 focus-within:ring-brand-700 dark:bg-zinc-900 dark:ring-zinc-800 dark:focus-within:ring-brand-300">
        <span aria-hidden="true" className={`grid size-10 shrink-0 place-items-center rounded-2xl ${TILE.teal}`}>
          <Icon name="sparkles" size={18} />
        </span>
        <label htmlFor="home-ask" className="sr-only">
          Ask anything about AI
        </label>
        <input id="home-ask" name="q" type="text" required maxLength={1000} placeholder="Ask anything about AI…" className="min-w-0 flex-1 bg-transparent px-1 text-base outline-none placeholder:text-zinc-500" />
        <button type="submit" className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-700 text-white hover:bg-brand-800 dark:bg-brand-300 dark:text-brand-950">
          <Icon name="send" size={18} />
          <span className="sr-only">Ask the AI tutor</span>
        </button>
      </form>
      <section aria-labelledby="quick-h">
        <h2 id="quick-h" className="text-lg font-semibold">
          What would you like to do?
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {actions.map((a) => (
            <li key={a.label}>
              <Link
                href={a.href}
                className="lx-lift flex h-full flex-col gap-3 rounded-3xl bg-white p-4 ring-1 ring-zinc-200 hover:ring-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:bg-zinc-900 dark:ring-zinc-800"
              >
                <span aria-hidden="true" className={`lx-pop grid size-11 place-items-center rounded-2xl ${TILE[a.tone]}`}>
                  <Icon name={a.icon} size={20} />
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
