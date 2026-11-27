"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/art/icons";

/**
 * APP-2: a small confirmation pill at the top of the screen (StudyFetch's toast: a check and a few words, gone after
 * about two seconds). Call toast("Saved") from anywhere in the browser; the <Toaster /> in the layout shows it. It
 * slides in and out; under reduced motion it just appears and goes. Announced politely to screen readers.
 */
const EVENT = "xplaind:toast";

export function toast(message: string): void {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: message }));
}

export function Toaster() {
  const [msg, setMsg] = useState<{ text: string; n: number } | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    let hide = 0;
    let gone = 0;
    const on = (e: Event) => {
      window.clearTimeout(hide);
      window.clearTimeout(gone);
      setMsg((m) => ({ text: (e as CustomEvent<string>).detail, n: (m?.n ?? 0) + 1 }));
      requestAnimationFrame(() => setShown(true));
      hide = window.setTimeout(() => setShown(false), 2200);
      gone = window.setTimeout(() => setMsg(null), 2600);
    };
    window.addEventListener(EVENT, on);
    return () => {
      window.removeEventListener(EVENT, on);
      window.clearTimeout(hide);
      window.clearTimeout(gone);
    };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex justify-center px-4" role="status" aria-live="polite">
      {msg && (
        <p
          key={msg.n}
          className={`flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-transform duration-200 ease-out dark:bg-white dark:text-zinc-900 ${shown ? "translate-y-0" : "-translate-y-20"}`}
        >
          <span aria-hidden="true" className="grid size-5 place-items-center rounded-full bg-emerald-500 text-white">
            <Icon name="tick" size={12} />
          </span>
          {msg.text}
        </p>
      )}
    </div>
  );
}
