// Generated cover art: a gradient in the theme's colours, soft shapes placed from a
// seed (so every course gets its own, stable look) and the theme's icon. Pure SVG,
// no image files, so it costs nothing to host and never breaks. Decorative.
import { type IconName, type ThemeId, themeOf } from "@/lib/themes";
import { Icon } from "./icons";

/** A small stable hash, so the same seed always gives the same picture. */
export function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function Cover({
  theme,
  seed,
  icon,
  className = "",
  iconSize = 56,
  label,
}: {
  theme: ThemeId;
  seed: string;
  /** Overrides the theme's icon. */
  icon?: IconName;
  className?: string;
  iconSize?: number;
  /** A short word on the picture, such as the provider, so similar covers tell apart. */
  label?: string;
}) {
  const t = themeOf(theme);
  // 2026-11-07, owner request (DataCamp-style, minimal): a flat tint of the theme colour with
  // its icon, no gradients or shapes. `seed` stays in the API so callers need not change.
  void seed;
  return (
    <div
      className={`relative overflow-hidden bg-[color-mix(in_srgb,var(--cover)_9%,white)] dark:bg-[color-mix(in_srgb,var(--cover)_18%,#18181b)] ${className}`}
      style={{ "--cover": t.from } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className="absolute inset-0 grid place-items-center">
        <span className="grid place-items-center rounded-2xl bg-white p-3 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700" style={{ color: t.from }}>
          <Icon name={icon ?? t.icon} size={Math.round(iconSize * 0.7)} strokeWidth={1.8} />
        </span>
      </div>
      {label && (
        <span className="absolute bottom-2 left-2 max-w-[85%] truncate rounded-2xl bg-black/55 px-2 py-0.5 text-xs font-semibold text-white">{label}</span>
      )}
    </div>
  );
}
