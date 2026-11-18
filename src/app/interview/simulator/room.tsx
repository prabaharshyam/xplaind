"use client";
// VI-12 (2026-11-17, owner request: "this entire UI looks so boring", and the AI interviewer must be the
// thing people want to buy): the pieces of the mock interview page. The page is one dark teal room; the
// lit things in it are real fragments of the AI interviewer (a follow-up quoting the learner, the live
// caption, the report), built in HTML from the product's own words, never a screenshot or a fake chart.

import { useEffect, useRef, useState, type ReactNode } from "react";

/** The room's tokens: ground, ink, softer ink, panels, the one accent (the action) and brass (scores). */
export const room = {
  ground: "bg-brand-950 text-brand-50 [color-scheme:dark]",
  soft: "text-brand-200",
  panel: "bg-brand-900",
  panel2: "bg-brand-800",
  action:
    "inline-flex min-h-12 items-center justify-center rounded-full bg-brand-300 px-6 font-semibold text-brand-950 transition-[transform,background-color] duration-150 hover:bg-brand-200 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-200 disabled:opacity-60",
  quiet:
    "xp-glass-btn-dark inline-flex min-h-12 items-center justify-center rounded-full px-6 font-medium text-brand-50 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-200",
  link: "font-medium text-brand-50 underline decoration-brand-300 decoration-2 underline-offset-4 hover:decoration-brand-50",
  field:
    "min-h-12 w-full min-w-0 rounded-2xl border border-brand-600 bg-brand-900 px-4 py-2 text-brand-50 placeholder:text-brand-300/80 focus:border-brand-300 focus:outline-2 focus:outline-brand-300",
};

/**
 * Parts of a section rise into place once, as it enters the screen, staggered by their order. The
 * content is visible without script and with reduced motion (the CSS only hides it once JS has marked
 * the page, and the media query drops the travel).
 */
export function Reveal({ children, className = "", as: Tag = "div", delay = 0 }: { children: ReactNode; className?: string; as?: "div" | "section" | "li" | "p"; delay?: number }) {
  const ref = useRef<HTMLElement | null>(null);
  // "idle" until the page runs: visible, so nothing is hidden if the script never comes.
  const [state, setState] = useState<"idle" | "wait" | "in">("idle");
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    // Already on screen: leave it be. Below the fold: hide it, then let it rise in when reached.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    setState("wait");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState("in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref as never}
      data-reveal={state}
      style={{ transitionDelay: `${delay}ms` }}
      className={`xp-reveal ${className}`}
    >
      {children}
    </Tag>
  );
}

/** The interviewer's voice, as level bars; still when reduced motion is asked for. */
export function Bars({ live = true }: { live?: boolean }) {
  return (
    <span className="flex h-5 items-center gap-[3px]" aria-hidden="true">
      {[0.45, 0.8, 1, 0.7, 0.5, 0.85, 0.4].map((h, i) => (
        <span
          key={i}
          className={`w-[3px] origin-center rounded-full bg-brand-300 ${live ? "motion-safe:animate-[xp-voice_0.9s_ease-in-out_infinite]" : ""}`}
          style={{ height: `${Math.round(h * 20)}px`, animationDelay: `${i * 0.11}s` }}
        />
      ))}
    </span>
  );
}

const Z = ({ small = false }: { small?: boolean }) => (
  <span aria-hidden="true" className={`${small ? "size-8 text-sm" : "size-10"} grid shrink-0 place-items-center rounded-full bg-brand-300 font-semibold text-brand-950`}>
    Z
  </span>
);

/** The hero's lit exhibit: one real exchange, where the follow-up is built from the learner's own words. */
export function Exchange() {
  return (
    <figure data-ui className="w-full max-w-[34rem] rounded-[1.75rem] bg-brand-900 p-5 md:p-7">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-3">
          <Z />
          <span>
            <span className="block font-semibold">Zarina</span>
            <span className="block text-sm text-brand-200">GenAI Engineer · question 2 of 5</span>
          </span>
        </span>
        <span className="tabular-nums text-sm text-brand-200">06:42</span>
      </div>
      <ol className="mt-6 flex flex-col gap-4 text-[17px] leading-7">
        <li>
          <span className="block text-sm text-brand-200">Zarina asked</span>
          How would you split documents for a RAG system?
        </li>
        <li className="rounded-2xl bg-brand-800 p-4">
          <span className="block text-sm text-brand-200">You said</span>
          I&apos;d use chunks of about <mark className="rounded bg-brass-300 px-1 text-brand-950">300 tokens</mark> with a little overlap, so
          each one stays on one idea.
        </li>
        <li>
          <span className="flex items-center gap-2 text-sm text-brand-200">
            Zarina follows up <Bars />
          </span>
          <span className="text-xl leading-8 font-medium text-brand-50">
            You said 300 tokens. Why that size, and what breaks first if your chunks are too small?
          </span>
        </li>
      </ol>
      <figcaption className="sr-only">An example from the AI interviewer: the follow-up question quotes the candidate&apos;s own answer.</figcaption>
    </figure>
  );
}

// ---- how it works: four stages, one slider -----------------------------------

const STAGES = [
  { name: "She asks", clause: "Zarina asks the question aloud" },
  { name: "You answer", clause: "You answer, she waits for you" },
  { name: "She digs in", clause: "She follows up on your words" },
  { name: "Your report", clause: "You get the panel's verdict" },
] as const;

function AskFragment() {
  return (
    <div data-ui className="flex w-full max-w-[28rem] flex-col gap-5 rounded-[1.75rem] bg-brand-900 p-6">
      <span className="flex items-center gap-3 text-sm text-brand-200">
        <Z small /> Speaking <Bars />
      </span>
      <p className="text-2xl leading-9 font-medium">
        Okay, next question. When would you fine-tune a model instead of improving the prompt?
      </p>
      <p className="text-sm text-brand-200">In a natural Indian English voice. Questions 1 of 5 · 3 to 5 years</p>
    </div>
  );
}

function AnswerFragment() {
  return (
    <div data-ui className="flex w-full max-w-[28rem] flex-col gap-5 rounded-[1.75rem] bg-brand-900 p-6">
      <span className="flex items-center gap-2 text-sm text-brand-200">
        <span className="size-2.5 rounded-full bg-brand-300 motion-safe:animate-[xp-think_1.2s_ease-in-out_infinite]" aria-hidden="true" /> Listening
      </span>
      <p className="text-xl leading-8">
        If the task needs a fixed output style across thousands of calls, and prompting has plateaued, then fine-tuning, but first I&apos;d check the
        evals…
      </p>
      <p className="rounded-2xl bg-brand-800 px-4 py-3 text-sm">Pausing to think is fine. She waits 5 seconds, longer after an &ldquo;and&rdquo;.</p>
    </div>
  );
}

function FollowFragment() {
  return (
    <div data-ui className="flex w-full max-w-[28rem] flex-col gap-4 rounded-[1.75rem] bg-brand-900 p-6">
      <p className="text-sm text-brand-200">You said &ldquo;first I&apos;d check the evals&rdquo;</p>
      <p className="text-2xl leading-9 font-medium">Which evals exactly? Name two numbers you would look at before deciding.</p>
      <p className="text-sm text-brand-200">Follow-up 1 of up to 2 · never a hint, never &ldquo;good answer&rdquo;</p>
    </div>
  );
}

/** A sample of the report, at true size: the verdict, skills with the candidate's words, one gap, a week of the plan. */
export function ReportFragment() {
  const skills = [
    { name: "Retrieval and chunking", score: 4, quote: "so each one stays on one idea" },
    { name: "Evaluating LLM output", score: 2, quote: "first I'd check the evals" },
    { name: "Communication", score: 4, quote: "If the task needs a fixed output style" },
  ];
  return (
    <div data-ui className="flex w-full max-w-[28rem] flex-col gap-5 rounded-[1.75rem] bg-brand-50 p-6 text-brand-950">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-lg font-semibold">Verdict: Lean hire</p>
        <p className="text-3xl font-semibold tabular-nums">
          61<span className="text-base font-medium text-brand-700"> / 100</span>
        </p>
      </div>
      <ul className="flex flex-col gap-4">
        {skills.map((s) => (
          <li key={s.name}>
            <span className="flex justify-between gap-3 text-[15px] font-medium">
              {s.name}
              <span className="tabular-nums">{s.score} / 5</span>
            </span>
            <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-brand-100" aria-hidden="true">
              <span className="block h-full rounded-full bg-brass-500" style={{ width: `${s.score * 20}%` }} />
            </span>
            <span className="mt-1 block text-sm text-brand-800">You said: &ldquo;{s.quote}&rdquo;</span>
          </li>
        ))}
      </ul>
      <p className="rounded-2xl bg-brand-100 p-3 text-sm leading-6">
        <span className="font-semibold">Week 1:</span> run one eval set of 20 questions on your RAG app and report two numbers.
      </p>
    </div>
  );
}

export function Stages({ stage, onStage }: { stage: number; onStage: (n: number) => void }) {
  const fragments = [<AskFragment key="a" />, <AnswerFragment key="b" />, <FollowFragment key="c" />, <ReportFragment key="d" />];
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-[2rem] md:grid-cols-2">
      <div className="order-2 flex flex-col justify-between gap-8 bg-brand-900 p-6 md:order-1 md:p-10">
        <p aria-live="polite" className="text-[clamp(1.9rem,4.2vw,3.5rem)] leading-[1.02] font-medium tracking-[-0.03em] text-balance">
          {STAGES[stage].clause}
        </p>
        <div>
          <label htmlFor="stage-range" className="sr-only">
            Step of the interview
          </label>
          <input
            id="stage-range"
            type="range"
            min={0}
            max={3}
            step={1}
            value={stage}
            onChange={(e) => onStage(Number(e.target.value))}
            aria-valuetext={`${STAGES[stage].name}: ${STAGES[stage].clause}`}
            className="xp-range w-full"
            style={{ ["--xp-fill" as string]: `${(stage / 3) * 100}%` }}
          />
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
            {STAGES.map((s, i) => (
              <button
                key={s.name}
                type="button"
                onClick={() => onStage(i)}
                aria-pressed={i === stage}
                className={`min-h-11 text-left text-[15px] transition-colors ${i === stage ? "font-semibold text-brand-50" : "text-brand-200 hover:text-brand-50"}`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="order-1 grid min-h-[22rem] place-items-center bg-brand-800 p-5 md:order-2 md:min-h-[30rem] md:p-10">
        <div key={stage} className="flex w-full justify-center motion-safe:animate-[xp-fade_220ms_ease-out]">
          {fragments[stage]}
        </div>
      </div>
    </div>
  );
}
