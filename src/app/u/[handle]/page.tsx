import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/skeleton";
import { normaliseHandle } from "@/lib/certificates";
import { readinessLabel } from "@/lib/interview/readiness";
import { learnerRecord } from "@/lib/learner/record";
import { serviceClient } from "@/lib/supabase/server";

// PF-1: a learner's public profile. Shown only while the learner has it turned on; not indexed by
// search engines, so it is seen by the people it is shared with.
export const metadata: Metadata = { title: "Learner profile", robots: { index: false, follow: false } };

async function Profile({ params }: { params: PageProps<"/u/[handle]">["params"] }) {
  const handle = normaliseHandle((await params).handle);
  const admin = serviceClient();
  if (!handle || !admin) notFound();
  const { data: profile } = await admin.from("public_profiles").select("user_id, display_name, headline, enabled").eq("handle", handle).maybeSingle();
  if (!profile?.enabled) notFound();
  const record = await learnerRecord(admin, profile.user_id);
  return (
    <>
      <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400">xplaind.in/u/{handle}</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">{profile.display_name}</h1>
      {profile.headline && <p className="mt-2 text-lg leading-8 text-zinc-700 dark:text-zinc-300">{profile.headline}</p>}

      {record.certificates.length > 0 && (
        <section aria-labelledby="certs-h" className="mt-10">
          <h2 id="certs-h" className="text-xl font-semibold">
            Certificates
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {record.certificates.map((c) => (
              <li key={c.id}>
                <Link href={`/certificate/${c.id}`} className="font-medium text-violet-800 underline underline-offset-2 dark:text-violet-300">
                  {record.roles.find((r) => r.pathId === c.pathId)?.name ?? c.pathId}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="roles-h" className="mt-10">
        <h2 id="roles-h" className="text-xl font-semibold">
          Roadmap progress
        </h2>
        {record.roles.length === 0 ? (
          <p className="mt-2 text-zinc-700 dark:text-zinc-300">Just getting started.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-4">
            {record.roles.map((r) => (
              <li key={r.pathId} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="font-medium">{r.name}</p>
                <p className="mt-1 text-sm text-zinc-600 tabular-nums dark:text-zinc-400">
                  {r.done} of {r.total} lessons done
                  {r.readiness !== null && ` · interview readiness ${r.readiness}% (${readinessLabel(r.readiness)})`}
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div className="h-full rounded-full bg-violet-700 dark:bg-violet-400" style={{ width: `${r.total ? Math.round((r.done / r.total) * 100) : 0}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {record.passedProjects.length > 0 && (
        <section aria-labelledby="projects-h" className="mt-10">
          <h2 id="projects-h" className="text-xl font-semibold">
            Projects that passed review
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {record.passedProjects.map((p) => (
              <li key={p.id} className="flex justify-between gap-3">
                <Link href={`/projects/${p.id}`} className="text-violet-800 underline underline-offset-2 dark:text-violet-300">
                  {p.title}
                </Link>
                <span className="text-sm text-zinc-600 tabular-nums dark:text-zinc-400">{p.score}/100</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="mt-12 text-sm text-zinc-600 dark:text-zinc-400">
        Learning AI step by step on{" "}
        <Link href="/" className="underline underline-offset-2">
          Xplaind
        </Link>
        . Progress comes from lessons passed and projects reviewed on the site.
      </p>
    </>
  );
}

export default function ProfilePage({ params }: PageProps<"/u/[handle]">) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Suspense fallback={<Skeleton label="Loading the profile…" />}>
        <Profile params={params} />
      </Suspense>
    </main>
  );
}
