import { Icon } from "@/components/art/icons";
import { ResourceNotice, resourceFacts, type ResourceCardData } from "@/components/resource-card";
import { textLink } from "@/components/ui";
import { WatchButton } from "@/components/video-player";

/** Videos are minutes long, courses hours. */
export function duration(hours: number): string {
  const mins = Math.round(hours * 60);
  if (mins < 90) return `${mins} min`;
  return `about ${Math.round(hours * 10) / 10} hours`;
}

/**
 * RM-4: every video lesson and course for the lesson, in the side panel so learners see
 * at once that there is something to watch. YouTube plays here; the rest open in a new tab.
 */
export function LearnPanel({ stopId, items, headingId }: { stopId: string; items: ResourceCardData[]; headingId: string }) {
  if (items.length === 0) return null;
  const videos = items.filter((r) => /video/i.test(r.kindLabel)).length;
  return (
    <section aria-labelledby={headingId} className="rounded-2xl border border-rose-200 bg-gradient-to-b from-rose-50 to-white p-4 dark:border-rose-900 dark:from-rose-950/30 dark:to-zinc-950">
      <h2 id={headingId} className="flex items-center gap-2 text-sm font-semibold">
        <span className="grid size-7 place-items-center rounded-full bg-rose-600 text-white">
          <Icon name="play" size={13} />
        </span>
        Watch &amp; learn
      </h2>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        {videos > 0 ? `${videos} video ${videos === 1 ? "lesson" : "lessons"} and more for this topic.` : "Hand-picked for this topic."}
      </p>
      <ul className="mt-3 flex flex-col gap-3">
        {items.map((r, i) => (
          <li key={r.id} className="rounded-xl bg-white p-3 shadow-sm dark:bg-zinc-900">
            <p className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
              <span className={/video/i.test(r.kindLabel) ? "text-rose-700 dark:text-rose-300" : "text-emerald-800 dark:text-emerald-300"}>{r.kindLabel}</span>
              {i === 0 && <span className="rounded-full bg-zinc-900 px-1.5 py-px text-[10px] text-white dark:bg-white dark:text-zinc-900">Start here</span>}
            </p>
            <p className="mt-1 text-sm leading-5 font-medium">{r.title}</p>
            <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
              {r.provider} · {duration(r.hours)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              {r.embed && (
                <WatchButton
                  embed={r.embed}
                  title={r.title}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
                />
              )}
              <a href={`/go/${r.id}?stop=${encodeURIComponent(stopId)}`} target="_blank" rel="noopener" className={`text-xs ${textLink}`}>
                {r.embed ? "Open on YouTube" : /video/i.test(r.kindLabel) ? "Watch it" : "Open it"}
                <span className="sr-only">: {r.title} (opens in a new tab)</span>
              </a>
            </div>
            {r.notice && <ResourceNotice text={r.notice} compact />}
            {/* RM-4: every resource's facts, one tap away. */}
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300">
                Details<span className="sr-only">: {r.title}</span>
              </summary>
              {r.affiliate && <p className="mt-1 rounded bg-amber-100 px-1.5 py-0.5 text-amber-950 dark:bg-amber-950 dark:text-amber-100">Affiliate link: we may earn a commission. It does not change our ranking.</p>}
              <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
                {resourceFacts(r).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-zinc-600 dark:text-zinc-400">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-1 text-zinc-700 dark:text-zinc-300">{r.why_picked}</p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
