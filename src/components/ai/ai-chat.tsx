"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/art/icons";
import { aiPost } from "./ai-client";
import { AiText } from "./ai-text";

type Turn = { role: "user" | "assistant"; text: string; lessons?: { id: string; title: string }[] };
type Reply = { reply: string; follow_ups: string[]; lessons: { id: string; title: string }[] };

/**
 * A chat with one of the AI helpers. The conversation lives in this component
 * only: nothing is saved, on the device or on the server.
 */
export function AiChat({
  endpoint,
  extra,
  greeting,
  starters,
  placeholder = "Ask anything about this",
  compact = false,
  initialDraft = "",
}: {
  endpoint: string;
  /** Sent with every request, for example the lesson id. */
  extra: Record<string, unknown>;
  greeting: string;
  starters: string[];
  placeholder?: string;
  compact?: boolean;
  /** APP-3: a question brought from the app Home's "Ask anything" box. Typed in, not sent: the learner sends it. */
  initialDraft?: string;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState(initialDraft.slice(0, 1000));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState<string[]>(starters);
  const log = useRef<HTMLDivElement>(null);

  // Keep the newest message in view by scrolling the chat's own list, never the page: a lesson
  // that opened with the page pulled down to its tutor (NV-4).
  useEffect(() => {
    const el = log.current;
    if (el && (turns.length > 0 || busy)) el.scrollTop = el.scrollHeight;
  }, [turns, busy]);

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || busy) return;
    const next = [...turns, { role: "user" as const, text: clean.slice(0, 1500) }];
    setTurns(next);
    setDraft("");
    setBusy(true);
    setError(null);
    const res = await aiPost<Reply>(endpoint, { ...extra, turns: next.map(({ role, text: t }) => ({ role, text: t })) });
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      setTurns(turns);
      setDraft(clean);
      return;
    }
    setTurns([...next, { role: "assistant", text: res.data.reply, lessons: res.data.lessons }]);
    setFollowUps(res.data.follow_ups);
  };

  return (
    <div className="flex flex-col">
      <div ref={log} className={`space-y-4 overflow-y-auto ${compact ? "max-h-[26rem]" : "max-h-[36rem]"} pr-1`} aria-live="polite">
        <Bubble role="assistant" text={greeting} typed />
        {turns.map((t, i) => (
          <Bubble key={i} role={t.role} text={t.text} lessons={t.lessons} />
        ))}
        {busy && (
          <p className="flex items-center gap-2 text-sm text-zinc-600 italic dark:text-zinc-400" role="status">
            {/* APP-2: three dots that bounce in turn while the answer is written. */}
            <span aria-hidden="true" className="flex gap-1">
              {[0, 1, 2].map((k) => (
                <span key={k} className="size-1.5 rounded-full bg-zinc-400 motion-safe:animate-bounce" style={{ animationDelay: `${k * 150}ms` }} />
              ))}
            </span>
            Thinking…
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-2xl bg-rose-50 p-3 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </p>
      )}
      {!busy && followUps.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Suggested questions">
          {followUps.map((f) => (
            <button key={f} type="button" onClick={() => void send(f)} className="rounded-full border border-brand-300 bg-white px-3 py-1.5 text-left text-sm hover:bg-brand-50 dark:border-brand-800 dark:bg-zinc-900 dark:hover:bg-brand-950">
              {f}
            </button>
          ))}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
        className="mt-3 flex gap-2"
      >
        <label className="min-w-0 flex-1">
          <span className="sr-only">Your message</span>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(draft);
              }
            }}
            rows={2}
            maxLength={1500}
            placeholder={placeholder}
            className="w-full resize-none rounded-2xl border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          />
        </label>
        <button type="submit" disabled={busy || !draft.trim()} className="min-h-12 self-end rounded-2xl bg-brand-700 px-4 font-medium text-white hover:bg-brand-800 disabled:opacity-50">
          Send
        </button>
      </form>
      <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">AI can be wrong. This chat is not saved; it is sent to Anthropic only to write the answer.</p>
    </div>
  );
}

/**
 * APP-2: the greeting types itself out once (about 30 ms a letter), with a caret, as StudyFetch's tutor does. Screen
 * readers get the whole sentence at once; under reduced motion it simply appears.
 */
function Typed({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      queueMicrotask(() => setN(text.length));
      return;
    }
    const id = setInterval(() => setN((k) => (k >= text.length ? (clearInterval(id), k) : k + 1)), 30);
    return () => clearInterval(id);
  }, [text]);
  const done = n >= text.length;
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.slice(0, n)}
        {!done && <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-current motion-safe:animate-pulse" />}
      </span>
    </>
  );
}

function Bubble({ role, text, lessons, typed = false }: Turn & { typed?: boolean }) {
  const mine = role === "user";
  return (
    <div className={`flex gap-2 ${mine ? "justify-end" : ""}`}>
      {!mine && (
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" aria-hidden="true">
          <Icon name="chat" size={15} />
        </span>
      )}
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${mine ? "bg-zinc-900 text-white dark:bg-white dark:text-black" : "bg-zinc-100 dark:bg-zinc-800"}`}>
        <p className="sr-only">{mine ? "You said:" : "AI said:"}</p>
        {mine ? <p className="whitespace-pre-wrap">{text}</p> : typed ? <p className="leading-7">{<Typed text={text} />}</p> : <AiText text={text} />}
        {lessons && lessons.length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-zinc-300 pt-2 text-sm dark:border-zinc-700">
            {lessons.map((l) => (
              <li key={l.id}>
                <Link href={`/stop/${l.id}`} className="font-medium text-brand-800 underline underline-offset-2 dark:text-brand-300">
                  Lesson: {l.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
