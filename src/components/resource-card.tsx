// RM-4 resource card. A plain component: rendered on the server for the static
// page and by the stop's client island when "Free only" reorders the list.
import Link from "next/link";
import { Cover } from "@/components/art/cover";
import { WatchButton } from "@/components/video-player";
import { type Embed, openLabel } from "@/lib/content/media";
import { costLabel, formatDay } from "@/lib/roadmap/cost";
import type { ThemeId } from "@/lib/themes";
import { muted, textLink } from "./ui";

export type ResourceCardData = {
  id: string;
  title: string;
  provider: string;
  type: string;
  level: string;
  cost: "free" | "free_cert_paid" | "paid";
  price_inr?: number;
  price_checked_on?: string;
  hours: number;
  language: string;
  certificate: boolean;
  affiliate: boolean;
  why_picked: string;
  /** Null until a person has opened the page and confirmed it (ED-4, isHumanName). */
  verifiedOn: string | null;
  /** Null until the weekly link check (ED-5) has run. */
  linkCheckedOn: string | null;
  /** The theme of the first lesson that uses it, for its cover art. */
  theme?: ThemeId;
  /** "Video lesson", "Course" and so on (media.ts). */
  kindLabel: string;
  /** Set when it can play on the page. */
  embed: Embed | null;
  /** A warning shown right under the link, such as an age limit. */
  notice?: string;
};

const languages = new Intl.DisplayNames(["en"], { type: "language" });
const languageName = (code: string) => {
  try {
    return languages.of(code) ?? code;
  } catch {
    return code;
  }
};

export function ResourceCard({
  r,
  role,
  stopId,
  today,
  onOpen,
}: {
  r: ResourceCardData;
  role: "primary" | "alternate" | "listing";
  /** The lesson the card sits on, for the click log. Omitted on the course list. */
  stopId?: string;
  today?: string;
  onOpen?: () => void;
}) {
  const cost = costLabel(r, today);
  const facts: [string, string][] = [
    ["Cost", cost.note ? `${cost.label} (${cost.note})` : cost.label],
    ["Time", `about ${r.hours} ${r.hours === 1 ? "hour" : "hours"}`],
    ["Language", languageName(r.language)],
    ["Certificate", r.certificate ? "Yes" : "No"],
    ["Level", r.level],
    ["Last verified", r.verifiedOn ? formatDay(r.verifiedOn) : "Not yet verified"],
    ["Link checked", r.linkCheckedOn ? formatDay(r.linkCheckedOn) : "Not checked yet"],
  ];

  return (
    <article className="lx-rise overflow-hidden rounded-2xl border border-zinc-200 sm:flex dark:border-zinc-800" aria-labelledby={`res-${r.id}`}>
      <Cover theme={r.theme ?? "ai-basics"} seed={r.id} className="h-24 shrink-0 sm:h-auto sm:w-36" iconSize={28} />
      <div className="min-w-0 flex-1 p-4">
      <p className="text-xs font-medium tracking-wide text-zinc-600 uppercase dark:text-zinc-400">
        {role === "primary" ? "Start here" : role === "alternate" ? "Alternative" : r.level}
      </p>
      <h3 id={`res-${r.id}`} className="mt-1 text-lg leading-7 font-semibold">
        {r.title}
      </h3>
      <p className={`text-sm ${muted}`}>
        {r.provider} · {r.kindLabel}
      </p>
      {r.affiliate && (
        <p className="mt-2 w-fit rounded bg-amber-100 px-2 py-0.5 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-100">
          Affiliate link: we may earn a commission. It does not change our ranking.
        </p>
      )}
      <p className="mt-3 leading-7">
        <span className="font-medium">Why we picked it:</span> {r.why_picked}
      </p>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm sm:grid-cols-[auto_1fr_auto_1fr]">
        {facts.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className={muted}>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {r.embed && <WatchButton embed={r.embed} title={r.title} onWatch={onOpen} />}
        <a
          href={stopId ? `/go/${r.id}?stop=${encodeURIComponent(stopId)}` : `/go/${r.id}`}
          target="_blank"
          rel="noopener"
          onClick={onOpen}
          className={
            r.embed
              ? `text-sm ${textLink}`
              : "inline-flex min-h-12 items-center rounded-lg bg-emerald-700 px-5 py-3 font-medium text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          }
        >
          {r.embed ? "Open on YouTube" : openLabel(r.kindLabel)}
          <span className="sr-only"> {r.title} (opens in a new tab)</span>
        </a>
        <Link href="/how-we-rank" className={`text-sm ${textLink}`}>
          How we rank
        </Link>
      </div>
      {r.notice && <ResourceNotice text={r.notice} />}
      </div>
    </article>
  );
}

/** A warning shown right under a resource's link, such as an age limit on the provider's site. */
export function ResourceNotice({ text, compact = false }: { text: string; compact?: boolean }) {
  return (
    <p role="note" className={`flex gap-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100 ${compact ? "mt-1.5 px-2 py-1.5 text-xs" : "mt-3 px-3 py-2 text-sm"}`}>
      <span aria-hidden="true" className="font-bold">!</span>
      <span>
        <span className="font-semibold">Please note: </span>
        {text}
      </span>
    </p>
  );
}
