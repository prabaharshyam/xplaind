// IR-1: the signed-in learner's readiness for every role they have practised, for the dashboard.
import { json, requireSession } from "@/lib/account/http";
import { getPaths } from "@/lib/content";
import { readiness } from "@/lib/interview/readiness";

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { data } = await session.admin.from("interview_readiness").select("path_id, score").eq("user_id", session.user.id).order("taken_at", { ascending: false }).limit(200);
  const byPath = new Map<string, number[]>();
  for (const r of data ?? []) byPath.set(r.path_id, [...(byPath.get(r.path_id) ?? []), r.score]);
  const names = new Map(getPaths().map((p) => [p.id, p.name]));
  const roles = [...byPath].flatMap(([id, scores]) => {
    const r = readiness(scores);
    return r ? [{ pathId: id, name: names.get(id) ?? "Any AI role", ...r }] : [];
  });
  return json({ roles });
}
