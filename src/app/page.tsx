import { proOpen } from "@/lib/billing/config";
import { accountsEnabled } from "@/lib/supabase/config";
import { siteGraph } from "@/lib/content/structured";
import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/art/icons";
import { RoleGrid } from "@/components/home/role-grid";
import { Testimonials } from "@/components/home/testimonials";
import { MiniInterview, MiniLesson, MiniNotes, MiniPlan, MiniResume, MiniRoadmap } from "@/components/home/showcase";
import { FeatureDeck } from "@/components/home/feature-deck";
import { LanguagesSection } from "@/components/home/languages";
import { Words } from "@/components/motion/words";
import { RoadScene } from "@/components/three/road-scene";
import { JsonLd } from "@/components/json-ld";
import { getContent, getPaths, getProjects, getStops, getTestimonials } from "@/lib/content";
import { getInterviewViews } from "@/lib/content/interview";
import { getJobs } from "@/lib/content/jobs";
import { pathView } from "@/lib/content/paths";
import { CODING_LABEL } from "@/lib/paths";
import { primaryButtonLg, secondaryButtonLg } from "@/components/ui";

export const metadata: Metadata = {
  // SE-8: the brand first, then what people search for ("learn AI free", "AI course", "AI engineer roadmap").
  title: { absolute: "Xplaind: Learn AI for the Job You Want | AI Career Roadmaps" },
  description:
    "Xplaind is an AI learning platform built in India, for learners everywhere: step-by-step roadmaps to 10 AI jobs, 200+ plain-English lessons, portfolio projects and AI interview prep.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Xplaind: learn AI step by step, for the AI job you want",
    description:
      "AI career roadmaps, plain-English lessons, hand-picked courses, guided projects and mock interviews, so you get job-ready in the right order. Built in India, for the world.",
    url: "/",
  },
};


const FAQ = [
  {
    q: "What is Xplaind?",
    a: "Xplaind (xplaind.in) is an AI learning platform built in India, for learners everywhere. It gives you a step-by-step roadmap for the AI job you want, from AI engineer and generative AI engineer to AI product manager, a short plain-English lesson for every topic on it, the best course or video for each topic, guided projects for your portfolio and AI interview questions with answers. It is not related to xplaind.com, a different website about accounting and finance.",
  },
  {
    q: "What will I be able to do at the end?",
    a: `Each roadmap ends with what the job asks for: you can build and explain the projects a hiring manager looks for, answer the interview questions for your role out loud, and show a resume that passes the filters. Along the way, every topic has a short lesson, a quick check and the course or video that teaches it best, so you always know your next step.${
      proOpen() ? " The AI tools (tutor, interview feedback, resume review and the rest) are part of an optional Pro pass, from ₹249; a free account lets you try each one a few times." : ""
    } Some outside courses we recommend charge for a certificate or the course itself; we always show the price and the date we checked it.`,
  },
  {
    q: "How is this different from YouTube and online courses?",
    a: "YouTube and course sites are great at teaching single topics, but they leave you to decide what to learn, in what order, and when you are ready for a job. Xplaind does that part. Each roadmap puts every topic a role needs in order, explains each one in a short plain-English lesson, points you to the one course or video that teaches it best, checks that you understood it, gives you a project to build at each stage and ends with interview practice. You still learn from the best courses out there; we tell you which one to take next.",
  },
  {
    q: "Can I learn in Tamil or Hindi?",
    a: "Yes. Every lesson is also written in everyday spoken Tamil and Hindi, the way you would explain it to a friend, and in Tanglish and Hinglish, which are the same Tamil and Hindi written in English letters. Technical terms, code and numbers stay in English, as they do at work. Open any lesson and use the Read in switch at the top. Videos, courses and the quick check are still in English.",
  },
  {
    q: "Which AI role should I choose?",
    a: "Start from what you do today and what you enjoy. If you can code, or want to, AI Engineer is the broadest start. Generative AI & LLM Engineer, Agentic AI Engineer, Machine Learning Engineer and MLOps Engineer go deeper into one area, and Forward Deployed Engineer adds working directly with clients. If you would rather not code, AI Product Manager, AI Automation Specialist and AI Governance & Compliance Specialist fit people from business, operations, law or policy. Still unsure? The 10-minute level test suggests a role and where to begin.",
  },
  {
    q: "I have never coded. Can I still learn AI here?",
    a: "Yes. AI Product Manager and AI Governance & Compliance Specialist need no programming at all, and AI Automation Specialist needs only a little, using low-code tools. Every lesson is written in plain English with examples from Indian work life. If you later want to build AI apps yourself, the AI Engineer roadmap starts from Python basics, and you can write and run code in your browser with nothing to install.",
  },
  {
    q: "How long does it take?",
    a: "At your own pace. There are no deadlines: learn a topic when you have time, and pick up where you left off. The level test skips the topics you already know, and the weekly plan fits lessons around the hours you have.",
  },
  {
    q: "Will this get me a job?",
    a: "No website can promise you a job, and we won't. What Xplaind gives you is what hiring managers look for: the skills each role needs in the right order, projects you can show, practice answering real interview questions out loud, a resume review, and an honest view of salaries and live openings. The learning and the applying are yours; we make sure you spend your time on the right things.",
  },
  {
    q: "Do I need an account?",
    a: accountsEnabled()
      ? "For the full lessons, yes, a free one. Anyone can read the quick answer and the first part of every lesson, preview every roadmap, take the level test and read the guides on the blog. A free account opens the full lessons, every video lesson and course, the project guides, the full roadmaps, progress synced across your phone and laptop, the mock interview, the PDF roadmaps and the library of research papers and books. The AI tools are part of Pro; a free account lets you try each one a few times. Accounts are for learners aged 18 and over."
      : "Not to start. You can read every lesson, follow any roadmap and practice with the cards and interview questions without signing up, and your progress is saved in your browser. An account keeps your progress in sync across your phone and laptop, and unlocks the mock interview, the PDF roadmaps and the library of research papers and books. Accounts are for learners aged 18 and over.",
  },
];

export default function Home() {
  const testimonials = getTestimonials();
  // Under "What early learners say" these are h3s; without testimonials they head the section themselves.
  const Sub = testimonials.length ? "h3" : "h2";
  const paths = getPaths().map(pathView);
  const stops = getStops();
  const interview = getInterviewViews();
  const market = getJobs().market;
  const checked = new Date(`${market.checked}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
  const checkedMonth = new Date(`${market.checked}T00:00:00+05:30`).toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
  const stats = [
    { value: String(stops.length), label: "plain-English lessons" },
    { value: String(interview.length), label: "interview questions with answers" },
    { value: String(getContent().resources.length), label: "hand-picked courses and videos" },
    { value: String(getProjects().length), label: "guided projects" },
  ];

  return (
    <main className="relative isolate">
      <RoadScene />
      <JsonLd data={siteGraph()} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />

      {/* Hero: the promise first (one place, the right order), then the market as proof. Works before any animation runs. */}
      <section data-hero className="home-hero relative flex items-start md:min-h-[calc(100svh-3.5rem)] md:items-center" aria-labelledby="hero-heading">
        <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-8 md:px-6 md:py-14">
          {/* HM-7 (2026-11-27, owner: "fix/do the 4-12", item 4): the hero is the promise and the two ways in; the
              market figures moved to the proof section, and "How Xplaind works" and the guides left the page. */}
          {/* VI-17 (2026-11-18, site review: the home page never mentioned the AI interviewer): the feature
              people pay for, on the first screen of every device. */}
          {/* HM-6 (2026-11-19, owner: the pill looked like a typical AI badge and "Try" sat alone on one line): a plain
              editorial note in the page's own mono-and-hairline style, with the call to action on its own line. */}
          <Link data-hero-fade href="/interview/simulator" prefetch={false} className="group block max-w-md rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700">
            <span className="flex items-center gap-3 font-mono text-xs tracking-widest text-brand-800 uppercase dark:text-brand-300">
              New
              <span aria-hidden="true" className="h-px w-16 bg-zinc-300 dark:bg-zinc-700" />
            </span>
            <span className="mt-2 block text-base leading-6 text-zinc-800 dark:text-zinc-200">AI mock interviews that score you.</span>
            <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-brand-800 underline underline-offset-4 dark:text-brand-300">
              Try it now
              <span aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-0.5">
                →
              </span>
            </span>
          </Link>
          <h1 id="hero-heading" className="mt-6 max-w-5xl text-[2.6rem] leading-[1.05] font-semibold tracking-tight sm:text-6xl lg:text-[4.25rem]">
            <Words text="The AI career path, mapped." />{" "}
            <span data-hero-fade className="block pb-1 text-zinc-500 dark:text-zinc-400">
              From first lesson to first offer.
            </span>
          </h1>
          <p data-hero-fade className="mt-6 max-w-2xl text-lg leading-8 text-zinc-800 md:text-xl md:leading-9 dark:text-zinc-200">
            One roadmap for the role you want, with lessons, projects and mock interviews in the order that gets you hired.
          </p>
          <div data-hero-fade className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#roles" className={primaryButtonLg}>
              Choose your role
            </a>
            <Link href="/start" className={secondaryButtonLg}>
              Take the 2-minute level check
            </Link>
          </div>
          <ul data-hero-fade className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-700 dark:text-zinc-300" aria-label="Why it is easy to start">
            {["Built in India, for the world", "Lessons in Tamil and Hindi", "AI mock interviewer", "Independent, no paid rankings"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Icon name="tick" size={16} className="text-zinc-500 dark:text-zinc-400" /> {t}
              </li>
            ))}
            <li>
              <Link href="/interview/simulator" prefetch={false} className="text-brand-800 underline underline-offset-4 hover:text-brand-950 dark:text-brand-300 dark:hover:text-brand-200">
                I have an interview soon
              </Link>
            </li>
          </ul>

        </div>
      </section>

      {/* AC-6: "Continue where you left off" lives on My progress (/dashboard), not here (HM-5, 2026-11-19). */}

      {/* Milestone 1: choose a role. */}
      <section id="roles" aria-labelledby="roles-heading" className="scroll-mt-20 py-10 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Gate n={1} label="Start here" />
          <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <h2 id="roles-heading" data-words className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
              <Words text="Choose your AI role" />
            </h2>
            <Link href="/paths" className="shrink-0 text-sm font-medium whitespace-nowrap text-brand-800 hover:underline dark:text-brand-300">
              Compare all roles →
            </Link>
          </div>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-zinc-800 dark:text-zinc-200">
            One roadmap per job. Not sure?{" "}
            {/* On a phone the link starts its own line, so it never breaks mid-phrase. */}
            <span className="block sm:inline">
              <Link href="/start" className="font-medium text-brand-800 underline underline-offset-2 dark:text-brand-300">
                Take the 2-minute level check
              </Link>
              .
            </span>
          </p>
          <div className="mt-8" data-rise-group>
            <RoleGrid
              roles={paths.map((p) => ({
                id: p.id,
                name: p.name,
                tagline: p.tagline,
                theme: p.theme ?? "llm",
                coding: CODING_LABEL[p.coding],
                months: p.months,
                lessons: p.counts.lessons,
              }))}
            />
          </div>
        </div>
      </section>

      {/* Milestone 2, UX-4 (owner request 2026-11-11): every feature in one deck of cards with tabs, instead of three long sections. */}
      <section aria-labelledby="do-heading" className="pt-6 pb-12 md:pt-10 md:pb-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Gate n={2} label="Learn, practise, get hired" />
          <div className="mt-4 grid gap-4 md:grid-cols-[1.3fr_1fr] md:items-end">
            <h2 id="do-heading" data-words className="max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
              <Words text="Everything you need to get job-ready" />
            </h2>
            <p className="max-w-md text-lg leading-8 text-zinc-700 md:justify-self-end dark:text-zinc-300">
              A map for your role, a 20-minute lesson for every topic, practice that sticks, and help getting hired. Pick one to see it.
            </p>
          </div>
          <div className="mt-10">
            <FeatureDeck
              cards={[
                {
                  id: "roadmaps",
                  tab: "Roadmaps",
                  eyebrow: "Roadmaps",
                  title: "See the whole journey on one map",
                  text: "Every topic your AI role needs, in order, from your first lesson to interview day. Tap any topic to see what it is.",
                  cta: { href: "/paths", label: "Choose your role" },
                  more: { href: "/roadmap/genai-engineer", label: "See a roadmap" },
                  tone: "violet",
                  visual: (
                    <div className="mx-auto max-w-[300px] text-zinc-600 dark:text-zinc-400">
                      <MiniRoadmap />
                    </div>
                  ),
                },
                {
                  id: "lessons",
                  tab: "Lessons",
                  eyebrow: "Lessons and courses",
                  title: "Understand any topic in 20 minutes",
                  text: "A plain-English explainer, an example from Indian work life, a quick check, and the one course or video worth your time.",
                  cta: { href: "/stop/what-is-ai", label: "Read the first lesson" },
                  more: { href: "/library?view=topics", label: "Browse topics" },
                  tone: "sky",
                  visual: (
                    <div className="mx-auto max-w-[320px]">
                      <MiniLesson />
                    </div>
                  ),
                },
                {
                  id: "notes",
                  tab: "Your notes",
                  eyebrow: "Study from my notes & books",
                  title: "Turn your own notes into a test and flashcards",
                  text: "Upload a textbook, class notes or a work document. Get questions written only from it.",
                  points: ["Read on your device and never stored", "A timed test with a report, or flashcards", "Every answer shows the page it came from"],
                  cta: { href: "/ai/book", label: "Try it with your notes" },
                  tone: "emerald",
                  visual: <MiniNotes />,
                },
                {
                  id: "interviews",
                  tab: "Interviews",
                  eyebrow: "Interview practice",
                  title: "Practise interviews out loud",
                  text: `${interview.length} real AI interview questions. Answer out loud, against the clock, and see what you covered.`,
                  cta: { href: "/interview/simulator", label: "Start a mock interview" },
                  more: { href: "/interview", label: "Question bank" },
                  tone: "rose",
                  visual: (
                    <div className="mx-auto max-w-[320px]">
                      <MiniInterview />
                    </div>
                  ),
                },
                {
                  id: "plan",
                  tab: "Stay on track",
                  eyebrow: "Stay on track",
                  title: "A plan for your week, sized to your hours",
                  text: "The next lessons for your role, fitted to the time you have, a Monday reminder in your calendar and, if you like, a short progress email every Monday.",
                  cta: { href: "/plan", label: "Plan my week" },
                  more: { href: "/playground", label: "Code playground" },
                  tone: "amber",
                  visual: (
                    <div className="mx-auto max-w-[320px]">
                      <MiniPlan />
                    </div>
                  ),
                },
                {
                  id: "hired",
                  tab: "Get hired",
                  eyebrow: "Resume and jobs",
                  title: "Get shortlisted, and know what the job pays",
                  text: "Fixes for your resume in order of importance, the keywords recruiters search for, and salaries and live openings for every AI role in India.",
                  cta: { href: "/ai/resume", label: "Review my resume" },
                  more: { href: "/jobs", label: "Jobs and salaries" },
                  tone: "teal",
                  visual: <MiniResume />,
                },
              ]}
            />
          </div>
        </div>
      </section>

      {/* LT-2: lessons in the learner's own language, shown with real samples. */}
      <LanguagesSection />

      {/* HM-7: the proof in one place: learners in their own words (SO-1), what is inside, counted, and the
          market behind the promise, each figure sourced and dated (JB-4, moved here from the hero).
          UX-16: one dark band, so the long page has a rhythm and the proof reads as one block. */}
      <section aria-labelledby={testimonials.length ? "voices-heading" : "trust-heading"} className="bg-brand-950 py-14 text-white md:py-28 dark:bg-brand-800">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          {testimonials.length > 0 && (
            <>
              <h2 id="voices-heading" data-words className="max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
                <Words text="What early learners say" />
              </h2>
              <p className="mt-3 max-w-2xl text-lg leading-8 text-brand-100">Freshers, founders and working professionals who tried Xplaind first.</p>
              <Testimonials items={testimonials} />
            </>
          )}
          <div className="mt-10 grid gap-10 md:mt-20 md:gap-14">
            <div>
              <Sub id="trust-heading" className="text-xl font-semibold">
                What is inside, today
              </Sub>
              <p className="mt-1 text-brand-100">No paid rankings, no ads. Every course is picked on merit.</p>
              <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
                {stats.map((m) => (
                  <div key={m.label} className="flex flex-col-reverse justify-end">
                    <dt className="mt-1 text-sm leading-5 text-brand-100">{m.label}</dt>
                    <dd className="text-3xl font-semibold tracking-tight tabular-nums md:text-4xl">{m.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <Sub className="text-xl font-semibold">Why now: India&apos;s AI job market</Sub>
              <p className="mt-1 text-brand-100">
                <a href="#market-sources" className="underline underline-offset-2">
                  Sources
                </a>
                , checked {checked}
              </p>
              <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
                {market.stats.map((m) => (
                  <div key={m.label} className="flex flex-col-reverse justify-end">
                    <dt className="mt-1 text-sm leading-5 text-brand-100">{m.label}</dt>
                    <dd className="text-3xl font-semibold tracking-tight tabular-nums md:text-4xl">{m.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Milestone 4: the finish line. A small first step, and nothing to lose by taking it. */}
      <section aria-labelledby="final-heading" className="py-12 text-left md:py-36 md:text-center">
        <div className="mx-auto max-w-3xl px-4">
          {/* Left-aligned on phones like the other milestones; centred as a closing call on larger screens. */}
          <div className="flex justify-start md:justify-center">
            <Gate n={3} label="Your AI career" />
          </div>
          <h2 id="final-heading" data-words className="mt-5 text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            <Words text="Your AI career starts with one 20-minute lesson" />
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-800 md:mx-auto dark:text-zinc-200">
            Pick a role and open the first topic. Free, with nothing to install.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row md:justify-center">
            <Link href="/paths" className={primaryButtonLg}>
              Start my roadmap
            </Link>
            <Link href="/start" className={secondaryButtonLg}>
              Find my level first
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ: the doubts that stop people starting, answered honestly. */}
      <section aria-labelledby="faq-heading" className="pt-8 pb-16 md:pb-20">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <h2 id="faq-heading" data-words className="text-3xl font-semibold tracking-tight md:text-4xl">
            <Words text="Questions you might have" />
          </h2>
          <div className="mt-8 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {FAQ.map((f) => (
              <details key={f.q} className="group px-5 py-2 md:py-4">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden="true" className="text-xl text-zinc-500 transition-transform duration-200 group-open:rotate-45 dark:text-zinc-400">
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">{f.a}</p>
              </details>
            ))}
          </div>
          {/* HM-7: the guides left the page; one link keeps the blog a tap away from home. */}
          <p className="mt-6 leading-7 text-zinc-700 dark:text-zinc-300">
            More in the guides: AI courses with a certificate, how to become an AI engineer in India, and more.{" "}
            <Link href="/blog" className="font-medium text-brand-800 underline underline-offset-2 dark:text-brand-300">
              Read the guides
            </Link>
          </p>
        </div>
      </section>

      {/* JB-4: where the market figures in the hero come from. */}
      <section id="market-sources" aria-labelledby="sources-heading" className="scroll-mt-20 pb-12 md:pb-32">
        <div className="mx-auto max-w-3xl px-4 text-sm text-zinc-700 md:px-6 dark:text-zinc-300">
          <h2 id="sources-heading" className="font-semibold">
            Sources for the market figures
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {market.stats.map((m) => (
              <li key={m.url}>
                {m.value} {m.label}:{" "}
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                  {m.source}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-2">Checked on {checkedMonth}. Forecasts are the publishers&apos; estimates, not promises of jobs.</p>
        </div>
      </section>
    </main>
  );
}

/** A milestone marker: the gate the reader has just reached on the road. */
function Gate({ n, label }: { n: number; label: string }) {
  return (
    <p data-gate>
      <Marker n={n} label={`Milestone ${n}`} text={label} />
    </p>
  );
}

/**
 * The signature detail: a distance marker on the road, a mono number and a short rule. Used only
 * for the steps and milestones, so the page reads as one road from the first step to the last.
 */
function Marker({ n, label, text }: { n: number; label: string; text?: string }) {
  return (
    <span className="flex items-center gap-3 font-mono text-sm text-zinc-600 tabular-nums dark:text-zinc-400">
      <span className="sr-only">{label}{text ? ": " : ""}</span>
      <span aria-hidden="true" className="text-zinc-900 dark:text-white">{String(n).padStart(2, "0")}</span>
      <span aria-hidden="true" className="h-px w-8 bg-zinc-300 dark:bg-zinc-700" />
      {text && <span>{text}</span>}
    </span>
  );
}
