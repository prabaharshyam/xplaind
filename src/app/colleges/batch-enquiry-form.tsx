"use client";

import { useId, useState } from "react";
import { primaryButton } from "@/components/ui";
import { BatchEnquiry, ENQUIRY_CONSENT, MIN_BATCH, ORG_TYPES } from "@/lib/batch/enquiry";

const field = "min-h-11 w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950";
const empty = { orgName: "", orgType: "", contactName: "", email: "", phone: "", learners: "", message: "", consent: false };

/** CB-1: one short form; a person replies with a quote. */
export function BatchEnquiryForm({ email }: { email: string }) {
  const id = useId();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = BatchEnquiry.safeParse(form);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Please check the details.");
    setBusy(true);
    setError(null);
    const res = await fetch("/api/batch-enquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { error?: string } | null;
    setBusy(false);
    if (res?.ok) setSent(true);
    else setError(body?.error ?? `We could not send it. Please email ${email}.`);
  };

  if (sent)
    return (
      <p role="status" className="rounded-2xl bg-emerald-50 p-5 leading-7 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100">
        Thank you. A person from Xplaind will reply within 2 working days with a quote for your batch.
      </p>
    );

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 font-medium">
          Organisation
          <input value={form.orgName} onChange={set("orgName")} autoComplete="organization" required maxLength={120} className={`${field} font-normal`} />
        </label>
        <label className="flex flex-col gap-1 font-medium">
          Kind of organisation
          <select value={form.orgType} onChange={set("orgType")} required className={`${field} font-normal`}>
            <option value="">Choose one</option>
            {ORG_TYPES.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 font-medium">
          Your name
          <input value={form.contactName} onChange={set("contactName")} autoComplete="name" required maxLength={80} className={`${field} font-normal`} />
        </label>
        <label className="flex flex-col gap-1 font-medium">
          Work email
          <input type="email" value={form.email} onChange={set("email")} autoComplete="email" required maxLength={254} className={`${field} font-normal`} />
        </label>
        <label className="flex flex-col gap-1 font-medium">
          Phone (optional)
          <input type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" maxLength={20} className={`${field} font-normal`} />
        </label>
        <label className="flex flex-col gap-1 font-medium">
          Number of learners
          <input type="number" inputMode="numeric" min={MIN_BATCH} value={form.learners} onChange={set("learners")} required className={`${field} font-normal`} />
        </label>
      </div>
      <label className="flex flex-col gap-1 font-medium">
        Anything we should know (optional)
        <textarea value={form.message} onChange={set("message")} rows={3} maxLength={1000} placeholder="For example: final-year CSE students, placement season starts in January" className={`${field} font-normal`} />
      </label>
      <label className="flex items-start gap-3 text-sm leading-6">
        <input type="checkbox" checked={form.consent} onChange={set("consent")} className="mt-1 size-5 shrink-0 accent-violet-700" />
        {ENQUIRY_CONSENT}
      </label>
      {error && (
        <p id={`${id}-err`} role="alert" className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={`${primaryButton} self-start`}>
        {busy ? "Sending…" : "Ask for a quote"}
      </button>
    </form>
  );
}
