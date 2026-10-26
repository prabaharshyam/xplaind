import type { Metadata } from "next";
import Link from "next/link";
import { Cover } from "@/components/art/cover";
import { Icon } from "@/components/art/icons";
import { RoleGrid, TopicChips } from "@/components/home/role-grid";
import { MiniCourses, MiniInterview, MiniLesson, MiniProgress, MiniRoadmap } from "@/components/home/showcase";
import { JsonLd } from "@/components/json-ld";
import { Reveal } from "@/components/motion/reveal";
import { SearchBox } from "@/components/search-box";
import { getBlogPosts, getContent, getPaths, getStops } from "@/lib/content";
import { getInterviewViews } from "@/lib/content/interview";
import { pathView } from "@/lib/content/paths";
import { CODING_LABEL } from "@/lib/paths";
import type { IconName } from "@/lib/themes";

export const metadata: Metadata = {
  title: { absolute: "Xplaind: free AI roadmaps, lessons and interview practice" },
  description:
    "Learn AI for the job you want, free. Step-by-step roadmaps for nine AI roles, a plain-English lesson for every topic, the best free course for each, and mock interviews you answer out loud.",
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
    fix: "For every topic we pick the one free course that teaches it best, and tell you why. No paid placements, ever.",
    href: "/resources",
    cta: "Browse free courses",
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
    q: "Is Xplaind really free?",
    a: "Yes. Every roadmap, lesson, interview question and the mock interview are free, with no sign-up needed. We link to free courses first; when a course costs money we show the price and the date we checked it. We never take money to rank a course.",
  },
  {
    q: "I have never coded. Can I still learn AI here?",
    a: "Yes. The AI for Beginners, AI Product Manager and AI Automation Specialist roadmaps need no programming. If you later want to build AI applications, the GenAI Engineer roadmap starts from Python basics.",
  },
  {
    q: "How long does it take?",
    a: "Each roadmap shows an estimate, from about two months for AI for Beginners to six months for Forward Deployed Engineer at 10 to 20 hours a week. The level test skips topics you already know, so many learners finish faster.",
  },
  {
    q: "Do I need an account?",
    a: "No. Your progress, XP and streak are saved in your browser. You can sign in later to keep them across devices.",
  },
];

export default function Home() {
  const paths = getPaths().map(pathView);
  const stops = getStops();
  const interview = getInterviewViews();
  const posts = getBlogPosts().slice(0, 3);
  const themeCounts: Record<string, number> = {};
  for (const s of stops) themeCounts[s.theme] = (themeCounts[s.theme] ?? 0) + 1;
  const stats = [
    { value: String(paths.length), label: "role roadmaps" },
    { value: String(stops.length), label: "lessons" },
    { value: String(interview.length), label: "interview questions" },
    { value: String(getContent().resources.length), label: "free courses picked" },
    { value: "₹0", label: "to use all of it" },
  ];

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />

      {/* Hero: what this is, and the first thing to do, above the fold. */}
      <section className="home-hero relative overflow-hidden bg-[#070a12] text-white" aria-labelledby="hero-heading">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(600px 300px at 15% 10%, rgba(16,185,129,.25), transparent 70%), radial-gradient(700px 350px at 90% 0%, rgba(124,58,237,.28), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-12 md:px-6 md:pt-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-400" /> 100% free · made for learners in India · no sign-up
          </p>
          <h1 id="hero-heading" className="mt-5 max-w-4xl text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
            Learn AI for the job you want.{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-violet-300 bg-clip-text text-transparent">
              Step by step, for free.
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
            Pick a role. Follow its roadmap, read a plain-English lesson for every topic, take the one free course worth
            your time, then practise the interview out loud.
          </p>
          <div className="mt-8 max-w-2xl">
            <SearchBox size="lg" />
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/roadmap/ai-for-beginners" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 font-medium text-black hover:bg-zinc-200">
              <Icon name="sparkles" size={18} /> I’m new to AI
            </Link>
            <Link href="/roadmap/genai-engineer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-5 font-medium hover:bg-white/10">
              <Icon name="code" size={18} /> I can code
            </Link>
            <Link href="/interview/simulator" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-5 font-medium hover:bg-white/10">
              <Icon name="mic" size={18} /> I have an interview soon
            </Link>
          </div>

          <div className="mt-14 flex items-end justify-between gap-4">
            <h2 className="text-xl font-semibold">Role roadmaps</h2>
            <Link href="/paths" className="text-sm text-emerald-300 hover:underline">
              Compare all {paths.length} →
            </Link>
          </div>
          <div className="mt-4">
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

          <div className="mt-12 flex items-end justify-between gap-4">
            <h2 className="text-xl font-semibold">Topic roadmaps</h2>
            <Link href="/topics" className="text-sm text-emerald-300 hover:underline">
              All topics →
            </Link>
          </div>
          <p className="mt-1 text-sm text-zinc-400">Want one skill, not a whole role? Every lesson, grouped by subject.</p>
          <div className="mt-4">
            <TopicChips counts={themeCounts} />
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section aria-label="Xplaind in numbers" className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-3 md:grid-cols-5 md:px-6">
          {stats.map((s) => (
            <div key={s.label}>
              <dd className="text-3xl font-semibold tracking-tight">{s.value}</dd>
              <dt className="text-sm text-zinc-600 dark:text-zinc-400">{s.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* Pain points */}
      <section aria-labelledby="pain-heading" className="bg-zinc-50 py-16 dark:bg-zinc-950 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 id="pain-heading" className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            Sound familiar?
          </h2>
          <p className="mt-3 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Learning AI on your own is confusing. Here is what we fixed.
          </p>
          <ul className="mt-10 grid gap-5 md:grid-cols-2">
            {PAINS.map((p, i) => (
              <Reveal as="li" key={p.pain} delay={i * 60} className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
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
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* What you can do here */}
      <section aria-labelledby="do-heading" className="bg-white py-16 dark:bg-zinc-900 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 id="do-heading" className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            Everything you need to get from zero to hired
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <Feature
              title="Follow an interactive roadmap"
              text="See the whole journey on one map. Tap any topic to read what it is, open the best free course and mark it done."
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
              title="Practise interviews out loud"
              text={`${interview.length} real questions for nine roles. Answer against the clock with your voice, then see which key points you covered.`}
              href="/interview/simulator"
              cta="Start a mock interview"
              tone="from-rose-50 to-orange-50 dark:from-rose-950 dark:to-orange-950"
            >
              <div className="mx-auto max-w-[300px]">
                <MiniInterview />
              </div>
            </Feature>
            <Feature
              title="Find the best free courses and certificates"
              text="Courses from Google, Microsoft, AWS, NVIDIA, OpenAI, Anthropic, Hugging Face and more, each chosen for a lesson, plus the certifications worth sitting."
              href="/resources"
              cta="Browse courses"
              tone="from-sky-50 to-indigo-50 dark:from-sky-950 dark:to-indigo-950"
            >
              <div className="mx-auto max-w-[320px]">
                <MiniCourses />
              </div>
            </Feature>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="bg-zinc-50 py-16 dark:bg-zinc-950 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 id="how-heading" className="text-3xl font-semibold tracking-tight md:text-4xl">
            How it works
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { icon: "compass" as const, title: "Choose your role", text: "Nine roadmaps, from AI for Beginners to Forward Deployed Engineer. Not sure? Take the 10-minute level test." },
              { icon: "book" as const, title: "Learn, check, earn XP", text: "Read the lesson, take the best free course, pass the quick check. Your XP and streak grow as you go." },
              { icon: "trophy" as const, title: "Prove it", text: "Build the project at the end of each stage, then practise the interview until you are ready." },
            ].map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <span className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-zinc-900 font-semibold text-white dark:bg-white dark:text-black">{i + 1}</span>
                  <Icon name={s.icon} size={24} className="text-emerald-700 dark:text-emerald-400" />
                </span>
                <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-amber-50 to-emerald-50 p-6 md:flex-row md:items-center md:justify-between dark:from-amber-950 dark:to-emerald-950">
            <div>
              <h3 className="text-xl font-semibold">Keep going with XP, streaks and badges</h3>
              <p className="mt-1 text-zinc-700 dark:text-zinc-300">Every lesson, check and mock interview counts. Saved in your browser, no account needed.</p>
            </div>
            <MiniProgress />
          </div>
        </div>
      </section>

      {/* Guides */}
      {posts.length > 0 && (
        <section aria-labelledby="guides-heading" className="bg-white py-16 dark:bg-zinc-900 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="flex items-end justify-between gap-4">
              <h2 id="guides-heading" className="text-3xl font-semibold tracking-tight md:text-4xl">
                Guides
              </h2>
              <Link href="/blog" className="font-medium text-emerald-800 hover:underline dark:text-emerald-400">
                All guides →
              </Link>
            </div>
            <ul className="mt-8 grid gap-6 md:grid-cols-3">
              {posts.map((p, i) => (
                <li key={p.id}>
                  <Link href={`/blog/${p.id}`} className="group block overflow-hidden rounded-2xl border border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600">
                    <Cover theme={(["career", "ai-basics", "using-ai"] as const)[i % 3]} seed={p.id} icon="book" className="h-36" iconSize={40} />
                    <span className="block p-5">
                      <span className="block text-lg font-semibold leading-7 group-hover:underline">{p.title}</span>
                      <span className="mt-2 block text-sm leading-6 text-zinc-600 dark:text-zinc-400">{p.description}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* FAQ and final call */}
      <section aria-labelledby="faq-heading" className="bg-zinc-50 py-16 dark:bg-zinc-950 md:py-24">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <h2 id="faq-heading" className="text-3xl font-semibold tracking-tight md:text-4xl">
            Questions
          </h2>
          <div className="mt-8 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
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

      <section aria-labelledby="final-heading" className="bg-[#070a12] py-16 text-center text-white md:py-24">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="final-heading" className="text-3xl font-semibold tracking-tight text-balance md:text-5xl">
            Your AI career starts with one lesson.
          </h2>
          <p className="mt-4 text-lg text-zinc-300">Pick a role and do the first topic today. It takes about 20 minutes.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/paths" className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 font-medium text-black hover:bg-zinc-200">
              Choose a roadmap
            </Link>
            <Link href="/start" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 px-6 font-medium hover:bg-white/10">
              Find my level
            </Link>
          </div>
        </div>
      </section>
    </main>
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
    <Reveal className="flex flex-col overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800">
      <div className={`bg-gradient-to-br ${tone} p-6 md:p-8`}>{children}</div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="mt-2 flex-1 leading-7 text-zinc-700 dark:text-zinc-300">{text}</p>
        <Link href={href} className="mt-4 font-medium text-emerald-800 hover:underline dark:text-emerald-400">
          {cta} →
        </Link>
      </div>
    </Reveal>
  );
}
