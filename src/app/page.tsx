import type { Metadata } from "next";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Hero } from "@/components/landing/hero";
import { Problem } from "@/components/landing/problem";
import { FinalCall, InterviewPreview, Numbers, PathsTrack, Principles, WhatsNext } from "@/components/landing/sections";
import { getContent, getGlossary, getPaths, getStops, getStopsInOrder } from "@/lib/content";
import { pathView } from "@/lib/content/paths";
import { CODING_LABEL } from "@/lib/paths";
import { getInterviewViews } from "@/lib/content/interview";
import { interviewTopicLabel } from "@/lib/interview-topics";
import { splitStem } from "@/lib/text";
import "./landing.css";

export const metadata: Metadata = {
  title: { absolute: "Xplaind: learn AI, in the right order" },
  description:
    "Nine AI career paths, from AI for beginners to forward deployed engineer. Our own lesson for every topic, the best free course, a check and a project per stage. No ads, no paid placement.",
};

export default function Home() {
  const content = getContent();
  const stops = getStopsInOrder();
  const interview = getInterviewViews();
  const paths = getPaths().map(pathView);

  // Real content for the "how it works" faces, so the page never shows a made-up example.
  const sample = content.placement.find((q) => q.data.id === "i1-temperature")?.data ?? content.placement[0].data;
  const rag = interview.find((q) => q.id === "what-is-rag") ?? interview[0];
  const fromI1 = stops.filter((s) => s.level === "I1" || s.level === "I2").slice(0, 5);

  return (
    <main>
      <Hero
        paths={paths.map((p) => ({ id: p.id, name: p.name, detail: `${CODING_LABEL[p.coding]} · ${p.counts.lessons} lessons` }))}
      />
      <Problem />
      <HowItWorks
        data={{
          question: { text: splitStem(sample.stem).text, options: sample.options.map((o) => o.text).slice(0, 3) },
          steps: fromI1.map((s) => ({ title: s.title, level: s.level })),
          interview: { question: rag.question, answer: rag.short_answer.split(". ").slice(0, 2).join(". ") + "." },
        }}
      />
      <Numbers
        stats={[
          { value: String(paths.length), label: "career paths" },
          { value: String(getStops().length), label: "lessons" },
          { value: String(getGlossary().length), label: "glossary terms" },
          { value: String(interview.length), label: "interview questions" },
          { value: "₹0", label: "to start" },
        ]}
      />
      <PathsTrack
        paths={paths.map((p) => ({
          id: p.id,
          name: p.name,
          tagline: p.tagline,
          coding: CODING_LABEL[p.coding],
          months: p.months,
          lessons: p.counts.lessons,
        }))}
      />
      <Principles />
      <InterviewPreview
        count={interview.length}
        questions={["what-is-rag", "agent-vs-workflow", "prompt-rag-finetune"]
          .map((id) => interview.find((q) => q.id === id))
          .filter((q) => q !== undefined)
          .map((q) => ({ id: q.id, question: q.question, topic: interviewTopicLabel(q.topic) }))}
      />
      <WhatsNext />
      <FinalCall />
    </main>
  );
}
