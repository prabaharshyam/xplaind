import Image from "next/image";
import { Icon } from "@/components/art/icons";
import type { Embed } from "@/lib/content/media";

/** Pastel pairs a provider's ticket can take; the provider's name picks one, so it is stable. */
const TICKETS = [
  { bg: "bg-violet-100 dark:bg-violet-950", ink: "text-violet-950 dark:text-violet-100", edge: "bg-violet-300 dark:bg-violet-700" },
  { bg: "bg-sky-100 dark:bg-sky-950", ink: "text-sky-950 dark:text-sky-100", edge: "bg-sky-300 dark:bg-sky-700" },
  { bg: "bg-emerald-100 dark:bg-emerald-950", ink: "text-emerald-950 dark:text-emerald-100", edge: "bg-emerald-300 dark:bg-emerald-700" },
  { bg: "bg-orange-100 dark:bg-orange-950", ink: "text-orange-950 dark:text-orange-100", edge: "bg-orange-300 dark:bg-orange-700" },
  { bg: "bg-pink-100 dark:bg-pink-950", ink: "text-pink-950 dark:text-pink-100", edge: "bg-pink-300 dark:bg-pink-700" },
  { bg: "bg-teal-100 dark:bg-teal-950", ink: "text-teal-950 dark:text-teal-100", edge: "bg-teal-300 dark:bg-teal-700" },
] as const;

const pick = (text: string) => {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TICKETS[h % TICKETS.length];
};

const length = (hours: number) => {
  const mins = Math.round(hours * 60);
  return mins < 90 ? `${Math.max(1, mins)} min` : `${Math.round(hours * 10) / 10} h`;
};

/**
 * RM-4: the picture on a course or video card. A YouTube video shows its own thumbnail, fetched
 * through our image server so the learner's browser does not contact YouTube until they press
 * play. Any other course shows a ticket in its provider's pastel: the provider's name, what kind
 * of resource it is and whether it gives a certificate.
 */
export function CourseThumb({
  provider,
  kindLabel,
  embed,
  hours,
  certificate,
  className = "",
  size = "md",
}: {
  provider: string;
  kindLabel: string;
  embed: Embed | null;
  hours: number;
  certificate: boolean;
  className?: string;
  size?: "sm" | "md";
}) {
  if (embed?.kind === "video") {
    return (
      <div aria-hidden="true" className={`relative overflow-hidden bg-zinc-200 dark:bg-zinc-800 ${className}`}>
        <Image
          src={`https://i.ytimg.com/vi/${embed.id}/hqdefault.jpg`}
          alt=""
          fill
          sizes={size === "sm" ? "160px" : "(max-width: 640px) 100vw, 320px"}
          className="object-cover"
        />
        <span className="absolute inset-0 grid place-items-center">
          <span className={`grid place-items-center rounded-full bg-rose-600/95 text-white shadow-lg ${size === "sm" ? "size-8" : "size-11"}`}>
            <Icon name="play" size={size === "sm" ? 12 : 18} />
          </span>
        </span>
        <span className="absolute right-1.5 bottom-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-white">{length(hours)}</span>
      </div>
    );
  }
  const t = pick(provider);
  return (
    <div aria-hidden="true" className={`relative flex overflow-hidden ${t.bg} ${className}`}>
      {/* the ticket's torn edge */}
      <span className={`w-2 shrink-0 ${t.edge}`} />
      <span className={`flex min-w-0 flex-1 flex-col justify-between p-3 ${t.ink}`}>
        <span className="text-[11px] font-semibold tracking-wide uppercase opacity-80">{kindLabel}</span>
        <span className={`leading-tight font-semibold text-balance ${size === "sm" ? "text-sm" : "text-lg"}`}>{provider}</span>
        <span className="flex items-center gap-2 text-[11px] font-medium opacity-90">
          {length(hours)}
          {certificate && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-1.5 py-0.5 dark:bg-black/30">
              <Icon name="cert" size={11} /> With certificate
            </span>
          )}
        </span>
      </span>
    </div>
  );
}
