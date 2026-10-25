// IQ-4: save a practice rating for a signed-in learner. A rating counts as activity (AC-5).
import { z } from "zod";
import { RatingInput } from "@/lib/account/claim";
import { json, problem, rateLimit, readJson, requireSession } from "@/lib/account/http";
import { recordActivity } from "@/lib/account/repo";
import { getContent } from "@/lib/content";
import { todayInIST } from "@/lib/dates";

const Body = z.strictObject({ questionId: z.string().max(80), record: RatingInput });

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { user, client, admin } = session;
  const limited = await rateLimit(admin, `practice:${user.id}`, 600, 200);
  if (limited) return limited;

  const parsed = Body.safeParse(await readJson(request).catch(() => null));
  if (!parsed.success || !getContent().interview.some((q) => q.data.id === parsed.data.questionId)) {
    return problem(400, "Unknown question.");
  }
  const { questionId, record } = parsed.data;
  const { error } = await client.from("practice_ratings").upsert({
    user_id: user.id,
    question_id: questionId,
    rating: record.rating,
    updated_at: `${record.updatedOn}T12:00:00+05:30`,
  });
  if (error) return problem(500, "Could not save.");
  await recordActivity(admin, user.id, [todayInIST()]);
  return json({ ok: true });
}
