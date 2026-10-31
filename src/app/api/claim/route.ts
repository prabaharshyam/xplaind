// AC-2: attach the device's test result, progress and practice ratings to the
// account, and send back the merged state so every device ends up the same.
// The server re-scores the test from the raw choices (PRD: Architecture).
import { answersToRow, rowToAnswers, type AttemptAnswerRow } from "@/lib/account/attempts";
import { ClaimBody, InvalidClaimError, activityDays, mergeProgress, mergeRatings, rescoreAttempt } from "@/lib/account/claim";
import { json, problem, rateLimit, readJson, requireSession } from "@/lib/account/http";
import { QUIZ_VERSION, loadState, recordActivity, refreshBadges, saveProgress, saveRatings } from "@/lib/account/repo";
import { getContent, getStop } from "@/lib/content";

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { user, client, admin } = session;
  const limited = await rateLimit(admin, `claim:${user.id}`, 600, 30);
  if (limited) return limited;

  let body: ClaimBody;
  try {
    const parsed = ClaimBody.safeParse(await readJson(request));
    if (!parsed.success) return problem(400, "The saved data on this device could not be read.");
    body = parsed.data;
  } catch {
    return problem(400, "The saved data on this device could not be read.");
  }

  const bank = getContent().placement.map((q) => q.data);

  if (body.attempt) {
    let scored;
    try {
      scored = rescoreAttempt(bank, body.attempt);
    } catch (e) {
      if (e instanceof InvalidClaimError) return problem(422, "The saved test result is not valid.");
      throw e;
    }
    const finishedAt = `${body.attempt.completedOn}T12:00:00+05:30`;
    const row = answersToRow(scored.answers);
    const { data: same } = await admin
      .from("quiz_attempts")
      .select("id")
      .eq("user_id", user.id)
      .eq("finished_at", finishedAt)
      .contains("answers", row)
      .limit(1);
    if (!same?.length) {
      const { error } = await admin.from("quiz_attempts").insert({
        user_id: user.id,
        goal_id: body.attempt.goal,
        quiz_version: QUIZ_VERSION,
        answers: row,
        passed_level: scored.result.passedLevel,
        start_level: scored.result.startLevel,
        gap_tags: scored.result.gaps,
        finished_at: finishedAt,
      });
      if (error) return problem(500, "Could not save the test result.");
    }
    await admin.from("profiles").update({ weekly_hours: body.attempt.weeklyHours }).eq("id", user.id).is("weekly_hours", null);
  }

  const before = await loadState(client, user.id);
  const progress = mergeProgress(body.progress, before.progress);
  const ratings = mergeRatings(body.ratings, before.ratings);
  await saveProgress(client, user.id, progress);
  await saveRatings(client, user.id, ratings);
  await recordActivity(admin, user.id, activityDays(progress, ratings));

  // The start level follows the latest attempt (PL-8 keeps every attempt).
  const { data: latest } = await admin
    .from("quiz_attempts")
    .select("start_level, answers, finished_at")
    .eq("user_id", user.id)
    .order("finished_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest) await admin.from("profiles").update({ start_level: latest.start_level }).eq("id", user.id);

  const after = await loadState(client, user.id);
  // AC-6: read apart from loadState, so a database without the column still claims.
  const { data: last } = await client.from("profiles").select("last_stop_id,last_stop_at").eq("id", user.id).maybeSingle();
  const lastStop = last?.last_stop_id && last.last_stop_at && getStop(last.last_stop_id as string) ? { stopId: last.last_stop_id as string, at: last.last_stop_at as string } : null;
  const earned = await refreshBadges(admin, user.id, after);

  return json({
    progress: after.progress,
    ratings: after.ratings,
    activityDays: after.activityDays,
    badges: [...new Set([...after.badges, ...earned])],
    weeklyHours: after.profile?.weekly_hours ?? null,
    lastStop,
    attempt: latest
      ? {
          version: 1,
          goal: "genai-engineer",
          weeklyHours: after.profile?.weekly_hours ?? 5,
          completedOn: (latest.finished_at as string).slice(0, 10),
          answers: rowToAnswers(latest.answers as AttemptAnswerRow[], bank),
        }
      : null,
  });
}
