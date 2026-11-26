// PREP-3: keep a signed-in learner's interview prep plan in their account. "save" stores the device's
// plan (or removes it); "merge" (once per sign-in) settles the device's copy against the account's and
// returns the one to keep. Written with the learner's own client, so row-level security applies.
import { z } from "zod";
import { json, problem, rateLimit, readJson, requireSession } from "@/lib/account/http";
import { getPath } from "@/lib/content";
import { PrepSetupInput, pickPrep, type PrepSetup } from "@/lib/prep/plan";

const Body = z.strictObject({ prep: PrepSetupInput.nullable(), mode: z.enum(["save", "merge"]) });

type Row = { path_id: string; experience: string; interview_on: string; minutes: number; started_on: string };
const fromRow = (r: Row | null): PrepSetup | null => {
  const p = r && PrepSetupInput.safeParse({ pathId: r.path_id, experience: r.experience, interviewOn: r.interview_on, minutes: r.minutes, startedOn: r.started_on });
  return p && p.success ? p.data : null;
};

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { user, client, admin } = session;
  const limited = await rateLimit(admin, `prep:${user.id}`, 600, 60);
  if (limited) return limited;

  const parsed = Body.safeParse(await readJson(request).catch(() => null));
  if (!parsed.success || (parsed.data.prep && !getPath(parsed.data.prep.pathId))) return problem(400, "That plan could not be read.");
  const { prep: device, mode } = parsed.data;

  let keep = device;
  if (mode === "merge") {
    const { data, error } = await client.from("interview_preps").select("path_id,experience,interview_on,minutes,started_on").eq("user_id", user.id).maybeSingle();
    if (error) return problem(500, "Could not load your plan.");
    const server = fromRow(data as Row | null);
    keep = pickPrep(device, server);
    if (keep === server) return json({ prep: keep });
  }
  const { error } = keep
    ? await client.from("interview_preps").upsert({
        user_id: user.id,
        path_id: keep.pathId,
        experience: keep.experience,
        interview_on: keep.interviewOn,
        minutes: keep.minutes,
        started_on: keep.startedOn,
        updated_at: new Date().toISOString(),
      })
    : await client.from("interview_preps").delete().eq("user_id", user.id);
  if (error) return problem(500, "Could not save your plan.");
  return json({ prep: keep });
}
