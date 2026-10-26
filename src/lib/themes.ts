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
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
export type Theme = (typeof THEMES)[number];
export type IconName = Theme["icon"] | "map" | "mic" | "book" | "trophy" | "fire" | "play" | "tick" | "skip" | "cert" | "lock" | "compass";

export const THEME_IDS = THEMES.map((t) => t.id) as [ThemeId, ...ThemeId[]];
export const themeOf = (id: string): Theme => THEMES.find((t) => t.id === id) ?? THEMES[0];
