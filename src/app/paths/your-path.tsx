"use client";

import Link from "next/link";
import { textLink } from "@/components/ui";
import { useProgress } from "@/lib/browser/hooks";
import { roadmapHref } from "@/lib/paths";

/** Names the path chosen on this device, if any. */
export function YourPath({ paths }: { paths: { id: string; name: string }[] }) {
  const { path } = useProgress();
  const chosen = paths.find((p) => p.id === path);
  if (!chosen) return null;
  return (
    <p className="mt-4 rounded-lg bg-zinc-100 p-4 leading-7 dark:bg-zinc-900">
      Your path is{" "}
      <Link href={roadmapHref(chosen.id)} className={textLink}>
        {chosen.name}
      </Link>
      .
    </p>
  );
}
