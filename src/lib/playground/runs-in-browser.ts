// PG-6 (2026-11-09): only Python that can actually run in the browser gets a "Run this code" button
// in lessons. Pyodide ships the standard library and a set of packages (numpy, pandas, scikit-learn
// and others); anything else, such as model SDKs, web servers or PyTorch, would fail with an import
// error, so those blocks stay plain, copyable code. Pure: no DOM, no network.

/** Top-level modules Pyodide can import, from the standard library or its own package set. */
const BROWSER_MODULES = new Set([
  // standard library (the parts lessons use)
  "abc", "argparse", "array", "asyncio", "base64", "bisect", "calendar", "collections", "contextlib", "contextvars", "copy",
  "csv", "dataclasses", "datetime", "decimal", "difflib", "enum", "fractions", "functools", "glob", "hashlib", "heapq",
  "hmac", "html", "io", "itertools", "json", "logging", "math", "operator", "os", "pathlib", "pprint", "random", "re",
  "secrets", "shutil", "statistics", "string", "struct", "sys", "tempfile", "textwrap", "time", "timeit", "types",
  "typing", "unicodedata", "uuid", "zoneinfo", "sqlite3", "__future__",
  // packages Pyodide provides
  "numpy", "pandas", "sklearn", "scipy", "matplotlib", "networkx", "pydantic", "yaml", "regex", "PIL", "sympy", "bs4",
]);

/** The top-level modules a piece of Python imports. */
export function importedModules(code: string): string[] {
  const found = new Set<string>();
  for (const line of code.split("\n")) {
    const t = line.trim();
    let m = t.match(/^from\s+([A-Za-z_][\w.]*)\s+import\b/);
    if (m) {
      if (!m[1].startsWith(".")) found.add(m[1].split(".")[0]);
      continue;
    }
    m = t.match(/^import\s+(.+)$/);
    if (m) for (const part of m[1].split(",")) found.add(part.trim().split(/\s+as\s+|\./)[0]);
  }
  return [...found].filter(Boolean);
}

/** True when every import is available in the browser (Pyodide), so the block can run on the page. */
export function runsInBrowser(code: string): boolean {
  return importedModules(code).every((m) => BROWSER_MODULES.has(m));
}
