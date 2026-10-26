"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { muted, primaryButton, secondaryButton } from "@/components/ui";

const ERRORS: Record<string, string> = {
  adult: "Please confirm you are 18 or older to make an account.",
  email: "Please enter a valid email address.",
  busy: "Too many sign-in emails from here. Please wait ten minutes and try again.",
  send: "We could not send the email. Please try again in a few minutes.",
  link: "That sign-in link has expired or was already used. Ask for a new one below.",
  off: "Accounts are not switched on yet.",
};

/** AC-1: email link only, and only after the 18+ tick. PV-2: under 18 gets no account. */
export function SignInForm() {
  const params = useSearchParams();
  const [under18, setUnder18] = useState(false);
  const error = params.get("error");
  const next = params.get("next") ?? "/dashboard";

  if (params.get("sent")) {
    return (
      <div className="mt-4 flex flex-col gap-3" role="status">
        <p className="text-lg leading-8 font-medium">Check your email for a sign-in link.</p>
        <p className={`leading-7 ${muted}`}>
          Open it in this browser on this device. The link works once and expires soon. If it does not arrive in a few
          minutes, check your spam folder.
        </p>
      </div>
    );
  }

  if (under18) {
    return (
      <div className="mt-4 flex flex-col gap-3" role="status">
        <p className="leading-7">
          Accounts are for learners who are 18 or older. You can still use everything: the test, the roadmap, the
          lessons and practice all work without an account, and your progress is saved only on this device. Nothing about
          you is stored on our servers.
        </p>
        <button type="button" className={secondaryButton} onClick={() => setUnder18(false)}>
          Back
        </button>
      </div>
    );
  }

  return (
    <form action="/auth/email-link" method="post" className="mt-4 flex flex-col gap-4" noValidate={false}>
      <p className={`leading-7 ${muted}`}>
        We email you a link; there is no password. An account keeps your result and progress across devices.
      </p>
      {error && ERRORS[error] && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-900 dark:bg-red-950 dark:text-red-100">
          {ERRORS[error]}
        </p>
      )}
      <input type="hidden" name="next" value={next} />
      <label className="flex flex-col gap-1">
        <span className="font-medium">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="min-h-12 rounded-lg border border-zinc-400 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
        />
      </label>
      <label className="flex min-h-12 cursor-pointer items-start gap-3">
        <input type="checkbox" name="adult" value="yes" required className="mt-1 size-5 accent-emerald-700" />
        <span>I am 18 or older</span>
      </label>
      <button type="submit" className={primaryButton}>
        Email me a sign-in link
      </button>
      <button type="button" className={`${secondaryButton} text-sm`} onClick={() => setUnder18(true)}>
        I am under 18
      </button>
    </form>
  );
}
