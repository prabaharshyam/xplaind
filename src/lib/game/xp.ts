// Gamification, computed from what the learner already did: lessons, checks,
// practice ratings and mock interviews. Pure: no storage, no DOM. Nothing here is
// sent anywhere; the browser stores the inputs.
import type { ProgressMap } from "@/lib/roadmap/types";
import type { Ratings } from "@/lib/practice/queue";

export type InterviewSession = { on: string; answered: number; total: number; averageScore: number };

export const XP = {
  lessonCheck: 50,
  lessonProject: 80,
  lessonSkipped: 10,
  lessonSelfMarked: 20,
  perfectCheck: 20,
  practiceRating: 5,
  interviewAnswer: 10,
  /** Per point of an answer's 0 to 5 score. */
  interviewScorePoint: 2,
} as const;

export const RANKS = [
  { min: 0, name: "Curious" },
  { min: 100, name: "Explorer" },
  { min: 300, name: "Builder" },
  { min: 700, name: "Practitioner" },
  { min: 1500, name: "Engineer" },
  { min: 3000, name: "Expert" },
  { min: 6000, name: "Master" },
] as const;

export type GameInputs = { stops: ProgressMap; ratings: Ratings; interviews: readonly InterviewSession[] };

export function xpOf({ stops, ratings, interviews }: GameInputs): number {
  let xp = 0;
  for (const s of Object.values(stops)) {
    if (s.status !== "done") continue;
    if (s.how === "project") xp += XP.lessonProject;
    else if (s.how === "self_skipped") xp += XP.lessonSkipped;
    else if (s.how === "self_marked") xp += XP.lessonSelfMarked;
    else xp += XP.lessonCheck;
    if (s.how === "check" && s.score === 100) xp += XP.perfectCheck;
  }
  xp += Object.keys(ratings).length * XP.practiceRating;
  for (const i of interviews) xp += i.answered * XP.interviewAnswer + Math.round(i.averageScore * i.total * XP.interviewScorePoint);
  return xp;
}

export function rankOf(xp: number): { name: string; min: number; next: { name: string; min: number } | null; progress: number } {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1].min) i++;
  const next = RANKS[i + 1] ?? null;
  const progress = next ? (xp - RANKS[i].min) / (next.min - RANKS[i].min) : 1;
  return { name: RANKS[i].name, min: RANKS[i].min, next, progress };
}

/** Every day (YYYY-MM-DD) the learner earned something. */
export function activeDays({ stops, ratings, interviews }: GameInputs): Set<string> {
  return new Set([
    ...Object.values(stops).map((s) => s.updatedOn),
    ...Object.values(ratings).map((r) => r.updatedOn),
    ...interviews.map((i) => i.on),
  ]);
}

const previousDay = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

/** Days in a row with activity, ending today, or yesterday if today has none yet. */
export function streakOf(days: ReadonlySet<string>, today: string): number {
  let day = days.has(today) ? today : previousDay(today);
  let n = 0;
  while (days.has(day)) {
    n++;
    day = previousDay(day);
  }
  return n;
}

export type Badge = { id: string; name: string; description: string; earned: boolean };

export function badgesOf(inputs: GameInputs, today: string): Badge[] {
  const done = Object.values(inputs.stops).filter((s) => s.status === "done");
  const xp = xpOf(inputs);
  const streak = streakOf(activeDays(inputs), today);
  const rated = Object.keys(inputs.ratings).length;
  return [
    { id: "first-step", name: "First step", description: "Finish your first lesson", earned: done.length >= 1 },
    { id: "on-a-roll", name: "On a roll", description: "Finish five lessons", earned: done.length >= 5 },
    { id: "perfect", name: "Perfect check", description: "Score 100% on a lesson check", earned: done.some((s) => s.how === "check" && s.score === 100) },
    { id: "builder", name: "Builder", description: "Submit a project", earned: done.some((s) => s.how === "project") },
    { id: "spoke-up", name: "Spoke up", description: "Finish a mock interview", earned: inputs.interviews.length >= 1 },
    { id: "interview-ready", name: "Interview ready", description: "Rate 20 interview questions in practice", earned: rated >= 20 },
    { id: "three-days", name: "Three in a row", description: "Learn three days in a row", earned: streak >= 3 },
    { id: "week-streak", name: "Week streak", description: "Learn seven days in a row", earned: streak >= 7 },
    { id: "xp-500", name: "500 XP", description: "Earn 500 XP", earned: xp >= 500 },
  ];
}
