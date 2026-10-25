// Content schemas. The field names are the contract in the PRD data model
// (docs/PRD.md, "Data model"); add fields if needed but do not rename them.
// Every object is strict, so a misspelled field in a YAML file fails the build.
import { z } from "zod";
import { LEVEL_IDS } from "@/lib/levels";

/**
 * ED-1: hard cap for a paid resource, "about 10 US dollars". This is an
 * assumption about the exchange rate; recheck it and change it here.
 */
export const PRICE_CAP_INR = 900;

/** IQ-1 and RM-2 word limits. */
export const SHORT_ANSWER_MAX_WORDS = 60;
export const WHY_IT_MATTERS_MAX_WORDS = 60;

export const wordCount = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length;

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

/** Frontmatter of content/stops/<level>/<id>.mdx. The MDX body is the lesson text. */
export const StopFrontmatter = z
  .strictObject({
    id: Slug,
    level: Level,
    order: z.number().int().positive(),
    title: Text,
    outcome: Text,
    why_it_matters: Text.max(360),
    hours: z.number().min(1).max(6),
    gap_tags: z.array(Slug),
    primary_resource: Slug,
    alternates: z.array(Slug).max(2),
    check: z.discriminatedUnion("type", [McqCheck, ProjectCheck]),
    ...reviewShape,
  })
  .superRefine((s, ctx) => {
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
export const InterviewQuestion = z
  .strictObject({
    id: Slug,
    question: Text,
    short_answer: Text,
    deeper_answer: Text,
    follow_ups: z.array(Text).min(2).max(3),
    common_mistakes: z.array(Text),
    level: Level,
    topic: Slug,
    stop_id: Slug,
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

// ---------------------------------------------------------- goal & levels ---

export const LevelDefinition = z.strictObject({
  id: Level,
  name: Text,
  can_do: Text,
  draft_hours: z.number().positive(),
  exit_check: Text,
});
export type LevelDefinition = z.infer<typeof LevelDefinition>;

export const LevelsFile = z.strictObject({ levels: z.array(LevelDefinition) });

export const Goal = z.strictObject({
  id: Slug,
  name: Text,
  description: Text,
});
export type Goal = z.infer<typeof Goal>;
