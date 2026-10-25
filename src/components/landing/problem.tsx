import { ScrollScene } from "@/components/motion/scroll-scene";

const LINES = [
  "Everyone says learn AI.",
  "Nobody says what to learn next, which course to trust, or when you are ready to move on.",
];

/** The problem, lit one word at a time as you scroll. */
export function Problem() {
  const words = LINES.join(" ").split(" ");
  const firstLineWords = LINES[0].split(" ").length;
  return (
    <ScrollScene length={1.8} className="lx-ink" stageClassName="flex items-center">
      <h2 className="lx-title mx-auto max-w-5xl px-5 md:px-6" style={{ ["--n" as string]: words.length }}>
        {words.map((w, i) => (
          <span key={i} className="lx-word" style={{ ["--w" as string]: i }}>
            {i === firstLineWords ? (
              <>
                <br className="hidden md:block" />
                {w}
              </>
            ) : (
              w
            )}{" "}
          </span>
        ))}
      </h2>
    </ScrollScene>
  );
}
