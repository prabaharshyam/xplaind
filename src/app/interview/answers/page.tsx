import { AccountWall } from "@/components/account/account-wall";
import { PageHero } from "@/components/page-hero";
import { getPaths } from "@/lib/content";
import { getInterviewViews } from "@/lib/content/interview";
import { interviewTopicLabel } from "@/lib/interview-topics";
import { pageMeta } from "@/lib/seo";
import { AnswersBrowser } from "./answers-browser";

export const metadata = pageMeta({
  title: "AI interview questions and answers by role",
  description:
    "Every AI interview question with its short and deeper answer on one page. Pick a role, such as GenAI engineer or AI product manager, search and print.",
  path: "/interview/answers",
});

/** IQ-9: all questions and answers for one role on one page, behind a free account (SU-1). */
export default function InterviewAnswersPage() {
  const roles = getPaths().map((p) => ({ id: p.id, name: p.name }));
  const questions = getInterviewViews().map((q) => ({
    id: q.id,
    question: q.question,
    short: q.short_answer,
    deeper: q.deeper_answer,
    followUps: q.follow_ups,
    mistakes: q.common_mistakes,
    level: q.level,
    topic: interviewTopicLabel(q.topic),
    roles: q.paths,
  }));
  return (
    <main>
      <PageHero shape="target"
        theme="career"
        seed="interview-answers"
        icon="target"
        eyebrow="Interview prep"
        title="Interview questions and answers, by role"
        lead="Choose your role and read every question with its short answer, deeper answer, follow-ups and common mistakes, all on one page."
      />
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <AccountWall reason="tools" next="/interview/answers">
          <AnswersBrowser roles={roles} questions={questions} />
        </AccountWall>
      </div>
    </main>
  );
}
