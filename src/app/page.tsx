import type { Metadata } from "next";
import Link from "next/link";
import { Cover } from "@/components/art/cover";
import { Icon } from "@/components/art/icons";
import { RoleGrid } from "@/components/home/role-grid";
import { MiniCourses, MiniInterview, MiniLesson, MiniProgress, MiniRoadmap } from "@/components/home/showcase";
import { ContinueCard } from "@/components/continue-card";
import { Words } from "@/components/motion/words";
import { RoadScene } from "@/components/three/road-scene";
import { JsonLd } from "@/components/json-ld";
import { getBlogPosts, getContent, getPaths, getProjects, getStops } from "@/lib/content";
import { getInterviewViews } from "@/lib/content/interview";
import { getJobs } from "@/lib/content/jobs";
import { pathView } from "@/lib/content/paths";
import { CODING_LABEL } from "@/lib/paths";
import type { IconName } from "@/lib/themes";
import { primaryButtonLg, secondaryButtonLg } from "@/components/ui";

export const metadata: Metadata = {
  title: { absolute: "Xplaind: AI career roadmaps, lessons and interview practice" },
  description:
    "Everything you need to learn AI, in one place, in the right order: a roadmap for every AI role, a plain-English lesson for each topic, the best course for it, projects and mock interviews. Built for India.",
  alternates: { canonical: "/" },
};

const PAINS: { pain: string; fix: string; href: string; cta: string; icon: IconName }[] = [
  {
    pain: "“I want to learn AI, but I don’t know where to start.”",
    fix: "Pick the job you want. Its roadmap lays out every topic in order, and a 10-minute test skips what you already know.",
    href: "/paths",
    cta: "See the roadmaps",
    icon: "compass",
  },
  {
    pain: "“There are a thousand courses. Which one is worth my time?”",
    fix: "For every topic we pick the one course that teaches it best, and tell you why. Nobody pays us to be on the list.",
    href: "/resources",
    cta: "Browse courses",
    icon: "book",
  },
  {
    pain: "“I watched tutorials, but I still can’t build anything.”",
    fix: "Every lesson ends with a quick check, code examples run right here in your browser, and every stage ends with a project you can show an employer.",
    href: "/playground",
    cta: "Try the code playground",
    icon: "code",
  },
  {
    pain: "“I’m not from a tech background.”",
    fix: "Three roadmaps need no coding at all: AI Product Manager, AI Automation Specialist and AI Governance. Every lesson is in plain English.",
    href: "/paths",
    cta: "See roles without coding",
    icon: "people",
  },
  {
    pain: "“I only have a few hours a week.”",
    fix: "Lessons take about 20 minutes. Tell us your hours and we plan your week, with a reminder every Monday.",
    href: "/plan",
    cta: "Plan my week",
    icon: "map",
  },
  {
    pain: "“I freeze in interviews.”",
    fix: "Answer real AI interview questions out loud, against the clock, and see exactly what you covered and missed.",
    href: "/interview/simulator",
    cta: "Try a mock interview",
    icon: "mic",
  },
];

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "compass", title: "Choose the job you want", text: "Pick one of the AI roles, or take the 10-minute level test and let it suggest where to begin." },
  { icon: "map", title: "Follow the roadmap, one topic at a time", text: "Each topic is a 20-minute lesson, the one course worth your time and a quick check. You always know what comes next." },
  { icon: "trophy", title: "Prove it and get hired", text: "Build a project at the end of every stage, practise interviews out loud, polish your resume and see live openings." },
];

const TRUST: { icon: IconName; title: string; text: string }[] = [
  { icon: "scale", title: "No paid rankings, ever", text: "We pick courses on how well they teach. No one can pay to be listed or to rank higher." },
  { icon: "tick", title: "Prices with dates", text: "When a course costs money, we show the price and the date we checked it, so nothing surprises you." },
  { icon: "chat", title: "Plain English, Indian examples", text: "Lessons explain AI the way a good senior colleague would, with worked examples from Indian work life." },
  { icon: "lock", title: "Start without signing up", text: "Read every lesson, practise every question and use the AI tools without an account. Your progress stays on your device." },
  { icon: "target", title: "Built around real jobs", text: "Each roadmap follows what the role does at work, and the interview questions cover what AI interviews test." },
  { icon: "shield", title: "Honest about the market", text: "Salaries and job figures come with their source and the date we checked them. No hype, no promised packages." },
];

const FAQ = [
  {
    q: "Is Xplaind free?",
    a: "Yes. Every roadmap, lesson, interview question and AI tool on Xplaind is free. Some of the courses we recommend are paid; we always show the price and the date we checked it, and we never take money to rank a course.",
  },
  {
    q: "How is this different from YouTube and online courses?",
    a: "YouTube and course sites give you thousands of options and no order. Xplaind gives you one path: what to learn, in what order, the one resource worth your time for each topic, a check that you understood it, a project to prove it, and interview practice at the end.",
  },
  {
    q: "Which AI role should I choose?",
    a: "Start from your background. If you code, AI Engineer is the broadest start; Generative AI & LLM Engineer, Agentic AI Engineer, Machine Learning Engineer and MLOps Engineer go deeper in one area, and Forward Deployed Engineer adds client work. If you do not code, choose AI Product Manager, AI Automation Specialist or AI Governance & Compliance Specialist. Not sure? The 10-minute level test suggests one.",
  },
  {
    q: "I have never coded. Can I still learn AI here?",
    a: "Yes. The AI Product Manager, AI Automation Specialist and AI Governance & Compliance Specialist roadmaps need no programming. If you later want to build AI applications, the AI Engineer roadmap starts from Python basics, and you can run code right in your browser.",
  },
  {
    q: "How long does it take?",
    a: "Each roadmap shows an estimate, from about three months for AI Product Manager, AI Automation Specialist or AI Governance to about nine months for AI Engineer or Machine Learning Engineer. The level test skips topics you already know, so many learners finish faster.",
  },
  {
    q: "Will this get me a job?",
    a: "No website can promise a job, and we won't. What we promise is a clear path: the skills each role needs, projects you can show, interview practice and an honest view of salaries and openings. The work is yours; the direction is ours.",
  },
  {
    q: "Do I need an account?",
    a: "No. You can learn, practise and use the AI tools without one. Your progress is saved in your browser. An account only keeps it in sync across your devices.",
  },
];

export default function Home() {
  const paths = getPaths().map(pathView);
  const stops = getStops();
  const interview = getInterviewViews();
  const posts = getBlogPosts().slice(0, 3);
  const market = getJobs().market;
  const checked = new Date(`${market.checked}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
  const stats = [
    { value: String(stops.length), label: "plain-English lessons" },
    { value: String(interview.length), label: "interview questions with answers" },
    { value: String(getContent().resources.length), label: "hand-picked courses and videos" },
    { value: String(getProjects().length), label: "guided projects" },
  ];

  return (
    <main className="relative isolate">
      <RoadScene />
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
          <p data-hero-fade className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-violet-900 shadow-sm ring-1 ring-violet-200 dark:bg-zinc-900 dark:text-violet-100 dark:ring-violet-800">
            <span className="size-1.5 rounded-full bg-violet-600" /> AI career roadmaps · Helping India learn AI faster
          </p>
          <h1 id="hero-heading" className="mt-6 max-w-5xl text-[2.6rem] leading-[1.05] font-semibold tracking-tight sm:text-6xl lg:text-[4.25rem]">
            <Words text="Everything you need to learn AI," />{" "}
            <span data-hero-fade className="block bg-gradient-to-r from-violet-700 via-violet-600 to-teal-700 bg-clip-text pb-1 text-transparent dark:from-violet-300 dark:via-violet-300 dark:to-teal-300">
              in one place, in the right order.
            </span>
          </h1>
          <p data-hero-fade className="mt-6 max-w-2xl text-lg leading-8 text-zinc-800 md:text-xl md:leading-9 dark:text-zinc-200">
            No more jumping between random videos and courses. One roadmap per role takes you from the basics to job-ready, with lessons, projects
            and mock interviews built in.
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
                <div key={m.label} className="flex flex-col-reverse justify-end rounded-2xl bg-white p-4 shadow-sm ring-1 ring-violet-100 dark:bg-zinc-900 dark:ring-violet-900">
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

      {/* Problem, in the visitor's own words, each answered: they feel understood before we explain anything. */}
      <section aria-labelledby="pains-heading" className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 id="pains-heading" data-words className="text-3xl font-semibold tracking-tight md:text-4xl">
            <Words text="Sound familiar?" />
          </h2>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-zinc-800 dark:text-zinc-200">
            You are not the problem. The missing path is. Most people learning AI get stuck in the same places, and here is how Xplaind gets you past
            each one.
          </p>
          <ul aria-labelledby="pains-heading" className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3" data-rise-group>
            {PAINS.map((p) => (
              <li key={p.pain} data-rise className="flex gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100 dark:bg-zinc-900 dark:ring-violet-900">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <Icon name={p.icon} size={24} />
                </span>
                <div>
                  <p className="text-lg leading-7 font-semibold">{p.pain}</p>
                  <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">{p.fix}</p>
                  <Link href={p.href} className="mt-3 inline-block font-medium text-violet-800 hover:underline dark:text-violet-300">
                    {p.cta} →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
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
          <p className="mt-3 max-w-2xl text-lg leading-8 text-zinc-800 dark:text-zinc-200">Three steps. You always know where you are and what comes next.</p>
          <ol className="mt-8 grid gap-6 md:grid-cols-3" data-rise-group>
            {STEPS.map((s, i) => (
              <li key={s.title} data-rise className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100 dark:bg-zinc-900 dark:ring-violet-900">
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
            Each card is a full roadmap for one job, with how long it takes and whether it needs coding. Not sure?{" "}
            <Link href="/start" className="font-medium text-violet-800 underline underline-offset-2 dark:text-violet-300">
              Find my level
            </Link>{" "}
            in 10 minutes, or{" "}
            <Link href="/jobs" className="font-medium text-violet-800 underline underline-offset-2 dark:text-violet-300">
              compare salaries
            </Link>
            .
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
          <p className="mt-3 max-w-2xl text-lg leading-8 text-zinc-800 dark:text-zinc-200">Everything a topic needs is on one page, so you never have to hunt for the next step.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-2" data-rise-group>
            <Feature
              title="See the whole journey on one map"
              text="Every topic for your role, in order. Tap one to see what it is, open the best course and mark it done."
              href="/roadmap/genai-engineer"
              cta="Open a roadmap"
              tone="from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950"
            >
              <div className="mx-auto max-w-[280px] text-zinc-600 dark:text-zinc-400">
                <MiniRoadmap />
              </div>
            </Feature>
            <Feature
              title="Understand each topic in 20 minutes"
              text="Our own plain-English explainer, a worked example from Indian work life, the common mistakes and a quick check that earns XP."
              href="/topics"
              cta="Browse lessons"
              tone="from-violet-50 to-violet-100/60 dark:from-violet-950 dark:to-violet-900/40"
            >
              <div className="mx-auto max-w-[300px]">
                <MiniLesson />
              </div>
            </Feature>
            <Feature
              title="Only the courses worth your time"
              text="From Google, Microsoft, AWS, NVIDIA, OpenAI, Anthropic, Hugging Face and more: one chosen for each lesson, plus the certifications worth sitting."
              href="/resources"
              cta="Browse courses"
              tone="from-sky-50 to-teal-50 dark:from-sky-950 dark:to-teal-950"
            >
              <div className="mx-auto max-w-[320px]">
                <MiniCourses />
              </div>
            </Feature>
            <Feature
              title="Write and run code in your browser"
              text="Python with NumPy and pandas, nothing to install. Every code example in a lesson has a Run button, and the AI tutor explains your errors."
              href="/playground"
              cta="Open the playground"
              tone="from-zinc-100 to-violet-100 dark:from-zinc-900 dark:to-violet-950"
            >
              <pre aria-hidden="true" className="mx-auto max-w-[300px] overflow-hidden rounded-2xl bg-zinc-950 p-4 font-mono text-xs leading-5 text-emerald-200 shadow-lg">
                {`>>> tokens = "Learn AI".split()\n>>> len(tokens)\n2\n>>> print("You can do this")\nYou can do this`}
              </pre>
            </Feature>
          </div>
        </div>
      </section>

      {/* Milestone 3: practise, prove it and get hired. */}
      <section aria-labelledby="hired-heading" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Gate n={3} label="Practise and get hired" />
          <h2 id="hired-heading" data-words className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
            <Words text="Build it, say it out loud, get hired" />
          </h2>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-zinc-800 dark:text-zinc-200">Learning is half the job. These tools get you ready for the other half.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-2" data-rise-group>
            <Feature
              title="Practise interviews out loud"
              text={`${interview.length} real questions across every role. Answer against the clock with your voice, then see which key points you covered.`}
              href="/interview/simulator"
              cta="Start a mock interview"
              tone="from-amber-50 to-rose-50 dark:from-amber-950 dark:to-rose-950"
            >
              <div className="mx-auto max-w-[300px]">
                <MiniInterview />
              </div>
            </Feature>
            <div data-rise className="flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-br from-amber-50 to-emerald-50 p-6 ring-1 ring-amber-100 md:p-8 dark:from-amber-950 dark:to-emerald-950 dark:ring-amber-900">
              <div>
                <h3 className="text-xl font-semibold">Stay on track, week after week</h3>
                <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">
                  A study plan sized to your hours, a Monday reminder, and XP, streaks and badges for every lesson and practice session.
                </p>
                <Link href="/plan" className="mt-3 inline-block font-medium text-violet-800 hover:underline dark:text-violet-300">
                  Plan my week →
                </Link>
              </div>
              <MiniProgress />
            </div>
          </div>
          <ul className="mt-6 grid gap-6 md:grid-cols-2" data-rise-group>
            {[
              { href: "/ai/resume", icon: "star" as const, title: "Get your resume shortlisted", text: "Upload it and get fixes in order of importance, rewritten lines and the keywords recruiters look for.", cta: "Review my resume" },
              { href: "/jobs", icon: "target" as const, title: "Know what the job pays", text: "Typical salaries for every AI role in India, the skills job posts ask for, and live openings on Naukri and LinkedIn.", cta: "See jobs and salaries" },
            ].map((c) => (
              <li key={c.href} data-rise className="flex gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100 dark:bg-zinc-950/80 dark:ring-violet-900">
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

      {/* Trust: promises a visitor can check, then what is inside, counted. */}
      <section aria-labelledby="trust-heading" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 id="trust-heading" data-words className="max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
            <Words text="A place you can trust with your time" />
          </h2>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-zinc-800 dark:text-zinc-200">
            Learning AI takes months. You should know exactly what you are getting into, so here is how we work.
          </p>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-rise-group>
            {TRUST.map((t) => (
              <li key={t.title} data-rise className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100 dark:bg-zinc-950/80 dark:ring-violet-900">
                <Icon name={t.icon} size={28} className="text-violet-700 dark:text-violet-300" />
                <h3 className="mt-3 text-lg font-semibold">{t.title}</h3>
                <p className="mt-1 leading-7 text-zinc-700 dark:text-zinc-300">{t.text}</p>
              </li>
            ))}
          </ul>
          <h3 className="mt-14 text-xl font-semibold">What is inside, today</h3>
          <dl data-rise-group className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} data-rise className="flex flex-col-reverse justify-end rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100 dark:bg-zinc-900 dark:ring-violet-900">
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
            Pick a role, open the first topic, and you will know exactly what comes next. No sign-up, no payment, nothing to install.
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
                  <Link href={`/blog/${p.id}`} className="group block overflow-hidden rounded-3xl bg-white ring-1 ring-violet-100 hover:ring-violet-300 dark:bg-zinc-950/80 dark:ring-violet-900">
                    <Cover theme={(["career", "ai-basics", "using-ai"] as const)[i % 3]} seed={p.id} icon="book" className="h-36" iconSize={40} />
                    <span className="block p-5">
                      <span className="block text-lg leading-7 font-semibold group-hover:underline">{p.title}</span>
                      <span className="mt-2 block text-sm leading-6 text-zinc-700 dark:text-zinc-300">{p.description}</span>
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
          <div className="mt-8 divide-y divide-zinc-200 rounded-3xl bg-white ring-1 ring-violet-100 dark:divide-zinc-800 dark:bg-zinc-950/80 dark:ring-violet-900">
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
          <p className="mt-2">Checked {checked}. Forecasts are the publishers&apos; estimates, not promises of jobs.</p>
        </div>
      </section>
    </main>
  );
}

/** A milestone marker: the gate the reader has just reached on the road. */
function Gate({ n, label }: { n: number; label: string }) {
  return (
    <p data-gate className="inline-flex items-center gap-2 rounded-full bg-white py-1 pr-3 pl-1 text-sm font-medium text-violet-900 shadow-sm ring-1 ring-violet-200 dark:bg-zinc-900 dark:text-violet-100 dark:ring-violet-800">
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
  tone,
  children,
}: {
  title: string;
  text: string;
  href: string;
  cta: string;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <div data-rise className="flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-violet-100 dark:bg-zinc-950/80 dark:ring-violet-900">
      <div className={`bg-gradient-to-br ${tone} p-6 md:p-8`}>{children}</div>
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
