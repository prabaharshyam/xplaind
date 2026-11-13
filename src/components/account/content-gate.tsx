"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAccountState } from "@/components/account-link";
import { Icon } from "@/components/art/icons";
import type { SignUpReason } from "@/lib/browser/account-sync";
import { AuthChoice } from "./auth-choice";

/**
 * CG-1 (owner decision, 2026-11-13): every lesson, video, course and project guide stays free, and
 * anyone (and search engines) sees a preview. The rest needs a free account. Signed out, or while
 * the session is still loading (what search engines get in the HTML), the gate card takes the
 * place of the rest. With accounts off (sign-ups on hold), nothing is hidden.
 */
export function useContentLocked(): boolean {
  const state = useAccountState();
  return state === "out" || state === "unknown";
}

export function ContentGate({
  reason,
  title,
  text,
  children,
  fallback,
}: {
  reason: SignUpReason;
  title: string;
  text: string;
  children: ReactNode;
  /** What to show instead when locked; the gate card by default. Pass null to show nothing. */
  fallback?: ReactNode;
}) {
  const locked = useContentLocked();
  if (!locked) return <>{children}</>;
  if (fallback !== undefined) return <>{fallback}</>;
  return <GateCard reason={reason} title={title} text={text} />;
}

export function GateCard({ reason, title, text }: { reason: SignUpReason; title: string; text: string }) {
  return (
    <section aria-label={title} className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 md:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Icon name="lock" size={18} className="text-zinc-500 dark:text-zinc-400" /> {title}
      </h2>
      <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">{text} It is free, takes a few seconds and needs no card.</p>
      <AuthChoice reason={reason} className="mt-4" />
      <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Accounts are for learners aged 18 and over. Under 18? The quick answer and the first part of every lesson stay open:{" "}
        <Link href="/topics" className="font-medium text-violet-800 underline underline-offset-2 dark:text-violet-300">
          browse lessons by topic
        </Link>
        .
      </p>
    </section>
  );
}
