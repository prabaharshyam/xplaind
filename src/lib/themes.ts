// Visual themes for lessons: each has a label, two colours for its art and an icon.
// BR-10 (2026-11-14): one muted family, the same hues at low saturation, so topics stay apart but sit
// quietly beside the deep teal brand.
// No imports, so it is safe in schemas, pages and the browser.
export const THEMES = [
  { id: "ai-basics", label: "AI basics", from: "#3f2f5b", to: "#bda9d1", icon: "sparkles" },
  { id: "using-ai", label: "Using AI", from: "#562f5b", to: "#cba9d1", icon: "chat" },
  { id: "code", label: "Code", from: "#2f3a5b", to: "#a9bbd1", icon: "code" },
  { id: "data", label: "Data", from: "#2f515b", to: "#a9ccd1", icon: "table" },
  { id: "llm", label: "Language models", from: "#2f5b4e", to: "#a9d1c1", icon: "bolt" },
  { id: "retrieval", label: "Retrieval and RAG", from: "#2f5b57", to: "#a9d1ca", icon: "search" },
  { id: "agents", label: "Agents", from: "#5b3c2f", to: "#d1bda9", icon: "robot" },
  { id: "evals", label: "Evaluation", from: "#485b2f", to: "#c2d1a9", icon: "check" },
  { id: "ops", label: "Deployment and ops", from: "#2f4b5b", to: "#a9c4d1", icon: "rocket" },
  { id: "security", label: "Security", from: "#5b2f3a", to: "#d1a9ae", icon: "shield" },
  { id: "governance", label: "Responsible AI", from: "#384352", to: "#abbbce", icon: "scale" },
  { id: "ml", label: "Machine learning", from: "#322f5b", to: "#a9b0d1", icon: "neural" },
  { id: "automation", label: "Automation", from: "#5b422f", to: "#d1c7a9", icon: "flow" },
  { id: "product", label: "Product", from: "#5b2f41", to: "#d1a9be", icon: "target" },
  { id: "client", label: "Client delivery", from: "#5b3a2f", to: "#d1a9a9", icon: "people" },
  { id: "career", label: "Career", from: "#2f5b3f", to: "#a9d1b7", icon: "star" },
  { id: "dsa", label: "Data structures and algorithms", from: "#462f5b", to: "#d1a9be", icon: "tree" },
  { id: "software-engineering", label: "Software engineering", from: "#344256", to: "#a9bcd1", icon: "code" },
  { id: "system-design", label: "System design", from: "#2f5b57", to: "#a9b0d1", icon: "server" },
  { id: "ai-tools", label: "AI tools", from: "#5b2f42", to: "#b3a9d1", icon: "sparkles" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
export type Theme = (typeof THEMES)[number];
export type IconName = Theme["icon"] | "map" | "mic" | "book" | "trophy" | "fire" | "play" | "tick" | "skip" | "cert" | "lock" | "compass" | "close" | "send" | "download" | "timer";

export const THEME_IDS = THEMES.map((t) => t.id) as [ThemeId, ...ThemeId[]];
export const themeOf = (id: string): Theme => THEMES.find((t) => t.id === id) ?? THEMES[0];

/** Mixes a hex colour with white; amount 0 keeps it, 1 is white. */
export function tint(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(mix);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** MO-5: the pastel palette a theme's 3D scene and soft surfaces use. */
/** A particle sculpture's three colours for a theme: its own two, then the brand teal. */
export function particleColorsOf(id: ThemeId): [string, string, string] {
  const t = themeOf(id);
  return [t.from, t.to, "#2a9488"];
}

export function pastelOf(id: ThemeId): [string, string, string, string] {
  const t = themeOf(id);
  return [tint(t.from, 0.45), tint(t.to, 0.25), tint("#b5d8d3", 0.1), tint("#d9ebe8", 0.1)];
}
