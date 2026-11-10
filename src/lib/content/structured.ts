// SE-5: schema.org structured data, so search engines and AI answer engines understand
// what a page teaches, at what level, who reviewed it and how it fits a roadmap. Node only.
import { getGlossary, getLevel, getPath } from "./index";
import { isHumanName } from "./review";
import type { Goal, Stop } from "./schema";
import { siteUrl } from "@/lib/site";

const ORG = { "@type": "Organization", "@id": `${siteUrl()}/#org`, name: "Xplaind", url: siteUrl() };

/**
 * SE-8: who "Xplaind" is, for Google's site name and knowledge panel and for AI answers. Search
 * engines mixed the brand up with xplaind.com, an unrelated site, so the graph names the site,
 * its other spellings, its logo, founder and audience, and says what it teaches.
 */
export function siteGraph(): Record<string, unknown> {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: `${base}/`,
        name: "Xplaind",
        alternateName: ["Xplaind.in", "Xplaind AI"],
        description: "A free AI learning platform for India: AI career roadmaps, plain-English lessons, projects and interview practice.",
        inLanguage: "en-IN",
        publisher: { "@id": `${base}/#org` },
      },
      {
        "@type": ["Organization", "EducationalOrganization"],
        "@id": `${base}/#org`,
        name: "Xplaind",
        alternateName: "Xplaind.in",
        url: `${base}/`,
        logo: { "@type": "ImageObject", url: `${base}/brand/xplaind-icon-512.png`, width: 512, height: 512 },
        image: `${base}/brand/xplaind-logo.png`,
        description:
          "Xplaind is a free AI learning platform for India. It gives learners a step-by-step roadmap for each AI job, a plain-English lesson for every topic, the best free course for it, guided projects and AI interview practice.",
        founder: { "@type": "Person", name: "Shyam Prabahar", sameAs: ["https://www.linkedin.com/in/shyam-prabahar/"] },
        areaServed: { "@type": "Country", name: "India" },
        knowsAbout: [
          "Artificial intelligence",
          "Generative AI",
          "Large language models",
          "Retrieval-augmented generation",
          "AI agents",
          "Machine learning",
          "MLOps",
          "Prompt engineering",
          "AI careers in India",
        ],
      },
    ],
  };
}

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
    audience: { "@type": "EducationalAudience", educationalRole: "student", audienceType: p.who_for },
    hasPart: lessons.map((l, i) => ({ "@type": "LearningResource", position: i + 1, name: l.title, url: `${siteUrl()}/stop/${l.id}` })),
  };
}
