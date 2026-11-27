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
  const select = "min-h-11 w-full min-w-0 rounded-2xl border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950 text-base sm:text-sm";

  return (
    <div className="flex flex-col gap-4">
      {/* PJ-1 (2026-11-27, owner: "fix/do the 4-12", item 6): one toolbar and compact rows instead of picture cards. */}
      <div className="grid grid-cols-2 gap-2 sm:max-w-xl">
        <label>
          <span className="sr-only">Role</span>
          <select aria-label="Role" value={path} onChange={(e) => setPath(e.target.value)} className={select}>
            <option value="">All roles</option>
            {paths.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Difficulty</span>
          <select aria-label="Difficulty" value={level} onChange={(e) => setLevel(e.target.value as "" | Difficulty)} className={select}>
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
      <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
        {shown.map((p) => {
          const record = progress.projects?.[guideKey(p.id)];
          return (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                className="group flex gap-4 rounded-2xl py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
              >
                {/* BR-4: the line graphic stays beside each project on wider screens; on a phone it only pushed the list down (UX-10). */}
                <Cover theme={p.theme} seed={p.id} className="h-20 w-36 shrink-0 rounded-2xl max-sm:hidden" iconSize={24} />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-lg leading-snug font-semibold group-hover:underline">{p.title}</span>
                  <span className={`text-sm ${muted}`}>
                    {DIFFICULTY_LABEL[p.difficulty]} · about {p.hours} hours · {p.steps} steps
                    {record && (
                      <span className={record.status === "done" ? "font-medium text-emerald-800 dark:text-emerald-300" : "font-medium text-amber-900 dark:text-amber-200"}>
                        {" "}
                        · {STATUS[record.status]}
                      </span>
                    )}
                  </span>
                  <span className="line-clamp-2 text-zinc-800 dark:text-zinc-200">{p.summary}</span>
                  <span className={`text-xs ${muted}`}>{p.where.join(" · ")}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
