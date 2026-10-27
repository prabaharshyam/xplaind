import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { textLink } from "@/components/ui";
import { getContent, getPaths, getStops } from "@/lib/content";
import { costLabel } from "@/lib/roadmap/cost";
import { CourseDirectory, type DirectoryRow } from "./course-directory";
import { kindLabel } from "@/lib/content/media";

export const metadata: Metadata = {
  title: "AI courses and certificates, filtered by path and level",
  description:
    "Every AI course we recommend, from Google, Microsoft, AWS, NVIDIA, OpenAI, Anthropic, Hugging Face, DeepLearning.AI and more. Filter by path, level and certificate.",
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
      kindLabel: kindLabel(r),
      notice: r.notice ?? null,
      level: r.level,
      cost: r.cost,
      hours: r.hours,
      certificate: r.certificate,
      editorScore: r.editor_score,
      paths: [...new Set(usedBy.flatMap((s) => pathsOfLesson(s.id)))],
      themes: [...new Set(usedBy.map((s) => s.theme))],
      whyPicked: r.why_picked,
      costLabel: cost.note ? `${cost.label} (${cost.note})` : cost.label,
      lessons: usedBy.slice(0, 3).map((s) => ({ id: s.id, title: s.title })),
    };
  });
  const providers = new Set(rows.map((r) => r.provider)).size;

  return (
    <main>
      <PageHero
        theme="using-ai"
        seed="courses"
        icon="book"
        eyebrow="Course directory"
        title="AI courses, hand-picked"
        lead={
          <>
            {rows.length} courses, docs and books from {providers} providers, including Google, Microsoft, AWS, NVIDIA,
            OpenAI and Anthropic. Each one chosen for a lesson. Free first; a price always shows the day we checked it.
          </>
        }
      >
        <p className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link href="/certifications" className={textLink}>
            AI certifications and exam fees
          </Link>
          <Link href="/how-we-rank" className={textLink}>
            How we choose (we never take payment)
          </Link>
        </p>
      </PageHero>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <CourseDirectory rows={rows} paths={paths.map((p) => ({ id: p.id, name: p.name }))} />
      </div>
    </main>
  );
}
