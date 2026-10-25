import Link from "next/link";
import { PointerTilt } from "@/components/motion/pointer-tilt";
import { ScrollScene } from "@/components/motion/scroll-scene";

/** Plate colours cycle through three tones, like the roadmap lines. */
const TONES = ["#34d399", "#38bdf8", "#a78bfa"] as const;
/** The plate that lights up as "yours": an example, not a claim about the visitor. */
const EXAMPLE_PATH = "forward-deployed-engineer";

type HeroPath = { id: string; name: string; detail: string };

/** The nine paths as a stack of plates that fans open and turns as you scroll, and tilts with the pointer. */
export function Hero({ paths }: { paths: HeroPath[] }) {
  return (
    <ScrollScene length={2.2} className="lx-ink lx-hero" stageClassName="flex items-center">
      <div className="relative mx-auto grid h-full w-full max-w-6xl grid-rows-[auto_1fr] items-center px-5 pt-20 pb-10 md:grid-cols-[1.05fr_1fr] md:grid-rows-1 md:px-6 md:pt-14">
        <div className="relative z-10">
          <div className="lx-hero-copy">
            <p className="lx-eyebrow text-emerald-400">Nine AI career paths</p>
            <h1 className="lx-display mt-5 text-balance">
              Learn AI.
              <br />
              <span className="lx-muted">In the right order.</span>
            </h1>
            <p className="lx-muted mt-6 max-w-md text-lg leading-8 md:text-xl">
              Pick a path, from AI for beginners to forward deployed engineer. A short test skips what you know. Every step
              has our own lesson, the one free course worth your time, and a check.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/paths"
                className="inline-flex h-12 items-center rounded-full bg-white px-6 text-[15px] font-medium text-black hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
              >
                Choose a path
              </Link>
              <Link
                href="/start"
                className="inline-flex h-12 items-center rounded-full px-5 text-[15px] font-medium text-white ring-1 ring-white/25 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
              >
                Find my level
              </Link>
            </div>
          </div>
          <p aria-hidden="true" className="lx-hero-after lx-title absolute inset-x-0 top-0 hidden text-balance md:block">
            Nine paths.
            <br />
            <span className="lx-muted">One library of lessons. Nothing learned twice.</span>
          </p>
        </div>

        <PointerTilt className="relative flex h-full min-h-[300px] items-center justify-center">
          <div className="lx-stack" aria-hidden="true">
            <div className="lx-stack-float">
              <div className="lx-stack-rig relative h-[130px] w-[210px] md:h-[220px] md:w-[340px]">
                {paths.map((p, i) => (
                  <div
                    key={p.id}
                    className={`lx-plate ${p.id === EXAMPLE_PATH ? "lx-plate-you" : ""}`}
                    style={{ ["--i" as string]: i, ["--tone" as string]: TONES[i % TONES.length] }}
                  >
                    <span className="hidden text-xs whitespace-nowrap text-zinc-400 md:inline">{p.detail}</span>
                    <span className="ml-auto text-sm font-semibold tracking-tight whitespace-nowrap md:text-xl">{p.name}</span>
                    {p.id === EXAMPLE_PATH && (
                      <span className="lx-you-chip absolute -top-3 right-4 rounded-full bg-emerald-400 px-2.5 py-1 text-[10px] font-semibold text-black md:text-[11px]">
                        Your path
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PointerTilt>
      </div>
    </ScrollScene>
  );
}
