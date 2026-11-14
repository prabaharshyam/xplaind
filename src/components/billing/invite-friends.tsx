"use client";

import { useEffect, useState } from "react";
import { primaryButton, secondaryButton } from "@/components/ui";

type Referral = { link: string; rewards: number; daysEarned: number; percent: number; rewardDays: number };

/**
 * RF-1: the learner's share link. A friend's first pass is 10% off; when the friend pays, the
 * learner gets 7 more days of Pro. Shows how many friends have rewarded them so far.
 */
export function InviteFriends() {
  const [ref, setRef] = useState<Referral | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let live = true;
    void fetch("/api/referral")
      .then((r) => (r.ok ? (r.json() as Promise<Referral>) : null))
      .then((d) => live && setRef(d))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);
  if (!ref) return null;
  const message = `I'm learning AI step by step on Xplaind. Use my link for ${ref.percent}% off your first Pro pass: ${ref.link}`;
  return (
    <section aria-labelledby="invite-h" className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 id="invite-h" className="text-lg font-semibold">
        Invite friends, get Pro
      </h2>
      <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">
        Your friends get {ref.percent}% off their first pass. Each time one of them buys, you get {ref.rewardDays} more days of Pro.
      </p>
      <p className="mt-3 rounded-2xl bg-zinc-100 px-4 py-3 font-mono text-sm break-all dark:bg-zinc-800">{ref.link}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className={primaryButton}
          onClick={() => {
            void navigator.clipboard?.writeText(ref.link).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            });
          }}
        >
          {copied ? "Link copied" : "Copy my link"}
        </button>
        <a className={secondaryButton} href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
          Share on WhatsApp
        </a>
      </div>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
        {ref.rewards === 0 ? "No friends have bought yet." : `${ref.rewards} ${ref.rewards === 1 ? "friend has" : "friends have"} bought: ${ref.daysEarned} days of Pro added.`}
      </p>
    </section>
  );
}
