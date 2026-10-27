"use client";

import { useState } from "react";
import { Icon } from "@/components/art/icons";
import { muted, primaryButton, textLink } from "@/components/ui";
import { useProgress, useToday } from "@/lib/browser/hooks";
import { type ProjectProgress, setProject } from "@/lib/browser/progress-store";
import { todayInIST } from "@/lib/dates";
import { isProjectUrl } from "@/lib/roadmap/progress";
import { guideKey } from "@/lib/roadmap/view";

type Step = { title: string; body: string; hint?: string; done_when: string };
type Criterion = { criterion: string; strong: string; weak: string };

const toggle = (list: number[] | undefined, i: number): number[] => {
  const set = new Set(list ?? []);
  if (set.has(i)) set.delete(i);
  else set.add(i);
  return [...set].sort((a, b) => a - b);
};

/**
 * GP-2: the steps as a checklist, the rubric as a self-check and the project link.
 * Kept on this device in the same record the roadmap's Projects tab reads.
 */
export function ProjectGuide({ id, steps, rubric }: { id: string; steps: Step[]; rubric: Criterion[] }) {
  const progress = useProgress();
  const today = useToday();
  const key = guideKey(id);
  const record = progress.projects?.[key];
  const day = () => today ?? todayInIST();
  const ticked = new Set(record?.steps ?? []);
  const met = new Set(record?.rubric ?? []);

  const save = (change: Partial<ProjectProgress>) => {
    const next = { status: "building" as const, ...record, ...change, updatedOn: day() };
    const empty = next.status === "building" && !next.url && !next.steps?.length && !next.rubric?.length;
    setProject(key, empty ? null : next);
  };

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="steps-h" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="steps-h" className="text-2xl font-semibold tracking-tight">
            Steps
          </h2>
          <p className="text-sm" aria-live="polite">
            <span className="font-semibold">{ticked.size}</span> of {steps.length} done
          </p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800" aria-hidden="true">
          <div className="h-full bg-emerald-600 transition-[width]" style={{ width: `${(ticked.size / steps.length) * 100}%` }} />
        </div>
        <ol className="flex flex-col gap-3">
          {steps.map((st, i) => {
            const done = ticked.has(i);
            return (
              <li
                key={st.title}
                className={`rounded-2xl border-2 p-4 md:p-5 ${done ? "border-emerald-500 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40" : "border-zinc-200 dark:border-zinc-800"}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={`grid size-9 shrink-0 place-items-center rounded-full font-semibold ${done ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"}`}
                  >
                    {done ? <Icon name="tick" size={16} strokeWidth={2.5} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold">{st.title}</h3>
                    <p className="mt-1 leading-7">{st.body}</p>
                    <p className="mt-2 text-sm leading-6">
                      <span className="font-semibold">Done when:</span> {st.done_when}
                    </p>
                    {st.hint && (
                      <details className="mt-2 text-sm">
                        <summary className={`cursor-pointer font-medium ${textLink}`}>Show a hint</summary>
                        <p className="mt-1 leading-6">{st.hint}</p>
                      </details>
                    )}
                    <label className="mt-3 flex min-h-11 w-fit cursor-pointer items-center gap-2 font-medium">
                      <input type="checkbox" className="size-5 accent-emerald-700" checked={done} onChange={() => save({ steps: toggle(record?.steps, i) })} />
                      I have done this step
                    </label>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="rubric-h" className="flex flex-col gap-3">
        <h2 id="rubric-h" className="text-2xl font-semibold tracking-tight">
          Check your work
        </h2>
        <p className={muted}>This is what a reviewer or interviewer looks for. Be honest: tick a line only when your project does what the strong column says.</p>
        <ul className="flex flex-col gap-3">
          {rubric.map((r, i) => (
            <li key={r.criterion} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <h3 className="font-semibold">{r.criterion}</h3>
              <div className="mt-2 grid gap-2 text-sm leading-6 sm:grid-cols-2">
                <p className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/40">
                  <span className="font-semibold text-emerald-900 dark:text-emerald-200">Strong: </span>
                  {r.strong}
                </p>
                <p className="rounded-xl bg-zinc-100 p-3 dark:bg-zinc-900">
                  <span className="font-semibold">Weak: </span>
                  {r.weak}
                </p>
              </div>
              <label className="mt-2 flex min-h-11 w-fit cursor-pointer items-center gap-2 text-sm font-medium">
                <input type="checkbox" className="size-5 accent-emerald-700" checked={met.has(i)} onChange={() => save({ rubric: toggle(record?.rubric, i) })} />
                My project meets this
              </label>
            </li>
          ))}
        </ul>
        <p className="text-sm" aria-live="polite">
          You meet <span className="font-semibold">{met.size}</span> of {rubric.length} criteria.
        </p>
      </section>

      <Submit record={record} onSubmit={(url) => save({ status: "done", url })} onReopen={() => save({ status: "building", url: undefined })} />
    </div>
  );
}

function Submit({ record, onSubmit, onReopen }: { record: ProjectProgress | undefined; onSubmit: (url: string) => void; onReopen: () => void }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <section aria-labelledby="submit-h" className="flex flex-col gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 md:p-5 dark:border-amber-800 dark:bg-amber-950/30">
      <h2 id="submit-h" className="text-2xl font-semibold tracking-tight">
        Submit your project
      </h2>
      {record?.status === "done" && record.url ? (
        <>
          <p className="leading-7" role="status">
            <Icon name="trophy" size={18} className="mr-1 inline" /> Project done. Your link:{" "}
            <a href={record.url} target="_blank" rel="noopener noreferrer" className={textLink}>
              {record.url}
            </a>
          </p>
          <p className={`text-sm ${muted}`}>Put this link on your CV and in your GitHub profile. It counts on every roadmap that has this project.</p>
          <button type="button" onClick={onReopen} className="w-fit text-sm underline underline-offset-2">
            Change the link
          </button>
        </>
      ) : (
        <form
          noValidate
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (!isProjectUrl(url)) {
              setError("Paste a full web link, such as https://github.com/you/project.");
              return;
            }
            setError(null);
            onSubmit(url.trim());
          }}
        >
          <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
            Link to your project (a repository, a demo or a write-up)
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "submit-error" : undefined}
              className="min-h-11 rounded-lg border border-zinc-300 bg-white px-3 font-normal dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="https://github.com/you/project"
            />
          </label>
          <button type="submit" className={primaryButton}>
            Mark project done
          </button>
        </form>
      )}
      {error && (
        <p id="submit-error" role="alert" className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}
