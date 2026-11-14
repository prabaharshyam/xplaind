// RF-1: the signed-in learner's share link and how many friends' purchases have rewarded them.
import { randomBytes } from "node:crypto";
import { json, problem, requireSession } from "@/lib/account/http";
import { REF_PERCENT, REF_REWARD_DAYS, ownRefCode } from "@/lib/billing/referral";

export async function GET(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const code = await ownRefCode(session.admin, session.user.id, () => new Uint8Array(randomBytes(8)));
  if (!code) return problem(500, "Could not make your link. Please try again.");
  const { count } = await session.admin.from("referrals").select("referred_user", { count: "exact", head: true }).eq("referrer", session.user.id);
  const rewards = count ?? 0;
  return json({ link: `${new URL(request.url).origin}/r/${code}`, rewards, daysEarned: rewards * REF_REWARD_DAYS, percent: REF_PERCENT, rewardDays: REF_REWARD_DAYS });
}
