// CT-1: certificates. GET: the learner's roles, how close each is, and certificates already issued.
// POST: claim one. The server checks the record and Pro itself; the browser decides nothing.
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { json, problem, readJson, requireSession } from "@/lib/account/http";
import { passIsActive } from "@/lib/billing/plans";
import { certificateId } from "@/lib/certificates";
import { getPath } from "@/lib/content";
import { learnerRecord } from "@/lib/learner/record";

const Body = z.strictObject({ pathId: z.string().max(60), name: z.string().trim().min(2).max(60) });

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const record = await learnerRecord(session.admin, session.user.id);
  const { data: pass } = await session.admin.from("entitlements").select("valid_until").eq("user_id", session.user.id).maybeSingle();
  return json({ ...record, pro: Boolean(pass && passIsActive(pass.valid_until, Date.now())) });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const parsed = Body.safeParse(await readJson(request, 1_000).catch(() => null));
  if (!parsed.success || !getPath(parsed.data.pathId)) return problem(400, "Choose a role and the name to print.");
  const { data: pass } = await session.admin.from("entitlements").select("valid_until").eq("user_id", session.user.id).maybeSingle();
  if (!pass || !passIsActive(pass.valid_until, Date.now())) return json({ error: "Certificates are part of Pro.", upgrade: "/pricing" }, 402);
  const record = await learnerRecord(session.admin, session.user.id);
  const role = record.roles.find((r) => r.pathId === parsed.data.pathId);
  if (role?.certificateId) return json({ id: role.certificateId });
  if (!role?.eligibility.ok) return problem(400, "This role's certificate needs every lesson done, most by passing the check, and a passed project review.");
  const id = certificateId(new Uint8Array(randomBytes(10)));
  const { error } = await session.admin.from("certificates").insert({ id, user_id: session.user.id, path_id: parsed.data.pathId, name_on_certificate: parsed.data.name });
  if (error) return problem(500, "Could not issue the certificate. Please try again.");
  return json({ id });
}
