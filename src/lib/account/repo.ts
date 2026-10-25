// Reads and writes of learner data. Node only. The learner's client (row-level
// security) writes progress and ratings; the admin client writes only what the
// PRD reserves for the server: profiles, attempts, activity days, badges.
import type { SupabaseClient } from "@supabase/supabase-js";
import { getContent, getStops } from "@/lib/content";
import { todayInIST } from "@/lib/dates";
import { isLevelId, type LevelId } from "@/lib/levels";
import type { RatingRecord } from "@/lib/practice/queue";
import { isRating } from "@/lib/practice/queue";
import type { StopProgress } from "@/lib/roadmap/types";
import { earnedLevelBadges } from "./badges";

export const QUIZ_VERSION = "v1";

type ProgressRow = {
  stop_id: string;
  status: "in_progress" | "done";
  done_how: "check" | "project" | "self_skipped" | null;
  check_score: number | null;
  project_url: string | null;
  updated_at: string;
};

/** A calendar date in India stored as midday India time, so it reads back as the same date. */
const dayToTimestamp = (day: string) => `${day}T12:00:00+05:30`;
const timestampToDay = (ts: string) => todayInIST(new Date(ts));

export const rowToProgress = (r: ProgressRow): StopProgress => ({
  status: r.status,
  ...(r.done_how ? { how: r.done_how } : {}),
  ...(r.check_score !== null ? { score: r.check_score } : {}),
  ...(r.project_url ? { projectUrl: r.project_url } : {}),
  updatedOn: timestampToDay(r.updated_at),
});

export const progressToRow = (userId: string, stopId: string, p: StopProgress) => ({
  user_id: userId,
  stop_id: stopId,
  status: p.status,
  done_how: p.how ?? null,
  check_score: p.score ?? null,
  project_url: p.projectUrl ?? null,
  updated_at: dayToTimestamp(p.updatedOn),
});

export type ServerState = {
  progress: Record<string, StopProgress>;
  ratings: Record<string, RatingRecord>;
  profile: { weekly_hours: number | null; start_level: LevelId | null; goal_id: string } | null;
  latestAttempt: { start_level: LevelId; passed_level: LevelId | null; gap_tags: string[]; finished_at: string } | null;
  passedLevels: (LevelId | null)[];
  activityDays: string[];
  badges: string[];
};

const must = <T>(r: { data: T | null; error: { message: string } | null }): T => {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
};

export async function loadState(client: SupabaseClient, userId: string): Promise<ServerState> {
  const [progress, ratings, profile, attempts, days, badges] = await Promise.all([
    client.from("stop_progress").select("stop_id,status,done_how,check_score,project_url,updated_at").eq("user_id", userId),
    client.from("practice_ratings").select("question_id,rating,updated_at").eq("user_id", userId),
    client.from("profiles").select("weekly_hours,start_level,goal_id").eq("id", userId).maybeSingle(),
    client.from("quiz_attempts").select("start_level,passed_level,gap_tags,finished_at").eq("user_id", userId).order("finished_at", { ascending: false }),
    client.from("activity_days").select("day").eq("user_id", userId),
    client.from("badges").select("badge_id").eq("user_id", userId),
  ]);
  const attemptRows = must(attempts) as { start_level: string; passed_level: string | null; gap_tags: string[]; finished_at: string }[];
  const level = (v: string | null) => (isLevelId(v) ? v : null);
  const p = must(profile) as { weekly_hours: number | null; start_level: string | null; goal_id: string } | null;
  return {
    progress: Object.fromEntries((must(progress) as ProgressRow[]).map((r) => [r.stop_id, rowToProgress(r)])),
    ratings: Object.fromEntries(
      (must(ratings) as { question_id: string; rating: number; updated_at: string }[])
        .filter((r) => isRating(r.rating))
        .map((r) => [r.question_id, { rating: r.rating as RatingRecord["rating"], updatedOn: timestampToDay(r.updated_at) }]),
    ),
    profile: p ? { weekly_hours: p.weekly_hours, start_level: level(p.start_level), goal_id: p.goal_id } : null,
    latestAttempt: attemptRows[0]
      ? {
          start_level: level(attemptRows[0].start_level) ?? "B1",
          passed_level: level(attemptRows[0].passed_level),
          gap_tags: attemptRows[0].gap_tags,
          finished_at: attemptRows[0].finished_at,
        }
      : null,
    passedLevels: attemptRows.map((a) => level(a.passed_level)),
    activityDays: (must(days) as { day: string }[]).map((d) => d.day),
    badges: (must(badges) as { badge_id: string }[]).map((b) => b.badge_id),
  };
}

export async function saveProgress(client: SupabaseClient, userId: string, progress: Record<string, StopProgress>): Promise<void> {
  const known = new Set(getStops().map((s) => s.id));
  const rows = Object.entries(progress)
    .filter(([id]) => known.has(id))
    .map(([id, p]) => progressToRow(userId, id, p));
  if (rows.length) must(await client.from("stop_progress").upsert(rows));
}

export async function saveRatings(client: SupabaseClient, userId: string, ratings: Record<string, RatingRecord>): Promise<void> {
  const known = new Set(getContent().interview.map((q) => q.data.id));
  const rows = Object.entries(ratings)
    .filter(([id]) => known.has(id))
    .map(([id, r]) => ({ user_id: userId, question_id: id, rating: r.rating, updated_at: dayToTimestamp(r.updatedOn) }));
  if (rows.length) must(await client.from("practice_ratings").upsert(rows));
}

export async function recordActivity(admin: SupabaseClient, userId: string, days: string[]): Promise<void> {
  const today = todayInIST();
  const rows = [...new Set(days)].filter((d) => d <= today).map((day) => ({ user_id: userId, day }));
  if (rows.length) must(await admin.from("activity_days").upsert(rows, { ignoreDuplicates: true }));
}

/** AC-6: recompute level badges from attempts and progress; add any newly earned. Badges are never removed. */
export async function refreshBadges(admin: SupabaseClient, userId: string, state: Pick<ServerState, "passedLevels" | "progress">): Promise<string[]> {
  const earned = earnedLevelBadges({
    passedLevels: state.passedLevels,
    stops: getStops().map((s) => ({ id: s.id, level: s.level })),
    progress: Object.entries(state.progress).map(([stop_id, p]) => ({ stop_id, status: p.status, done_how: p.how ?? null })),
  });
  if (earned.length) must(await admin.from("badges").upsert(earned.map((badge_id) => ({ user_id: userId, badge_id })), { ignoreDuplicates: true }));
  return earned;
}

/** AC-1: the profile is created on first sign-in, carrying the 18+ timestamp given when the link was requested. */
export async function ensureProfile(admin: SupabaseClient, userId: string, adultConfirmedAt: string): Promise<void> {
  must(await admin.from("profiles").upsert({ id: userId, adult_confirmed_at: adultConfirmedAt }, { onConflict: "id", ignoreDuplicates: true }));
}
