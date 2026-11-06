import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ContinueCard } from "@/components/continue-card";
import { getContent, getPaths, getStops } from "@/lib/content";
import { lessonsByPath, pathRef } from "@/lib/content/paths";
import { accountsEnabled } from "@/lib/supabase/config";
import { currentUser, userClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/page-hero";
import { Dashboard } from "./dashboard";
import { ProgressOverview } from "./progress-overview";
import { primaryButtonSm } from "@/components/ui";
import { Skeleton } from "@/components/skeleton";

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
      <PageHero
        size="full" shape="barChart" theme="career" seed="dashboard" icon="trophy" eyebrow="Your progress" title="Your dashboard" lead="Carry on where you left off, and see your streak and what you have finished.">
        {/* WP-1: this week's plan, one tap from progress. */}
        <Link href="/plan" className={primaryButtonSm}>
          See this week&apos;s study plan →
        </Link>
      </PageHero>
      <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 empty:hidden">
        <ContinueCard titles={Object.fromEntries(getStops().map((s) => [s.id, s.title]))} />
      </div>
      <ProgressOverview />
      <h2 className="mt-10 text-xl font-semibold">Your account</h2>
      {accountsEnabled() ? (
        <Suspense fallback={<Skeleton label="Loading your progress…" className="mt-6" />}>
          <SignedIn />
        </Suspense>
      ) : (
        <p className="mt-2 leading-7">Sign-ups are paused for a short while. Your progress is saved on this device.</p>
      )}
      </div>
    </main>
  );
}
