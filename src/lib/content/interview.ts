// What interview and practice pages pass to their client islands. Node only.
import { INTERVIEW_TOPIC_IDS, type InterviewTopicId } from "@/lib/interview-topics";
import type { McqQuestion } from "@/components/mcq-quiz";
import { getContent, getPath, getStop, pathsWithLesson } from "./index";
import { isHumanName } from "./review";
import type { InterviewView } from "@/lib/interview/types";

export function getInterviewViews(): InterviewView[] {
  const order = (t: string) => INTERVIEW_TOPIC_IDS.indexOf(t as InterviewTopicId);
  return getContent()
    .interview.map(({ data: q }) => {
      const stop = getStop(q.stop_id)!;
      return {
        id: q.id,
        question: q.question,
        short_answer: q.short_answer,
        deeper_answer: q.deeper_answer,
        follow_ups: q.follow_ups,
        common_mistakes: q.common_mistakes,
        level: q.level,
        topic: q.topic,
        stop: { id: stop.id, title: stop.title },
        paths: pathsWithLesson(stop.id).map((p) => p.id),
        rubric: q.rubric,
        answer_seconds: q.answer_seconds,
        kind: q.kind,
        example: q.example ?? null,
        reviewed: isHumanName(q.reviewed_by),
      };
    })
    .sort((a, b) => order(a.topic) - order(b.topic));
}

/** IQ-8: a role's Top 25, in the order the path lists them. */
export function topInterview(pathId: string): InterviewView[] {
  const ids = getPath(pathId)?.top_interview ?? [];
  const byId = new Map(getInterviewViews().map((q) => [q.id, q]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

export const getInterviewView = (id: string): InterviewView | undefined => getInterviewViews().find((q) => q.id === id);

/** IQ-5: a topic's standalone MCQ set is the checks of the lessons its interview questions link to. */
export function quizPoolFor(topic: InterviewTopicId | null): McqQuestion[] {
  const content = getContent();
  const stopIds = new Set(getInterviewViews().filter((q) => !topic || q.topic === topic).map((q) => q.stop.id));
  return content.checks
    .filter(({ data: c }) => stopIds.has(c.stop_id))
    .map(({ data: c }) => ({ id: c.id, stem: c.stem, options: c.options, correct: c.correct, explanation: c.explanation }));
}
