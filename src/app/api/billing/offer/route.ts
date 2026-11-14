// RF-1: whether this learner's first pass gets the friend discount, so the pay window can show it.
import { cookies } from "next/headers";
import { json, requireSession } from "@/lib/account/http";
import { REF_COOKIE, REF_PERCENT, referralFor } from "@/lib/billing/referral";

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return json({ percent: 0 });
  const ref = await referralFor(session.admin, (await cookies()).get(REF_COOKIE)?.value, session.user.id);
  return json({ percent: ref ? REF_PERCENT : 0 });
}
