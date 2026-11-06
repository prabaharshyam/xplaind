// RM-14: a lesson diagram, drawn on the server as SVG: white boxes, thin lines and arrows.
// No browser JavaScript. Phones get a top-to-bottom layout so a wide diagram stays readable.
import { useId } from "react";
import { type Flow, type FlowLayout, describeFlow, layoutFlow, parseFlow } from "@/lib/diagram/flow";

function path(points: { x: number; y: number }[]): string {
  if (points.length === 2) return `M${points[0].x},${points[0].y}L${points[1].x},${points[1].y}`;
  // A smooth line through dagre's points: straight runs with rounded bends.
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    const n = points[i + 1];
    d += `Q${p.x},${p.y} ${(p.x + n.x) / 2},${(p.y + n.y) / 2}`;
  }
  const last = points[points.length - 1];
  return `${d}L${last.x},${last.y}`;
}

function Svg({ layout, marker, className }: { layout: FlowLayout; marker: string; className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      width={layout.width}
      height={layout.height}
      className={`h-auto max-w-full shrink-0 ${className}`}
      // On a phone the text must stay readable: never shrink below 80%, scroll sideways instead.
      style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif", minWidth: Math.round(layout.width * 0.8) }}
    >
      <defs>
        <marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M1,1 L9,5 L1,9" fill="none" className="stroke-zinc-400 dark:stroke-zinc-500" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>
      {layout.edges.map((e, i) => (
        <g key={i}>
          <path d={path(e.points)} fill="none" className="stroke-zinc-300 dark:stroke-zinc-600" strokeWidth="1.5" markerEnd={`url(#${marker})`} />
          {e.label && e.lx !== undefined && e.ly !== undefined && (
            <g>
              <rect x={e.lx - (e.label.length * 6.4 + 12) / 2} y={e.ly - 10} width={e.label.length * 6.4 + 12} height="20" rx="10" className="fill-white dark:fill-zinc-900" />
              <text x={e.lx} y={e.ly + 4} textAnchor="middle" fontSize="12" fontWeight="500" className="fill-violet-800 dark:fill-violet-300">
                {e.label}
              </text>
            </g>
          )}
        </g>
      ))}
      {layout.nodes.map((n) => {
        const top = n.y - n.h / 2;
        const textH = n.lines.length * 19 + (n.noteLines.length ? n.noteLines.length * 16 + 4 : 0);
        const start = n.y - textH / 2 + 14;
        return (
          <g key={n.id}>
            <rect
              x={n.x - n.w / 2}
              y={top}
              width={n.w}
              height={n.h}
              rx={n.decision ? n.h / 2 : 12}
              className={n.decision ? "fill-violet-50 stroke-violet-300 dark:fill-violet-950 dark:stroke-violet-800" : "fill-white stroke-zinc-200 dark:fill-zinc-900 dark:stroke-zinc-700"}
              strokeWidth="1.25"
              style={{ filter: "drop-shadow(0 1px 1.5px rgb(9 9 11 / 0.06))" }}
            />
            {n.lines.map((l, k) => (
              <text key={k} x={n.x} y={start + k * 19} textAnchor="middle" fontSize="14" fontWeight="600" className="fill-zinc-900 dark:fill-zinc-100">
                {l}
              </text>
            ))}
            {n.noteLines.map((l, k) => (
              <text key={`n${k}`} x={n.x} y={start + n.lines.length * 19 + 4 + k * 16} textAnchor="middle" fontSize="12" className="fill-zinc-600 dark:fill-zinc-400">
                {l}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

/** About the width of the lesson column, in px. */
const FIT = 720;

export function FlowDiagram({ source }: { source: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  let flow: Flow;
  try {
    flow = parseFlow(source);
  } catch {
    // content:validate stops a bad diagram before release; never break the page over one.
    return <pre className="whitespace-pre-wrap">{source}</pre>;
  }
  // The author's direction on a big screen when it fits the lesson column; otherwise, and on
  // phones, whichever direction is narrower.
  const own = layoutFlow(flow);
  const other = layoutFlow(flow, flow.dir === "LR" ? "TB" : "LR");
  const narrow = other.width < own.width ? other : own;
  const wide = own.width <= FIT ? own : narrow;
  const tall = narrow !== wide ? narrow : null;
  const words = describeFlow(flow);
  return (
    <figure className="not-prose my-5 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 md:p-6 dark:border-zinc-800 dark:bg-zinc-950/40">
      {flow.title && <figcaption className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{flow.title}</figcaption>}
      <div tabIndex={0} role="group" aria-label={`Diagram${flow.title ? `: ${flow.title}` : ""}. Scroll sideways if it is wider than the screen.`} className="-mx-1 flex overflow-x-auto px-1 pb-1 focus-visible:outline-2 focus-visible:outline-violet-700 [&>svg]:mx-auto">
        <Svg layout={wide} marker={`a${id}w`} className={tall ? "hidden sm:block" : ""} />
        {tall && <Svg layout={tall} marker={`a${id}t`} className="sm:hidden" />}
      </div>
      <ol className="sr-only">
        {words.map((w, i) => (
          <li key={i}>{w}</li>
        ))}
      </ol>
    </figure>
  );
}
