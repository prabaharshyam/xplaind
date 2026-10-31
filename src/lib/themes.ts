// Visual themes for lessons: each has a label, two colours for its art and an icon.
// No imports, so it is safe in schemas, pages and the browser.
export const THEMES = [
  { id: "ai-basics", label: "AI basics", from: "#7c3aed", to: "#c084fc", icon: "sparkles" },
  { id: "using-ai", label: "Using AI", from: "#c026d3", to: "#f0abfc", icon: "chat" },
  { id: "code", label: "Code", from: "#1d4ed8", to: "#60a5fa", icon: "code" },
  { id: "data", label: "Data", from: "#0e7490", to: "#67e8f9", icon: "table" },
  { id: "llm", label: "Language models", from: "#047857", to: "#6ee7b7", icon: "bolt" },
  { id: "retrieval", label: "Retrieval and RAG", from: "#0f766e", to: "#5eead4", icon: "search" },
  { id: "agents", label: "Agents", from: "#c2410c", to: "#fdba74", icon: "robot" },
  { id: "evals", label: "Evaluation", from: "#4d7c0f", to: "#bef264", icon: "check" },
  { id: "ops", label: "Deployment and ops", from: "#0369a1", to: "#7dd3fc", icon: "rocket" },
  { id: "security", label: "Security", from: "#be123c", to: "#fda4af", icon: "shield" },
  { id: "governance", label: "Responsible AI", from: "#475569", to: "#cbd5e1", icon: "scale" },
  { id: "ml", label: "Machine learning", from: "#4338ca", to: "#a5b4fc", icon: "neural" },
  { id: "automation", label: "Automation", from: "#b45309", to: "#fcd34d", icon: "flow" },
  { id: "product", label: "Product", from: "#be185d", to: "#f9a8d4", icon: "target" },
  { id: "client", label: "Client delivery", from: "#9a3412", to: "#fca5a5", icon: "people" },
  { id: "career", label: "Career", from: "#15803d", to: "#86efac", icon: "star" },
  { id: "dsa", label: "Data structures and algorithms", from: "#7e22ce", to: "#f9a8d4", icon: "tree" },
  { id: "system-design", label: "System design", from: "#0f766e", to: "#a5b4fc", icon: "server" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
export type Theme = (typeof THEMES)[number];
export type IconName = Theme["icon"] | "map" | "mic" | "book" | "trophy" | "fire" | "play" | "tick" | "skip" | "cert" | "lock" | "compass" | "close" | "send" | "download";

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
export function pastelOf(id: ThemeId): [string, string, string, string] {
  const t = themeOf(id);
  return [tint(t.from, 0.45), tint(t.to, 0.25), tint("#f9a8d4", 0.1), tint("#a5f3fc", 0.1)];
}
