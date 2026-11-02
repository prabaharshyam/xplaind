"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/art/icons";

export type AiAccess = "off" | "on";

/**
 * Whether this visitor can use AI. SU-5: no account is needed, so it is simply whether AI is
 * switched on for the site; the server still applies the daily allowance and the monthly cap.
 */
export function useAiAccess(enabled: boolean): AiAccess {
  return enabled ? "on" : "off";
}

/** Shows children when AI is on; otherwise explains that it is not switched on yet. */
export function AiGate({ access, children }: { access: AiAccess; next?: string; children: ReactNode }) {
  if (access === "on") return <>{children}</>;
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
