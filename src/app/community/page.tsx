import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/art/icons";
import { PageHero } from "@/components/page-hero";
import { textLink } from "@/components/ui";
import { getCommunity } from "@/lib/content/community";

export const metadata: Metadata = {
  title: "Community: learn AI together",
  description: "Join fellow Xplaind learners to share your learning journey, ask questions and build projects together.",
  alternates: { canonical: "/community" },
};

const join = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-semibold text-white shadow-md focus-visible:outline-2 focus-visible:outline-offset-2";

/** CM-1: the learner community lives on Discord or WhatsApp; this page explains it and links there. */
export default function CommunityPage() {
  const c = getCommunity();
  const open = Boolean(c.discord_url || c.whatsapp_url);
  return (
    <main>
      <PageHero
        theme="career"
        seed="community"
        icon="people"
        eyebrow="Community"
        title="Learn AI together"
        lead="Meet fellow learners, share your learning journey, ask questions when you are stuck and show what you build."
      />
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
        <section aria-labelledby="join-h" className="rounded-3xl bg-gradient-to-br from-emerald-100 via-sky-100 to-violet-100 p-6 ring-1 ring-emerald-200 dark:from-emerald-950 dark:via-sky-950 dark:to-violet-950 dark:ring-emerald-900">
          <h2 id="join-h" className="text-xl font-semibold">
            {open ? "Join the community" : "The community is launching soon"}
          </h2>
          <p className="mt-2 leading-7 text-zinc-800 dark:text-zinc-200">
            {open
              ? "Pick where you like to chat. Introduce yourself, say which roadmap you are on, and share one thing you learned this week."
              : "We are setting up the group now. Until it opens, keep learning: your progress is saved, and you can sign up so it follows you to any device."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {c.discord_url && (
              <a href={c.discord_url} target="_blank" rel="noopener" className={`${join} bg-indigo-600 hover:bg-indigo-700 focus-visible:outline-indigo-600`}>
                <Icon name="chat" size={18} /> Join on Discord<span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
            {c.whatsapp_url && (
              <a href={c.whatsapp_url} target="_blank" rel="noopener" className={`${join} bg-emerald-700 hover:bg-emerald-800 focus-visible:outline-emerald-700`}>
                <Icon name="chat" size={18} /> Join on WhatsApp<span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
            {!open && (
              <Link href="/paths" className={`${join} bg-violet-700 hover:bg-violet-800 focus-visible:outline-violet-700`}>
                Keep learning
              </Link>
            )}
          </div>
          <p role="note" className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm leading-6 text-amber-950 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-900">
            {c.age_note}
          </p>
        </section>

        <section aria-labelledby="what-h">
          <h2 id="what-h" className="text-xl font-semibold">
            What happens there
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {[
              ["Learning journeys", "Post where you are on your roadmap and what is next. Others on the same path cheer you on."],
              ["Stuck? Ask", "Share the lesson link and what you tried. Someone who just finished it will help."],
              ["Show your projects", "Share your guided project and get feedback against its rubric."],
              ["Study together", "Find a partner for the same roadmap or a mock interview."],
            ].map(([t, d]) => (
              <li key={t} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
                <p className="font-semibold">{t}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-700 dark:text-zinc-300">{d}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="rules-h">
          <h2 id="rules-h" className="text-xl font-semibold">
            Community rules
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-6 leading-7">
            {c.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">
            Prefer to learn on your own? Everything on Xplaind works without the group. Start from the{" "}
            <Link href="/paths" className={textLink}>
              roadmaps
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
