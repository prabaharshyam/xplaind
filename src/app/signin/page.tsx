import type { Metadata } from "next";
import { Suspense } from "react";
import { accountsEnabled } from "@/lib/supabase/config";
import { SignInForm } from "./signin-form";

export const metadata: Metadata = {
  title: "Sign up or sign in",
  description: "Create a free Xplaind account with Google, GitHub or email to download roadmaps, take mock interviews and save your progress.",
  robots: { index: false },
};

export default function SignInPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Sign up or sign in</h1>
      <p className="mt-2 leading-7 text-zinc-600 dark:text-zinc-400">It takes a few seconds and it is free.</p>
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
