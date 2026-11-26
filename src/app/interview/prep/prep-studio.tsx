"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { useAccountState } from "@/components/account-link";
import { Flashcard, type Card } from "@/components/interview/flashcard";
import { Skeleton } from "@/components/skeleton";
import { muted, primaryButton, quietButton, secondaryButton, textLink } from "@/components/ui";
import { useActivity, useCurrentPathId, usePractice, usePrep, usePrepJob, useStories, useToday } from "@/lib/browser/hooks";
import { rate } from "@/lib/browser/practice-store";
import { parsePrepJob, rateGenerated, rawPrepJob, savePrepJob, saveStory } from "@/lib/browser/prep-job-store";
import { oldInterviewDate, savePrep } from "@/lib/browser/prep-store";
import { daysBetween } from "@/lib/dates";
import { interviewTopicLabel } from "@/lib/interview-topics";
import { readinessLabel } from "@/lib/interview/readiness";
import { EXPERIENCE, type ExperienceId } from "@/lib/interview/setup";
import { practiceOrder, type Rating } from "@/lib/practice/queue";
import { COMPANY_TYPES, GENERATED_COUNT, GeneratedQuestion, MAX_BOOST, MAX_JD_CHARS, MIN_JD_CHARS, isGeneratedId, jobBoost, withGenerated, type CompanyId } from "@/lib/prep/job";
import { PREP_REMIND_CONSENT } from "@/lib/prep/email";
import { ROUNDS, STORY_KINDS, STORY_PARTS, prepIcs, storyFor, storyWritten, type Story } from "@/lib/prep/extras";
import { MAX_DAYS_AHEAD, MINUTES, addDays, perDay, prepPlan, prepReadiness, prepSet, type Minutes, type PrepDay, type PrepSetup } from "@/lib/prep/plan";

export type PrepCard = Card & { topic: string; paths: string[]; often: boolean; terms: string[] };
/** PREP-6: how a question written for the job post is marked wherever it shows. */
const GENERATED_NOTE = "Generated for your JD";
/** The topic those questions are listed under, in the day list and the weakest topics. */
const JOB_TOPIC = "Your job post";
type PrepPath = { id: string; name: string; top: string[] };

const panel = "rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900";
const field = "mt-1 block min-h-11 w-full rounded-2xl border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950";
const DAY = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const fmt = (iso: string) => DAY.format(new Date(`${iso}T00:00:00+05:30`));
const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
/** How many plan days are listed before the rest fold away. */
const DAYS_SHOWN = 7;
const EXTRA = 5;

/** Removing a plan also removes what the device holds about the job (PREP-5). Ratings of bank questions stay. */
const removePlan = () => {
  if (!window.confirm("Remove this plan, with your job post and the questions written for it? Your ratings of our questions are kept.")) return;
  savePrep(null);
  savePrepJob(null);
};

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
          <button type="button" className={secondaryButton} onClick={removePlan}>
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
  // PREP-5: the job, kept on this device only.
  const job = usePrepJob();
  const [companyChoice, setCompany] = useState<CompanyId | "" | null>(null);
  const company = companyChoice ?? job.company ?? "";
  const [jdDraft, setJd] = useState<string | null>(null);
  const jd = jdDraft ?? job.jd;
  const boost = useMemo(() => jobBoost(jd, questions), [jd, questions]);

  const path = paths.find((p) => p.id === pathId) ?? paths[0];
  const set = useMemo(() => prepSet(questions, path.top, path.id, experience, { boost, company: company || null }), [questions, path, experience, boost, company]);
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
        // Questions written for a job post belong to that post: a changed post starts without them.
        const same = jd.trim() === job.jd;
        savePrepJob({ company: company || null, jd: jd.trim(), boost: boost.slice(0, MAX_BOOST), generated: same ? job.generated : [], ratings: same ? job.ratings : {} });
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
          <span className="relative block">
            <input
              type="date"
              required
              min={addDays(today, 1)}
              max={addDays(today, MAX_DAYS_AHEAD)}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`${field} peer max-w-full min-w-0 appearance-none dark:scheme-dark [&::-webkit-date-and-time-value]:text-left ${date ? "" : "[&:not(:focus)]:text-transparent"}`}
            />
            {/* An empty date field is blank on an iPhone, so say what to do. It steps aside while the field is in use. */}
            {!date && (
              <span aria-hidden="true" className="pointer-events-none absolute top-1 bottom-0 left-3 flex items-center font-normal text-zinc-600 peer-focus:hidden dark:text-zinc-400">
                Choose a date
              </span>
            )}
          </span>
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
        <label className="block min-w-0 text-sm font-medium">
          Kind of company (optional)
          <select value={company} onChange={(e) => setCompany(e.target.value as CompanyId | "")} className={field}>
            <option value="">Not sure</option>
            {COMPANY_TYPES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-0 text-sm font-medium sm:col-span-2">
          Job post (optional)
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            maxLength={MAX_JD_CHARS}
            rows={5}
            aria-describedby="jd-help"
            name="job-post"
            autoComplete="off"
            className={`${field} py-2 font-normal leading-6`}
          />
        </label>
        <p id="jd-help" className={`-mt-3 text-sm sm:col-span-2 ${muted}`}>
          Paste the job post or description. Questions on the skills it names come first in your plan. It stays on this device.
          {job.generated.length > 0 && jd.trim() !== job.jd && (
            <strong className="mt-1 block font-medium text-amber-900 dark:text-amber-200">Saving a changed job post removes the {job.generated.length} questions written for the old one, and your ratings of them.</strong>
          )}
        </p>
      </div>

      <p className="mt-5 leading-7" role="status">
        <strong>{count(set.ids.length, "question", "questions")}</strong> for a {path.name} interview: {set.core} on the role and {set.behavioural} behavioural.
        {jd.trim() && (set.fromJob > 0 ? ` ${count(set.fromJob, "matches", "match")} your job post, and come first.` : " None matches the skills your job post names, so the order is by level.")}
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
  const practice = usePractice();
  const activity = useActivity();
  const account = useAccountState();
  // PREP-5, PREP-6: the job post's matches come first, and the questions written for it sit among the early ones.
  const job = usePrepJob();
  const ratings = useMemo(() => ({ ...practice.ratings, ...job.ratings }), [practice.ratings, job.ratings]);
  const byId = useMemo(
    () => new Map<string, PrepCard>([...questions, ...job.generated.map((g) => ({ ...g, level: "I1" as const, topic: JOB_TOPIC, paths: [], often: false, terms: [] }))].map((q) => [q.id, q])),
    [questions, job.generated],
  );
  const set = useMemo(() => prepSet(questions, path.top, path.id, setup.experience, { boost: job.boost, company: job.company }), [questions, path, setup.experience, job.boost, job.company]);
  const order = useMemo(() => withGenerated(set.ids, job.generated.map((g) => g.id)), [set, job.generated]);
  const plan = useMemo(() => prepPlan(setup, order, ratings, today), [setup, order, ratings, today]);
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
  const ready = prepReadiness(order.map((id) => byId.get(id)!), ratings, setup.startedOn, mockScore);
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
    start((ahead.length ? ahead : practiceOrder(order, ratings)).slice(0, EXTRA));
  };
  const onRate = (rating: Rating) => {
    const id = queue![index];
    if (isGeneratedId(id)) rateGenerated(id, { rating, updatedOn: today });
    else if (!rate(id, { rating, updatedOn: today })) return; // SU-2: the sign-up prompt opens
    if (index + 1 < queue!.length) return setIndex(index + 1); // the new card takes focus itself
    setQueue(null);
    requestAnimationFrame(() => document.getElementById("today-h")?.focus()); // the deck is gone: back to its heading
  };

  // PREP-8: a practice block every evening and the interview day, for any calendar app.
  const downloadIcs = () => {
    const url = URL.createObjectURL(new Blob([prepIcs(setup, path.name, today, `${window.location.origin}/interview/prep`)], { type: "text/calendar" }));
    Object.assign(document.createElement("a"), { href: url, download: "xplaind-interview-prep.ics" }).click();
    URL.revokeObjectURL(url);
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
                  {/* The questions written for the job post have no practice page of their own. */}
                  {t.topic === JOB_TOPIC ? (
                    JOB_TOPIC
                  ) : (
                    <Link href={`/practice/${t.topic}`} className={textLink}>
                      {interviewTopicLabel(t.topic)}
                    </Link>
                  )}
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
        {queue === null || !byId.has(queue[index]) ? (
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
            note={isGeneratedId(queue[index]) ? GENERATED_NOTE : undefined}
            extra={
              isGeneratedId(queue[index]) ? (
                <p className={`text-sm ${muted}`}>AI wrote this question and answer from your job post. No person has reviewed them, so check anything that matters.</p>
              ) : (
                <>
                  <Link href={`/interview/simulator?question=${queue[index]}`} className={`text-sm ${textLink}`}>
                    Answer this one out loud in a mock interview
                  </Link>
                  {byId.get(queue[index])!.topic === "behavioral" && <StoryHint question={byId.get(queue[index])!.question} />}
                </>
              )
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

      <JobPost setup={setup} path={path} have={set.ids.slice(0, 40).map((id) => byId.get(id)!.question.slice(0, 300))} fromJob={set.fromJob} onEdit={onEdit} />

      <section aria-labelledby="days-h" className={panel}>
        <h2 id="days-h" className="text-xl font-semibold">
          Day by day
        </h2>
        <p className={`mt-1 text-sm ${muted}`}>If you miss a day, the questions move to the next one.</p>
        <button type="button" className={`${secondaryButton} mt-3`} onClick={downloadIcs}>
          Add to my calendar (.ics)
        </button>
        <ol className="mt-2 divide-y divide-zinc-200 dark:divide-zinc-800">{plan.days.slice(0, DAYS_SHOWN).map(dayItem)}</ol>
        {plan.days.length > DAYS_SHOWN && (
          <details className="border-t border-zinc-200 dark:border-zinc-800">
            <summary className="flex min-h-11 cursor-pointer items-center font-medium text-brand-800 dark:text-brand-300">Show the other {plan.days.length - DAYS_SHOWN} days</summary>
            <ol className="divide-y divide-zinc-200 dark:divide-zinc-800">{plan.days.slice(DAYS_SHOWN).map((d, i) => dayItem(d, i + DAYS_SHOWN))}</ol>
          </details>
        )}
      </section>

      <StoriesPanel />

      <section aria-labelledby="rounds-h" className={panel}>
        <h2 id="rounds-h" className="text-xl font-semibold">
          What each round tests
        </h2>
        <p className={`mt-1 text-sm ${muted}`}>Most interviews have some of these rounds. Ask the recruiter which ones yours has.</p>
        <dl className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
          {ROUNDS.map((r) => (
            <div key={r.name} className="py-3">
              <dt className="font-medium">{r.name}</dt>
              <dd className="mt-1 leading-7">{r.tests}</dd>
              <dd className={`leading-7 ${muted}`}>Prepare: {r.prepare}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Reminder setup={setup} />

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
        <button type="button" className={quietButton} onClick={removePlan}>
          Remove my plan
        </button>
      </div>
    </div>
  );
}

/** PREP-5, PREP-6: what the job post did to the plan, and (Pro) ten questions written for it by AI. */
function JobPost({ setup, path, have, fromJob, onEdit }: { setup: PrepSetup; path: PrepPath; have: string[]; fromJob: number; onEdit: () => void }) {
  const job = usePrepJob();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; href?: string; cta?: string } | null>(null);

  const write = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/prep-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd: job.jd, role: path.name, experience: setup.experience, have }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; upgrade?: string; signin?: boolean; questions?: unknown };
      const questions = GeneratedQuestion.array().max(GENERATED_COUNT).safeParse(data.questions);
      if (!res.ok || !questions.success || questions.data.length === 0) {
        return setError({
          message: data.error ?? "We could not write the questions. Try again in a minute.",
          ...(data.upgrade ? { href: data.upgrade, cta: "See Pro" } : data.signin ? { href: "/signin?next=/interview/prep", cta: "Sign in" } : {}),
        });
      }
      // The wait can be long: keep the questions only if this is still the job post they were written for.
      const now = parsePrepJob(rawPrepJob());
      if (now.jd !== job.jd) return;
      savePrepJob({ ...now, generated: questions.data, ratings: {} });
      // The button is gone now: put focus on the section, whose text says what happened.
      requestAnimationFrame(() => document.getElementById("job-h")?.focus());
    } catch {
      setError({ message: "We could not reach the server. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="job-h" className={panel}>
      <h2 id="job-h" tabIndex={-1} className="text-xl font-semibold outline-none">
        Your job post
      </h2>
      {!job.jd ? (
        <>
          <p className="mt-2 leading-7">Add the job post, and the questions on the skills it names come first in your plan.</p>
          <button type="button" className={`${secondaryButton} mt-3`} onClick={onEdit}>
            Add my job post
          </button>
        </>
      ) : (
        <>
          <p className="mt-2 leading-7">
            {fromJob > 0 ? `${count(fromJob, "question", "questions")} in your plan ${fromJob === 1 ? "matches" : "match"} the skills your job post names. They come first.` : "No question in our bank matches the skills your job post names, so your plan is ordered by level."}
          </p>
          {job.generated.length > 0 ? (
            <p className="mt-2 leading-7" role="status">
              {count(job.generated.length, "question", "questions")} written by AI for this job post {job.generated.length === 1 ? "is" : "are"} in your plan, marked &quot;{GENERATED_NOTE}&quot;. No person has reviewed them.
            </p>
          ) : job.jd.length < MIN_JD_CHARS ? (
            <p className={`mt-2 text-sm ${muted}`}>Paste more of the job post to have questions written for it.</p>
          ) : (
            <div className="mt-3">
              <button type="button" className={secondaryButton} onClick={write} disabled={busy}>
                {busy ? "Writing your questions…" : `Write ${GENERATED_COUNT} questions for this job post`}
              </button>
              <p className={`mt-2 text-sm ${muted}`}>Part of Pro. AI writes them from your job post; they are marked &quot;{GENERATED_NOTE}&quot; and no person reviews them. Your job post is sent to the AI to write them and is not stored.</p>
            </div>
          )}
          {error && (
            <p role="alert" className="mt-3 rounded-2xl bg-amber-50 p-4 leading-7 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
              {error.message}{" "}
              {error.href && (
                <Link href={error.href} className="font-medium underline underline-offset-2">
                  {error.cta}
                </Link>
              )}
            </p>
          )}
        </>
      )}
    </section>
  );
}

/** PREP-7: opt in to one email each morning until the interview, or stop it. Off unless the learner ticks the box. */
function Reminder({ setup }: { setup: PrepSetup }) {
  const account = useAccountState();
  const [active, setActive] = useState<boolean | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boxId = useId();

  useEffect(() => {
    if (account !== "in") return;
    let live = true;
    void fetch("/api/prep/remind")
      .then((r) => (r.ok ? (r.json() as Promise<{ active: boolean }>) : { active: false }))
      .then((d) => live && setActive(d.active))
      .catch(() => live && setActive(false));
    return () => {
      live = false;
    };
  }, [account]);

  const call = async (method: "POST" | "DELETE") => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/prep/remind", { method, headers: { "Content-Type": "application/json" }, body: method === "POST" ? JSON.stringify({ consent: true, prep: setup }) : undefined }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      const body = (await res?.json().catch(() => null)) as { error?: string } | null;
      return setError(body?.error ?? "Something went wrong. Please try again.");
    }
    setActive(method === "POST");
    setConsent(false); // turning the emails on again needs a fresh tick
    requestAnimationFrame(() => document.getElementById("remind-h")?.focus()); // the button pressed is gone
  };

  // Accounts switched off: the plan still works, so the email offer just stays hidden.
  if (account === "off" || account === "unknown") return null;
  return (
    <section aria-labelledby="remind-h" className={panel}>
      <h2 id="remind-h" tabIndex={-1} className="text-xl font-semibold outline-none">
        A reminder each morning
      </h2>
      {account === "out" ? (
        <p className="mt-2 leading-7">
          With an account, get one short email at 7:30 am India time with that day&apos;s questions, until your interview.{" "}
          <Link href="/signin?next=/interview/prep" className={textLink}>
            Sign in or make an account
          </Link>
          .
        </p>
      ) : active === null ? (
        <p className={`mt-2 ${muted}`}>Checking…</p>
      ) : active ? (
        <>
          <p className="mt-2 leading-7" role="status">
            On. You get one email at 7:30 am India time with that day&apos;s questions, until your interview.
          </p>
          <button type="button" className={`${secondaryButton} mt-3`} onClick={() => call("DELETE")} aria-disabled={busy}>
            Stop the emails
          </button>
        </>
      ) : (
        <>
          <p className="mt-2 leading-7">One short email at 7:30 am India time with that day&apos;s questions. It stops after your interview.</p>
          <label htmlFor={boxId} className="mt-3 flex items-start gap-3 leading-7">
            <input id={boxId} type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1.5 size-5 shrink-0 accent-brand-700" />
            <span>{PREP_REMIND_CONSENT}</span>
          </label>
          <button type="button" className={`${primaryButton} mt-3`} onClick={() => (consent ? call("POST") : setError("Tick the box to agree to the daily emails."))} aria-disabled={busy}>
            Email me each morning
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="mt-3 leading-7 text-amber-900 dark:text-amber-200">
          {error}
        </p>
      )}
    </section>
  );
}

/** PREP-8: under a behavioural card: the learner's own story for that kind of question, or where to write it. */
function StoryHint({ question }: { question: string }) {
  const stories = useStories();
  const kind = STORY_KINDS.find((k) => k.id === storyFor(question));
  if (!kind) return null; // pay, notice period, "why this company": not answered with a story
  const story = stories[kind.id];
  if (!storyWritten(story)) {
    return (
      <p className={`text-sm ${muted}`}>
        Your story for this: {kind.label.toLowerCase()}.{" "}
        <a href="#stories-h" className={textLink}>
          Write it once
        </a>{" "}
        and it shows here.
      </p>
    );
  }
  return (
    <details className="rounded-2xl bg-zinc-100 p-3 text-sm dark:bg-zinc-800">
      <summary className="flex min-h-11 cursor-pointer items-center font-medium">Your story for this question</summary>
      <dl className="space-y-2 pb-1">
        {STORY_PARTS.filter((p) => story[p.id].trim()).map((p) => (
          <div key={p.id}>
            <dt className="font-medium">{p.label}</dt>
            <dd className="leading-6 whitespace-pre-line">{story[p.id]}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

/** PREP-8: five stories, written once, each in four parts. Saved on this device as the learner types. */
function StoriesPanel() {
  const stories = useStories();
  const empty: Story = { situation: "", task: "", action: "", result: "" };
  return (
    <section aria-labelledby="stories-h" className={panel}>
      <h2 id="stories-h" tabIndex={-1} className="scroll-mt-24 text-xl font-semibold outline-none">
        Your stories
      </h2>
      <p className="mt-2 leading-7">Behavioural questions are answered with a story. Write these five once, and each behavioural card shows the one that fits. They stay on this device.</p>
      <div className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
        {STORY_KINDS.map((k) => (
          <details key={k.id}>
            <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 py-2 font-medium">
              <span>{k.label}</span>
              <span className={`shrink-0 text-sm font-normal ${muted}`}>{storyWritten(stories[k.id]) ? "Written" : "Not written yet"}</span>
            </summary>
            <div className="grid gap-3 pb-4">
              {STORY_PARTS.map((p) => (
                <label key={p.id} className="block min-w-0 text-sm font-medium">
                  {p.label}
                  <span className={`ml-2 font-normal ${muted}`}>{p.hint}</span>
                  <textarea
                    defaultValue={stories[k.id]?.[p.id] ?? ""}
                    onChange={(e) => saveStory(k.id, { ...empty, ...stories[k.id], [p.id]: e.target.value })}
                    maxLength={1200}
                    rows={3}
                    name={`story-${k.id}-${p.id}`}
                    autoComplete="off"
                    className={`${field} py-2 font-normal leading-6`}
                  />
                </label>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
