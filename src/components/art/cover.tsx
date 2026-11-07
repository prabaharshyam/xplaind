// The picture on a card: a flat tint of the topic colour with a minimal line scene, drawn in
// code (line-art.tsx), so it costs nothing to host and never breaks. Decorative.
import { type IconName, type ThemeId, themeOf } from "@/lib/themes";
import { Icon } from "./icons";
import { LineScene, sceneFor } from "./line-art";

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
  plain = false,
}: {
  theme: ThemeId;
  seed: string;
  /** Shows this icon in a tile instead of the line scene. */
  icon?: IconName;
  className?: string;
  iconSize?: number;
  /** A short word on the picture, such as the provider, so similar covers tell apart. */
  label?: string;
  /** Only the flat tint: no scene and no icon. */
  plain?: boolean;
}) {
  const t = themeOf(theme);
  // BR-4 (2026-11-07, owner request): a flat tint of the topic colour with a minimal line scene
  // in that colour. A role or project has its own scene (line-art.tsx), a topic has one, and a
  // card that names an icon explicitly still gets that icon in a tile.
  return (
    <div
      className={`relative overflow-hidden bg-[var(--cover-bg)] text-[var(--cover)] [--cover-bg:color-mix(in_srgb,var(--cover)_9%,white)] dark:text-[color-mix(in_srgb,var(--cover)_55%,white)] dark:[--cover-bg:color-mix(in_srgb,var(--cover)_18%,#18181b)] ${className}`}
      style={{ "--cover": t.from } as React.CSSProperties}
      aria-hidden="true"
    >
      {!plain && !icon && <LineScene scene={sceneFor(seed, theme)} className="absolute inset-0 size-full" />}
      {!plain && icon && (
        <div className="absolute inset-0 grid place-items-center">
          <span className="grid place-items-center rounded-2xl bg-white p-3 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700">
            <Icon name={icon} size={Math.round(iconSize * 0.7)} strokeWidth={1.8} />
          </span>
        </div>
      )}
      {label && (
        <span className="absolute bottom-2 left-2 max-w-[85%] truncate rounded-2xl bg-black/55 px-2 py-0.5 text-xs font-semibold text-white">{label}</span>
      )}
    </div>
  );
}
