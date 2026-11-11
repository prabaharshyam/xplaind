import { Icon } from "@/components/art/icons";
import { CourseThumb } from "@/components/course-thumb";
import { ResourceNotice, resourceFacts, type ResourceCardData } from "@/components/resource-card";
import { textLink, secondaryButtonSm } from "@/components/ui";
import { WatchButton } from "@/components/video-player";

/** Videos are minutes long, courses hours. */
export function duration(hours: number): string {
  const mins = Math.round(hours * 60);
  if (mins < 90) return `${mins} min`;
  return `about ${Math.round(hours * 10) / 10} hours`;
}

/**
 * RM-4: the lesson's videos, in the side panel so learners see at once that there is
 * something to watch. YouTube plays here. Courses and articles sit after the lesson text.
 */
export function LearnPanel({ stopId, items, headingId }: { stopId: string; items: ResourceCardData[]; headingId: string }) {
  if (items.length === 0) return null;
  const courses = items.filter((r) => r.kindLabel === "Video course").length;
  const videos = items.filter((r) => /video/i.test(r.kindLabel)).length - courses;
  const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const summary = [videos > 0 && count(videos, "video lesson", "video lessons"), courses > 0 && count(courses, "video course", "video courses")].filter(Boolean).join(" and ");
  return (
    <section aria-labelledby={headingId} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 id={headingId} className="flex items-center gap-2 text-sm font-semibold">
        <span className="grid size-7 place-items-center rounded-full bg-violet-700 text-white">
          <Icon name="play" size={13} />
        </span>
        Watch &amp; learn
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {`${summary} for this topic.`}
      </p>
      <ul className="mt-3 flex flex-col gap-3">
        {items.map((r, i) => (
          <li key={r.id} className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-950">
            {r.embed && <CourseThumb provider={r.provider} kindLabel={r.kindLabel} embed={r.embed} hours={r.hours} certificate={r.certificate} size="sm" className="mb-2 aspect-video rounded-2xl" />}
            <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
              <span className={/video/i.test(r.kindLabel) ? "text-violet-800 dark:text-violet-300" : "text-teal-800 dark:text-teal-300"}>{r.kindLabel}</span>
              {i === 0 && <span className="rounded-full bg-zinc-900 px-1.5 py-px text-xs text-white dark:bg-white dark:text-zinc-900">Start here</span>}
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
                  className={secondaryButtonSm}
                />
              )}
              {!r.embed && (
                <a href={`/go/${r.id}?stop=${encodeURIComponent(stopId)}`} target="_blank" rel="noopener" className={`inline-flex min-h-11 items-center text-sm ${textLink}`}>
                  {r.kindLabel === "Video course" ? "Start the course" : /video/i.test(r.kindLabel) ? "Watch it" : "Open it"}
                  <span className="sr-only">: {r.title} (opens in a new tab)</span>
                </a>
              )}
            </div>
            {r.notice && <ResourceNotice text={r.notice} compact />}
            {/* RM-4: every resource's facts, one tap away. */}
            <details className="mt-1 text-xs">
              <summary className="flex min-h-11 cursor-pointer items-center text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300">
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
