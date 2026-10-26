// Small factories for content tests. A valid record per collection, plus a valid
// bundle, so each test can break exactly one thing.
import type { Bundle } from "./types";
import type {
  BlogPost,
  Certification,
  Goal,
  GlossaryTerm,
  GuidedProject,
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
  theme: "ai-basics",
  title: "Stop one",
  outcome: "Do the thing.",
  why_it_matters: "Because it is the base for what comes next.",
  hours: 2,
  gap_tags: ["tag-one"],
  primary_resource: "res-one",
  alternates: [],
  more: [],
  check: { type: "mcq", question_ids: ["chk-1", "chk-2", "chk-3"] },
  format: "brief",
  flashcards: [],
  ask: [],
  key_terms: [],
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
  rubric: [
    { point: "Retrieves relevant text first", keywords: ["retrieve", "search"] },
    { point: "Answers from that text", keywords: ["ground", "context"] },
    { point: "Evaluates retrieval", keywords: ["evaluate", "recall"] },
  ],
  answer_seconds: 90,
  ...review,
  ...o,
});

export const certification = (o: Partial<Certification> = {}): Certification => ({
  id: "cert-one",
  name: "Cert one",
  provider: "Provider",
  level: "B2",
  audience: "Beginners.",
  covers: "Basics.",
  format: "90 minutes",
  fee_usd: 100,
  fee_checked_on: "2026-01-01",
  official_url: "https://example.com/cert",
  prep: ["res-one"],
  paths: ["genai-engineer"],
  last_verified: "2026-01-01",
  verified_by: "Asha Rao",
  ...o,
});

export const blogPost = (o: Partial<BlogPost> = {}): BlogPost => ({
  id: "post-one",
  title: "Post one",
  description: "A post.",
  published_on: "2026-01-01",
  updated_on: "2026-01-01",
  author: "Xplaind",
  tags: ["learning"],
  related_paths: [],
  related_lessons: [],
  faq: [],
  body: "Plain text.",
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

export const goal = (o: Partial<Goal> = {}): Goal => ({
  id: "genai-engineer",
  name: "GenAI Engineer",
  tagline: "Build apps on language models.",
  description: "Build.",
  who_for: "Engineers.",
  theme: "llm",
  rank: 1,
  coding: "yes",
  layout: "levels",
  placement: "ladder",
  months: 9,
  stages: LEVEL_IDS.map((id) => ({ id, lessons: id === "B1" ? ["stop-one"] : [], planned: [] })),
  ...o,
});

export const term = (o: Partial<GlossaryTerm> = {}): GlossaryTerm => ({
  id: "term-one",
  term: "Term one",
  also: [],
  definition: "A short plain definition.",
  related: [],
  ...review,
  ...o,
});

/** An explainer body with every section, long enough to pass. */
export const explainerBody = (words = 520): string => {
  const filler = Array.from({ length: Math.ceil(words / 20) }, () => "Plain words that teach.").join(" ");
  return ["What it is", "How it works", "A worked example", "Common mistakes", "Practise"].map((h) => `## ${h}\n\n${filler}`).join("\n\n");
};

/** A deep lesson's body: the five sections, a text diagram and a table. */
export const deepBody = (words = 1050): string =>
  explainerBody(words).replace("## How it works\n\n", "## How it works\n\n```text\n[a] --> [b]\n```\n\n```python\n# a comment, not a heading\n```\n\n| Part | Job |\n| --- | --- |\n| a | b |\n\n");

export const deepExtras = {
  flashcards: Array.from({ length: 6 }, (_, i) => ({ q: `Question ${i + 1}?`, a: "A short answer." })),
  exercise: { title: "Predict it", setup: "A scenario.", questions: [1, 2, 3].map((n) => ({ q: `Q${n}?`, a: `A${n}.` })) },
  ask: ["Why?", "How?", "What next?"],
};

/** Small and fully valid in development mode (not at launch size). */
export function validBundle(): Bundle {
  const f = (file: string) => ({ file });
  return {
    goals: [{ ...f("goals/genai-engineer.yaml"), data: goal() }],
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
    glossary: [{ ...f("glossary/term-one.yaml"), data: term() }, { ...f("glossary/term-two.yaml"), data: term({ id: "term-two", term: "Term two", related: ["term-one"] }) }],
    certifications: [{ ...f("certifications/cert-one.yaml"), data: certification() }],
    blog: [{ ...f("blog/post-one.mdx"), data: blogPost() }],
    projects: [],
  };
}

/** A small valid guided project (GP-1). */
export const guidedProject = (o: Partial<GuidedProject> = {}): GuidedProject => ({
  id: "project-one",
  title: "A small project",
  summary: "Build a small thing.",
  difficulty: "starter",
  hours: 4,
  lessons: ["stop-one"],
  you_will_need: ["A laptop"],
  steps: [1, 2, 3, 4].map((n) => ({ title: `Step ${n}`, body: "Do it.", done_when: "It works." })),
  rubric: [1, 2, 3, 4].map((n) => ({ criterion: `Criterion ${n}`, strong: "Good.", weak: "Not good." })),
  deliverables: ["A repository"],
  stretch: [],
  drafted_with_ai: true,
  reviewed_by: "Priya Raman",
  reviewed_on: TODAY,
  ...o,
});
