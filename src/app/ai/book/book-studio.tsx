"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/art/icons";
import { aiPost } from "@/components/ai/ai-client";
import { AiGate, useAiAccess } from "@/components/ai/ai-gate";
import { AiWorking } from "@/components/ai/ai-working";
import { primaryButton, secondaryButton } from "@/components/ui";
import { type Book, buildBook, pickExcerpts } from "@/lib/book/chunk";
import { MAX_FILE_MB, readBookFile } from "@/lib/book/read-file";
import { type BookQuestion, type BookTest, bookReport, DIFFICULTY_LABEL, type Difficulty, formatSeconds, pageList } from "@/lib/book/report";
import { addBookTest, deleteBookTest, finishBookTest, retakeBookTest, useBookTests } from "@/lib/browser/book-store";
import { todayInIST } from "@/lib/dates";

const COUNTS = [5, 10, 15, 20, 25];
const MINUTES = [5, 10, 15, 20, 30, 45, 60];

type View = { kind: "home" } | { kind: "setup"; book: Book } | { kind: "test"; id: string } | { kind: "report"; id: string };

/** MB-1 to MB-4: upload a book, get a timed MCQ test written from it, and a grounded report. */
export function BookStudio({ aiOn }: { aiOn: boolean }) {
  const access = useAiAccess(aiOn);
  const tests = useBookTests();
  const [view, setView] = useState<View>({ kind: "home" });
  const top = useRef<HTMLDivElement>(null);

  const go = (v: View) => {
    setView(v);
    requestAnimationFrame(() => top.current?.scrollIntoView({ block: "start" }));
  };
  const current = view.kind === "test" || view.kind === "report" ? tests.find((t) => t.id === view.id) : undefined;

  return (
    <div ref={top} className="scroll-mt-20">
      {view.kind === "home" && <Home tests={tests} onBook={(book) => go({ kind: "setup", book })} onOpen={(t) => go(t.result ? { kind: "report", id: t.id } : { kind: "test", id: t.id })} />}
      {view.kind === "setup" && <Setup book={view.book} access={access} onBack={() => go({ kind: "home" })} onReady={(id) => go({ kind: "test", id })} />}
      {view.kind === "test" && current && <TakeTest key={current.id} test={current} onDone={() => go({ kind: "report", id: current.id })} />}
      {view.kind === "report" && current?.result && (
        <Report
          test={current}
          onRetake={() => {
            retakeBookTest(current.id);
            go({ kind: "test", id: current.id });
          }}
          onHome={() => go({ kind: "home" })}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------------ home --

function Home({ tests, onBook, onOpen }: { tests: BookTest[]; onBook: (b: Book) => void; onOpen: (t: BookTest) => void }) {
  const inputId = useId();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setBusy("Opening your book…");
    try {
      const read = await readBookFile(file, (done, total) => setBusy(`Reading page ${done} of ${total}…`));
      const book = buildBook(read.title, read.pages, read.outline);
      if (book.chunks.length < 3) throw new Error("We could not find enough text in that file. If it is a scanned book, the pages are pictures: try a PDF with selectable text.");
      onBook(book);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That file could not be opened.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="upload-h" className="rounded-3xl border-2 border-dashed border-teal-300 bg-teal-50/60 p-6 text-center dark:border-teal-800 dark:bg-teal-950/20">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-violet-500 text-white">
          <Icon name="book" size={28} />
        </span>
        <h2 id="upload-h" className="mt-3 text-xl font-semibold">
          Choose your book
        </h2>
        <p className="mx-auto mt-1 max-w-md leading-7 text-zinc-700 dark:text-zinc-300">
          A PDF with selectable text, or a .txt or .md file, up to {MAX_FILE_MB} MB. It is read in your browser and never uploaded.
        </p>
        <label htmlFor={inputId} className={`${primaryButton} mt-4 cursor-pointer`}>
          <Icon name="book" size={18} /> {busy ? "Reading…" : "Choose a file"}
        </label>
        <input
          id={inputId}
          type="file"
          accept=".pdf,application/pdf,.txt,.md,text/plain,text/markdown"
          className="sr-only"
          disabled={busy !== null}
          onChange={(e) => {
            void pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {busy && (
          <p role="status" className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
            {busy}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-rose-800 dark:text-rose-300">
            {error}
          </p>
        )}
      </section>

      {tests.length > 0 && (
        <section aria-labelledby="tests-h">
          <h2 id="tests-h" className="text-xl font-semibold">
            Your tests on this device
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {tests.map((t) => {
              const r = t.result ? bookReport(t, t.result.answers, t.result.seconds) : null;
              return (
                <li key={t.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{t.book}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {t.questions.length} questions · {DIFFICULTY_LABEL[t.difficulty]} · {t.minutes} min · {t.createdOn}
                      {r ? ` · scored ${r.percent}%` : " · not taken yet"}
                    </p>
                  </div>
                  <button type="button" className={secondaryButton} onClick={() => onOpen(t)} aria-label={`${r ? "See the report" : "Take the test"}: ${t.book}, ${t.createdOn}`}>
                    {r ? "See the report" : "Take the test"}
                  </button>
                  <button type="button" className="min-h-11 rounded-lg px-3 text-sm text-zinc-600 underline underline-offset-2 dark:text-zinc-400" onClick={() => deleteBookTest(t.id)} aria-label={`Delete the test on ${t.book}, ${t.createdOn}`}>
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

// ----------------------------------------------------------------- setup --

function Setup({ book, access, onBack, onReady }: { book: Book; access: ReturnType<typeof useAiAccess>; onBack: () => void; onReady: (id: string) => void }) {
  const [chosen, setChosen] = useState<string[]>(book.sections);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [count, setCount] = useState(10);
  const [minutes, setMinutes] = useState(15);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toggle = (s: string) => setChosen((c) => (c.includes(s) ? c.filter((x) => x !== s) : book.sections.filter((x) => x === s || c.includes(x))));

  const generate = async () => {
    const excerpts = pickExcerpts(book, chosen, count);
    if (excerpts.length === 0) return setError("Choose at least one chapter.");
    setBusy(true);
    setError(null);
    const res = await aiPost<{ questions: BookQuestion[] }>("/api/ai/book", { book: book.title.slice(0, 160), difficulty, count, excerpts: excerpts.map((e) => ({ ...e, text: e.text.slice(0, 2000) })) });
    setBusy(false);
    if (!res.ok) return setError(res.message);
    onReady(addBookTest({ createdOn: todayInIST(), book: book.title, difficulty, minutes, questions: res.data.questions }));
  };

  return (
    <div className="flex flex-col gap-6">
      <button type="button" onClick={onBack} className="self-start text-sm underline underline-offset-2">
        ← Choose another book
      </button>
      <section aria-labelledby="book-h" className="rounded-2xl bg-zinc-100 p-5 dark:bg-zinc-900">
        <h2 id="book-h" className="text-xl font-semibold">
          {book.title}
        </h2>
        <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
          {book.pages} pages · {book.sections.length} {book.sections.length === 1 ? "section" : "sections"} · {book.chunks.length} passages with enough text to ask about
        </p>
      </section>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-lg font-semibold">Which chapters?</legend>
        <div className="flex gap-3 text-sm">
          <button type="button" className="underline underline-offset-2" onClick={() => setChosen(book.sections)}>
            All
          </button>
          <button type="button" className="underline underline-offset-2" onClick={() => setChosen([])}>
            None
          </button>
          <span className="text-zinc-600 dark:text-zinc-400">{chosen.length} chosen</span>
        </div>
        <ul className="grid max-h-72 gap-1 overflow-y-auto rounded-xl border border-zinc-200 p-2 sm:grid-cols-2 dark:border-zinc-800">
          {book.sections.map((s) => (
            <li key={s}>
              <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                <input type="checkbox" checked={chosen.includes(s)} onChange={() => toggle(s)} className="size-5 accent-teal-700" />
                <span className="min-w-0 truncate">{s}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="text-lg font-semibold">How hard?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((d) => (
            <label key={d} className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border px-3 ${difficulty === d ? "border-teal-600 bg-teal-50 dark:bg-teal-950/40" : "border-zinc-300 dark:border-zinc-700"}`}>
              <input type="radio" name="difficulty" value={d} checked={difficulty === d} onChange={() => setDifficulty(d)} className="size-5 accent-teal-700" />
              {DIFFICULTY_LABEL[d]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-lg font-semibold">Number of questions</span>
          <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="min-h-12 rounded-xl border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-900">
            {COUNTS.map((n) => (
              <option key={n} value={n}>
                {n} questions
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-lg font-semibold">Time allowed</span>
          <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="min-h-12 rounded-xl border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-900">
            {MINUTES.map((n) => (
              <option key={n} value={n}>
                {n} minutes
              </option>
            ))}
          </select>
        </label>
      </div>

      <AiGate access={access} next="/ai/book">
        {busy ? (
          <AiWorking steps={["Reading the passages you chose", `Writing ${count} questions`, "Checking every answer against your book"]} />
        ) : (
          <button type="button" onClick={() => void generate()} disabled={chosen.length === 0} className={`${primaryButton} self-start disabled:opacity-50`}>
            <Icon name="sparkles" size={18} /> Write my test
          </button>
        )}
        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
          Only short passages from the chapters you chose are sent to Claude, Anthropic&apos;s AI model, to write the questions. We keep no copy of your book. 5 tests a day.
        </p>
        {error && (
          <p role="alert" className="mt-2 text-sm text-rose-800 dark:text-rose-300">
            {error}
          </p>
        )}
      </AiGate>
    </div>
  );
}

// ------------------------------------------------------------------ test --

function TakeTest({ test, onDone }: { test: BookTest; onDone: () => void }) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => test.questions.map(() => null));
  const [i, setI] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [confirm, setConfirm] = useState(false);
  const finished = useRef(false);
  const limit = test.minutes * 60;
  const used = Math.min(limit, Math.floor((now - startedAt) / 1000));
  const left = limit - used;
  const q = test.questions[i];
  const unanswered = answers.filter((a) => a === null).length;

  const finish = (final = answers) => {
    if (finished.current) return;
    finished.current = true;
    finishBookTest(test.id, { answers: final, seconds: Math.min(limit, Math.floor((Date.now() - startedAt) / 1000)), finishedOn: todayInIST() });
    onDone();
  };

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (left <= 0) finish();
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="sticky top-14 z-10 -mx-4 flex items-center justify-between gap-3 border-b border-zinc-200 bg-white/90 px-4 py-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <p className="text-sm font-medium">
          Question {i + 1} of {test.questions.length}
        </p>
        <p role="timer" aria-label="Time left" className={`font-mono text-lg font-semibold tabular-nums ${left <= 60 ? "text-rose-700 dark:text-rose-400" : ""}`}>
          {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
        </p>
      </div>
      {left === 60 && (
        <p role="status" className="sr-only">
          One minute left.
        </p>
      )}

      <fieldset className="flex flex-col gap-3">
        <legend className="text-xl leading-snug font-semibold">
          <span className="mb-1 block text-sm font-normal text-teal-800 dark:text-teal-300">{q.section}</span>
          {q.question}
        </legend>
        {q.options.map((o, k) => (
          <label key={k} className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border p-3 ${answers[i] === k ? "border-teal-600 bg-teal-50 dark:bg-teal-950/40" : "border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"}`}>
            <input type="radio" name={`q-${q.id}`} checked={answers[i] === k} onChange={() => setAnswers((a) => a.map((x, j) => (j === i ? k : x)))} className="mt-0.5 size-5 shrink-0 accent-teal-700" />
            <span>{o}</span>
          </label>
        ))}
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={secondaryButton} disabled={i === 0} onClick={() => setI(i - 1)}>
          Previous
        </button>
        {i < test.questions.length - 1 ? (
          <button type="button" className={primaryButton} onClick={() => setI(i + 1)}>
            Next question
          </button>
        ) : (
          <button type="button" className={primaryButton} onClick={() => (unanswered ? setConfirm(true) : finish())}>
            Finish the test
          </button>
        )}
      </div>

      <nav aria-label="Questions" className="flex flex-wrap gap-1.5">
        {test.questions.map((x, k) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setI(k)}
            aria-label={`Question ${k + 1}, ${answers[k] === null ? "not answered" : "answered"}`}
            aria-current={k === i ? "step" : undefined}
            className={`grid size-10 place-items-center rounded-lg border text-sm font-medium ${k === i ? "border-zinc-900 dark:border-white" : "border-zinc-300 dark:border-zinc-700"} ${answers[k] !== null ? "bg-teal-700 text-white" : ""}`}
          >
            {k + 1}
          </button>
        ))}
      </nav>

      <div className="flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        {confirm ? (
          <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
            <p>
              {unanswered} {unanswered === 1 ? "question is" : "questions are"} not answered yet. Finish anyway?
            </p>
            <div className="mt-3 flex gap-2">
              <button type="button" className={primaryButton} onClick={() => finish()}>
                Yes, finish
              </button>
              <button type="button" className={secondaryButton} onClick={() => setConfirm(false)}>
                Keep going
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="self-start text-sm underline underline-offset-2" onClick={() => (unanswered ? setConfirm(true) : finish())}>
            Finish early and see my report
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- report --

function Report({ test, onRetake, onHome }: { test: BookTest; onRetake: () => void; onHome: () => void }) {
  const result = test.result!;
  const r = bookReport(test, result.answers, result.seconds);
  const [pdf, setPdf] = useState<"idle" | "busy" | "error">("idle");
  const tone = r.percent >= 80 ? "bg-emerald-600" : r.percent >= 60 ? "bg-amber-500" : "bg-rose-600";

  const download = async () => {
    setPdf("busy");
    try {
      const { downloadReportPdf } = await import("@/lib/book/pdf-report");
      await downloadReportPdf(test, r);
      setPdf("idle");
    } catch {
      setPdf("error");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="score-h" className="rounded-3xl bg-zinc-100 p-5 md:p-6 dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {test.book} · {DIFFICULTY_LABEL[test.difficulty]}
        </p>
        <h2 id="score-h" className="mt-1 text-3xl font-semibold">
          {r.right} of {r.total} right ({r.percent}%)
        </h2>
        <div role="meter" aria-label="Score" aria-valuemin={0} aria-valuemax={100} aria-valuenow={r.percent} className="mt-3 h-3 overflow-hidden rounded-full bg-zinc-300 dark:bg-zinc-700">
          <div className={`h-full rounded-full ${tone}`} style={{ width: `${r.percent}%` }} />
        </div>
        <p className="mt-3 leading-7">{r.verdict}</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Answered {r.answered} of {r.total} in {formatSeconds(r.seconds)} of {test.minutes} minutes.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className={primaryButton} onClick={() => void download()} disabled={pdf === "busy"}>
            <Icon name="book" size={18} /> {pdf === "busy" ? "Making the PDF…" : "Download the report (PDF)"}
          </button>
          <button type="button" className={secondaryButton} onClick={onRetake}>
            Take it again
          </button>
          <button type="button" className={secondaryButton} onClick={onHome}>
            New test
          </button>
        </div>
        {pdf === "error" && (
          <p role="alert" className="mt-2 text-sm text-rose-800 dark:text-rose-300">
            The PDF could not be made. Use your browser&apos;s Print and choose &ldquo;Save as PDF&rdquo; instead.
          </p>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section aria-labelledby="strong-h" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
          <h3 id="strong-h" className="flex items-center gap-2 text-lg font-semibold text-emerald-900 dark:text-emerald-200">
            <Icon name="trophy" size={18} /> Where you are strong
          </h3>
          {r.strong.length ? (
            <ul className="mt-2 flex flex-col gap-1">
              {r.strong.map((t) => (
                <li key={t.section}>
                  <span className="font-medium">{t.section}</span>: {t.right} of {t.total} right
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2">No section scored 80% or more yet. Keep going.</p>
          )}
        </section>
        <section aria-labelledby="focus-h" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-900 dark:bg-rose-950/30">
          <h3 id="focus-h" className="flex items-center gap-2 text-lg font-semibold text-rose-900 dark:text-rose-200">
            <Icon name="target" size={18} /> Focus on these next
          </h3>
          {r.focus.length ? (
            <ul className="mt-2 flex flex-col gap-1">
              {r.focus.map((t) => (
                <li key={t.section}>
                  <span className="font-medium">{t.section}</span>: {t.right} of {t.total} right. Reread {pageList(t.pages)}.
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2">No section scored under 60%. Well done.</p>
          )}
        </section>
      </div>

      <section aria-labelledby="sections-h">
        <h3 id="sections-h" className="text-lg font-semibold">
          Section by section
        </h3>
        <ul className="mt-3 flex flex-col gap-3">
          {r.topics.map((t) => (
            <li key={t.section}>
              <div className="flex justify-between gap-3 text-sm">
                <span className="min-w-0 font-medium">{t.section}</span>
                <span className="shrink-0">
                  {t.right} of {t.total}
                </span>
              </div>
              <div role="meter" aria-label={`${t.section} score`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={t.percent} className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div className={`h-full rounded-full ${t.percent >= 80 ? "bg-emerald-600" : t.percent >= 60 ? "bg-amber-500" : "bg-rose-600"}`} style={{ width: `${t.percent}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="review-h">
        <h3 id="review-h" className="text-lg font-semibold">
          Every question, with the answer from your book
        </h3>
        <ol className="mt-3 flex flex-col gap-4">
          {test.questions.map((q, k) => {
            const mine = result.answers[k];
            const ok = mine === q.answer;
            return (
              <li key={q.id} className={`rounded-2xl border p-4 ${ok ? "border-emerald-300 dark:border-emerald-800" : "border-rose-300 dark:border-rose-800"}`}>
                <p className={`text-sm font-semibold ${ok ? "text-emerald-800 dark:text-emerald-300" : "text-rose-800 dark:text-rose-300"}`}>
                  {k + 1}. {ok ? "Right" : mine === null ? "Not answered" : "Not quite"}
                </p>
                <p className="mt-1 font-medium">{q.question}</p>
                {!ok && mine !== null && <p className="mt-2 text-sm">Your answer: {q.options[mine]}</p>}
                <p className="mt-1 text-sm">
                  <span className="font-semibold">Correct answer:</span> {q.options[q.answer]}
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">{q.explanation}</p>
                <figure className="mt-3 rounded-xl border-l-4 border-teal-600 bg-teal-50 p-3 dark:bg-teal-950/30">
                  <blockquote className="text-sm leading-6 italic">“{q.quote}”</blockquote>
                  <figcaption className="mt-1 text-xs font-medium text-teal-900 dark:text-teal-200">
                    From your book: {q.section}, page {q.page}
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
