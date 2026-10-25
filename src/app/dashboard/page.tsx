import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getContent, getPaths } from "@/lib/content";
import { lessonsByPath, pathRef } from "@/lib/content/paths";
import { accountsEnabled } from "@/lib/supabase/config";
import { currentUser, userClient } from "@/lib/supabase/server";
import { Dashboard } from "./dashboard";

export const metadata: Metadata = { title: "Your dashboard", robots: { index: false } };

async function SignedIn() {
  const client = await userClient();
  const user = client ? await currentUser(client) : null;
  if (!user) redirect("/signin?next=/dashboard");
  const levels = getContent().levels.map(({ data: l }) => ({ id: l.id, name: l.name, draft_hours: l.draft_hours }));
  return <Dashboard email={user.email} levels={levels} paths={getPaths().map(pathRef)} stopsByPath={lessonsByPath()} />;
}

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Your dashboard</h1>
      {accountsEnabled() ? (
        <Suspense fallback={<p className="mt-6">Loading your progress…</p>}>
          <SignedIn />
        </Suspense>
      ) : (
        <p className="mt-4 leading-7">Accounts are coming soon. Your progress is saved on this device.</p>
      )}
    </main>
  );
}
