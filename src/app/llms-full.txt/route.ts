// /llms-full.txt: every lesson's plain answer, why it matters and its flashcards, so AI
// answer engines can quote Xplaind accurately and link to the lesson (SE-7). Prerendered.
import { getPaths, getStops } from "@/lib/content";
import { siteUrl } from "@/lib/site";
import { themeOf } from "@/lib/themes";

export function GET(): Response {
  const base = siteUrl();
  const roleOf = new Map<string, string[]>();
  for (const p of getPaths()) for (const st of p.stages) for (const id of st.lessons) roleOf.set(id, [...(roleOf.get(id) ?? []), p.name]);
  const blocks = getStops().map((s) =>
    [
      `## ${s.title}`,
      `URL: ${base}/stop/${s.id}`,
      `Topic: ${themeOf(s.theme).label}. Level: ${s.level}. Time: about ${s.hours} ${s.hours === 1 ? "hour" : "hours"}.${roleOf.get(s.id) ? ` Roadmaps: ${roleOf.get(s.id)!.join(", ")}.` : ""}`,
      "",
      `Answer: ${s.answer}`,
      "",
      `Why it matters: ${s.why_it_matters}`,
      ...(s.flashcards.length ? ["", "Questions and answers:", ...s.flashcards.map((c) => `- Q: ${c.q}\n  A: ${c.a}`)] : []),
    ].join("\n"),
  );
  const text = ["# Xplaind lessons", "", `> Plain-English AI lessons from ${base}, reviewed by people, with a quick answer and flashcards for each.`, "", ...blocks].join("\n\n");
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
