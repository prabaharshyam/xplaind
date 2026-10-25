"use client";

import { useProgress } from "@/lib/browser/hooks";
import { setPath } from "@/lib/browser/progress-store";
import { secondaryButton } from "./ui";

/** Makes a path the learner's own, on this device and, when signed in, on their account. */
export function ChoosePath({ pathId }: { pathId: string }) {
  const { path } = useProgress();
  if (path === pathId) return <p className="font-medium">This is your path.</p>;
  return (
    <button type="button" className={secondaryButton} onClick={() => setPath(pathId)}>
      Make this my path
    </button>
  );
}
