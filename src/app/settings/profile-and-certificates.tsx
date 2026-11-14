"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { primaryButton, secondaryButton } from "@/components/ui";

type Profile = { handle: string; displayName: string; headline: string; enabled: boolean };
type Role = {
  pathId: string;
  name: string;
  done: number;
  total: number;
  certificateId: string | null;
  eligibility: { ok: boolean; lessonsDone: number; lessonsTotal: number; verified: number; verifiedNeeded: number; projectPassed: boolean };
};

const field =
  "min-h-11 w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700";

/** PF-1 (free, off by default) and CT-1 (Pro): the public profile and the certificates, in Settings. */
export function ProfileAndCertificates() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>({ handle: "", displayName: "", headline: "", enabled: false });
  const [saved, setSaved] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [pro, setPro] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);
  const ids = { handle: useId(), name: useId(), headline: useId(), on: useId() };

  useEffect(() => {
    let live = true;
    void fetch("/api/public-profile")
      .then((r) => (r.ok ? (r.json() as Promise<{ profile: Profile | null }>) : { profile: null }))
      .then((d) => {
        if (!live || !d.profile) return;
        setProfile(d.profile);
        if (d.profile.enabled) setSaved(`/u/${d.profile.handle}`);
      })
      .catch(() => undefined);
    void fetch("/api/certificates")
      .then((r) => (r.ok ? (r.json() as Promise<{ roles: Role[]; pro: boolean }>) : { roles: [], pro: false }))
      .then((d) => {
        if (!live) return;
        setRoles(d.roles);
        setPro(d.pro);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/public-profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { url?: string; error?: string } | null;
    if (!res?.ok) return setMsg(body?.error ?? "Could not save. Please try again.");
    setSaved(profile.enabled ? (body?.url ?? null) : null);
    setMsg(profile.enabled ? "Saved. Your profile is public." : "Saved. Your profile is private.");
  };

  const claim = async (pathId: string) => {
    setClaimMsg(null);
    const name = profile.displayName.trim() || window.prompt("The name to print on your certificate") || "";
    if (name.trim().length < 2) return;
    const res = await fetch("/api/certificates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pathId, name }) }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { id?: string; error?: string } | null;
    if (res?.ok && body?.id) router.push(`/certificate/${body.id}`);
    else setClaimMsg(body?.error ?? "Could not issue the certificate. Please try again.");
  };

  return (
    <>
      <section aria-labelledby="profile-heading" className="flex flex-col gap-3">
        <h2 id="profile-heading" className="text-xl font-semibold">
          Public profile
        </h2>
        <p className="leading-7 text-zinc-700 dark:text-zinc-300">
          A page you can share with recruiters: your roadmap progress, interview readiness, projects that passed review and certificates. It stays private until you turn it on, and search engines do not list it.
        </p>
        <form onSubmit={save} className="flex flex-col gap-3">
          <label htmlFor={ids.name} className="flex flex-col gap-1">
            <span className="text-sm font-medium">Name to show</span>
            <input id={ids.name} required minLength={2} maxLength={60} value={profile.displayName} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} className={field} />
          </label>
          <label htmlFor={ids.headline} className="flex flex-col gap-1">
            <span className="text-sm font-medium">Headline (optional)</span>
            <input id={ids.headline} maxLength={120} placeholder="Learning to build LLM apps; open to AI engineer roles" value={profile.headline} onChange={(e) => setProfile({ ...profile, headline: e.target.value })} className={field} />
          </label>
          <label htmlFor={ids.handle} className="flex flex-col gap-1">
            <span className="text-sm font-medium">Link name</span>
            <span className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
              xplaind.in/u/
              <input id={ids.handle} required minLength={3} maxLength={30} pattern="[a-z0-9][a-z0-9-]{1,28}[a-z0-9]" value={profile.handle} onChange={(e) => setProfile({ ...profile, handle: e.target.value.toLowerCase() })} className={`${field} flex-1`} />
            </span>
          </label>
          <label htmlFor={ids.on} className="flex items-center gap-3">
            <input id={ids.on} type="checkbox" checked={profile.enabled} onChange={(e) => setProfile({ ...profile, enabled: e.target.checked })} className="size-5 accent-violet-700" />
            <span>Make my profile public</span>
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className={primaryButton}>
              Save profile
            </button>
            {saved && (
              <Link href={saved} className={secondaryButton}>
                View my profile
              </Link>
            )}
          </div>
          {msg && (
            <p role="status" className="text-sm">
              {msg}
            </p>
          )}
        </form>
      </section>

      <section aria-labelledby="cert-heading" className="flex flex-col gap-3">
        <h2 id="cert-heading" className="text-xl font-semibold">
          Certificates
        </h2>
        <p className="leading-7 text-zinc-700 dark:text-zinc-300">
          A verified certificate for a role, with a link anyone can check and an Add to LinkedIn button. It needs every lesson on the roadmap done (most by passing the check) and a guided project that passed review. Part of Pro.
        </p>
        {roles.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Start a roadmap to see your progress towards a certificate here.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {roles.map((r) => (
              <li key={r.pathId} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="font-medium">{r.name}</p>
                <ul className="mt-2 flex flex-col gap-1 text-sm text-zinc-700 tabular-nums dark:text-zinc-300">
                  <li>
                    {r.eligibility.lessonsDone === r.eligibility.lessonsTotal ? "✓" : "○"} Lessons done: {r.eligibility.lessonsDone} of {r.eligibility.lessonsTotal}
                  </li>
                  <li>
                    {r.eligibility.verified >= r.eligibility.verifiedNeeded ? "✓" : "○"} Passed by check or project: {r.eligibility.verified} of {r.eligibility.verifiedNeeded} needed
                  </li>
                  <li>
                    {r.eligibility.projectPassed ? "✓" : "○"} A guided project passed review{" "}
                    {!r.eligibility.projectPassed && (
                      <Link href="/projects" className="text-violet-800 underline underline-offset-2 dark:text-violet-300">
                        choose a project
                      </Link>
                    )}
                  </li>
                </ul>
                <div className="mt-3">
                  {r.certificateId ? (
                    <Link href={`/certificate/${r.certificateId}`} className={secondaryButton}>
                      View certificate
                    </Link>
                  ) : r.eligibility.ok && pro ? (
                    <button type="button" className={primaryButton} onClick={() => void claim(r.pathId)}>
                      Get my certificate
                    </button>
                  ) : r.eligibility.ok ? (
                    <Link href="/pricing" className={primaryButton}>
                      Get Pro to claim it
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
        {claimMsg && (
          <p role="alert" className="text-sm text-rose-800 dark:text-rose-300">
            {claimMsg}
          </p>
        )}
      </section>
    </>
  );
}
