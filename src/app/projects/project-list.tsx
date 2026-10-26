"use client";

import Link from "next/link";
import { useState } from "react";
import { Cover } from "@/components/art/cover";
import { muted } from "@/components/ui";
import { useProgress } from "@/lib/browser/hooks";
import { guideKey } from "@/lib/roadmap/view";
import type { ThemeId } from "@/lib/themes";
import { DIFFICULTY_LABEL, type Difficulty } from "./shared";

export type ProjectCardView = {
  id: string;
  title: string;
  summary: string;
  difficulty: Difficulty;
  hours: number;
  steps: number;
  theme: ThemeId;
  paths: string[];
  where: string[];
};

const STATUS = { building: "Building", done: "Done" } as const;

export function ProjectList({ projects, paths }: { projects: ProjectCardView[]; paths: { id: string; name: string }[] }) {
  const [path, setPath] = useState("");
  const [level, setLevel] = useState<"" | Difficulty>("");
  const progress = useProgress();
  const shown = projects.filter((p) => (!path || p.paths.includes(path)) && (!level || p.difficulty === level));
  const select = "min-h-11 rounded-lg border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Role
          <select value={path} onChange={(e) => setPath(e.target.value)} className={select}>
            <option value="">All roles</option>
            {paths.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Difficulty
          <select value={level} onChange={(e) => setLevel(e.target.value as "" | Difficulty)} className={select}>
            <option value="">Any difficulty</option>
            {(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((d) => (
              <option key={d} value={d}>
                {DIFFICULTY_LABEL[d]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className={`text-sm ${muted}`} aria-live="polite">
        {shown.length} {shown.length === 1 ? "project" : "projects"}
      </p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => {
          const record = progress.projects?.[guideKey(p.id)];
          return (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <Cover theme={p.theme} seed={p.id} className="h-28" iconSize={32} />
                <span className="flex flex-1 flex-col gap-2 p-4">
                  <span className="flex flex-wrap gap-1.5 text-xs font-medium">
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">{DIFFICULTY_LABEL[p.difficulty]}</span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">about {p.hours} hours</span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">{p.steps} steps</span>
                    {record && (
                      <span className={`rounded-full px-2 py-0.5 ${record.status === "done" ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200" : "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200"}`}>
                        {STATUS[record.status]}
                      </span>
                    )}
                  </span>
                  <span className="text-lg font-semibold leading-snug group-hover:underline">{p.title}</span>
                  <span className={`line-clamp-3 text-sm leading-6 ${muted}`}>{p.summary}</span>
                  <span className="mt-auto text-xs text-zinc-600 dark:text-zinc-400">{p.where.join(" · ")}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
