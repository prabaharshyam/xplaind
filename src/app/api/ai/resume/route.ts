// RV-1 to RV-3: reviews a resume for shortlisting. CO-1 caps apply; no account needed (SU-5).
// The resume is sent to the model for this one review and is not stored by Xplaind.
import { json } from "@/lib/account/http";
import { cleanResumeReview, ResumeRequest, resumePrompt } from "@/lib/ai/features";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";

export const maxDuration = 120;

export async function POST(request: Request) {
  const req = await body(request, ResumeRequest, 40_000);
  if (req instanceof Response) return req;
  const out = await runAi({ kind: "resume", ...resumePrompt(req), maxTokens: 6_000, effort: "medium" });
  if (out instanceof Response) return out;
  return json({ review: cleanResumeReview(out.data) });
}
