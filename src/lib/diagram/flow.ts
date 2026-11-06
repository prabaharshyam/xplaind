// RM-14: lesson diagrams written as short text in a ```flow block, laid out here and drawn as SVG.
// Pure: no React, no DOM, so content:validate and unit tests can run it.
//
//   title: Retry with backoff            (optional)
//   dir: LR                              (optional; TB, top to bottom, is the default)
//   Call the model API -> Success?
//   Success? -[yes]-> Use the result | log tokens and cost
//   Success? -[no]-> Retryable?
//
// A node is named by its text; "Name | note" adds a smaller second line. A name ending in "?"
// is a decision. "a -> b -> c" chains steps; "-[label]->" labels an arrow.
import dagre from "@dagrejs/dagre";

export type FlowNode = { id: string; label: string; note?: string; decision: boolean };
export type FlowEdge = { from: string; to: string; label?: string };
export type Flow = { title?: string; dir: "TB" | "LR"; nodes: FlowNode[]; edges: FlowEdge[] };

const EDGE = /\s+-(?:\[([^\]]*)\]-)?>\s+/;

export class FlowError extends Error {}

export function parseFlow(src: string): Flow {
  const nodes = new Map<string, FlowNode>();
  const edges: FlowEdge[] = [];
  let title: string | undefined;
  let dir: Flow["dir"] = "TB";

  const node = (raw: string, line: number): string => {
    const [name, ...rest] = raw.split("|");
    const label = name.trim();
    const note = rest.join("|").trim() || undefined;
    if (!label) throw new FlowError(`line ${line}: a step has no text`);
    if (label.length > 80) throw new FlowError(`line ${line}: "${label.slice(0, 30)}…" is too long for a box (80 characters at most)`);
    const old = nodes.get(label);
    if (old && note && old.note && old.note !== note) throw new FlowError(`line ${line}: "${label}" has two different notes`);
    nodes.set(label, { id: label, label, note: note ?? old?.note, decision: label.endsWith("?") });
    return label;
  };

  src.split(/\r?\n/).forEach((text, i) => {
    const line = i + 1;
    const t = text.trim();
    if (!t || t.startsWith("#")) return;
    const meta = t.match(/^(title|dir):\s*(.+)$/);
    if (meta) {
      if (meta[1] === "title") title = meta[2].trim();
      else if (meta[2].trim() === "LR" || meta[2].trim() === "TB") dir = meta[2].trim() as Flow["dir"];
      else throw new FlowError(`line ${line}: dir must be LR or TB`);
      return;
    }
    const parts = t.split(EDGE);
    // split with one capture group gives [node, label, node, label, node, ...]
    let prev = node(parts[0], line);
    for (let k = 1; k < parts.length; k += 2) {
      const next = node(parts[k + 1] ?? "", line);
      const label = parts[k]?.trim() || undefined;
      edges.push({ from: prev, to: next, label });
      prev = next;
    }
  });

  if (nodes.size < 2) throw new FlowError("a diagram needs at least two steps");
  if (nodes.size > 24) throw new FlowError(`a diagram has ${nodes.size} steps; keep it to 24 or split it`);
  return { title, dir, nodes: [...nodes.values()], edges };
}

/** Splits text into lines of at most `max` characters, at spaces. */
export function wrap(text: string, max: number): string[] {
  const out: string[] = [];
  let cur = "";
  for (const word of text.split(/\s+/)) {
    if (cur && (cur + " " + word).length > max) {
      out.push(cur);
      cur = word;
    } else cur = cur ? `${cur} ${word}` : word;
  }
  if (cur) out.push(cur);
  return out;
}

export type PlacedNode = FlowNode & { x: number; y: number; w: number; h: number; lines: string[]; noteLines: string[] };
export type PlacedEdge = FlowEdge & { points: { x: number; y: number }[]; lx?: number; ly?: number };
export type FlowLayout = { width: number; height: number; nodes: PlacedNode[]; edges: PlacedEdge[] };

/** Approximate text widths for the 14px and 12px sans fonts the diagram uses. */
const CHAR = 7.4;
const NOTE_CHAR = 6.4;
const LINE = 19;
const NOTE_LINE = 16;
const PAD_X = 16;
const PAD_Y = 12;

export function layoutFlow(flow: Flow, dir: Flow["dir"] = flow.dir): FlowLayout {
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({ rankdir: dir, nodesep: dir === "LR" ? 22 : 30, ranksep: dir === "LR" ? 46 : 40, edgesep: 14, marginx: 4, marginy: 4 });
  g.setDefaultEdgeLabel(() => ({}));
  const max = dir === "LR" ? 18 : 20;
  const info = new Map<string, { lines: string[]; noteLines: string[]; w: number; h: number }>();
  for (const n of flow.nodes) {
    const lines = wrap(n.label, max);
    const noteLines = n.note ? wrap(n.note, max + 4) : [];
    const textW = Math.max(...lines.map((l) => l.length * CHAR), ...noteLines.map((l) => l.length * NOTE_CHAR), 40);
    const w = Math.round(textW + 2 * PAD_X);
    const h = Math.round(lines.length * LINE + noteLines.length * NOTE_LINE + (noteLines.length ? 4 : 0) + 2 * PAD_Y);
    info.set(n.id, { lines, noteLines, w, h });
    g.setNode(n.id, { width: w, height: h });
  }
  flow.edges.forEach((e, i) => {
    const label = e.label ? { width: e.label.length * NOTE_CHAR + 12, height: 20, labelpos: "c" } : {};
    g.setEdge(e.from, e.to, label, `e${i}`);
  });
  dagre.layout(g);
  const graph = g.graph();
  const nodes = flow.nodes.map((n) => {
    const p = g.node(n.id);
    const s = info.get(n.id)!;
    return { ...n, ...s, x: p.x, y: p.y };
  });
  const edges = flow.edges.map((e, i) => {
    const p = g.edge({ v: e.from, w: e.to, name: `e${i}` }) as { points: { x: number; y: number }[]; x?: number; y?: number };
    return { ...e, points: p.points, lx: p.x, ly: p.y };
  });
  return { width: Math.ceil(graph.width ?? 0), height: Math.ceil(graph.height ?? 0), nodes, edges };
}

/** The diagram as plain sentences, for screen readers and search engines. */
export function describeFlow(flow: Flow): string[] {
  const name = (id: string) => {
    const n = flow.nodes.find((x) => x.id === id)!;
    return n.note ? `${n.label} (${n.note})` : n.label;
  };
  const lines = flow.edges.map((e) => `${name(e.from)} ${e.label ? `→ ${e.label} →` : "→"} ${name(e.to)}`);
  const linked = new Set(flow.edges.flatMap((e) => [e.from, e.to]));
  for (const n of flow.nodes) if (!linked.has(n.id)) lines.push(name(n.id));
  return lines;
}
