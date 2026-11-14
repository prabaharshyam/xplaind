// PF-1, CT-1: a learner's record, read by the server (service role) for the public profile, the
// certificate check and Settings. Only aggregates and titles; never answers or write-ups.
import type { SupabaseClient } from "@supabase/supabase-js";
import { type DoneHow, eligibility, type Eligibility } from "@/lib/certificates";
import { getPaths, getProjects, stagesWithGuide } from "@/lib/content";
import { lessonsByPath } from "@/lib/content/paths";
import { readiness } from "@/lib/interview/readiness";

export type RoleRecord = { pathId: string; name: string; done: number; total: number; readiness: number | null; eligibility: Eligibility; certificateId: string | null };
export type LearnerRecord = { roles: RoleRecord[]; passedProjects: { id: string; title: string; score: number }[]; certificates: { id: string; pathId: string; issuedAt: string }[] };

export async function learnerRecord(admin: SupabaseClient, userId: string): Promise<LearnerRecord> {
  const [{ data: stops }, { data: reviews }, { data: scores }, { data: certs }] = await Promise.all([
    admin.from("stop_progress").select("stop_id, status, done_how").eq("user_id", userId),
    admin.from("project_reviews").select("project_id, score, passed").eq("user_id", userId).eq("passed", true),
    admin.from("interview_readiness").select("path_id, score").eq("user_id", userId).order("taken_at", { ascending: false }).limit(200),
    admin.from("certificates").select("id, path_id, issued_at").eq("user_id", userId),
  ]);
  const done = new Map<string, DoneHow>((stops ?? []).filter((s) => s.status === "done").map((s) => [s.stop_id, (s.done_how ?? null) as DoneHow]));
  const passed = new Map<string, number>();
  for (const r of reviews ?? []) passed.set(r.project_id, Math.max(passed.get(r.project_id) ?? 0, r.score));
  const byPathScores = new Map<string, number[]>();
  for (const s of scores ?? []) byPathScores.set(s.path_id, [...(byPathScores.get(s.path_id) ?? []), s.score]);
  const lessons = lessonsByPath();
  const projects = getProjects();
  const certByPath = new Map((certs ?? []).map((c) => [c.path_id, c.id]));

  const roles = getPaths().flatMap((p) => {
    const ids = (lessons[p.id] ?? []).map((l) => l.id);
    const pathProjects = projects.filter((pr) => stagesWithGuide(pr.id).some((s) => s.path.id === p.id)).map((pr) => pr.id);
    const e = eligibility(ids, done, new Set(passed.keys()), pathProjects);
    const r = readiness(byPathScores.get(p.id) ?? []);
    if (e.lessonsDone === 0 && !r && !certByPath.has(p.id)) return [];
    return [{ pathId: p.id, name: p.name, done: e.lessonsDone, total: e.lessonsTotal, readiness: r?.score ?? null, eligibility: e, certificateId: certByPath.get(p.id) ?? null }];
  });
  const titles = new Map(projects.map((p) => [p.id, p.title]));
  return {
    roles,
    passedProjects: [...passed].map(([id, score]) => ({ id, title: titles.get(id) ?? id, score })),
    certificates: (certs ?? []).map((c) => ({ id: c.id, pathId: c.path_id, issuedAt: c.issued_at })),
  };
}
