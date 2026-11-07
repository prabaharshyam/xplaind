// Minimal line graphics for the covers on the Roadmaps, Topics and Projects pages. A scene is
// one big glyph in the middle with a few smaller ones around it, joined by dotted lines, all
// drawn with the same thin stroke. Every glyph is a hand-drawn set of strokes in a 48 x 48 box.
// Decorative: the card always says in words what it is, so everything here is aria-hidden.
import type { ReactNode } from "react";

export type Glyph =
  | "code" | "nodes" | "bubble" | "sparkle" | "bars" | "trend" | "gear" | "shield" | "scales" | "target"
  | "loop" | "doc" | "db" | "rocket" | "cloud" | "lock" | "search" | "cube" | "layers" | "play" | "mic"
  | "tree" | "terminal" | "flow" | "bot" | "people" | "briefcase" | "book" | "coin" | "chip" | "pencil"
  | "branch" | "grid" | "server" | "checklist" | "shapes";

/** Each glyph is drawn around (0, 0), about 40 units across. */
const GLYPHS: Record<Glyph, ReactNode> = {
  code: <path d="M-10 -10 L-20 0 L-10 10 M10 -10 L20 0 L10 10 M3 -14 L-3 14" />,
  nodes: (
    <>
      <circle cx="-14" cy="9" r="4" />
      <circle cx="0" cy="-12" r="4" />
      <circle cx="15" cy="9" r="4" />
      <path d="M-11.5 5.5 L-3 -8.5 M3 -8.5 L12.5 5.5 M-10 9 H11" />
    </>
  ),
  bubble: (
    <>
      <path d="M-18 -14 H18 a4 4 0 0 1 4 4 V6 a4 4 0 0 1 -4 4 H-4 L-12 18 V10 H-18 a4 4 0 0 1 -4 -4 V-10 a4 4 0 0 1 4 -4 Z" />
      <path d="M-9 -2 h.01 M0 -2 h.01 M9 -2 h.01" />
    </>
  ),
  sparkle: <path d="M0 -20 C2 -7 7 -2 20 0 C7 2 2 7 0 20 C-2 7 -7 2 -20 0 C-7 -2 -2 -7 0 -20 Z" />,
  bars: (
    <>
      <rect x="-16" y="2" width="8" height="14" rx="2" />
      <rect x="-4" y="-8" width="8" height="24" rx="2" />
      <rect x="8" y="-18" width="8" height="34" rx="2" />
      <path d="M-20 20 H20" />
    </>
  ),
  trend: (
    <>
      <path d="M-20 12 L-8 0 L2 8 L18 -12" />
      <path d="M10 -12 H18 V-4" />
      <path d="M-20 20 H20" />
    </>
  ),
  gear: (
    <>
      <circle r="9" />
      <circle r="3.5" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <path key={a} d="M0 -13 V-18" transform={`rotate(${a})`} />
      ))}
    </>
  ),
  shield: (
    <>
      <path d="M0 -20 L16 -14 V2 C16 12 8 18 0 22 C-8 18 -16 12 -16 2 V-14 Z" />
      <path d="M-6 2 L-2 6 L7 -5" />
    </>
  ),
  scales: (
    <>
      <path d="M0 -18 V18 M-12 18 H12 M-18 -10 H18" />
      <path d="M-18 -10 L-24 4 H-12 Z M18 -10 L12 4 H24 Z" />
    </>
  ),
  target: (
    <>
      <circle r="16" />
      <circle r="9" />
      <circle r="2.5" />
      <path d="M4 -4 L19 -19 M13 -19 H19 V-13" />
    </>
  ),
  loop: <path d="M15 -5 A15 15 0 1 0 11 11 M15 -5 L14 -15 M15 -5 L5 -4" />,
  doc: (
    <>
      <path d="M-12 -18 H4 L14 -8 V18 H-12 Z M4 -18 V-8 H14" />
      <path d="M-6 3 H8 M-6 10 H8" />
    </>
  ),
  db: (
    <>
      <ellipse cx="0" cy="-12" rx="14" ry="5" />
      <path d="M-14 -12 V12 M14 -12 V12 M-14 0 A14 5 0 0 0 14 0 M-14 12 A14 5 0 0 0 14 12" />
    </>
  ),
  rocket: (
    <>
      <path d="M0 -20 C10 -12 10 4 6 12 H-6 C-10 4 -10 -12 0 -20 Z" />
      <circle cx="0" cy="-6" r="3" />
      <path d="M-6 8 L-13 14 H-6 M6 8 L13 14 H6 M-3 16 L0 22 L3 16" />
    </>
  ),
  cloud: <path d="M-14 12 H12 A8 8 0 0 0 12 -4 A12 12 0 0 0 -10 -2 A7 7 0 0 0 -14 12 Z" />,
  lock: (
    <>
      <rect x="-12" y="-2" width="24" height="18" rx="3" />
      <path d="M-7 -2 V-8 A7 7 0 0 1 7 -8 V-2 M0 5 V9" />
    </>
  ),
  search: (
    <>
      <circle cx="-3" cy="-3" r="12" />
      <path d="M6 6 L18 18" />
    </>
  ),
  cube: <path d="M0 -18 L16 -9 V9 L0 18 L-16 9 V-9 Z M-16 -9 L0 0 L16 -9 M0 0 V18" />,
  layers: <path d="M0 -16 L18 -7 L0 2 L-18 -7 Z M-18 1 L0 10 L18 1 M-18 9 L0 18 L18 9" />,
  play: (
    <>
      <rect x="-18" y="-12" width="36" height="24" rx="5" />
      <path d="M-4 -6 L7 0 L-4 6 Z" />
    </>
  ),
  mic: (
    <>
      <rect x="-5" y="-16" width="10" height="18" rx="5" />
      <path d="M-11 -2 A11 11 0 0 0 11 -2 M0 9 V17 M-6 17 H6" />
    </>
  ),
  tree: (
    <>
      <circle cx="0" cy="-14" r="4" />
      <circle cx="-14" cy="4" r="4" />
      <circle cx="14" cy="4" r="4" />
      <circle cx="-20" cy="20" r="3" />
      <circle cx="-8" cy="20" r="3" />
      <path d="M-3 -11 L-12 1 M3 -11 L12 1 M-16 8 L-19 17 M-12 8 L-9 17" />
    </>
  ),
  terminal: (
    <>
      <rect x="-20" y="-14" width="40" height="28" rx="4" />
      <path d="M-12 -4 L-6 2 L-12 8 M0 8 H10" />
    </>
  ),
  flow: (
    <>
      <rect x="-22" y="-6" width="12" height="12" rx="2" />
      <rect x="10" y="-6" width="12" height="12" rx="2" />
      <path d="M-10 0 H10 M6 -4 L10 0 L6 4" />
      <path d="M-16 6 V16 H16 V6" />
    </>
  ),
  bot: (
    <>
      <rect x="-14" y="-8" width="28" height="22" rx="5" />
      <circle cx="-6" cy="3" r="2" />
      <circle cx="6" cy="3" r="2" />
      <path d="M0 -8 V-15 M-14 3 H-18 M14 3 H18" />
      <circle cx="0" cy="-17" r="2" />
    </>
  ),
  people: (
    <>
      <circle cx="-8" cy="-8" r="6" />
      <circle cx="10" cy="-6" r="5" />
      <path d="M-20 16 C-20 6 -4 6 -4 16 M2 16 C2 8 18 8 18 16" />
    </>
  ),
  briefcase: (
    <>
      <rect x="-18" y="-8" width="36" height="24" rx="4" />
      <path d="M-6 -8 V-12 H6 V-8 M-18 2 H18" />
    </>
  ),
  book: <path d="M0 -12 C-6 -16 -14 -16 -20 -14 V14 C-14 12 -6 12 0 16 C6 12 14 12 20 14 V-14 C14 -16 6 -16 0 -12 Z M0 -12 V16" />,
  coin: (
    <>
      <circle r="15" />
      <path d="M-5 -7 H6 M-5 -2 H6 M-5 -7 H1 C8 -7 8 3 1 3 H-5 L6 12" />
    </>
  ),
  chip: (
    <>
      <rect x="-12" y="-12" width="24" height="24" rx="3" />
      <rect x="-5" y="-5" width="10" height="10" />
      {[-6, 0, 6].map((p) => (
        <path key={p} d={`M${p} -12 V-18 M${p} 12 V18 M-12 ${p} H-18 M12 ${p} H18`} />
      ))}
    </>
  ),
  pencil: <path d="M-14 14 L-12 6 L8 -14 L14 -8 L-6 12 Z M2 -8 L8 -2" />,
  branch: (
    <>
      <circle cx="-10" cy="-13" r="3.5" />
      <circle cx="-10" cy="13" r="3.5" />
      <circle cx="11" cy="-2" r="3.5" />
      <path d="M-10 -9.5 V9.5 M-10 5 C-10 -2 11 4 11 1.5" />
    </>
  ),
  grid: (
    <>
      {[-15, -3, 9].flatMap((x) => [-15, -3, 9].map((y) => <rect key={`${x}${y}`} x={x} y={y} width="9" height="9" rx="2" />))}
    </>
  ),
  server: (
    <>
      <rect x="-16" y="-16" width="32" height="13" rx="3" />
      <rect x="-16" y="3" width="32" height="13" rx="3" />
      <path d="M-10 -9.5 h.01 M-10 9.5 h.01 M2 -9.5 H10 M2 9.5 H10" />
    </>
  ),
  checklist: <path d="M-14 -10 L-11 -7 L-6 -13 M-14 4 L-11 7 L-6 1 M-2 -9 H14 M-2 5 H14" />,
  shapes: (
    <>
      <circle cx="-10" cy="-6" r="7" />
      <path d="M10 -12 L20 4 H0 Z" />
      <rect x="-6" y="8" width="12" height="12" rx="2" />
    </>
  ),
};

/** A hero glyph first, then up to four around it. */
export type Scene = readonly [Glyph, ...Glyph[]];

/** Angles (degrees) for one to four smaller glyphs, spaced around the hero on a flat ellipse. */
const ANGLES: Record<number, number[]> = { 1: [180], 2: [180, 0], 3: [-150, 0, 150], 4: [-150, -30, 150, 30] };

/** Where each smaller glyph sits on the 300 x 110 canvas, and how big it is. */
export function orbit(count: number): { x: number; y: number; s: number }[] {
  return (ANGLES[Math.min(4, Math.max(1, count))] ?? []).slice(0, count).map((deg) => {
    const a = (deg * Math.PI) / 180;
    const y = 55 + 34 * Math.sin(a);
    return { x: Math.round(150 + 96 * Math.cos(a)), y: Math.round(y), s: y > 60 ? 0.7 : 0.85 };
  });
}

/** One scene per topic (theme). */
export const THEME_SCENES: Record<string, Scene> = {
  "ai-basics": ["sparkle", "shapes", "book", "bot", "bubble"],
  "using-ai": ["bubble", "sparkle", "pencil", "doc", "search"],
  code: ["code", "terminal", "branch", "db", "gear"],
  data: ["db", "bars", "grid", "trend", "doc"],
  llm: ["bubble", "sparkle", "nodes", "chip", "code"],
  retrieval: ["search", "doc", "db", "layers", "nodes"],
  agents: ["bot", "loop", "flow", "search", "code"],
  evals: ["checklist", "bars", "target", "trend", "loop"],
  ops: ["rocket", "cloud", "server", "gear", "loop"],
  security: ["shield", "lock", "search", "doc", "code"],
  governance: ["scales", "shield", "doc", "people", "checklist"],
  ml: ["nodes", "trend", "bars", "chip", "grid"],
  automation: ["gear", "flow", "loop", "doc", "bot"],
  product: ["target", "people", "bars", "pencil", "checklist"],
  client: ["briefcase", "people", "doc", "rocket", "bubble"],
  career: ["trend", "briefcase", "doc", "mic", "book"],
  dsa: ["tree", "grid", "code", "loop", "nodes"],
  "software-engineering": ["branch", "terminal", "checklist", "layers", "code"],
  "system-design": ["layers", "server", "db", "cloud", "flow"],
  rust: ["cube", "gear", "code", "chip", "terminal"],
  "ai-tools": ["sparkle", "play", "mic", "pencil", "bubble"],
};

/** One scene per role roadmap. */
export const ROLE_SCENES: Record<string, Scene> = {
  "ai-engineer": ["code", "nodes", "db", "rocket", "terminal"],
  "genai-engineer": ["bubble", "sparkle", "search", "doc", "chip"],
  "forward-deployed-engineer": ["briefcase", "people", "code", "rocket", "doc"],
  "ai-product-manager": ["target", "people", "bars", "pencil", "checklist"],
  "agentic-ai-expert": ["bot", "loop", "flow", "lock", "search"],
  "ai-automation-specialist": ["gear", "flow", "loop", "doc", "bot"],
  "ai-governance-specialist": ["scales", "shield", "checklist", "doc", "people"],
  "ml-engineer": ["nodes", "trend", "bars", "chip", "grid"],
  "mlops-engineer": ["rocket", "loop", "cloud", "server", "gear"],
};

/** One scene per guided project. */
export const PROJECT_SCENES: Record<string, Scene> = {
  "agent-deployed-production": ["bot", "rocket", "shield", "loop", "server"],
  "ai-feature-brief": ["pencil", "doc", "target", "people", "bubble"],
  "ai-platform-one-team": ["layers", "cloud", "people", "gear", "server"],
  "ai-product-design-doc": ["doc", "target", "pencil", "bars", "checklist"],
  "ai-risk-assessment": ["shield", "checklist", "scales", "search", "doc"],
  "api-data-to-github": ["branch", "code", "db", "terminal", "cloud"],
  "check-ai-answers-at-work": ["checklist", "search", "bubble", "shield", "doc"],
  "csv-cleaning-script": ["grid", "code", "sparkle", "doc", "bars"],
  "deployed-app-with-monitoring": ["rocket", "bars", "cloud", "loop", "server"],
  "document-qa-api": ["doc", "search", "code", "bubble", "db"],
  "enterprise-rag-eval-report": ["search", "bars", "db", "checklist", "doc"],
  "eval-harness-improvement": ["checklist", "trend", "loop", "code", "bars"],
  "fde-client-capstone": ["briefcase", "people", "rocket", "doc", "code"],
  "first-llm-app": ["bubble", "code", "sparkle", "terminal", "cloud"],
  "fraud-model-production": ["shield", "nodes", "trend", "server", "chip"],
  "invoice-to-ledger-automation": ["doc", "flow", "coin", "gear", "db"],
  "multi-step-agent-with-logs": ["bot", "flow", "doc", "loop", "terminal"],
  "operations-agent-approvals": ["bot", "checklist", "people", "lock", "doc"],
  "personal-ai-workflow": ["sparkle", "flow", "pencil", "loop", "bubble"],
  "rag-app-with-test-set": ["search", "db", "checklist", "bubble", "doc"],
  "research-agent-approvals": ["bot", "search", "doc", "checklist", "book"],
  "secure-enterprise-copilot": ["lock", "bubble", "shield", "db", "checklist"],
  "trusted-policy-assistant": ["bubble", "doc", "scales", "shield", "search"],
};

/** The scene for a card: its own (role or project) if it has one, else its topic's. */
export function sceneFor(seed: string, theme: string): Scene {
  return ROLE_SCENES[seed] ?? PROJECT_SCENES[seed] ?? THEME_SCENES[theme] ?? THEME_SCENES["ai-basics"];
}

/** The drawing, on a 300 x 110 canvas that scales to fit. Colour comes from the surrounding text colour. */
export function LineScene({ scene, className = "" }: { scene: Scene; className?: string }) {
  const [hero, ...rest] = scene;
  const around = rest.slice(0, 4);
  const spots = orbit(around.length);
  return (
    <svg
      viewBox="0 0 300 110"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="150" cy="55" r="40" strokeOpacity=".22" strokeDasharray="2 5" />
      {spots.map((p, i) => (
        <path key={`l${i}`} d={`M150 55 L${p.x} ${p.y}`} strokeOpacity=".3" strokeDasharray="1.5 5" />
      ))}
      {around.map((g, i) => (
        <g key={`${g}${i}`} transform={`translate(${spots[i].x} ${spots[i].y}) scale(${spots[i].s})`} strokeOpacity=".75">
          <circle r="22" stroke="none" style={{ fill: "var(--cover-bg)" }} />
          {GLYPHS[g]}
        </g>
      ))}
      <g transform="translate(150 55) scale(1.35)" strokeWidth="1.5">
        <circle r="25" stroke="none" style={{ fill: "var(--cover-bg)" }} />
        {GLYPHS[hero]}
      </g>
    </svg>
  );
}
