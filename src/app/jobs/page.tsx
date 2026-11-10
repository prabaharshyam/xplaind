import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/art/icons";
import { PageHero } from "@/components/page-hero";
import { getPaths } from "@/lib/content";
import { getJobs, jobLinks } from "@/lib/content/jobs";

export const metadata: Metadata = pageMeta({
  // SE-8: search-led title and description.
  title: ["AI Engineer Salary in India 2026 & AI Jobs for Freshers", "AI Jobs and Salaries in India"],
  description:
    "AI engineer salary in India by experience, from freshers up, for 9 AI roles, plus the skills AI job posts ask for and live AI jobs on Naukri and LinkedIn.",
  path: "/jobs",
});

const fmtDate = (iso: string) => new Date(`${iso}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

/** JB-1 to JB-3: one card per role, in roadmap order: salary bands, skills, and live openings. */
export default function JobsPage() {
  const jobs = getJobs();
  const paths = getPaths();
  const roles = paths.flatMap((p) => {
    const r = jobs.roles.find((x) => x.path === p.id);
    return r ? [{ path: p, role: r }] : [];
  });
  const top = Math.max(...jobs.roles.flatMap((r) => r.bands.map((b) => b.max)));
  const checked = fmtDate(jobs.checked);

  return (
    <main>
      <PageHero
        shape="briefcase"
        theme="career"
        seed="jobs"
        icon="target"
        eyebrow="Jobs and salaries"
        title="AI jobs and salaries in India"
        lead="What each AI role typically pays at each stage, the skills job posts ask for, and live openings on Naukri and LinkedIn."
      >
        <p className="text-sm text-zinc-700 dark:text-zinc-300">Salaries checked on {checked}.</p>
      </PageHero>

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <nav aria-label="Roles" className="flex flex-wrap gap-2">
          {roles.map(({ path }) => (
            <a key={path.id} href={`#${path.id}`} className="inline-flex min-h-11 items-center rounded-full border border-zinc-300 bg-white px-3 text-sm font-medium hover:border-violet-400 dark:border-zinc-700 dark:bg-zinc-900">
              {path.name}
            </a>
          ))}
        </nav>

        <p className="mt-6 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          These are typical yearly salaries (CTC, in lakh rupees) from published salary data and job posts, checked on {checked}. Sources disagree, so
          treat them as a guide, not an offer: big tech and global AI labs pay more, IT services and smaller cities less, and Bengaluru usually
          leads.
        </p>

        <ul className="mt-8 grid gap-6 lg:grid-cols-2">
          {roles.map(({ path, role }) => {
            const links = jobLinks(role.search);
            return (
              <li key={path.id} id={path.id} className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-5 md:p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="text-xl font-semibold">{path.name}</h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{path.tagline}</p>

                <h3 className="mt-5 text-sm font-semibold text-zinc-600 dark:text-zinc-400">Typical salary</h3>
                <table className="mt-2 w-full text-sm">
                  <caption className="sr-only">
                    {path.name} salary in lakh rupees a year by experience, checked {checked}
                  </caption>
                  <tbody>
                    {role.bands.map((b) => (
                      <tr key={b.years} className="align-middle">
                        <th scope="row" className="w-24 py-1.5 pr-3 text-left font-medium whitespace-nowrap">
                          {b.years}
                        </th>
                        <td className="py-1.5" aria-hidden="true">
                          <span className="relative block h-3 rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <span
                              className="absolute inset-y-0 rounded-full bg-gradient-to-r from-violet-500 to-emerald-500"
                              style={{ left: `${(b.min / top) * 100}%`, width: `${Math.max(3, ((b.max - b.min) / top) * 100)}%` }}
                            />
                          </span>
                        </td>
                        <td className="w-28 py-1.5 pl-3 text-right font-semibold whitespace-nowrap tabular-nums">
                          ₹{b.min}–{b.max} LPA
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3 className="mt-5 text-sm font-semibold text-zinc-600 dark:text-zinc-400">Skills job posts ask for</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {role.skills.map((s) => (
                    <li key={s} className="rounded-full bg-violet-50 px-3 py-1 text-sm text-violet-950 ring-1 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-100 dark:ring-violet-900">
                      {s}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex flex-wrap gap-2">
                  <a
                    href={links.naukri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#275df5] px-4 text-sm font-semibold text-white hover:bg-[#1e4bd1]"
                  >
                    Live jobs on Naukri <span aria-hidden="true">↗</span>
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                  <a
                    href={links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0a66c2] px-4 text-sm font-semibold text-white hover:bg-[#08539e]"
                  >
                    Live jobs on LinkedIn <span aria-hidden="true">↗</span>
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                  <Link href={`/roadmap/${path.id}`} className="inline-flex min-h-11 items-center gap-1 px-2 text-sm font-medium text-violet-800 hover:underline dark:text-violet-300">
                    <Icon name="map" size={16} /> Roadmap to get there
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>

        <section aria-labelledby="sources" className="mt-10 max-w-3xl text-sm text-zinc-700 dark:text-zinc-300">
          <h2 id="sources" className="font-semibold">
            Sources
          </h2>
          <p className="mt-1">
            Salary bands combine these sources and recent job posts, checked on {checked}. We re-check them every quarter. Job links open a live
            search on the job site; Xplaind does not list, rank or earn from jobs.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {jobs.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
