// Small factories for content tests. A valid record per collection, plus a valid
// bundle, so each test can break exactly one thing.
import type { Bundle } from "./types";
import type {
  Book,
  CheckQuestion,
  InterviewQuestion,
  PlacementQuestion,
  Resource,
  Stop,
} from "./schema";
import { LEVEL_IDS } from "@/lib/levels";

export const TODAY = "2026-10-25";
const review = { drafted_with_ai: true, reviewed_by: "Asha Rao", reviewed_on: "2026-10-20" };
const options = [
  { id: "a", text: "First" },
  { id: "b", text: "Second" },
  { id: "c", text: "Third" },
  { id: "d", text: "Fourth" },
];

export const resource = (o: Partial<Resource> = {}): Resource => ({
  id: "res-one",
  title: "A good course",
  provider: "Some University",
  url: "https://example.org/course",
  type: "course",
  level: "B1",
  cost: "free",
  hours: 3,
  language: "en",
  certificate: false,
  affiliate: false,
  editor_score: 4,
  why_picked: "Clear and hands-on.",
  last_verified: "2026-10-20",
  verified_by: "Asha Rao",
  tags: [],
  ...o,
});

export const stop = (o: Partial<Stop> = {}): Stop => ({
  id: "stop-one",
  level: "B1",
  order: 1,
  title: "Stop one",
  outcome: "Do the thing.",
  why_it_matters: "Because it is the base for what comes next.",
  hours: 2,
  gap_tags: ["tag-one"],
  primary_resource: "res-one",
  alternates: [],
  check: { type: "mcq", question_ids: ["chk-1", "chk-2", "chk-3"] },
  body: "Lesson text.",
  ...review,
  ...o,
});

export const check = (o: Partial<CheckQuestion> = {}): CheckQuestion => ({
  id: "chk-1",
  stop_id: "stop-one",
  stem: "Question?",
  options,
  correct: "a",
  explanation: "Because.",
  ...review,
  ...o,
});

export const placement = (o: Partial<PlacementQuestion> = {}): PlacementQuestion => ({
  id: "pq-1",
  level: "B1",
  topic_tags: ["tag-one"],
  stem: "Question?",
  options,
  correct: "a",
  explanation: "Because.",
  ...review,
  ...o,
});

export const interview = (o: Partial<InterviewQuestion> = {}): InterviewQuestion => ({
  id: "iq-1",
  question: "What is RAG?",
  short_answer: "Retrieval augmented generation: fetch relevant text, then answer from it.",
  deeper_answer: "A longer answer.",
  follow_ups: ["How do you chunk?", "How do you evaluate it?"],
  common_mistakes: ["Skipping evaluation"],
  level: "I2",
  topic: "rag",
  stop_id: "stop-one",
  ...review,
  ...o,
});

export const book = (o: Partial<Book> = {}): Book => ({
  id: "book-1",
  title: "A book",
  author: "An Author",
  level: "B2",
  why: "Clear.",
  amazon_in_url: "https://www.amazon.in/dp/EXAMPLE",
  affiliate: true,
  ...o,
});

/** Small and fully valid in development mode (not at launch size). */
export function validBundle(): Bundle {
  const f = (file: string) => ({ file });
  return {
    goals: [{ ...f("goals/g.yaml"), data: { id: "genai-engineer", name: "GenAI Engineer", description: "Build." } }],
    levels: LEVEL_IDS.map((id) => ({
      ...f("levels/levels.yaml"),
      data: {
        id,
        name: `Level ${id}`,
        can_do: "Can do.",
        draft_hours: 10,
        exit_check: "Check.",
        topics: [id === "B1" ? "tag-one" : `${id.toLowerCase()}-a`, `${id.toLowerCase()}-b`, `${id.toLowerCase()}-c`].map(
          (t, i) => ({ id: t, title: `Topic ${t}`, summary: "What you learn.", optional: i > 0 }),
        ),
      },
    })),
    stops: [{ ...f("stops/B1/stop-one.mdx"), data: stop() }],
    resources: [{ ...f("resources/res-one.yaml"), data: resource() }],
    placement: [{ ...f("questions/placement/pq-1.yaml"), data: placement() }],
    checks: ["chk-1", "chk-2", "chk-3"].map((id) => ({
      ...f(`questions/checks/${id}.yaml`),
      data: check({ id }),
    })),
    interview: [{ ...f("questions/interview/iq-1.yaml"), data: interview() }],
    books: [{ ...f("books/book-1.yaml"), data: book() }],
  };
}
