// AC-7: create or delete a shareable level card. The server fills in the level
// and weeks active, so a card always matches the learner's record. The id is a
// random UUID, which is the unguessable share link.
import { z } from "zod";
import { weeklyStreak } from "@/lib/account/streak";
import { json, problem, rateLimit, readJson, requireSession } from "@/lib/account/http";
import { loadState } from "@/lib/account/repo";
import { todayInIST } from "@/lib/dates";

const Create = z.strictObject({ displayName: z.string().trim().max(40).regex(/^[\p{L}\p{M} .'-]*$/u).optional() });
const Delete = z.strictObject({ id: z.uuid() });

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { user, client, admin } = session;
  const limited = await rateLimit(admin, `card:${user.id}`, 3600, 10);
  if (limited) return limited;
  const parsed = Create.safeParse(await readJson(request).catch(() => null));
  if (!parsed.success) return problem(400, "Use letters and spaces only, up to 40 characters.");

  const state = await loadState(client, user.id);
  const level = state.profile?.start_level ?? state.latestAttempt?.start_level;
  if (!level) return problem(409, "Take the test first, so the card can show your level.");
  const { data, error } = await admin
    .from("level_cards")
    .insert({
      user_id: user.id,
      level,
      goal_id: state.profile?.goal_id ?? "genai-engineer",
      weeks_active: weeklyStreak(state.activityDays, todayInIST()).weeksActive,
      display_name: parsed.data.displayName || null,
    })
    .select("id")
    .single();
  if (error) return problem(500, "Could not create the card.");
  return json({ id: data.id }, 201);
}

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { data, error } = await session.client
    .from("level_cards")
    .select("id,level,weeks_active,display_name,created_at")
    .order("created_at", { ascending: false });
  if (error) return problem(500, "Could not load cards.");
  return json({ cards: data });
}

export async function DELETE(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const parsed = Delete.safeParse(await readJson(request).catch(() => null));
  if (!parsed.success) return problem(400, "Unknown card.");
  // The learner's own client: row-level security only lets them delete their own card.
  const { error } = await session.client.from("level_cards").delete().eq("id", parsed.data.id);
  if (error) return problem(500, "Could not delete the card.");
  return json({ ok: true });
}
