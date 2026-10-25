import type { Metadata } from "next";
import { Suspense } from "react";
import { accountsEnabled } from "@/lib/supabase/config";
import { SignInForm } from "./signin-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in with an email link to keep your progress across devices.",
  robots: { index: false },
};

export default function SignInPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
      {accountsEnabled() ? (
        <Suspense>
          <SignInForm />
        </Suspense>
      ) : (
        <p className="mt-4 leading-7">
          Accounts are coming soon. Everything on the site works without one: your test result, progress and practice
          are saved on this device.
        </p>
      )}
    </main>
  );
}
