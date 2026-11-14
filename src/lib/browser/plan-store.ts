// WP-2: this week's study plan, kept on this device only. Every read is checked.
import { z } from "zod";
import type { SavedPlan } from "@/lib/plan/weekly";
import { read, write } from "./storage";

export const PLAN_KEY = "xplaind.plan.v1";

const Shape = z.strictObject({
  week: z.iso.date(),
  pathId: z.string().regex(/^[a-z0-9-]{1,64}$/),
  hours: z.number().min(1).max(40),
  lessonIds: z.array(z.string().max(80)).max(30),
});

export const rawPlan = (): string | null => read(PLAN_KEY);

export function parsePlan(raw: string | null): SavedPlan | null {
  if (!raw) return null;
  try {
    const p = Shape.safeParse(JSON.parse(raw));
    return p.success ? p.data : null;
  } catch {
    return null;
  }
}

export const savePlan = (plan: SavedPlan): void => write(PLAN_KEY, JSON.stringify(plan));

// PP-1: the learner's interview date, kept on this device only.
export const INTERVIEW_KEY = "xplaind.interview-date.v1";
export const rawInterviewDate = (): string | null => read(INTERVIEW_KEY);
export const parseInterviewDate = (raw: string | null): string | null => (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null);
export const saveInterviewDate = (date: string | null): void => write(INTERVIEW_KEY, date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null);
