"use client";

import { type ReactNode, useState } from "react";
import { Icon } from "@/components/art/icons";
import { CodeRunner } from "./code-runner";

/** PG-4: a lesson's Python example, shown as written, that can be opened as a runnable editor. */
export function RunnableCode({ code, aiOn, children }: { code: string; aiOn: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  if (open) return <div className="not-prose my-5"><CodeRunner initialCode={code} aiOn={aiOn} compact label="Try it: edit and run" /></div>;
  return (
    <div className="my-5">
      {children}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="not-prose -mt-2 inline-flex min-h-11 items-center gap-2 rounded-full bg-violet-700 px-4 text-sm font-medium text-white hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
      >
        <Icon name="play" size={14} /> Run this code
      </button>
    </div>
  );
}
