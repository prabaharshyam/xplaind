// Content schemas. The field names are the contract in the PRD data model
// (docs/PRD.md, "Data model"); add fields if needed but do not rename them.
// Every object is strict, so a misspelled field in a YAML file fails the build.
import { z } from "zod";
import { INTERVIEW_TOPIC_IDS } from "@/lib/interview-topics";
import { LEVEL_IDS } from "@/lib/levels";
import { THEME_IDS } from "@/lib/themes";

/**
 * ED-1: hard cap for a paid resource, "about 10 US dollars". This is an
 * assumption about the exchange rate; recheck it and change it here.
 */
export const PRICE_CAP_INR = 900;

/** IQ-1 and RM-2 word limits. */
export const SHORT_ANSWER_MAX_WORDS = 60;
export const WHY_IT_MATTERS_MAX_WORDS = 60;

export const wordCount = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length;

/** The sections an explainer lesson's body has, as level-2 headings, in this order. */
export const EXPLAINER_SECTIONS = ["What it is", "How it works", "A worked example", "Common mistakes", "Practise"] as const;
export const EXPLAINER_MIN_WORDS = 500;
export const EXPLAINER_MAX_WORDS = 1500;
/** A deep lesson has the same sections, written at roadmap.sh-pack depth, with a diagram and a table. */
export const DEEP_MIN_WORDS = 1000;
export const DEEP_MAX_WORDS = 3000;
export const FLASHCARD_ANSWER_MAX_WORDS = 70;
export const GLOSSARY_DEFINITION_MAX_WORDS = 45;

const IsoDate = z.iso.date();
const Slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "use lowercase letters, numbers and single hyphens");
const Text = z.string().trim().min(1, "must not be empty");
const HttpsUrl = z.url().refine((u) => u.startsWith("https://"), "must be an https URL");

export const Level = z.enum(LEVEL_IDS);
export const Cost = z.enum(["free", "free_cert_paid", "paid"]);

// ---------------------------------------------------------------- review ---

/** ED-9 / IQ-6: AI-assisted drafts must be flagged and signed off by a person. */
const reviewShape = {
  drafted_with_ai: z.boolean(),
  reviewed_by: Text,
  reviewed_on: IsoDate,
};

// -------------------------------------------------------------- resources ---

export const Resource = z
  .strictObject({
    id: Slug,
    title: Text,
    provider: Text,
    url: HttpsUrl,
    type: z.enum(["course", "video", "article", "book", "repo", "tool", "docs"]),
    level: Level,
    cost: Cost,
    price_inr: z.number().int().positive().optional(), // required when cost is "paid"
    price_checked_on: IsoDate.optional(), // required when price_inr is set
    exception_reason: Text.optional(), // required above the price cap
    hours: z.number().positive(),
    language: z.string().default("en"),
    certificate: z.boolean(),
    affiliate: z.boolean().default(false),
    affiliate_url: HttpsUrl.optional(), // RM-5: the tagged link /go uses; only when affiliate is true
    editor_score: z.number().min(0).max(5),
    why_picked: Text.max(280),
    last_verified: IsoDate,
    verified_by: Text,
    hosted_by: Text.optional(), // required when the link is a PDF (ED-8)
    tags: z.array(z.string()),
  })
  .superRefine((r, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    if (r.affiliate && !r.affiliate_url) {
      issue("affiliate_url", "RM-5: an affiliate resource needs affiliate_url, the tagged link /go redirects to");
    }
    if (!r.affiliate && r.affiliate_url) {
      issue("affiliate_url", "RM-5: affiliate_url is only allowed when affiliate is true");
    }
    if (r.cost === "paid" && r.price_inr === undefined) {
      issue("price_inr", "RM-6: a paid resource needs price_inr");
    }
    if (r.cost === "free" && r.price_inr !== undefined) {
      issue("price_inr", "a free resource must not have price_inr; use cost free_cert_paid or paid");
    }
    if (r.price_inr !== undefined && r.price_checked_on === undefined) {
      issue("price_checked_on", "RM-6: a price is never shown without its check date");
    }
    if (r.price_inr !== undefined && r.price_inr > PRICE_CAP_INR && !r.exception_reason) {
      issue(
        "exception_reason",
        `ED-1: price ₹${r.price_inr} is above the cap of ₹${PRICE_CAP_INR}; add exception_reason`,
      );
    }
    if (/\.pdf($|[?#])/i.test(new URL(r.url).pathname + new URL(r.url).search) && !r.hosted_by) {
      issue("hosted_by", "ED-8: a link to a PDF must say who hosts it (hosted_by)");
    }
  });
export type Resource = z.infer<typeof Resource>;

// ------------------------------------------------------------------ stops ---

const McqCheck = z.strictObject({
  type: z.literal("mcq"),
  question_ids: z.array(Slug).min(3).max(5),
});
const ProjectCheck = z.strictObject({ type: z.literal("project"), brief: Text });

/** "Test your understanding": a question and a short answer, revealed on demand. */
export const Flashcard = z.strictObject({ q: Text.max(200), a: Text });
/** "Predict / try it": a short scenario, questions to answer first, then "Check your answers". */
export const Exercise = z.strictObject({
  title: Text.max(80),
  setup: Text,
  questions: z.array(z.strictObject({ q: Text, a: Text })).min(3).max(6),
});

/** Frontmatter of content/stops/<level>/<id>.mdx. The MDX body is the lesson text. */
export const StopFrontmatter = z
  .strictObject({
    id: Slug,
    /** Difficulty on the shared nine-level ladder; also the folder the file sits in. */
    level: Level,
    /** The lesson's visual theme: its icon and colours on maps, cards and covers. */
    theme: z.enum(THEME_IDS),
    title: Text,
    outcome: Text,
    why_it_matters: Text.max(360),
    hours: z.number().min(1).max(6),
    gap_tags: z.array(Slug),
    primary_resource: Slug,
    alternates: z.array(Slug).max(2),
    /** More free courses on the same topic, from other providers, shown under the main picks. */
    more: z.array(Slug).max(6).default([]),
    check: z.discriminatedUnion("type", [McqCheck, ProjectCheck]),
    /**
     * "explainer": our own lesson text with the EXPLAINER_SECTIONS. "brief": a short
     * task that leans on the linked course; release 1 lessons, to be rewritten.
     */
    format: z.enum(["brief", "explainer", "deep"]).default("brief"),
    /** Glossary ids this lesson teaches or relies on. */
    key_terms: z.array(Slug).default([]),
    /** Deep lessons: 6 to 10 cards for "Test your understanding". */
    flashcards: z.array(Flashcard).max(10).default([]),
    /** Deep lessons: a "predict" or "try it" exercise with answers. */
    exercise: Exercise.optional(),
    /** Deep lessons: questions the AI tutor suggests for this lesson. */
    ask: z.array(Text.max(90)).max(4).default([]),
    ...reviewShape,
  })
  .superRefine((s, ctx) => {
    if (s.format === "deep") {
      if (s.flashcards.length < 6) ctx.addIssue({ code: "custom", path: ["flashcards"], message: "a deep lesson has 6 to 10 flashcards" });
      if (!s.exercise) ctx.addIssue({ code: "custom", path: ["exercise"], message: "a deep lesson has an exercise" });
      if (s.ask.length < 3) ctx.addIssue({ code: "custom", path: ["ask"], message: "a deep lesson suggests 3 or 4 questions for the AI tutor" });
    }
    for (const [i, c] of s.flashcards.entries()) {
      if (wordCount(c.a) > FLASHCARD_ANSWER_MAX_WORDS) {
        ctx.addIssue({ code: "custom", path: ["flashcards", i, "a"], message: `a flashcard answer is ${FLASHCARD_ANSWER_MAX_WORDS} words or fewer` });
      }
    }
    if (s.format !== "brief" && s.key_terms.length < 2) {
      ctx.addIssue({ code: "custom", path: ["key_terms"], message: "an explainer lesson lists at least 2 key terms" });
    }
    if (wordCount(s.why_it_matters) > WHY_IT_MATTERS_MAX_WORDS) {
      ctx.addIssue({
        code: "custom",
        path: ["why_it_matters"],
        message: `RM-2: why it matters must be ${WHY_IT_MATTERS_MAX_WORDS} words or fewer`,
      });
    }
  });
export type StopFrontmatter = z.infer<typeof StopFrontmatter>;

export type Stop = StopFrontmatter & { body: string };

// -------------------------------------------------------------- questions ---

const Option = z.strictObject({ id: Slug, text: Text });

const mcqShape = {
  stem: Text,
  options: z.array(Option).length(4),
  correct: Slug,
  explanation: Text,
  ...reviewShape,
};

function checkMcq(q: { options: { id: string }[]; correct: string }, ctx: z.RefinementCtx) {
  const ids = q.options.map((o) => o.id);
  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({ code: "custom", path: ["options"], message: "option ids must be unique" });
  }
  if (!ids.includes(q.correct)) {
    ctx.addIssue({
      code: "custom",
      path: ["correct"],
      message: `correct answer "${q.correct}" is not one of the option ids (${ids.join(", ")})`,
    });
  }
}

/** PL-1. The "I don't know" choice is added by the UI, not stored in the file. */
export const PlacementQuestion = z
  .strictObject({ id: Slug, level: Level, topic_tags: z.array(Slug).min(1), ...mcqShape })
  .superRefine(checkMcq);
export type PlacementQuestion = z.infer<typeof PlacementQuestion>;

/** IQ-5: the MCQs behind a stop's check. */
export const CheckQuestion = z
  .strictObject({ id: Slug, stop_id: Slug, ...mcqShape })
  .superRefine(checkMcq);
export type CheckQuestion = z.infer<typeof CheckQuestion>;

/** IQ-1. */
/**
 * One key point of a strong answer. The simulator marks it covered when the answer
 * uses any of its keywords (lower case; a keyword may be a short phrase).
 */
export const RubricPoint = z.strictObject({
  point: Text.max(140),
  keywords: z.array(z.string().trim().toLowerCase().min(2)).min(1),
});
export type RubricPoint = z.infer<typeof RubricPoint>;

export const InterviewQuestion = z
  .strictObject({
    id: Slug,
    question: Text,
    short_answer: Text,
    deeper_answer: Text,
    follow_ups: z.array(Text).min(2).max(3),
    common_mistakes: z.array(Text),
    level: Level,
    topic: z.enum(INTERVIEW_TOPIC_IDS),
    stop_id: Slug,
    /** VS-1: the key points a strong answer contains. The simulator checks a spoken answer against them. */
    rubric: z.array(RubricPoint).min(3).max(6),
    /** How long a spoken answer should take at most, as in a real interview. */
    answer_seconds: z.number().int().min(60).max(180),
    ...reviewShape,
  })
  .superRefine((q, ctx) => {
    if (wordCount(q.short_answer) > SHORT_ANSWER_MAX_WORDS) {
      ctx.addIssue({
        code: "custom",
        path: ["short_answer"],
        message: `IQ-1: short answer must be ${SHORT_ANSWER_MAX_WORDS} words or fewer`,
      });
    }
  });
export type InterviewQuestion = z.infer<typeof InterviewQuestion>;

// ------------------------------------------------------------------ books ---

/** BK-1 to BK-3. Every book link is an affiliate link and is always labelled. */
export const Book = z
  .strictObject({
    id: Slug,
    title: Text,
    author: Text,
    level: Level,
    why: Text.max(280),
    amazon_in_url: HttpsUrl,
    affiliate: z.literal(true),
    hosted_pdf_url: HttpsUrl.optional(),
    hosted_by: Text.optional(),
  })
  .superRefine((b, ctx) => {
    if (b.hosted_pdf_url && !b.hosted_by) {
      ctx.addIssue({
        code: "custom",
        path: ["hosted_by"],
        message: "ED-8: a link to a PDF must say who hosts it (hosted_by)",
      });
    }
  });
export type Book = z.infer<typeof Book>;

// --------------------------------------------------------------- glossary ---

/** One glossary entry (content/glossary/<id>.yaml). Plain words first, jargon second. */
export const GlossaryTerm = z
  .strictObject({
    id: Slug,
    term: Text,
    /** Other names and spellings people search for. */
    also: z.array(Text).default([]),
    definition: Text,
    /** A fuller plain-language explanation, with an everyday example. */
    explanation: Text.max(900).optional(),
    related: z.array(Slug).default([]),
    ...reviewShape,
  })
  .superRefine((g, ctx) => {
    if (wordCount(g.definition) > GLOSSARY_DEFINITION_MAX_WORDS) {
      ctx.addIssue({
        code: "custom",
        path: ["definition"],
        message: `a definition is ${GLOSSARY_DEFINITION_MAX_WORDS} words or fewer; put the rest in explanation`,
      });
    }
  });
export type GlossaryTerm = z.infer<typeof GlossaryTerm>;

// ---------------------------------------------------------- goal & levels ---

/**
 * One topic on a level's map. The id is the shared topic tag: placement questions
 * tag it, and the stop that teaches it lists it in gap_tags. A topic with no stop
 * yet still shows on the roadmap as "coming soon".
 */
export const Topic = z.strictObject({
  id: Slug,
  title: Text,
  summary: Text.max(140),
  optional: z.boolean().default(false),
});
export type Topic = z.infer<typeof Topic>;

export const LevelDefinition = z.strictObject({
  id: Level,
  name: Text,
  can_do: Text,
  draft_hours: z.number().positive(),
  exit_check: Text,
  topics: z.array(Topic).min(3, "a level needs at least 3 topics"),
});
export type LevelDefinition = z.infer<typeof LevelDefinition>;

export const LevelsFile = z.strictObject({ levels: z.array(LevelDefinition) });

/** A stage's closing project: the proof a learner shows an employer. */
export const StageProject = z.strictObject({
  title: Text,
  brief: Text,
  deliverables: z.array(Text).min(1),
});
export type StageProject = z.infer<typeof StageProject>;

/** A topic on a path that has no lesson yet. Shows on the map as "being written". */
export const PlannedTopic = z.strictObject({ title: Text, summary: Text.max(140) });

/**
 * One stage of a path: lessons in the order the learner takes them. On a path laid
 * out by level, the stage id is the level id and its name comes from levels.yaml.
 */
export const PathStage = z.strictObject({
  id: z.union([Level, Slug]),
  title: Text.optional(),
  summary: Text.max(200).optional(),
  lessons: z.array(Slug),
  planned: z.array(PlannedTopic).default([]),
  project: StageProject.optional(),
});
export type PathStage = z.infer<typeof PathStage>;

/**
 * A path (the PRD calls it a goal): an ordered route through the shared lesson
 * library. placement "ladder" means the level test can skip lessons below the
 * learner's level; "none" means everyone starts at the first stage.
 */
export const Goal = z.strictObject({
  id: Slug,
  name: Text,
  /** One line for the path chooser. */
  tagline: Text.max(120),
  description: Text,
  who_for: Text,
  /** The path's visual theme on cards and its roadmap. */
  theme: z.enum(THEME_IDS),
  rank: z.number().int().positive(),
  coding: z.enum(["none", "some", "yes"]),
  layout: z.enum(["levels", "stages"]),
  placement: z.enum(["ladder", "none"]),
  months: z.number().positive(),
  stages: z.array(PathStage).min(1),
});
export type Goal = z.infer<typeof Goal>;

// ---------------------------------------------------------- certifications ---

/**
 * A paid certification exam from a large provider, with the free courses that
 * prepare for it. RM-6: a fee always carries the date it was checked.
 */
export const Certification = z
  .strictObject({
    id: Slug,
    name: Text,
    provider: Text,
    exam_code: Text.optional(),
    level: Level,
    /** Who it suits, in one or two sentences. */
    audience: Text.max(300),
    covers: Text.max(400),
    format: Text.max(120),
    fee_usd: z.number().positive().optional(),
    /** Where the fee is not one number, say how it is set. */
    fee_note: Text.max(160).optional(),
    fee_checked_on: IsoDate.optional(),
    official_url: HttpsUrl,
    /** Free resources that prepare for it, best first. */
    prep: z.array(Slug).min(1),
    paths: z.array(Slug).min(1),
    last_verified: IsoDate,
    verified_by: Text,
  })
  .superRefine((c, ctx) => {
    if (c.fee_usd !== undefined && !c.fee_checked_on) {
      ctx.addIssue({ code: "custom", path: ["fee_checked_on"], message: "RM-6: a fee is never shown without its check date" });
    }
    if (c.fee_usd === undefined && !c.fee_note) {
      ctx.addIssue({ code: "custom", path: ["fee_note"], message: "give fee_usd with its check date, or a fee_note" });
    }
  });
export type Certification = z.infer<typeof Certification>;

// ------------------------------------------------------------------- blog ---

export const BLOG_DESCRIPTION_MAX = 170;

/** Frontmatter of content/blog/<id>.mdx. The MDX body is the article. */
export const BlogFrontmatter = z.strictObject({
  id: Slug,
  title: Text.max(90),
  /** The search snippet: one or two sentences. */
  description: Text.max(BLOG_DESCRIPTION_MAX),
  published_on: IsoDate,
  updated_on: IsoDate,
  author: Text,
  tags: z.array(Slug).min(1),
  related_paths: z.array(Slug).default([]),
  related_lessons: z.array(Slug).default([]),
  /** Short questions and answers shown at the end and given to search engines. */
  faq: z.array(z.strictObject({ q: Text, a: Text.max(600) })).default([]),
  ...reviewShape,
});
export type BlogFrontmatter = z.infer<typeof BlogFrontmatter>;
export type BlogPost = BlogFrontmatter & { body: string };
