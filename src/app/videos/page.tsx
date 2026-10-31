import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/art/icons";
import { PageHero } from "@/components/page-hero";
import { primaryButton, textLink } from "@/components/ui";
import { WatchButton } from "@/components/video-player";
import { getChannels } from "@/lib/content";
import { libraryItems, TOPIC_LABEL } from "@/lib/content/library";
import { themeOf } from "@/lib/themes";

export const metadata: Metadata = {
  title: "Video lessons from the best AI teachers on YouTube",
  description: "Krish Naik, Jeff Su, Tina Huang, CampusX, 3Blue1Brown and more: hand-picked AI video lessons that play right here on Xplaind.",
  alternates: { canonical: "/videos" },
};

/** RM-4: featured YouTube channels and their best videos, which play on Xplaind. */
export default function VideosPage() {
  const channels = getChannels();
  const total = libraryItems().filter((i) => i.kind === "video").length;
  return (
    <main>
      <PageHero
        theme="using-ai"
        seed="videos"
        icon="play"
        eyebrow="Video lessons"
        title="Learn AI from the best teachers on YouTube"
        lead="Hand-picked channels and their best videos. Press Watch here and the video plays on this page, so you never lose your place."
      >
        <Link href="/library?kind=video" className={primaryButton}>
          Browse all {total} video lessons by topic
        </Link>
      </PageHero>
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 md:px-6">
        {channels.map((c) => {
          const theme = themeOf(c.topics[0]);
          return (
            <section key={c.id} id={c.id} aria-labelledby={`${c.id}-h`} className="scroll-mt-24">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-center gap-4">
                  <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-2xl text-xl font-bold text-white shadow-md" style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}>
                    {c.name.replace(/[^A-Za-z0-9 ]/g, "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                  </span>
                  <div>
                    <h2 id={`${c.id}-h`} className="text-xl font-semibold">
                      {c.name}
                    </h2>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{c.about}</p>
                  </div>
                </div>
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  {c.topics.map((t) => (
                    <Link key={t} href={`/library?kind=video&topic=${t}`} className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-900 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-200">
                      #{TOPIC_LABEL[t]}
                    </Link>
                  ))}
                  <a href={c.url} target="_blank" rel="noopener" className={textLink}>
                    Channel on YouTube<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </p>
              </div>
              <ul className="lx-deal mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {c.videos.map((v) => (
                  <li key={v.youtube_id} className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
                    <p className="flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
                      <Icon name="play" size={12} /> Video lesson · {v.minutes < 90 ? `${v.minutes} min` : `${Math.round(v.minutes / 6) / 10} hours`}
                    </p>
                    <p className="leading-6 font-medium">{v.title}</p>
                    <WatchButton
                      embed={{ kind: "video", id: v.youtube_id }}
                      title={v.title}
                      className="mt-auto inline-flex min-h-10 items-center gap-1.5 self-start rounded-full bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
