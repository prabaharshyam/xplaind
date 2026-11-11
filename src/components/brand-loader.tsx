// UX-2: the loading mark. A small road (the site's road motif) with a violet dot travelling along it,
// so waiting looks like moving forward. Pure CSS; under reduced motion the dot rests and only fades.

export function BrandLoader({ label = "Loading", size = 64 }: { label?: string; size?: number }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="xp-loader">
        <path className="xp-loader-road" d="M10 50 C 22 50, 18 30, 32 30 S 42 12, 54 12" />
        <path className="xp-loader-trail" pathLength="100" d="M10 50 C 22 50, 18 30, 32 30 S 42 12, 54 12" />
        <circle className="xp-loader-dot" r="4.5">
          <animateMotion dur="1.4s" repeatCount="indefinite" path="M10 50 C 22 50, 18 30, 32 30 S 42 12, 54 12" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.45 0 0.2 1" />
        </circle>
      </svg>
      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}…</span>
    </div>
  );
}
