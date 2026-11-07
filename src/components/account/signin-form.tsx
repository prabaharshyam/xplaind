"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { SignUpReason } from "@/lib/browser/account-sync";
import { GoogleButton } from "./google-button";

const ERRORS: Record<string, string> = {
  adult: "Accounts are for people aged 18 or over.",
  email: "Please enter a valid email address.",
  password: "Use a password of at least 8 characters.",
  wrong: "That email and password do not match. Try again, or email yourself a sign-in link.",
  taken: "There is already an account with this email. Sign in instead.",
  provider: "We could not finish signing you in with that account. Please try again.",
  busy: "Too many tries from here. Please wait ten minutes and try again.",
  send: "We could not send the email. Please try again in a few minutes.",
  link: "That sign-in link has expired or was already used. Ask for a new one below.",
  off: "Accounts are not switched on yet.",
};

export const REASONS: Record<SignUpReason, string> = {
  pdf: "Create a free account to download your roadmap.",
  interview: "Create a free account to take the mock interview.",
  progress: "Create a free account to save your progress and streak.",
  practice: "Create a free account to save your practice and see missed questions again.",
  tools: "Create a free account to use the AI tools.",
  library: "Create a free account to download research papers and free AI books.",
};

const PERKS = ["Download roadmap PDFs and research papers", "Practice mock interviews and use the AI tools", "Save your progress and streak on every device"];

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-5 fill-current">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

const provider =
  "flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-zinc-300 bg-white px-4 font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";
const field = "min-h-12 rounded-2xl border border-zinc-400 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950";

/**
 * AC-1 (amended 2026-11-01): one form, four ways in. Google and GitHub, email and password, or an
 * email link. Plain form posts, so it works with JavaScript off. New accounts need the 18+ tick (PV-2).
 */
export function SignInForm({
  next,
  reason,
  error,
  sent,
  initialMode = "signup",
}: {
  next: string;
  reason?: SignUpReason;
  error?: string | null;
  sent?: string | null;
  initialMode?: "signup" | "signin";
}) {
  const [mode, setMode] = useState<"signup" | "signin">(initialMode);
  const ids = { email: useId(), password: useId(), err: useId() };

  if (sent) {
    return (
      <div className="flex flex-col gap-3" role="status">
        <p className="text-lg leading-8 font-medium">{sent === "confirm" ? "Check your email to confirm your account." : "Check your email for a sign-in link."}</p>
        <p className="leading-7 text-zinc-600 dark:text-zinc-400">
          Open the link in this browser. It works once and expires soon. If it does not arrive in a few minutes, check your spam folder.
        </p>
      </div>
    );
  }

  return (
    <form action="/auth/password" method="post" className="flex flex-col gap-4">
      {reason && <p className="text-lg leading-7 font-semibold">{REASONS[reason]}</p>}
      {mode === "signup" && (
        <ul className="grid gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          {PERKS.map((p) => (
            <li key={p} className="flex items-center gap-2">
              <span aria-hidden="true" className="text-emerald-600">
                ✓
              </span>
              {p}
            </li>
          ))}
        </ul>
      )}
      {error && ERRORS[error] && (
        <p id={ids.err} role="alert" className="rounded-2xl bg-rose-50 p-3 text-rose-900 dark:bg-rose-950 dark:text-rose-100">
          {ERRORS[error]}
        </p>
      )}
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="mode" value={mode} />

      {/* PV-2 (amended 2026-11-06): continuing is the 18+ confirmation; the line below says so. */}
      <input type="hidden" name="adult" value="yes" />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">By continuing, you confirm you are 18 or older.</p>

      <div className="grid gap-2">
        <GoogleButton next={next}>
          <button type="submit" formAction="/auth/oauth" formNoValidate name="provider" value="google" className={provider}>
            <GoogleMark /> Continue with Google
          </button>
        </GoogleButton>
        <button type="submit" formAction="/auth/oauth" formNoValidate name="provider" value="github" className={provider}>
          <GitHubMark /> Continue with GitHub
        </button>
      </div>

      <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" /> or use your email <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={ids.email} className="font-medium">
          Email
        </label>
        <input id={ids.email} type="email" name="email" required autoComplete="email" className={field} aria-describedby={error ? ids.err : undefined} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={ids.password} className="font-medium">
          Password
        </label>
        <input
          id={ids.password}
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className={field}
        />
        {mode === "signup" && <p className="text-sm text-zinc-600 dark:text-zinc-400">At least 8 characters.</p>}
      </div>

      <button
        type="submit"
        className="min-h-12 rounded-full bg-violet-700 px-4 font-semibold text-white hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
      >
        {mode === "signup" ? "Create free account" : "Sign in"}
      </button>
      <button type="submit" formAction="/auth/email-link" formNoValidate className="text-sm text-violet-800 underline underline-offset-2 dark:text-violet-300">
        {mode === "signup" ? "No password? Email me a sign-in link" : "Forgot your password? Email me a sign-in link"}
      </button>

      <p className="text-center text-sm">
        {mode === "signup" ? "Already have an account? " : "New to Xplaind? "}
        <button type="button" className="font-medium text-violet-800 underline underline-offset-2 dark:text-violet-300" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
          {mode === "signup" ? "Sign in" : "Create a free account"}
        </button>
      </p>
      <p className="text-xs leading-5 text-zinc-600 dark:text-zinc-400">
        Accounts are for people aged 18 or over. Lessons, roadmaps and videos stay open to everyone without an account. You can
        export or delete your data any time in{" "}
        <Link href="/settings" className="underline underline-offset-2">
          Settings
        </Link>
        .
      </p>
    </form>
  );
}
