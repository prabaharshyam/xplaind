// FC-1: the focus timer and its log, on this device only (localStorage). Nothing reaches our servers. The timer keeps
// the time it ends at, not a count, so it carries on across pages and when the tab is in the background.
import { useMemo, useSyncExternalStore } from "react";
import { z } from "zod";
import { idle, type FocusLog, type FocusState } from "@/lib/focus";
import { read, serverSnapshot, subscribe, write } from "./storage";

export const FOCUS_KEY = "xplaind.focus.v1";
const KEEP_DAYS = 60;

const Stored = z.object({
  version: z.literal(1),
  state: z.object({
    preset: z.enum(["25", "50"]),
    phase: z.enum(["focus", "rest"]),
    endsAt: z.number().nullable(),
    left: z.number().min(0).max(60 * 60_000),
  }),
  log: z.record(z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.object({ sessions: z.number().int().min(0), minutes: z.number().int().min(0) })),
  sound: z.boolean(),
});
export type Focus = { state: FocusState; log: FocusLog; sound: boolean };

export function parseFocus(raw: string | null): Focus {
  try {
    const p = Stored.safeParse(raw ? JSON.parse(raw) : null);
    if (p.success) return { state: p.data.state, log: p.data.log, sound: p.data.sound };
  } catch {
    // Unreadable: start fresh.
  }
  return { state: idle(), log: {}, sound: true };
}

export function useFocus(): Focus {
  const raw = useSyncExternalStore(subscribe, () => read(FOCUS_KEY), serverSnapshot);
  return useMemo(() => parseFocus(raw), [raw]);
}

export const readFocus = () => parseFocus(read(FOCUS_KEY));

export function saveFocus(f: Focus): void {
  const days = Object.keys(f.log).sort().slice(-KEEP_DAYS);
  const log = Object.fromEntries(days.map((d) => [d, f.log[d]]));
  write(FOCUS_KEY, JSON.stringify({ version: 1, state: f.state, log, sound: f.sound }));
}
