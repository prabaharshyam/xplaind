"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/art/icons";
import { AiAllowance } from "@/components/billing/ai-allowance";
import { useAccountState } from "@/components/account-link";
import { primaryButton } from "@/components/ui";
import type { AiKind } from "@/lib/ai/limits";
import { SIGNUP_EVENT } from "@/lib/browser/account-sync";

/** "signin": AI is on but this visitor has no account (AG-1, 2026-11-10: no AI without an account). */
export type AiAccess = "off" | "on" | "signin";

/**
 * Whether this visitor can use AI. AG-1 (owner decision, 2026-11-10): once accounts are on, AI needs a
 * signed-in account; the server refuses guests too. While accounts are off (sign-ups on hold), AI stays
 * open as before (SU-5). "unknown" (the session is still loading) counts as on, so signed-in learners
 * see no flash of the sign-in card; the server still refuses a guest who acts before it loads.
 */
export function useAiAccess(enabled: boolean): AiAccess {
  const account = useAccountState();
  if (!enabled) return "off";
  return account === "out" ? "signin" : "on";
}

/** Shows children when AI is on, with today's allowance for `kind` (PAY-4); otherwise explains that it is not switched on yet. */
export function AiGate({
  access,
  kind,
  label = "AI turns",
  children,
}: {
  access: AiAccess;
  next?: string;
  kind?: AiKind;
  label?: string;
  children: ReactNode;
}) {
  if (access === "on")
    return (
      <>
        {kind && <AiAllowance kind={kind} label={label} />}
        {children}
      </>
    );
  if (access === "signin")
    return (
      <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 dark:border-violet-900 dark:bg-violet-950">
        <p className="flex items-center gap-2 font-semibold">
          <Icon name="lock" size={18} /> Sign up free to use the AI tools
        </p>
        <p className="mt-1 leading-7 text-zinc-700 dark:text-zinc-300">
          The AI tutor, interview feedback, resume review and the other AI tools
          need a free account. Lessons, topics and practice stay open without
          one.
        </p>
        <button
          type="button"
          className={`${primaryButton} mt-3`}
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent(SIGNUP_EVENT, { detail: { reason: "ai" } }),
            )
          }
        >
          Sign up free
        </button>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Accounts are for learners aged 18 and over.
        </p>
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
