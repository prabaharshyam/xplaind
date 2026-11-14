import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/art/icons";
import { PageHero } from "@/components/page-hero";
import { BUSINESS } from "@/lib/business";
import { getTestimonials } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Learner Stories: What Xplaind Learners Say and Achieve",
  description: "Real learners on Xplaind, in their own words and shared with their permission: what they used and what changed for them. Nothing invented.",
  path: "/stories",
});

const A = "font-medium text-violet-800 underline underline-offset-2 dark:text-violet-300";
const day = (iso: string) => new Date(`${iso}T00:00:00+05:30`).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

/** OS-1 and SO-1: learners' outcomes and words, only real ones, shared with their permission. */
export default function StoriesPage() {
  const all = getTestimonials();
  const outcomes = all.filter((t) => t.outcome && t.outcome_on);
  const share = `mailto:${BUSINESS.email}?subject=${encodeURIComponent("My Xplaind story")}`;
  return (
    <main>
      <PageHero theme="career" shape="icon:star" icon="star" eyebrow="Learner stories" title="What learners say" lead="Real people, in their own words, shared with their permission. We never invent a story or an outcome." />
      <div className="mx-auto max-w-4xl px-4 pt-4 pb-16 md:px-6">
        <section aria-labelledby="outcomes-h">
          <h2 id="outcomes-h" className="text-2xl font-semibold tracking-tight md:text-3xl">
            Outcomes
          </h2>
          {outcomes.length ? (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {outcomes.map((t) => (
                <li key={t.name} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
                  <p className="flex items-start gap-2 text-lg font-semibold">
                    <Icon name="trophy" size={20} className="mt-1 shrink-0 text-emerald-700 dark:text-emerald-300" />
                    {t.outcome}
                  </p>
                  <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                    {t.name}, {t.role} · confirmed {day(t.outcome_on!)}
                  </p>
                  <blockquote className="mt-3 leading-7 text-zinc-800 dark:text-zinc-200">“{t.excerpt ?? t.quote}”</blockquote>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-2xl bg-zinc-50 p-5 leading-7 dark:bg-zinc-900">
              No outcomes to show yet. When a learner tells us they landed a role, switched careers or cleared an interview, and agrees to share it, it
              appears here with the month they confirmed it.
            </p>
          )}
        </section>

        {all.length > 0 && (
          <section aria-labelledby="words-h" className="mt-14">
            <h2 id="words-h" className="text-2xl font-semibold tracking-tight md:text-3xl">
              In their own words
            </h2>
            <ul className="mt-6 flex flex-col gap-4">
              {all.map((t) => (
                <li key={t.name}>
                  <figure className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <blockquote className="leading-7 text-zinc-800 dark:text-zinc-200">“{t.quote}”</blockquote>
                    <figcaption className="mt-3 text-sm font-medium">
                      {t.name}, <span className="font-normal text-zinc-700 dark:text-zinc-300">{t.role}</span>
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="share-h" className="mt-14 rounded-3xl bg-violet-50 p-6 md:p-8 dark:bg-violet-950/30">
          <h2 id="share-h" className="text-xl font-semibold">
            Did Xplaind help you?
          </h2>
          <p className="mt-2 leading-7">
            Tell us what changed: a new role, a switch, an interview you cleared. We share it only with your permission, in your words, and you can ask us to take
            it down any time.
          </p>
          <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <a href={share} className={A}>
              Share your story
            </a>
            <Link href="/pricing" className={A}>
              See what Pro includes
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
