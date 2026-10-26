import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { accountsEnabled } from "@/lib/supabase/config";
import { currentUser, userClient } from "@/lib/supabase/server";
import { Settings } from "./settings";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

async function SignedIn() {
  const client = await userClient();
  const user = client ? await currentUser(client) : null;
  if (!user) redirect("/signin?next=/settings");
  const { data } = await client!.from("profiles").select("weekly_hours").eq("id", user.id).maybeSingle();
  return <Settings email={user.email} weeklyHours={data?.weekly_hours ?? null} />;
}

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      {accountsEnabled() ? (
        <Suspense fallback={<p className="mt-6">Loading…</p>}>
          <SignedIn />
        </Suspense>
      ) : (
        <p className="mt-4 leading-7">Accounts are coming soon.</p>
      )}
    </main>
  );
}
