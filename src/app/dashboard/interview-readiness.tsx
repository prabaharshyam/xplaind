"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readinessLabel } from "@/lib/interview/readiness";

type Role = { pathId: string; name: string; score: number; change: number | null; sessions: number };

/** IR-1: how ready the learner is for each role they have practised, from their reviewed mock interviews. */
export function InterviewReadiness() {
  const [roles, setRoles] = useState<Role[] | null>(null);
  useEffect(() => {
    let live = true;
    void fetch("/api/interview/readiness")
      .then((r) => (r.ok ? (r.json() as Promise<{ roles: Role[] }>) : { roles: [] }))
      .then((d) => live && setRoles(d.roles))
      .catch(() => live && setRoles([]));
    return () => {
      live = false;
    };
  }, []);
  if (roles === null) return null;
  return (
    <section aria-labelledby="readiness-h" className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 id="readiness-h" className="text-lg font-semibold">
        Interview readiness
      </h2>
      {roles.length === 0 ? (
        <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">
          Take a mock interview for your role and get it reviewed by AI to see how ready you are.{" "}
          <Link href="/interview/simulator" className="font-medium text-violet-800 underline underline-offset-2 dark:text-violet-300">
            Start a mock interview
          </Link>
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {roles.map((r) => (
            <li key={r.pathId}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{r.name}</span>
                <span className="tabular-nums">
                  <span className="text-xl font-semibold">{r.score}%</span>{" "}
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{readinessLabel(r.score)}</span>
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800" role="meter" aria-label={`${r.name} readiness`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={r.score}>
                <div className="h-full rounded-full bg-violet-700 dark:bg-violet-400" style={{ width: `${r.score}%` }} />
              </div>
              {r.change !== null && r.change !== 0 && (
                <p className={`mt-1 text-sm tabular-nums ${r.change > 0 ? "text-emerald-800 dark:text-emerald-300" : "text-rose-800 dark:text-rose-300"}`}>
                  {r.change > 0 ? "+" : ""}
                  {r.change} since your earlier interviews
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
