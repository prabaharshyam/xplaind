"use client";
// MB-12: asks before any picture leaves the device, and reads picture pages for Pro learners.
import Link from "next/link";
import { useState } from "react";
import { primaryButton, secondaryButton } from "@/components/ui";
import { MAX_PICTURE_PAGES, type PicturePage, mergePicturePages, readPictures } from "@/lib/book/pictures";
import type { BookPage } from "@/lib/book/chunk";

export function PicturePanel({ title, pages, pictures, more, onDone, onSkip }: {
  title: string;
  pages: BookPage[];
  pictures: PicturePage[];
  more: number;
  onDone: (pages: BookPage[]) => void;
  onSkip: () => void;
}) {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [stop, setStop] = useState<{ message: string; upgrade?: string; signin?: boolean } | null>(null);
  const n = pictures.length;

  const go = async () => {
    setStop(null);
    const result = await readPictures(pictures, (done, total) => setProgress({ done, total }));
    setProgress(null);
    if (result.stopped && result.pages.length === 0) {
      setStop(result.stopped);
      return;
    }
    // Pages read before a problem are still kept; the rest carry on as text only.
    onDone(mergePicturePages(pages, result.pages));
  };

  return (
    <section aria-labelledby="pic-h" className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 id="pic-h" className="text-xl font-semibold">
        {n} {n === 1 ? "page in" : "pages in"} “{title}” {n === 1 ? "is a picture" : "are pictures"}
      </h2>
      <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">
        Scans, photos and pictures inside slides have no text we can read on your device. With Pro, our AI can read them for you.
      </p>
      <p className="mt-2 rounded-2xl bg-amber-50 p-3 text-sm leading-6 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
        Only these {n} {n === 1 ? "picture" : "pictures"} will be sent to our AI to read, a few at a time. Nothing is saved on our servers. The rest of your file stays on your device.
      </p>
      {more > 0 && (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {more} more {more === 1 ? "page is" : "pages are"} left out: one upload reads up to {MAX_PICTURE_PAGES} pictures.
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className={primaryButton} disabled={progress !== null} onClick={() => void go()}>
          {progress ? "Reading…" : "Read the pictures (Pro)"}
        </button>
        <button type="button" className={secondaryButton} disabled={progress !== null} onClick={onSkip}>
          Skip, use the text only
        </button>
      </div>
      {progress && (
        <p role="status" className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
          Read {progress.done} of {progress.total} pictures…
        </p>
      )}
      {stop && (
        <p role="alert" className="mt-3 text-sm text-rose-800 dark:text-rose-300">
          {stop.message}{" "}
          {stop.signin && <Link href="/signin?next=/ai/book" className="font-medium underline underline-offset-2">Sign in</Link>}
          {stop.upgrade && <Link href={stop.upgrade} className="font-medium underline underline-offset-2">See Pro</Link>}
        </p>
      )}
    </section>
  );
}
