// Cross-file content checks (ED-8). Pure: takes a loaded bundle, returns issues.
// Per-file checks live in schema.ts; this file checks how the files fit together.
import { daysBetween } from "@/lib/dates";
import { PRICE_STALE_DAYS } from "@/lib/roadmap/cost";
import { LEVEL_IDS, type LevelId, levelIndex } from "@/lib/levels";
import { isHumanName } from "./review";
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
  const orderSeen = new Map<string, string>();
  const referenced = new Set<string>();
  for (const { file, data: s } of bundle.stops) {
    const key = `${s.level}:${s.order}`;
    const firstOrder = orderSeen.get(key);
    if (firstOrder) error(file, `order ${s.order} is already used at ${s.level} (${firstOrder})`);
    else orderSeen.set(key, file);

    const refs = [s.primary_resource, ...s.alternates];
    if (new Set(refs).size !== refs.length) error(file, "primary_resource and alternates must all be different");
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

    if (!isHumanName(s.reviewed_by)) {
      gap(file, `reviewed_by "${s.reviewed_by}" is not a person; a human must review this stop before launch`, "ED-9");
    }
    if (daysBetween(opts.today, s.reviewed_on) > 0) error(file, `reviewed_on ${s.reviewed_on} is in the future`, "ED-9");
  }

  for (const { file, data: r } of bundle.resources) {
    if (!referenced.has(r.id)) add("warning", file, `resource "${r.id}" is not used by any stop`);
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

  // ---- PL-4: every gap tag maps to a review stop ---------------------------
  for (const { file, data: q } of bundle.placement) {
    for (const tag of q.topic_tags) {
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
  const perTopic = new Map<string, number>();
  for (const { data: q } of bundle.interview) perTopic.set(q.topic, (perTopic.get(q.topic) ?? 0) + 1);
  for (const [topic, n] of perTopic) {
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
