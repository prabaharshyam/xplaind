"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/art/icons";
import { aiPost } from "@/components/ai/ai-client";
import { AiGate, type useAiAccess } from "@/components/ai/ai-gate";
import { primaryButton, secondaryButton } from "@/components/ui";
import type { BookAnswer } from "@/lib/ai/features";
import { type Book, buildBook, pickExcerpts } from "@/lib/book/chunk";
import { relevantExcerpts, retestCount, retestSections } from "@/lib/book/loop";
import { readBookFile } from "@/lib/book/read-file";
import type { BookQuestion, BookTest } from "@/lib/book/report";
import { addBookTest } from "@/lib/browser/book-store";
import { todayInIST } from "@/lib/dates";

type Access = ReturnType<typeof useAiAccess>;
const toExcerpt = (e: { id: string; page: number; section: string; text: string }) => ({ id: e.id, page: e.page, section: e.section.slice(0, 160), text: e.text.slice(0, 2000) });

// --------------------------------------------------------- ask your notes --

type Turn = { role: "user"; text: string } | { role: "assistant"; text: string; answer: BookAnswer };

/**
 * MB-8: ask a question and get an answer only from your own file, with the page it came from.
 * The matching passages are picked here in the browser; only those few are sent. Nothing is saved.
 */
export function AskNotes({ book, access }: { book: Book; access: Access }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    setDraft("");
    setError(null);
    setBusy(true);
    const history = turns.slice(-6).map((t) => ({ role: t.role, text: t.text.slice(0, 1500) }));
    setTurns((t) => [...t, { role: "user", text: q }]);
    // A follow-up such as "and the second one?" is matched with the previous question too.
    const lastUser = [...turns].reverse().find((t) => t.role === "user")?.text ?? "";
    const excerpts = relevantExcerpts(book, q.split(/\s+/).length < 6 ? `${q} ${lastUser}` : q);
    const res = await aiPost<BookAnswer>("/api/ai/book-ask", { book: book.title.slice(0, 160), question: q.slice(0, 500), turns: history, excerpts: excerpts.map(toExcerpt) });
    setBusy(false);
    if (!res.ok) {
      setTurns((t) => t.slice(0, -1));
      setDraft(q);
      return setError(res.message);
    }
    setTurns((t) => [...t, { role: "assistant", text: res.data.answer, answer: res.data }]);
  };

  const last = [...turns].reverse().find((t): t is Extract<Turn, { role: "assistant" }> => t.role === "assistant");
  const suggestions = last?.answer.followUps.length ? last.answer.followUps : turns.length === 0 ? [`What are the main ideas in ${book.sections[0] ?? "the first chapter"}?`, "Explain the hardest idea in simple words"] : [];

  return (
    <section aria-labelledby="ask-h" className="flex flex-col gap-4">
      <div>
        <h3 id="ask-h" className="text-lg font-semibold">
          Ask your notes
        </h3>
        <p className="mt-1 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          Answers come only from your file, with the page to look at. If the answer is not in your notes, it says so instead of guessing.
        </p>
      </div>

      {turns.length > 0 && (
        <ol className="flex flex-col gap-3" aria-live="polite">
          {turns.map((t, k) =>
            t.role === "user" ? (
              <li key={k} className="max-w-[85%] self-end rounded-2xl bg-violet-700 px-4 py-2.5 text-white">
                <span className="sr-only">You asked: </span>
                {t.text}
              </li>
            ) : (
              <li key={k} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs font-semibold tracking-wide text-teal-800 uppercase dark:text-teal-300">{t.answer.found ? "From your notes" : "Not in your notes"}</p>
                <div className="mt-1 leading-7 whitespace-pre-line">{t.text}</div>
                {t.answer.citations.map((c, j) => (
                  <figure key={j} className="mt-3 rounded-2xl border-l-4 border-teal-600 bg-teal-50 p-3 dark:bg-teal-950/30">
                    <blockquote className="text-sm leading-6 italic">“{c.quote}”</blockquote>
                    <figcaption className="mt-1 text-xs font-medium text-teal-900 dark:text-teal-200">
                      {c.section}, page {c.page}
                    </figcaption>
                  </figure>
                ))}
              </li>
            ),
          )}
          {busy && (
            <li role="status" className="text-sm text-zinc-600 dark:text-zinc-400">
              Looking through your notes…
            </li>
          )}
        </ol>
      )}

      <AiGate access={access} next="/ai/book" kind="notes" label="questions about your notes">
        {suggestions.length > 0 && !busy && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button key={s} type="button" onClick={() => void ask(s)} className="min-h-11 rounded-2xl border border-zinc-300 px-3 text-left text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900">
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void ask(draft);
          }}
        >
          <label htmlFor={inputId} className="sr-only">
            Your question about {book.title}
          </label>
          <input
            id={inputId}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={500}
            placeholder="Ask a question about your notes"
            className="min-h-12 min-w-0 flex-1 rounded-2xl border border-zinc-300 bg-white px-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button type="submit" disabled={busy || draft.trim().length < 2} className={`${primaryButton} disabled:opacity-50`}>
            Ask
          </button>
        </form>
        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
          Only the few passages that match your question are sent to Claude, Anthropic&apos;s AI model. Nothing you ask is saved.
        </p>
        {error && (
          <p role="alert" className="mt-2 text-sm text-rose-800 dark:text-rose-300">
            {error}
          </p>
        )}
      </AiGate>
    </section>
  );
}

// ---------------------------------------------------------------- retest --

/** The same file again, matched by title, so a retest can be written from it. */
export function ReopenFile({ title, onBook }: { title: string; onBook: (b: Book) => void }) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm leading-6">
        Your file is not kept, so open <span className="font-semibold">{title}</span> again. It is read on this device, as before.
      </p>
      <label htmlFor={id} className={`${secondaryButton} cursor-pointer self-start`}>
        <Icon name="book" size={18} /> {busy ? "Reading…" : "Open the file again"}
      </label>
      <input
        id={id}
        type="file"
        accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt,.md,text/plain,text/markdown"
        className="sr-only"
        disabled={busy}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          setError(null);
          try {
            const read = await readBookFile(file);
            const book = buildBook(read.title, read.pages, read.outline);
            if (book.chunks.length < 3) throw new Error("We could not find enough text in that file.");
            onBook(book);
          } catch (err) {
            setError(err instanceof Error ? err.message : "That file could not be opened.");
          } finally {
            setBusy(false);
          }
        }}
      />
      {error && (
        <p role="alert" className="text-sm text-rose-800 dark:text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * MB-9: "Test me on what I missed". A new test from only the sections the learner scored low on,
 * at the same level and pace, written from fresh passages of those sections.
 */
export function RetestPanel({ test, book, access, onBook, onReady }: { test: BookTest; book: Book | null; access: Access; onBook: (b: Book) => void; onReady: (id: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const answers = test.result!.answers;
  const sections = retestSections(test, answers);
  const count = retestCount(test, answers);
  if (sections.length === 0) return null;
  const sameBook = book !== null && book.title === test.book;
  const inBook = sameBook ? sections.filter((s) => book.sections.includes(s)) : [];

  const write = async () => {
    if (!book) return;
    const excerpts = pickExcerpts(book, inBook, count);
    if (excerpts.length === 0) return setError("Those chapters were not found in this file. Is it the same file as before?");
    setBusy(true);
    setError(null);
    const res = await aiPost<{ questions: BookQuestion[] }>("/api/ai/book", { book: book.title.slice(0, 160), difficulty: test.difficulty, count, excerpts: excerpts.map(toExcerpt) });
    setBusy(false);
    if (!res.ok) return setError(res.message);
    onReady(addBookTest({ createdOn: todayInIST(), book: book.title, difficulty: test.difficulty, minutes: Math.max(5, Math.min(60, Math.round((test.minutes * count) / test.questions.length))), questions: res.data.questions, retest: true }));
  };

  return (
    <section aria-labelledby="retest-h" className="rounded-2xl border border-violet-200 bg-violet-50 p-5 dark:border-violet-900 dark:bg-violet-950/30">
      <h3 id="retest-h" className="flex items-center gap-2 text-lg font-semibold">
        <Icon name="target" size={18} /> Test me on what I missed
      </h3>
      <p className="mt-1 leading-7">
        {count} new questions on {sections.length === 1 ? "the section" : `the ${sections.length} sections`} you found hardest: {sections.join(", ")}. New passages, so you are not just remembering the
        last answers.
      </p>
      <div className="mt-3">
        {!sameBook ? (
          <>
            {book && (
              <p role="alert" className="mb-2 text-sm text-amber-900 dark:text-amber-200">
                The file open now is &ldquo;{book.title}&rdquo;, not the one this test came from.
              </p>
            )}
            <ReopenFile title={test.book} onBook={onBook} />
          </>
        ) : (
          <AiGate access={access} next="/ai/book" kind="book" label="tests or card decks">
            {busy ? (
              <p role="status" className="text-sm">
                Writing {count} questions on what you missed…
              </p>
            ) : (
              <button type="button" className={primaryButton} onClick={() => void write()}>
                <Icon name="sparkles" size={18} /> Write my retest
              </button>
            )}
          </AiGate>
        )}
        {error && (
          <p role="alert" className="mt-2 text-sm text-rose-800 dark:text-rose-300">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
