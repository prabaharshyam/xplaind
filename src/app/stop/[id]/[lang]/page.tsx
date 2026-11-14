import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContent, getStop, getTranslation, translationLangs } from "@/lib/content";
import { LESSON_LANGS, type LessonLang } from "@/lib/content/schema";
import { pageMeta } from "@/lib/seo";
import { LessonView } from "../lesson-view";

const isLang = (v: string): v is LessonLang => LESSON_LANGS.some((l) => l.id === v);

/** LT-1: one page per translated lesson, at /stop/<id>/<lang>. */
export function generateStaticParams() {
  return getContent().translations.map((t) => ({ id: t.data.id, lang: t.data.lang }));
}

export async function generateMetadata({ params }: PageProps<"/stop/[id]/[lang]">): Promise<Metadata> {
  const { id, lang } = await params;
  const stop = getStop(id);
  const tr = isLang(lang) ? getTranslation(id, lang) : undefined;
  if (!stop || !tr) return {};
  const meta = pageMeta({ title: tr.title, description: tr.answer, path: `/stop/${id}/${lang}`, type: "article", modifiedTime: tr.translated_on });
  meta.alternates = {
    ...meta.alternates,
    languages: Object.fromEntries([["en", `/stop/${id}`], ...translationLangs(id).map((l) => [l, `/stop/${id}/${l}`])]),
  };
  return meta;
}

export default async function TranslatedLessonPage({ params }: PageProps<"/stop/[id]/[lang]">) {
  const { id, lang } = await params;
  if (!isLang(lang) || !getTranslation(id, lang)) notFound();
  return <LessonView id={id} lang={lang} />;
}
