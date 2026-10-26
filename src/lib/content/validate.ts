// Cross-file content checks (ED-8). Pure: takes a loaded bundle, returns issues.
// Per-file checks live in schema.ts; this file checks how the files fit together.
import { daysBetween } from "@/lib/dates";
import { INTERVIEW_TOPICS } from "@/lib/interview-topics";
import { PRICE_STALE_DAYS } from "@/lib/roadmap/cost";
import { LEVEL_IDS, type LevelId, levelIndex } from "@/lib/levels";
import { isHumanName } from "./review";
import { EXPLAINER_MAX_WORDS, EXPLAINER_MIN_WORDS, EXPLAINER_SECTIONS, wordCount } from "./schema";
import type { Bundle, Entry, Issue } from "./types";

/** Launch minimums from the PRD. They fail the build only in launch mode. */
export const LAUNCH_MINIMUMS = {
  placementPerLevel: 5, // PL-1 (launch target is 6)
  stopsPerLevel: 5, // Roadmap engine: at least 5 stops per level
  interviewPerTopic: 5, // IQ-2
} as const;

/** Re-verify a resource whose last_verified is older than this many days. */
export const STALE_VERIFICATION_DAYS = 180;

export type ValidateOptions = {
  /** Today as YYYY-MM-DD in India. Passed in so tests are stable. */
  today: string;
  /** Launch mode turns coverage gaps and missing human sign-off into errors. */
  launch?: boolean;
};

export function validateBundle(bundle: Bundle, opts: ValidateOptions): Issue[] {
  const issues: Issue[] = [];
  const launchSeverity = opts.launch ? "error" : "warning";
  const add = (severity: Issue["severity"], file: string, message: string, rule?: string) =>
    issues.push({ severity, file, message, rule });
  const error = (file: string, message: string, rule?: string) => add("error", file, message, rule);
  const gap = (file: string, message: string, rule?: string) => add(launchSeverity, file, message, rule);

  // ---- goal and levels ---------------------------------------------------
  if (bundle.goals.length === 0) error("goals", "at least one goal is needed (goals/genai-engineer.yaml)");

  const levelIds = bundle.levels.map((l) => l.data.id);
  if (bundle.levels.length > 0 && levelIds.join() !== LEVEL_IDS.join()) {
    error(
      "levels/levels.yaml",
      `levels must be exactly ${LEVEL_IDS.join(", ")} in that order; found ${levelIds.join(", ") || "none"}`,
      "PL-1",
    );
  }

  // ---- topics (the roadmap outline) ---------------------------------------
  /** Topic id to the level it sits on. */
  const topicLevel = new Map<string, LevelId>();
  for (const { file, data: l } of bundle.levels) {
    for (const t of l.topics) {
      const first = topicLevel.get(t.id);
      if (first) error(file, `topic "${t.id}" is listed at ${first} and ${l.id}; a topic sits on one level`, "RM-1");
      else topicLevel.set(t.id, l.id);
    }
  }
  const hasTopics = topicLevel.size > 0;

  // ---- unique ids ---------------------------------------------------------
  const uniqueIds = (label: string, entries: Entry<{ id: string }>[]) => {
    const seen = new Map<string, string>();
    for (const e of entries) {
      const first = seen.get(e.data.id);
      if (first) error(e.file, `duplicate ${label} id "${e.data.id}" (also in ${first})`);
      else seen.set(e.data.id, e.file);
    }
  };
  uniqueIds("goal", bundle.goals);
  uniqueIds("stop", bundle.stops);
  uniqueIds("resource", bundle.resources);
  uniqueIds("placement question", bundle.placement);
  uniqueIds("check question", bundle.checks);
  uniqueIds("interview question", bundle.interview);
  uniqueIds("book", bundle.books);
  uniqueIds("glossary term", bundle.glossary);

  const resourceById = new Map(bundle.resources.map((r) => [r.data.id, r]));
  const stopById = new Map(bundle.stops.map((s) => [s.data.id, s]));
  const checkById = new Map(bundle.checks.map((c) => [c.data.id, c]));

  // ---- resources ----------------------------------------------------------
  const urlOwner = new Map<string, string>();
  for (const { file, data: r } of bundle.resources) {
    const first = urlOwner.get(r.url);
    if (first) error(file, `same url as ${first}; one resource per link`);
    else urlOwner.set(r.url, file);

    for (const [field, date] of [
      ["last_verified", r.last_verified],
      ["price_checked_on", r.price_checked_on],
    ] as const) {
      if (date && daysBetween(opts.today, date) > 0) error(file, `${field} ${date} is in the future`, "ED-4");
    }
    if (daysBetween(r.last_verified, opts.today) > STALE_VERIFICATION_DAYS) {
      add("warning", file, `last_verified ${r.last_verified} is over ${STALE_VERIFICATION_DAYS} days old; open the page again`, "ED-1");
    }
    if (r.price_checked_on && daysBetween(r.price_checked_on, opts.today) > PRICE_STALE_DAYS) {
      add("warning", file, `price checked on ${r.price_checked_on} is over ${PRICE_STALE_DAYS} days old; the site will say "price may have changed"`, "RM-6");
    }
    if (!isHumanName(r.verified_by)) {
      gap(file, `verified_by "${r.verified_by}" is not a person; a human must open the page and confirm access and price`, "ED-4");
    }
  }

  // ---- stops --------------------------------------------------------------
  const referenced = new Set<string>();
  for (const { file, data: s } of bundle.stops) {
    const refs = [s.primary_resource, ...s.alternates, ...s.more];
    if (new Set(refs).size !== refs.length) error(file, "primary_resource, alternates and more must all be different");
    for (const id of refs) {
      referenced.add(id);
      if (!resourceById.has(id)) error(file, `resource "${id}" does not exist`, "RM-2");
    }

    if (s.check.type === "mcq") {
      const ids = s.check.question_ids;
      if (new Set(ids).size !== ids.length) error(file, "check.question_ids repeats a question");
      for (const qid of ids) {
        const q = checkById.get(qid);
        if (!q) error(file, `check question "${qid}" does not exist`, "IQ-5");
        else if (q.data.stop_id !== s.id) error(file, `check question "${qid}" belongs to stop "${q.data.stop_id}", not "${s.id}"`, "IQ-5");
      }
    }

    for (const tag of s.gap_tags) {
      const at = topicLevel.get(tag);
      if (hasTopics && !at) error(file, `gap tag "${tag}" is not a topic in levels/levels.yaml`, "RM-1");
      else if (at && levelIndex(at) > levelIndex(s.level)) {
        error(file, `gap tag "${tag}" is a ${at} topic, above this ${s.level} stop`, "RM-1");
      }
    }

    if (!isHumanName(s.reviewed_by)) {
      gap(file, `reviewed_by "${s.reviewed_by}" is not a person; a human must review this stop before launch`, "ED-9");
    }
    if (daysBetween(opts.today, s.reviewed_on) > 0) error(file, `reviewed_on ${s.reviewed_on} is in the future`, "ED-9");
  }

  // ---- lesson format and glossary -----------------------------------------
  const termIds = new Set(bundle.glossary.map((g) => g.data.id));
  for (const { file, data: s } of bundle.stops) {
    for (const t of s.key_terms) if (!termIds.has(t)) error(file, `key term "${t}" is not in the glossary`);
    if (s.format === "brief") {
      gap(file, `lesson "${s.id}" is still a brief; write it as an explainer`, "RM-2");
      continue;
    }
    const headings = [...s.body.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
    const missing = EXPLAINER_SECTIONS.filter((h) => !headings.includes(h));
    if (missing.length) error(file, `an explainer needs the sections ${EXPLAINER_SECTIONS.join(", ")}; missing ${missing.join(", ")}`);
    else if (EXPLAINER_SECTIONS.map((h) => headings.indexOf(h)).some((at, i, all) => i > 0 && at < all[i - 1])) {
      error(file, `explainer sections must come in the order ${EXPLAINER_SECTIONS.join(", ")}`);
    }
    const words = wordCount(s.body);
    if (words < EXPLAINER_MIN_WORDS || words > EXPLAINER_MAX_WORDS) {
      error(file, `an explainer is ${EXPLAINER_MIN_WORDS} to ${EXPLAINER_MAX_WORDS} words; this one is ${words}`);
    }
  }
  for (const { file, data: g } of bundle.glossary) {
    for (const r of g.related) {
      if (r === g.id) error(file, "a term cannot be related to itself");
      else if (!termIds.has(r)) error(file, `related term "${r}" is not in the glossary`);
    }
    if (!isHumanName(g.reviewed_by)) gap(file, `reviewed_by "${g.reviewed_by}" is not a person; a human must review this term`, "ED-9");
  }

  for (const { file, data: r } of bundle.resources) {
    if (!referenced.has(r.id)) add("warning", file, `resource "${r.id}" is not used by any stop`);
  }

  // ---- paths --------------------------------------------------------------
  const onAPath = new Set<string>();
  for (const { file, data: g } of bundle.goals) {
    const seen = new Set<string>();
    const stageIds = g.stages.map((st) => st.id);
    if (new Set(stageIds).size !== stageIds.length) error(file, "stage ids must be unique");
    if (g.layout === "levels" && stageIds.join() !== LEVEL_IDS.join()) {
      error(file, `a path laid out by level needs stages ${LEVEL_IDS.join(", ")} in that order`, "RM-1");
    }
    for (const st of g.stages) {
      if (g.layout === "stages" && (!st.title || !st.summary)) error(file, `stage "${st.id}" needs a title and a summary`);
      if (g.layout === "stages" && LEVEL_IDS.includes(st.id as LevelId)) error(file, `stage "${st.id}" is a level id; use a name`);
      if (g.layout === "stages" && st.lessons.length === 0 && st.planned.length === 0) error(file, `stage "${st.id}" has no lessons and nothing planned`);
      for (const id of st.lessons) {
        const lesson = stopById.get(id);
        if (!lesson) error(file, `lesson "${id}" does not exist`, "RM-2");
        else if (g.layout === "levels" && lesson.data.level !== st.id) {
          error(file, `lesson "${id}" is a ${lesson.data.level} lesson, listed at ${st.id}`, "RM-1");
        }
        if (seen.has(id)) error(file, `lesson "${id}" is listed twice on this path`);
        seen.add(id);
        onAPath.add(id);
      }
      if (st.planned.length > 0) gap(file, `stage "${st.id}" has ${st.planned.length} planned topics with no lesson yet`, "RM-2");
    }
  }
  for (const { file, data: s } of bundle.stops) {
    if (bundle.goals.length > 0 && !onAPath.has(s.id)) add("warning", file, `lesson "${s.id}" is not on any path`);
  }

  // ---- questions ----------------------------------------------------------
  const usedChecks = new Set(
    bundle.stops.flatMap((s) => (s.data.check.type === "mcq" ? s.data.check.question_ids : [])),
  );
  for (const { file, data: q } of bundle.checks) {
    if (!stopById.has(q.stop_id)) error(file, `stop "${q.stop_id}" does not exist`, "IQ-5");
    else if (!usedChecks.has(q.id)) add("warning", file, `check question "${q.id}" is not used by its stop`);
  }
  for (const { file, data: q } of bundle.interview) {
    if (!stopById.has(q.stop_id)) error(file, `stop "${q.stop_id}" does not exist`, "IQ-2");
  }

  const reviewed = [...bundle.placement, ...bundle.checks, ...bundle.interview];
  for (const { file, data: q } of reviewed) {
    if (!isHumanName(q.reviewed_by)) {
      gap(file, `reviewed_by "${q.reviewed_by}" is not a person; a human must review this question before launch`, "IQ-6");
    }
    if (daysBetween(opts.today, q.reviewed_on) > 0) error(file, `reviewed_on ${q.reviewed_on} is in the future`, "IQ-6");
  }

  // ---- certifications -----------------------------------------------------
  const resourceIds = new Set(bundle.resources.map((r) => r.data.id));
  const goalIds = new Set(bundle.goals.map((g) => g.data.id));
  for (const { file, data: c } of bundle.certifications) {
    for (const id of c.prep) if (!resourceIds.has(id)) error(file, `prep resource "${id}" does not exist`, "RM-2");
    for (const id of c.paths) if (!goalIds.has(id)) error(file, `path "${id}" does not exist`);
    if (c.fee_checked_on && daysBetween(c.fee_checked_on, opts.today) > PRICE_STALE_DAYS) {
      gap(file, `fee checked on ${c.fee_checked_on}; check it again`, "RM-6");
    }
    if (!isHumanName(c.verified_by)) gap(file, `verified_by "${c.verified_by}" is not a person; a human must confirm the exam page`, "ED-4");
  }

  // ---- blog ---------------------------------------------------------------
  for (const { file, data: b } of bundle.blog) {
    if (b.updated_on < b.published_on) error(file, "updated_on is before published_on");
    if (daysBetween(opts.today, b.published_on) > 0) error(file, `published_on ${b.published_on} is in the future`);
    for (const id of b.related_paths) if (!goalIds.has(id)) error(file, `related path "${id}" does not exist`);
    for (const id of b.related_lessons) if (!stopById.has(id)) error(file, `related lesson "${id}" does not exist`);
    if (/[{<]/.test(b.body.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, ""))) {
      error(file, "use no { or < outside code; MDX reads them as code");
    }
    if (!isHumanName(b.reviewed_by)) gap(file, `reviewed_by "${b.reviewed_by}" is not a person; a human must review this article`, "ED-9");
  }

  // ---- PL-4: every gap tag maps to a review stop ---------------------------
  for (const { file, data: q } of bundle.placement) {
    for (const tag of q.topic_tags) {
      const at = topicLevel.get(tag);
      if (hasTopics && at !== q.level) {
        error(file, at ? `topic tag "${tag}" is a ${at} topic, not ${q.level}` : `topic tag "${tag}" is not a topic in levels/levels.yaml`, "RM-1");
      }
      const covered = bundle.stops.some(
        (s) => levelIndex(s.data.level) <= levelIndex(q.level) && s.data.gap_tags.includes(tag),
      );
      if (!covered) gap(file, `topic tag "${tag}" has no review stop at ${q.level} or below`, "PL-4");
    }
  }

  // ---- coverage -----------------------------------------------------------
  for (const level of LEVEL_IDS) {
    const placement = bundle.placement.filter((q) => q.data.level === level).length;
    const stops = bundle.stops.filter((s) => s.data.level === level).length;
    if (placement < LAUNCH_MINIMUMS.placementPerLevel) {
      gap(`coverage/${level}`, `${placement} placement questions at ${level}; launch needs at least ${LAUNCH_MINIMUMS.placementPerLevel}`, "PL-1");
    }
    if (stops < LAUNCH_MINIMUMS.stopsPerLevel) {
      gap(`coverage/${level}`, `${stops} stops at ${level}; launch needs at least ${LAUNCH_MINIMUMS.stopsPerLevel}`, "RM-2");
    }
  }
  for (const { data: l } of bundle.levels) {
    for (const t of l.topics) {
      if (t.optional) continue;
      const taught = bundle.stops.some((s) => s.data.level === l.id && s.data.gap_tags.includes(t.id));
      if (!taught) gap(`coverage/${l.id}`, `core topic "${t.id}" has no stop at ${l.id} yet`, "RM-2");
    }
  }
  for (const { id: topic } of INTERVIEW_TOPICS) {
    const n = bundle.interview.filter((q) => q.data.topic === topic).length;
    if (n < LAUNCH_MINIMUMS.interviewPerTopic) {
      gap(`coverage/interview/${topic}`, `${n} interview questions on "${topic}"; launch needs at least ${LAUNCH_MINIMUMS.interviewPerTopic}`, "IQ-2");
    }
  }

  return issues;
}

export type LevelCoverage = {
  level: LevelId;
  stops: number;
  stopHours: number;
  draftHours: number | undefined;
  resources: number;
  placement: number;
  checks: number;
};

/** Counts per level, for the validate report. */
export function coverage(bundle: Bundle): LevelCoverage[] {
  const stopLevelById = new Map(bundle.stops.map((s) => [s.data.id, s.data.level]));
  return LEVEL_IDS.map((level) => {
    const stops = bundle.stops.filter((s) => s.data.level === level);
    return {
      level,
      stops: stops.length,
      stopHours: stops.reduce((sum, s) => sum + s.data.hours, 0),
      draftHours: bundle.levels.find((l) => l.data.id === level)?.data.draft_hours,
      resources: bundle.resources.filter((r) => r.data.level === level).length,
      placement: bundle.placement.filter((q) => q.data.level === level).length,
      checks: bundle.checks.filter((c) => stopLevelById.get(c.data.stop_id) === level).length,
    };
  });
}
