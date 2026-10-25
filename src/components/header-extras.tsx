"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/art/icons";
import { SearchBox } from "@/components/search-box";
import { useGame } from "@/lib/browser/hooks";

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
        className="flex h-9 items-center gap-2 rounded-full border border-black/10 px-3 text-[13px] text-zinc-600 hover:bg-black/5 dark:border-white/15 dark:text-zinc-300 dark:hover:bg-white/10"
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

/** XP and streak, once the learner has any. Links to their progress page. */
export function XpChip() {
  const game = useGame();
  if (game.xp === 0 && game.streak === 0) return null;
  return (
    <Link
      href="/dashboard"
      className="flex h-9 items-center gap-2 rounded-full bg-amber-100 px-3 text-[13px] font-medium text-amber-900 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-200"
    >
      {game.streak > 0 && (
        <span className="flex items-center gap-1">
          <Icon name="fire" size={15} /> {game.streak}
          <span className="sr-only">-day streak,</span>
        </span>
      )}
      <span>{game.xp} XP</span>
    </Link>
  );
}
