import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { ScrollScene } from "@/components/motion/scroll-scene";
import type { LevelId } from "@/lib/levels";
import { stageOf } from "@/lib/roadmap/map";

const TONE = { beginner: "bg-emerald-500", intermediate: "bg-sky-500", pro: "bg-violet-500" } as const;
const STAGE = { beginner: "Beginner", intermediate: "Intermediate", pro: "Pro" } as const;

export function Numbers({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <section className="lx-paper px-5 py-24 md:px-6 md:py-36" aria-labelledby="numbers-heading">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 id="numbers-heading" className="lx-title max-w-3xl text-balance">
            One path. Every step chosen by hand.
          </h2>
        </Reveal>
        <dl className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 md:mt-20 md:grid-cols-5">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 80}>
              <dt className="lx-muted text-sm">{s.label}</dt>
              <dd className="mt-1 text-5xl font-semibold tracking-tight md:text-6xl">{s.value}</dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** The nine levels slide past sideways as you scroll down. */
export function Ladder({ levels }: { levels: { id: LevelId; name: string; can_do: string; draft_hours: number }[] }) {
  return (
    <ScrollScene length={3} className="lx-paper" stageClassName="flex flex-col justify-center gap-10 md:gap-14">
      <div className="mx-auto w-full max-w-6xl px-5 md:px-6">
        <p className="lx-eyebrow text-emerald-700 dark:text-emerald-400">The ladder</p>
        <h2 className="lx-title mt-4 max-w-3xl text-balance">From your first prompt to system design.</h2>
      </div>
      <ol className="lx-track flex w-max gap-4 pl-5 md:gap-6 md:pl-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]">
        {levels.map((l) => {
          const stage = stageOf(l.id);
          return (
            <li
              key={l.id}
              className="flex min-h-[340px] w-[260px] shrink-0 flex-col rounded-[28px] border border-[var(--lx-line)] bg-white p-6 shadow-[0_30px_60px_-40px_rgba(0,0,0,0.35)] md:h-[360px] md:w-[320px] dark:bg-[#18181b]"
            >
              <span className={`h-1.5 w-10 rounded-full ${TONE[stage]}`} />
              <p className="lx-muted mt-5 text-xs font-medium">{STAGE[stage]}</p>
              <p className="mt-1 text-4xl font-semibold tracking-tight">{l.id}</p>
              <p className="mt-1 text-lg font-medium">{l.name}</p>
              <p className="lx-muted mt-4 text-[15px] leading-6">{l.can_do}.</p>
              <p className="lx-muted mt-auto text-sm">About {l.draft_hours} hours</p>
            </li>
          );
        })}
        <li className="flex w-[260px] shrink-0 items-center md:w-[320px]">
          <Link href="/roadmap/genai-engineer" className="text-lg font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400">
            See every step on the roadmap
          </Link>
        </li>
      </ol>
    </ScrollScene>
  );
}

const PRINCIPLES = [
  { title: "Placed by a test, not a label.", body: "We never ask if you are in IT, sales or marketing. Twelve questions decide where you start." },
  { title: "Free first.", body: "Every step starts with a free course. A paid one has to earn its place, at about the price of a movie ticket." },
  { title: "Prices in rupees, with a date.", body: "When a course costs money, you see the price and the day we last checked it." },
  { title: "No ads. No paid placement.", body: "No one can pay to be listed or moved up. Where a link earns us a commission, it says so." },
  { title: "Every step proves itself.", body: "A quick check or a small project ends each step, so you know you learned it, not just watched it." },
  { title: "Built for India.", body: "Weeks run on India time. Lessons fit three to eight hours a week, alongside a job or college." },
];

export function Principles() {
  return (
    <section className="lx-paper px-5 py-24 md:px-6 md:py-36" aria-labelledby="principles-heading">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 id="principles-heading" className="lx-title max-w-3xl text-balance">
            Honest by design.
          </h2>
          <p className="lx-muted mt-5 max-w-2xl text-lg leading-8">
            A learning path is only as good as the trust behind it. These are the rules we build by.
          </p>
        </Reveal>
        <ul className="mt-14 grid gap-4 md:mt-20 md:grid-cols-3 md:gap-5">
          {PRINCIPLES.map((p, i) => (
            <Reveal as="li" key={p.title} delay={(i % 3) * 90} className="rounded-[28px] bg-white p-7 dark:bg-[#18181b]">
              <h3 className="text-xl font-semibold tracking-tight">{p.title}</h3>
              <p className="lx-muted mt-3 leading-7">{p.body}</p>
            </Reveal>
          ))}
        </ul>
        <Reveal className="mt-10">
          <Link href="/how-we-rank" className="text-lg font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400">
            How we rank courses
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

export function InterviewPreview({ count, questions }: { count: number; questions: { id: string; question: string; topic: string }[] }) {
  return (
    <section className="lx-ink overflow-hidden px-5 py-24 md:px-6 md:py-36" aria-labelledby="interview-heading">
      <div className="mx-auto grid max-w-6xl items-center gap-14 md:grid-cols-2">
        <Reveal>
          <p className="lx-eyebrow text-emerald-400">Interview prep</p>
          <h2 id="interview-heading" className="lx-title mt-4 text-balance">
            Walk in ready.
          </h2>
          <p className="lx-muted mt-6 max-w-md text-lg leading-8">
            {count} questions GenAI interviews ask, each with a short answer to say out loud, a deeper one, the follow-ups to
            expect and the mistakes to avoid. Rate yourself, and the ones you miss come back first.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/practice" className="inline-flex h-12 items-center rounded-full bg-white px-6 text-[15px] font-medium text-black hover:bg-zinc-200">
              Start practising
            </Link>
            <Link href="/interview" className="inline-flex h-12 items-center rounded-full px-5 text-[15px] font-medium text-white ring-1 ring-white/25 hover:bg-white/10">
              Browse questions
            </Link>
          </div>
        </Reveal>
        <div className="relative h-[340px] [perspective:1200px]" aria-hidden="true">
          {questions.slice(0, 3).map((q, i) => (
            <div
              key={q.id}
              className="absolute inset-x-0 mx-auto w-[88%] max-w-[420px] rounded-[26px] border border-white/10 bg-[#141416] p-6 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]"
              style={{
                top: `${i * 64}px`,
                transform: `rotateX(14deg) rotateZ(${(i - 1) * -3}deg) translateZ(${-i * 40}px)`,
                opacity: 1 - i * 0.22,
                zIndex: 3 - i,
              }}
            >
              <p className="text-xs text-zinc-400">{q.topic}</p>
              <p className="mt-2 text-lg leading-7 font-semibold text-white">{q.question}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const PLAN = [
  { when: "Live now", items: ["The placement test", "The nine-level roadmap with a lesson for every core topic", "Interview questions, practice and quick quizzes"] },
  { when: "Next", items: ["Accounts that keep your progress across devices", "Weekly streaks, level badges and a card to share", "A weekly email with your next step", "Books with honest links, and weekly checks on every course link"] },
  { when: "Later", items: ["Feedback on answers you type", "A second path, AI at work, for people who will use AI rather than build it", "Questions you missed, brought back at the right time", "A re-test after 30 days, so you can see how far you have come"] },
  { when: "After that", items: ["Spoken mock interviews with a written report", "Hindi and Tamil"] },
];

export function WhatsNext() {
  return (
    <section className="lx-paper px-5 py-24 md:px-6 md:py-36" aria-labelledby="next-heading">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 id="next-heading" className="lx-title max-w-3xl text-balance">
            Where this is going.
          </h2>
          <p className="lx-muted mt-5 max-w-2xl text-lg leading-8">Plans, not promises. What we build next depends on what learners tell us.</p>
        </Reveal>
        <ol className="mt-14 grid gap-10 md:mt-20 md:grid-cols-4 md:gap-6">
          {PLAN.map((col, i) => (
            <Reveal as="li" key={col.when} delay={i * 90} className="border-t border-[var(--lx-line)] pt-6">
              <h3 className={`text-sm font-semibold ${i === 0 ? "text-emerald-700 dark:text-emerald-400" : ""}`}>{col.when}</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {col.items.map((item) => (
                  <li key={item} className="leading-6">
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function FinalCall() {
  return (
    <section className="lx-ink px-5 py-28 text-center md:px-6 md:py-44" aria-labelledby="final-heading">
      <Reveal className="mx-auto max-w-4xl">
        <h2 id="final-heading" className="lx-display text-balance">
          Ten minutes from now, you will know your next step.
        </h2>
        <Link
          href="/start"
          className="mt-12 inline-flex h-14 items-center rounded-full bg-white px-8 text-[17px] font-medium text-black hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
        >
          Find my level
        </Link>
        <p className="lx-muted mt-5 text-sm">Free. No sign-up. Your answers stay on your device.</p>
      </Reveal>
    </section>
  );
}
