// Small, honest mock-ups of the real features, drawn with HTML and SVG. Decorative:
// every tile also says in words what the feature does.
import { Cover } from "@/components/art/cover";
import { Icon } from "@/components/art/icons";

export function MiniRoadmap() {
  const nodes = [
    { x: 150, y: 24, label: "Python", done: true },
    { x: 150, y: 74, label: "LLM APIs", done: true },
    { x: 150, y: 124, label: "RAG", here: true },
    { x: 150, y: 174, label: "Agents" },
    { x: 150, y: 224, label: "Evals" },
  ];
  const side = [
    { x: 40, y: 99, label: "Tokens", done: true },
    { x: 260, y: 124, label: "Embeddings" },
    { x: 40, y: 174, label: "Tools" },
    { x: 260, y: 199, label: "MCP" },
  ];
  return (
    <svg viewBox="0 0 300 250" className="h-auto w-full" aria-hidden="true">
      <line x1="150" y1="24" x2="150" y2="224" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
      {side.map((s) => (
        <line key={s.label} x1={s.x} y1={s.y} x2="150" y2={s.y < 124 ? 99 : s.y} stroke="currentColor" strokeOpacity=".2" strokeDasharray="4 4" />
      ))}
      {[...nodes, ...side].map((n) => (
        <g key={n.label}>
          <rect
            x={n.x - 44}
            y={n.y - 13}
            width="88"
            height="26"
            rx="8"
            fill={"here" in n && n.here ? "#10b981" : "done" in n && n.done ? "#d1fae5" : "#fef3c7"}
            stroke={"here" in n && n.here ? "#047857" : "#0000"}
          />
          <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill={"here" in n && n.here ? "white" : "#1f2937"}>
            {"done" in n && n.done ? "✓ " : ""}
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function MiniLesson() {
  return (
    <div aria-hidden="true" className="rounded-2xl bg-white p-4 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
      <div className="flex items-center justify-between text-xs">
        <span className="rounded-full bg-teal-100 px-2 py-0.5 font-medium text-teal-900">Retrieval · 20 min</span>
      </div>
      <p className="mt-3 font-semibold">Build a RAG app</p>
      <div className="mt-2 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div className="h-full w-3/5 rounded-full bg-emerald-500" />
      </div>
      <ul className="mt-3 space-y-1.5 text-sm">
        {["What it is", "How it works", "A worked example"].map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span className={`grid size-4 place-items-center rounded-full text-[10px] ${i < 2 ? "bg-emerald-500 text-white" : "border border-zinc-300"}`}>{i < 2 ? "✓" : ""}</span>
            {s}
          </li>
        ))}
      </ul>
      <p className="mt-3 rounded-2xl bg-zinc-100 p-2 text-xs dark:bg-zinc-800">Quick check: which step comes first? ◉ Retrieve ○ Generate</p>
    </div>
  );
}

export function MiniInterview() {
  return (
    <div aria-hidden="true" className="rounded-2xl bg-white p-4 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
      <p className="text-xs text-zinc-600 dark:text-zinc-400">Question 2 of 5 · RAG</p>
      <p className="mt-1 font-semibold">How do you evaluate a RAG system?</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-2xl tabular-nums">1:12</span>
        <span className="flex items-center gap-2 rounded-full bg-rose-600 px-3 py-1.5 text-sm text-white">
          <span className="size-2 animate-pulse rounded-full bg-white" /> Listening
        </span>
      </div>
      <ul className="mt-3 space-y-1 text-sm">
        <li className="text-emerald-700 dark:text-emerald-400">✓ Retrieval and generation separately</li>
        <li className="text-emerald-700 dark:text-emerald-400">✓ Recall at k</li>
        <li className="text-rose-700 dark:text-rose-400">✗ Faithfulness to the context</li>
      </ul>
    </div>
  );
}

export function MiniCourses() {
  const items = [
    { theme: "llm" as const, title: "Building with the Claude API", by: "Anthropic Academy" },
    { theme: "agents" as const, title: "AI Agents for Beginners", by: "Microsoft" },
    { theme: "ml" as const, title: "LLM Course", by: "Hugging Face" },
  ];
  return (
    <div aria-hidden="true" className="grid grid-cols-3 gap-2">
      {items.map((c) => (
        <div key={c.title} className="overflow-hidden rounded-2xl bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
          <Cover theme={c.theme} seed={c.title} className="h-14" iconSize={18} />
          <p className="p-2 text-[11px] leading-tight font-medium">{c.title}</p>
          <p className="px-2 pb-2 text-[10px] text-zinc-600 dark:text-zinc-400">{c.by}</p>
        </div>
      ))}
    </div>
  );
}

export function MiniProgress() {
  return (
    <div aria-hidden="true" className="flex flex-wrap items-center gap-3">
      <span className="flex items-center gap-2 rounded-2xl bg-amber-100 px-4 py-3 text-amber-900">
        <Icon name="fire" size={22} /> <span className="text-2xl font-semibold">7</span> day streak
      </span>
      <span className="rounded-2xl bg-emerald-100 px-4 py-3 text-emerald-900">
        <span className="text-2xl font-semibold">12</span> lessons done
      </span>
    </div>
  );
}

/** The "Study from my notes & books" spotlight: a file becomes a flashcard that quotes its page. */
export function MiniNotes() {
  return (
    <div aria-hidden="true" className="relative mx-auto flex w-full max-w-[340px] flex-col gap-3">
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="grid size-10 place-items-center rounded-2xl bg-rose-100 text-xs font-bold text-rose-900">PDF</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">Class 12 Biology notes.pdf</span>
          <span className="block text-xs text-zinc-600 dark:text-zinc-400">212 pages · read on your device</span>
        </span>
      </div>
      <div className="relative pb-2">
        <span className="absolute inset-x-4 bottom-0 h-full rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
        <div className="relative rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-[11px] font-semibold tracking-wide text-zinc-600 uppercase dark:text-zinc-400">Flashcard 3 of 15</p>
          <p className="mt-2 font-semibold text-zinc-900 dark:text-zinc-100">Where do plants turn light into chemical energy?</p>
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">In the chloroplast, during photosynthesis.</p>
          <p className="mt-3 border-l-2 border-zinc-300 pl-2 text-xs text-zinc-600 italic dark:border-zinc-700 dark:text-zinc-400">From your notes: Chapter 6, page 41</p>
        </div>
      </div>
    </div>
  );
}
