"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/art/icons";

/** Shown while the model works: AI answers can take up to a minute, so say what is happening. */
export function AiWorking({ steps }: { steps: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => Math.min(n + 1, steps.length - 1)), 6000);
    return () => clearInterval(t);
  }, [steps.length]);
  return (
    <div role="status" className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-5 dark:border-violet-900 dark:from-violet-950/40 dark:to-fuchsia-950/30">
      <p className="flex items-center gap-2 font-medium">
        <span className="grid size-8 animate-pulse place-items-center rounded-full bg-violet-600 text-white">
          <Icon name="sparkles" size={16} />
        </span>
        {steps[i]}
      </p>
      <ol className="mt-3 flex flex-wrap gap-2 text-xs" aria-hidden="true">
        {steps.map((s, j) => (
          <li key={s} className={`rounded-full px-2.5 py-1 ${j <= i ? "bg-violet-600 text-white" : "bg-white/70 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"}`}>
            {j + 1}
          </li>
        ))}
      </ol>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">This usually takes 20 to 60 seconds. Please keep this page open.</p>
    </div>
  );
}

export function AiError({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
      {message}
    </p>
  );
}
