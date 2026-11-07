"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { setSignedIn } from "@/lib/browser/account-sync";
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

/**
 * AC-2: sign-in now lands on the page the learner came from (or home), not the dashboard, so the
 * device's progress is copied into the account once per browser session wherever they land.
 */
export function ClaimOnSignIn() {
  const state = useAccountState();
  useEffect(() => {
    if (state !== "in") return;
    try {
      if (sessionStorage.getItem("xp_claimed")) return;
      sessionStorage.setItem("xp_claimed", "1");
    } catch {
      return;
    }
    void import("@/lib/browser/claim").then(({ claimDevice }) => claimDevice()).catch(() => {});
  }, [state]);
  return null;
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
 * AC-6: the header's main button. Signed in it opens your progress; everyone else gets one
 * plain next step (sign up free, or start learning). "Continue learning" was taken out of the
 * header on 2026-11-06: it confused first-time visitors.
 */
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

/**
 * AC-6: a "Sign in" link that a signed-out visitor can always find, even when the main button says
 * "Continue learning". Hidden while accounts are off or the account check is still running.
 */
export function SignInLink({ className, label = "Sign in" }: { className: string; label?: string }) {
  const state = useAccountState();
  if (state !== "out") return null;
  return (
    <Link href="/signin" className={className}>
      {label}
    </Link>
  );
}


/** The signed-in learner's email, once the browser has read the session. */
function useAccountEmail(state: AccountState): string | null {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    if (state !== "in") return;
    void browserClient()
      ?.auth.getSession()
      .then(({ data }) => setEmail(data.session?.user.email ?? null));
  }, [state]);
  return state === "in" ? email : null;
}

/** AC-7: signs the learner out on the server (the cookie is cleared there), then lands on the home page. */
export function SignOutButton({ className, label = "Sign out" }: { className: string; label?: string }) {
  return (
    <form
      action="/auth/signout"
      method="post"
      className="contents"
      onSubmit={() => {
        try {
          sessionStorage.removeItem("xp_claimed");
        } catch {}
      }}
    >
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}

/**
 * AC-7: the signed-in learner's account menu in the top bar on larger screens: who is signed in,
 * their progress and settings, and Sign out. Shown only while signed in.
 */
export function AccountMenu() {
  const state = useAccountState();
  const email = useAccountEmail(state);
  const menu = useRef<HTMLDetailsElement>(null);
  // Close on a click outside, a choice inside, or Escape (focus goes back to the button).
  useEffect(() => {
    const el = menu.current;
    if (!el) return;
    const onClick = (e: MouseEvent) => {
      if (!el.open) return;
      const t = e.target as Element;
      if (!el.contains(t) || t.closest("a")) el.open = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && el.open) {
        el.open = false;
        el.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [state]);
  if (state !== "in") return null;
  const initial = (email?.[0] ?? "?").toUpperCase();
  const item = "flex min-h-11 w-full items-center rounded-2xl px-3 text-left text-sm font-medium text-zinc-900 hover:bg-violet-50 dark:text-zinc-100 dark:hover:bg-white/5";
  return (
    <details ref={menu} className="account-menu group relative hidden sm:block">
      <summary
        aria-label="Your account"
        className="grid size-10 cursor-pointer list-none place-items-center rounded-full bg-violet-100 text-sm font-semibold text-violet-900 ring-1 ring-violet-200 hover:bg-violet-200 dark:bg-violet-950 dark:text-violet-100 dark:ring-violet-800 [&::-webkit-details-marker]:hidden"
      >
        <span aria-hidden="true">{initial}</span>
      </summary>
      <div className="absolute top-full right-0 z-50 mt-3 w-64 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl shadow-violet-950/10 dark:border-zinc-800 dark:bg-zinc-900">
        {email && (
          <p className="truncate px-3 pt-2 pb-1 text-sm text-zinc-600 dark:text-zinc-400">
            Signed in as <span className="font-medium text-zinc-900 dark:text-zinc-100">{email}</span>
          </p>
        )}
        <Link href="/dashboard" className={item}>
          My progress
        </Link>
        <Link href="/settings" className={item}>
          Settings
        </Link>
        <div className="my-1 border-t border-zinc-200 dark:border-zinc-800" />
        <SignOutButton className={`${item} text-rose-700 dark:text-rose-300`} />
      </div>
    </details>
  );
}

/** AC-7: Settings and Sign out in the phone menu and footer, shown only while signed in. */
export function SignedInLinks({ linkClass, buttonClass }: { linkClass: string; buttonClass: string }) {
  const state = useAccountState();
  if (state !== "in") return null;
  return (
    <>
      <Link href="/settings" className={linkClass}>
        Settings
      </Link>
      <SignOutButton className={buttonClass} />
    </>
  );
}
