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

const A = "font-medium text-violet-800 underline underline-offset-2 dark:text-violet-300";

const GETS: { icon: "mic" | "check" | "target" | "cert" | "chat" | "map"; t: string; d: string }[] = [
  { icon: "map", t: "A roadmap for each role", d: "Nine AI roles, each with lessons, quick checks and guided projects. Students start with a 2-minute level check, so nobody repeats what they know." },
  { icon: "mic", t: "Mock interviews with a readiness score", d: "Spoken or typed mock interviews for their role, reviewed by AI, with a score out of 100 that shows when they are ready." },
  { icon: "check", t: "Project reviews against a rubric", d: "Students link their GitHub project and get it marked criterion by criterion, with what to fix before they show it to a recruiter." },
  { icon: "target", t: "Resume review and job match", d: "Line-by-line resume fixes, a match score for a job post, and a LinkedIn headline written from their own resume." },
  { icon: "chat", t: "A tutor in their language", d: "The AI tutor explains in Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati or Hinglish, keeping technical terms in English." },
  { icon: "cert", t: "Certificates you can check", d: "A certificate for each role, earned by passing the checks and a reviewed project, with a public link anyone can verify." },
];

const HOW = [
  "Tell us your batch size and when placements start.",
  "We reply within 2 working days with a price per student and one invoice with GST.",
  "Students sign up with their own email. Once the invoice is paid, we turn on Pro for each of their accounts.",
  "Students can share their public profile and certificate links with your placement cell.",
];

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
                <span aria-hidden="true" className="grid size-10 place-items-center rounded-2xl bg-violet-50 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
                  <Icon name={g.icon} size={20} />
                </span>
                <h3 className="mt-3 text-lg font-semibold">{g.t}</h3>
                <p className="mt-1 leading-7 text-zinc-700 dark:text-zinc-300">{g.d}</p>
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
                <span className="grid size-9 place-items-center rounded-full bg-violet-700 font-semibold text-white dark:bg-violet-400 dark:text-zinc-950">{i + 1}</span>
                <p className="mt-3 leading-7">{h}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
            Batches start at {MIN_BATCH} students. Accounts and passes are for people aged 18 and over. Lessons, roadmaps and projects stay free for
            everyone; the pass adds the AI tools. See what Pro includes on the{" "}
            <Link href="/pricing" className={A}>
              pricing page
            </Link>
            .
          </p>
        </section>

        <section aria-labelledby="quote-h" className="mt-14 grid gap-8 rounded-3xl border border-zinc-200 bg-white p-5 md:grid-cols-[1fr_1.6fr] md:p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <h2 id="quote-h" className="text-2xl font-semibold tracking-tight">
              Ask for a quote
            </h2>
            <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">The price per student depends on the batch size and how long the passes run. A person replies within 2 working days.</p>
            <p className="mt-4 flex items-center gap-2 text-sm">
              <Icon name="send" size={16} className="shrink-0 text-violet-700 dark:text-violet-300" />
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
