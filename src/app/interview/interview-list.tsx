"use client";

import Link from "next/link";
import { useState } from "react";
import { muted } from "@/components/ui";
import { usePractice } from "@/lib/browser/hooks";
import { INTERVIEW_TOPICS, interviewTopicLabel } from "@/lib/interview-topics";
import type { InterviewView } from "@/lib/interview/types";
import { LEVEL_IDS } from "@/lib/levels";
import { RATINGS } from "@/lib/practice/queue";

const select =
  "min-h-12 rounded-lg border border-zinc-400 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950";

/** IQ-3: browse and filter by topic and level. */
export function InterviewList({
  questions,
  paths,
  initialPath = "all",
}: {
  questions: InterviewView[];
  /** Offer a path filter when given. */
  paths?: { id: string; name: string }[];
  initialPath?: string;
}) {
  const [topic, setTopic] = useState("all");
  const [level, setLevel] = useState("all");
  const [path, setPath] = useState(initialPath);
  const practice = usePractice();
  const shown = questions.filter(
    (q) =>
      (topic === "all" || q.topic === topic) &&
      (level === "all" || q.level === level) &&
      (path === "all" || q.paths.includes(path)),
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {paths && (
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-sm font-medium">Path</span>
            <select className={select} value={path} onChange={(e) => setPath(e.target.value)}>
              <option value="all">Every path</option>
              {paths.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Topic</span>
          <select className={select} value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="all">All topics</option>
            {INTERVIEW_TOPICS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Level</span>
          <select className={select} value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="all">All levels</option>
            {LEVEL_IDS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className={`text-sm ${muted}`} aria-live="polite">
        {shown.length} {shown.length === 1 ? "question" : "questions"}
      </p>
      <ul className="flex flex-col gap-2">
        {shown.map((q) => {
          const rating = practice.ratings[q.id];
          return (
            <li key={q.id}>
              <Link
                href={`/interview/${q.id}`}
                className="block rounded-lg border border-zinc-200 p-3 hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 dark:border-zinc-800 dark:hover:border-zinc-600"
              >
                <span className="block font-medium">{q.question}</span>
                <span className={`mt-1 block text-sm ${muted}`}>
                  {interviewTopicLabel(q.topic)} · {q.level}
                  {rating ? ` · You said: ${RATINGS.find((r) => r.value === rating.rating)!.label.toLowerCase()}` : ""}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
