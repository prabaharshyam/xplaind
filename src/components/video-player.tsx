"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/art/icons";
import { type Embed, embedSrc } from "@/lib/content/media";

/**
 * RM-4: plays a YouTube video lesson in a window on our page, so the learner never leaves
 * Xplaind. Nothing loads from YouTube until they press play, and closing the window removes
 * the player, which stops the video.
 */
export function WatchButton({ embed, title, className = "", onWatch }: { embed: Embed; title: string; className?: string; onWatch?: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const titleId = useId();

  // A modal left open makes the rest of the page inert; always close it when this unmounts.
  useEffect(() => {
    const d = dialog.current;
    return () => d?.close();
  }, []);

  const show = () => {
    setOpen(true);
    dialog.current?.showModal();
    onWatch?.();
  };

  return (
    <>
      <button
        type="button"
        onClick={show}
        className={
          className ||
          "inline-flex min-h-12 items-center gap-2 rounded-lg bg-rose-600 px-5 py-3 font-medium text-white hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
        }
      >
        <Icon name="play" size={16} /> Watch here<span className="sr-only">: {title}</span>
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
        className="m-auto w-[min(960px,calc(100vw-1rem))] max-w-none rounded-2xl bg-black p-0 text-white backdrop:bg-black/80"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-2">
          <p id={titleId} className="min-w-0 truncate text-sm font-medium">
            Video lesson: {title}
          </p>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
            aria-label="Close the video"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="aspect-video w-full bg-black">
          {open && (
            <iframe
              src={embedSrc(embed)}
              title={`Video lesson: ${title}`}
              className="size-full"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          )}
        </div>
        <p className="px-4 py-2 text-xs text-zinc-400">Plays from YouTube. Press Esc or the close button to stop.</p>
      </dialog>
    </>
  );
}
