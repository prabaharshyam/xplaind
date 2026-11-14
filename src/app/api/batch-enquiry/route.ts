// CB-1: stores an enquiry about Pro for a batch of learners. Server-only table; the service role writes it.
import { ipKey, json, problem, rateLimit, readJson } from "@/lib/account/http";
import { BatchEnquiry, ENQUIRY_CONSENT } from "@/lib/batch/enquiry";
import { adminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    return await save(request);
  } catch (e) {
    console.error("batch-enquiry", e);
    return problem(500, "We could not send your enquiry just now. Please email us instead.");
  }
}

async function save(request: Request): Promise<Response> {
  const parsed = BatchEnquiry.safeParse(await readJson(request, 6_000).catch(() => null));
  if (!parsed.success) return problem(400, parsed.error.issues[0]?.message ?? "Please check the details.");
  const e = parsed.data;

  const admin = adminClient();
  if (!admin) return problem(503, "The enquiry form is not switched on yet. Please email us instead.");
  const limited = await rateLimit(admin, `batch:${ipKey(request)}`, 3600, 5);
  if (limited) return limited;

  const { error } = await admin.from("batch_enquiries").insert({
    org_name: e.orgName,
    org_type: e.orgType,
    contact_name: e.contactName,
    email: e.email.toLowerCase(),
    phone: e.phone,
    learners: e.learners,
    message: e.message,
    consent_text: ENQUIRY_CONSENT,
  });
  if (error) {
    console.error("batch-enquiry insert", error.message);
    return problem(500, "We could not send your enquiry. Please email us instead.");
  }
  return json({ ok: true }, 201);
}
