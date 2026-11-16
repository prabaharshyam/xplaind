// Converting test answers to and from the quiz_attempts row (PRD: [{question_id, level, chosen, correct}]).
import { isLevelId } from "@/lib/levels";
import type { Answer, BankQuestion } from "@/lib/placement/types";

export type AttemptAnswerRow = { question_id: string; level: string; chosen: string | null; correct: boolean };

export const answersToRow = (answers: readonly Answer[]): AttemptAnswerRow[] =>
  answers.map((a) => ({ question_id: a.questionId, level: a.level, chosen: a.choice, correct: a.correct }));

/**
 * QA-5: the value to hand to PostgREST's "contains" filter on the jsonb `answers` column. Given a list of objects
 * directly, the database library writes "[object Object]" into the address, the server answers 400, and the
 * "already saved?" check silently never matched: every sign-in saved the same test attempt again (73 duplicates
 * in production by 16 Nov). A JSON string is sent as it is.
 */
export const answersContainsFilter = (rows: readonly AttemptAnswerRow[]): string => JSON.stringify(rows);

/** Rebuilds answers for the result page. Questions no longer in the bank are dropped. */
export function rowToAnswers(rows: readonly AttemptAnswerRow[], bank: readonly BankQuestion[]): Answer[] {
  const byId = new Map(bank.map((q) => [q.id, q]));
  return rows.flatMap((r) => {
    const q = byId.get(r.question_id);
    if (!q || !isLevelId(r.level)) return [];
    return [{ questionId: r.question_id, level: r.level, topicTags: [...q.topic_tags], choice: r.chosen, correct: r.correct }];
  });
}
