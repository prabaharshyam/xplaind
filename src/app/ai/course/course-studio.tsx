"use client";

import { useState } from "react";
import { aiPost } from "@/components/ai/ai-client";
import { AiGate, useAiAccess } from "@/components/ai/ai-gate";
import { AiText } from "@/components/ai/ai-text";
import { AiError, AiWorking } from "@/components/ai/ai-working";
import { Icon } from "@/components/art/icons";
import { Flashcards } from "@/components/flashcards";
import { primaryButton, secondaryButton } from "@/components/ui";
import type { CourseLesson, CourseOutline } from "@/lib/ai/features";
import { addCourse, deleteCourse, type SavedCourse, saveCourseLesson } from "@/lib/browser/ai-store";
import { useAi } from "@/lib/browser/hooks";
import { todayInIST } from "@/lib/dates";

const field =
  "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700";

const IDEAS = ["Prompt engineering for marketers", "Vector databases", "Statistics for machine learning", "Building WhatsApp bots with AI", "SQL for data analysis"];
const LEVELS = [
  { id: "new", label: "Beginner" },
  { id: "some", label: "Some experience" },
  { id: "experienced", label: "Advanced" },
] as const;

const lessonKey = (m: number, l: number) => `${m}-${l}`;

export function CourseStudio({ enabled }: { enabled: boolean }) {
  const access = useAiAccess(enabled);
  const { courses } = useAi();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = courses.find((c) => c.id === openId) ?? null;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0">
        {open ? (
          <CourseView key={open.id} course={open} canGenerate={access === "on"} gate={(n) => <AiGate access={access} next="/ai/course">{n}</AiGate>} onClose={() => setOpenId(null)} />
        ) : (
          <section aria-labelledby="new-course">
            <h2 id="new-course" className="text-2xl font-semibold tracking-tight">
              What do you want to learn?
            </h2>
            <div className="mt-4">
              <AiGate access={access} next="/ai/course">
                <CourseForm onMade={setOpenId} />
              </AiGate>
            </div>
          </section>
        )}
      </div>
      <aside aria-labelledby="saved-courses" className="lg:sticky lg:top-20 lg:self-start">
        <h2 id="saved-courses" className="font-semibold">
          Your courses
        </h2>
        {courses.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Courses you make are saved on this device.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {courses.map((c) => {
              const total = c.outline.modules.reduce((n, m) => n + m.lessons.length, 0);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(c.id)}
                    aria-current={c.id === openId ? "true" : undefined}
                    className={`w-full rounded-xl border p-3 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 ${c.id === openId ? "border-emerald-600" : "border-zinc-200 dark:border-zinc-800"}`}
                  >
                    <span className="line-clamp-2 font-medium">{c.outline.title}</span>
                    <span className="mt-1 block text-xs text-zinc-600 dark:text-zinc-400">
                      {Object.keys(c.lessons).length} of {total} lessons written
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {open && (
          <button type="button" onClick={() => setOpenId(null)} className={`${secondaryButton} mt-4 w-full`}>
            Make a new course
          </button>
        )}
      </aside>
    </div>
  );
}

function CourseForm({ onMade }: { onMade: (id: string) => void }) {
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState<SavedCourse["level"]>("new");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim().length < 2) return setError("Type a topic first.");
    setBusy(true);
    setError(null);
    const res = await aiPost<{ outline: CourseOutline }>("/api/ai/course", { topic, goal, level });
    setBusy(false);
    if (!res.ok) return setError(res.message);
    onMade(addCourse(level, res.data.outline, todayInIST()));
  };

  if (busy) return <AiWorking steps={["Understanding the topic", "Planning modules", "Ordering lessons"]} />;
  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="block">
        <span className="font-medium">Topic</span>
        <input value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={200} className={`${field} mt-1`} placeholder="Anything: transformers, Excel with AI, UPI fraud detection…" />
      </label>
      <div className="flex flex-wrap gap-2" aria-label="Topic ideas">
        {IDEAS.map((g) => (
          <button key={g} type="button" onClick={() => setTopic(g)} className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
            {g}
          </button>
        ))}
      </div>
      <label className="block">
        <span className="font-medium">Why you want it (optional)</span>
        <input value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={300} className={`${field} mt-1`} placeholder="For example: to build a project for my resume" />
      </label>
      <fieldset>
        <legend className="font-medium">Your level</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {LEVELS.map((l) => (
            <label key={l.id} className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border px-3 ${level === l.id ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" : "border-zinc-300 dark:border-zinc-700"}`}>
              <input type="radio" name="level" checked={level === l.id} onChange={() => setLevel(l.id)} className="size-4 accent-emerald-700" />
              <span className="text-sm">{l.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {error && <AiError message={error} />}
      <button type="submit" className={primaryButton}>
        <Icon name="sparkles" size={18} className="mr-2" /> Generate my course
      </button>
    </form>
  );
}

function CourseView({ course, canGenerate, gate, onClose }: { course: SavedCourse; canGenerate: boolean; gate: (n: React.ReactNode) => React.ReactNode; onClose: () => void }) {
  const o = course.outline;
  const [active, setActive] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const total = o.modules.reduce((n, m) => n + m.lessons.length, 0);

  const write = async (mi: number, li: number) => {
    const key = lessonKey(mi, li);
    setActive(key);
    if (course.lessons[key] || !canGenerate) return;
    setBusy(key);
    setError(null);
    const res = await aiPost<{ lesson: CourseLesson }>("/api/ai/course-lesson", {
      course: o.title,
      module: o.modules[mi].title,
      lesson: o.modules[mi].lessons[li].title,
      level: course.level,
    });
    setBusy(null);
    if (!res.ok) return setError(res.message);
    saveCourseLesson(course.id, key, res.data.lesson);
  };

  const mi = active ? Number(active.split("-")[0]) : -1;
  const lesson = active ? course.lessons[active] : undefined;

  return (
    <article aria-labelledby="course-title">
      <div className="rounded-3xl bg-gradient-to-br from-sky-600 via-indigo-600 to-violet-600 p-6 text-white shadow-lg">
        <p className="flex items-center gap-2 text-sm font-medium text-white/90">
          <Icon name="book" size={16} /> AI course
        </p>
        <h2 id="course-title" className="mt-1 text-2xl leading-tight font-semibold md:text-3xl">
          {o.title}
        </h2>
        <p className="mt-2 max-w-2xl leading-7 text-white/95">{o.summary}</p>
        <p className="mt-3 text-sm text-white/90">
          For: {o.audience} · {o.modules.length} modules · {total} lessons · {Object.keys(course.lessons).length} written
        </p>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[16rem_minmax(0,1fr)]">
        <nav aria-label="Course lessons" className="md:sticky md:top-20 md:self-start">
          <ol className="space-y-4">
            {o.modules.map((m, a) => (
              <li key={m.title}>
                <p className="text-sm font-semibold">
                  {a + 1}. {m.title}
                </p>
                <ol className="mt-1 space-y-1">
                  {m.lessons.map((l, b) => {
                    const key = lessonKey(a, b);
                    return (
                      <li key={l.title}>
                        <button
                          type="button"
                          onClick={() => void write(a, b)}
                          aria-current={active === key ? "true" : undefined}
                          className={`flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${active === key ? "bg-indigo-100 dark:bg-indigo-950" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
                        >
                          <span aria-hidden="true" className={`mt-1 size-2.5 shrink-0 rounded-full ${course.lessons[key] ? "bg-emerald-600" : "border border-zinc-400"}`} />
                          <span>
                            {l.title}
                            <span className="sr-only">{course.lessons[key] ? " (written)" : " (not written yet)"}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Delete this course from this device?")) {
                deleteCourse(course.id);
                onClose();
              }
            }}
            className="mt-6 text-sm text-rose-800 underline underline-offset-2 dark:text-rose-300"
          >
            Delete this course
          </button>
        </nav>

        <div className="min-w-0" aria-live="polite">
          {!active && (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-6 dark:border-zinc-700">
              <p className="font-medium">Pick a lesson to start.</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Each lesson is written when you open it, with examples, a diagram, a quiz and flashcards.</p>
              <ul className="mt-4 space-y-3">
                {o.modules.map((m) => (
                  <li key={m.title}>
                    <p className="font-medium">{m.title}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{m.summary}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {active && busy === active && <AiWorking steps={["Writing the explanation", "Drawing a diagram", "Adding an example", "Making the quiz and flashcards"]} />}
          {active && !lesson && busy !== active && (error ? <AiError message={error} /> : gate(<p>Choose the lesson again to write it.</p>))}
          {lesson && <LessonBody lesson={lesson} where={`${o.modules[mi]?.title ?? ""}`} />}
        </div>
      </div>
    </article>
  );
}

function LessonBody({ lesson, where }: { lesson: CourseLesson; where: string }) {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{where}</p>
        <h3 className="text-2xl font-semibold tracking-tight">{lesson.title}</h3>
        <AiText text={lesson.intro} className="mt-3 text-lg" />
      </header>
      {lesson.sections.map((s) => (
        <section key={s.heading} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h4 className="text-xl font-semibold">{s.heading}</h4>
          <AiText text={s.body} className="mt-3" />
        </section>
      ))}
      {lesson.diagram && (
        <figure className="rounded-2xl border border-zinc-200 bg-zinc-950 p-5 text-zinc-100 dark:border-zinc-800">
          <figcaption className="mb-3 text-sm font-medium text-zinc-300">Diagram</figcaption>
          <pre className="overflow-x-auto text-sm leading-6">{lesson.diagram}</pre>
        </figure>
      )}
      <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30">
        <h4 className="text-xl font-semibold">Example: {lesson.example.title}</h4>
        <AiText text={lesson.example.body} className="mt-3" />
      </section>
      <section>
        <h4 className="text-xl font-semibold">Key points</h4>
        <ul className="mt-2 list-disc space-y-1 pl-6 leading-7">
          {lesson.key_points.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      </section>
      {lesson.quiz.length > 0 && <Quiz quiz={lesson.quiz} />}
      {lesson.flashcards.length > 0 && <Flashcards cards={lesson.flashcards} storageKey={null} title="Test your understanding" />}
      <p className="text-xs text-zinc-600 dark:text-zinc-400">Written by AI for you. It can be wrong, so check anything important against a trusted source.</p>
    </div>
  );
}

function Quiz({ quiz }: { quiz: CourseLesson["quiz"] }) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const score = quiz.filter((q, i) => picked[i] === q.answer_index).length;
  const answered = Object.keys(picked).length;
  return (
    <section aria-labelledby="quiz-h">
      <h4 id="quiz-h" className="text-xl font-semibold">
        Quick quiz
      </h4>
      <ol className="mt-3 space-y-5">
        {quiz.map((q, i) => (
          <li key={q.question}>
            <fieldset>
              <legend className="font-medium">
                {i + 1}. {q.question}
              </legend>
              <div className="mt-2 grid gap-2">
                {q.options.map((opt, j) => {
                  const chosen = picked[i] === j;
                  const show = picked[i] !== undefined;
                  const right = j === q.answer_index;
                  return (
                    <label
                      key={opt}
                      className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                        show && right ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" : show && chosen ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40" : "border-zinc-300 dark:border-zinc-700"
                      }`}
                    >
                      <input type="radio" name={`q${i}`} checked={chosen} disabled={show} onChange={() => setPicked((p) => ({ ...p, [i]: j }))} className="size-4 accent-emerald-700" />
                      {opt}
                      {show && right && <span className="ml-auto text-xs font-semibold text-emerald-800 dark:text-emerald-300">Correct answer</span>}
                    </label>
                  );
                })}
              </div>
              {picked[i] !== undefined && <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{q.explanation}</p>}
            </fieldset>
          </li>
        ))}
      </ol>
      {answered === quiz.length && (
        <p role="status" className="mt-4 font-medium">
          You got {score} of {quiz.length}.
        </p>
      )}
    </section>
  );
}
