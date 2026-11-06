"use client";

import { type ReactNode, useRef, useState } from "react";

/** A code block with a "Copy" button in its corner (2026-11-06, owner request). */
export function CopyCode({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const text = box.current?.querySelector("pre")?.textContent ?? "";
    const code = text.replace(/\n$/, "");
    let ok = false;
    try {
      await navigator.clipboard.writeText(code);
      ok = true;
    } catch {
      // Older browsers, or a blocked clipboard: copy through a hidden text box instead.
      const area = document.createElement("textarea");
      area.value = code;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.append(area);
      area.select();
      ok = document.execCommand("copy");
      area.remove();
    }
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div ref={box} className="relative">
      {children}
      <button
        type="button"
        onClick={copy}
        className="absolute top-2 right-2 rounded-full border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-violet-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
      >
        <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
        <span className="sr-only"> code</span>
      </button>
    </div>
  );
}
