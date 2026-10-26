// Renders text written by the model. Plain text only: paragraphs, "- " bullets,
// **bold** and fenced code. React escapes everything, so no HTML gets through.
import { Fragment, type ReactNode } from "react";

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2)
      return (
        <code key={i} className="rounded bg-zinc-100 px-1 py-0.5 text-[0.9em] dark:bg-zinc-800">
          {part.slice(1, -1)}
        </code>
      );
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function AiText({ text, className = "" }: { text: string; className?: string }) {
  const blocks: ReactNode[] = [];
  const parts = text.split(/```[a-z]*\n?/i);
  parts.forEach((part, i) => {
    if (i % 2 === 1) {
      blocks.push(
        <pre key={`c${i}`} className="overflow-x-auto rounded-xl bg-zinc-950 p-4 text-sm leading-6 text-zinc-100">
          <code>{part.replace(/\n$/, "")}</code>
        </pre>,
      );
      return;
    }
    part
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .forEach((p, j) => {
        const lines = p.split("\n");
        if (lines.every((l) => /^\s*([-*•]|\d+\.)\s+/.test(l))) {
          const ordered = /^\s*\d+\./.test(lines[0]);
          const items = lines.map((l, k) => <li key={k}>{inline(l.replace(/^\s*([-*•]|\d+\.)\s+/, ""))}</li>);
          blocks.push(
            ordered ? (
              <ol key={`l${i}-${j}`} className="list-decimal space-y-1 pl-6">
                {items}
              </ol>
            ) : (
              <ul key={`l${i}-${j}`} className="list-disc space-y-1 pl-6">
                {items}
              </ul>
            ),
          );
        } else {
          blocks.push(
            <p key={`p${i}-${j}`}>
              {lines.map((l, k) => (
                <Fragment key={k}>
                  {k > 0 && <br />}
                  {inline(l)}
                </Fragment>
              ))}
            </p>,
          );
        }
      });
  });
  return <div className={`space-y-3 leading-7 ${className}`}>{blocks}</div>;
}
