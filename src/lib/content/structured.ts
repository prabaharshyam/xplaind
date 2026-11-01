// SE-5: schema.org structured data, so search engines and AI answer engines understand
// what a page teaches, at what level, who reviewed it and how it fits a roadmap. Node only.
import { getGlossary, getLevel, getPath } from "./index";
import { isHumanName } from "./review";
import type { Goal, Stop } from "./schema";
import { siteUrl } from "@/lib/site";

const ORG = { "@type": "Organization", "@id": `${siteUrl()}/#org`, name: "Xplaind", url: siteUrl() };

export function lessonGraph(stop: Stop, paths: Goal[]): Record<string, unknown> {
  const url = `${siteUrl()}/stop/${stop.id}`;
  const terms = new Map(getGlossary().map((g) => [g.id, g.term]));
  const level = getLevel(stop.level);
  const reviewer = isHumanName(stop.reviewed_by) ? { "@type": "Person", name: stop.reviewed_by } : undefined;
  const home = paths[0];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LearningResource",
        "@id": `${url}#lesson`,
        name: stop.title,
        headline: stop.title,
        description: stop.answer,
        abstract: stop.outcome,
        url,
        learningResourceType: "lesson",
        educationalLevel: level ? `${stop.level} ${level.name}` : stop.level,
        teaches: stop.key_terms.map((t) => terms.get(t) ?? t),
        timeRequired: `PT${stop.hours}H`,
        inLanguage: "en-IN",
        dateModified: stop.reviewed_on,
        publisher: ORG,
        ...(reviewer ? { reviewedBy: reviewer, lastReviewed: stop.reviewed_on } : {}),
        isPartOf: paths.map((p) => ({ "@type": "Course", name: `${p.name} roadmap`, url: `${siteUrl()}/roadmap/${p.id}` })),
      },
      ...(stop.flashcards.length
        ? [
            {
              "@type": "FAQPage",
              "@id": `${url}#faq`,
              mainEntity: stop.flashcards.map((c) => ({ "@type": "Question", name: c.q, acceptedAnswer: { "@type": "Answer", text: c.a } })),
            },
          ]
        : []),
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Roadmaps", item: `${siteUrl()}/paths` },
          ...(home ? [{ "@type": "ListItem", position: 2, name: home.name, item: `${siteUrl()}/roadmap/${home.id}` }] : []),
          { "@type": "ListItem", position: home ? 3 : 2, name: stop.title, item: url },
        ],
      },
    ],
  };
}

export function roadmapGraph(pathId: string, lessons: { id: string; title: string }[]): Record<string, unknown> {
  const p = getPath(pathId)!;
  const url = `${siteUrl()}/roadmap/${p.id}`;
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${url}#course`,
    name: `${p.name} roadmap`,
    description: `${p.tagline} ${p.description}`.slice(0, 500),
    url,
    provider: ORG,
    inLanguage: "en-IN",
    educationalLevel: "Beginner to professional",
    timeRequired: `P${p.months}M`,
    audience: { "@type": "EducationalAudience", educationalRole: "student", audienceType: p.who_for },
    hasPart: lessons.map((l, i) => ({ "@type": "LearningResource", position: i + 1, name: l.title, url: `${siteUrl()}/stop/${l.id}` })),
  };
}
