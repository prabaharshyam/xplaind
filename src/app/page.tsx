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
import { pathView } from "@/lib/content/paths";
import { CODING_LABEL } from "@/lib/paths";
import type { IconName } from "@/lib/themes";

export const metadata: Metadata = {
  title: { absolute: "Xplaind: AI career roadmaps, lessons and interview practice" },
  description:
    "Learn AI for the job you want. Step-by-step roadmaps for AI roles from AI Engineer to MLOps Engineer, a plain-English lesson for every topic, the best course for each, and mock interviews you answer out loud.",
  alternates: { canonical: "/" },
};

const PAINS: { pain: string; fix: string; href: string; cta: string; icon: IconName }[] = [
  {
    pain: "“I want to learn AI, but I don’t know where to start.”",
    fix: "Pick the job you want. Its roadmap shows every topic in order, and a 10-minute test skips what you already know.",
    href: "/paths",
    cta: "See the roadmaps",
    icon: "compass",
  },
  {
    pain: "“There are a thousand courses. Which one is worth my time?”",
    fix: "For every topic we pick the one course that teaches it best, and tell you why. No paid placements, ever.",
    href: "/resources",
    cta: "Browse courses",
    icon: "book",
  },
  {
    pain: "“I watched tutorials, but I still can’t build anything.”",
    fix: "Every lesson ends with a check, and every stage ends with a project you can put on GitHub and show an employer.",
    href: "/roadmap/genai-engineer",
    cta: "See a project path",
    icon: "code",
  },
  {
    pain: "“I freeze in interviews.”",
    fix: "Answer real AI interview questions out loud, against the clock, and get a report on what you covered and missed.",
    href: "/interview/simulator",
    cta: "Try a mock interview",
    icon: "mic",
  },
];

const FAQ = [
  {
    q: "Which AI role should I choose?",
    a: "Start from your background. If you code, AI Engineer is the broadest start; Generative AI & LLM Engineer, Agentic AI Engineer, Machine Learning Engineer and MLOps Engineer go deeper in one area, and Forward Deployed Engineer adds client work. If you do not code, choose AI Product Manager, AI Automation Specialist or AI Governance & Compliance Specialist.",
  },
  {
    q: "How do you choose the courses?",
    a: "For every topic we pick the one course that teaches it best, and say why. When a course costs money we show the price and the date we checked it. We never take money to rank a course.",
  },
  {
    q: "I have never coded. Can I still learn AI here?",
    a: "Yes. The AI Product Manager, AI Automation Specialist and AI Governance & Compliance Specialist roadmaps need no programming. If you later want to build AI applications, the AI Engineer roadmap starts from Python basics.",
  },
  {
    q: "How long does it take?",
    a: "Each roadmap shows an estimate, from about three months for AI Product Manager, AI Automation Specialist or AI Governance to about nine months for AI Engineer or Machine Learning Engineer. The level test skips topics you already know, so many learners finish faster.",
  },
  {
    q: "Do I need an account?",
    a: "Not to learn. Every roadmap, lesson and interview question is open to read. A free account, with Google, GitHub or email, saves your progress and unlocks roadmap downloads, the mock interview, the papers library and the AI tools.",
  },
];

export default function Home() {
  const paths = getPaths().map(pathView);
  const stops = getStops();
  const interview = getInterviewViews();
  const posts = getBlogPosts().slice(0, 3);
  const stats = [
    { value: String(stops.length), label: "lessons" },
    { value: String(interview.length), label: "interview questions" },
    { value: String(getContent().resources.length), label: "courses and video lessons" },
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

      {/* Hero: the start of the road. The message and actions work before any animation runs. */}
      <section data-hero className="home-hero relative flex min-h-[calc(100svh-3.5rem)] items-center" aria-labelledby="hero-heading">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6">
          <p data-hero-fade className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-violet-900 shadow-sm ring-1 ring-violet-200 backdrop-blur dark:bg-white/10 dark:text-violet-100 dark:ring-violet-800">
            <span className="size-1.5 rounded-full bg-violet-600" /> AI career roadmaps · Helping India learn AI faster
          </p>
          <h1 id="hero-heading" className="mt-6 max-w-3xl text-5xl leading-[1.02] font-semibold tracking-tight sm:text-6xl md:text-7xl">
            <Words text="Learn AI for the job you want." />{" "}
            <span data-hero-fade className="block bg-gradient-to-r from-violet-700 via-fuchsia-600 to-teal-600 bg-clip-text pb-1 text-transparent dark:from-violet-300 dark:via-pink-300 dark:to-teal-300">
              One clear road per role.
            </span>
          </h1>
          <p data-hero-fade className="mt-6 max-w-xl text-lg leading-8 text-zinc-800 dark:text-zinc-200">
            Pick an AI role and follow its roadmap: a plain-English lesson for every topic, the one course worth your time, real projects, then
            interview practice out loud.
          </p>
          <div data-hero-fade className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a data-magnetic href="#roles" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-violet-700 px-6 font-medium text-white shadow-lg shadow-violet-700/30 hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700">
              <Icon name="compass" size={18} /> Choose your role
            </a>
            <Link data-magnetic href="/start" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white/85 px-6 font-medium text-violet-950 ring-1 ring-violet-200 backdrop-blur hover:bg-white dark:bg-white/10 dark:text-violet-100 dark:ring-violet-800">
              <Icon name="sparkles" size={18} /> Find my level in 10 minutes
            </Link>
          </div>
          <p data-hero-fade className="mt-4 text-sm">
            <Link href="/interview/simulator" className="inline-flex min-h-11 items-center gap-2 font-medium text-violet-900 underline-offset-4 hover:underline dark:text-violet-200">
              <Icon name="mic" size={18} /> I have an interview soon
            </Link>
          </p>
          <p data-hero-fade className="mt-14 hidden items-center gap-3 text-sm font-medium text-zinc-700 md:flex dark:text-zinc-300">
            <span className="relative flex h-9 w-5 justify-center rounded-full ring-1 ring-zinc-400 dark:ring-zinc-500">
              <span className="journey-cue mt-1.5 size-1.5 rounded-full bg-violet-600" />
            </span>
            Scroll to start the journey
          </p>
        </div>
      </section>

      {/* Right after the hero: the problems visitors recognise, each with how the site solves it. */}
      <section aria-labelledby="pains-heading" className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 id="pains-heading" data-words className="text-3xl font-semibold tracking-tight md:text-4xl">
            <Words text="Sound familiar?" />
          </h2>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-zinc-800 dark:text-zinc-200">
            Most people learning AI get stuck in the same places. Here is how Xplaind gets you past each one.
          </p>
          <ul aria-labelledby="pains-heading" className="mt-8 grid gap-5 md:grid-cols-2" data-rise-group>
            {PAINS.map((p) => (
              <li key={p.pain} data-rise className="flex gap-4 rounded-3xl bg-white/85 p-6 shadow-sm ring-1 ring-violet-100 backdrop-blur dark:bg-zinc-950/70 dark:ring-violet-900">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <Icon name={p.icon} size={24} />
                </span>
                <div>
                  <p className="text-lg font-semibold leading-7">{p.pain}</p>
                  <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">{p.fix}</p>
                  <Link href={p.href} className="mt-3 inline-block font-medium text-emerald-800 hover:underline dark:text-emerald-400">
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

      {/* Numbers */}
      <section aria-label="Xplaind in numbers" className="py-6">
        <dl data-rise-group className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 md:grid-cols-4 md:px-6">
          {stats.map((s) => (
            <div key={s.label} data-rise className="rounded-3xl bg-white/85 p-6 shadow-sm ring-1 ring-violet-100 backdrop-blur dark:bg-zinc-950/70 dark:ring-violet-900">
              <dd data-count className="text-4xl font-semibold tracking-tight md:text-5xl">{s.value}</dd>
              <dt className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{s.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* Milestone 2: learn. */}
      <section aria-labelledby="do-heading" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Gate n={2} label="Learn" />
          <h2 id="do-heading" data-words className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
            <Words text="Everything you need to get from zero to hired" />
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2" data-rise-group>
            <Feature
              title="Follow an interactive roadmap"
              text="See the whole journey on one map. Tap any topic to read what it is, open the best course and mark it done."
              href="/roadmap/genai-engineer"
              cta="Open a roadmap"
              tone="from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950"
            >
              <div className="mx-auto max-w-[280px] text-zinc-500">
                <MiniRoadmap />
              </div>
            </Feature>
            <Feature
              title="Learn each topic in 20 minutes"
              text="Our own explainer in plain English, with a worked example from Indian work life, the common mistakes and a quick check that earns XP."
              href="/topics"
              cta="Browse lessons"
              tone="from-violet-50 to-fuchsia-50 dark:from-violet-950 dark:to-fuchsia-950"
            >
              <div className="mx-auto max-w-[300px]">
                <MiniLesson />
              </div>
            </Feature>
            <Feature
              title="Find the best courses and certificates"
              text="Courses from Google, Microsoft, AWS, NVIDIA, OpenAI, Anthropic, Hugging Face and more, each chosen for a lesson, plus the certifications worth sitting."
              href="/resources"
              cta="Browse courses"
              tone="from-sky-50 to-indigo-50 dark:from-sky-950 dark:to-indigo-950"
            >
              <div className="mx-auto max-w-[320px]">
                <MiniCourses />
              </div>
            </Feature>
            <Feature
              title="Read the papers that built AI"
              text="From Attention Is All You Need to today's reasoning models, with one plain line on why each matters, plus free books by their authors."
              href="/papers"
              cta="Open the library"
              tone="from-amber-50 to-rose-50 dark:from-amber-950 dark:to-rose-950"
            >
              <div className="mx-auto max-w-[300px]">
                <MiniLesson />
              </div>
            </Feature>
          </div>
        </div>
      </section>

      {/* Milestone 3: practise and prove it. */}
      <section aria-labelledby="how-heading" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Gate n={3} label="Practise and prove it" />
          <h2 id="how-heading" data-words className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
            <Words text="Build it, then say it out loud" />
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3" data-rise-group>
            {[
              { icon: "compass" as const, title: "Choose your role", text: "A roadmap for each AI role, from AI Engineer to MLOps Engineer. Not sure? Take the 10-minute level test." },
              { icon: "book" as const, title: "Learn, check, earn XP", text: "Read the lesson, take the best course, pass the quick check. Your XP and streak grow as you go." },
              { icon: "trophy" as const, title: "Prove it", text: "Build the project at the end of each stage, then practise the interview until you are ready." },
            ].map((s, i) => (
              <li key={s.title} data-rise className="rounded-3xl bg-white/85 p-6 shadow-sm ring-1 ring-violet-100 backdrop-blur dark:bg-zinc-950/70 dark:ring-violet-900">
                <span className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-violet-700 font-semibold text-white">{i + 1}</span>
                  <Icon name={s.icon} size={24} className="text-emerald-700 dark:text-emerald-400" />
                </span>
                <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-6 grid gap-6 md:grid-cols-2" data-rise-group>
            <Feature
              title="Practise interviews out loud"
              text={`${interview.length} real questions across every role. Answer against the clock with your voice, then see which key points you covered.`}
              href="/interview/simulator"
              cta="Start a mock interview"
              tone="from-rose-50 to-orange-50 dark:from-rose-950 dark:to-orange-950"
            >
              <div className="mx-auto max-w-[300px]">
                <MiniInterview />
              </div>
            </Feature>
            <div data-rise className="flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-br from-amber-50 to-emerald-50 p-6 ring-1 ring-amber-100 md:p-8 dark:from-amber-950 dark:to-emerald-950 dark:ring-amber-900">
              <div>
                <h3 className="text-xl font-semibold">Keep going with XP, streaks and badges</h3>
                <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">
                  Every lesson, check and mock interview counts. A free account keeps your progress on every device.
                </p>
              </div>
              <MiniProgress />
            </div>
          </div>
        </div>
      </section>

      {/* Milestone 4: the finish line. */}
      <section aria-labelledby="final-heading" className="py-24 text-center md:py-36">
        <div className="mx-auto max-w-3xl px-4">
          <div className="flex justify-center">
            <Gate n={4} label="Your AI career" />
          </div>
          <h2 id="final-heading" data-words className="mt-5 text-4xl font-semibold tracking-tight text-balance md:text-6xl">
            <Words text="Your AI career starts with one lesson." />
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-800 dark:text-zinc-200">Pick a role and do the first topic today. It takes about 20 minutes.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link data-magnetic href="/paths" className="inline-flex min-h-12 items-center justify-center rounded-full bg-violet-700 px-6 font-medium text-white shadow-lg shadow-violet-700/30 hover:bg-violet-800">
              Choose a roadmap
            </Link>
            <Link href="/start" className="inline-flex min-h-12 items-center justify-center rounded-full bg-white/85 px-6 font-medium text-violet-950 ring-1 ring-violet-300 backdrop-blur hover:bg-white dark:bg-white/10 dark:text-violet-100">
              Find my level
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
              <Link href="/blog" className="font-medium text-emerald-800 hover:underline dark:text-emerald-400">
                All guides →
              </Link>
            </div>
            <ul className="mt-8 grid gap-6 md:grid-cols-3" data-rise-group>
              {posts.map((p, i) => (
                <li key={p.id} data-rise>
                  <Link href={`/blog/${p.id}`} className="group block overflow-hidden rounded-3xl bg-white/90 ring-1 ring-violet-100 backdrop-blur hover:ring-violet-300 dark:bg-zinc-950/80 dark:ring-violet-900">
                    <Cover theme={(["career", "ai-basics", "using-ai"] as const)[i % 3]} seed={p.id} icon="book" className="h-36" iconSize={40} />
                    <span className="block p-5">
                      <span className="block text-lg font-semibold leading-7 group-hover:underline">{p.title}</span>
                      <span className="mt-2 block text-sm leading-6 text-zinc-700 dark:text-zinc-300">{p.description}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section aria-labelledby="faq-heading" className="pt-8 pb-24 md:pb-32">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <h2 id="faq-heading" data-words className="text-3xl font-semibold tracking-tight md:text-4xl">
            <Words text="Questions" />
          </h2>
          <div className="mt-8 divide-y divide-zinc-200 rounded-3xl bg-white/90 ring-1 ring-violet-100 backdrop-blur dark:divide-zinc-800 dark:bg-zinc-950/80 dark:ring-violet-900">
            {FAQ.map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
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
    </main>
  );
}

/** A milestone marker: the gate the reader has just reached on the road. */
function Gate({ n, label }: { n: number; label: string }) {
  return (
    <p data-gate className="inline-flex items-center gap-2 rounded-full bg-white/85 py-1 pr-3 pl-1 text-sm font-medium text-violet-900 shadow-sm ring-1 ring-violet-200 backdrop-blur dark:bg-zinc-950/70 dark:text-violet-100 dark:ring-violet-800">
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
    <div data-rise className="flex flex-col overflow-hidden rounded-3xl bg-white/90 ring-1 ring-violet-100 backdrop-blur dark:bg-zinc-950/80 dark:ring-violet-900">
      <div className={`bg-gradient-to-br ${tone} p-6 md:p-8`}>{children}</div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="mt-2 flex-1 leading-7 text-zinc-700 dark:text-zinc-300">{text}</p>
        <Link href={href} className="mt-4 font-medium text-emerald-800 hover:underline dark:text-emerald-400">
          {cta} →
        </Link>
      </div>
    </div>
  );
}
