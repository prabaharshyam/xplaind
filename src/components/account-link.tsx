"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { setSignedIn } from "@/lib/browser/account-sync";
import { browserClient } from "@/lib/supabase/browser";

/** "off" until accounts are switched on for this deployment. */
export type AccountState = "off" | "unknown" | "in" | "out";

/** Whether the learner is signed in. Also tells the sync layer whether to send changes. */
export function useAccountState(): AccountState {
  // The Supabase settings are built into the page, so server and browser agree on "off".
  const [state, setState] = useState<AccountState>(() =>
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "unknown" : "off",
  );
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

/** AC-6: the header's main button. Signed out it invites sign-up, so progress follows the learner. */
export function AccountButton({ className }: { className: string }) {
  const state = useAccountState();
  if (state === "in") {
    return (
      <Link href="/dashboard" className={className}>
        My progress
      </Link>
    );
  }
  if (state === "out") {
    return (
      <Link href="/signin" className={className}>
        Sign up
      </Link>
    );
  }
  return (
    <Link href="/paths" className={className}>
      Get started
    </Link>
  );
}
