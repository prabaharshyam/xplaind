import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/art/icons";
import { PageHero } from "@/components/page-hero";
import { getPaths } from "@/lib/content";
import { getJobs, jobLinks } from "@/lib/content/jobs";
import { arrowLink, muted, secondaryButtonSm } from "@/components/ui";
import { RoleSwitch } from "./role-switch";

export const metadata: Metadata = pageMeta({
  // SE-8: search-led title and description.
  title: ["AI Engineer Salary in India 2026 & AI Jobs for Freshers", "AI Jobs and Salaries in India"],
  description:
    "AI engineer salary in India by experience, from freshers up, for 10 AI roles, plus the skills AI job posts ask for and live AI jobs on Naukri and LinkedIn.",
  path: "/jobs",
});

const fmtDate = (iso: string) => new Date(`${iso}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

/** JB-1 to JB-3: salary bands, skills and live openings for each role; JB-5: one role shown at a time. */
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
        <RoleSwitch
          roles={roles.map(({ path, role }) => {
            const links = jobLinks(role.search);
            return {
              id: path.id,
              name: path.name,
              panel: (
                <>
                  <h2 className="text-2xl font-semibold tracking-tight">{path.name}</h2>
                  <p className={`mt-1 ${muted}`}>{path.tagline}</p>

                  <h3 className="mt-6 text-sm font-semibold">Typical salary, in lakh rupees a year</h3>
                  <table className="mt-2 w-full max-w-xl text-sm">
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
                                className="absolute inset-y-0 rounded-full bg-brand-600 dark:bg-brand-400"
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
                  <p className={`mt-2 max-w-xl text-sm leading-6 ${muted}`}>
                    Typical CTC from published salary data and job posts, checked on {checked}. Sources disagree, so treat it as a guide, not an
                    offer: big tech and global AI labs pay more, IT services and smaller cities less, and Bengaluru usually leads.
                  </p>

                  <h3 className="mt-6 text-sm font-semibold">Skills job posts ask for</h3>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {role.skills.map((sk) => (
                      <li key={sk} className="rounded-full bg-zinc-100 px-3 py-1 text-sm dark:bg-zinc-800">
                        {sk}
                      </li>
                    ))}
                  </ul>

                  {/* UX-11: the job sites' own blues gave way to the site's buttons. */}
                  <div className="mt-6 flex flex-wrap gap-2">
                    <a href={links.naukri} target="_blank" rel="noopener noreferrer" className={secondaryButtonSm}>
                      Live jobs on Naukri <span aria-hidden="true">↗</span>
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                    <a href={links.linkedin} target="_blank" rel="noopener noreferrer" className={secondaryButtonSm}>
                      Live jobs on LinkedIn <span aria-hidden="true">↗</span>
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                    <Link href={`/roadmap/${path.id}`} className={`${arrowLink} px-2 text-sm`}>
                      <Icon name="map" size={16} /> Roadmap to get there
                    </Link>
                  </div>
                </>
              ),
            };
          })}
        />

        <section aria-labelledby="sources" className="mt-16 max-w-3xl text-sm text-zinc-700 dark:text-zinc-300">
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
