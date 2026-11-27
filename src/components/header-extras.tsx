"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/art/icons";
import { SearchBox } from "@/components/search-box";
import { useAccountState } from "@/components/account-link";
import { useGame, useToday } from "@/lib/browser/hooks";
import { markVisitSent, recordVisits, visitSentOn } from "@/lib/browser/visits";

/** The search button and dialog. Ctrl K or Cmd K opens it from any page. */
export function HeaderSearch() {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        dialog.current?.showModal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="xp-glass-btn flex size-10 items-center justify-center gap-2 rounded-full text-sm lg:w-auto lg:px-3 text-zinc-700 dark:text-zinc-200 dark:hover:bg-white/10"
      >
        <Icon name="search" size={16} />
        <span className="hidden lg:inline">Search</span>
        <span className="sr-only lg:hidden">Search</span>
      </button>
      <dialog
        ref={dialog}
        aria-label="Search"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
        className="mx-auto mt-[10vh] w-[min(640px,calc(100vw-2rem))] overflow-visible rounded-2xl bg-transparent p-0 backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <SearchBox autoFocus size="lg" onNavigate={() => dialog.current?.close()} />
      </dialog>
    </>
  );
}

/**
 * ST-1: records that the learner opened the site today. The day is kept on this device for everyone; a
 * signed-in learner also tells the server once a day and takes back every day on record, so the streak
 * is the same on a phone and a laptop. Opening the site counts, whether or not a lesson was finished.
 */
function useVisitTracker(state: ReturnType<typeof useAccountState>) {
  const today = useToday();
  useEffect(() => {
    if (!today || state === "unknown") return;
    recordVisits([today]);
    if (state !== "in" || visitSentOn() === today) return;
    void fetch("/api/visit", { method: "POST" })
      .then((r) => (r.ok ? (r.json() as Promise<{ days?: string[] }>) : null))
      .then((d) => {
        if (!d) return;
        recordVisits(d.days ?? []);
        markVisitSent(today);
      })
      .catch(() => {
        // Offline: this device keeps its own days, and the next visit tries again.
      });
  }, [state, today]);
}

/** The day streak. A signed-in learner sees it from the first day; a visitor once it is two days or more. Links to their progress page. APP-8: shown only in the app frame (globals.css). */
export function XpChip() {
  const game = useGame();
  const state = useAccountState();
  useVisitTracker(state);
  if (game.streak === 0 || (state !== "in" && game.streak < 2)) return null;
  return (
    <Link
      href="/dashboard"
      className="xp-streak flex h-10 items-center gap-1 rounded-full bg-amber-100 px-2.5 sm:gap-2 sm:px-3 text-sm font-medium text-amber-900 hover:bg-amber-200 dark:hover:bg-amber-900 dark:bg-amber-950 dark:text-amber-200"
    >
      <Icon name="fire" size={15} /> {game.streak}
      <span className="sr-only">-day streak</span>
    </Link>
  );
}
