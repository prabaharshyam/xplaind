"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { secondaryButton, textLink } from "@/components/ui";

type Q = {
  id: string;
  question: string;
  short: string;
  deeper: string;
  followUps: string[];
  mistakes: string[];
  level: string;
  topic: string;
  roles: string[];
};

/** IQ-9: a role filter (every role listed), a search box, and the full answers below. */
export function AnswersBrowser({ roles, questions }: { roles: { id: string; name: string }[]; questions: Q[] }) {
  const [role, setRole] = useState(roles[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [deep, setDeep] = useState(true);
  const ids = { role: useId(), search: useId() };

  const shown = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return questions.filter(
      (q) =>
        (!role || q.roles.includes(role)) &&
        words.every((w) => `${q.question} ${q.short} ${q.topic}`.toLowerCase().includes(w)),
    );
  }, [questions, role, query]);
  const roleName = roles.find((r) => r.id === role)?.name ?? "All roles";

  return (
    <div>
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-end print:hidden dark:border-zinc-800 dark:bg-zinc-950/60">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor={ids.role} className="font-medium">
            Role
          </label>
          <select id={ids.role} value={role} onChange={(e) => setRole(e.target.value)} className="min-h-12 rounded-2xl border border-zinc-400 bg-white px-3 dark:border-zinc-600 dark:bg-zinc-950">
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
            <option value="">All roles</option>
          </select>
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor={ids.search} className="font-medium">
            Search
          </label>
          <input
            id={ids.search}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="RAG, embeddings, metrics…"
            className="min-h-12 rounded-2xl border border-zinc-400 bg-white px-3 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div className="flex gap-2">
          <button type="button" className={secondaryButton} onClick={() => setDeep(!deep)} aria-pressed={!deep}>
            {deep ? "Short answers only" : "Show deeper answers"}
          </button>
          <button type="button" className={secondaryButton} onClick={() => window.print()}>
            Print
          </button>
        </div>
      </div>

      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400" role="status">
        {shown.length} {shown.length === 1 ? "question" : "questions"} for {roleName}
      </p>

      <ol className="mt-3 flex flex-col gap-4">
        {shown.map((q, i) => (
          <li key={q.id} className="break-inside-avoid rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-xs font-semibold text-violet-800 dark:text-violet-300">
              {q.topic} · {q.level}
            </p>
            <h2 className="mt-1 text-lg leading-snug font-semibold">
              {i + 1}. {q.question}
            </h2>
            <p className="mt-3 rounded-2xl bg-violet-50 p-3 leading-7 dark:bg-violet-950/40">
              <span className="font-semibold">Short answer: </span>
              {q.short}
            </p>
            {deep && (
              <>
                {q.deeper.split(/\n\s*\n/).map((para, j) => (
                  <p key={j} className="mt-3 leading-7">
                    {para}
                  </p>
                ))}
                <p className="mt-3 font-medium">Follow-ups to expect</p>
                <ul className="mt-1 list-disc pl-6 leading-7">
                  {q.followUps.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                {q.mistakes.length > 0 && (
                  <>
                    <p className="mt-3 font-medium">Common mistakes</p>
                    <ul className="mt-1 list-disc pl-6 leading-7">
                      {q.mistakes.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
            <p className="mt-3 text-sm print:hidden">
              <Link href={`/interview/${q.id}`} className={textLink}>
                Open this question<span className="sr-only">: {q.question}</span>
              </Link>
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
