// AC-11: export my data as JSON. Everything stored about the learner, nothing about anyone else.
import { problem, requireSession } from "@/lib/account/http";
import { todayInIST } from "@/lib/dates";

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { user, client, admin } = session;

  // PAY-2: passes and payments are readable by their owner, so they export under the learner's own session.
  const tables = ["profiles", "quiz_attempts", "stop_progress", "activity_days", "badges", "practice_ratings", "level_cards", "entitlements", "payments"] as const;
  const out: Record<string, unknown> = { exported_on: todayInIST(), email: user.email };
  for (const table of tables) {
    const { data, error } = await client.from(table).select("*");
    if (error) return problem(500, "Could not export.");
    out[table] = data;
  }
  const columns = "id,email,source,consent_text,consent_at,confirmed_at,unsubscribed_at";
  const byUser = await admin.from("email_subscriptions").select(columns).eq("user_id", user.id);
  const byEmail = user.email ? await admin.from("email_subscriptions").select(columns).eq("email", user.email) : { data: [] };
  const subs = new Map([...(byUser.data ?? []), ...(byEmail.data ?? [])].map((r) => [r.id, r]));
  out.email_subscriptions = [...subs.values()];
  const dl = "id,created_at,path_id,name,email,phone,experience,consent_text";
  const dlByUser = await admin.from("roadmap_downloads").select(dl).eq("user_id", user.id);
  const dlByEmail = user.email ? await admin.from("roadmap_downloads").select(dl).eq("email", user.email) : { data: [] };
  // CM-90: the weekly-email commitment, read with the service role (the learner's role cannot see its email or token).
  const cm = await admin.from("commitments").select("path_id,email,started_on,consent_text,consent_at,last_sent_week,last_sent_at,unsubscribed_at").eq("user_id", user.id);
  out.commitments = cm.data ?? [];
  out.roadmap_downloads = [...new Map([...(dlByUser.data ?? []), ...(dlByEmail.data ?? [])].map((r) => [r.id, r])).values()];

  return new Response(JSON.stringify(out, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="xplaind-data-${todayInIST()}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
