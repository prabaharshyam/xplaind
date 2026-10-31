import type { Metadata } from "next";
import { Suspense } from "react";
import { accountsEnabled } from "@/lib/supabase/config";
import { SignInForm } from "./signin-form";

export const metadata: Metadata = {
  title: "Sign up or sign in",
  description: "Sign up or sign in with an email link to save your journey and carry on from any device.",
  robots: { index: false },
};

export default function SignInPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Sign up or sign in</h1>
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
