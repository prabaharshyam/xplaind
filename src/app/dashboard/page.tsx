import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ContinueCard } from "@/components/continue-card";
import { getContent, getPaths, getStops } from "@/lib/content";
import { lessonsByPath, pathRef } from "@/lib/content/paths";
import { accountsEnabled } from "@/lib/supabase/config";
import { currentUser, userClient } from "@/lib/supabase/server";
import { Dashboard } from "./dashboard";
import { AppHome } from "./app-home";
import { ProgressOverview } from "./progress-overview";
import { InterviewReadiness } from "./interview-readiness";
import { textLink } from "@/components/ui";
import { Skeleton } from "@/components/skeleton";

export const metadata: Metadata = { title: "Home", robots: { index: false } };

async function SignedIn() {
  // QA-4: wait for a real request before any login work. Supabase's session check reads the clock, which Next.js
  // refuses while it prepares a page ahead of time for a signed-in visitor (it logged this error on every visit).
  await connection();
  const client = await userClient();
  const user = client ? await currentUser(client) : null;
  if (!user) redirect("/signin?next=/dashboard");
  const levels = getContent().levels.map(({ data: l }) => ({ id: l.id, name: l.name, draft_hours: l.draft_hours }));
  return (
    <>
      <Dashboard email={user.email} levels={levels} paths={getPaths().map(pathRef)} stopsByPath={lessonsByPath()} />
    </>
  );
}

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pt-8 pb-16 md:px-6 md:pt-12">
      {/* DB-1 (2026-11-27, owner: "fix/do the 4-12", item 5): a Today screen. Where to carry on and three numbers first,
          then one thing at a time in tabs, instead of a banner and about eight stacked sections. */}
      {/* APP-3: the app Home: a greeting, Ask anything and the main things to do; then the Today screen (DB-1). */}
      <AppHome paths={getPaths().map((p) => ({ id: p.id, name: p.name }))} />
      <div className="mt-6 empty:hidden">
        <ContinueCard titles={Object.fromEntries(getStops().map((s) => [s.id, s.title]))} />
      </div>
      <div className="mt-6">
        <ProgressOverview />
      </div>
      <div className="mt-8">
        {accountsEnabled() ? (
          <Suspense fallback={<Skeleton label="Loading your progress…" className="mt-6" />}>
            <SignedIn />
          </Suspense>
        ) : (
          <div className="flex flex-col gap-6">
            <InterviewReadiness />
            <p className="leading-7">
              Sign-ups are paused for a short while. Your progress is saved on this device.{" "}
              <Link href="/plan" className={textLink}>
                Stay on track this week
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
