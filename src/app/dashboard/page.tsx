import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getContent, getPaths } from "@/lib/content";
import { lessonsByPath, pathRef } from "@/lib/content/paths";
import { accountsEnabled } from "@/lib/supabase/config";
import { currentUser, userClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/page-hero";
import { Dashboard } from "./dashboard";
import { ProgressOverview } from "./progress-overview";

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
    <main>
      <PageHero theme="career" seed="dashboard" icon="trophy" eyebrow="Your progress" title="Your dashboard" lead="XP, streak and badges from everything you have done on this device." />
      <div className="mx-auto max-w-3xl px-4 py-8">
      <ProgressOverview />
      <h2 className="mt-10 text-xl font-semibold">Your account</h2>
      {accountsEnabled() ? (
        <Suspense fallback={<p className="mt-6">Loading your progress…</p>}>
          <SignedIn />
        </Suspense>
      ) : (
        <p className="mt-2 leading-7">Accounts are coming soon. Your progress is saved on this device.</p>
      )}
      </div>
    </main>
  );
}
