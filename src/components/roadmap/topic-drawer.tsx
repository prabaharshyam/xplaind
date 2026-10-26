"use client";

import Link from "next/link";
import { type MouseEvent, type ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Cover } from "@/components/art/cover";
import { Icon } from "@/components/art/icons";
import type { DrawerCourse, TopicDetail } from "@/lib/content/drawer";
import { TopicStatus } from "./topic-status";
import { themeOf } from "@/lib/themes";

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  course: { label: "Course", cls: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200" },
  video: { label: "Video", cls: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200" },
  article: { label: "Article", cls: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200" },
  docs: { label: "Official docs", cls: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200" },
  book: { label: "Book", cls: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200" },
  repo: { label: "Code", cls: "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200" },
  tool: { label: "Tool", cls: "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200" },
};

type Ctx = { open: (id: string) => void };
const DrawerContext = createContext<Ctx | null>(null);

/**
 * Lets topics on a roadmap open a side panel instead of leaving the map. Topics stay
 * real links: without JavaScript, or with Ctrl, Cmd or a middle click, they open the
 * lesson page as usual.
 */
export function TopicDrawerProvider({ details, children }: { details: Record<string, TopicDetail>; children: ReactNode }) {
  const [id, setId] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const open = useCallback((next: string) => {
    opener.current = document.activeElement as HTMLElement | null;
    setId(next);
  }, []);
  useEffect(() => {
    if (id && !dialog.current?.open) dialog.current?.showModal();
  }, [id]);
  const close = () => dialog.current?.close();
  const detail = id ? details[id] : null;

  return (
    <DrawerContext.Provider value={{ open }}>
      {children}
      <dialog
        ref={dialog}
        aria-labelledby="drawer-title"
        onClose={() => {
          setId(null);
          opener.current?.focus();
        }}
        onClick={(e) => {
          if (e.target === dialog.current) close();
        }}
        className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-xl overflow-y-auto bg-white p-0 text-zinc-900 shadow-2xl backdrop:bg-black/40 dark:bg-zinc-950 dark:text-zinc-100"
      >
        {detail && <DrawerBody d={detail} onClose={close} />}
      </dialog>
    </DrawerContext.Provider>
  );
}

/** Spread on a topic's link: a plain click opens the drawer. */
export function useTopicLink(id: string) {
  const ctx = useContext(DrawerContext);
  return {
    onClick: (e: MouseEvent<HTMLAnchorElement>) => {
      if (!ctx || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      ctx.open(id);
    },
  };
}

function DrawerBody({ d, onClose }: { d: TopicDetail; onClose: () => void }) {
  const theme = themeOf(d.theme);
  const best = d.courses.filter((c) => c.pick === "best");
  const also = d.courses.filter((c) => c.pick === "also");

  return (
    <div className="flex min-h-full flex-col">
      <div className="relative">
        <Cover theme={d.theme} seed={d.id} className="h-32" iconSize={40} />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 grid size-10 place-items-center rounded-full bg-black/40 text-xl text-white hover:bg-black/60"
        >
          <span aria-hidden="true">×</span>
          <span className="sr-only">Close</span>
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-5 p-5 md:p-6">
        <div>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {theme.label} · {d.level} · about {d.hours} {d.hours === 1 ? "hour" : "hours"}
          </p>
          <h2 id="drawer-title" className="mt-1 text-2xl font-semibold tracking-tight">
            {d.title}
          </h2>
          <p className="mt-2 text-lg leading-7">{d.outcome}</p>
        </div>

        <div>
          <TopicStatus stopId={d.id} title={d.title} />
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
            Done and Skip are your own call. Pass the lesson&apos;s check for full XP and level badges.
          </p>
        </div>

        <section aria-labelledby="why-h" className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900">
          <h3 id="why-h" className="font-semibold">
            Why it matters
          </h3>
          <p className="mt-1 leading-7 text-zinc-700 dark:text-zinc-300">{d.why}</p>
          {d.terms.length > 0 && (
            <p className="mt-3 flex flex-wrap gap-1.5">
              {d.terms.map((t) => (
                <span key={t} className="rounded-full bg-white px-2.5 py-0.5 text-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">
                  {t}
                </span>
              ))}
            </p>
          )}
        </section>

        <Link
          href={`/stop/${d.id}`}
          className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 font-medium text-white hover:bg-emerald-800"
        >
          <Icon name="book" size={18} /> Read the lesson and take the check
        </Link>

        <CourseList title="Best free course" items={best} tone="text-emerald-800 dark:text-emerald-400" />
        {also.length > 0 && <CourseList title="More free resources" items={also} tone="text-zinc-700 dark:text-zinc-300" />}

        {d.questions > 0 && (
          <Link href={`/stop/${d.id}#interview`} className="text-emerald-800 underline underline-offset-2 dark:text-emerald-400">
            {d.questions} interview {d.questions === 1 ? "question" : "questions"} on this topic
          </Link>
        )}
      </div>
    </div>
  );
}

function CourseList({ title, items, tone }: { title: string; items: DrawerCourse[]; tone: string }) {
  return (
    <section className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h3 className={`flex items-center gap-2 font-semibold ${tone}`}>
        <Icon name="star" size={16} /> {title}
      </h3>
      <ul className="mt-3 flex flex-col gap-3">
        {items.map((c) => {
          const badge = TYPE_BADGE[c.type] ?? TYPE_BADGE.course;
          return (
            <li key={c.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${badge.cls}`}>{badge.label}</span>
              <a href={`/go/${c.id}`} target="_blank" rel="noopener" className="font-medium underline underline-offset-2">
                {c.title}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <span className="w-full text-sm text-zinc-600 dark:text-zinc-400">
                {c.provider} · {c.cost} · about {c.hours} h{c.certificate ? " · certificate" : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
