"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { setSignedIn } from "@/lib/browser/account-sync";
import { browserClient } from "@/lib/supabase/browser";

/** Footer link: "Sign in" or "Your dashboard". Also tells the sync layer whether to send changes. Hidden until accounts are switched on. */
export function AccountLink({ className }: { className?: string }) {
  const [state, setState] = useState<"unknown" | "in" | "out">("unknown");

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

  if (state === "unknown") return null;
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
