import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { aiEnabled } from "@/lib/ai/settings";
import { CourseStudio } from "./course-studio";

export const metadata: Metadata = {
  title: "Generate a course on anything with AI",
  description:
    "Type any topic and get a personal course at your level: modules, lessons with examples and diagrams, a quiz and flashcards. For signed-in learners.",
  alternates: { canonical: "/ai/course" },
};

export default function AiCoursePage() {
  return (
    <main>
      <PageHero
        theme="code"
        seed="ai-course"
        icon="book"
        eyebrow="AI course generator"
        title="Generate a course on anything"
        lead="Type a topic and your level. AI plans the modules, then writes each lesson when you open it, with an example, a diagram, a quiz and flashcards."
        crumbs={[{ href: "/ai", label: "AI tools" }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <CourseStudio enabled={aiEnabled()} />
      </div>
    </main>
  );
}
