import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/art/icons";
import { PageHero } from "@/components/page-hero";
import { MIN_BATCH } from "@/lib/batch/enquiry";
import { BUSINESS } from "@/lib/business";
import { pageMeta } from "@/lib/seo";
import { BatchEnquiryForm } from "./batch-enquiry-form";

export const metadata: Metadata = pageMeta({
  title: ["Xplaind for Colleges: AI Placement Prep for Your Batch", "Xplaind for Colleges"],
  description:
    "Give every student in a batch Xplaind Pro: AI roadmaps, mock interviews with a readiness score, project reviews, resume match and verified certificates. One invoice with GST.",
  path: "/colleges",
});

const A = "font-medium text-brand-800 underline underline-offset-2 dark:text-brand-300";

// UX-22 (2026-11-27, owner: "don't have sections with so much text"): one short line per card and per step.
const GETS: { icon: "mic" | "check" | "target" | "cert" | "chat" | "map"; t: string; d: string }[] = [
  { icon: "map", t: "A roadmap for each role", d: "Ten AI roles, after a 2-minute level check" },
  { icon: "mic", t: "Mock interviews", d: "Spoken or typed, with a readiness score out of 100" },
  { icon: "check", t: "Project reviews", d: "Marked against a rubric, with what to fix" },
  { icon: "target", t: "Resume and job match", d: "Line-by-line fixes and a match score" },
  { icon: "chat", t: "A tutor in their language", d: "Hindi, Tamil, Telugu, Hinglish and more" },
  { icon: "cert", t: "Certificates you can check", d: "Earned, with a public link to verify" },
];

const HOW = ["Tell us your batch size and dates", "We quote per student within 2 working days, one GST invoice", "Students sign up; we turn on Pro once paid", "They share profiles and certificates with your cell"];

/** CB-1: Pro for a batch of learners, for colleges, training institutes and companies. */
export default function CollegesPage() {
  return (
    <main>
      <PageHero
        theme="career"
        shape="icon:people"
        icon="people"
        eyebrow="For colleges and institutes"
        title="Placement prep for your whole batch"
        lead="Give every student Xplaind Pro: a roadmap for the AI role they want, mock interviews with a readiness score, project reviews and verified certificates."
      />
      <div className="mx-auto max-w-5xl px-4 pt-4 pb-16 md:px-6">
        <section aria-labelledby="gets-h">
          <h2 id="gets-h" className="text-2xl font-semibold tracking-tight md:text-3xl">
            What each student gets
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GETS.map((g) => (
              <li key={g.t} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <span aria-hidden="true" className="grid size-10 place-items-center rounded-2xl bg-brand-50 text-brand-800 dark:bg-brand-950/50 dark:text-brand-300">
                  <Icon name={g.icon} size={20} />
                </span>
                <h3 className="mt-3 text-lg font-semibold">{g.t}</h3>
                <p className="mt-1 leading-6 text-zinc-700 dark:text-zinc-300">{g.d}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="how-h" className="mt-14">
          <h2 id="how-h" className="text-2xl font-semibold tracking-tight md:text-3xl">
            How it works
          </h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-4">
            {HOW.map((h, i) => (
              <li key={h} className="rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-900">
                <span className="grid size-9 place-items-center rounded-full bg-brand-700 font-semibold text-white dark:bg-brand-400 dark:text-zinc-950">{i + 1}</span>
                <p className="mt-3 leading-6 font-medium">{h}</p>
              </li>
            ))}
          </ol>
          <ul className="mt-4 flex flex-wrap gap-2 text-sm">
            {[`From ${MIN_BATCH} students`, "Ages 18 and over", "Lessons and roadmaps stay free", "The pass adds the AI tools"].map((t) => (
              <li key={t} className="rounded-full bg-zinc-100 px-3 py-1.5 font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                {t}
              </li>
            ))}
            <li>
              <Link href="/pricing" className={`${A} inline-flex min-h-11 items-center px-1`}>
                What Pro includes
              </Link>
            </li>
          </ul>
        </section>

        <section aria-labelledby="quote-h" className="mt-14 grid gap-8 rounded-3xl border border-zinc-200 bg-white p-5 md:grid-cols-[1fr_1.6fr] md:p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <h2 id="quote-h" className="text-2xl font-semibold tracking-tight">
              Ask for a quote
            </h2>
            <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">The price per student depends on the batch size and how long the passes run. A person replies within 2 working days.</p>
            <p className="mt-4 flex items-center gap-2 text-sm">
              <Icon name="send" size={16} className="shrink-0 text-brand-700 dark:text-brand-300" />
              Or write to{" "}
              <a href={`mailto:${BUSINESS.email}?subject=Xplaind%20for%20our%20batch`} className={`${A} break-all`}>
                {BUSINESS.email}
              </a>
            </p>
          </div>
          <BatchEnquiryForm email={BUSINESS.email} />
        </section>
      </div>
    </main>
  );
}
