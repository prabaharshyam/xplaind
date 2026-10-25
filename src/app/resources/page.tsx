import type { Metadata } from "next";
import Link from "next/link";
import { muted, textLink } from "@/components/ui";
import { getContent, getPaths, getStops } from "@/lib/content";
import { costLabel } from "@/lib/roadmap/cost";
import { CourseDirectory, type DirectoryRow } from "./course-directory";

export const metadata: Metadata = {
  title: "Free AI courses and certificates, filtered by path and level",
  description:
    "Every free AI course we recommend, from Google, Microsoft, AWS, NVIDIA, OpenAI, Anthropic, Hugging Face, DeepLearning.AI and more. Filter by path, level and certificate.",
  alternates: { canonical: "/resources" },
};

/** RM-2: the course directory. Every course on every path, each linked to the lessons that use it. */
export default function ResourcesPage() {
  const stops = getStops();
  const paths = getPaths();
  const pathsOfLesson = (id: string) => paths.filter((p) => p.stages.some((st) => st.lessons.includes(id))).map((p) => p.id);
  const rows: DirectoryRow[] = getContent().resources.map(({ data: r }) => {
    const usedBy = stops.filter((s) => s.primary_resource === r.id || s.alternates.includes(r.id) || s.more.includes(r.id));
    const cost = costLabel(r);
    return {
      id: r.id,
      title: r.title,
      provider: r.provider,
      type: r.type,
      level: r.level,
      cost: r.cost,
      hours: r.hours,
      certificate: r.certificate,
      editorScore: r.editor_score,
      paths: [...new Set(usedBy.flatMap((s) => pathsOfLesson(s.id)))],
      whyPicked: r.why_picked,
      costLabel: cost.note ? `${cost.label} (${cost.note})` : cost.label,
      lessons: usedBy.slice(0, 3).map((s) => ({ id: s.id, title: s.title })),
    };
  });
  const providers = new Set(rows.map((r) => r.provider)).size;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Free AI courses</h1>
      <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
        {rows.length} courses, docs and books from {providers} providers, each chosen by hand for a lesson on one of our
        paths. Free first; a price always shows the day we checked it. Want an exam to sit?{" "}
        <Link href="/certifications" className={textLink}>
          See AI certifications
        </Link>
        .
      </p>
      <p className={`mt-2 text-sm ${muted}`}>
        We never take payment for a place on this list. <Link href="/how-we-rank" className={textLink}>How we choose</Link>.
      </p>
      <CourseDirectory rows={rows} paths={paths.map((p) => ({ id: p.id, name: p.name }))} />
    </main>
  );
}
