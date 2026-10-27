// /llms.txt: a plain map of the site for AI answer engines (llmstxt.org format).
// Prerendered at build time: it reads only content files.
import { getBlogPosts, getPaths } from "@/lib/content";
import { getInterviewViews } from "@/lib/content/interview";
import { siteUrl } from "@/lib/site";

export function GET(): Response {
  const base = siteUrl();
  const paths = getPaths();
  const questions = getInterviewViews();
  const lines = [
    "# Xplaind",
    "",
    "> AI learning paths for India. Pick a role, take a short level test, and follow original lessons, the best course for each topic, checks, projects and interview practice. No ads, no paid placement.",
    "",
    "## Start here",
    `- [Choose a path](${base}/paths): nine AI roles, who each suits and how long it takes`,
    `- [How to learn AI](${base}/blog/how-to-learn-ai): a step-by-step plan from zero`,
    `- [Find my level](${base}/start): a 10-minute placement test that finds your level`,
    "",
    "## Learning paths",
    ...paths.map((p) => `- [${p.name}](${base}/roadmap/${p.id}): ${p.tagline}`),
    "",
    "## Interview preparation",
    `- [All interview questions](${base}/interview): ${questions.length} questions with short and deeper answers`,
    ...paths.map((p) => `- [${p.name} interview questions](${base}/interview/for/${p.id})`),
    `- [Mock interview](${base}/interview/simulator): answer out loud against a timer and get a report`,
    "",
    "## Courses and certifications",
    `- [AI courses](${base}/resources): every course we recommend, filterable by path, level and certificate`,
    `- [AI certifications](${base}/certifications): exams from AWS, Microsoft, Google Cloud, NVIDIA and Databricks, with fees and free prep`,
    `- [Glossary](${base}/glossary): AI terms in plain words`,
    "",
    "## Blog",
    ...getBlogPosts().map((b) => `- [${b.title}](${base}/blog/${b.id}): ${b.description}`),
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
