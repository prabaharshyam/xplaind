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
  const h = hash(seed);
  const pick = (shift: number, max: number) => ((h >>> shift) % 1000) / 1000 * max;
  const id = `g${h.toString(36)}`;
  const angle = Math.round(pick(0, 360));
  const circles = [
    { cx: 20 + pick(3, 120), cy: 10 + pick(7, 70), r: 40 + pick(11, 50) },
    { cx: 180 + pick(13, 130), cy: 90 + pick(17, 80), r: 30 + pick(19, 60) },
    { cx: 80 + pick(23, 160), cy: 130 + pick(29, 50), r: 12 + pick(5, 24) },
  ];
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 320 180"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full"
        style={{ filter: `hue-rotate(${Math.round(pick(21, 36)) - 18}deg)` }}
      >
        <defs>
          <linearGradient id={id} gradientTransform={`rotate(${angle} .5 .5)`}>
            <stop offset="0" stopColor={t.from} />
            <stop offset="1" stopColor={t.to} />
          </linearGradient>
          <pattern id={`${id}d`} width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="white" opacity=".18" />
          </pattern>
        </defs>
        <rect width="320" height="180" fill={`url(#${id})`} />
        <rect width="320" height="180" fill={`url(#${id}d)`} />
        {circles.map((c, i) => (
          <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill="white" opacity={0.08 + i * 0.04} />
        ))}
        <path d={`M0 ${140 + pick(2, 30)} Q 160 ${100 + pick(9, 60)} 320 ${130 + pick(15, 40)} V180 H0Z`} fill="black" opacity=".12" />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="grid place-items-center rounded-2xl bg-white/20 p-3 text-white shadow-lg ring-1 ring-white/40 backdrop-blur-sm">
          <Icon name={icon ?? t.icon} size={iconSize} strokeWidth={1.6} />
        </span>
      </div>
      {label && (
        <span className="absolute bottom-2 left-2 max-w-[85%] truncate rounded-md bg-black/55 px-2 py-0.5 text-xs font-semibold text-white">{label}</span>
      )}
    </div>
  );
}
