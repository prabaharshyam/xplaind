// APP-4: highlights on study notes, kept on this device (localStorage). One colour per point of a set of notes.
import { useMemo, useSyncExternalStore } from "react";
import { read, serverSnapshot, subscribe, write } from "./storage";

export const HIGHLIGHT_STORE = "xplaind.highlights.v1";
export const HIGHLIGHTS = ["emerald", "amber", "sky", "rose"] as const;
export type Highlight = (typeof HIGHLIGHTS)[number];
type All = Record<string, Record<string, Highlight>>;

export function parseHighlights(raw: string | null): All {
  try {
    const v = JSON.parse(raw ?? "{}") as unknown;
    if (!v || typeof v !== "object") return {};
    const out: All = {};
    for (const [notes, points] of Object.entries(v as Record<string, unknown>).slice(0, 50)) {
      if (!points || typeof points !== "object") continue;
      const kept = Object.entries(points as Record<string, unknown>).filter((e): e is [string, Highlight] => /^\d+-\d+$/.test(e[0]) && HIGHLIGHTS.includes(e[1] as Highlight));
      if (kept.length) out[notes.slice(0, 40)] = Object.fromEntries(kept.slice(0, 500));
    }
    return out;
  } catch {
    return {};
  }
}

export function useHighlights(notesId: string): Record<string, Highlight> {
  const raw = useSyncExternalStore(subscribe, () => read(HIGHLIGHT_STORE), serverSnapshot);
  return useMemo(() => parseHighlights(raw)[notesId] ?? {}, [raw, notesId]);
}

/** Sets or clears (color null) the highlight of one point. */
export function setHighlight(notesId: string, point: string, color: Highlight | null): void {
  const all = parseHighlights(read(HIGHLIGHT_STORE));
  const mine = { ...(all[notesId] ?? {}) };
  if (color) mine[point] = color;
  else delete mine[point];
  write(HIGHLIGHT_STORE, JSON.stringify({ ...all, [notesId]: mine }));
}
