import type { Metadata } from "next";
import Link from "next/link";
import { ResourceCard } from "@/components/resource-card";
import { muted, textLink } from "@/components/ui";
import { getContent, getStops } from "@/lib/content";
import { resourceCard } from "@/lib/content/cards";
import { LEVEL_IDS } from "@/lib/levels";

export const metadata: Metadata = {
  title: "Courses",
  description: "Every free and low-cost course on the GenAI Engineer path, by level, with why we picked it and what it costs.",
};

/** Every course on the path, by level, each linked to the lessons that use it. */
export default function ResourcesPage() {
  const content = getContent();
  const stops = getStops();
  const usedBy = (id: string) => stops.filter((s) => s.primary_resource === id || s.alternates.includes(id));
  const levels = new Map(content.levels.map((l) => [l.data.id, l.data.name]));

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Courses</h1>
      <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
        Every course on the path, chosen by hand and grouped by level. Free first; a price always shows the day we
        checked it. Open a lesson to see which course to start with.
      </p>
      {LEVEL_IDS.map((level) => {
        const list = content.resources.map((r) => r.data).filter((r) => r.level === level);
        if (list.length === 0) return null;
        return (
          <section key={level} aria-labelledby={`courses-${level}`} className="mt-10">
            <h2 id={`courses-${level}`} className="text-xl font-semibold">
              {level} {levels.get(level)}
            </h2>
            <ul className="mt-4 flex flex-col gap-4">
              {list.map((r) => (
                <li key={r.id}>
                  <ResourceCard r={resourceCard(r.id)} role="listing" />
                  <p className={`mt-2 text-sm ${muted}`}>
                    Used in:{" "}
                    {usedBy(r.id).map((s, i) => (
                      <span key={s.id}>
                        {i > 0 && ", "}
                        <Link href={`/stop/${s.id}`} className={textLink}>
                          {s.title}
                        </Link>
                      </span>
                    ))}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
