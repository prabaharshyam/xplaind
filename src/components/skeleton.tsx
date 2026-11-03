/**
 * A11Y-2: a calm placeholder while a part of the page loads, shaped like what is coming, so the
 * page never looks broken. Screen readers hear the label; the shimmer stops under reduced motion.
 */
export function Skeleton({ label, rows = 3, className = "" }: { label: string; rows?: number; className?: string }) {
  return (
    <div role="status" className={`flex flex-col gap-3 ${className}`}>
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="h-7 w-2/5 rounded-full bg-zinc-200 motion-safe:animate-pulse dark:bg-zinc-800" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} aria-hidden="true" className="h-20 rounded-2xl bg-zinc-100 motion-safe:animate-pulse dark:bg-zinc-900" />
      ))}
    </div>
  );
}
