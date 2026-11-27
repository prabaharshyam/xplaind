import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/art/icons";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/page-hero";
import { primaryButton, secondaryButton, secondaryButtonSm } from "@/components/ui";
import { getContent, getPaths, getStops } from "@/lib/content";
import { proOpen } from "@/lib/billing/config";
import { pageMeta } from "@/lib/seo";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: ["About Xplaind: an AI Learning Platform Built in India", "About Xplaind"],
  description: "Xplaind (xplaind.in) is an AI learning platform built in India for learners everywhere, founded by Shyam Prabahar: why it exists, what it believes and how its roadmaps and lessons are made.",
  path: "/about",
});

const BELIEFS = [
  { icon: "map" as const, title: "Order beats volume", text: "Every roadmap puts topics in the order you need them, so you always know what to learn next." },
  { icon: "chat" as const, title: "Plain English first", text: "Each lesson opens with a one-line answer, then builds the idea step by step." },
  { icon: "scale" as const, title: "Picks are earned", text: "No one can pay to be listed or ranked. The code that orders courses never reads commissions." },
  { icon: "shield" as const, title: "Open and private", text: "Every lesson is open to everyone. No ads, no tracking cookies, and you can delete your account anytime." },
] as const;

/** UX-22 (2026-11-27, owner: "don't have sections with so much text"): the founder's story at a glance. The full
    story, in his words, opens below it. */
const MILESTONES = [
  { place: "Sivakasi", text: "Studied in Tamil medium, topped his class, dreamt of studying in English" },
  { place: "Karunya University", text: "Could not say a sentence out loud in class, and nearly quit" },
  { place: "Every day", text: "No coach, no course: a few books and daily practice" },
  { place: "Freelancing", text: "Hundreds of logos and websites for clients abroad, on a government laptop" },
  { place: "Career", text: "Cognizant, his own startup, then a team of 20+ at Amazon" },
  { place: "2023", text: "All in on AI, self-taught from online courses" },
  { place: "Today", text: "Leads enterprise AI adoption, and builds Xplaind for everyone" },
];

const MADE = [
  { icon: "map" as const, title: "Roadmaps", text: "Built from the skills job posts ask for" },
  { icon: "scale" as const, title: "Course picks", text: "Ranked by published rules, never by commission", href: "/how-we-rank" },
  { icon: "star" as const, title: "Salaries and prices", text: "Every number names its source and check date" },
  { icon: "robot" as const, title: "AI helpers", text: "Labelled as AI, because AI can be wrong" },
];

/** The founder's story up to AI (TR-2). The ending, with its emphasis, is written out in the page. */
const STORY = [
  "Hi, I’m Shyam Prabahar.",
  "I grew up in Sivakasi, a small town in south Tamil Nadu. I studied in Tamil medium and was always among the toppers in my class. I had one dream: to study in English one day.",
  "That dream came true when I joined Karunya University for engineering. On my first days I sat among students from CBSE and ICSE schools, all speaking English as if it were nothing. I understood the lessons, but I couldn’t say a single sentence out loud. When a professor called my name, my heart raced, and more than once I walked out of the class rather than answer.",
  "The topper from Sivakasi suddenly felt like the slowest person in the room. Within a few months I had decided to quit, go home and join a local arts and science college, where nobody would ask me to speak English.",
  "But I couldn’t let go of that dream. I gathered whatever courage I had left and went back.",
  "There was no coach and no course, and nobody to show me the way. Just me, a few books, and practice every single day. Slowly, by God’s grace, the words started coming.",
  "In my third year I started freelancing, using a laptop the government gave me in 12th grade and an internet dongle a friend got me: ₹3,000 for 10 GB a month. I designed hundreds of logos and websites, mostly for clients abroad. Every call with them was an English class I was getting paid for. By my final year, I was paying part of my own college fees.",
  "That boy who walked out of class went on to manage marketing budgets worth millions, work at Cognizant, build his own startup, lead a team of 20+ at Amazon, and today drive enterprise AI adoption at one of the world’s top automotive companies.",
  "When ChatGPT arrived in early 2023, I knew AI would change every job, so I went all in. I learnt it the way I had learnt everything else: on my own, from online courses and daily practice, never spending lakhs on a course. I’ve been championing AI ever since, with my teams, my friends and on social media.",
];

/** TR-1: who we are and how the site is made, so a visitor can decide whether to trust it with their time. */
export default function AboutPage() {
  const roles = getPaths().length;
  const lessons = getStops().length;
  const picks = getContent().resources.length;
  const pro = proOpen();
  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          url: `${siteUrl()}/about`,
          mainEntity: {
            "@type": "Organization",
            name: "Xplaind",
            url: siteUrl(),
            founder: {
              "@type": "Person",
              name: "Shyam Prabahar",
              image: `${siteUrl()}/founder/shyam-prabahar.webp`,
              sameAs: ["https://www.linkedin.com/in/shyam-prabahar/"],
            },
          },
        }}
      />
      <PageHero
        theme="ai-basics"
        shape="compass"
        icon="compass"
        eyebrow="About Xplaind"
        title="Help anyone learn AI faster, in the right order"
        lead={`All ${roles} roadmaps, ${lessons} written lessons and ${picks} course picks, in order: a step-by-step place to learn AI for a career, with projects and interview practice.`}
      />

      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
        <section aria-labelledby="why-h">
          <h2 id="why-h" className="text-2xl font-semibold tracking-tight md:text-3xl">
            Why we built it
          </h2>
          {/* UX-22: the problem and the fix side by side, instead of three paragraphs. */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-rose-50 p-5 dark:bg-rose-950/40">
              <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">The problem</p>
              <p className="mt-2 text-lg leading-7 font-medium">Lost in a hundred tutorials, with no order and no way to know you are job-ready</p>
            </div>
            <div className="rounded-3xl bg-emerald-50 p-5 dark:bg-emerald-950/40">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">The fix</p>
              <p className="mt-2 text-lg leading-7 font-medium">One roadmap for your role, in order, from first lesson to interview day</p>
            </div>
          </div>
          <ul className="mt-4 flex flex-wrap gap-2 text-sm">
            {[`${roles} AI roles`, `${lessons} lessons, one sitting each`, "The best course for each topic", "What to build", "How to explain it in an interview"].map((t) => (
              <li key={t} className="rounded-full bg-zinc-100 px-3 py-1.5 font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Nothing is locked. AI tools have a daily allowance;{" "}
            {pro ? (
              <Link href="/pricing" className="font-medium text-brand-800 underline underline-offset-2 dark:text-brand-300">
                a Pro pass
              </Link>
            ) : (
              "a Pro pass, coming soon,"
            )}{" "}
            gives more AI help each day.
          </p>
        </section>

        {/* TR-2: the founder's story, in his own words, so visitors know who is behind the site. */}
        <section id="founder" aria-labelledby="founder-h" className="mt-14 scroll-mt-24">
          <h2 id="founder-h" className="text-2xl font-semibold tracking-tight md:text-3xl">
            Meet the founder
          </h2>
          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end">
            <Image
              src="/founder/shyam-prabahar.webp"
              alt="Shyam Prabahar, smiling, at a talk"
              width={640}
              height={800}
              sizes="(min-width: 640px) 13rem, 11rem"
              className="w-44 rounded-2xl object-cover ring-1 ring-zinc-200 sm:w-52 dark:ring-zinc-800"
            />
            <div>
              <p className="text-xl font-semibold">Shyam Prabahar</p>
              <p className="mt-1 leading-7 text-zinc-700 dark:text-zinc-300">Founder of Xplaind. Leads enterprise AI adoption at one of the world&apos;s top automotive companies.</p>
              <a href="https://www.linkedin.com/in/shyam-prabahar/" target="_blank" rel="noopener noreferrer" className={`${secondaryButtonSm} mt-3`}>
                Connect on LinkedIn <span aria-hidden="true">↗</span>
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </div>
          </div>
          {/* UX-22: the story as a timeline first; the whole story, in his words, opens below. */}
          <ol className="relative mt-8 space-y-5 border-l-2 border-brand-200 pl-6 dark:border-brand-800">
            {MILESTONES.map((m) => (
              <li key={m.place} className="relative">
                <span aria-hidden="true" className="absolute top-1.5 -left-[1.95rem] size-3 rounded-full bg-brand-700 ring-4 ring-[var(--background)] dark:bg-brand-300" />
                <p className="text-sm font-semibold text-brand-800 dark:text-brand-300">{m.place}</p>
                <p className="mt-0.5 text-lg leading-7">{m.text}</p>
              </li>
            ))}
          </ol>
          <blockquote className="mt-8 rounded-3xl bg-brand-50 p-6 dark:bg-brand-950/40">
            <p className="text-xl leading-8 font-semibold text-brand-900 dark:text-brand-100">
              &ldquo;You don&apos;t need an expensive school, perfect English or lakhs of rupees. I didn&apos;t.&rdquo;
            </p>
            <p className="mt-2 text-sm text-brand-800 dark:text-brand-300">Shyam Prabahar, founder</p>
          </blockquote>
          <details className="group mt-6">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 font-medium text-brand-800 underline-offset-4 hover:underline dark:text-brand-300 [&::-webkit-details-marker]:hidden">
              Read Shyam&apos;s full story
              <span aria-hidden="true" className="transition-transform group-open:rotate-90">→</span>
            </summary>
            <div className="mt-4 space-y-5 text-lg leading-8 text-zinc-800 dark:text-zinc-200">
                {STORY.map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
                <p>
                  Soon friends started asking me: <em>Where do I start? What should I learn? Which course is worth it?</em> I knew that feeling of
                  being lost with no one to show you the way. So I guided each of them, one by one.
                </p>
                <p>Then I thought: why not build one place that does this for everyone?</p>
                <p>
                  That&apos;s Xplaind: a clear path, in the right order, in plain English. Most courses and videos on it cost nothing to learn, and only a
                  handful charge if you want the certificate.
                </p>
                <p>You don&apos;t need an expensive school, perfect English or lakhs of rupees. I didn&apos;t.</p>
                <p className="text-xl font-semibold text-brand-800 dark:text-brand-300">Let&apos;s learn AI together.</p>
                <p className="text-base text-zinc-600 italic dark:text-zinc-400">— Shyam Prabahar, founder</p>
            </div>
          </details>
        </section>

        <section aria-labelledby="believe-h" className="mt-12">
          <h2 id="believe-h" className="text-2xl font-semibold tracking-tight md:text-3xl">
            What we believe
          </h2>
          <ul className="mt-6 grid gap-px overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-200 sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-800">
            {BELIEFS.map((b, i) => (
              <li key={b.title} className="flex gap-4 bg-white p-5 md:p-6 dark:bg-zinc-900">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" aria-hidden="true">
                  <Icon name={b.icon} size={20} />
                </span>
                <div>
                  <h3 className="text-base font-semibold">
                    <span className="mr-2 text-sm font-medium text-zinc-500 tabular-nums dark:text-zinc-400" aria-hidden="true">
                      0{i + 1}
                    </span>
                    {b.title}
                  </h3>
                  <p className="mt-1 leading-7 text-zinc-700 dark:text-zinc-300">{b.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="how-h" className="mt-12">
          <h2 id="how-h" className="text-2xl font-semibold tracking-tight md:text-3xl">
            How the content is made
          </h2>
          {/* UX-22: one line each, as cards. */}
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {MADE.map((m) => (
              <li key={m.title} className="flex items-start gap-3 rounded-3xl bg-white p-4 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
                <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                  <Icon name={m.icon} size={20} />
                </span>
                <span>
                  <span className="block font-semibold">
                    {m.href ? (
                      <Link href={m.href} className="underline-offset-4 hover:underline">
                        {m.title}
                      </Link>
                    ) : (
                      m.title
                    )}
                  </span>
                  <span className="mt-0.5 block leading-6 text-zinc-700 dark:text-zinc-300">{m.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="next-h" className="mt-14 rounded-2xl bg-brand-50 p-6 md:p-8 dark:bg-brand-950/40">
          <h2 id="next-h" className="text-2xl font-semibold tracking-tight">
            Start with one lesson
          </h2>
          <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">Free to learn. Pick a role and the first lesson takes about 20 minutes.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/paths" className={primaryButton}>
              Choose your AI role
            </Link>
            <Link href="/privacy" className={secondaryButton}>
              Read our privacy promise
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
