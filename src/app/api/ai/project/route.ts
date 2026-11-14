// PR-1: reviews a guided project against its rubric, from the learner's write-up and, for a public
// GitHub link, its README. Uses the answer-review allowance ("grade"). Keeps only the score and pass.
import { json, problem } from "@/lib/account/http";
import { cleanProjectReview, ProjectReviewRequest, projectReviewPrompt } from "@/lib/ai/features";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";
import { getProject } from "@/lib/content";
import { readme } from "@/lib/projects/readme";
import { currentUser, serviceClient, userClient } from "@/lib/supabase/server";

export const maxDuration = 120;

export async function POST(request: Request) {
  const req = await body(request, ProjectReviewRequest, 12_000);
  if (req instanceof Response) return req;
  const project = getProject(req.projectId);
  if (!project) return problem(400, "Unknown project.");
  const repoUrl = req.repoUrl || "";
  const readmeText = repoUrl ? await readme(repoUrl) : "";
  const out = await runAi({ kind: "grade", ...projectReviewPrompt(project, req.writeup, readmeText, repoUrl), maxTokens: 4_000, effort: "medium" });
  if (out instanceof Response) return out;
  const review = cleanProjectReview(out.data, project.rubric);

  const client = await userClient();
  const user = client ? await currentUser(client) : null;
  const admin = serviceClient();
  if (user && admin) await admin.from("project_reviews").insert({ user_id: user.id, project_id: project.id, score: review.score, passed: review.passed, repo_url: repoUrl || null });
  return json({ review, readRepo: Boolean(readmeText) });
}
