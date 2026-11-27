"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { Flashcard } from "@/components/interview/flashcard";
import { ContentGate } from "@/components/account/content-gate";
import { muted, primaryButtonSm, secondaryButtonSm, textLink } from "@/components/ui";
import { usePractice, useToday } from "@/lib/browser/hooks";
import { rate } from "@/lib/browser/practice-store";
import { todayInIST } from "@/lib/dates";
import { INTERVIEW_TOPICS, interviewTopicLabel } from "@/lib/interview-topics";
import type { InterviewView } from "@/lib/interview/types";
import { LEVEL_IDS, levelText } from "@/lib/levels";
import { RATINGS, practiceOrder, type Rating } from "@/lib/practice/queue";

const field = "min-h-11 w-full min-w-0 rounded-2xl border border-zinc-300 bg-white px-3 text-base sm:text-sm dark:border-zinc-700 dark:bg-zinc-950";
const noop = () => () => {};
/** The filters a link can carry (?role=, ?topic=, ?level=), read after hydration so the page prerenders. */
const useSearch = () => useSyncExternalStore(noop, () => window.location.search, () => "");
/** Cards in one round of "Practise these". */
const ROUND = 20;
/** IP-7: questions listed before "Show more", so a phone is not handed all 500 in one column. */
const PAGE = 20;

/**
 * IP-6: the question bank and the answers in one app screen. A toolbar filters by search, role, topic
 * and level; the list is on the left and the chosen answer on the right (on a phone the answer takes the
 * screen, with a way back). "Practise these" turns the current list into flashcards (IQ-4).
 * IP-7: a signed-out visitor gets the same screen; IP-8: there the answer pane shows the short answer as a preview and
 * a sign-up card for the rest. Saving a rating needs an account (SU-2). The list shows PAGE questions at a time.
 */
export function QuestionsApp({ questions, roles }: { questions: InterviewView[]; roles: { id: string; name: string }[] }) {
  const params = new URLSearchParams(useSearch());
  const urlRole = roles.some((r) => r.id === params.get("role")) ? params.get("role")! : "all";
  const urlTopic = INTERVIEW_TOPICS.some((t) => t.id === params.get("topic")) ? params.get("topic")! : "all";
  const [roleChoice, setRole] = useState<string | null>(null);
  const [topicChoice, setTopic] = useState<string | null>(null);
  const [level, setLevel] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [cards, setCards] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);
  const [more, setMore] = useState({ key: "", n: PAGE });
  const role = roleChoice ?? urlRole;
  const topic = topicChoice ?? urlTopic;
  const practice = usePractice();
  const today = useToday();
  const list = useRef<HTMLUListElement>(null);
  // A new filter starts again from the first PAGE questions.
  const filterKey = [role, topic, level, query].join("|");
  const limit = more.key === filterKey ? more.n : PAGE;

  const shown = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return questions.filter(
      (q) =>
        (topic === "all" || q.topic === topic) &&
        (level === "all" || q.level === level) &&
        (role === "all" || q.paths.includes(role)) &&
        words.every((w) => `${q.question} ${q.short_answer}`.toLowerCase().includes(w)),
    );
  }, [questions, topic, level, role, query]);
  const byId = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  const visible = shown.slice(0, limit);
  // The open answer is always one of the rows on screen, so a new filter never leaves it without its row.
  const active = (selected && visible.find((q) => q.id === selected)) || visible[0];
  const picked = !!selected && active?.id === selected; // on a phone: the answer is open

  const startCards = () => {
    setCards(practiceOrder(shown.map((q) => q.id), practice.ratings).slice(0, ROUND));
    setIndex(0);
  };
  const showMore = () => {
    // Focus moves to the first new row: the button may be gone, and the new rows sit above it.
    flushSync(() => setMore({ key: filterKey, n: limit + PAGE }));
    list.current?.children[limit]?.querySelector("button")?.focus();
  };
  const onRate = (rating: Rating) => {
    if (!rate(cards![index], { rating, updatedOn: today ?? todayInIST() })) return; // SU-2: the sign-up prompt opens
    if (index + 1 < cards!.length) setIndex(index + 1);
    else setCards(null);
  };

  const toolbar = (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
      <label className="col-span-2 md:col-span-1">
        <span className="sr-only">Search questions</span>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questions" name="q" autoComplete="off" className={field} />
      </label>
      <label className="col-span-2 md:col-span-1">
        <span className="sr-only">Role</span>
        <select aria-label="Role" className={field} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="all">All roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="sr-only">Topic</span>
        <select aria-label="Topic" className={field} value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="all">All topics</option>
          {INTERVIEW_TOPICS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="sr-only">Level</span>
        <select aria-label="Level" className={field} value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="all">All levels</option>
          {LEVEL_IDS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  if (cards) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <button type="button" className={`${secondaryButtonSm} self-start`} onClick={() => setCards(null)}>
          ← Back to the list
        </button>
        <Flashcard key={cards[index]} q={byId.get(cards[index])!} index={index} total={cards.length} onRate={onRate} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {toolbar}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`text-sm ${muted}`} aria-live="polite">
          {shown.length} {shown.length === 1 ? "question" : "questions"}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/practice" className={secondaryButtonSm}>
            Quick quiz
          </Link>
          <button type="button" className={primaryButtonSm} onClick={startCards} disabled={shown.length === 0}>
            Practise these as cards
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <div className={`flex-col gap-3 lg:max-h-[72vh] lg:overflow-y-auto lg:pr-2 lg:pb-2 ${picked ? "hidden lg:flex" : "flex"}`}>
        <ul ref={list} aria-label="Questions" className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {visible.map((q) => {
            const rating = practice.ratings[q.id];
            const isActive = q.id === active?.id;
            const body = (
              <>
                <span className="block font-medium">{q.question}</span>
                <span className={`mt-1 block text-sm ${muted}`}>
                  {interviewTopicLabel(q.topic)} · {levelText(q.level)}
                  {rating ? ` · You said: ${RATINGS.find((r) => r.value === rating.rating)!.label.toLowerCase()}` : ""}
                </span>
              </>
            );
            const cls = `block w-full rounded-2xl px-3 py-3 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-700 ${
              isActive ? "lg:bg-zinc-100 lg:dark:bg-zinc-800/70" : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
            }`;
            return (
              <li key={q.id}>
                <button type="button" className={cls} aria-current={isActive ? "true" : undefined} onClick={() => setSelected(q.id)}>
                  {body}
                </button>
              </li>
            );
          })}
        </ul>
        {shown.length > limit && (
          <button type="button" className={`${secondaryButtonSm} self-center`} onClick={showMore}>
            Show more ({shown.length - limit} left)
          </button>
        )}
        </div>

        {active && (
          <article aria-labelledby="answer-q" className={`min-w-0 [overflow-wrap:anywhere] lg:max-h-[72vh] lg:overflow-y-auto lg:pr-2 ${picked ? "" : "hidden lg:block"}`}>
            <button type="button" className={`${secondaryButtonSm} mb-4 lg:hidden`} onClick={() => setSelected(null)}>
              ← All questions
            </button>
            <p className={`text-sm ${muted}`}>
              {interviewTopicLabel(active.topic)} · {levelText(active.level)}
            </p>
            <h2 id="answer-q" className="mt-1 text-xl leading-snug font-semibold md:text-2xl">
              {active.question}
            </h2>
            <h3 className="mt-6 text-sm font-semibold">Short answer</h3>
            <p className="mt-1 text-lg leading-8">{active.short_answer}</p>
            {/* IP-8 (2026-11-27, owner: "preview with the sign-up prompt"): signed out, the short answer is the preview and
                a sign-up card takes the place of the rest; each question's own page stays open for search (SU-1). */}
            <ContentGate reason="interview" title="Sign up free to read the full answer" text="The deeper answer, an example to tell, the follow-ups to expect and the common mistakes are in your free account.">
            <h3 className="mt-6 text-sm font-semibold">Deeper answer</h3>
            {active.deeper_answer.split(/\n\s*\n/).map((para, i) => (
              <p key={i} className="mt-1 leading-7">
                {para}
              </p>
            ))}
            {active.example && (
              <>
                <h3 className="mt-6 text-sm font-semibold">An example to tell</h3>
                <p className="mt-1 leading-7">{active.example}</p>
              </>
            )}
            <h3 className="mt-6 text-sm font-semibold">Follow-ups to expect</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 leading-7">
              {active.follow_ups.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            {active.common_mistakes.length > 0 && (
              <>
                <h3 className="mt-6 text-sm font-semibold">Common mistakes</h3>
                <ul className="mt-1 list-disc space-y-1 pl-5 leading-7">
                  {active.common_mistakes.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </>
            )}
            </ContentGate>
            <p className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <Link href={`/interview/simulator?question=${active.id}`} className={textLink}>
                Answer it out loud
              </Link>
              <Link href={`/stop/${active.stop.id}`} className={textLink}>
                Lesson: {active.stop.title}
              </Link>
              <Link href={`/interview/${active.id}`} className={textLink}>
                Open as a page
              </Link>
            </p>
          </article>
        )}
      </div>
    </div>
  );
}
