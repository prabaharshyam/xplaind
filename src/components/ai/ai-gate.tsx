"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { Icon } from "@/components/art/icons";
import { primaryButton } from "@/components/ui";
import { browserClient } from "@/lib/supabase/browser";

export type AiAccess = "loading" | "off" | "signed-out" | "on";

/** Whether this visitor can use AI: switched on for the site, and signed in. */
export function useAiAccess(enabled: boolean): AiAccess {
  const [state, setState] = useState<AiAccess>(enabled ? "loading" : "off");
  useEffect(() => {
    if (!enabled) return;
    const client = browserClient();
    if (!client) {
      queueMicrotask(() => setState("off"));
      return;
    }
    void client.auth.getSession().then(({ data }) => setState(data.session ? "on" : "signed-out"));
    const { data } = client.auth.onAuthStateChange((_e, session) => setState(session ? "on" : "signed-out"));
    return () => data.subscription.unsubscribe();
  }, [enabled]);
  return state;
}

/** Shows children only to signed-in learners when AI is on; otherwise explains why not. */
export function AiGate({ access, next, children }: { access: AiAccess; next: string; children: ReactNode }) {
  if (access === "on") return <>{children}</>;
  if (access === "loading") return <p className="text-zinc-600 dark:text-zinc-400">Checking your account…</p>;
  if (access === "signed-out")
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/40">
        <p className="flex items-center gap-2 font-semibold">
          <Icon name="lock" size={18} /> Sign in to use AI features
        </p>
        <p className="mt-1 text-zinc-700 dark:text-zinc-300">
          AI features are free for signed-in learners aged 18 or over, with a small daily allowance so everyone gets a turn.
        </p>
        <Link href={`/signin?next=${encodeURIComponent(next)}`} className={`${primaryButton} mt-4`}>
          Sign in with email
        </Link>
      </div>
    );
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="flex items-center gap-2 font-semibold">
        <Icon name="sparkles" size={18} /> AI features are not switched on yet
      </p>
      <p className="mt-1 text-zinc-700 dark:text-zinc-300">
        They are coming soon. Everything else on Xplaind works today: the{" "}
        <Link href="/paths" className="underline underline-offset-2">
          roadmaps
        </Link>
        , lessons and interview practice.
      </p>
    </div>
  );
}
