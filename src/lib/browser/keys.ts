// APP-2: keyboard shortcuts for decks and quizzes (Space flips, 1 to 3 rate). A key is ignored while the learner is
// typing or has a control focused that uses the key itself.
import { useEffect, useRef } from "react";

const typing = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A", "SUMMARY"].includes(el.tagName);
};

/** Calls handler(key) for plain key presses (no modifier), unless focus is in a field or on a control. */
export function useShortcut(handler: (key: string) => boolean | void, on = true) {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => {
    if (!on) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || typing(e.target)) return;
      if (ref.current(e.key) === true) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [on]);
}
