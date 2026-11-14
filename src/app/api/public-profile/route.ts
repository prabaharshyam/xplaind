// PF-1: the learner's public profile settings. Off by default; the learner picks a handle, the name
// shown and a one-line headline, and turns it on or off.
import { z } from "zod";
import { json, problem, readJson, requireSession } from "@/lib/account/http";
import { normaliseHandle } from "@/lib/certificates";

const Body = z.strictObject({
  handle: z.string().max(40),
  displayName: z.string().trim().min(2).max(60),
  headline: z.string().trim().max(120).default(""),
  enabled: z.boolean(),
});

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { data } = await session.admin.from("public_profiles").select("handle, display_name, headline, enabled").eq("user_id", session.user.id).maybeSingle();
  return json({ profile: data ? { handle: data.handle, displayName: data.display_name, headline: data.headline, enabled: data.enabled } : null });
}

export async function PUT(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const parsed = Body.safeParse(await readJson(request, 2_000).catch(() => null));
  if (!parsed.success) return problem(400, "Check your name and headline.");
  const handle = normaliseHandle(parsed.data.handle);
  if (!handle) return problem(400, "Your link name can use 3 to 30 lower-case letters, numbers and hyphens.");
  const { error } = await session.admin
    .from("public_profiles")
    .upsert({ user_id: session.user.id, handle, display_name: parsed.data.displayName, headline: parsed.data.headline, enabled: parsed.data.enabled, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error?.code === "23505") return problem(409, "That link name is taken. Try another.");
  if (error) return problem(500, "Could not save your profile. Please try again.");
  return json({ ok: true, url: `/u/${handle}` });
}
