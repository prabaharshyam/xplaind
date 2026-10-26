// Small text helpers for question stems and topic tags. Pure.

const ACRONYMS: Record<string, string> = {
  ai: "AI",
  llm: "LLM",
  llms: "LLMs",
  api: "API",
  apis: "APIs",
  rag: "RAG",
  git: "Git",
  json: "JSON",
  sql: "SQL",
  http: "HTTP",
  csv: "CSV",
  mcp: "MCP",
};

/** "python-data-structures" -> "Python data structures"; "llm-basics" -> "LLM basics". */
export function tagLabel(tag: string): string {
  const words = tag.split("-").map((w) => ACRONYMS[w] ?? w);
  const label = words.join(" ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * A question stem is plain text, optionally followed by a blank line and a block of
 * code. Splits them so the code can be shown in a monospace block.
 */
export function splitStem(stem: string): { text: string; code?: string } {
  const at = stem.indexOf("\n\n");
  if (at === -1) return { text: stem.trim() };
  return { text: stem.slice(0, at).trim(), code: stem.slice(at + 2).trimEnd() };
}
