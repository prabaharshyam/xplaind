"use client";

import Link from "next/link";
import { primaryButton } from "@/components/ui";
import { type MouseEvent, type ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Cover } from "@/components/art/cover";
import { Icon } from "@/components/art/icons";
import type { DrawerCourse, TopicDetail } from "@/lib/content/drawer";
import { ResourceNotice } from "@/components/resource-card";
import { TopicStatus } from "./topic-status";
import { themeOf } from "@/lib/themes";
import { levelText } from "@/lib/levels";

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
  // When the learner follows a link out of the drawer, the roadmap page may stay
  // mounted but hidden (Cache Components). An open modal would then make the next
  // page inert, so close it whenever this page's effects stop.
  useEffect(() => {
    const d = dialog.current;
    return () => d?.close();
  }, []);
  const close = () => dialog.current?.close();
  const detail = id ? details[id] : null;

  return (
    <DrawerContext.Provider value={{ open }}>
      {children}
      <dialog
        ref={dialog}
        aria-labelledby="drawer-title"
        onClose={(e) => {
          // Only this panel closing, never a window inside it (such as a video), empties it.
          if (e.target !== e.currentTarget) return;
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
  // RM-13: the best pick first, then the rest; free ones and paid ones in their own dropdowns.
  const ordered = [...d.courses].sort((a, b) => (a.pick === b.pick ? 0 : a.pick === "best" ? -1 : 1));
  const free = ordered.filter((c) => c.free);
  const paid = ordered.filter((c) => !c.free);

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
            {theme.label} · {levelText(d.level)} · about {d.hours} {d.hours === 1 ? "hour" : "hours"}
          </p>
          <h2 id="drawer-title" className="mt-1 text-2xl font-semibold tracking-tight">
            {d.title}
          </h2>
        </div>

        <div>
          <TopicStatus stopId={d.id} title={d.title} />
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
            Done and Skip are your own call. The lesson&apos;s check tells you if you have it.
          </p>
        </div>

        <section aria-labelledby="what-h" className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900">
          <h3 id="what-h" className="font-semibold">
            What it is
          </h3>
          <p className="mt-1 leading-7 text-zinc-700 dark:text-zinc-300">{d.what}</p>
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
          className={primaryButton}
        >
          <Icon name="book" size={18} /> Read the full chapter
        </Link>

        {free.length > 0 && <CourseList title="Free resources" items={free} />}
        {paid.length > 0 && <CourseList title="Paid courses" items={paid} />}

        {d.questions > 0 && (
          <Link href={`/stop/${d.id}#interview`} className="text-violet-800 underline underline-offset-2 dark:text-violet-300">
            {d.questions} interview {d.questions === 1 ? "question" : "questions"} on this topic
          </Link>
        )}
      </div>
    </div>
  );
}

/** RM-13: a dropdown of resources, closed until the learner opens it, so the panel stays short. */
function CourseList({ title, items }: { title: string; items: DrawerCourse[] }) {
  return (
    <details className="group rounded-2xl border border-zinc-200 dark:border-zinc-800">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 font-semibold [&::-webkit-details-marker]:hidden">
        <span>
          {title} <span className="font-normal text-zinc-600 dark:text-zinc-400">({items.length})</span>
        </span>
        <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3 transition group-open:rotate-180">
          <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <ul className="flex flex-col gap-3 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
        {items.map((c) => {
          const badge = { ...(TYPE_BADGE[c.type] ?? TYPE_BADGE.course), label: c.kindLabel };
          return (
            <li key={c.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${badge.cls}`}>{badge.label}</span>
              {c.pick === "best" && <span className="rounded bg-violet-100 px-1.5 py-0.5 text-xs font-medium text-violet-900 dark:bg-violet-950 dark:text-violet-200">Best pick</span>}
              <a href={`/go/${c.id}`} target="_blank" rel="noopener" className="font-medium underline underline-offset-2">
                {c.title}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <span className="w-full text-sm text-zinc-600 dark:text-zinc-400">
                {c.provider} · {c.cost} · about {c.hours} h{c.certificate ? " · certificate" : ""}
              </span>
              {c.notice && <ResourceNotice text={c.notice} compact />}
            </li>
          );
        })}
      </ul>
    </details>
  );
}
