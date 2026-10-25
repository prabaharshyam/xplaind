import { ScrollScene } from "@/components/motion/scroll-scene";

const STEPS = [
  {
    title: "Take a ten-minute test.",
    body: "Twelve questions that get harder when you are right and easier when you are not. No sign-up. It places you on one of nine levels.",
  },
  {
    title: "Get your next five steps.",
    body: "Not a hundred links. Five steps from where you are, each with the one free course we would pick ourselves.",
  },
  {
    title: "Prove it. Then move on.",
    body: "Every step ends in a quick check or a small project. Practise real interview questions as you go.",
  },
];

export type HowItWorksData = {
  question: { text: string; options: string[] };
  steps: { title: string; level: string }[];
  interview: { question: string; answer: string };
};

/** Three steps on a turning prism: test, roadmap, practice. */
export function HowItWorks({ data }: { data: HowItWorksData }) {
  return (
    <ScrollScene length={3.2} className="lx-ink" stageClassName="flex items-center">
      <div className="mx-auto grid h-full w-full max-w-6xl grid-rows-[auto_1fr] items-center gap-6 px-5 pt-20 pb-8 md:grid-cols-2 md:grid-rows-1 md:px-6 md:pt-0">
        <div>
          <p className="lx-eyebrow text-emerald-400">How it works</p>
          <ol className="mt-6 flex flex-col gap-5 md:mt-10 md:gap-10">
            {STEPS.map((s, i) => (
              <li key={s.title} className="lx-step" style={{ ["--c" as string]: (i + 0.5) / 3 }}>
                <h2 className="text-2xl font-semibold tracking-tight md:text-4xl">
                  <span className="lx-muted mr-3 font-mono text-base md:text-lg">0{i + 1}</span>
                  {s.title}
                </h2>
                <p className="lx-muted mt-2 hidden max-w-md leading-7 md:block md:text-lg">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="lx-prism-stage flex items-center justify-center" aria-hidden="true">
          <div className="lx-prism">
            <TestFace face={0} data={data.question} />
            <RoadmapFace face={1} steps={data.steps} />
            <PracticeFace face={2} data={data.interview} />
          </div>
        </div>
      </div>
    </ScrollScene>
  );
}

const angle = (face: number) => ({ ["--a" as string]: `${face * 120}deg` });

function TestFace({ face, data }: { face: number; data: HowItWorksData["question"] }) {
  return (
    <div className="lx-face flex flex-col" style={angle(face)}>
      <p className="text-[11px] text-zinc-400">Question 4 of up to 12</p>
      <div className="mt-2 h-1 rounded-full bg-white/10">
        <div className="h-full w-1/3 rounded-full bg-emerald-400" />
      </div>
      <p className="mt-5 text-[15px] leading-6 font-medium">{data.text}</p>
      <ul className="mt-4 flex flex-col gap-2 text-[12px] leading-5">
        {[...data.options, "I don't know"].map((o, i) => (
          <li
            key={o}
            className={`rounded-xl border px-3 py-2 ${i === 1 ? "border-emerald-400 bg-emerald-400/10" : "border-white/10"} ${i === data.options.length ? "text-zinc-400" : ""}`}
          >
            {o}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoadmapFace({ face, steps }: { face: number; steps: HowItWorksData["steps"] }) {
  return (
    <div className="lx-face" style={angle(face)}>
      <p className="text-[11px] text-zinc-400">Your next five steps</p>
      <p className="mt-1 inline-block rounded-full bg-emerald-400 px-2 py-0.5 text-[10px] font-semibold text-black">You start at I1</p>
      <ol className="relative mt-5 flex flex-col gap-4">
        <span className="absolute top-2 bottom-2 left-[7px] w-0.5 bg-sky-400/70" />
        {steps.map((s, i) => (
          <li key={s.title} className="relative flex items-start gap-3">
            <span className={`relative mt-0.5 size-4 shrink-0 rounded-full border-2 border-sky-400 ${i === 0 ? "bg-sky-400" : "bg-[#0f0f11]"}`} />
            <span>
              <span className="block text-[13px] leading-5 font-medium">{s.title}</span>
              <span className="block text-[10px] text-zinc-400">{i === 0 ? "Done" : `${s.level} · free course`}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PracticeFace({ face, data }: { face: number; data: HowItWorksData["interview"] }) {
  return (
    <div className="lx-face flex flex-col" style={angle(face)}>
      <p className="text-[11px] text-zinc-400">Interview practice</p>
      <p className="mt-3 text-[16px] leading-6 font-semibold">{data.question}</p>
      <p className="mt-4 rounded-2xl bg-white/5 p-3 text-[12px] leading-5 text-zinc-300">{data.answer}</p>
      <p className="mt-auto pt-4 text-[11px] text-zinc-400">How did you do?</p>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[12px]">
        <span className="rounded-full bg-emerald-400 py-1.5 font-semibold text-black">Got it</span>
        <span className="rounded-full border border-white/15 py-1.5">Partly</span>
        <span className="rounded-full border border-white/15 py-1.5">Missed</span>
      </div>
    </div>
  );
}
