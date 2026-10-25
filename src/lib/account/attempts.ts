// Converting test answers to and from the quiz_attempts row (PRD: [{question_id, level, chosen, correct}]).
import { isLevelId } from "@/lib/levels";
import type { Answer, BankQuestion } from "@/lib/placement/types";

export type AttemptAnswerRow = { question_id: string; level: string; chosen: string | null; correct: boolean };

export const answersToRow = (answers: readonly Answer[]): AttemptAnswerRow[] =>
  answers.map((a) => ({ question_id: a.questionId, level: a.level, chosen: a.choice, correct: a.correct }));

/** Rebuilds answers for the result page. Questions no longer in the bank are dropped. */
export function rowToAnswers(rows: readonly AttemptAnswerRow[], bank: readonly BankQuestion[]): Answer[] {
  const byId = new Map(bank.map((q) => [q.id, q]));
  return rows.flatMap((r) => {
    const q = byId.get(r.question_id);
    if (!q || !isLevelId(r.level)) return [];
    return [{ questionId: r.question_id, level: r.level, topicTags: [...q.topic_tags], choice: r.chosen, correct: r.correct }];
  });
}
