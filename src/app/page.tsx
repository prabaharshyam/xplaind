import type { Metadata } from "next";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Hero } from "@/components/landing/hero";
import { Problem } from "@/components/landing/problem";
import { FinalCall, InterviewPreview, Ladder, Numbers, Principles, WhatsNext } from "@/components/landing/sections";
import { getContent, getStopsInOrder } from "@/lib/content";
import { getInterviewViews } from "@/lib/content/interview";
import { interviewTopicLabel } from "@/lib/interview-topics";
import { splitStem } from "@/lib/text";
import "./landing.css";

export const metadata: Metadata = {
  title: { absolute: "Xplaind: learn AI, in the right order" },
  description:
    "A ten-minute test finds your level. Then you get your next five steps on a nine-level GenAI engineer path, each with the best free course. No ads, no paid placement.",
};

export default function Home() {
  const content = getContent();
  const levels = content.levels.map(({ data: l }) => l);
  const stops = getStopsInOrder();
  const interview = getInterviewViews();
  const topics = content.levels.reduce((n, l) => n + l.data.topics.length, 0);

  // Real content for the "how it works" faces, so the page never shows a made-up example.
  const sample = content.placement.find((q) => q.data.id === "i1-temperature")?.data ?? content.placement[0].data;
  const rag = interview.find((q) => q.id === "what-is-rag") ?? interview[0];
  const fromI1 = stops.filter((s) => s.level === "I1" || s.level === "I2").slice(0, 5);

  return (
    <main>
      <Hero levels={levels.map((l) => ({ id: l.id, name: l.name }))} />
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
          { value: String(levels.length), label: "levels" },
          { value: String(topics), label: "topics" },
          { value: String(stops.length), label: "lessons" },
          { value: String(interview.length), label: "interview questions" },
          { value: "₹0", label: "to start" },
        ]}
      />
      <Ladder levels={levels} />
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
