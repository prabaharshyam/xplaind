"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAccountState } from "@/components/account-link";
import { Flashcard, type Card } from "@/components/interview/flashcard";
import { Skeleton } from "@/components/skeleton";
import { muted, primaryButton, quietButton, secondaryButton, textLink } from "@/components/ui";
import { useActivity, useCurrentPathId, usePractice, usePrep, useToday } from "@/lib/browser/hooks";
import { rate } from "@/lib/browser/practice-store";
import { oldInterviewDate, savePrep } from "@/lib/browser/prep-store";
import { daysBetween } from "@/lib/dates";
import { interviewTopicLabel } from "@/lib/interview-topics";
import { readinessLabel } from "@/lib/interview/readiness";
import { EXPERIENCE, type ExperienceId } from "@/lib/interview/setup";
import { practiceOrder, type Rating } from "@/lib/practice/queue";
import { MAX_DAYS_AHEAD, MINUTES, addDays, perDay, prepPlan, prepReadiness, prepSet, type Minutes, type PrepDay, type PrepSetup } from "@/lib/prep/plan";

export type PrepCard = Card & { topic: string; paths: string[]; often: boolean };
type PrepPath = { id: string; name: string; top: string[] };

const panel = "rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900";
const field = "mt-1 block min-h-11 w-full rounded-2xl border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950";
const DAY = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const fmt = (iso: string) => DAY.format(new Date(`${iso}T00:00:00+05:30`));
const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
/** How many plan days are listed before the rest fold away. */
const DAYS_SHOWN = 7;
const EXTRA = 5;

/** PREP-1: the setup form until there is a plan, then the plan. Nothing shows until the browser knows today. */
export function PrepStudio({ paths, questions }: { paths: PrepPath[]; questions: PrepCard[] }) {
  const today = useToday();
  const saved = usePrep();
  const [editing, setEditing] = useState(false);
  if (!today) return <Skeleton label="Loading your plan…" rows={3} />;
  const path = saved && paths.find((p) => p.id === saved.pathId);
  const over = !!saved && daysBetween(today, saved.interviewOn) < 0;
  if (!saved || !path || editing) {
    // A plan whose date has passed starts again from today; an edit keeps its start day and its progress.
    return <Setup paths={paths} questions={questions} today={today} current={saved && path && !over ? saved : null} onDone={() => setEditing(false)} onCancel={saved && path ? () => setEditing(false) : undefined} />;
  }
  if (over) {
    return (
      <section aria-labelledby="over-h" className={panel}>
        <h2 id="over-h" className="text-xl font-semibold">
          Your interview date has passed
        </h2>
        <p className="mt-2 leading-7">We hope it went well. Your ratings are kept, so the next plan starts from what you already know.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className={primaryButton} onClick={() => setEditing(true)}>
            Plan the next interview
          </button>
          <button type="button" className={secondaryButton} onClick={() => savePrep(null)}>
            Remove this plan
          </button>
        </div>
      </section>
    );
  }
  return <Plan setup={saved} path={path} questions={questions} today={today} onEdit={() => setEditing(true)} />;
}

function Setup({ paths, questions, today, current, onDone, onCancel }: { paths: PrepPath[]; questions: PrepCard[]; today: string; current: PrepSetup | null; onDone: () => void; onCancel?: () => void }) {
  const { ratings } = usePractice();
  const defaultPath = useCurrentPathId(paths.map((p) => p.id));
  const [date, setDate] = useState(() => {
    const start = current?.interviewOn ?? oldInterviewDate() ?? "";
    return start > today ? start : "";
  });
  const [pathChoice, setPathChoice] = useState<string | null>(current?.pathId ?? null);
  const pathId = pathChoice ?? defaultPath;
  const [experience, setExperience] = useState<ExperienceId>(current?.experience ?? "junior");
  const [minutes, setMinutes] = useState<Minutes>(current?.minutes ?? 60);

  const path = paths.find((p) => p.id === pathId) ?? paths[0];
  const set = useMemo(() => prepSet(questions, path.top, path.id, experience), [questions, path, experience]);
  const days = date ? daysBetween(today, date) : 0;
  const valid = days >= 1 && days <= MAX_DAYS_AHEAD;
  const draft: PrepSetup = { interviewOn: date, pathId: path.id, experience, minutes, startedOn: current?.startedOn ?? today };
  const preview = valid ? prepPlan(draft, set.ids, ratings, today) : null;
  const fits = preview?.status === "ok" ? preview.total - preview.leftOut : 0;

  return (
    <form
      aria-labelledby="setup-h"
      className={panel}
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        savePrep(draft);
        onDone();
      }}
    >
      <h2 id="setup-h" className="text-xl font-semibold">
        {current ? "Change your plan" : "Set up your plan"}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block min-w-0 text-sm font-medium">
          Interview date
          {/* iPhone Safari sizes a date field by its own contents, so it ran past the card: take its native look off and let it shrink. */}
          <input type="date" required min={addDays(today, 1)} max={addDays(today, MAX_DAYS_AHEAD)} value={date} onChange={(e) => setDate(e.target.value)} className={`${field} max-w-full min-w-0 appearance-none dark:scheme-dark [&::-webkit-date-and-time-value]:text-left`} />
        </label>
        <label className="block min-w-0 text-sm font-medium">
          Role
          <select value={path.id} onChange={(e) => setPathChoice(e.target.value)} className={field}>
            {paths.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-0 text-sm font-medium">
          Your experience
          <select value={experience} onChange={(e) => setExperience(e.target.value as ExperienceId)} className={field}>
            {EXPERIENCE.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-0 text-sm font-medium">
          Time you can give each day
          <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value) as Minutes)} className={field}>
            {MINUTES.map((m) => (
              <option key={m} value={m}>
                {m} minutes, about {perDay(m)} questions
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-5 leading-7" role="status">
        <strong>{count(set.ids.length, "question", "questions")}</strong> for a {path.name} interview: {set.core} on the role and {set.behavioural} behavioural.
        {set.stretch > 0 && ` ${count(set.stretch, "is", "are")} well above or below your level, and come last.`}
        {preview?.status === "ok" &&
          (preview.leftOut === 0
            ? ` In ${count(days, "day", "days")} at ${minutes} minutes a day, you cover all of them.`
            : ` In ${count(days, "day", "days")} at ${minutes} minutes a day, you cover ${fits} of them. The ${preview.leftOut} that do not fit are the least important.${minutes < 90 ? " More time each day covers more." : ""}`)}
        {date && !valid && " Pick a date from tomorrow up to a year ahead."}
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="submit" className={primaryButton}>
          {current ? "Save my plan" : "Make my plan"}
        </button>
        {onCancel && (
          <button type="button" className={secondaryButton} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
      <p className={`mt-3 text-sm ${muted}`}>Your plan is kept on this device, and in your account when you are signed in.</p>
    </form>
  );
}

function Plan({ setup, path, questions, today, onEdit }: { setup: PrepSetup; path: PrepPath; questions: PrepCard[]; today: string; onEdit: () => void }) {
  const { ratings } = usePractice();
  const activity = useActivity();
  const account = useAccountState();
  const byId = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  const set = useMemo(() => prepSet(questions, path.top, path.id, setup.experience), [questions, path, setup.experience]);
  const plan = useMemo(() => prepPlan(setup, set.ids, ratings, today), [setup, set, ratings, today]);
  const [queue, setQueue] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);

  // IR-1: the role's mock interview score, when the learner has one, counts towards readiness.
  const [mockScore, setMockScore] = useState<number | null>(null);
  useEffect(() => {
    if (account !== "in") return;
    let live = true;
    void fetch("/api/interview/readiness")
      .then((r) => (r.ok ? (r.json() as Promise<{ roles: { pathId: string; score: number }[] }>) : { roles: [] }))
      .then((d) => live && setMockScore(d.roles.find((r) => r.pathId === path.id)?.score ?? null))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [account, path.id]);

  if (plan.status !== "ok") return null; // PrepStudio shows the "date has passed" panel
  const ready = prepReadiness(set.ids.map((id) => byId.get(id)!), ratings, setup.startedOn, mockScore);
  const first = plan.days[0];
  const todo = plan.review.length + plan.fresh.length;
  const mockDone = activity.interviews.some((i) => i.on === today);
  const mockHref = `/interview/simulator?path=${path.id}&exp=${setup.experience}`;

  const start = (ids: string[]) => {
    setQueue(ids);
    setIndex(0);
  };
  // After today's list: the next questions in the plan, or the weakest ones once everything is covered.
  const more = () => {
    const ahead = plan.days.slice(1).flatMap((d) => d.ids);
    start((ahead.length ? ahead : practiceOrder(set.ids, ratings)).slice(0, EXTRA));
  };
  const onRate = (rating: Rating) => {
    if (!rate(queue![index], { rating, updatedOn: today })) return; // SU-2: the sign-up prompt opens
    if (index + 1 < queue!.length) return setIndex(index + 1); // the new card takes focus itself
    setQueue(null);
    requestAnimationFrame(() => document.getElementById("today-h")?.focus()); // the deck is gone: back to its heading
  };

  const dayText = (d: PrepDay, i: number) => {
    if (d.kind === "interview") return "Interview day";
    const topics = [...new Set(d.ids.map((id) => interviewTopicLabel(byId.get(id)!.topic)))].slice(0, 3).join(", ");
    const parts = [
      i === 0 && plan.review.length ? `${plan.review.length} to revise` : "",
      d.ids.length ? `${count(d.ids.length, "new question", "new questions")}: ${topics}` : "",
      d.mock === "short" ? "Short mock interview" : d.mock === "full" ? "Full mock interview" : "",
      d.kind === "final" ? "Revise your weakest questions and go through the checklist" : "",
    ].filter(Boolean);
    return parts.length ? parts.join(" · ") : i === 0 ? "Done for today" : "Revise your weakest questions";
  };
  const dayItem = (d: PrepDay, i: number) => (
    <li key={d.date} className="flex gap-4 py-3">
      <span className="w-24 shrink-0 text-sm font-medium text-brand-800 dark:text-brand-300">{i === 0 ? "Today" : fmt(d.date)}</span>
      <span className="min-w-0 leading-6">{dayText(d, i)}</span>
    </li>
  );

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="count-h" className={panel}>
        <h2 id="count-h" className="text-2xl font-semibold tracking-tight">
          {plan.daysLeft === 0 ? "Your interview is today" : `Your interview is in ${count(plan.daysLeft, "day", "days")}`}
        </h2>
        <p className={`mt-1 text-sm ${muted}`}>
          {fmt(setup.interviewOn)} · {path.name} · {setup.minutes} minutes a day
        </p>
        <div className="mt-5">
          <p className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium">
              {plan.covered} of {count(plan.total, "question", "questions")} covered
            </span>
            <span className={muted}>{Math.round((plan.covered / Math.max(1, plan.total)) * 100)}%</span>
          </p>
          <div
            role="progressbar"
            aria-label="Questions covered"
            aria-valuemin={0}
            aria-valuemax={plan.total}
            aria-valuenow={plan.covered}
            className="mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
          >
            <span className="block h-full rounded-full bg-brand-700 transition-[width] duration-300" style={{ width: `${(plan.covered / Math.max(1, plan.total)) * 100}%` }} />
          </div>
        </div>
        <p className="mt-5 leading-7">
          <strong>Readiness: {ready.score} out of 100.</strong> {readinessLabel(ready.score)}. It counts each question you rate &quot;Got it&quot; in full and &quot;Partly&quot; as half
          {mockScore === null ? "." : `, with your mock interview score of ${mockScore} for this role.`}
        </p>
        {ready.weak.length > 0 && (
          <div className="mt-3">
            <h3 className="text-sm font-medium">Weakest topics so far</h3>
            <ul className="mt-1 space-y-1">
              {ready.weak.map((t) => (
                <li key={t.topic}>
                  <Link href={`/practice/${t.topic}`} className={textLink}>
                    {interviewTopicLabel(t.topic)}
                  </Link>
                  : {t.gotIt} of {t.rated} got it
                </li>
              ))}
            </ul>
          </div>
        )}
        {plan.leftOut > 0 && plan.daysLeft > 0 && (
          <p className="mt-4 rounded-2xl bg-amber-50 p-4 leading-7 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
            At {setup.minutes} minutes a day, {count(plan.leftOut, "question does", "questions do")} not fit before your interview. They are the least important ones.
            {setup.minutes < 90 ? " Give more time each day to cover them." : ""}
          </p>
        )}
        {account === "out" && (
          <p className="mt-4 rounded-2xl bg-zinc-100 p-4 leading-7 dark:bg-zinc-800">
            You can set up your plan and see every day here. To rate your answers and count your progress,{" "}
            <Link href="/signin?next=/interview/prep" className={textLink}>
              sign in or make an account
            </Link>
            .
          </p>
        )}
      </section>

      <section aria-labelledby="today-h" className="flex flex-col gap-4">
        <div>
          <h2 id="today-h" tabIndex={-1} className="text-xl font-semibold outline-none">
            {first.kind === "interview" ? "Interview day" : "Today's questions"}
          </h2>
          <p className={`mt-1 text-sm ${muted}`}>
            {first.kind === "interview"
              ? "No new questions today. Go through the checklist below, and good luck."
              : `${plan.review.length} to revise, ${plan.fresh.length} new, ${plan.doneToday} done today.`}
          </p>
        </div>
        {queue === null ? (
          <div className="flex flex-wrap items-center gap-3" role="status">
            {todo > 0 ? (
              <button type="button" className={primaryButton} onClick={() => start([...plan.review, ...plan.fresh])}>
                {plan.doneToday > 0 ? "Carry on with today's questions" : "Start today's questions"}
              </button>
            ) : (
              <>
                {first.kind !== "interview" && <p className="font-medium">Done for today.</p>}
                <button type="button" className={secondaryButton} onClick={more}>
                  Practise {EXTRA} more
                </button>
              </>
            )}
          </div>
        ) : (
          <Flashcard
            key={queue[index]}
            q={byId.get(queue[index])!}
            index={index}
            total={queue.length}
            onRate={onRate}
            extra={
              <Link href={`/interview/simulator?question=${queue[index]}`} className={`text-sm ${textLink}`}>
                Answer this one out loud in a mock interview
              </Link>
            }
          />
        )}
        {first.mock && (
          <div className={`${panel} flex flex-wrap items-center justify-between gap-3`}>
            <div className="min-w-0">
              <h3 className="font-semibold">{first.mock === "full" ? "Today: a full mock interview" : "Today: a short mock interview"}</h3>
              <p className={`mt-1 text-sm ${muted}`}>
                {mockDone ? "Done today." : first.mock === "full" ? "A full round out loud for your role, with a report at the end. Choose five questions or more." : "A quick round out loud for your role, with a report at the end. Three questions is enough."}
              </p>
            </div>
            <Link href={mockHref} className={secondaryButton}>
              {mockDone ? "Do another" : "Open the mock interview"}
            </Link>
          </div>
        )}
      </section>

      <section aria-labelledby="days-h" className={panel}>
        <h2 id="days-h" className="text-xl font-semibold">
          Day by day
        </h2>
        <p className={`mt-1 text-sm ${muted}`}>If you miss a day, the questions move to the next one.</p>
        <ol className="mt-2 divide-y divide-zinc-200 dark:divide-zinc-800">{plan.days.slice(0, DAYS_SHOWN).map(dayItem)}</ol>
        {plan.days.length > DAYS_SHOWN && (
          <details className="border-t border-zinc-200 dark:border-zinc-800">
            <summary className="flex min-h-11 cursor-pointer items-center font-medium text-brand-800 dark:text-brand-300">Show the other {plan.days.length - DAYS_SHOWN} days</summary>
            <ol className="divide-y divide-zinc-200 dark:divide-zinc-800">{plan.days.slice(DAYS_SHOWN).map((d, i) => dayItem(d, i + DAYS_SHOWN))}</ol>
          </details>
        )}
      </section>

      <section aria-labelledby="check-h" className={panel}>
        <h2 id="check-h" className="text-xl font-semibold">
          The day before
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 leading-7">
          <li>Revise only your weakest questions. Do not start a new topic.</li>
          <li>Have three stories ready: a project you built, something that went wrong and what you changed, and a disagreement and how you settled it.</li>
          <li>Write down three questions to ask the interviewer.</li>
          <li>Check the time, the link or the address, and the names of the people you will meet.</li>
          <li>For a video interview, test your camera, microphone and internet in a quiet room.</li>
          <li>Keep your resume and the job post open, or printed.</li>
          <li>Sleep on time.</li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={quietButton} onClick={onEdit}>
          Change my plan
        </button>
        <button type="button" className={quietButton} onClick={() => window.confirm("Remove this plan? Your ratings are kept.") && savePrep(null)}>
          Remove my plan
        </button>
      </div>
    </div>
  );
}
