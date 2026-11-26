// PREP-5, PREP-6: what the learner told us about the job, on this device only (owner decision): the
// company type, the pasted job post, the bank questions it points at, and the questions written for it
// with their ratings. None of it is sent to the account. Every read is checked.
import type { RatingRecord } from "@/lib/practice/queue";
import { Stories, type Story, type StoryKind } from "@/lib/prep/extras";
import { NO_JOB, PrepJob } from "@/lib/prep/job";
import { read, write } from "./storage";

export const PREP_JOB_KEY = "xplaind.prep-job.v1";

export const rawPrepJob = (): string | null => read(PREP_JOB_KEY);

export function parsePrepJob(raw: string | null): PrepJob {
  if (!raw) return NO_JOB;
  try {
    const p = PrepJob.safeParse(JSON.parse(raw));
    return p.success ? p.data : NO_JOB;
  } catch {
    return NO_JOB;
  }
}

/** Saves the job details (null removes them, with the generated questions and their ratings). */
export const savePrepJob = (job: PrepJob | null): void => write(PREP_JOB_KEY, job ? JSON.stringify(job) : null);

/** A rating for a generated question. Kept here, not with the bank's ratings, which follow the account. */
export function rateGenerated(id: string, record: RatingRecord): void {
  const job = parsePrepJob(rawPrepJob());
  savePrepJob({ ...job, ratings: { ...job.ratings, [id]: record } });
}

// PREP-8: the learner's own interview stories, on this device only (owner decision). They are not part
// of one plan, so removing a plan keeps them.
export const PREP_STORIES_KEY = "xplaind.prep-stories.v1";
export const rawStories = (): string | null => read(PREP_STORIES_KEY);

export function parseStories(raw: string | null): Stories {
  if (!raw) return {};
  try {
    const p = Stories.safeParse(JSON.parse(raw));
    return p.success ? p.data : {};
  } catch {
    return {};
  }
}

export const saveStory = (kind: StoryKind, story: Story): void => write(PREP_STORIES_KEY, JSON.stringify({ ...parseStories(rawStories()), [kind]: story }));
