"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/art/icons";
import { primaryButton, secondaryButton } from "@/components/ui";
import { UPGRADE_EVENT } from "@/components/ai/ai-client";

/**
 * PAY-4: one prompt for the whole site, opened when an AI helper reaches today's free limit and a
 * Pro pass would give more. It never blocks lessons, roadmaps or the playground, and closes with
 * Escape, the Not now button or a click outside.
 */
export function UpgradePrompt() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<{ message: string; href: string } | null>(null);

  useEffect(() => {
    const open = (e: Event) => {
      const detail = (e as CustomEvent<{ message: string; href: string }>).detail;
      if (!detail?.href?.startsWith("/")) return;
      setState(detail);
      if (!dialog.current?.open) dialog.current?.showModal();
    };
    window.addEventListener(UPGRADE_EVENT, open);
    const d = dialog.current;
    return () => {
      window.removeEventListener(UPGRADE_EVENT, open);
      d?.close();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="upgrade-title"
      onClick={(e) => {
        if (e.target === dialog.current) dialog.current?.close();
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] max-w-none rounded-2xl bg-white p-0 text-zinc-900 backdrop:bg-black/60 dark:bg-zinc-900 dark:text-white"
    >
      <div className="p-6">
        <p className="grid size-10 place-items-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <Icon name="bolt" size={18} />
        </p>
        <h2 id="upgrade-title" className="mt-3 text-xl font-semibold">
          Today&apos;s AI turns are used
        </h2>
        <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">{state?.message}</p>
        <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">
          Lessons, roadmaps, videos, practice cards and the code playground stay free with your account, with no limit.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={state?.href ?? "/pricing"} className={primaryButton} onClick={() => dialog.current?.close()}>
            See Pro passes, from ₹249
          </Link>
          <button type="button" className={secondaryButton} onClick={() => dialog.current?.close()}>
            Not now
          </button>
        </div>
      </div>
    </dialog>
  );
}
