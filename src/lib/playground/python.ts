/**
 * PG-1: runs Python in the learner's own browser with Pyodide (CPython compiled to WebAssembly).
 * Nothing is sent to a server: the code, its output and any files stay on the device. Each run
 * happens in a Web Worker, so a long loop never freezes the page, and a run that goes past the
 * time limit is stopped by ending the worker (the next run starts a fresh one).
 */

export const PYODIDE_VERSION = "0.27.7";
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
export const RUN_LIMIT_MS = 15_000;

export type RunEvent =
  | { type: "status"; text: string }
  | { type: "out"; text: string }
  | { type: "err"; text: string }
  | { type: "done"; ok: boolean; error?: string; ms: number };

// The worker's code. It loads Pyodide once, then runs each message as a program. Packages a program
// imports (numpy, pandas and so on) are fetched the first time they are used.
const WORKER = `
importScripts("${INDEX_URL}pyodide.js");
let ready = null;
function boot() {
  if (!ready) ready = loadPyodide({ indexURL: "${INDEX_URL}" });
  return ready;
}
self.onmessage = async (e) => {
  const started = Date.now();
  try {
    self.postMessage({ type: "status", text: "Starting Python…" });
    const py = await boot();
    py.setStdout({ batched: (s) => self.postMessage({ type: "out", text: s }) });
    py.setStderr({ batched: (s) => self.postMessage({ type: "err", text: s }) });
    const code = e.data.code;
    if (/^\\s*(import|from)\\s/m.test(code)) {
      self.postMessage({ type: "status", text: "Loading libraries…" });
      await py.loadPackagesFromImports(code, { messageCallback: () => {} });
    }
    self.postMessage({ type: "status", text: "Running…" });
    py.globals.clear();
    const result = await py.runPythonAsync(code);
    if (result !== undefined && result !== null) {
      self.postMessage({ type: "out", text: String(result && result.toString ? result.toString() : result) });
      if (result && result.destroy) result.destroy();
    }
    self.postMessage({ type: "done", ok: true, ms: Date.now() - started });
  } catch (err) {
    const text = String((err && err.message) || err);
    // Keep the part of the traceback about the learner's code, not Pyodide's internals.
    const lines = text.split("\\n");
    const from = lines.findIndex((l) => l.includes('File "<exec>"'));
    const clean = (from >= 0 ? ["Traceback (most recent call last):", ...lines.slice(from)] : lines).join("\\n").trim();
    self.postMessage({ type: "done", ok: false, error: clean, ms: Date.now() - started });
  }
};
`;

let worker: Worker | null = null;
const fresh = () => {
  const url = URL.createObjectURL(new Blob([WORKER], { type: "text/javascript" }));
  const w = new Worker(url);
  URL.revokeObjectURL(url);
  return w;
};

/** Stops whatever is running and throws the worker away; the next run starts a new one. */
export function stopPython(): void {
  worker?.terminate();
  worker = null;
}

/** Runs a program and reports progress, output and the result through `on`. */
export function runPython(code: string, on: (e: RunEvent) => void, limitMs = RUN_LIMIT_MS): () => void {
  if (!worker) worker = fresh();
  const w = worker;
  let finished = false;
  // The first run downloads Python (about 10 MB, then cached), so the clock starts once it runs.
  let timer: ReturnType<typeof setTimeout> | undefined;
  const finish = (e: RunEvent) => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    w.onmessage = null;
    w.onerror = null;
    on(e);
  };
  w.onmessage = (m: MessageEvent<RunEvent>) => {
    const e = m.data;
    if (e.type === "status" && e.text === "Running…" && !timer) {
      timer = setTimeout(() => {
        stopPython();
        finish({ type: "done", ok: false, error: `Stopped: the program ran for more than ${limitMs / 1000} seconds. Check for a loop that never ends.`, ms: limitMs });
      }, limitMs);
    }
    if (e.type === "done") finish(e);
    else on(e);
  };
  w.onerror = () => {
    stopPython();
    finish({ type: "done", ok: false, error: "Python could not start. Check your connection and try again.", ms: 0 });
  };
  w.postMessage({ code });
  return () => {
    if (finished) return;
    stopPython();
    finish({ type: "done", ok: false, error: "Stopped.", ms: 0 });
  };
}
