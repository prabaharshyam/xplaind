import Link from "next/link";
import { PointerTilt } from "@/components/motion/pointer-tilt";
import { ScrollScene } from "@/components/motion/scroll-scene";
import type { LevelId } from "@/lib/levels";
import { stageOf } from "@/lib/roadmap/map";

const TONE = { beginner: "#34d399", intermediate: "#38bdf8", pro: "#a78bfa" } as const;
/** The plate that lights up as "you": an example start level, not a claim about the visitor. */
const EXAMPLE_START: LevelId = "I1";

/** Nine levels as a stack of plates that fans open and turns as you scroll, and tilts with the pointer. */
export function Hero({ levels }: { levels: { id: LevelId; name: string }[] }) {
  return (
    <ScrollScene length={2.2} className="lx-ink lx-hero" stageClassName="flex items-center">
      <div className="relative mx-auto grid h-full w-full max-w-6xl grid-rows-[auto_1fr] items-center px-5 pt-20 pb-10 md:grid-cols-[1.05fr_1fr] md:grid-rows-1 md:px-6 md:pt-14">
        <div className="relative z-10">
          <div className="lx-hero-copy">
            <p className="lx-eyebrow text-emerald-400">The GenAI Engineer path</p>
            <h1 className="lx-display mt-5 text-balance">
              Learn AI.
              <br />
              <span className="lx-muted">In the right order.</span>
            </h1>
            <p className="lx-muted mt-6 max-w-md text-lg leading-8 md:text-xl">
              A ten-minute test finds where you are. Then you get your next five steps, each with the one free course worth
              your time.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/start"
                className="inline-flex h-12 items-center rounded-full bg-white px-6 text-[15px] font-medium text-black hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
              >
                Find my level
              </Link>
              <Link
                href="/roadmap/genai-engineer"
                className="inline-flex h-12 items-center rounded-full px-5 text-[15px] font-medium text-white ring-1 ring-white/25 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
              >
                See the roadmap
              </Link>
            </div>
          </div>
          <p aria-hidden="true" className="lx-hero-after lx-title absolute inset-x-0 top-0 hidden text-balance md:block">
            Nine levels.
            <br />
            <span className="lx-muted">You start where the test puts you.</span>
          </p>
        </div>

        <PointerTilt className="relative flex h-full min-h-[300px] items-center justify-center">
          <div className="lx-stack" aria-hidden="true">
            <div className="lx-stack-float">
              <div className="lx-stack-rig relative h-[130px] w-[210px] md:h-[220px] md:w-[340px]">
                {levels.map((l, i) => (
                  <div
                    key={l.id}
                    className={`lx-plate ${l.id === EXAMPLE_START ? "lx-plate-you" : ""}`}
                    style={{ ["--i" as string]: i, ["--tone" as string]: TONE[stageOf(l.id)] }}
                  >
                    <span className="text-[11px] text-zinc-400 md:text-xs">{l.name}</span>
                    <span className="text-xl font-semibold tracking-tight md:text-2xl">{l.id}</span>
                    {l.id === EXAMPLE_START && (
                      <span className="lx-you-chip absolute -top-3 right-4 rounded-full bg-emerald-400 px-2.5 py-1 text-[10px] font-semibold text-black md:text-[11px]">
                        You start here
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
