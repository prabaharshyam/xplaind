// /llms.txt: a plain map of the site for AI answer engines (llmstxt.org format).
// Prerendered at build time: it reads only content files.
import { getBlogPosts, getPaths, getStops } from "@/lib/content";
import { THEMES } from "@/lib/themes";
import { getInterviewViews } from "@/lib/content/interview";
import { siteUrl } from "@/lib/site";

export function GET(): Response {
  const base = siteUrl();
  const paths = getPaths();
  const questions = getInterviewViews();
  const lines = [
    "# Xplaind",
    "",
    "> Step-by-step AI career roadmaps for AI roles, built to help India learn AI faster. Every topic has a plain-English lesson with a quick answer, video lessons, a check, projects and interview practice. No ads and no paid placement: courses are ranked on how well they teach.",
    "",
    `Full text of every lesson's answer and flashcards: ${base}/llms-full.txt`,
    "",
    "## Start here",
    `- [Choose a path](${base}/paths): every AI role, who each suits and how long it takes`,
    `- [How to learn AI](${base}/blog/how-to-learn-ai): a step-by-step plan from zero`,
    `- [Find my level](${base}/start): a 10-minute placement test that finds your level`,
    "",
    "## Learning paths",
    ...paths.map((p) => `- [${p.name}](${base}/roadmap/${p.id}): ${p.tagline}`),
    "",
    "## Lessons by topic",
    ...THEMES.flatMap((t) => {
      const lessons = getStops().filter((st) => st.theme === t.id);
      return lessons.length ? ["", `### ${t.label}`, ...lessons.map((st) => `- [${st.title}](${base}/stop/${st.id}): ${st.answer}`)] : [];
    }),
    "",
    "## Find and watch",
    `- [Library](${base}/library): every lesson, video lesson and skill, filterable by topic and level`,
    `- [Video lessons](${base}/videos): hand-picked YouTube lessons you can filter by topic, level and length, with view counts, playable on the site`,
    `- [Topic tracks](${base}/topics): one subject at a time, including data structures and algorithms and system design`,
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
