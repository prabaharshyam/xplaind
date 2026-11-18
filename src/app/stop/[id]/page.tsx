import type { Metadata } from "next";
import { getStop, getStops, lessonAlternates } from "@/lib/content";
import { pageMeta } from "@/lib/seo";
import { LessonView } from "./lesson-view";

export function generateStaticParams() {
  return getStops().map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: PageProps<"/stop/[id]">): Promise<Metadata> {
  const stop = getStop((await params).id);
  if (!stop) return {};
  // SE-3: answer-first: the plain answer is what search and AI results quote.
  const meta = pageMeta({
    // Add the search phrase only while the whole title still fits in a result.
    // SE-8: the lesson's name plus the words people search with, when they fit.
    title: [`${stop.title}: explained simply, with examples`, `${stop.title}: explained simply`, stop.title],
    description: stop.answer,
    path: `/stop/${stop.id}`,
    type: "article",
    modifiedTime: stop.reviewed_on,
  });
  // LT-1: point search engines at the translated versions.
  const languages = lessonAlternates(stop.id);
  if (Object.keys(languages).length) meta.alternates = { ...meta.alternates, languages };
  return meta;
}

export default async function StopPage({ params }: PageProps<"/stop/[id]">) {
  return <LessonView id={(await params).id} />;
}
