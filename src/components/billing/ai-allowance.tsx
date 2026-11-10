"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AI_USED_EVENT } from "@/components/ai/ai-client";
import type { AiKind } from "@/lib/ai/limits";

type Usage = { show: false } | { show: true; tier: "guest" | "free" | "pro"; used: number; limit: number };

/** PAY-4: "4 of 10 AI turns left today", so a learner sees the limit before reaching it. Shown only once Pro is open. */
export function AiAllowance({ kind, label }: { kind: AiKind; label: string }) {
  const [usage, setUsage] = useState<Usage>({ show: false });
  const load = useCallback(() => {
    fetch(`/api/ai/usage?kind=${kind}`)
      .then((r) => (r.ok ? r.json() : { show: false }))
      .then((u: Usage) => setUsage(u))
      .catch(() => setUsage({ show: false }));
  }, [kind]);

  useEffect(() => {
    load();
    window.addEventListener(AI_USED_EVENT, load);
    return () => window.removeEventListener(AI_USED_EVENT, load);
  }, [load]);

  if (!usage.show) return null;
  const left = Math.max(0, usage.limit - usage.used);
  const pro = usage.tier === "pro";
  return (
    <p aria-live="polite" className="mb-3 inline-flex flex-wrap items-center gap-x-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
      <span>
        {left} of {usage.limit} {pro ? "Pro " : ""}{label} left today
      </span>
      {!pro && (
        <Link href="/pricing" className="font-medium text-violet-800 underline underline-offset-2 dark:text-violet-300">
          Get more with Pro
        </Link>
      )}
    </p>
  );
}
