// Original line icons (24 by 24, stroke follows currentColor). Decorative unless a
// label is given, so screen readers skip them by default.
import type { IconName } from "@/lib/themes";

type Shape = { d?: string; circles?: [number, number, number][]; rects?: [number, number, number, number, number][] };

const SHAPES: Record<IconName, Shape> = {
  sparkles: { d: "M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" },
  chat: { d: "M4 5h16v10H9l-5 4z M8 9h8 M8 12h5" },
  code: { d: "M8 7l-5 5 5 5 M16 7l5 5-5 5 M14 4l-4 16" },
  table: { d: "M3 10h18 M3 15h18 M9 5v14", rects: [[3, 5, 18, 14, 2]] },
  bolt: { d: "M13 2L4 14h7l-1 8 9-12h-7z" },
  search: { d: "M15 15l6 6", circles: [[10, 10, 6]] },
  robot: { d: "M12 5v3 M10 13h.01 M14 13h.01 M10 16h4 M4 12v3 M20 12v3", rects: [[6, 8, 12, 10, 3]], circles: [[12, 4, 1]] },
  check: { d: "M4 6h10 M4 12h10 M4 18h6 M15 17l2 2 4-4" },
  rocket: { d: "M12 15l-3-3c1-4 4-8 10-9-1 6-5 9-9 10z M9 12l-4 1 2-4h4 M12 15l-1 4 4-2v-4 M6 18l-2 2", circles: [[15, 8, 1.5]] },
  shield: { d: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2 2 4-4" },
  scale: { d: "M12 4v16 M7 20h10 M5 7h14 M5 7l-3 6h6z M19 7l-3 6h6z" },
  neural: { d: "M7 7l3.5 4 M7 17l3.5-4 M13.5 11L17 7 M13.5 13L17 17", circles: [[5, 6, 2], [5, 18, 2], [12, 12, 2], [19, 6, 2], [19, 18, 2]] },
  flow: { d: "M7 10v4a3 3 0 003 3h4 M17 14v-4a3 3 0 00-3-3h-4", rects: [[4, 4, 6, 6, 1.5], [14, 14, 6, 6, 1.5]] },
  target: { circles: [[12, 12, 9], [12, 12, 5], [12, 12, 1.5]] },
  people: { d: "M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6 M15.5 14.2c3 .2 5.5 2.6 5.5 5.8", circles: [[9, 8, 3], [17, 9, 2.5]] },
  star: { d: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" },
  map: { d: "M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z M9 4v14 M15 6v14" },
  mic: { d: "M5 11a7 7 0 0014 0 M12 18v3", rects: [[9, 3, 6, 12, 3]] },
  book: { d: "M4 19V5a2 2 0 012-2h13v16H6a2 2 0 00-2 2 2 2 0 002 2h13 M8 7h7" },
  trophy: { d: "M8 4h8v5a4 4 0 01-8 0z M8 6H4a3 3 0 004 4 M16 6h4a3 3 0 01-4 4 M12 13v4 M8 21h8 M10 17h4v4" },
  fire: { d: "M12 21c4 0 7-3 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8 0 4 3 7 7 7z" },
  play: { d: "M7 4l13 8-13 8z" },
  tick: { d: "M5 12.5l4.5 4.5L19 7" },
  skip: { d: "M5 5l9 7-9 7z M18 5v14" },
  cert: { d: "M8 7h8 M8 10h5 M10 15l-1 6 3-2 3 2-1-6", rects: [[5, 3, 14, 12, 2]] },
  lock: { d: "M8 11V7a4 4 0 018 0v4", rects: [[5, 11, 14, 10, 2]] },
  compass: { d: "M15.5 8.5l-2 5-5 2 2-5z", circles: [[12, 12, 9]] },
};

export function Icon({
  name,
  size = 24,
  strokeWidth = 1.8,
  className,
  label,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** Give a label only when the icon carries meaning on its own. */
  label?: string;
}) {
  const s = SHAPES[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {s.d && <path d={s.d} />}
      {s.circles?.map(([cx, cy, r]) => <circle key={`${cx}-${cy}-${r}`} cx={cx} cy={cy} r={r} />)}
      {s.rects?.map(([x, y, w, h, rx]) => <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx={rx} />)}
    </svg>
  );
}
