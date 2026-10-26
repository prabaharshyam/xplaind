"use client";

import Link from "next/link";
import { useState } from "react";
import { aiPost } from "@/components/ai/ai-client";
import { type AiAccess, AiGate, useAiAccess } from "@/components/ai/ai-gate";
import { AiError, AiWorking } from "@/components/ai/ai-working";
import { Icon } from "@/components/art/icons";
import { primaryButton, secondaryButton } from "@/components/ui";
import { addTopic, moveTopic, removeTopic, renameTopic, type Roadmap, totalHours, totalWeeks } from "@/lib/ai/roadmap";
import { addRoadmap, deleteRoadmap, type SavedRoadmap, updateRoadmap } from "@/lib/browser/ai-store";
import { useAi } from "@/lib/browser/hooks";
import { todayInIST } from "@/lib/dates";

const field =
  "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700";

const GOAL_IDEAS = [
  "Get my first job as a generative AI engineer",
  "Use AI to automate reports in my finance job",
  "Move from software testing into AI evaluation",
  "Build and sell AI chatbots to small businesses",
];

const LEVELS = [
  { id: "new", label: "New to AI and coding" },
  { id: "some", label: "Some coding, used AI tools" },
  { id: "experienced", label: "I code professionally" },
] as const;

const STEPS = ["Reading your goal", "Choosing the stages", "Matching Xplaind lessons", "Sizing it to your hours", "Adding a project"];

/** The roadmap generator: a form, the learner's saved roadmaps, and the open one. */
export function RoadmapStudio({ enabled }: { enabled: boolean }) {
  const access = useAiAccess(enabled);
  const { roadmaps } = useAi();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = roadmaps.find((r) => r.id === openId) ?? null;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0">
        {open ? (
          <RoadmapView key={open.id} saved={open} access={access} onClose={() => setOpenId(null)} />
        ) : (
          <section aria-labelledby="new-roadmap">
            <h2 id="new-roadmap" className="text-2xl font-semibold tracking-tight">
              Describe where you want to go
            </h2>
            <div className="mt-4">
              <AiGate access={access} next="/ai/roadmap">
                <RoadmapForm onMade={setOpenId} />
              </AiGate>
            </div>
          </section>
        )}
      </div>
      <aside aria-labelledby="saved-roadmaps" className="lg:sticky lg:top-20 lg:self-start">
        <h2 id="saved-roadmaps" className="font-semibold">
          Your roadmaps
        </h2>
        {roadmaps.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Roadmaps you make are saved on this device.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {roadmaps.map((r) => {
              const all = r.roadmap.stages.flatMap((s) => s.topics).length;
              const pct = all ? Math.round((r.done.length / all) * 100) : 0;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(r.id)}
                    aria-current={r.id === openId ? "true" : undefined}
                    className={`w-full rounded-xl border p-3 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                      r.id === openId ? "border-emerald-600" : "border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    <span className="line-clamp-2 font-medium">{r.roadmap.title}</span>
                    <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <span className="block h-full bg-emerald-600" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="mt-1 block text-xs text-zinc-600 dark:text-zinc-400">
                      {pct}% done · made {r.createdOn}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {open && (
          <button type="button" onClick={() => setOpenId(null)} className={`${secondaryButton} mt-4 w-full`}>
            Make a new roadmap
          </button>
        )}
      </aside>
    </div>
  );
}

function RoadmapForm({ onMade }: { onMade: (id: string) => void }) {
  const [goal, setGoal] = useState("");
  const [background, setBackground] = useState("");
  const [level, setLevel] = useState<(typeof LEVELS)[number]["id"]>("some");
  const [hoursPerWeek, setHours] = useState(6);
  const [weeks, setWeeks] = useState(12);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (goal.trim().length < 3) {
      setError("Tell us your goal in a few words first.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await aiPost<{ roadmap: Roadmap }>("/api/ai/roadmap", { mode: "new", goal, background, level, hoursPerWeek, weeks });
    setBusy(false);
    if (!res.ok) return setError(res.message);
    onMade(addRoadmap(goal.trim().slice(0, 300), res.data.roadmap, todayInIST()));
  };

  if (busy) return <AiWorking steps={STEPS} />;
  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="block">
        <span className="font-medium">Your goal</span>
        <textarea value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={300} rows={2} className={`${field} mt-1`} placeholder="For example: get a job building AI chatbots" />
      </label>
      <div className="flex flex-wrap gap-2" aria-label="Goal ideas">
        {GOAL_IDEAS.map((g) => (
          <button key={g} type="button" onClick={() => setGoal(g)} className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
            {g}
          </button>
        ))}
      </div>
      <label className="block">
        <span className="font-medium">About you (optional)</span>
        <textarea
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          maxLength={600}
          rows={3}
          className={`${field} mt-1`}
          placeholder="Your degree or job, what you already know, and anything you want to avoid. Do not include personal details like your phone number."
        />
      </label>
      <fieldset>
        <legend className="font-medium">Where you are starting</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {LEVELS.map((l) => (
            <label key={l.id} className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border px-3 ${level === l.id ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" : "border-zinc-300 dark:border-zinc-700"}`}>
              <input type="radio" name="level" value={l.id} checked={level === l.id} onChange={() => setLevel(l.id)} className="size-4 accent-emerald-700" />
              <span className="text-sm">{l.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="font-medium">Hours a week: {hoursPerWeek}</span>
          <input type="range" min={1} max={40} value={hoursPerWeek} onChange={(e) => setHours(Number(e.target.value))} className="mt-3 w-full accent-emerald-700" />
        </label>
        <label className="block">
          <span className="font-medium">Weeks: {weeks}</span>
          <input type="range" min={2} max={52} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} className="mt-3 w-full accent-emerald-700" />
        </label>
      </div>
      {error && <AiError message={error} />}
      <button type="submit" className={primaryButton}>
        <Icon name="sparkles" size={18} className="mr-2" /> Generate my roadmap
      </button>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Made by Claude, an AI model from Anthropic, using only what you type here. Check anything important. We link our own free lessons where they fit.
      </p>
    </form>
  );
}

const REFINE_IDEAS = ["Make it shorter", "Add more hands-on projects", "Focus on interview preparation", "I can only study on weekends", "Explain it for a complete beginner"];

function RoadmapView({ saved, access, onClose }: { saved: SavedRoadmap; access: AiAccess; onClose: () => void }) {
  const r = saved.roadmap;
  const [editing, setEditing] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const done = new Set(saved.done);
  const topics = r.stages.flatMap((s) => s.topics);
  const pct = topics.length ? Math.round((topics.filter((t) => done.has(t.id)).length / topics.length) * 100) : 0;

  const change = (next: Roadmap) =>
    updateRoadmap(saved.id, (s) => {
      const ids = new Set(next.stages.flatMap((st) => st.topics.map((t) => t.id)));
      return { ...s, roadmap: next, done: s.done.filter((id) => ids.has(id)) };
    });
  const toggle = (id: string) => updateRoadmap(saved.id, (s) => ({ ...s, done: s.done.includes(id) ? s.done.filter((x) => x !== id) : [...s.done, id] }));

  const refine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (instruction.trim().length < 3) return setError("Say what you would like to change.");
    setBusy(true);
    setError(null);
    const res = await aiPost<{ roadmap: Roadmap }>("/api/ai/roadmap", { mode: "refine", roadmap: r, instruction });
    setBusy(false);
    if (!res.ok) return setError(res.message);
    // Keep ticks on topics that survived the edit, matched by title.
    const doneTitles = new Set(topics.filter((t) => done.has(t.id)).map((t) => t.title.toLowerCase()));
    const next = res.data.roadmap;
    updateRoadmap(saved.id, (s) => ({
      ...s,
      roadmap: next,
      done: next.stages.flatMap((st) => st.topics).filter((t) => doneTitles.has(t.title.toLowerCase())).map((t) => t.id),
    }));
    setInstruction("");
  };

  return (
    <article aria-labelledby="roadmap-title">
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 p-6 text-white shadow-lg dark:border-zinc-800">
        <p className="flex items-center gap-2 text-sm font-medium text-white/90">
          <Icon name="sparkles" size={16} /> AI roadmap
        </p>
        <h2 id="roadmap-title" className="mt-1 text-2xl leading-tight font-semibold md:text-3xl">
          {r.title}
        </h2>
        <p className="mt-2 max-w-2xl leading-7 text-white/95">{r.summary}</p>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-center sm:max-w-md">
          {[
            ["weeks", totalWeeks(r)],
            ["hours", totalHours(r)],
            ["topics", topics.length],
          ].map(([label, n]) => (
            <div key={label} className="rounded-xl bg-white/15 px-2 py-2 backdrop-blur">
              <dt className="text-xs text-white/85">{label}</dt>
              <dd className="text-xl font-semibold">{n}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4" aria-label={`${pct}% done`} role="img">
          <div className="h-2 overflow-hidden rounded-full bg-white/25">
            <div className="h-full bg-white transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-sm text-white/90">{pct}% done</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 print:hidden">
        <button type="button" onClick={() => setEditing((v) => !v)} aria-pressed={editing} className={secondaryButton}>
          {editing ? "Done editing" : "Edit roadmap"}
        </button>
        <button type="button" onClick={() => window.print()} className={secondaryButton}>
          Print or save as PDF
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Delete this roadmap from this device?")) {
              deleteRoadmap(saved.id);
              onClose();
            }
          }}
          className={`${secondaryButton} text-rose-800 dark:text-rose-300`}
        >
          Delete
        </button>
      </div>

      <ol className="relative mt-8 space-y-10 border-l-2 border-dashed border-zinc-300 pl-6 dark:border-zinc-700">
        {r.stages.map((s, i) => (
          <li key={s.id} className="relative">
            <span className="absolute top-0 -left-[2.4rem] grid size-9 place-items-center rounded-full bg-zinc-900 text-sm font-semibold text-white dark:bg-white dark:text-black" aria-hidden="true">
              {i + 1}
            </span>
            <h3 className="text-xl font-semibold">
              <span className="sr-only">Stage {i + 1}: </span>
              {s.title}
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              About {s.weeks} {s.weeks === 1 ? "week" : "weeks"} · {s.goal}
            </p>
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {s.topics.map((t, j) => (
                <li key={t.id} className={`rounded-2xl border p-4 transition ${done.has(t.id) ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"}`}>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={done.has(t.id)} onChange={() => toggle(t.id)} aria-label={`Mark "${t.title}" done`} className="mt-1 size-5 shrink-0 accent-emerald-700" />
                    <div className="min-w-0 flex-1">
                      {editing ? (
                        <label className="block">
                          <span className="sr-only">Topic name</span>
                          <input defaultValue={t.title} onBlur={(e) => change(renameTopic(r, t.id, e.target.value))} className={`${field} py-1.5 font-medium`} />
                        </label>
                      ) : (
                        <p className={`font-medium ${done.has(t.id) ? "line-through decoration-emerald-600" : ""}`}>{t.title}</p>
                      )}
                      {t.why && <p className="mt-1 text-sm leading-6 text-zinc-700 dark:text-zinc-300">{t.why}</p>}
                      {t.subtopics.length > 0 && (
                        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Subtopics">
                          {t.subtopics.map((x) => (
                            <li key={x} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
                              {x}
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span className="text-zinc-600 dark:text-zinc-400">about {t.hours} h</span>
                        {t.lessonId && (
                          <Link href={`/stop/${t.lessonId}`} className="font-medium text-emerald-800 underline underline-offset-2 dark:text-emerald-400">
                            Read our free lesson
                          </Link>
                        )}
                      </p>
                      {editing && (
                        <div className="mt-3 flex gap-2">
                          <button type="button" onClick={() => change(moveTopic(r, t.id, -1))} aria-label={`Move up: ${t.title}`} disabled={j === 0} className="min-h-10 rounded-lg border border-zinc-300 px-3 text-sm disabled:opacity-40 dark:border-zinc-700">
                            Move up
                          </button>
                          <button type="button" onClick={() => change(moveTopic(r, t.id, 1))} aria-label={`Move down: ${t.title}`} disabled={j === s.topics.length - 1} className="min-h-10 rounded-lg border border-zinc-300 px-3 text-sm disabled:opacity-40 dark:border-zinc-700">
                            Move down
                          </button>
                          <button type="button" onClick={() => change(removeTopic(r, t.id))} aria-label={`Remove: ${t.title}`} className="min-h-10 rounded-lg border border-rose-300 px-3 text-sm text-rose-800 dark:border-rose-800 dark:text-rose-300">
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {editing && <AddTopic onAdd={(title) => change(addTopic(r, s.id, title))} stage={s.title} />}
          </li>
        ))}
      </ol>

      {r.project.title && (
        <section className="mt-10 rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30" aria-labelledby="capstone">
          <h3 id="capstone" className="flex items-center gap-2 text-lg font-semibold">
            <Icon name="trophy" size={20} /> Portfolio project: {r.project.title}
          </h3>
          <p className="mt-2 leading-7">{r.project.description}</p>
        </section>
      )}
      {r.tips.length > 0 && (
        <section className="mt-6" aria-labelledby="tips">
          <h3 id="tips" className="text-lg font-semibold">
            Tips
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-6 leading-7">
            {r.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10 rounded-2xl border border-violet-200 bg-violet-50/60 p-5 print:hidden dark:border-violet-900 dark:bg-violet-950/20" aria-labelledby="ai-editor">
        <h3 id="ai-editor" className="flex items-center gap-2 text-lg font-semibold">
          <Icon name="sparkles" size={20} /> Change it with AI
        </h3>
        <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">Say what to change in plain words. The AI rewrites the roadmap and keeps your ticks on topics that stay.</p>
        <div className="mt-3">
          <AiGate access={access} next="/ai/roadmap">
            {busy ? (
              <AiWorking steps={["Reading your change", "Rewriting the stages", "Checking the hours"]} />
            ) : (
              <form onSubmit={refine} className="space-y-3">
                <label className="block">
                  <span className="sr-only">What should change?</span>
                  <textarea value={instruction} onChange={(e) => setInstruction(e.target.value)} maxLength={400} rows={2} className={field} placeholder="For example: add a stage on interview practice and drop the maths" />
                </label>
                <div className="flex flex-wrap gap-2">
                  {REFINE_IDEAS.map((x) => (
                    <button key={x} type="button" onClick={() => setInstruction(x)} className="rounded-full border border-violet-300 bg-white px-3 py-1.5 text-sm hover:bg-violet-100 dark:border-violet-800 dark:bg-zinc-900 dark:hover:bg-violet-950">
                      {x}
                    </button>
                  ))}
                </div>
                {error && <AiError message={error} />}
                <button type="submit" className={primaryButton}>
                  Update roadmap
                </button>
              </form>
            )}
          </AiGate>
        </div>
      </section>
      <p className="mt-6 text-xs text-zinc-600 dark:text-zinc-400">
        Made with AI on {saved.createdOn} for: “{saved.goal}”. AI can be wrong, so check anything important.
      </p>
    </article>
  );
}

function AddTopic({ onAdd, stage }: { onAdd: (title: string) => void; stage: string }) {
  const [title, setTitle] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onAdd(title);
        setTitle("");
      }}
      className="mt-3 flex gap-2"
    >
      <label className="min-w-0 flex-1">
        <span className="sr-only">New topic for {stage}</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Add a topic" className={field} />
      </label>
      <button type="submit" className={secondaryButton}>
        Add
      </button>
    </form>
  );
}
