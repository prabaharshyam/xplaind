"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { muted, primaryButton, secondaryButton, textLink } from "@/components/ui";
import { WEEKLY_HOUR_CHOICES } from "@/lib/placement/estimate";

type Card = { id: string; level: string; weeks_active: number; display_name: string | null };

async function call(path: string, method: string, body?: unknown): Promise<{ ok: boolean; data: { error?: string } & Record<string, unknown> }> {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}

export function Settings({ email, weeklyHours }: { email: string | null; weeklyHours: number | null }) {
  const router = useRouter();
  const [hours, setHours] = useState(weeklyHours ?? 5);
  const [hoursSaved, setHoursSaved] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[] | null>(null);
  const [name, setName] = useState("");
  const [cardError, setCardError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadCards = () => call("/api/card", "GET").then(({ data }) => setCards((data.cards as Card[]) ?? []));
  useEffect(() => {
    void loadCards();
  }, []);

  return (
    <div className="mt-6 flex flex-col gap-10">
      <p className={`text-sm ${muted}`}>Signed in as {email}</p>

      <section aria-labelledby="hours-heading" className="flex flex-col gap-3">
        <h2 id="hours-heading" className="text-xl font-semibold">
          Weekly hours
        </h2>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const { ok, data } = await call("/api/profile", "POST", { weeklyHours: hours });
            setHoursSaved(ok ? "Saved." : (data.error ?? "Could not save."));
          }}
        >
          <label className="flex flex-col gap-1">
            <span className="text-sm">Hours a week</span>
            <select
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="min-h-12 rounded-lg border border-zinc-400 bg-white px-3 dark:border-zinc-600 dark:bg-zinc-950"
            >
              {WEEKLY_HOUR_CHOICES.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={secondaryButton}>
            Save
          </button>
          <span role="status" className={`text-sm ${muted}`}>
            {hoursSaved}
          </span>
        </form>
      </section>

      <section aria-labelledby="card-heading" className="flex flex-col gap-3">
        <h2 id="card-heading" className="text-xl font-semibold">
          Level card
        </h2>
        <p className={`leading-7 ${muted}`}>
          A picture of your level to share, with only your level, goal, weeks active and, if you want, your first name. No
          email, photo or dates. Anyone with the link can see it; delete it any time.
        </p>
        <form
          className="flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const { ok, data } = await call("/api/card", "POST", name.trim() ? { displayName: name.trim() } : {});
            setCardError(ok ? null : (data.error ?? "Could not create the card."));
            if (ok) {
              setName("");
              await loadCards();
            }
          }}
        >
          <label className="flex flex-col gap-1">
            <span className="text-sm">First name on the card (optional)</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              autoComplete="given-name"
              className="min-h-12 rounded-lg border border-zinc-400 px-3 dark:border-zinc-600 dark:bg-zinc-950"
            />
          </label>
          {cardError && (
            <p role="alert" className="text-sm text-red-800 dark:text-red-400">
              {cardError}
            </p>
          )}
          <button type="submit" className={primaryButton}>
            Make a level card
          </button>
        </form>
        {cards && cards.length > 0 && (
          <ul className="flex flex-col gap-2">
            {cards.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                <Link href={`/card/${c.id}`} className={textLink}>
                  {c.level}
                  {c.display_name ? ` · ${c.display_name}` : ""} · {c.weeks_active} weeks
                </Link>
                <button
                  type="button"
                  className="text-sm text-red-800 underline dark:text-red-400"
                  onClick={async () => {
                    await call("/api/card", "DELETE", { id: c.id });
                    await loadCards();
                  }}
                >
                  Delete card
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="data-heading" className="flex flex-col gap-3">
        <h2 id="data-heading" className="text-xl font-semibold">
          Your data
        </h2>
        <a href="/api/export" className={secondaryButton} download>
          Download my data (JSON)
        </a>
        {!confirmDelete ? (
          <button type="button" className={secondaryButton} onClick={() => setConfirmDelete(true)}>
            Delete my account
          </button>
        ) : (
          <div className="flex flex-col gap-3 rounded-lg border border-red-300 p-4 dark:border-red-800" role="alert">
            <p className="leading-7">
              This deletes your account and everything saved with it: results, progress, ratings, badges and cards. It
              cannot be undone. Progress saved on this device stays here until you clear it.
            </p>
            {deleteError && <p className="text-sm text-red-800 dark:text-red-400">{deleteError}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-red-700 px-5 font-medium text-white hover:bg-red-800"
                onClick={async () => {
                  const { ok, data } = await call("/api/account", "DELETE");
                  if (ok) {
                    router.push("/?deleted=1");
                    router.refresh();
                  }
                  else setDeleteError(data.error ?? "Could not delete the account.");
                }}
              >
                Delete everything
              </button>
              <button type="button" className={secondaryButton} onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <form action="/auth/signout" method="post">
        <button type="submit" className={secondaryButton}>
          Sign out
        </button>
      </form>
    </div>
  );
}
