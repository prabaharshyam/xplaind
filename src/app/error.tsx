"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLoader } from "@/components/brand-loader";
import { primaryButton, secondaryButton } from "@/components/ui";
import { isStaleDeployError, reloadOnce } from "@/lib/browser/chunk-error";

/**
 * UX-1: a friendly page instead of the browser's bare "Application error". After a new release, a
 * page left open can miss code files; that case reloads itself once. Anything else offers a retry.
 */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const stale = isStaleDeployError(error);
  // Decided once, on the first render: reload quietly if allowed, else show the retry page.
  const [reloading] = useState(() => stale && typeof window !== "undefined" && reloadOnce());

  useEffect(() => {
    console.error(error);
  }, [error]);

  if (reloading) {
    return (
      <main className="grid min-h-[60vh] place-items-center px-4">
        <BrandLoader label="Xplaind just got an update. Loading the new version" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-start justify-center gap-4 px-4 py-16">
      <p className="text-sm font-semibold text-violet-800 dark:text-violet-300">Something went wrong</p>
      <h1 className="text-3xl font-semibold tracking-tight text-balance">This page did not load properly</h1>
      <p className="leading-7 text-zinc-700 dark:text-zinc-300">
        It is usually a weak connection or a short hiccup on our side. Your progress is safe. Try again, and if it keeps happening, go back
        to the home page.
      </p>
      <div className="mt-2 flex flex-wrap gap-3">
        <button type="button" onClick={() => retry()} className={primaryButton}>
          Try again
        </button>
        <Link href="/" className={secondaryButton}>
          Go to the home page
        </Link>
      </div>
    </main>
  );
}
