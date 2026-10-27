// RD-2: stores the details a learner gives before downloading a roadmap checklist.
// Server-only table; the service role writes it. Under-18s never call this (PV-2).
import { ipKey, json, problem, rateLimit, readJson } from "@/lib/account/http";
import { getPath } from "@/lib/content";
import { CONSENT_TEXT, DownloadDetails } from "@/lib/download/details";
import { adminClient, currentUser, userClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    return await save(request);
  } catch (e) {
    // A wrong Supabase setting can throw inside the client; answer in JSON so the form says so.
    console.error("roadmap-download", e);
    return problem(500, "We could not save your details just now. Please try again later.");
  }
}

async function save(request: Request): Promise<Response> {
  const parsed = DownloadDetails.safeParse(await readJson(request, 4_000).catch(() => null));
  if (!parsed.success) return problem(400, parsed.error.issues[0]?.message ?? "Please check your details.");
  const d = parsed.data;
  if (!getPath(d.pathId)) return problem(400, "Unknown roadmap.");

  const admin = adminClient();
  if (!admin) return problem(503, "Saving details is not switched on yet.");
  const limited = await rateLimit(admin, `download:${ipKey(request)}`, 3600, 20);
  if (limited) return limited;

  const client = await userClient();
  const user = client ? await currentUser(client) : null;
  const { error } = await admin.from("roadmap_downloads").insert({
    path_id: d.pathId,
    name: d.name,
    email: d.email.toLowerCase(),
    phone: d.phone,
    experience: d.experience,
    consent_text: CONSENT_TEXT,
    user_id: user?.id ?? null,
  });
  if (error) {
    console.error("roadmap-download insert", error.message);
    return problem(500, "Could not save your details. Please try again.");
  }
  return json({ ok: true }, 201);
}
