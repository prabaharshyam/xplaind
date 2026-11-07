"use client";

import { useEffect, useRef, useState } from "react";
import { SIGNUP_EVENT, type SignUpReason } from "@/lib/browser/account-sync";
import { SignInForm } from "./signin-form";

/**
 * SU-2: one sign-up prompt for the whole site. Anything that needs an account fires
 * the xp:signup event; this opens over the page with every way to sign up, and brings
 * the learner back to the same page afterwards.
 */
export function SignUpDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState<SignUpReason | null>(null);
  const [next, setNext] = useState("/");

  useEffect(() => {
    const open = (e: Event) => {
      setReason((e as CustomEvent<{ reason: SignUpReason }>).detail.reason);
      setNext(`${location.pathname}${location.search}`);
      if (!ref.current?.open) ref.current?.showModal();
    };
    window.addEventListener(SIGNUP_EVENT, open);
    return () => window.removeEventListener(SIGNUP_EVENT, open);
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="signup-title"
      onClose={(e) => e.target === e.currentTarget && setReason(null)}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-violet-100 bg-white p-0 text-zinc-900 shadow-2xl backdrop:bg-zinc-950/50 backdrop:backdrop-blur-sm dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100"
    >
      {reason && (
        <div className="max-h-[90vh] overflow-y-auto p-5 sm:p-6">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h2 id="signup-title" className="text-xl font-semibold tracking-tight">
              Sign up free
            </h2>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="-mt-1 -mr-1 grid size-10 place-items-center rounded-full text-2xl leading-none hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <span aria-hidden="true">×</span>
              <span className="sr-only">Close</span>
            </button>
          </div>
          <SignInForm next={next} reason={reason} />
        </div>
      )}
    </dialog>
  );
}
