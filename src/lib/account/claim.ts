// AC-2: what /api/claim accepts from a device, and how device and server data
// merge. Pure: no database or framework imports.
import { z } from "zod";
import { scoreAnswers } from "@/lib/placement/score";
import { gradeChoices, isValidStaircase } from "@/lib/placement/select";
import type { Answer, BankQuestion, PlacementResult } from "@/lib/placement/types";
import type { RatingRecord, Ratings } from "@/lib/practice/queue";
import type { ProgressMap, StopProgress } from "@/lib/roadmap/types";

const IsoDate = z.iso.date();
const Id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80);

export const StopProgressInput = z.strictObject({
  status: z.enum(["in_progress", "done"]),
  how: z.enum(["check", "project", "self_skipped"]).optional(),
  score: z.number().int().min(0).max(100).optional(),
  projectUrl: z.url().max(500).optional(),
  updatedOn: IsoDate,
});

export const RatingInput = z.strictObject({ rating: z.union([z.literal(0), z.literal(1), z.literal(2)]), updatedOn: IsoDate });

export const ClaimBody = z.strictObject({
  attempt: z
    .strictObject({
      goal: Id,
      weeklyHours: z.number().int().min(1).max(40),
      completedOn: IsoDate,
      choices: z.array(z.strictObject({ questionId: Id, choice: z.string().max(20).nullable() })).min(1).max(20),
    })
    .nullable(),
  progress: z.record(Id, StopProgressInput).refine((r) => Object.keys(r).length <= 300, "too many stops"),
  ratings: z.record(Id, RatingInput).refine((r) => Object.keys(r).length <= 1000, "too many ratings"),
});
export type ClaimBody = z.infer<typeof ClaimBody>;

export class InvalidClaimError extends Error {}

/** PL-5 / Architecture: the server re-scores the raw choices and rejects a sequence the staircase could not produce. */
export function rescoreAttempt(bank: readonly BankQuestion[], choices: ClaimBody["attempt"] & object): { answers: Answer[]; result: PlacementResult } {
  let answers: Answer[];
  try {
    answers = gradeChoices(bank, choices.choices);
  } catch (e) {
    throw new InvalidClaimError((e as Error).message);
  }
  if (!isValidStaircase(answers)) throw new InvalidClaimError("these answers could not come from the test");
  return { answers, result: scoreAnswers(answers) };
}

/** Done beats in progress; otherwise the later update wins; a tie keeps the server's record. */
export function mergeStop(device: StopProgress | undefined, server: StopProgress | undefined): StopProgress | undefined {
  if (!device) return server;
  if (!server) return device;
  if (device.status !== server.status) return device.status === "done" ? device : server;
  return device.updatedOn > server.updatedOn ? device : server;
}

export function mergeProgress(device: ProgressMap, server: ProgressMap): Record<string, StopProgress> {
  const out: Record<string, StopProgress> = {};
  for (const id of new Set([...Object.keys(device), ...Object.keys(server)])) {
    const merged = mergeStop(device[id], server[id]);
    if (merged) out[id] = merged;
  }
  return out;
}

export function mergeRatings(device: Ratings, server: Ratings): Record<string, RatingRecord> {
  const out: Record<string, RatingRecord> = { ...server };
  for (const [id, r] of Object.entries(device)) {
    if (!out[id] || r.updatedOn > out[id].updatedOn) out[id] = r;
  }
  return out;
}

/** AC-5: days that count towards the streak: a stop marked done, a check taken, a practice rating. */
export function activityDays(progress: ProgressMap, ratings: Ratings): string[] {
  const days = new Set<string>();
  for (const p of Object.values(progress)) if (p.status === "done" || p.score !== undefined) days.add(p.updatedOn);
  for (const r of Object.values(ratings)) days.add(r.updatedOn);
  return [...days].sort();
}
