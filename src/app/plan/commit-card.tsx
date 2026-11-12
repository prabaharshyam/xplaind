"use client";

import { useEffect, useId, useState } from "react";
import { Icon } from "@/components/art/icons";
import { AuthChoice } from "@/components/account/auth-choice";
import { useAccountState } from "@/components/account-link";
import { primaryButton, secondaryButton } from "@/components/ui";
import { COMMIT_CONSENT } from "@/lib/commit/plan";

type Status = { active: false } | { active: true; pathId: string; week: number };

/**
 * CM-90: opt in to one email a week for 13 weeks, or stop them. Off unless the learner ticks the box.
 * FOCUS-2: part of "Stay on track" on /plan, beside the weekly plan and its calendar reminder.
 */
export function CommitCard({ paths, defaultPath }: { paths: { id: string; name: string }[]; defaultPath: string }) {
  const account = useAccountState();
  const [status, setStatus] = useState<Status | null>(null);
  const [pathId, setPathId] = useState(defaultPath);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ids = { path: useId(), consent: useId() };

  useEffect(() => {
    if (account !== "in") return;
    fetch("/api/commit")
      .then((r) => (r.ok ? r.json() : { active: false }))
      .then(setStatus)
      .catch(() => setStatus({ active: false }));
  }, [account]);

  const call = async (method: "POST" | "DELETE") => {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/commit", {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify({ pathId, consent: true }) : undefined,
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      const body = (await res?.json().catch(() => null)) as { error?: string } | null;
      return setError(body?.error ?? "Something went wrong. Please try again.");
    }
    setStatus(method === "POST" ? { active: true, pathId, week: 1 } : { active: false });
  };

  // Accounts switched off: the plan and calendar reminder still work, so the email offer just stays hidden.
  if (account === "off" || account === "unknown") return null;
  if (account === "out")
    return (
      <section aria-labelledby="commit-h" className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 id="commit-h" className="font-semibold">
          A Monday email for 13 weeks
        </h2>
        <p className="mt-1 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          With an account, get one short email each Monday: what you finished and your next three lessons. Stop with one click.
        </p>
        <AuthChoice reason="progress" className="mt-3" />
      </section>
    );
  if (!status) return null;
  const pathName = (id: string) => paths.find((p) => p.id === id)?.name ?? id;

  return (
    <section aria-labelledby="commit-h" className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 id="commit-h" className="flex items-center gap-2 font-semibold">
        <Icon name="fire" size={18} />
        A Monday email for 13 weeks
      </h2>
      {status.active ? (
        <>
          <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">
            You are in week {status.week} of 13 on {pathName(status.pathId)}. Every Monday morning you get one email with your progress and the next lessons.
          </p>
          <button type="button" className={`${secondaryButton} mt-4`} disabled={busy} onClick={() => void call("DELETE")}>
            Stop the weekly emails
          </button>
        </>
      ) : (
        <>
          <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">
            Learning sticks when it is steady. Get one short email every Monday for 13 weeks: what you finished, and the next three lessons on your path. Stop with one click, any time.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <label htmlFor={ids.path} className="text-sm font-medium">
              Your path
            </label>
            <select id={ids.path} value={pathId} onChange={(e) => setPathId(e.target.value)} className="min-h-11 rounded-2xl border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950">
              {paths.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <label htmlFor={ids.consent} className="flex items-start gap-3 text-sm leading-6">
              <input id={ids.consent} type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 size-5 shrink-0 accent-violet-700" />
              {COMMIT_CONSENT}
            </label>
            <button type="button" className={`${primaryButton} self-start`} disabled={!consent || busy} onClick={() => void call("POST")}>
              Start my 90 days
            </button>
          </div>
        </>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-rose-800 dark:text-rose-300">
          {error}
        </p>
      )}
    </section>
  );
}
