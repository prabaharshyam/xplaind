"use client";

// FC-1 (2026-11-27, owner: "a minimalistic Pomodoro timer like StudyFetch has, so that the user can read with focus
// and track"): a focus timer in the top bar, on every page. The button shows the time left while it runs; the panel
// is a native popover, so the page stays readable and usable around it. Kept on this device only.
import { useEffect, useState } from "react";
import { Icon } from "@/components/art/icons";
import { useToday } from "@/lib/browser/hooks";
import { readFocus, saveFocus, useFocus } from "@/lib/browser/focus-store";
import { todayInIST } from "@/lib/dates";
import { PRESETS, choose, clock, lastDays, lengthOf, next, pause, presetOf, remaining, reset, running, start } from "@/lib/focus";

/** A soft two-note chime. Silent where the browser has no audio. */
function chime() {
  try {
    const ctx = new AudioContext();
    [660, 880].forEach((hz, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const at = ctx.currentTime + i * 0.25;
      osc.frequency.value = hz;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.15, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.6);
    });
    setTimeout(() => void ctx.close(), 1500);
  } catch {
    // No audio here.
  }
}

const update = (f: (s: ReturnType<typeof readFocus>) => Partial<ReturnType<typeof readFocus>>) => {
  const cur = readFocus();
  saveFocus({ ...cur, ...f(cur) });
};

export function FocusTimer() {
  const focus = useFocus();
  const today = useToday();
  const [now, setNow] = useState(0);
  const [said, setSaid] = useState("");
  const on = running(focus.state);
  const endsAt = focus.state.endsAt;

  // While running: tick each second, and move on when the time is up (also on return to a page after it ended).
  useEffect(() => {
    if (endsAt === null) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t < endsAt) return;
      const cur = readFocus();
      if (cur.state.endsAt !== endsAt) return; // another tab got here first
      const done = next(cur.state, cur.log, todayInIST(new Date(t)), true);
      saveFocus({ ...cur, ...done });
      if (cur.sound && t - endsAt < 5_000) chime();
      setSaid(cur.state.phase === "focus" ? `Focus block done. Take a ${presetOf(cur.state.preset).rest} minute break.` : "Break over. Ready to focus again.");
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const left = on && now ? remaining(focus.state, now) : focus.state.left; // until the first tick, the time it started from
  const total = lengthOf(focus.state.preset, focus.state.phase);
  const days = today ? lastDays(focus.log, today) : [];
  const todayLog = (today && focus.log[today]) || { sessions: 0, minutes: 0 };
  const week = days.reduce((n, d) => n + d.minutes, 0);
  const most = Math.max(25, ...days.map((d) => d.minutes));
  const rest = focus.state.phase === "rest";

  const btn = "flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700";

  return (
    <>
      <button
        type="button"
        popoverTarget="focus-timer"
        data-focus-on={on || undefined}
        className={`xp-glass-btn flex h-10 items-center justify-center gap-1.5 rounded-full text-sm text-zinc-700 dark:text-zinc-200 ${on ? "px-3 font-medium tabular-nums max-sm:px-2.5" : "w-10"}`}
      >
        <span className={on ? "max-sm:hidden" : ""}>
          <Icon name="timer" size={16} />
        </span>
        <span className="sr-only">Focus timer{on ? `, ${rest ? "break" : "focus"} running` : ""}</span>
        {on && <span aria-hidden="true">{clock(left)}</span>}
      </button>
      <p className="sr-only" role="status">{said}</p>
      <div
        id="focus-timer"
        popover="auto"
        aria-label="Focus timer"
        className="m-0 w-[min(20rem,calc(100vw-1rem))] rounded-3xl bg-white p-5 text-zinc-900 shadow-xl shadow-black/10 ring-1 ring-zinc-200 [inset:4.5rem_0.5rem_auto_auto] md:[inset:4.75rem_1rem_auto_auto] dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{rest ? "Break" : "Focus"}</h2>
          <button type="button" popoverTarget="focus-timer" popoverTargetAction="hide" className="-mr-2 grid size-11 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10">
            <Icon name="close" size={16} />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <p className="mt-1 text-center text-5xl font-semibold tabular-nums">
          <span className="sr-only">Time left: </span>
          {clock(left)}
        </p>
        <div aria-hidden="true" className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className={`h-full origin-left rounded-full ${rest ? "bg-emerald-600" : "bg-brand-700 dark:bg-brand-300"}`}
            style={{ transform: `scaleX(${1 - left / total})` }}
          />
        </div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => update((c) => ({ state: running(c.state) ? pause(c.state, Date.now()) : start(c.state, Date.now()) }))}
            className={`${btn} flex-1 bg-brand-700 text-white hover:bg-brand-800 dark:bg-brand-300 dark:text-brand-950`}
          >
            {on ? "Pause" : left < total ? "Resume" : rest ? "Start break" : "Start focus"}
          </button>
          <button type="button" onClick={() => update((c) => ({ state: reset(c.state) }))} className={`${btn} bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10`}>
            Reset
          </button>
          <button type="button" onClick={() => update((c) => next(c.state, c.log, todayInIST(), false))} className={`${btn} bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10`}>
            Skip
          </button>
        </div>
        <fieldset className="mt-4">
          <legend className="sr-only">Length</legend>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={focus.state.preset === p.id}
                disabled={on}
                onClick={() => update(() => ({ state: choose(p.id) }))}
                className="min-h-11 rounded-full text-sm ring-1 ring-zinc-200 hover:bg-zinc-50 disabled:opacity-60 aria-pressed:bg-brand-50 aria-pressed:font-medium aria-pressed:text-brand-900 aria-pressed:ring-brand-700 dark:ring-zinc-700 dark:hover:bg-white/5 dark:aria-pressed:bg-brand-950 dark:aria-pressed:text-brand-100 dark:aria-pressed:ring-brand-300"
              >
                <span aria-hidden="true">{p.focus} / {p.rest}</span>
                <span className="sr-only">{p.label}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <div className="mt-5 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <p className="text-sm">
            Today: <strong>{todayLog.sessions}</strong> {todayLog.sessions === 1 ? "block" : "blocks"}, <strong>{todayLog.minutes}</strong> min
          </p>
          <div aria-hidden="true" className="mt-3 flex h-10 items-end gap-1.5">
            {days.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col justify-end self-stretch rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div className="rounded-full bg-brand-700 dark:bg-brand-300" style={{ height: `${(d.minutes / most) * 100}%` }} />
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">Last 7 days: {week} min. Kept on this device only.</p>
          <label className="mt-3 flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={focus.sound} onChange={(e) => update(() => ({ sound: e.target.checked }))} className="size-4 accent-brand-700" />
            Play a sound when time is up
          </label>
        </div>
      </div>
    </>
  );
}
