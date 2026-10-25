import type { InterviewTopicId } from "@/lib/interview-topics";
import type { LevelId } from "@/lib/levels";

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
  /** False until a person signs it off (IQ-6). Pages label drafts. */
  reviewed: boolean;
};
