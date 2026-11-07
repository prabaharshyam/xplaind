"use client";

import type { ReactNode } from "react";
import { useAccountState } from "@/components/account-link";
import type { SignUpReason } from "@/lib/browser/account-sync";
import { SignInForm } from "./signin-form";
import { Skeleton } from "@/components/skeleton";

/**
 * SU-1: shows a whole feature only to signed-in learners. Signed out, the sign-up form
 * takes its place and brings the learner back here. With accounts off, nothing is hidden.
 */
export function AccountWall({ reason, next, children }: { reason: SignUpReason; next: string; children: ReactNode }) {
  const state = useAccountState();
  if (state === "off" || state === "in") return <>{children}</>;
  if (state === "unknown") return <Skeleton label="Checking your account…" rows={2} />;
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-violet-100 bg-white p-5 sm:p-6 dark:border-white/10 dark:bg-zinc-950">
      <h2 className="mb-3 text-xl font-semibold tracking-tight">Sign up free to continue</h2>
      <SignInForm next={next} reason={reason} />
    </div>
  );
}
