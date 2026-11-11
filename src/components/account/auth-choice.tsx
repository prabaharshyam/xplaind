"use client";

import { primaryButton, secondaryButton } from "@/components/ui";
import { SIGNUP_EVENT, type SignUpReason } from "@/lib/browser/account-sync";

/**
 * AC-12 (owner request 2026-11-11): everywhere the site asks for an account it offers the same
 * two choices, "Sign up" and "Sign in", so someone who already has an account is never told to
 * create one. Both open the site-wide dialog, on the right tab, and bring the learner back here.
 */
export function AuthChoice({ reason, className = "" }: { reason: SignUpReason; className?: string }) {
  const open = (mode: "signup" | "signin") => window.dispatchEvent(new CustomEvent(SIGNUP_EVENT, { detail: { reason, mode } }));
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <button type="button" className={primaryButton} onClick={() => open("signup")}>
        Sign up
      </button>
      <button type="button" className={secondaryButton} onClick={() => open("signin")}>
        Sign in
      </button>
    </div>
  );
}
