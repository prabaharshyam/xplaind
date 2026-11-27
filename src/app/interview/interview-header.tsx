import Link from "next/link";

const TABS = [
  { id: "questions", href: "/interview", label: "Questions" },
  { id: "patterns", href: "/interview/patterns", label: "Patterns" },
  { id: "design", href: "/interview/design", label: "System design" },
] as const;

/**
 * IP-6 (2026-11-27, owner request): the Interview menu's "Questions" is one place with three tabs, in
 * place of four menu entries. A compact app header: the page's title, one line, and the tabs.
 */
export function InterviewHeader({ current, title, lead }: { current: (typeof TABS)[number]["id"]; title: string; lead: string }) {
  return (
    <header className="mx-auto max-w-6xl px-4 pt-8 md:px-6 md:pt-12">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
      <p className="mt-1 max-w-3xl leading-7 text-zinc-600 dark:text-zinc-400">{lead}</p>
      <nav aria-label="Interview questions and guides" className="mt-5 flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            aria-current={t.id === current ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center border-b-2 px-3 text-sm font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-700 ${
              t.id === current ? "border-brand-700 text-brand-800 dark:border-brand-300 dark:text-brand-200" : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
