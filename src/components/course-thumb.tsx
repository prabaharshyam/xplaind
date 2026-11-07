import Image from "next/image";
import { Icon } from "@/components/art/icons";
import type { Embed } from "@/lib/content/media";

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
          <span className={`grid place-items-center rounded-full bg-violet-700/95 text-white ${size ==="sm" ? "size-8" : "size-11"}`}>
            <Icon name="play" size={size === "sm" ? 12 : 18} />
          </span>
        </span>
        <span className="absolute right-1.5 bottom-1.5 rounded bg-black/75 px-1.5 py-0.5 text-xs font-semibold text-white">{length(hours)}</span>
      </div>
    );
  }
  // 2026-11-07, owner request (DataCamp-style, minimal): a plain grey tile with the provider's name.
  return (
    <div aria-hidden="true" className={`flex flex-col justify-between overflow-hidden border-b border-zinc-200 bg-zinc-50 p-3 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 ${className}`}>
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{kindLabel}</span>
      <span className={`leading-tight font-semibold text-balance ${size === "sm" ? "text-sm" : "text-lg"}`}>{provider}</span>
      <span className="text-xs text-zinc-600 dark:text-zinc-400">
        {length(hours)}
        {certificate && " · With certificate"}
      </span>
    </div>
  );
}
