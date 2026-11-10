import { proOpen } from "@/lib/billing/config";
import { accountsEnabled } from "@/lib/supabase/config";
import { siteGraph } from "@/lib/content/structured";
import type { Metadata } from "next";
import Link from "next/link";
import { GuideCover } from "@/components/guide-cover";
import { Icon } from "@/components/art/icons";
import { RoleGrid } from "@/components/home/role-grid";
import { Testimonials } from "@/components/home/testimonials";
import { MiniCourses, MiniInterview, MiniLesson, MiniNotes, MiniPlan, MiniRoadmap } from "@/components/home/showcase";
import { ContinueCard } from "@/components/continue-card";
import { Words } from "@/components/motion/words";
import { RoadScene } from "@/components/three/road-scene";
import { JsonLd } from "@/components/json-ld";
import { getBlogPosts, getContent, getPaths, getProjects, getStops, getTestimonials } from "@/lib/content";
import { getInterviewViews } from "@/lib/content/interview";
import { getJobs } from "@/lib/content/jobs";
import { pathView } from "@/lib/content/paths";
import { CODING_LABEL } from "@/lib/paths";
import type { IconName } from "@/lib/themes";
import { primaryButtonLg, secondaryButtonLg } from "@/components/ui";

export const metadata: Metadata = {
  // SE-8: the brand first, then what people search for ("learn AI free", "AI course", "AI engineer roadmap").
  title: { absolute: "Xplaind: Learn AI for the Job You Want | AI Roadmaps, India" },
  description:
    "Xplaind is an AI learning platform for India: step-by-step roadmaps to 9 AI jobs, 200+ plain-English lessons, portfolio projects and AI interview prep.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Xplaind: learn AI step by step, for the AI job you want",
    description:
      "AI career roadmaps, plain-English lessons, hand-picked courses, guided projects and mock interviews, so you get job-ready in the right order. Built for India.",
    url: "/",
  },
};


const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "compass", title: "Choose the job you want", text: "Pick an AI role, or let the 10-minute level test suggest one." },
  { icon: "map", title: "Follow the roadmap, one topic at a time", text: "Each topic is a 20-minute lesson, the best course and a quick check." },
  { icon: "trophy", title: "Prove it and get hired", text: "Build projects, practice interviews out loud and see live openings." },
];


const FAQ = [
  {
    q: "What is Xplaind?",
    a: "Xplaind (xplaind.in) is an AI learning platform for India. It gives you a step-by-step roadmap for the AI job you want, from AI engineer and generative AI engineer to AI product manager, a short plain-English lesson for every topic on it, the best course or video for each topic, guided projects for your portfolio and AI interview questions with answers. It is not related to xplaind.com, a different website about accounting and finance.",
  },
  {
    q: "What will I be able to do at the end?",
    a: `Each roadmap ends with what the job asks for: you can build and explain the projects a hiring manager looks for, answer the interview questions for your role out loud, and show a resume that passes the filters. Along the way, every topic has a short lesson, a quick check and the course or video that teaches it best, so you always know your next step.${
      proOpen() ? " If you want more AI help each day, an optional Pro pass raises the AI tool limits, from ₹249." : ""
    } Some outside courses we recommend charge for a certificate or the course itself; we always show the price and the date we checked it.`,
  },
  {
    q: "How is this different from YouTube and online courses?",
    a: "YouTube and course sites are great at teaching single topics, but they leave you to decide what to learn, in what order, and when you are ready for a job. Xplaind does that part. Each roadmap puts every topic a role needs in order, explains each one in a short plain-English lesson, points you to the one course or video that teaches it best, checks that you understood it, gives you a project to build at each stage and ends with interview practice. You still learn from the best courses out there; we tell you which one to take next.",
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
      ? "Not to start learning. Every lesson, topic, practice card, interview answer, project guide and guide on the blog is open without signing up, and you can preview the start of every roadmap. An account shows the full roadmaps, keeps your progress in sync across your phone and laptop, and unlocks the AI tutor and other AI tools, the mock interview, the PDF roadmaps and the library of research papers and books. Accounts are for learners aged 18 and over; under-18s can still read every lesson."
      : "Not to start. You can read every lesson, follow any roadmap and practice with the cards and interview questions without signing up, and your progress is saved in your browser. An account keeps your progress in sync across your phone and laptop, and unlocks the mock interview, the PDF roadmaps and the library of research papers and books. Accounts are for learners aged 18 and over.",
  },
];

export default function Home() {
  const testimonials = getTestimonials();
  const paths = getPaths().map(pathView);
  const stops = getStops();
  const interview = getInterviewViews();
  const posts = getBlogPosts().slice(0, 3);
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
      <section data-hero className="home-hero relative flex min-h-[calc(100svh-3.5rem)] items-center" aria-labelledby="hero-heading">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6">
          <p data-hero-fade className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-violet-900 ring-1 ring-violet-200 dark:bg-zinc-900 dark:text-violet-100 dark:ring-violet-800">
            <span className="size-1.5 rounded-full bg-violet-600" /> Xplaind · AI learning platform for India
          </p>
          <h1 id="hero-heading" className="mt-6 max-w-5xl text-[2.6rem] leading-[1.05] font-semibold tracking-tight sm:text-6xl lg:text-[4.25rem]">
            <Words text="Everything you need to learn AI," />{" "}
            <span data-hero-fade className="block bg-gradient-to-r from-violet-700 via-violet-600 to-teal-700 bg-clip-text pb-1 text-transparent dark:from-violet-300 dark:via-violet-300 dark:to-teal-300">
              in one place, in the right order.
            </span>
          </h1>
          <p data-hero-fade className="mt-6 max-w-2xl text-lg leading-8 text-zinc-800 md:text-xl md:leading-9 dark:text-zinc-200">
            No more jumping between random videos. One roadmap per role takes you from the basics to job-ready.
          </p>
          <div data-hero-fade className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a data-magnetic href="#roles" className={primaryButtonLg}>
              <Icon name="compass" size={18} /> Choose your role
            </a>
            <Link data-magnetic href="/start" className={secondaryButtonLg}>
              <Icon name="sparkles" size={18} /> Find my level in 10 minutes
            </Link>
          </div>
          <ul data-hero-fade className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-zinc-800 dark:text-zinc-200" aria-label="Why it is easy to start">
            {["No sign-up to start", "Plain English", "No paid rankings"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Icon name="tick" size={16} className="text-emerald-700 dark:text-emerald-400" /> {t}
              </li>
            ))}
            <li>
              <Link href="/interview/simulator" className="flex items-center gap-1.5 text-violet-900 underline-offset-4 hover:underline dark:text-violet-200">
                <Icon name="mic" size={16} /> I have an interview soon
              </Link>
            </li>
          </ul>

          {/* JB-4: the market behind the promise, each figure sourced and dated. */}
          <div data-hero-fade className="mt-10 max-w-4xl">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Why now: India&apos;s AI job market</p>
            <dl className="mt-3 grid gap-3 sm:grid-cols-3">
              {market.stats.map((m) => (
                <div key={m.label} className="flex flex-col-reverse justify-end rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <dt className="mt-1 text-sm leading-5 text-zinc-700 dark:text-zinc-300">{m.label}</dt>
                  <dd className="text-3xl font-semibold tracking-tight text-violet-800 md:text-4xl dark:text-violet-300">{m.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              <a href="#market-sources" className="underline underline-offset-2">
                Sources
              </a>
              , checked {checked}
            </p>
          </div>
        </div>
      </section>

      {/* AC-6: a returning learner carries on from their last lesson. */}
      <div className="mx-auto max-w-6xl px-4 empty:hidden md:px-6 [&>section]:my-8">
        <ContinueCard titles={Object.fromEntries(stops.map((s) => [s.id, s.title]))} />
      </div>

      {/* The solution in three steps, before the detail. */}
      <section aria-labelledby="how-heading" className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 id="how-heading" data-words className="max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
            <Words text="How Xplaind works" />
          </h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3" data-rise-group>
            {STEPS.map((s, i) => (
              <li key={s.title} data-rise className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <span className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-violet-700 font-semibold text-white">{i + 1}</span>
                  <Icon name={s.icon} size={24} className="text-emerald-700 dark:text-emerald-400" />
                </span>
                <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Milestone 1: choose a role. */}
      <section id="roles" aria-labelledby="roles-heading" className="scroll-mt-20 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Gate n={1} label="Start here" />
          <div className="mt-4 flex items-end justify-between gap-4">
            <h2 id="roles-heading" data-words className="max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
              <Words text="Choose your AI role" />
            </h2>
            <Link href="/paths" className="shrink-0 text-sm font-medium whitespace-nowrap text-violet-800 hover:underline dark:text-violet-300">
              Compare all roles →
            </Link>
          </div>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-zinc-800 dark:text-zinc-200">
            One roadmap per job. Not sure?{" "}
            <Link href="/start" className="font-medium text-violet-800 underline underline-offset-2 dark:text-violet-300">
              Find my level
            </Link>{" "}
            in 10 minutes.
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

      {/* Milestone 2: learn. */}
      <section aria-labelledby="do-heading" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Gate n={2} label="Learn" />
          <h2 id="do-heading" data-words className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
            <Words text="Learn it properly, without the overwhelm" />
          </h2>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-zinc-800 dark:text-zinc-200">Everything a topic needs, on one page.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-2" data-rise-group>
            <Feature
              title="See the whole journey on one map"
              text="Every topic for your role, in order. Tap one to see what it is."
              href="/roadmap/genai-engineer"
              cta="Open a roadmap"
            >
              <div className="mx-auto max-w-[280px] text-zinc-600 dark:text-zinc-400">
                <MiniRoadmap />
              </div>
            </Feature>
            <Feature
              title="Understand each topic in 20 minutes"
              text="A plain-English explainer, an example from Indian work life and a quick check."
              href="/topics"
              cta="Browse lessons"
            >
              <div className="mx-auto max-w-[300px]">
                <MiniLesson />
              </div>
            </Feature>
            <Feature
              title="Only the courses worth your time"
              text="One picked for each lesson, from Google, AWS, OpenAI, Anthropic and more."
              href="/resources"
              cta="Browse courses"
            >
              <div className="mx-auto max-w-[320px]">
                <MiniCourses />
              </div>
            </Feature>
            <Feature
              title="Write and run code in your browser"
              text="Python with nothing to install. The AI tutor explains your errors."
              href="/playground"
              cta="Open the playground"
            >
              <pre aria-hidden="true" className="mx-auto max-w-[300px] overflow-hidden rounded-2xl bg-zinc-950 p-4 font-mono text-xs leading-5 text-emerald-200">
                {`>>> tokens = "Learn AI".split()\n>>> len(tokens)\n2\n>>> print("You can do this")\nYou can do this`}
              </pre>
            </Feature>
          </div>
        </div>
      </section>

      {/* MB-5, owner request 2026-11-06: "Study from my notes & books" is a product on its own, so it gets its own spotlight. */}
      <section aria-labelledby="notes-heading" className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="grid items-center gap-10 rounded-2xl border border-zinc-200 bg-white p-6 md:grid-cols-2 md:p-12 dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <p className="text-sm font-semibold text-violet-800 dark:text-violet-300">Study from my notes &amp; books</p>
              <h2 id="notes-heading" data-words className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                <Words text="Turn your own notes into a test and flashcards" />
              </h2>
              <p className="mt-3 text-lg leading-8 text-zinc-700 dark:text-zinc-300">
                Upload a textbook, class notes or a work document. Get questions written only from it, so you study what your exam or job needs.
              </p>
              <ul className="mt-5 flex flex-col gap-3">
                {[
                  "A PDF or Word file, read on your device and never stored",
                  "A timed test with a report, or a deck of flashcards",
                  "Every answer shows the page it came from",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300">
                      <Icon name="check" size={14} />
                    </span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <Link href="/ai/book" className={`${primaryButtonLg} mt-7`}>
                Try it with your notes
              </Link>
            </div>
            <MiniNotes />
          </div>
        </div>
      </section>

      {/* Milestone 3: practice, prove it and get hired. */}
      <section aria-labelledby="hired-heading" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Gate n={3} label="Practice and get hired" />
          <h2 id="hired-heading" data-words className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
            <Words text="Build it, say it out loud, get hired" />
          </h2>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-zinc-800 dark:text-zinc-200">Learning is half the job. These tools cover the other half.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-2" data-rise-group>
            <Feature
              title="Practice interviews out loud"
              text={`${interview.length} real questions. Answer out loud, against the clock, and see what you covered.`}
              href="/interview/simulator"
              cta="Start a mock interview"
            >
              <div className="mx-auto max-w-[300px]">
                <MiniInterview />
              </div>
            </Feature>
            <Feature
              title="Stay on track, week after week"
              text="A weekly plan sized to your hours, and a streak that shows the days you learnt."
              href="/plan"
              cta="Plan my week"
            >
              <div className="mx-auto max-w-[300px]">
                <MiniPlan />
              </div>
            </Feature>
          </div>
          <ul className="mt-6 grid gap-6 md:grid-cols-2" data-rise-group>
            {[
              { href: "/ai/resume", icon: "star" as const, title: "Get your resume shortlisted", text: "Get fixes in order of importance and the keywords recruiters look for.", cta: "Review my resume" },
              { href: "/jobs", icon: "target" as const, title: "Know what the job pays", text: "Salaries for every AI role in India, and live openings.", cta: "See jobs and salaries" },
            ].map((c) => (
              <li key={c.href} data-rise className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300">
                  <Icon name={c.icon} size={24} />
                </span>
                <div>
                  <h3 className="text-xl font-semibold">{c.title}</h3>
                  <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">{c.text}</p>
                  <Link href={c.href} className="mt-3 inline-block font-medium text-violet-800 hover:underline dark:text-violet-300">
                    {c.cta} →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* SO-1: early users, in their own words (real, shared with permission). */}
      {testimonials.length > 0 && (
        <section aria-labelledby="voices-heading" className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <h2 id="voices-heading" data-words className="max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
              <Words text="What early learners say" />
            </h2>
            <p className="mt-3 max-w-2xl text-lg leading-8 text-zinc-700 dark:text-zinc-300">Freshers, founders and working professionals who tried Xplaind first.</p>
            <Testimonials items={testimonials} />
          </div>
        </section>
      )}

      {/* Trust: what is inside, counted. */}
      <section aria-labelledby="trust-heading" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 id="trust-heading" data-words className="max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
            <Words text="What is inside, today" />
          </h2>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-zinc-700 dark:text-zinc-300">No paid rankings, no ads. Every course is picked on merit.</p>
          <dl data-rise-group className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} data-rise className="flex flex-col-reverse justify-end rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <dt className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{s.label}</dt>
                <dd data-count className="text-4xl font-semibold tracking-tight md:text-5xl">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Milestone 4: the finish line. A small first step, and nothing to lose by taking it. */}
      <section aria-labelledby="final-heading" className="py-24 text-left md:py-36 md:text-center">
        <div className="mx-auto max-w-3xl px-4">
          {/* Left-aligned on phones like the other milestones; centred as a closing call on larger screens. */}
          <div className="flex justify-start md:justify-center">
            <Gate n={4} label="Your AI career" />
          </div>
          <h2 id="final-heading" data-words className="mt-5 text-4xl font-semibold tracking-tight text-balance md:text-6xl">
            <Words text="Your AI career starts with one 20-minute lesson." />
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-800 md:mx-auto dark:text-zinc-200">
            Pick a role and open the first topic. No sign-up, nothing to install.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row md:justify-center">
            <Link data-magnetic href="/paths" className={primaryButtonLg}>
              Start my roadmap
            </Link>
            <Link href="/start" className={secondaryButtonLg}>
              Find my level first
            </Link>
          </div>
        </div>
      </section>

      {/* Guides */}
      {posts.length > 0 && (
        <section aria-labelledby="guides-heading" className="py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="flex items-end justify-between gap-4">
              <h2 id="guides-heading" data-words className="text-3xl font-semibold tracking-tight md:text-4xl">
                <Words text="Guides" />
              </h2>
              <Link href="/blog" className="font-medium text-violet-800 hover:underline dark:text-violet-300">
                All guides →
              </Link>
            </div>
            <ul className="mt-8 grid gap-6 md:grid-cols-3" data-rise-group>
              {posts.map((p, i) => (
                <li key={p.id} data-rise>
                  <Link href={`/blog/${p.id}`} className="group block overflow-hidden rounded-2xl border border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
                    <GuideCover cover={p.cover} theme={(["career", "ai-basics", "using-ai"] as const)[i % 3]} seed={p.id} />
                    <span className="block p-5">
                      <span className="block text-lg leading-7 font-semibold group-hover:underline">{p.title}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* FAQ: the doubts that stop people starting, answered honestly. */}
      <section aria-labelledby="faq-heading" className="pt-8 pb-16 md:pb-20">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <h2 id="faq-heading" data-words className="text-3xl font-semibold tracking-tight md:text-4xl">
            <Words text="Questions you might have" />
          </h2>
          <div className="mt-8 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {FAQ.map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden="true" className="text-xl transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* JB-4: where the market figures in the hero come from. */}
      <section id="market-sources" aria-labelledby="sources-heading" className="scroll-mt-20 pb-24 md:pb-32">
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
    <p data-gate className="inline-flex items-center gap-2 rounded-full bg-white py-1 pr-3 pl-1 text-sm font-medium text-violet-900 ring-1 ring-violet-200 dark:bg-zinc-900 dark:text-violet-100 dark:ring-violet-800">
      <span className="grid size-6 place-items-center rounded-full bg-violet-700 text-xs font-semibold text-white">{n}</span>
      Milestone {n} · {label}
    </p>
  );
}

function Feature({
  title,
  text,
  href,
  cta,
  children,
}: {
  title: string;
  text: string;
  href: string;
  cta: string;
  children: React.ReactNode;
}) {
  return (
    <div data-rise className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-center border-b border-zinc-200 bg-zinc-50 p-6 md:min-h-[21rem] md:p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="w-full">{children}</div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="mt-2 flex-1 leading-7 text-zinc-700 dark:text-zinc-300">{text}</p>
        <Link href={href} className="mt-4 font-medium text-violet-800 hover:underline dark:text-violet-300">
          {cta} →
        </Link>
      </div>
    </div>
  );
}
