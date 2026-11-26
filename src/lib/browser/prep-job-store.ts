// PREP-5, PREP-6: what the learner told us about the job, on this device only (owner decision): the
// company type, the pasted job post, the bank questions it points at, and the questions written for it
// with their ratings. None of it is sent to the account. Every read is checked.
import type { RatingRecord } from "@/lib/practice/queue";
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
