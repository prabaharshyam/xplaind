"use client";

import Link from "next/link";
import { useAccountState } from "@/components/account-link";
import { Icon } from "@/components/art/icons";
import { primaryButton } from "@/components/ui";
import { SIGNUP_EVENT } from "@/lib/browser/account-sync";

/**
 * RG-1 (owner decision, 2026-11-10): once accounts are on, a signed-out visitor sees a preview of a roadmap
 * (the first part) and then this card. "unknown" (the session is still loading, and what search engines
 * get in the HTML) also shows the preview, so the full roadmap appears only for signed-in learners.
 * While accounts are off (sign-ups on hold), roadmaps stay fully open.
 */
export function useRoadmapLocked(): boolean {
  const account = useAccountState();
  return account === "out" || account === "unknown";
}

export function RoadmapGate({
  topics,
  sections,
}: {
  topics: number;
  sections?: number;
}) {
  return (
    <section
      aria-labelledby="roadmap-gate-h"
      className="rounded-2xl border border-violet-200 bg-violet-50 p-5 md:p-6 dark:border-violet-900 dark:bg-violet-950"
    >
      <h2
        id="roadmap-gate-h"
        className="flex items-center gap-2 text-lg font-semibold"
      >
        <Icon name="lock" size={18} /> Sign up free to see the full roadmap
      </h2>
      <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">
        {sections ? `All ${sections} stages and ` : "All "}
        {topics} topics in order, with your progress saved on every device.
        Free, no card needed.
      </p>
      <button
        type="button"
        className={`${primaryButton} mt-4`}
        onClick={() =>
          window.dispatchEvent(
            new CustomEvent(SIGNUP_EVENT, { detail: { reason: "roadmap" } }),
          )
        }
      >
        Sign up free
      </button>
      <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Accounts are for learners aged 18 and over. Under 18? Every lesson is
        still open:{" "}
        <Link
          href="/topics"
          className="font-medium text-violet-800 underline underline-offset-2 dark:text-violet-300"
        >
          browse lessons by topic
        </Link>
        .
      </p>
    </section>
  );
}
