import { getInterviewView } from "@/lib/content/interview";
import { interviewTopicLabel } from "@/lib/interview-topics";
import { OG_SIZE, ogCard } from "@/lib/og-card";

// SE-17 (2026-11-18, site review: shares of interview questions showed no picture).
export const alt = "An AI interview question with its answer";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const q = getInterviewView((await params).id);
  return ogCard({
    eyebrow: q ? `Interview question · ${interviewTopicLabel(q.topic)}` : "AI interview question",
    title: q?.question ?? "AI interview questions with answers",
    footer: "A short answer you can say out loud, the deeper answer and the follow-ups to expect",
    from: "#0e4a50",
    to: "#14b8a6",
  });
}
