"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/art/icons";
import { primaryButton, secondaryButton } from "@/components/ui";
import { useProgress } from "@/lib/browser/hooks";
import { read, write } from "@/lib/browser/storage";
import { todayInIST } from "@/lib/dates";
import { CONSENT_TEXT, DownloadDetails, EXPERIENCE } from "@/lib/download/details";
import { topicStateOf } from "@/lib/roadmap/progress";
import type { RoadmapModel } from "@/lib/roadmap/view";
import { siteUrl } from "@/lib/site";

/** Remembered on this device so a learner gives their details once, not per roadmap. */
const KEY = "xplaind.download.v1";
const remembered = (): { name: string | null } | null => {
  try {
    const v = JSON.parse(read(KEY) ?? "null") as { name?: unknown } | null;
    return v ? { name: typeof v.name === "string" ? v.name : null } : null;
  } catch {
    return null;
  }
};

const field = "min-h-12 w-full rounded-xl border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-900";

/**
 * RD-1, RD-2: download the roadmap as a printable checklist. The first time, the learner
 * gives their name, email, experience and (optionally) phone; under-18s skip the form
 * and nothing is sent (PV-2).
 */
export function DownloadChecklist({ model }: { model: RoadmapModel }) {
  const progress = useProgress();
  const [open, setOpen] = useState(false);
  const [minor, setMinor] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", experience: "", consent: false });
  const ids = { region: useId(), name: useId(), email: useId(), phone: useId(), exp: useId(), err: useId() };

  const make = async (name: string | null) => {
    const { downloadChecklistPdf } = await import("@/lib/download/checklist-pdf");
    await downloadChecklistPdf(model, { name, today: todayInIST(), siteUrl: siteUrl(), stateOf: (id) => topicStateOf(progress.stops, id) });
  };

  const start = async () => {
    const known = remembered();
    if (known) {
      setBusy(true);
      await make(known.name).finally(() => setBusy(false));
      return;
    }
    setOpen(true);
  };

  const submit = async () => {
    setError(null);
    if (minor) {
      setBusy(true);
      await make(null).finally(() => setBusy(false));
      write(KEY, JSON.stringify({ name: null }));
      setOpen(false);
      return;
    }
    const parsed = DownloadDetails.safeParse({ ...form, pathId: model.pathId });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Please check your details.");
    setBusy(true);
    const res = await fetch("/api/roadmap-download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, pathId: model.pathId }),
    }).catch(() => null);
    // 503: saving is not switched on for this deployment yet, so the download still goes ahead.
    if (!res || (!res.ok && res.status !== 503)) {
      setBusy(false);
      if (!res) return setError("Could not reach Xplaind. Check your connection and try again.");
      const msg = ((await res.json().catch(() => null)) as { error?: string } | null)?.error;
      return setError(msg ?? "We could not save your details just now. Please try again later.");
    }
    write(KEY, JSON.stringify({ name: parsed.data.name }));
    await make(parsed.data.name).finally(() => setBusy(false));
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <button type="button" className={`${secondaryButton} self-start`} onClick={() => void (open ? setOpen(false) : start())} aria-expanded={open} aria-controls={ids.region} disabled={busy}>
        <Icon name="check" size={18} /> {busy ? "Making your checklist…" : "Download as a printable checklist (PDF)"}
      </button>

      {open && (
        <section id={ids.region} aria-labelledby={`${ids.region}-h`} className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div>
            <h3 id={`${ids.region}-h`} className="text-lg font-semibold">
              Get the {model.name} checklist
            </h3>
            <p className="mt-1 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              Every topic and project with a box to tick, ready to print. Tell us a little about you first; we use it to send roadmap updates and tips, never to sell.
            </p>
          </div>

          <label className="flex min-h-11 items-center gap-2">
            <input type="checkbox" checked={minor} onChange={(e) => setMinor(e.target.checked)} className="size-5 accent-emerald-700" />I am under 18
          </label>

          {minor ? (
            <p className="rounded-xl bg-zinc-100 p-3 text-sm dark:bg-zinc-900">No details needed. Your checklist downloads straight away, and nothing is sent to us.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label htmlFor={ids.name} className="font-medium">
                  Name
                </label>
                <input id={ids.name} autoComplete="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} aria-describedby={error ? ids.err : undefined} />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor={ids.email} className="font-medium">
                  Email
                </label>
                <input id={ids.email} type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor={ids.phone} className="font-medium">
                  Phone <span className="font-normal text-zinc-600 dark:text-zinc-400">(optional)</span>
                </label>
                <input id={ids.phone} type="tel" autoComplete="tel" inputMode="tel" placeholder="98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={field} />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor={ids.exp} className="font-medium">
                  Professional experience
                </label>
                <select id={ids.exp} required value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} className={field}>
                  <option value="">Choose one</option>
                  {EXPERIENCE.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-start gap-2 text-sm leading-6 sm:col-span-2">
                <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} className="mt-1 size-5 shrink-0 accent-emerald-700" />
                {CONSENT_TEXT}
              </label>
            </div>
          )}

          {error && (
            <p id={ids.err} role="alert" className="text-sm text-rose-800 dark:text-rose-300">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" className={primaryButton} onClick={() => void submit()} disabled={busy}>
              {busy ? "Making your checklist…" : minor ? "Download my checklist" : "Save and download"}
            </button>
            <button type="button" className={secondaryButton} onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
