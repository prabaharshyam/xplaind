"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { aiPost } from "@/components/ai/ai-client";
import { AiText } from "@/components/ai/ai-text";
import { Icon } from "@/components/art/icons";
import { primaryButtonSm, secondaryButtonSm } from "@/components/ui";
import { encodeCode } from "@/lib/playground/examples";
import { runPython } from "@/lib/playground/python";

type Line = { kind: "out" | "err"; text: string };

/**
 * PG-1: an editable Python block that runs in the browser. Used on /playground and under the
 * Python examples in lessons. Ctrl or Cmd + Enter runs. When a run fails and AI is on, the AI
 * tutor can explain the error (PG-3); only the code and the error are sent, and only on request.
 */
export function CodeRunner({
  initialCode,
  aiOn,
  compact = false,
  label = "Python code",
  onCodeChange,
}: {
  initialCode: string;
  aiOn: boolean;
  compact?: boolean;
  label?: string;
  onCodeChange?: (code: string) => void;
}) {
  const [code, setCode] = useState(initialCode);
  const [lines, setLines] = useState<Line[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [took, setTook] = useState<number | null>(null);
  const [explain, setExplain] = useState<{ busy: boolean; text?: string; fail?: string }>({ busy: false });
  const stop = useRef<(() => void) | null>(null);
  const id = useId();

  // A new starter remounts this component (the parent changes its key), so state starts fresh.
  useEffect(() => () => stop.current?.(), []);

  const edit = (next: string) => {
    setCode(next);
    onCodeChange?.(next);
  };

  const run = () => {
    if (running) return;
    setLines([]);
    setError(null);
    setTook(null);
    setExplain({ busy: false });
    setRunning(true);
    setStatus("Starting Python… the first run downloads it (about 10 MB), then it is quick.");
    stop.current = runPython(code, (e) => {
      if (e.type === "status") setStatus(e.text);
      else if (e.type === "out" || e.type === "err") setLines((l) => [...l, { kind: e.type, text: e.text }].slice(-500));
      else {
        setRunning(false);
        setStatus(null);
        setTook(e.ms);
        if (!e.ok) setError(e.error ?? "Something went wrong.");
        stop.current = null;
      }
    });
  };

  const askAi = async () => {
    if (!error) return;
    setExplain({ busy: true });
    const text = [
      "My Python code:",
      "```python",
      code.slice(0, 2500),
      "```",
      "It failed with this error:",
      "```text",
      error.slice(0, 1200),
      "```",
      "Explain in plain words what the error means and how to fix it. Show the fixed lines.",
    ].join("\n");
    const res = await aiPost<{ reply: string }>("/api/ai/tutor", { turns: [{ role: "user", text }] });
    setExplain(res.ok ? { busy: false, text: res.data.reply } : { busy: false, fail: res.message });
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      run();
      return;
    }
    if (e.key === "Tab" && !e.shiftKey) {
      // Indent with four spaces, as Python expects. Shift+Tab still moves focus out.
      e.preventDefault();
      const t = e.currentTarget;
      const { selectionStart: a, selectionEnd: b } = t;
      const next = `${code.slice(0, a)}    ${code.slice(b)}`;
      edit(next);
      requestAnimationFrame(() => t.setSelectionRange(a + 4, a + 4));
    }
  };

  const rows = Math.min(compact ? 16 : 24, Math.max(compact ? 4 : 10, code.split("\n").length + 1));

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-300 bg-zinc-950 text-zinc-100 dark:border-zinc-700">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2 text-xs text-zinc-300">
        <label htmlFor={`${id}-code`} className="font-medium">
          {label}
        </label>
        <span>Runs in your browser · Ctrl/⌘ + Enter</span>
      </div>
      <textarea
        id={`${id}-code`}
        value={code}
        onChange={(e) => edit(e.target.value)}
        onKeyDown={onKey}
        rows={rows}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        aria-describedby={`${id}-out`}
        className="block w-full resize-y bg-transparent px-4 py-3 font-mono text-sm leading-6 text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400"
      />
      <div className="flex flex-wrap gap-2 border-t border-white/10 bg-zinc-900 px-3 py-2">
        {running ? (
          <button type="button" onClick={() => stop.current?.()} className={secondaryButtonSm}>
            Stop
          </button>
        ) : (
          <button type="button" onClick={run} className={primaryButtonSm}>
            <Icon name="play" size={16} /> Run
          </button>
        )}
        <button type="button" onClick={() => edit(initialCode)} disabled={running || code === initialCode} className={secondaryButtonSm}>
          Reset
        </button>
        {compact && (
          <Link href={`/playground#code=${encodeCode(code)}`} className={secondaryButtonSm}>
            Open in playground
          </Link>
        )}
      </div>
      <div id={`${id}-out`} className="border-t border-white/10 bg-black/60 px-4 py-3">
        <p className="text-xs font-medium text-zinc-400">Output</p>
        <pre role="log" aria-live="polite" className="mt-1 max-h-80 overflow-auto font-mono text-sm leading-6 whitespace-pre-wrap">
          {lines.map((l, i) => (
            <span key={i} className={l.kind === "err" ? "text-rose-300" : "text-emerald-200"}>
              {l.text}
              {"\n"}
            </span>
          ))}
          {error && <span className="text-rose-300">{error}</span>}
          {!lines.length && !error && <span className="text-zinc-400">{status ?? (took === null ? "Press Run to see the output here." : "(no output)")}</span>}
        </pre>
        {took !== null && !running && <p className="mt-1 text-xs text-zinc-400">Finished in {(took / 1000).toFixed(2)} s</p>}
        {error && aiOn && (
          <div className="mt-3">
            {!explain.text && (
              <button type="button" onClick={askAi} disabled={explain.busy} className={secondaryButtonSm}>
                <Icon name="sparkles" size={16} /> {explain.busy ? "Asking the AI tutor…" : "Explain this error with AI"}
              </button>
            )}
            {explain.fail && <p className="mt-2 text-sm text-rose-300">{explain.fail}</p>}
            {explain.text && (
              <div className="mt-2 rounded-2xl bg-white p-4 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                <p className="text-xs font-semibold text-violet-800 dark:text-violet-300">AI tutor</p>
                <AiText text={explain.text} className="mt-1" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
