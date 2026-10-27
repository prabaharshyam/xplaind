import type { InterviewTopicId } from "@/lib/interview-topics";
import type { LevelId } from "@/lib/levels";

export type InterviewKind = "concept" | "scenario" | "use-case" | "real-life";

/** An interview question as the pages show it. */
export type InterviewView = {
  id: string;
  question: string;
  short_answer: string;
  deeper_answer: string;
  follow_ups: string[];
  common_mistakes: string[];
  level: LevelId;
  topic: InterviewTopicId;
  stop: { id: string; title: string };
  /** Paths whose lessons include the question's lesson. */
  paths: string[];
  /** VS-1: key points a strong answer covers, with the words that show each one. */
  rubric: { point: string; keywords: string[] }[];
  /** The longest a spoken answer should run. */
  answer_seconds: number;
  /** IQ-8: what the interviewer is testing. */
  kind: InterviewKind;
  /** IQ-8: a concrete example to tell in the interview, when written. */
  example: string | null;
  /** False until a person signs it off (IQ-6). Pages label drafts. */
  reviewed: boolean;
};
