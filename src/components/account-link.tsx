"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { setSignedIn } from "@/lib/browser/account-sync";
import { useProgress } from "@/lib/browser/hooks";
import { publicSupabase } from "@/lib/signups";
import { browserClient } from "@/lib/supabase/browser";

/** "off" until accounts are switched on for this deployment. */
export type AccountState = "off" | "unknown" | "in" | "out";

/** Whether the learner is signed in. Also tells the sync layer whether to send changes. */
export function useAccountState(): AccountState {
  // The Supabase settings are built into the page, so server and browser agree on "off".
  const [state, setState] = useState<AccountState>(() => (publicSupabase() ? "unknown" : "off"));
  useEffect(() => {
    const client = browserClient();
    if (!client) return;
    const apply = (inNow: boolean) => {
      setSignedIn(inNow);
      setState(inNow ? "in" : "out");
    };
    void client.auth.getSession().then(({ data }) => apply(!!data.session));
    const { data } = client.auth.onAuthStateChange((_event, session) => apply(!!session));
    return () => data.subscription.unsubscribe();
  }, []);
  return state;
}

/** Footer link: "Sign in" or "Your dashboard". Hidden until accounts are switched on. */
export function AccountLink({ className }: { className?: string }) {
  const state = useAccountState();
  if (state === "unknown" || state === "off") return null;
  return state === "in" ? (
    <Link href="/dashboard" className={className}>
      Your dashboard
    </Link>
  ) : (
    <Link href="/signin" className={className}>
      Sign in
    </Link>
  );
}

/**
 * AC-6: the header's main button. It says exactly what happens next: signed in it opens your
 * progress, a returning learner carries on from their last lesson, and a new visitor starts
 * learning (or signs up, once sign-ups are open).
 */
export function AccountButton({ className }: { className: string }) {
  const state = useAccountState();
  const progress = useProgress();
  if (state === "in") {
    return (
      <Link href="/dashboard" className={className}>
        My progress
      </Link>
    );
  }
  if (progress.last) {
    return (
      <Link href={`/stop/${progress.last.stopId}`} className={className}>
        Continue learning
      </Link>
    );
  }
  if (state === "out") {
    return (
      <Link href="/signin" className={className}>
        Sign up free
      </Link>
    );
  }
  return (
    <Link href="/paths" className={className}>
      Start learning
    </Link>
  );
}
